import { readdirSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { resolve, basename, dirname, extname } from "path";
import { fileURLToPath } from "url";
import { ocrWithGemini } from "./skills/ocr-gemini.js";
import { ocrWithClaude } from "./skills/ocr-claude.js";
import { rankResults } from "./skills/ranker.js";
import { generateIllustration } from "./skills/illustrator.js";
import { recipeSchema, type Recipe } from "./schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../..");
const SCANS_DIR = resolve(ROOT_DIR, "scans");
const RECIPES_DIR = resolve(ROOT_DIR, "data/recipes");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff"]);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getRecipeId(filename: string): string {
  return basename(filename, extname(filename));
}

async function processSingleScan(
  scanPath: string,
  force: boolean
): Promise<void> {
  const id = getRecipeId(basename(scanPath));
  const outputPath = resolve(RECIPES_DIR, `${id}.json`);

  if (existsSync(outputPath) && !force) {
    console.log(`  Skipping ${id} (already processed, use --force to reprocess)`);
    return;
  }

  console.log(`  [1/4] Running dual OCR + translation...`);

  // Run both models in parallel
  const [geminiResult, claudeResult] = await Promise.allSettled([
    ocrWithGemini(scanPath),
    ocrWithClaude(scanPath),
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

  console.log(`  [2/4] Ranking results...`);
  const ranking = await rankResults(geminiData, claudeData);
  console.log(
    `  Selected: ${ranking.selectedModel} — ${ranking.rankingReason}`
  );

  console.log(`  [3/4] Generating illustration...`);
  const illustrationPath = await generateIllustration(
    id,
    ranking.winner.title.en,
    ranking.winner.description.en
  );

  console.log(`  [4/4] Writing recipe JSON...`);
  const slug = slugify(ranking.winner.title.en);
  const recipe: Recipe = {
    id,
    slug,
    source: {
      scanFile: `scans/${basename(scanPath)}`,
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
  writeFileSync(outputPath, JSON.stringify(recipe, null, 2) + "\n");
  console.log(`  Done: ${outputPath}`);
}

function buildIndex(): void {
  if (!existsSync(RECIPES_DIR)) return;

  const files = readdirSync(RECIPES_DIR).filter(
    (f) => f.endsWith(".json") && f !== "index.json"
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
    // Single file mode
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
    await processSingleScan(fullPath, force);
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

  console.log(`Found ${scanFiles.length} scans to process.\n`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of scanFiles) {
    const scanPath = resolve(SCANS_DIR, file);
    console.log(`[${processed + skipped + failed + 1}/${scanFiles.length}] ${file}`);

    try {
      const outputPath = resolve(RECIPES_DIR, `${getRecipeId(file)}.json`);
      if (existsSync(outputPath) && !force) {
        console.log(`  Skipping (already processed)`);
        skipped++;
        continue;
      }
      await processSingleScan(scanPath, force);
      processed++;
    } catch (err) {
      console.error(`  FAILED: ${err}`);
      failed++;
    }
  }

  buildIndex();

  console.log(`\nComplete: ${processed} processed, ${skipped} skipped, ${failed} failed`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
