# Website Redesign — Modern, Beautiful, Sleek

## Context

The current website design is ugly (warm-brown/cream scheme, oversized hero images, unnecessary language landing page). Complete redesign from scratch with a modern, clean aesthetic while keeping the existing data layer and Next.js static export architecture.

## Design System

### Color Palette
```css
--color-bg: #FAFAFA;               /* page background */
--color-bg-card: #FFFFFF;
--color-bg-subtle: #F3F4F6;        /* gray-100 */
--color-bg-nav: rgba(255,255,255,0.85);
--color-text-primary: #1F2937;      /* gray-800 */
--color-text-secondary: #6B7280;    /* gray-500 */
--color-text-muted: #9CA3AF;        /* gray-400 */
--color-accent: #E07A5F;            /* terracotta */
--color-accent-hover: #C96A52;
--color-accent-light: #FEF0EC;
--color-border: #E5E7EB;            /* gray-200 */
--color-tag-bg: #F0FDF4;            /* green-50 */
--color-tag-text: #166534;           /* green-800 */
```

### Typography
- **English**: Inter (Google Fonts) — `font-semibold tracking-tight` for headings
- **Hebrew**: Heebo — already loaded
- Refined type scale: `text-3xl` page titles, `text-xl` sections, `text-base` body

## Route Changes

```
/                        → redirect to /en (meta refresh, no landing page)
/[locale]                → recipe grid (home)
/[locale]/recipe/[slug]  → recipe detail
/[locale]/search         → search (moved under locale, was /search)
```

## Page Designs

### Home (`/[locale]`)
- No page heading — site name is in navbar
- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`
- Each card: **square** (`aspect-square`), full-bleed illustration, title overlaid on gradient scrim at bottom
- Hover: slight scale-up, shadow elevation

### Recipe Detail (`/[locale]/recipe/[slug]`)
- **Top**: illustration (moderate size, `md:w-1/3`) beside title + description + tags
- **Middle**: ingredients and instructions side-by-side (`md:grid-cols-[1fr_2fr]`)
  - Ingredients: clean list with subtle borders
  - Instructions: numbered steps with accent-colored circles
- **Bottom**: original scan thumbnails (click to open lightbox), processing attribution

### Search (`/[locale]/search`)
- Large centered search input
- Results grid (same as home)
- Navbar also has inline search with dropdown (top 6 results)

## Components

| Component | Status | Description |
|-----------|--------|-------------|
| `Navbar.tsx` | **New** | Sticky glass nav: logo, inline search, language toggle |
| `SearchInput.tsx` | **New** | Debounced Fuse.js input with dropdown results |
| `RecipeContent.tsx` | **New** | Ingredients + instructions layout |
| `RecipeCard.tsx` | **Rewrite** | Square card with gradient overlay |
| `LanguageToggle.tsx` | **Rewrite** | Segmented pill (EN \| HE) |
| `ScanViewer.tsx` | **Update** | Thumbnail grid + lightbox modal |
| `SearchBar.tsx` | **Delete** | Replaced by SearchInput |

## Files to Modify

| File | Change |
|------|--------|
| `website/app/globals.css` | Replace color palette + typography |
| `website/app/layout.tsx` | Load Inter font, minimal wrapper |
| `website/app/page.tsx` | Redirect to /en (meta refresh) |
| `website/app/[locale]/layout.tsx` | New Navbar, restructured shell |
| `website/app/[locale]/page.tsx` | New grid layout, no heading |
| `website/app/[locale]/recipe/[slug]/page.tsx` | Two-column layout redesign |
| `website/app/[locale]/search/page.tsx` | **New** — locale-aware search |
| `website/app/search/page.tsx` | Delete (moved under locale) |
| `website/components/Navbar.tsx` | **New** |
| `website/components/SearchInput.tsx` | **New** |
| `website/components/RecipeContent.tsx` | **New** |
| `website/components/RecipeCard.tsx` | Rewrite |
| `website/components/LanguageToggle.tsx` | Rewrite as segmented pill |
| `website/components/ScanViewer.tsx` | Update colors + thumbnails |
| `website/lib/search.ts` | Keep as-is |
| `website/lib/recipes.ts` | Keep as-is |

## Implementation Order

1. **Foundation**: globals.css, layout.tsx, fonts, root redirect
2. **Navigation**: Navbar, LanguageToggle, SearchInput
3. **Home page**: RecipeCard redesign, grid layout
4. **Recipe detail**: Two-column layout, RecipeContent, ScanViewer
5. **Search**: Move under locale, wire to navbar
6. **Polish**: RTL testing, mobile responsive, Cmd+K shortcut, verify build

## RTL Considerations
- Use Tailwind logical properties: `ps-/pe-/ms-/me-` instead of `pl-/pr-/ml-/mr-`
- `text-start`/`text-end` instead of `text-left`/`text-right`
- Flex/grid layouts auto-flip in RTL
- Language toggle gets `dir="ltr"` (language-neutral control)
- Search input `dir` matches locale

## Verification
1. `npm run build` — static export succeeds
2. Serve locally, check all pages in both EN and HE
3. Test search (type query, verify results)
4. Test recipe detail (illustration, ingredients, instructions, scan viewer)
5. Test mobile responsive (2-col grid, collapsed nav search)
6. Visual check: no remnants of old brown/cream design
