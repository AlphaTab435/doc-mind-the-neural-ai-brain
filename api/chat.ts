import type { IncomingMessage, ServerResponse } from 'http';

type VercelRequest = IncomingMessage & {
    body: any;
    query: { [key: string]: string | string[] };
};

type VercelResponse = ServerResponse & {
    status: (code: number) => VercelResponse;
    json: (data: any) => void;
    send: (data: any) => void;
    setHeader: (name: string, value: string) => void;
    write: (data: string) => void;
    end: () => void;
};

// Model configuration with fallbacks (tries in order)
const MODELS = {
    primary: 'gemini-3-flash-preview',
    fallbacks: ['gemini-2.0-flash-lite', 'gemini-1.5-flash-latest']
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const { base64Data, mimeType, question, history, useSearch } = req.body;

        const historyContents = (history || []).map((msg: { role: string; content: string }) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const requestBody: any = {
            contents: [
                ...historyContents,
                {
                    role: 'user',
                    parts: [
                        { inlineData: { data: base64Data, mimeType } },
                        { text: `Doc context active. Answer: ${question}` }
                    ]
                }
            ],
            generationConfig: { temperature: 0.1 }
        };

        if (useSearch) {
            requestBody.tools = [{ googleSearch: {} }];
        }

        // Set up streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // All models to try (primary first, then fallbacks)
        const modelsToTry = [MODELS.primary, ...MODELS.fallbacks];
        let response: Response | null = null;

        for (let i = 0; i < modelsToTry.length; i++) {
            const model = modelsToTry[i];
            const isPrimary = i === 0;
            console.log(`[API Chat] ${isPrimary ? '🚀 PRIMARY' : '🔄 FALLBACK #' + i} → Trying: ${model}`);

            response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                }
            );

            if (response.status !== 429) {
                console.log(`[API Chat] ✅ SUCCESS → Model: ${model} (Status: ${response.status})`);
                break;
            }
            console.log(`[API Chat] ❌ Rate limited (429) → Model: ${model}`);

            if (i < modelsToTry.length - 1) {
                console.log(`[API Chat] ⏭️ Switching to next fallback...`);
            } else {
                console.log(`[API Chat] 💀 All models exhausted!`);
            }
        }

        if (!response || !response.ok) {
            res.write(`data: ${JSON.stringify({ error: 'All models failed. Please try again.' })}\n\n`);
            return res.end();
        }

        const reader = response.body?.getReader();
        if (!reader) {
            res.write(`data: ${JSON.stringify({ error: 'No stream available' })}\n\n`);
            return res.end();
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6);
                    if (jsonStr.trim() === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(jsonStr);
                        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            res.write(`data: ${JSON.stringify({ text })}\n\n`);
                        }
                    } catch {
                        // Skip malformed JSON
                    }
                }
            }
        }

        res.write('data: [DONE]\n\n');
        return res.end();
    } catch (error: any) {
        console.error('Chat error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Neural link interrupted.' })}\n\n`);
        return res.end();
    }
}
