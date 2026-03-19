import Link from "next/link";
import LanguageToggle from "@/components/LanguageToggle";
import type { Locale } from "@/lib/recipes";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "he" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const isHebrew = locale === "he";

  return (
    <div dir={isHebrew ? "rtl" : "ltr"} lang={locale}>
      <header className="sticky top-0 z-40 bg-[var(--color-warm-cream)]/95 backdrop-blur-sm border-b border-[var(--color-warm-tan)]/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/${locale}`}
            className="text-xl font-bold text-[var(--color-warm-brown)] hover:text-[var(--color-warm-red)] transition-colors"
          >
            {isHebrew ? "המתכונים של סבתא" : "Savta's Recipes"}
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="px-3 py-1.5 rounded-lg text-sm text-[var(--color-warm-brown)] hover:bg-white/80 transition-colors"
            >
              {isHebrew ? "חיפוש" : "Search"}
            </Link>
            <LanguageToggle currentLocale={locale} />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
