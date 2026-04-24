import { getAllRecipes } from '@/lib/recipes';
import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const BASE_URL = 'https://recipes.atlow.co.il';
const LOCALES = ['en', 'he'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const recipes = getAllRecipes();

  const staticRoutes: MetadataRoute.Sitemap = LOCALES.flatMap((locale) => [
    {
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/${locale}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/${locale}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
  ]);

  const recipeRoutes: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    recipes.map((recipe) => ({
      url: `${BASE_URL}/${locale}/recipe/${recipe.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))
  );

  return [...staticRoutes, ...recipeRoutes];
}
