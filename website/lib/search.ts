import Fuse from "fuse.js";
import type { Recipe, Locale } from "./recipes";

export interface SearchableRecipe {
  slug: string;
  title: string;
  description: string;
  ingredients: string;
  tags: string;
  illustration: string;
  titleHe: string;
  titleEn: string;
}

export function buildSearchIndex(
  recipes: Recipe[]
): SearchableRecipe[] {
  return recipes.map((r) => ({
    slug: r.slug,
    title: r.title.en,
    description: r.description.en,
    ingredients: r.ingredients.map((i) => `${i.en} ${i.he}`).join(" "),
    tags: r.tags.join(" "),
    illustration: r.illustration,
    titleHe: r.title.he,
    titleEn: r.title.en,
  }));
}

export function createFuse(items: SearchableRecipe[]): Fuse<SearchableRecipe> {
  return new Fuse(items, {
    keys: [
      { name: "title", weight: 3 },
      { name: "titleHe", weight: 3 },
      { name: "ingredients", weight: 2 },
      { name: "tags", weight: 1.5 },
      { name: "description", weight: 1 },
    ],
    threshold: 0.4,
    includeScore: true,
  });
}
