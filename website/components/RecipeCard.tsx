import Link from "next/link";
import type { Locale } from "@/lib/recipes";
import { optimizedImage } from "@/lib/image-utils";
import PictureImage from "./PictureImage";

interface RecipeCardProps {
  slug: string;
  title: { en: string; he: string };
  illustration: string;
  tags?: Array<{ en: string; he: string }>;
  locale: Locale;
  priority?: boolean;
}

export default function RecipeCard({
  slug,
  title,
  illustration,
  tags,
  locale,
  priority = false,
}: RecipeCardProps) {
  return (
    <Link
      href={`/${locale}/recipe/${slug}`}
      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
      style={
        priority
          ? { boxShadow: "var(--shadow-card)" }
          : {
              boxShadow: "var(--shadow-card)",
              contentVisibility: "auto",
              containIntrinsicSize: "200px 200px",
            }
      }
    >
      <PictureImage
        src={optimizedImage(illustration, 400)}
        alt={title[locale]}
        fill
        className="object-cover transition-transform duration-500 ease-out [@media(hover:hover)]:group-hover:scale-[1.04]"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        priority={priority}
      />

      {/* Frosted glass title band */}
      <div className="frosted-glass absolute inset-x-0 bottom-0 px-3 py-2.5 sm:px-4 sm:py-3">
        <h2 className="font-semibold text-sm sm:text-base text-[var(--color-ink)] truncate leading-tight">
          {title[locale]}
        </h2>
        {tags && tags.length > 0 && (
          <p className="text-[10px] sm:text-xs text-[var(--color-ink-tertiary)] truncate mt-0.5">
            {tags.slice(0, 3).map((t) => t[locale]).join(" \u00b7 ")}
          </p>
        )}
      </div>

      {/* Hover lift effect */}
      <div
        className="absolute inset-0 transition-shadow duration-300 rounded-xl [@media(hover:hover)]:group-hover:shadow-[var(--shadow-card-hover)]"
        style={{ pointerEvents: "none" }}
      />
    </Link>
  );
}
