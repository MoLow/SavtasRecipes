import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { getAnthropicClient } from "../utils/api-clients.js";
import type { OcrTranslateResult } from "./ocr-gemini.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = resolve(__dirname, "../../../prompts/ocr-translate-system.md");

export async function ocrWithClaude(
  imagePath: string
): Promise<OcrTranslateResult> {
  const client = getAnthropicClient();
  const systemPrompt = readFileSync(PROMPT_PATH, "utf-8");
  const imageData = readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  const ext = imagePath.toLowerCase().split(".").pop();
  const mediaType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "gif"
          ? "image/gif"
          : "image/jpeg";

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: systemPrompt,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text response");
  }

  // Claude may wrap JSON in code fences, strip them
  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  return JSON.parse(jsonText) as OcrTranslateResult;
}
