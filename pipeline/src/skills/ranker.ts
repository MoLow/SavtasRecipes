import { z } from "zod";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { OcrTranslateResult } from "./ocr-gemini.ts";

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
        amount: z.number().nullable().optional(),
        unit: z.string().nullable().optional(),
      })
    )
    .min(1),
  instructions: z.object({
    en: z.array(z.string().min(1)).min(1),
    he: z.array(z.string().min(1)).min(1),
  }),
  tags: z.array(z.object({ en: z.string(), he: z.string() })),
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

  // Both valid — use Claude via Claude Code as judge
  const geminiData = (geminiValid as { valid: true; data: OcrTranslateResult }).data;
  const claudeData = (claudeValid as { valid: true; data: OcrTranslateResult }).data;

  return await judgeWithClaude(geminiData, claudeData);
}

async function judgeWithClaude(
  geminiData: OcrTranslateResult,
  claudeData: OcrTranslateResult
): Promise<RankingResult> {
  const prompt = `You are comparing two AI-generated recipe extractions from the same handwritten scan. Pick the better one.

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
}`;

  let responseText = "";

  for await (const message of query({
    prompt,
    options: {
      model: "haiku",
      permissionMode: "default",
      allowedTools: [],
      maxTurns: 1,
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
    return {
      winner: geminiData,
      selectedModel: "gemini",
      rankingReason: "Claude Code judge returned no response, defaulting to Gemini",
    };
  }

  try {
    let jsonText = responseText.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    } else {
      const braceStart = jsonText.indexOf("{");
      const braceEnd = jsonText.lastIndexOf("}");
      if (braceStart !== -1 && braceEnd !== -1) {
        jsonText = jsonText.slice(braceStart, braceEnd + 1);
      }
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
    return {
      winner: geminiData,
      selectedModel: "gemini",
      rankingReason: "Claude Code judge response was not valid JSON, defaulting to Gemini",
    };
  }
}
