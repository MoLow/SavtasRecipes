"use client";

import { useEffect } from "react";
import type { RecipeIndex } from "@/lib/recipes";

interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: object;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
}

interface ModelContext {
  provideContext: (options: { tools: WebMCPTool[] }) => Promise<void>;
}

export default function WebMCPProvider({
  recipes,
}: {
  recipes: RecipeIndex[];
}) {
  useEffect(() => {
    const modelContext = (
      navigator as Navigator & { modelContext?: ModelContext }
    ).modelContext;
    if (!modelContext) return;

    modelContext.provideContext({
      tools: [
        {
          name: "list_recipes",
          description:
            "List all recipes available on Savta's Recipes — a collection of grandmother's handwritten recipes, digitized and translated into English and Hebrew.",
          inputSchema: {
            type: "object",
            properties: {},
          },
          execute: async () => recipes,
        },
        {
          name: "search_recipes",
          description:
            "Search for recipes by name, ingredient, or tag across Savta's bilingual recipe collection.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description:
                  "Search term to match against recipe names, descriptions, and tags (English or Hebrew)",
              },
            },
            required: ["query"],
          },
          execute: async (input) => {
            const query = String(input.query ?? "").toLowerCase();
            return recipes.filter(
              (r) =>
                r.titleEn.toLowerCase().includes(query) ||
                r.titleHe.includes(query) ||
                r.descriptionEn.toLowerCase().includes(query) ||
                r.tags.some((t) => t.toLowerCase().includes(query))
            );
          },
        },
        {
          name: "get_recipe_url",
          description:
            "Get the URL for a specific recipe page given its slug and preferred language.",
          inputSchema: {
            type: "object",
            properties: {
              slug: {
                type: "string",
                description: "The recipe slug (URL identifier)",
              },
              locale: {
                type: "string",
                enum: ["en", "he"],
                description: "Language preference — 'en' (English) or 'he' (Hebrew). Defaults to 'en'.",
              },
            },
            required: ["slug"],
          },
          execute: async (input) => {
            const slug = String(input.slug ?? "");
            const locale = input.locale === "he" ? "he" : "en";
            const recipe = recipes.find((r) => r.slug === slug);
            if (!recipe) return { error: `Recipe '${slug}' not found` };
            return {
              slug,
              url: `/${locale}/recipe/${slug}`,
              title: locale === "he" ? recipe.titleHe : recipe.titleEn,
            };
          },
        },
      ],
    });
  }, [recipes]);

  return null;
}
