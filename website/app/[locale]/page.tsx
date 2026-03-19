import { getAllRecipes, type Locale } from "@/lib/recipes";
import RecipeCard from "@/components/RecipeCard";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "he" }];
}

export default function RecipeGrid({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  const recipes = getAllRecipes();
  const isHebrew = locale === "he";

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--color-warm-brown)] mb-8">
        {isHebrew ? "כל המתכונים" : "All Recipes"}
      </h1>

      {recipes.length === 0 ? (
        <p className="text-[var(--color-warm-tan)] text-center py-12">
          {isHebrew
            ? "אין עדיין מתכונים. הפעל את הפייפליין כדי לעבד סריקות."
            : "No recipes yet. Run the pipeline to process scans."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              slug={recipe.slug}
              title={recipe.title}
              tags={recipe.tags}
              illustration={recipe.illustration}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
