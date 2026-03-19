import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/recipes";

interface RecipeCardProps {
  slug: string;
  title: { en: string; he: string };
  tags: string[];
  illustration: string;
  locale: Locale;
}

export default function RecipeCard({
  slug,
  title,
  tags,
  illustration,
  locale,
}: RecipeCardProps) {
  return (
    <Link
      href={`/${locale}/recipe/${slug}`}
      className="group block rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-[4/3]">
        <Image
          src={`/${illustration}`}
          alt={title[locale]}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-[var(--color-warm-brown)]">
          {title[locale]}
        </h3>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-warm-cream)] text-[var(--color-warm-brown)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
