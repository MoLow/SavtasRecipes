import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../../..");
const RECIPES_DIR = resolve(ROOT_DIR, "data/recipes");
const DATA_DIR = resolve(ROOT_DIR, "data");

type Degrees = 90 | 180 | 270;

/**
 * Rotates all scan images for a recipe by the given degrees clockwise.
 *
 * Reads the recipe JSON to locate its scan files (stored in data/scans/),
 * then rotates each in-place using sharp (cross-platform, works in CI).
 *
 * @param recipeId - The recipe UUID
 * @param degrees  - Clockwise rotation: 90, 180, or 270
 */
export async function rotateRecipeScans(
  recipeId: string,
  degrees: Degrees
): Promise<void> {
  const recipePath = resolve(RECIPES_DIR, `${recipeId}.json`);
  if (!existsSync(recipePath)) {
    throw new Error(`Recipe not found: ${recipeId}`);
  }

  const recipe = JSON.parse(readFileSync(recipePath, "utf-8"));
  const scanFiles: string[] = recipe.source?.scanFiles ?? [];

  if (scanFiles.length === 0) {
    throw new Error(`No scan files found for recipe: ${recipeId}`);
  }

  for (const relPath of scanFiles) {
    // relPath is like "scans/{id}-0.jpg", relative to data/
    const absPath = resolve(DATA_DIR, relPath);
    if (!existsSync(absPath)) {
      console.warn(`Scan not found, skipping: ${absPath}`);
      continue;
    }

    console.log(`Rotating ${relPath} by ${degrees}°`);

    // sharp rotate values: positive = clockwise
    const rotated = await sharp(absPath).rotate(degrees).toBuffer();
    await sharp(rotated).toFile(absPath);
  }

  console.log(
    `Rotated ${scanFiles.length} scan(s) for recipe ${recipeId} by ${degrees}°`
  );
}
