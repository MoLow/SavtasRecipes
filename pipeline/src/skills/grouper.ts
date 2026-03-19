import { readFileSync } from "fs";
import { resolve, basename, dirname } from "path";
import { fileURLToPath } from "url";
import pMap from "p-map";
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

  // Quick OCR with limited concurrency (3 at a time)
  const summaries: ScanSummary[] = [];
  let failedCount = 0;

  await pMap(scanPaths, async (p) => {
    try {
      summaries.push({
        filename: basename(p),
        textSnippet: (await quickOcr(p)).slice(0, 300),
      });
    } catch {
      failedCount++;
    }
  }, { concurrency: 3 });

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

    // Validate: multi-page groups must be consecutive files in sorted order.
    // Scans were performed serially, so pages of the same recipe are always
    // adjacent files. Non-consecutive grouping is a false positive.
    const sortedFilenames = [...allFilenames].sort();
    const indexMap = new Map(sortedFilenames.map((f, i) => [f, i]));

    const validatedGroups: string[][] = [];
    for (const group of groups) {
      if (group.length <= 1) {
        validatedGroups.push(group);
        continue;
      }

      // Sort group by file order and check consecutive
      const sorted = [...group].sort((a, b) => (indexMap.get(a) ?? 0) - (indexMap.get(b) ?? 0));
      const indices = sorted.map((f) => indexMap.get(f) ?? -1);
      const isConsecutive = indices.every((idx, i) => i === 0 || idx === indices[i - 1] + 1);

      if (isConsecutive) {
        validatedGroups.push(sorted);
      } else {
        console.warn(`  Group rejected (non-consecutive files): ${group.join(" + ")}`);
        console.warn(`    Splitting into individual recipes.`);
        for (const f of sorted) {
          validatedGroups.push([f]);
        }
      }
    }

    const multiGroups = validatedGroups.filter((g) => g.length > 1);
    if (multiGroups.length > 0) {
      console.log(`  Found ${multiGroups.length} multi-page recipe(s):`);
      for (const group of multiGroups) {
        console.log(`    - ${group.join(" + ")}`);
      }
    } else {
      console.log("  All scans are single-page recipes.");
    }

    return validatedGroups;
  } catch {
    console.warn("  Failed to parse grouper response, treating each scan as separate");
    return scanPaths.map((p) => [basename(p)]);
  }
}
