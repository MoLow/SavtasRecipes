"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SearchableRecipe } from "@/lib/search";
import { createFuse } from "@/lib/search";
import type { Locale } from "@/lib/recipes";
import { optimizedImage } from "@/lib/image-utils";

interface SearchInputProps {
  recipes: SearchableRecipe[];
  locale: Locale;
  variant?: "navbar" | "page";
}

export default function SearchInput({ recipes, locale, variant = "navbar" }: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchableRecipe[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const fuseRef = useRef(createFuse(recipes));
  const router = useRouter();

  // Total selectable items: results + "All results" link
  const totalItems = results.length + (results.length > 0 ? 1 : 0);

  const search = useCallback((q: string) => {
    if (q.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    const found = fuseRef.current.search(q).slice(0, 5).map((r) => r.item);
    setResults(found);
    setIsOpen(found.length > 0);
    setActiveIndex(-1);
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
        setActiveIndex(-1);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handleOutside(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && results.length > 0) {
        setIsOpen(true);
      }
      setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        router.push(`/${locale}/recipe/${results[activeIndex].slug}`);
        setIsOpen(false);
        setQuery("");
      } else if (activeIndex === results.length) {
        // "All results" link
        router.push(`/${locale}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`);
        setIsOpen(false);
      } else if (query.trim()) {
        router.push(`/${locale}/search?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      }
    }
  }

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
          onKeyDown={handleInputKeyDown}
          placeholder={locale === "he" ? "חיפוש מתכונים..." : "Search recipes..."}
          dir={locale === "he" ? "rtl" : "ltr"}
          role="combobox"
          aria-expanded={isOpen}
          aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
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
        <div
          className="absolute top-full mt-2 w-full bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border)] overflow-hidden z-50 animate-fade-in"
          style={{ boxShadow: "var(--shadow-card-hover)" }}
          role="listbox"
        >
          {results.map((r, i) => (
            <Link
              key={r.slug}
              id={`search-item-${i}`}
              ref={(el) => { itemRefs.current[i] = el; }}
              href={`/${locale}/recipe/${r.slug}`}
              onPointerDown={() => { setIsOpen(false); setQuery(""); }}
              onPointerEnter={() => setActiveIndex(i)}
              role="option"
              aria-selected={activeIndex === i}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                activeIndex === i
                  ? "bg-[var(--color-bg-recessed)]"
                  : "[@media(hover:hover)]:hover:bg-[var(--color-bg-recessed)]"
              }`}
            >
              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={`/${optimizedImage(r.illustration, 400)}`}
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
            id={`search-item-${results.length}`}
            ref={(el) => { itemRefs.current[results.length] = el; }}
            href={`/${locale}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`}
            onPointerDown={() => setIsOpen(false)}
            onPointerEnter={() => setActiveIndex(results.length)}
            role="option"
            aria-selected={activeIndex === results.length}
            className={`block px-4 py-2.5 text-xs text-[var(--color-accent)] transition-colors border-t border-[var(--color-border)] text-center ${
              activeIndex === results.length
                ? "bg-[var(--color-accent-light)]"
                : "[@media(hover:hover)]:hover:bg-[var(--color-accent-light)]"
            }`}
          >
            {locale === "he" ? "→ כל התוצאות" : "All results →"}
          </Link>
        </div>
      )}
    </div>
  );
}
