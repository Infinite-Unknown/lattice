import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-pro';

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) {
    if (!apiKey) throw new Error('GEMINI_API_KEY missing');
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export interface GenerateOptions {
  /** 0 = deterministic, 1 = max creativity. Default 0.75 — varied without going off-rails. */
  temperature?: number;
}

export async function generateStructured<T>(
  prompt: string,
  responseSchema: object,
  opts: GenerateOptions = {},
): Promise<T> {
  const res = await getClient().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: opts.temperature ?? 0.75,
    },
  });
  const text = res.text;
  if (!text) throw new Error('Empty Gemini response');
  return JSON.parse(text) as T;
}

export { Type };
