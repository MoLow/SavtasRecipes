import { readFileSync } from "fs";
import { resolve, basename, dirname } from "path";
import { fileURLToPath } from "url";
import { getGeminiClient } from "../utils/api-clients.ts";
import { ensureCompatibleImage } from "../utils/image.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = resolve(__dirname, "../../../prompts/grouper-system.md");

interface ScanSummary {
  filename: string;
  textSnippet: string;
}

async function quickOcr(imagePath: string): Promise<string> {
  const client = getGeminiClient();
  const compatiblePath = await ensureCompatibleImage(imagePath);
  const imageData = readFileSync(compatiblePath);
  const base64Image = imageData.toString("base64");

  const ext = compatiblePath.toLowerCase().split(".").pop();
  const mimeType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: "Read the handwritten text in this image. Return ONLY the raw text, nothing else." },
        ],
      },
    ],
    config: { temperature: 0 },
  });

  return response.text ?? "";
}

export async function groupScans(scanPaths: string[]): Promise<string[][]> {
  if (scanPaths.length <= 1) {
    return scanPaths.map((p) => [basename(p)]);
  }

  console.log("  Running quick OCR on all scans for grouping...");

  // Quick OCR all scans in parallel
  const results = await Promise.allSettled(
    scanPaths.map(async (p): Promise<ScanSummary> => ({
      filename: basename(p),
      textSnippet: (await quickOcr(p)).slice(0, 300),
    }))
  );

  const summaries: ScanSummary[] = results
    .filter((r): r is PromiseFulfilledResult<ScanSummary> => r.status === "fulfilled")
    .map((r) => r.value);

  const failedCount = results.filter((r) => r.status === "rejected").length;
  if (failedCount > 0) {
    console.warn(`  Warning: ${failedCount} scans failed quick OCR`);
  }

  // If too few succeeded, fall back to individual groups
  if (summaries.length === 0) {
    console.warn("  All quick OCR failed, treating each scan as separate recipe");
    return scanPaths.map((p) => [basename(p)]);
  }

  // Build the clustering prompt
  const promptTemplate = readFileSync(PROMPT_PATH, "utf-8");
  const scanList = summaries
    .map((s) => `Filename: ${s.filename}\nText: ${s.textSnippet}\n`)
    .join("\n");

  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: promptTemplate + scanList }],
      },
    ],
    config: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) {
    console.warn("  Grouper returned empty response, treating each scan as separate");
    return scanPaths.map((p) => [basename(p)]);
  }

  try {
    const groups: string[][] = JSON.parse(text);

    // Validate: every input filename must appear exactly once
    const allFilenames = new Set(scanPaths.map((p) => basename(p)));
    const grouped = new Set(groups.flat());

    if (grouped.size !== allFilenames.size || ![...allFilenames].every((f) => grouped.has(f))) {
      console.warn("  Grouper response has mismatched filenames, falling back to individual groups");
      return scanPaths.map((p) => [basename(p)]);
    }

    const multiGroups = groups.filter((g) => g.length > 1);
    if (multiGroups.length > 0) {
      console.log(`  Found ${multiGroups.length} multi-page recipe(s):`);
      for (const group of multiGroups) {
        console.log(`    - ${group.join(" + ")}`);
      }
    } else {
      console.log("  All scans are single-page recipes.");
    }

    return groups;
  } catch {
    console.warn("  Failed to parse grouper response, treating each scan as separate");
    return scanPaths.map((p) => [basename(p)]);
  }
}
