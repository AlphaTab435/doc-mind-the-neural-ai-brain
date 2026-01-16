/// <reference types="vite/client" />

// Model configuration with fallbacks (tries in order)
const MODELS = {
  primary: 'gemini-3-flash-preview',
  fallbacks: ['gemini-2.0-flash-lite', 'gemini-1.5-flash-latest']
};

// Check if we're in production (Vercel) or development
const isProduction = import.meta.env.PROD;

/**
 * Get API key for development mode only
 */
const getApiKey = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Set VITE_API_KEY in .env for local development.");
  }
  return apiKey;
};

/**
 * Generates audio speech from text using Gemini TTS.
 */
export const generateSpeech = async (text: string): Promise<string> => {
  if (isProduction) {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('TTS request failed');
    }

    const data = await response.json();
    return data.audio;
  } else {
    const { GoogleGenAI, Modality } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say naturally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received");
    return base64Audio;
  }
};

/**
 * Analyzes a document with automatic fallback on rate limit.
 */
export const analyzeDocument = async (base64Data: string, mimeType: string): Promise<string> => {
  if (isProduction) {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, mimeType })
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("Rate limit reached. Please wait and try again.");
      throw new Error("Analysis failed.");
    }

    const data = await response.json();
    return data.text;
  } else {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const prompt = `Quickly summarize this doc: type, main purpose, 3 bullet points. No fluff.`;

    // All models to try (primary first, then fallbacks)
    const modelsToTry = [MODELS.primary, ...MODELS.fallbacks];

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      const isPrimary = i === 0;
      try {
        console.log(`[Gemini] ${isPrimary ? '🚀 PRIMARY' : '🔄 FALLBACK #' + i} → Trying: ${model}`);
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: prompt }
            ]
          }
        });
        console.log(`[Gemini] ✅ SUCCESS → Model: ${model}`);
        return response.text || "";
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        const isRateLimited = errorMsg.includes('429') || errorMsg.includes('quota');
        const hasMoreFallbacks = i < modelsToTry.length - 1;

        console.log(`[Gemini] ❌ FAILED → Model: ${model}`);
        console.log(`[Gemini]    └─ Error: ${errorMsg.substring(0, 100)}${errorMsg.length > 100 ? '...' : ''}`);
        console.log(`[Gemini]    └─ Rate Limited: ${isRateLimited} | Has Fallbacks: ${hasMoreFallbacks}`);

        if (isRateLimited && hasMoreFallbacks) {
          console.log(`[Gemini] ⏭️ Switching to next fallback...`);
          continue;
        }
        throw error;
      }
    }
    console.log(`[Gemini] 💀 ALL MODELS EXHAUSTED!`);
    throw new Error("All models exhausted.");
  }
};

/**
 * Streams answers with automatic fallback on rate limit.
 */
export async function* askQuestionStream(
  base64Data: string,
  mimeType: string,
  question: string,
  history: { role: string; content: string }[],
  useSearch: boolean = false
): AsyncGenerator<string, void, unknown> {
  if (isProduction) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, mimeType, question, history, useSearch })
    });

    if (!response.ok) {
      throw new Error("Neural link interrupted.");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No stream available");

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
            if (parsed.text) yield parsed.text;
            if (parsed.error) throw new Error(parsed.error);
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } else {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const historyContents = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const config: any = { temperature: 0.1 };
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const contents = [
      ...historyContents,
      {
        role: 'user',
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: `Doc context active. Answer: ${question}` }
        ]
      }
    ];

    // All models to try (primary first, then fallbacks)
    const modelsToTry = [MODELS.primary, ...MODELS.fallbacks];

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      const isPrimary = i === 0;
      try {
        console.log(`[Gemini Stream] ${isPrimary ? '🚀 PRIMARY' : '🔄 FALLBACK #' + i} → Trying: ${model}`);
        const responseStream = await ai.models.generateContentStream({
          model,
          contents,
          config
        });

        console.log(`[Gemini Stream] ✅ SUCCESS → Model: ${model}`);
        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) yield text;
        }
        return; // Success, exit
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        const isRateLimited = errorMsg.includes('429') || errorMsg.includes('quota');
        const hasMoreFallbacks = i < modelsToTry.length - 1;

        console.log(`[Gemini Stream] ❌ FAILED → Model: ${model}`);
        console.log(`[Gemini Stream]    └─ Error: ${errorMsg.substring(0, 100)}${errorMsg.length > 100 ? '...' : ''}`);
        console.log(`[Gemini Stream]    └─ Rate Limited: ${isRateLimited} | Has Fallbacks: ${hasMoreFallbacks}`);

        if (isRateLimited && hasMoreFallbacks) {
          console.log(`[Gemini Stream] ⏭️ Switching to next fallback...`);
          continue;
        }
        throw error;
      }
    }
  }
}

/**
 * Non-streaming question answer.
 */
export const askQuestion = async (
  base64Data: string,
  mimeType: string,
  question: string,
  history: { role: string; content: string }[],
  useSearch: boolean = false
): Promise<string> => {
  let fullResponse = '';
  for await (const chunk of askQuestionStream(base64Data, mimeType, question, history, useSearch)) {
    fullResponse += chunk;
  }
  return fullResponse;
};
