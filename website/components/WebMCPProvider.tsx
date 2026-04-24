"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadSearchIndex } from "@/lib/search-client";
import type { Locale } from "@/lib/recipes";

interface WebMCPProviderProps {
  locale: Locale;
}

type ToolImpl = (input: unknown) => unknown;

declare global {
  interface Window {
    __webmcpImpl?: Record<string, ToolImpl>;
  }
}

// Tool registration happens synchronously in the inline script emitted by
// the locale layout (see components/webmcp-inline.ts). This component
// supplies the real implementations that the inline stubs delegate to via
// window.__webmcpImpl. Splitting registration from implementation lets
// detection bots observe registerTool() before React hydration while
// still letting real invocations use the router and the Fuse index.
export default function WebMCPProvider({ locale }: WebMCPProviderProps) {
  const router = useRouter();

  useEffect(() => {
    let indexPromise: ReturnType<typeof loadSearchIndex> | null = null;
    const getIndex = () => (indexPromise ??= loadSearchIndex());

    const impls: Record<string, ToolImpl> = {
      search_recipes: async (input) => {
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
      list_all_recipes: async () => {
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
      navigate_to_recipe: (input) => {
        const { slug } = (input as { slug: string }) ?? { slug: "" };
        const url = `/${locale}/recipe/${slug}`;
        router.push(url);
        return { navigating: true, url };
      },
      navigate_to_search: (input) => {
        const { query } = (input as { query?: string }) ?? {};
        const url = `/${locale}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`;
        router.push(url);
        return { navigating: true, url };
      },
    };

    window.__webmcpImpl = { ...window.__webmcpImpl, ...impls };

    return () => {
      if (!window.__webmcpImpl) return;
      for (const name of Object.keys(impls)) {
        delete window.__webmcpImpl[name];
      }
    };
  }, [locale, router]);

  return null;
}
