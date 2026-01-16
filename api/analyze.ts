import type { IncomingMessage, ServerResponse } from 'http';

type VercelRequest = IncomingMessage & {
  body: any;
  query: { [key: string]: string | string[] };
};

type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  send: (data: any) => void;
};

// Model configuration with fallbacks (tries in order)
const MODELS = {
  primary: 'gemini-3-flash-preview',
  fallbacks: ['gemini-2.0-flash-lite', 'gemini-1.5-flash-latest']
};

async function tryGenerateContent(apiKey: string, model: string, base64Data: string, mimeType: string) {
  return await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: 'Quickly summarize this doc: type, main purpose, 3 bullet points. No fluff.' }
          ]
        }]
      })
    }
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { base64Data, mimeType } = req.body;

    // All models to try (primary first, then fallbacks)
    const modelsToTry = [MODELS.primary, ...MODELS.fallbacks];
    let response: Response | null = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      const isPrimary = i === 0;
      console.log(`[API Analyze] ${isPrimary ? '🚀 PRIMARY' : '🔄 FALLBACK #' + i} → Trying: ${model}`);

      response = await tryGenerateContent(apiKey, model, base64Data, mimeType);

      if (response.status !== 429) {
        console.log(`[API Analyze] ✅ SUCCESS → Model: ${model} (Status: ${response.status})`);
        break;
      }
      console.log(`[API Analyze] ❌ Rate limited (429) → Model: ${model}`);

      if (i < modelsToTry.length - 1) {
        console.log(`[API Analyze] ⏭️ Switching to next fallback...`);
      } else {
        console.log(`[API Analyze] 💀 All models exhausted!`);
      }
    }

    if (!response || !response.ok) {
      if (response?.status === 429) {
        return res.status(429).json({ error: 'All models rate limited. Please wait and try again.' });
      }
      throw new Error(await response?.text() || 'Request failed');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('Analyze error:', error);
    return res.status(500).json({ error: 'Analysis failed.' });
  }
}
