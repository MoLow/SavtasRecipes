import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve } from "path";

const RECIPES_DIR = resolve(process.cwd(), "../data/recipes");

export interface Recipe {
  id: string;
  slug: string;
  source: { scanFiles: string[]; processedAt: string; attribution?: string };
  title: { en: string; he: string };
  description: { en: string; he: string };
  ingredients: Array<{
    en: string;
    he: string;
    item: string;
    amount?: number;
    unit?: string;
  }>;
  instructions: { en: string[]; he: string[] };
  tags: Array<{ en: string; he: string }>;
  illustration: string;
  ocrRawText: string;
  selectedModel: "gemini" | "claude";
  rankingReason: string;
}

export type Locale = "en" | "he";

export function getAllRecipes(): Recipe[] {
  if (!existsSync(RECIPES_DIR)) return [];

  const recipes = readdirSync(RECIPES_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith(".") && f !== "index.json")
    .map((f) => {
      const content = readFileSync(resolve(RECIPES_DIR, f), "utf-8");
      return JSON.parse(content) as Recipe;
    });

  // Deduplicate slugs — append -2, -3, etc. for collisions
  const slugCounts = new Map<string, number>();
  for (const recipe of recipes) {
    const count = (slugCounts.get(recipe.slug) ?? 0) + 1;
    slugCounts.set(recipe.slug, count);
    if (count > 1) {
      recipe.slug = `${recipe.slug}-${count}`;
    }
  }

  return recipes;
}

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return getAllRecipes().find((r) => r.slug === slug);
}

export function getAllSlugs(): string[] {
  return getAllRecipes().map((r) => r.slug);
}

export interface RecipeIndex {
  slug: string;
  titleEn: string;
  titleHe: string;
  descriptionEn: string;
  descriptionHe: string;
  tags: string[];
  illustration: string;
}

export function getRecipesIndex(): RecipeIndex[] {
  return getAllRecipes().map((r) => ({
    slug: r.slug,
    titleEn: r.title.en,
    titleHe: r.title.he,
    descriptionEn: r.description.en,
    descriptionHe: r.description.he,
    tags: r.tags.map((t) => t.en),
    illustration: r.illustration,
  }));
}

