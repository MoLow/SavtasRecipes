"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SearchableRecipe } from "@/lib/search";
import { createFuse } from "@/lib/search";
import type { Locale } from "@/lib/recipes";

interface SearchInputProps {
  recipes: SearchableRecipe[];
  locale: Locale;
  variant?: "navbar" | "page";
}

export default function SearchInput({ recipes, locale, variant = "navbar" }: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchableRecipe[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fuseRef = useRef(createFuse(recipes));
  const router = useRouter();

  const search = useCallback((q: string) => {
    if (q.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const found = fuseRef.current.search(q).slice(0, 5).map((r) => r.item);
    setResults(found);
    setIsOpen(found.length > 0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 150);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isPage = variant === "page";

  return (
    <div ref={containerRef} className={`relative ${isPage ? "w-full max-w-2xl mx-auto" : ""}`}>
      <div className="relative">
        <svg
          className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-tertiary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          width="16"
          height="16"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              router.push(`/${locale}/search?q=${encodeURIComponent(query)}`);
              setIsOpen(false);
            }
          }}
          placeholder={locale === "he" ? "חיפוש מתכונים..." : "Search recipes..."}
          dir={locale === "he" ? "rtl" : "ltr"}
          className={`w-full ps-9 pe-3 bg-[var(--color-bg-recessed)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-glow)] focus:bg-[var(--color-bg-elevated)] rounded-full text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] outline-none transition-all duration-200 ${
            isPage ? "py-3.5 ps-11 text-base" : "py-2"
          }`}
        />
        {!isPage && (
          <kbd className="absolute end-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex text-[10px] text-[var(--color-ink-tertiary)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border)] overflow-hidden z-50 animate-fade-in"
          style={{ boxShadow: "var(--shadow-card-hover)" }}
        >
          {results.map((r) => (
            <Link
              key={r.slug}
              href={`/${locale}/recipe/${r.slug}`}
              onClick={() => { setIsOpen(false); setQuery(""); }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-recessed)] transition-colors"
            >
              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={`/${r.illustration}`}
                  alt={locale === "he" ? r.titleHe : r.titleEn}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[var(--color-ink)] truncate">
                  {locale === "he" ? r.titleHe : r.titleEn}
                </p>
                <p className="text-xs text-[var(--color-ink-tertiary)] truncate">
                  {(locale === "he" ? r.tagsHe : r.tagsEn).slice(0, 3).join(" \u00b7 ")}
                </p>
              </div>
            </Link>
          ))}
          <Link
            href={`/${locale}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`}
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors border-t border-[var(--color-border)] text-center"
          >
            {locale === "he" ? "→ כל התוצאות" : "All results →"}
          </Link>
        </div>
      )}
    </div>
  );
}
