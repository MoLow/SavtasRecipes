import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { getGeminiClient } from "../utils/api-clients.ts";
import { cached, fileFingerprint } from "../utils/cache.ts";

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
  tags: Array<{ en: string; he: string }>;
  ocrRawText: string;
}

function getMimeType(path: string): string {
  const ext = path.toLowerCase().split(".").pop();
  return ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
}

export async function ocrWithGemini(
  imagePaths: string[]
): Promise<OcrTranslateResult> {
  const cacheKey = imagePaths.map(fileFingerprint).join("+") + ":gemini-ocr";

  return cached("ocr-gemini", cacheKey, async () => {
    const client = getGeminiClient();
    const systemPrompt = readFileSync(PROMPT_PATH, "utf-8");

    const imageParts = imagePaths.map((p) => ({
      inlineData: {
        mimeType: getMimeType(p),
        data: readFileSync(p).toString("base64"),
      },
    }));

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [...imageParts, { text: systemPrompt }],
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
  });
}
