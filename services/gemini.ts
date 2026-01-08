
/// <reference types="vite/client" />
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const getAIClient = () => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

/**
 * Generates audio speech from text using Gemini TTS.
 */
export const generateSpeech = async (text: string) => {
  const ai = getAIClient();
  try {
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
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export const analyzeDocument = async (base64Data: string, mimeType: string) => {
  const ai = getAIClient();
  const prompt = `Quickly summarize this doc: type, main purpose, 3 bullet points. No fluff.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]
      }
    });
    return response.text || "";
  } catch (error: any) {
    if (error.message?.includes('429')) throw new Error("Rate limit reached.");
    throw new Error("Analysis failed.");
  }
};

/**
 * Streams the question answer for lightning-fast response delivery.
 */
export async function* askQuestionStream(
  base64Data: string, 
  mimeType: string, 
  question: string,
  history: { role: string; content: string }[],
  useSearch: boolean = false
) {
  const ai = getAIClient();
  
  const historyContents = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const config: any = { temperature: 0.1 };
  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const responseStream = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
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
    config
  });

  for await (const chunk of responseStream) {
    const text = chunk.text;
    if (text) yield text;
  }
}

// Keeping original askQuestion as fallback or non-stream tasks
export const askQuestion = async (
  base64Data: string, 
  mimeType: string, 
  question: string,
  history: { role: string; content: string }[],
  useSearch: boolean = false
) => {
  const ai = getAIClient();
  try {
    const historyContents = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const config: any = { temperature: 0.1 };
    if (useSearch) config.tools = [{ googleSearch: {} }];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...historyContents,
        { 
          role: 'user', 
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: `Answer based on the doc: ${question}` }
          ] 
        }
      ],
      config
    });
    
    return response.text || "";
  } catch (error: any) {
    throw new Error("Neural link interrupted.");
  }
};
