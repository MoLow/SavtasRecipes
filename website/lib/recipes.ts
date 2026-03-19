import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve } from "path";

const RECIPES_DIR = resolve(process.cwd(), "../data/recipes");

export interface Recipe {
  id: string;
  slug: string;
  source: { scanFile: string; processedAt: string };
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
  tags: string[];
  illustration: string;
  ocrRawText: string;
  selectedModel: "gemini" | "claude";
  rankingReason: string;
}

export type Locale = "en" | "he";

export function getAllRecipes(): Recipe[] {
  if (!existsSync(RECIPES_DIR)) return [];

  return readdirSync(RECIPES_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .map((f) => {
      const content = readFileSync(resolve(RECIPES_DIR, f), "utf-8");
      return JSON.parse(content) as Recipe;
    });
}

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return getAllRecipes().find((r) => r.slug === slug);
}

export function getAllSlugs(): string[] {
  return getAllRecipes().map((r) => r.slug);
}
