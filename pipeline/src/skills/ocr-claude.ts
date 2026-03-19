import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { OcrTranslateResult } from "./ocr-gemini.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = resolve(__dirname, "../../../prompts/ocr-translate-system.md");

export async function ocrWithClaude(
  imagePath: string
): Promise<OcrTranslateResult> {
  const systemPrompt = readFileSync(PROMPT_PATH, "utf-8");
  const absoluteImagePath = resolve(imagePath);

  let responseText = "";

  for await (const message of query({
    prompt: `Read the image at ${absoluteImagePath} and follow these instructions:\n\n${systemPrompt}`,
    options: {
      model: "claude-opus-4-6",
      permissionMode: "default",
      allowedTools: ["Read"],
      maxTurns: 3,
    },
  })) {
    if (message.type === "assistant" && message.message?.content) {
      for (const block of message.message.content) {
        if ("text" in block) {
          responseText += block.text;
        }
      }
    }
  }

  if (!responseText) {
    throw new Error("Claude Code returned no response");
  }

  // Extract JSON from response — may be wrapped in code fences or prose
  let jsonText = responseText.trim();
  const jsonMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  } else {
    // Try to find raw JSON object
    const braceStart = jsonText.indexOf("{");
    const braceEnd = jsonText.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd !== -1) {
      jsonText = jsonText.slice(braceStart, braceEnd + 1);
    }
  }

  return JSON.parse(jsonText) as OcrTranslateResult;
}
