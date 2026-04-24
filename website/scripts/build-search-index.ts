/**
 * Emits public/search-index.json with the minimal data the client search needs.
 * Keeps the RSC Flight payload inlined in HTML out of the critical request — the
 * index is fetched lazily on first search interaction instead.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

interface Recipe {
  slug: string;
  title: { en: string; he: string };
  description: { en: string; he: string };
  ingredients: Array<{ en: string; he: string }>;
  tags: Array<{ en: string; he: string }>;
  illustration: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const RECIPES_DIR = resolve(__dirname, "../../data/recipes");
const OUT = resolve(__dirname, "../public/search-index.json");

if (!existsSync(RECIPES_DIR)) {
  console.log("No recipes directory found; skipping search-index.json");
  process.exit(0);
}

const recipes = readdirSync(RECIPES_DIR)
  .filter((f) => f.endsWith(".json") && !f.startsWith(".") && f !== "index.json")
  .map((f) => JSON.parse(readFileSync(resolve(RECIPES_DIR, f), "utf-8")) as Recipe);

// Deduplicate slugs to match lib/recipes.ts's collision handling.
const slugCounts = new Map<string, number>();
for (const r of recipes) {
  const count = (slugCounts.get(r.slug) ?? 0) + 1;
  slugCounts.set(r.slug, count);
  if (count > 1) r.slug = `${r.slug}-${count}`;
}

const index = recipes.map((r) => ({
  slug: r.slug,
  titleEn: r.title.en,
  titleHe: r.title.he,
  description: r.description.en,
  ingredients: r.ingredients.map((i) => `${i.en} ${i.he}`).join(" "),
  tagsEn: r.tags.map((t) => t.en),
  tagsHe: r.tags.map((t) => t.he),
  illustration: r.illustration,
}));

writeFileSync(OUT, JSON.stringify(index));
console.log(`Wrote ${index.length} recipes to public/search-index.json`);
