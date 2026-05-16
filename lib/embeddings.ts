import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_EMBED_MODEL ?? 'gemini-embedding-001';

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) {
    if (!apiKey) throw new Error('GEMINI_API_KEY missing');
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function embed(text: string): Promise<number[]> {
  const res = await getClient().models.embedContent({
    model,
    contents: text,
  });
  const e = res.embeddings?.[0]?.values;
  if (!e) throw new Error('Empty embedding response');
  return e;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}
