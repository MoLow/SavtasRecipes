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
      <div className="text-center py-20">
        <h1 className="font-display text-2xl text-[var(--color-ink)]">
          {isHebrew ? "המתכון לא נמצא" : "Recipe not found"}
        </h1>
      </div>
    );
  }

  return (
    <article className="animate-fade-up">
      {/* Hero section — recessed background */}
      <div className="bg-[var(--color-bg-recessed)] -mx-4 sm:-mx-6 px-4 sm:px-6 py-8 mb-10 rounded-xl">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 md:gap-10">
          {/* Illustration */}
          <div className="md:w-2/5 flex-shrink-0">
            <div
              className="relative aspect-[4/5] rounded-2xl overflow-hidden"
              style={{ boxShadow: "var(--shadow-card-hover)" }}
            >
              <Image
                src={`/${recipe.illustration}`}
                alt={recipe.title[locale]}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
          </div>

          {/* Title + description + tags */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-display text-3xl sm:text-4xl text-[var(--color-ink)] mb-4 leading-tight">
              {recipe.title[locale]}
            </h1>
            <p className="text-base text-[var(--color-ink-secondary)] leading-relaxed mb-5">
              {recipe.description[locale]}
            </p>
            {recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-mono px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-tag-bg)] text-[var(--color-tag-text)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ingredients + Instructions */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-[minmax(240px,1fr)_2fr] gap-8 md:gap-12 mb-12">
        {/* Ingredients — sticky on desktop */}
        <section className="md:sticky md:top-20 md:self-start">
          <h2 className="font-display text-xl text-[var(--color-ink)] mb-4">
            {isHebrew ? "מרכיבים" : "Ingredients"}
          </h2>
          <ul>
            {recipe.ingredients.map((ing, i) => (
              <li
                key={i}
                className="flex items-start gap-3 py-2.5 border-b border-[var(--color-border)] last:border-0"
              >
                <span className="text-[var(--color-accent)] mt-1 text-[8px]">{"\u25CF"}</span>
                <span className="text-[var(--color-ink)] text-sm leading-relaxed">
                  {ing[locale]}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Instructions — numbered with accent numerals */}
        <section>
          <h2 className="font-display text-xl text-[var(--color-ink)] mb-4">
            {isHebrew ? "הוראות הכנה" : "Instructions"}
          </h2>
          <ol className="space-y-5">
            {recipe.instructions[locale].map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 font-display text-2xl text-[var(--color-accent)] leading-none mt-0.5 w-8 text-end">
                  {i + 1}
                </span>
                <p className="text-[var(--color-ink)] text-sm leading-[1.75] pt-1 border-b border-[var(--color-border)] pb-5 flex-1">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Original scans — "The Original" */}
      <div className="max-w-5xl mx-auto border-t border-[var(--color-border)] pt-10 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          <h2 className="font-display text-xl text-[var(--color-ink)] px-4">
            {isHebrew ? "המקור" : "The Original"}
          </h2>
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        <div className="bg-[var(--color-bg-recessed)] rounded-xl p-6 sm:p-8 flex justify-center">
          <ScanViewer
            scanFiles={recipe.source.scanFiles}
            recipeName={recipe.title.en}
          />
        </div>

        <p className="mt-4 text-xs font-mono text-[var(--color-ink-tertiary)] text-center">
          {isHebrew
            ? `עובד על ידי ${recipe.selectedModel === "gemini" ? "Gemini" : "Claude"}`
            : `Processed by ${recipe.selectedModel === "gemini" ? "Gemini" : "Claude"}`}
        </p>
      </div>
    </article>
  );
}
