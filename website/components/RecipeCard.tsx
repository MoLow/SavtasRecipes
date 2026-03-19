import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/recipes";
import { optimizedImage } from "@/lib/image-utils";

interface RecipeCardProps {
  slug: string;
  title: { en: string; he: string };
  illustration: string;
  tags?: Array<{ en: string; he: string }>;
  locale: Locale;
  index?: number;
}

export default function RecipeCard({
  slug,
  title,
  illustration,
  tags,
  locale,
  index = 0,
}: RecipeCardProps) {
  return (
    <Link
      href={`/${locale}/recipe/${slug}`}
      className="group relative aspect-square rounded-xl overflow-hidden animate-card-enter"
      style={{
        animationDelay: `${index * 50}ms`,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <Image
        src={`/${optimizedImage(illustration, 400)}`}
        alt={title[locale]}
        fill
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />

      {/* Frosted glass title band */}
      <div
        className="absolute inset-x-0 bottom-0 px-3 py-2.5 sm:px-4 sm:py-3"
        style={{
          backgroundColor: "rgba(250, 247, 242, 0.82)",
          backdropFilter: "blur(16px) saturate(1.2)",
          WebkitBackdropFilter: "blur(16px) saturate(1.2)",
        }}
      >
        <h3 className="font-semibold text-sm sm:text-base text-[var(--color-ink)] truncate leading-tight">
          {title[locale]}
        </h3>
        {tags && tags.length > 0 && (
          <p className="text-[10px] sm:text-xs text-[var(--color-ink-tertiary)] truncate mt-0.5">
            {tags.slice(0, 3).map((t) => t[locale]).join(" \u00b7 ")}
          </p>
        )}
      </div>

      {/* Hover lift effect */}
      <div
        className="absolute inset-0 transition-shadow duration-300 rounded-xl group-hover:shadow-[var(--shadow-card-hover)]"
        style={{ pointerEvents: "none" }}
      />
    </Link>
  );
}
