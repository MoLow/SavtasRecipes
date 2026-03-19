import { GoogleGenAI } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY. Set it in pipeline/.env");
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}
