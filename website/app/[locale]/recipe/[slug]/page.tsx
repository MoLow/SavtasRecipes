import Image from "next/image";
import { getAllRecipes, getRecipeBySlug, type Locale } from "@/lib/recipes";
import ScanViewer from "@/components/ScanViewer";

export const dynamicParams = false;

export async function generateStaticParams() {
  const recipes = getAllRecipes();
  if (recipes.length === 0) {
    return [{ slug: "_placeholder" }];
  }
  return recipes.map((recipe) => ({ slug: recipe.slug }));
}

export default async function RecipeDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as Locale;
  const recipe = getRecipeBySlug(slug);
  const isHebrew = locale === "he";

  if (!recipe) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-[var(--color-warm-brown)]">
          {isHebrew ? "המתכון לא נמצא" : "Recipe not found"}
        </h1>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      {/* Hero illustration */}
      <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-8">
        <Image
          src={`/${recipe.illustration}`}
          alt={recipe.title[locale]}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Title and description */}
      <h1 className="text-4xl font-bold text-[var(--color-warm-brown)] mb-3">
        {recipe.title[locale]}
      </h1>
      <p className="text-lg text-[var(--color-warm-tan)] mb-6">
        {recipe.description[locale]}
      </p>

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="text-sm px-3 py-1 rounded-full bg-white text-[var(--color-warm-brown)] shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Ingredients */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-[var(--color-warm-brown)] mb-4">
          {isHebrew ? "מרכיבים" : "Ingredients"}
        </h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[var(--color-warm-brown)]"
            >
              <span className="text-[var(--color-warm-gold)] mt-1">&#8226;</span>
              <span>{ing[locale]}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Instructions */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-[var(--color-warm-brown)] mb-4">
          {isHebrew ? "הוראות הכנה" : "Instructions"}
        </h2>
        <ol className="space-y-4">
          {recipe.instructions[locale].map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-warm-gold)] text-white flex items-center justify-center text-sm font-bold">
                {i + 1}
              </span>
              <p className="text-[var(--color-warm-brown)] pt-1">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* View original scan */}
      <section className="pt-6 border-t border-[var(--color-warm-tan)]/20">
        <ScanViewer
          scanFile={recipe.source.scanFile}
          recipeName={recipe.title.en}
        />
        <p className="mt-2 text-xs text-[var(--color-warm-tan)]">
          {isHebrew
            ? `עובד על ידי ${recipe.selectedModel === "gemini" ? "Gemini" : "Claude"}`
            : `Processed by ${recipe.selectedModel === "gemini" ? "Gemini" : "Claude"}`}
        </p>
      </section>
    </article>
  );
}
