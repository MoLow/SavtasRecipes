"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { SearchableRecipe } from "@/lib/search";
import { loadSearchIndex } from "@/lib/search-client";
import { optimizedImage } from "@/lib/image-utils";
import PictureImage from "./PictureImage";

type Fuse<T> = import("fuse.js").default<T>;

interface SearchResultsProps {
  locale: "en" | "he";
}

export default function SearchResults({ locale }: SearchResultsProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [recipes, setRecipes] = useState<SearchableRecipe[] | null>(null);
  const [fuse, setFuse] = useState<Fuse<SearchableRecipe> | null>(null);
  const isHebrew = locale === "he";

  useEffect(() => {
    let cancelled = false;
    loadSearchIndex().then((res) => {
      if (cancelled) return;
      setRecipes(res.recipes);
      setFuse(res.fuse);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setQuery(q);
  }, [searchParams]);

  const results =
    recipes === null
      ? []
      : query.trim().length === 0 || fuse === null
        ? recipes
        : fuse.search(query).map((r) => r.item);

  return (
    <div className="py-8">
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

      {recipes === null ? (
        <p className="text-center text-[var(--color-ink-tertiary)]">
          {isHebrew ? "טוען..." : "Loading..."}
        </p>
      ) : results.length === 0 ? (
        <p className="text-center text-[var(--color-ink-tertiary)]">
          {isHebrew ? "לא נמצאו תוצאות" : "No results found"}
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {results.map((r) => (
            <Link
              key={r.slug}
              href={`/${locale}/recipe/${r.slug}`}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <PictureImage
                src={optimizedImage(r.illustration, 400)}
                alt={locale === "he" ? r.titleHe : r.titleEn}
                fill
                className="object-cover transition-transform duration-500 ease-out [@media(hover:hover)]:group-hover:scale-[1.04]"
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
                <h2 className="font-semibold text-sm sm:text-base text-[var(--color-ink)] truncate leading-tight">
                  {locale === "he" ? r.titleHe : r.titleEn}
                </h2>
                <p className="text-[10px] sm:text-xs text-[var(--color-ink-tertiary)] truncate mt-0.5">
                  {(locale === "he" ? r.tagsHe : r.tagsEn).slice(0, 3).join(" · ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
