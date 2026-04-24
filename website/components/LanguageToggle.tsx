"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/recipes";

interface LanguageToggleProps {
  currentLocale: Locale;
}

export default function LanguageToggle({ currentLocale }: LanguageToggleProps) {
  const pathname = usePathname();

  function getPath(locale: Locale) {
    return pathname.replace(`/${currentLocale}`, `/${locale}`);
  }

  function rememberLocale(locale: Locale) {
    localStorage.setItem("locale", locale);
    // Cookie is read by the CloudFront edge function to 302 `/` to the
    // right locale for bookmarked bare-domain visits.
    document.cookie = `locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  }

  return (
    <div
      dir="ltr"
      className="flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg-recessed)] p-0.5"
    >
      <Link
        href={getPath("en")}
        onClick={() => rememberLocale("en")}
        className={`px-3.5 py-1.5 sm:px-3 sm:py-1 rounded-full text-xs transition-all duration-200 ${
          currentLocale === "en"
            ? "bg-[var(--color-bg-elevated)] text-[var(--color-ink)] shadow-sm"
            : "text-[var(--color-ink-tertiary)] [@media(hover:hover)]:hover:text-[var(--color-ink-secondary)]"
        }`}
      >
        EN
      </Link>
      <Link
        href={getPath("he")}
        onClick={() => rememberLocale("he")}
        className={`px-3.5 py-1.5 sm:px-3 sm:py-1 rounded-full text-xs transition-all duration-200 ${
          currentLocale === "he"
            ? "bg-[var(--color-bg-elevated)] text-[var(--color-ink)] shadow-sm"
            : "text-[var(--color-ink-tertiary)] [@media(hover:hover)]:hover:text-[var(--color-ink-secondary)]"
        }`}
      >
        עב
      </Link>
    </div>
  );
}
