import { z } from "zod";
import { getAnthropicClient } from "../utils/api-clients.js";
import type { OcrTranslateResult } from "./ocr-gemini.js";

/** Schema to validate raw OCR+translate output before agent adds id/slug/etc */
const ocrResultSchema = z.object({
  title: z.object({ en: z.string().min(1), he: z.string().min(1) }),
  description: z.object({ en: z.string().min(1), he: z.string().min(1) }),
  ingredients: z
    .array(
      z.object({
        en: z.string().min(1),
        he: z.string().min(1),
        item: z.string().min(1),
        amount: z.number().optional(),
        unit: z.string().optional(),
      })
    )
    .min(1),
  instructions: z.object({
    en: z.array(z.string().min(1)).min(1),
    he: z.array(z.string().min(1)).min(1),
  }),
  tags: z.array(z.string()),
  ocrRawText: z.string().min(1),
});

export interface RankingResult {
  winner: OcrTranslateResult;
  selectedModel: "gemini" | "claude";
  rankingReason: string;
}

function validate(
  result: unknown
): { valid: true; data: OcrTranslateResult } | { valid: false; error: string } {
  const parsed = ocrResultSchema.safeParse(result);
  if (parsed.success) {
    return { valid: true, data: parsed.data as OcrTranslateResult };
  }
  return {
    valid: false,
    error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
  };
}

export async function rankResults(
  geminiResult: OcrTranslateResult | null,
  claudeResult: OcrTranslateResult | null
): Promise<RankingResult> {
  const geminiValid = geminiResult ? validate(geminiResult) : null;
  const claudeValid = claudeResult ? validate(claudeResult) : null;

  const geminiOk = geminiValid?.valid === true;
  const claudeOk = claudeValid?.valid === true;

  // If only one passes validation, use it
  if (geminiOk && !claudeOk) {
    const reason = claudeValid
      ? `Claude result failed validation: ${claudeValid.error}`
      : "Claude returned no result";
    return {
      winner: (geminiValid as { valid: true; data: OcrTranslateResult }).data,
      selectedModel: "gemini",
      rankingReason: `Gemini selected (only valid result). ${reason}`,
    };
  }

  if (claudeOk && !geminiOk) {
    const reason = geminiValid
      ? `Gemini result failed validation: ${geminiValid.error}`
      : "Gemini returned no result";
    return {
      winner: (claudeValid as { valid: true; data: OcrTranslateResult }).data,
      selectedModel: "claude",
      rankingReason: `Claude selected (only valid result). ${reason}`,
    };
  }

  if (!geminiOk && !claudeOk) {
    throw new Error(
      "Both models failed validation.\n" +
        `Gemini: ${geminiValid?.valid === false ? geminiValid.error : "no result"}\n` +
        `Claude: ${claudeValid?.valid === false ? claudeValid.error : "no result"}`
    );
  }

  // Both valid — use Claude Haiku as a cheap judge
  const geminiData = (geminiValid as { valid: true; data: OcrTranslateResult }).data;
  const claudeData = (claudeValid as { valid: true; data: OcrTranslateResult }).data;

  return await judgeWithHaiku(geminiData, claudeData);
}

async function judgeWithHaiku(
  geminiData: OcrTranslateResult,
  claudeData: OcrTranslateResult
): Promise<RankingResult> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are comparing two AI-generated recipe extractions from the same handwritten scan. Pick the better one.

## Result A (Gemini)
${JSON.stringify(geminiData, null, 2)}

## Result B (Claude)
${JSON.stringify(claudeData, null, 2)}

Evaluate on:
1. **Completeness**: Does it have a title, description, all ingredients, and all instruction steps?
2. **Coherence**: Do the ingredients and instructions make sense as a real recipe?
3. **Translation quality**: Is the Hebrew translation natural and correct?
4. **OCR accuracy**: Does the raw text look like a plausible reading of handwriting?

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "winner": "A" or "B",
  "reason": "Brief explanation of why this result is better"
}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    // Fallback to Gemini if judge fails
    return {
      winner: geminiData,
      selectedModel: "gemini",
      rankingReason: "Haiku judge returned no response, defaulting to Gemini",
    };
  }

  try {
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const judgment = JSON.parse(jsonText) as {
      winner: string;
      reason: string;
    };

    const isGemini = judgment.winner === "A";
    return {
      winner: isGemini ? geminiData : claudeData,
      selectedModel: isGemini ? "gemini" : "claude",
      rankingReason: judgment.reason,
    };
  } catch {
    // JSON parse failed, default to Gemini
    return {
      winner: geminiData,
      selectedModel: "gemini",
      rankingReason: "Haiku judge response was not valid JSON, defaulting to Gemini",
    };
  }
}
