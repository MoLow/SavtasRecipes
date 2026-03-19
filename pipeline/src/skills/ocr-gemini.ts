import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { getGeminiClient } from "../utils/api-clients.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = resolve(__dirname, "../../../prompts/ocr-translate-system.md");

export interface OcrTranslateResult {
  title: { en: string; he: string };
  description: { en: string; he: string };
  ingredients: Array<{
    en: string;
    he: string;
    item: string;
    amount?: number;
    unit?: string;
  }>;
  instructions: { en: string[]; he: string[] };
  tags: string[];
  ocrRawText: string;
}

export async function ocrWithGemini(
  imagePath: string
): Promise<OcrTranslateResult> {
  const client = getGeminiClient();
  const systemPrompt = readFileSync(PROMPT_PATH, "utf-8");
  const imageData = readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  const ext = imagePath.toLowerCase().split(".").pop();
  const mimeType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : "image/jpeg";

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: systemPrompt },
        ],
      },
    ],
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return JSON.parse(text) as OcrTranslateResult;
}
