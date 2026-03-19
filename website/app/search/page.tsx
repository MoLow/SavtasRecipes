import { getAllRecipes } from "@/lib/recipes";
import { buildSearchIndex } from "@/lib/search";
import SearchBar from "@/components/SearchBar";

export default function SearchPage() {
  const recipes = getAllRecipes();
  const searchIndex = buildSearchIndex(recipes);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[var(--color-warm-brown)] mb-6">
        Search Recipes
      </h1>
      <SearchBar recipes={searchIndex} locale="en" />
    </div>
  );
}
