import { randomUUID } from "crypto";
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { resolve, basename, dirname, extname } from "path";
import { fileURLToPath } from "url";
import { ocrWithGemini } from "./skills/ocr-gemini.ts";
import { ocrWithClaude } from "./skills/ocr-claude.ts";
import { rankResults } from "./skills/ranker.ts";
import { generateIllustration } from "./skills/illustrator.ts";
import { groupScans } from "./skills/grouper.ts";
import { recipeSchema, type Recipe } from "./schema.ts";
import { ensureCompatibleImage, exportWebScans } from "./utils/image.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../..");
const SCANS_DIR = resolve(ROOT_DIR, "scans");
const RECIPES_DIR = resolve(ROOT_DIR, "data/recipes");
const PROCESSED_MAP_PATH = resolve(RECIPES_DIR, ".processed.json");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff", ".heic", ".heif"]);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Maps scan filenames to recipe UUIDs for idempotency */
function loadProcessedMap(): Record<string, string> {
  if (!existsSync(PROCESSED_MAP_PATH)) return {};
  return JSON.parse(readFileSync(PROCESSED_MAP_PATH, "utf-8"));
}

function saveProcessedMap(map: Record<string, string>): void {
  mkdirSync(RECIPES_DIR, { recursive: true });
  writeFileSync(PROCESSED_MAP_PATH, JSON.stringify(map, null, 2) + "\n");
}

async function processRecipeGroup(
  scanFilenames: string[],
  force: boolean
): Promise<void> {
  const processedMap = loadProcessedMap();

  // Check if all files in group are already processed
  const allProcessed = scanFilenames.every((f) => processedMap[f]);
  if (allProcessed && !force) {
    console.log(`  Skipping (already processed, use --force to reprocess)`);
    return;
  }

  const id = randomUUID();
  const scanPaths = scanFilenames.map((f) => resolve(SCANS_DIR, f));

  console.log(`  [1/5] Running dual OCR + translation...`);

  // Convert HEIC/TIFF to JPEG if needed
  const compatiblePaths = await Promise.all(scanPaths.map(ensureCompatibleImage));

  // Run both models in parallel
  const [geminiResult, claudeResult] = await Promise.allSettled([
    ocrWithGemini(compatiblePaths),
    ocrWithClaude(compatiblePaths),
  ]);

  const geminiData =
    geminiResult.status === "fulfilled" ? geminiResult.value : null;
  const claudeData =
    claudeResult.status === "fulfilled" ? claudeResult.value : null;

  if (geminiResult.status === "rejected") {
    console.warn(`  Gemini OCR failed: ${geminiResult.reason}`);
  }
  if (claudeResult.status === "rejected") {
    console.warn(`  Claude OCR failed: ${claudeResult.reason}`);
  }

  console.log(`  [2/5] Ranking results...`);
  const ranking = await rankResults(geminiData, claudeData);
  console.log(
    `  Selected: ${ranking.selectedModel} — ${ranking.rankingReason}`
  );

  console.log(`  [3/5] Generating illustration...`);
  const illustrationPath = await generateIllustration(
    id,
    ranking.winner.title.en,
    ranking.winner.description.en
  );

  console.log(`  [4/5] Exporting scans for web...`);
  const webScanPaths = await exportWebScans(id, scanPaths);

  console.log(`  [5/5] Writing recipe JSON...`);
  const slug = slugify(ranking.winner.title.en);
  const recipe: Recipe = {
    id,
    slug,
    source: {
      scanFiles: webScanPaths,
      processedAt: new Date().toISOString(),
    },
    title: ranking.winner.title,
    description: ranking.winner.description,
    ingredients: ranking.winner.ingredients,
    instructions: ranking.winner.instructions,
    tags: ranking.winner.tags,
    illustration: illustrationPath,
    ocrRawText: ranking.winner.ocrRawText,
    selectedModel: ranking.selectedModel,
    rankingReason: ranking.rankingReason,
  };

  // Validate before writing
  recipeSchema.parse(recipe);

  mkdirSync(RECIPES_DIR, { recursive: true });
  const outputPath = resolve(RECIPES_DIR, `${id}.json`);
  writeFileSync(outputPath, JSON.stringify(recipe, null, 2) + "\n");

  // Update processed map — all files in group map to same UUID
  for (const filename of scanFilenames) {
    processedMap[filename] = id;
  }
  saveProcessedMap(processedMap);

  console.log(`  Done: ${recipe.title.en} → ${outputPath}`);
}

function buildIndex(): void {
  if (!existsSync(RECIPES_DIR)) return;

  const files = readdirSync(RECIPES_DIR).filter(
    (f) => f.endsWith(".json") && f !== "index.json" && f !== ".processed.json"
  );

  const recipes = files.map((f) => {
    const content = readFileSync(resolve(RECIPES_DIR, f), "utf-8");
    const recipe: Recipe = JSON.parse(content);
    return {
      id: recipe.id,
      slug: recipe.slug,
      title: recipe.title,
      tags: recipe.tags,
      illustration: recipe.illustration,
    };
  });

  const index = {
    generatedAt: new Date().toISOString(),
    totalRecipes: recipes.length,
    recipes,
  };

  writeFileSync(
    resolve(RECIPES_DIR, "index.json"),
    JSON.stringify(index, null, 2) + "\n"
  );
  console.log(`\nIndex updated: ${recipes.length} recipes`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const fileFlag = args.indexOf("--file");

  if (fileFlag !== -1) {
    // Single file mode — skip grouper, process as single-element group
    const filePath = args[fileFlag + 1];
    if (!filePath) {
      console.error("Usage: npm run process:one -- --file <path>");
      process.exit(1);
    }
    const fullPath = resolve(filePath);
    if (!existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      process.exit(1);
    }
    console.log(`Processing single scan: ${basename(fullPath)}`);
    await processRecipeGroup([basename(fullPath)], force);
    buildIndex();
    return;
  }

  // Batch mode
  if (!existsSync(SCANS_DIR)) {
    console.error(
      `Scans directory not found: ${SCANS_DIR}\nCreate it and add your scanned recipe images.`
    );
    process.exit(1);
  }

  const scanFiles = readdirSync(SCANS_DIR).filter((f) =>
    IMAGE_EXTENSIONS.has(extname(f).toLowerCase())
  );

  if (scanFiles.length === 0) {
    console.log("No scan images found in scans/ directory.");
    return;
  }

  // Filter out already-processed files
  const processedMap = loadProcessedMap();
  const unprocessed = force
    ? scanFiles
    : scanFiles.filter((f) => !processedMap[f]);

  if (unprocessed.length === 0) {
    console.log(`All ${scanFiles.length} scans already processed (use --force to reprocess).`);
    buildIndex();
    return;
  }

  console.log(`Found ${scanFiles.length} scans (${unprocessed.length} unprocessed).\n`);

  // Group unprocessed scans by recipe
  const unprocessedPaths = unprocessed.map((f) => resolve(SCANS_DIR, f));
  const groups = await groupScans(unprocessedPaths);

  console.log(`\nProcessing ${groups.length} recipe group(s)...\n`);

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const label = group.length === 1 ? group[0] : `[${group.join(" + ")}]`;
    console.log(`[${i + 1}/${groups.length}] ${label}`);

    try {
      await processRecipeGroup(group, force);
      processed++;
    } catch (err) {
      console.error(`  FAILED: ${err}`);
      failed++;
    }
  }

  buildIndex();

  console.log(`\nComplete: ${processed} processed, ${failed} failed`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
