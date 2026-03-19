import Link from "next/link";
import { getAllRecipes, type Locale } from "@/lib/recipes";
import { buildSearchIndex } from "@/lib/search";
import LanguageToggle from "./LanguageToggle";
import SearchInput from "./SearchInput";

interface NavbarProps {
  locale: Locale;
}

export default function Navbar({ locale }: NavbarProps) {
  const isHebrew = locale === "he";
  const recipes = getAllRecipes();
  const searchIndex = buildSearchIndex(recipes);

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--color-border)]"
      style={{
        backgroundColor: "var(--color-bg-nav)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "var(--shadow-nav)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
        <Link
          href={`/${locale}`}
          className="font-semibold text-lg text-[var(--color-ink)] hover:text-[var(--color-accent)] transition-colors flex-shrink-0"
        >
          {isHebrew ? "המתכונים של סבתא" : "Savta\u2019s Recipes"}
        </Link>

        <div className="hidden sm:block flex-1 max-w-xs mx-4">
          <SearchInput recipes={searchIndex} locale={locale} />
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          {/* About — text on desktop, icon on mobile */}
          <Link
            href={`/${locale}/about`}
            className="hidden sm:inline text-xs text-[var(--color-ink-tertiary)] hover:text-[var(--color-accent)] transition-colors"
          >
            {isHebrew ? "איך זה עובד" : "How It Works"}
          </Link>
          <Link
            href={`/${locale}/about`}
            className="sm:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[var(--color-bg-recessed)] transition-colors"
            aria-label={isHebrew ? "איך זה עובד" : "How It Works"}
          >
            <svg
              className="text-[var(--color-ink-secondary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
              <path strokeLinecap="round" strokeWidth={1.5} d="M12 16v-4m0-4h.01" />
            </svg>
          </Link>

          {/* Search — icon on mobile only */}
          <Link
            href={`/${locale}/search`}
            className="sm:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-[var(--color-bg-recessed)] transition-colors"
            aria-label={isHebrew ? "חיפוש" : "Search"}
          >
            <svg
              className="text-[var(--color-ink-secondary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>

          <LanguageToggle currentLocale={locale} />
        </div>
      </div>
    </header>
  );
}
