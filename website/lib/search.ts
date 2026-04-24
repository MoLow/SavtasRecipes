import type { Recipe } from "./recipes";

export interface SearchableRecipe {
  slug: string;
  titleEn: string;
  titleHe: string;
  description: string;
  ingredients: string;
  tagsEn: string[];
  tagsHe: string[];
  illustration: string;
}

export function buildSearchIndex(recipes: Recipe[]): SearchableRecipe[] {
  return recipes.map((r) => ({
    slug: r.slug,
    titleEn: r.title.en,
    titleHe: r.title.he,
    description: r.description.en,
    ingredients: r.ingredients.map((i) => `${i.en} ${i.he}`).join(" "),
    tagsEn: r.tags.map((t) => t.en),
    tagsHe: r.tags.map((t) => t.he),
    illustration: r.illustration,
  }));
}
