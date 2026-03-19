"use client";

import { useState, useMemo } from "react";
import { createFuse, type SearchableRecipe } from "@/lib/search";
import RecipeCard from "./RecipeCard";
import type { Locale } from "@/lib/recipes";

interface SearchBarProps {
  recipes: SearchableRecipe[];
  locale: Locale;
}

export default function SearchBar({ recipes, locale }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const fuse = useMemo(() => createFuse(recipes), [recipes]);

  const results = query.trim()
    ? fuse.search(query).map((r) => r.item)
    : recipes;

  const placeholder =
    locale === "he" ? "חיפוש מתכונים..." : "Search recipes...";

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-white shadow-sm border border-[var(--color-warm-tan)]/30 text-[var(--color-warm-brown)] placeholder:text-[var(--color-warm-tan)] focus:outline-none focus:ring-2 focus:ring-[var(--color-warm-gold)]/50"
        dir={locale === "he" ? "rtl" : "ltr"}
      />
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((r) => (
          <RecipeCard
            key={r.slug}
            slug={r.slug}
            title={{ en: r.titleEn, he: r.titleHe }}
            tags={r.tags.split(" ")}
            illustration={r.illustration}
            locale={locale}
          />
        ))}
      </div>
      {results.length === 0 && query.trim() && (
        <p className="text-center text-[var(--color-warm-tan)] mt-8">
          {locale === "he" ? "לא נמצאו מתכונים" : "No recipes found"}
        </p>
      )}
    </div>
  );
}
