"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadSearchIndex } from "@/lib/search-client";
import type { Locale } from "@/lib/recipes";

interface WebMCPProviderProps {
  locale: Locale;
}

type RegisterTool = (tool: ModelContextTool, options?: { signal?: AbortSignal }) => unknown;
type ProvideContext = (ctx: { tools: ModelContextTool[] }) => unknown;

interface ModelContextTool {
  name: string;
  description: string;
  inputSchema?: object;
  execute: (input: unknown) => unknown;
  annotations?: Record<string, unknown>;
}

interface ModelContextShim {
  registerTool?: RegisterTool;
  provideContext?: ProvideContext;
}

export default function WebMCPProvider({ locale }: WebMCPProviderProps) {
  const router = useRouter();

  useEffect(() => {
    const nav = navigator as Navigator & { modelContext?: ModelContextShim };
    const ctx = nav.modelContext;
    if (!ctx) return;

    const controller = new AbortController();
    // Lazy search-index loader: registration is synchronous, the heavy Fuse
    // index only loads on first tool invocation. This keeps registration
    // within the checker's probe window even when the JS bundle is large.
    let indexPromise: ReturnType<typeof loadSearchIndex> | null = null;
    const getIndex = () => (indexPromise ??= loadSearchIndex());

    const tools: ModelContextTool[] = [
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
        annotations: { readOnlyHint: true },
        execute: async (input: unknown) => {
          const { query } = (input as { query: string }) ?? { query: "" };
          const { fuse } = await getIndex();
          return {
            results: fuse
              .search(query)
              .slice(0, 10)
              .map((r) => ({
                slug: r.item.slug,
                titleEn: r.item.titleEn,
                titleHe: r.item.titleHe,
                tags: locale === "he" ? r.item.tagsHe : r.item.tagsEn,
                url: `/${locale}/recipe/${r.item.slug}`,
              })),
          };
        },
      },
      {
        name: "list_all_recipes",
        description:
          "List every recipe in Savta's collection with names, tags, and page URLs.",
        inputSchema: { type: "object", properties: {} },
        annotations: { readOnlyHint: true },
        execute: async () => {
          const { recipes } = await getIndex();
          return {
            recipes: recipes.map((r) => ({
              slug: r.slug,
              titleEn: r.titleEn,
              titleHe: r.titleHe,
              tags: locale === "he" ? r.tagsHe : r.tagsEn,
              url: `/${locale}/recipe/${r.slug}`,
            })),
          };
        },
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
        execute: (input: unknown) => {
          const { slug } = (input as { slug: string }) ?? { slug: "" };
          const url = `/${locale}/recipe/${slug}`;
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
        execute: (input: unknown) => {
          const { query } = (input as { query?: string }) ?? {};
          const url = `/${locale}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`;
          router.push(url);
          return { navigating: true, url };
        },
      },
    ];

    // Prefer the current spec (registerTool per tool). Fall back to the
    // older provideContext({tools}) form for shims that still implement it.
    if (typeof ctx.registerTool === "function") {
      for (const tool of tools) {
        ctx.registerTool(tool, { signal: controller.signal });
      }
    } else if (typeof ctx.provideContext === "function") {
      ctx.provideContext({ tools });
    }

    return () => controller.abort();
  }, [locale, router]);

  return null;
}
