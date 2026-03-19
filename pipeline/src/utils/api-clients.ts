import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(): Record<string, string> {
  const envPath = resolve(__dirname, "../../.env");
  const env: Record<string, string> = {};
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      env[key] = value;
    }
  } catch {
    // .env file not found, fall back to process.env
  }
  return env;
}

const env = loadEnv();

function getEnv(key: string): string {
  const value = env[key] || process.env[key];
  if (!value) {
    throw new Error(
      `Missing ${key}. Set it in pipeline/.env or as an environment variable.`
    );
  }
  return value;
}

let geminiClient: GoogleGenAI | null = null;
let anthropicClient: Anthropic | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: getEnv("GEMINI_API_KEY") });
  }
  return geminiClient;
}

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: getEnv("ANTHROPIC_API_KEY") });
  }
  return anthropicClient;
}
