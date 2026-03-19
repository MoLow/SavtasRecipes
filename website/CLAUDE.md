# Savta's Recipes Website

## Purpose

Static bilingual (English/Hebrew) recipe browsing website.

## Tech

- Next.js 15+ with App Router, static export (`output: 'export'`)
- Tailwind CSS with RTL support
- Fuse.js for client-side search
- Deployed to GitHub Pages

## Data

Reads recipe JSON from `../data/recipes/` at build time.
Images (illustrations, scans) are in `public/`.

## Routes

- `/` — Landing page with language selection
- `/[locale]` — Recipe grid (locale = `"he"` | `"en"`)
- `/[locale]/recipe/[slug]` — Recipe detail page
- `/search` — Search across all recipes

## Conventions

- All text content comes from recipe JSON, no hardcoded strings
- Hebrew pages use `dir="rtl"`, English pages use `dir="ltr"`
- Components are in `components/`, data loading in `lib/`
- Use Next.js Image component for all images

## Development

```
npm run dev    # Start dev server on localhost:3000
npm run build  # Generate static site to out/
```
