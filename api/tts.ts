import type { IncomingMessage, ServerResponse } from 'http';

// Vercel serverless function types
type VercelRequest = IncomingMessage & {
    body: any;
    query: { [key: string]: string | string[] };
};

type VercelResponse = ServerResponse & {
    status: (code: number) => VercelResponse;
    json: (data: any) => void;
    send: (data: any) => void;
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
        const { text } = req.body;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Say naturally: ${text}` }] }],
                    generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: 'Kore' }
                            }
                        }
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }

        const data = await response.json();
        const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!audioData) {
            return res.status(500).json({ error: 'No audio data received' });
        }

        return res.status(200).json({ audio: audioData });
    } catch (error: any) {
        console.error('TTS error:', error);
        return res.status(500).json({ error: 'Speech generation failed.' });
    }
}
