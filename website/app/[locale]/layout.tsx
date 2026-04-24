import Navbar from "@/components/Navbar";
import WebMCPProvider from "@/components/WebMCPProvider";
import { getAllRecipes, type Locale } from "@/lib/recipes";
import { buildSearchIndex } from "@/lib/search";

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
  const searchIndex = buildSearchIndex(getAllRecipes());

  return (
    <div dir={isHebrew ? "rtl" : "ltr"} lang={locale}>
      <Navbar locale={locale} />
      <WebMCPProvider recipes={searchIndex} locale={locale} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
