"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/recipes";

interface LanguageToggleProps {
  currentLocale: Locale;
}

export default function LanguageToggle({
  currentLocale,
}: LanguageToggleProps) {
  const pathname = usePathname();
  const otherLocale: Locale = currentLocale === "en" ? "he" : "en";
  const newPath = pathname.replace(`/${currentLocale}`, `/${otherLocale}`);

  return (
    <Link
      href={newPath}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white shadow-sm text-sm font-medium text-[var(--color-warm-brown)] transition-colors"
    >
      {currentLocale === "en" ? "עברית" : "English"}
    </Link>
  );
}
