import { randomUUID } from "crypto";
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { resolve, basename, dirname, extname } from "path";
import { fileURLToPath } from "url";
import pMap from "p-map";
import cliProgress from "cli-progress";
import { ocrWithGemini } from "./skills/ocr-gemini.ts";
import { ocrWithClaude } from "./skills/ocr-claude.ts";
import { rankResults } from "./skills/ranker.ts";
import { generateIllustration } from "./skills/illustrator.ts";
import { recipeSchema, type Recipe } from "./schema.ts";
import { ensureCompatibleImage, exportWebScans } from "./utils/image.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../..");
const SCANS_DIR = resolve(ROOT_DIR, "scans");
const RECIPES_DIR = resolve(ROOT_DIR, "data/recipes");
const PROCESSED_MAP_PATH = resolve(RECIPES_DIR, ".processed.json");
const SCAN_GROUPS_PATH = resolve(ROOT_DIR, "data/scan-groups.json");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff", ".heic", ".heif"]);

const STEPS = ["OCR + Translate", "Rank", "Illustrate", "Export scans", "Write JSON"] as const;

function createProgressBar() {
  return new cliProgress.SingleBar({
    format: "  {bar} {percentage}% | {step} | Recipe {current}/{total}",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
    clearOnComplete: false,
    barsize: 25,
  }, cliProgress.Presets.shades_classic);
}

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

interface ProgressReporter {
  step(stepIndex: number): void;
  done(): void;
}

function noopReporter(): ProgressReporter {
  return { step() {}, done() {} };
}

async function processRecipeGroup(
  scanFilenames: string[],
  force: boolean,
  progress: ProgressReporter = noopReporter()
): Promise<void> {
  const processedMap = loadProcessedMap();

  // Check if all files in group are already processed
  const allProcessed = scanFilenames.every((f) => processedMap[f]);
  if (allProcessed && !force) {
    progress.done();
    return;
  }

  const id = randomUUID();
  const scanPaths = scanFilenames.map((f) => resolve(SCANS_DIR, f));

  // Step 1: Dual OCR + translation
  progress.step(0);

  // Convert HEIC/TIFF to JPEG if needed (3 at a time)
  const compatiblePaths = await pMap(scanPaths, ensureCompatibleImage, { concurrency: 3 });

  // Run both models in parallel
  const [geminiResult, claudeResult] = await Promise.allSettled([
    ocrWithGemini(compatiblePaths),
    ocrWithClaude(compatiblePaths),
  ]);

  const geminiData =
    geminiResult.status === "fulfilled" ? geminiResult.value : null;
  const claudeData =
    claudeResult.status === "fulfilled" ? claudeResult.value : null;

  // Step 2: Ranking
  progress.step(1);
  const ranking = await rankResults(geminiData, claudeData);

  // Step 3: Illustration
  progress.step(2);
  const illustrationPath = await generateIllustration(
    id,
    ranking.winner.title.en,
    ranking.winner.description.en
  );

  // Step 4: Export scans
  progress.step(3);
  const webScanPaths = await exportWebScans(id, scanPaths);

  // Step 5: Write JSON
  progress.step(4);
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

  progress.done();
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
  console.log(`Index updated: ${recipes.length} recipes`);
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

    const bar = createProgressBar();
    bar.start(STEPS.length, 0, { step: STEPS[0], current: 1, total: 1 });

    const reporter: ProgressReporter = {
      step(i) { bar.update(i, { step: STEPS[i] }); },
      done() { bar.update(STEPS.length, { step: "Done" }); bar.stop(); },
    };

    await processRecipeGroup([basename(fullPath)], force, reporter);
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

  const scanFiles = readdirSync(SCANS_DIR)
    .filter((f) => IMAGE_EXTENSIONS.has(extname(f).toLowerCase()))
    .sort();

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

  // Load manual scan groups and filter to unprocessed files
  const unprocessedSet = new Set(unprocessed);
  const allGroups: string[][] = JSON.parse(readFileSync(SCAN_GROUPS_PATH, "utf-8"));
  const groups = allGroups.filter((group) =>
    group.some((f) => unprocessedSet.has(f))
  );

  console.log(`\nProcessing ${groups.length} recipe(s)...\n`);

  // Overall progress: each recipe has STEPS.length sub-steps
  const totalSteps = groups.length * STEPS.length;
  const bar = createProgressBar();
  bar.start(totalSteps, 0, { step: "Starting", current: 0, total: groups.length });

  let completed = 0;
  let failed = 0;

  await pMap(groups, async (group, i) => {
    const recipeNum = (i ?? 0) + 1;
    const baseStep = (i ?? 0) * STEPS.length;

    const reporter: ProgressReporter = {
      step(stepIndex) {
        bar.update(baseStep + stepIndex, {
          step: `[${recipeNum}/${groups.length}] ${STEPS[stepIndex]}`,
          current: recipeNum,
        });
      },
      done() {
        bar.update(baseStep + STEPS.length, {
          step: `[${recipeNum}/${groups.length}] Done`,
          current: recipeNum,
        });
      },
    };

    try {
      await processRecipeGroup(group, force, reporter);
      completed++;
    } catch (err) {
      bar.update(baseStep + STEPS.length, {
        step: `[${recipeNum}/${groups.length}] FAILED`,
        current: recipeNum,
      });
      failed++;
    }
  }, { concurrency: 2 });

  bar.stop();
  console.log();

  buildIndex();

  console.log(`\nComplete: ${completed} processed, ${failed} failed`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
