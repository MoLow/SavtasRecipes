import { getAllRecipes, type Locale } from "@/lib/recipes";
import { buildSearchIndex } from "@/lib/search";
import SearchInput from "@/components/SearchInput";

export default async function SearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const recipes = getAllRecipes();
  const searchIndex = buildSearchIndex(recipes);
  const isHebrew = locale === "he";

  return (
    <div className="py-12">
      <h1 className="font-display text-3xl text-[var(--color-ink)] text-center mb-8">
        {isHebrew ? "חיפוש מתכונים" : "Search Recipes"}
      </h1>
      <SearchInput recipes={searchIndex} locale={locale} variant="page" />
    </div>
  );
}
