import type { Metadata } from "next";
import Image from "next/image";
import { getAllRecipes, type Locale } from "@/lib/recipes";
import RecipeCard from "@/components/RecipeCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHebrew = locale === "he";
  const title = isHebrew ? "המתכונים של סבתא" : "Savta's Recipes";
  const description = isHebrew
    ? "מתכונים בכתב יד, שעברו דיגיטציה ותורגמו"
    : "Grandmother's handwritten recipes, digitized and translated";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${locale}`,
      locale: isHebrew ? "he_IL" : "en_US",
      images: [{ url: "/savta.jpg", width: 400, height: 400 }],
    },
  };
}

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
        <p className="text-[var(--color-ink-secondary)]">
          {isHebrew
            ? "אין עדיין מתכונים. הפעל את הפייפליין כדי לעבד סריקות."
            : "No recipes yet. Run the pipeline to process scans."}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Hero — Savta's portrait & dedication */}
      <div className="text-center pt-6 pb-10">
        <div
          className="relative mx-auto w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden mb-5"
          style={{
            boxShadow:
              "0 0 0 3px var(--color-bg), 0 0 0 5px var(--color-border-strong), 0 8px 24px rgba(44, 24, 16, 0.12)",
          }}
        >
          <Image
            src="/savta.webp"
            alt="Savta"
            fill
            className="object-cover object-top"
            sizes="144px"
            priority
          />
        </div>

        <h1 className="font-semibold text-3xl sm:text-4xl text-[var(--color-ink)]">
          {isHebrew ? "המתכונים של סבתא" : "Savta\u2019s Recipes"}
        </h1>

        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="h-px w-12 bg-[var(--color-border-strong)]" />
          <span className="text-[var(--color-accent)] text-xs">{"\u25C6"}</span>
          <span className="h-px w-12 bg-[var(--color-border-strong)]" />
        </div>

        <p className="text-[var(--color-ink-secondary)] text-sm mt-3 max-w-md mx-auto leading-relaxed">
          {isHebrew
            ? "מתכונים בכתב יד, שעברו דיגיטציה ותורגמו"
            : "Handwritten recipes, digitized & translated"}
        </p>

        <p className="text-[var(--color-ink-tertiary)] text-xs mt-4">
          {isHebrew
            ? "בזכות ניל אטלו ושבתי אטלו"
            : "Thanks to Neal Atlow & Stuart Atlow"}
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
