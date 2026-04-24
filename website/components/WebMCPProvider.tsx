"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createFuse, type SearchableRecipe } from "@/lib/search";
import type { Locale } from "@/lib/recipes";

interface WebMCPProviderProps {
  recipes: SearchableRecipe[];
  locale: Locale;
}

export default function WebMCPProvider({ recipes, locale }: WebMCPProviderProps) {
  const router = useRouter();

  useEffect(() => {
    const nav = navigator as Navigator & {
      modelContext?: {
        provideContext: (ctx: unknown) => void;
      };
    };

    if (!nav.modelContext?.provideContext) return;

    const fuse = createFuse(recipes);

    nav.modelContext.provideContext({
      tools: [
        {
          name: "search_recipes",
          description:
            "Search Savta's recipe collection by name, ingredient, or tag. Returns matching recipes with slugs and URLs.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query — recipe name, ingredient, or tag",
              },
            },
            required: ["query"],
          },
          execute: (params: { query: string }) => {
            const results = fuse
              .search(params.query)
              .slice(0, 10)
              .map((r) => ({
                slug: r.item.slug,
                titleEn: r.item.titleEn,
                titleHe: r.item.titleHe,
                tags: locale === "he" ? r.item.tagsHe : r.item.tagsEn,
                url: `/${locale}/recipe/${r.item.slug}`,
              }));
            return { results };
          },
        },
        {
          name: "list_all_recipes",
          description:
            "List every recipe in Savta's collection with names, tags, and page URLs.",
          inputSchema: {
            type: "object",
            properties: {},
          },
          execute: () => ({
            recipes: recipes.map((r) => ({
              slug: r.slug,
              titleEn: r.titleEn,
              titleHe: r.titleHe,
              tags: locale === "he" ? r.tagsHe : r.tagsEn,
              url: `/${locale}/recipe/${r.slug}`,
            })),
          }),
        },
        {
          name: "navigate_to_recipe",
          description: "Navigate the browser to a specific recipe page.",
          inputSchema: {
            type: "object",
            properties: {
              slug: {
                type: "string",
                description: "Recipe slug from search_recipes or list_all_recipes",
              },
            },
            required: ["slug"],
          },
          execute: (params: { slug: string }) => {
            const url = `/${locale}/recipe/${params.slug}`;
            router.push(url);
            return { navigating: true, url };
          },
        },
        {
          name: "navigate_to_search",
          description:
            "Navigate to the recipe search page, optionally pre-filled with a query.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Optional search query to pre-fill",
              },
            },
          },
          execute: (params: { query?: string }) => {
            const url = `/${locale}/search${params.query ? `?q=${encodeURIComponent(params.query)}` : ""}`;
            router.push(url);
            return { navigating: true, url };
          },
        },
      ],
    });
  }, [recipes, locale, router]);

  return null;
}
