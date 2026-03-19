import { Suspense } from "react";
import { getAllRecipes, type Locale } from "@/lib/recipes";
import { buildSearchIndex } from "@/lib/search";
import SearchResults from "@/components/SearchResults";

export default async function SearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const recipes = getAllRecipes();
  const searchIndex = buildSearchIndex(recipes);

  return (
    <Suspense>
      <SearchResults recipes={searchIndex} locale={locale} />
    </Suspense>
  );
}
