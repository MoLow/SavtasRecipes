/**
 * Migration script: converts existing recipe scan references from
 * raw HEIC files (scans/*.heic) to web-friendly JPEGs (scans/{id}-{page}.jpg)
 * with AI-detected rotation correction.
 *
 * Run: node --env-file=.env --experimental-strip-types --no-warnings src/migrate-scans.ts
 * Add --force to re-export even if files already exist.
 */

import { readdirSync, readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { exportWebScans } from "./utils/image.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../..");
const SCANS_DIR = resolve(ROOT_DIR, "scans");
const RECIPES_DIR = resolve(ROOT_DIR, "data/recipes");
const WEB_SCANS_DIR = resolve(ROOT_DIR, "data/scans");

const force = process.argv.includes("--force");

const files = readdirSync(RECIPES_DIR).filter(
  (f) => f.endsWith(".json") && f !== "index.json" && !f.startsWith(".")
);

let migrated = 0;
let skipped = 0;

async function main() {
  for (const file of files) {
    const filePath = resolve(RECIPES_DIR, file);
    const recipe = JSON.parse(readFileSync(filePath, "utf-8"));

    // Check if already migrated (web-friendly paths don't contain original filenames)
    const alreadyMigrated = recipe.source.scanFiles.every(
      (f: string) => f.match(/^scans\/[0-9a-f-]+-\d+\.jpg$/)
    );

    if (alreadyMigrated && !force) {
      console.log(`  Skip: ${recipe.title.en} (already migrated, use --force to redo)`);
      skipped++;
      continue;
    }

    // If forcing, delete existing exported files so they get re-created
    if (force && alreadyMigrated) {
      for (const f of recipe.source.scanFiles) {
        const absPath = resolve(ROOT_DIR, "data", f);
        if (existsSync(absPath)) unlinkSync(absPath);
      }
    }

    // Resolve original scan paths — could be HEIC refs or already-migrated refs
    let originalPaths: string[];
    if (alreadyMigrated) {
      // Need to look up original HEIC files from the processed map
      const processedMap = JSON.parse(readFileSync(resolve(RECIPES_DIR, ".processed.json"), "utf-8"));
      const heicFiles = Object.entries(processedMap)
        .filter(([_, id]) => id === recipe.id)
        .map(([filename]) => resolve(SCANS_DIR, filename));
      originalPaths = heicFiles;
    } else {
      originalPaths = recipe.source.scanFiles.map((f: string) =>
        resolve(ROOT_DIR, f)
      );
    }

    console.log(`  Migrating: ${recipe.title.en} (${originalPaths.length} scan(s))`);

    const webPaths = await exportWebScans(recipe.id, originalPaths);

    recipe.source.scanFiles = webPaths;
    writeFileSync(filePath, JSON.stringify(recipe, null, 2) + "\n");
    migrated++;
  }

  // Rebuild index
  const allRecipes = files.map((f) => {
    const content = readFileSync(resolve(RECIPES_DIR, f), "utf-8");
    const r = JSON.parse(content);
    return { id: r.id, slug: r.slug, title: r.title, tags: r.tags, illustration: r.illustration };
  });

  writeFileSync(
    resolve(RECIPES_DIR, "index.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), totalRecipes: allRecipes.length, recipes: allRecipes }, null, 2) + "\n"
  );

  console.log(`\nDone: ${migrated} migrated, ${skipped} skipped`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
