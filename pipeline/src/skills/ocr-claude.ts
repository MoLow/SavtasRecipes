import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { OcrTranslateResult } from "./ocr-gemini.ts";
import { cached, fileFingerprint } from "../utils/cache.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = resolve(__dirname, "../../../prompts/ocr-translate-system.md");

export async function ocrWithClaude(
  imagePaths: string[]
): Promise<OcrTranslateResult> {
  const cacheKey = imagePaths.map(fileFingerprint).join("+") + ":claude-ocr";

  return cached("ocr-claude", cacheKey, async () => {
  const systemPrompt = readFileSync(PROMPT_PATH, "utf-8");
  const absolutePaths = imagePaths.map((p) => resolve(p));

  const imageList = absolutePaths.length === 1
    ? `Read the image at ${absolutePaths[0]}`
    : `Read these images (consecutive pages of a single recipe):\n${absolutePaths.map((p, i) => `  Page ${i + 1}: ${p}`).join("\n")}`;

  let responseText = "";

  for await (const message of query({
    prompt: `${imageList}\n\nFollow these instructions:\n\n${systemPrompt}`,
    options: {
      model: "claude-opus-4-6",
      permissionMode: "bypassPermissions",
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
  });
}
