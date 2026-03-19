import { getAllRecipes, type Locale } from "@/lib/recipes";
import RecipeCard from "@/components/RecipeCard";

export default async function RecipeGrid({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const recipes = getAllRecipes();
  const isHebrew = locale === "he";

  if (recipes.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-up">
        <p className="text-[var(--color-ink-secondary)] font-body">
          {isHebrew
            ? "אין עדיין מתכונים. הפעל את הפייפליין כדי לעבד סריקות."
            : "No recipes yet. Run the pipeline to process scans."}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Site title */}
      <div className="text-center pt-4 pb-8">
        <h1 className="font-display text-3xl sm:text-4xl text-[var(--color-ink)]">
          {isHebrew ? "המתכונים של סבתא" : "Savta\u2019s Recipes"}
        </h1>
        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="h-px w-12 bg-[var(--color-border-strong)]" />
          <span className="text-[var(--color-accent)] text-xs">{"\u25C6"}</span>
          <span className="h-px w-12 bg-[var(--color-border-strong)]" />
        </div>
        <p className="text-[var(--color-ink-secondary)] text-sm mt-3 font-body">
          {isHebrew
            ? "מתכונים בכתב יד, שעברו דיגיטציה ותורגמו"
            : "Handwritten recipes, digitized & translated"}
        </p>
      </div>

      {/* Recipe grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {recipes.map((recipe, i) => (
          <RecipeCard
            key={recipe.id}
            slug={recipe.slug}
            title={recipe.title}
            illustration={recipe.illustration}
            tags={recipe.tags}
            locale={locale}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
