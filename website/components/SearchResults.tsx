"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { SearchableRecipe } from "@/lib/search";
import { createFuse } from "@/lib/search";
import { optimizedImage } from "@/lib/image-utils";

interface SearchResultsProps {
  recipes: SearchableRecipe[];
  locale: "en" | "he";
}

export default function SearchResults({ recipes, locale }: SearchResultsProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const fuse = useMemo(() => createFuse(recipes), [recipes]);
  const isHebrew = locale === "he";

  const results = useMemo(() => {
    if (query.trim().length === 0) return recipes;
    return fuse.search(query).map((r) => r.item);
  }, [query, fuse, recipes]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  return (
    <div className="py-8 animate-fade-up">
      <h1 className="font-semibold text-3xl text-[var(--color-ink)] text-center mb-8">
        {isHebrew ? "חיפוש מתכונים" : "Search Recipes"}
      </h1>

      <div className="max-w-xl mx-auto mb-10">
        <div className="relative">
          <svg
            className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--color-ink-tertiary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isHebrew ? "חיפוש מתכונים..." : "Search recipes..."}
            dir={isHebrew ? "rtl" : "ltr"}
            autoFocus
            className="w-full ps-12 pe-4 py-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-glow)] rounded-2xl text-base text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] outline-none transition-all duration-200"
          />
        </div>
      </div>

      {results.length === 0 ? (
        <p className="text-center text-[var(--color-ink-tertiary)]">
          {isHebrew ? "לא נמצאו תוצאות" : "No results found"}
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {results.map((r, i) => (
            <Link
              key={r.slug}
              href={`/${locale}/recipe/${r.slug}`}
              className="group relative aspect-square rounded-xl overflow-hidden animate-card-enter"
              style={{
                animationDelay: `${i * 50}ms`,
                boxShadow: "var(--shadow-card)",
              }}
            >
              <Image
                src={`/${optimizedImage(r.illustration, 400)}`}
                alt={locale === "he" ? r.titleHe : r.titleEn}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div
                className="absolute inset-x-0 bottom-0 px-3 py-2.5 sm:px-4 sm:py-3"
                style={{
                  backgroundColor: "rgba(250, 247, 242, 0.82)",
                  backdropFilter: "blur(16px) saturate(1.2)",
                  WebkitBackdropFilter: "blur(16px) saturate(1.2)",
                }}
              >
                <h3 className="font-semibold text-sm sm:text-base text-[var(--color-ink)] truncate leading-tight">
                  {locale === "he" ? r.titleHe : r.titleEn}
                </h3>
                <p className="text-[10px] sm:text-xs text-[var(--color-ink-tertiary)] truncate mt-0.5">
                  {(locale === "he" ? r.tagsHe : r.tagsEn).slice(0, 3).join(" \u00b7 ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
