import { unlinkSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { generateIllustration } from "./illustrator.ts";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../../..");
const RECIPES_DIR = resolve(ROOT_DIR, "data/recipes");
const ILLUSTRATIONS_DIR = resolve(ROOT_DIR, "data/illustrations");

const [recipeId] = process.argv.slice(2);

if (!recipeId) {
  console.error("Usage: regen-illustration-cli.ts <recipeId>");
  console.error("  Deletes the existing illustration and regenerates it via Gemini.");
  console.error("  Requires GEMINI_API_KEY to be set.");
  process.exit(1);
}

const recipePath = resolve(RECIPES_DIR, `${recipeId}.json`);
if (!existsSync(recipePath)) {
  console.error(`Recipe not found: ${recipeId}`);
  process.exit(1);
}

const recipe = JSON.parse(readFileSync(recipePath, "utf-8"));
const title: string = recipe.title?.en;
const description: string = recipe.description?.en;

if (!title || !description) {
  console.error("Recipe missing title.en or description.en");
  process.exit(1);
}

// Delete existing illustration(s) so generateIllustration doesn't skip them
for (const ext of ["png", "webp"]) {
  const existing = resolve(ILLUSTRATIONS_DIR, `${recipeId}.${ext}`);
  if (existsSync(existing)) {
    console.log(`Deleting existing illustration: ${existing}`);
    unlinkSync(existing);
  }
}

console.log(`Regenerating illustration for: ${title}`);
const illustrationPath = await generateIllustration(recipeId, title, description);
console.log(`Done: ${illustrationPath}`);
