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

  return (
    <div
      dir="ltr"
      className="flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg-recessed)] p-0.5"
    >
      <Link
        href={getPath("en")}
        onClick={() => localStorage.setItem("locale", "en")}
        className={`px-3 py-1 rounded-full text-xs transition-all duration-200 ${
          currentLocale === "en"
            ? "bg-[var(--color-bg-elevated)] text-[var(--color-ink)] shadow-sm"
            : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]"
        }`}
      >
        EN
      </Link>
      <Link
        href={getPath("he")}
        onClick={() => localStorage.setItem("locale", "he")}
        className={`px-3 py-1 rounded-full text-xs transition-all duration-200 ${
          currentLocale === "he"
            ? "bg-[var(--color-bg-elevated)] text-[var(--color-ink)] shadow-sm"
            : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]"
        }`}
      >
        עב
      </Link>
    </div>
  );
}
