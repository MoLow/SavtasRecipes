"use client";

import type { SearchableRecipe } from "./search";

type Fuse<T> = import("fuse.js").default<T>;

interface LoadedIndex {
  fuse: Fuse<SearchableRecipe>;
  recipes: SearchableRecipe[];
}

let cache: Promise<LoadedIndex> | null = null;

export function loadSearchIndex(): Promise<LoadedIndex> {
  if (cache) return cache;
  cache = (async () => {
    const [{ default: FuseCtor }, res] = await Promise.all([
      import("fuse.js"),
      fetch("/search-index.json", { credentials: "omit" }),
    ]);
    const recipes = (await res.json()) as SearchableRecipe[];
    const fuse = new FuseCtor(recipes, {
      keys: [
        { name: "titleEn", weight: 3 },
        { name: "titleHe", weight: 3 },
        { name: "ingredients", weight: 2 },
        { name: "tagsEn", weight: 1.5 },
        { name: "tagsHe", weight: 1.5 },
        { name: "description", weight: 1 },
      ],
      threshold: 0.4,
      includeScore: true,
    });
    return { fuse, recipes };
  })();
  return cache;
}
