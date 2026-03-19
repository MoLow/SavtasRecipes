# Image Optimization for Web/Mobile

**Date:** 2026-03-19

## Problem
The site served 255MB of unoptimized images. Illustrations were ~940KB JPEG files (mislabeled as .webp, 1408x768). Scans were ~1.5MB each (4032x3024 iPhone resolution). Next.js image optimization is disabled (required for static export).

## Solution
Added a `prebuild` step using `sharp` that generates WebP variants at multiple sizes:

**Illustrations:** 400w (card thumbnails, ~23KB) and 800w (detail page, ~80KB)
**Scans:** 400w (thumbnails, ~15KB) and 1200w (lightbox, ~80KB)

Size reductions: illustrations 40x smaller for cards, scans 100x smaller for thumbnails.

## Implementation
- `website/scripts/optimize-images.ts` — generates WebP variants with progress bar
- `website/lib/image-utils.ts` — `optimizedImage()` helper for path generation (separate from `recipes.ts` to avoid `fs` import in client components)
- `website/package.json` — `prebuild` script runs optimization before `next build`
- All components updated to use optimized variants via `optimizedImage(path, width)`

## Files Modified
- `website/scripts/optimize-images.ts` — new
- `website/lib/image-utils.ts` — new
- `website/package.json` — prebuild script + dev deps
- `website/components/RecipeCard.tsx` — 400w illustrations
- `website/components/ScanViewer.tsx` — 400w thumbnails, 1200w lightbox
- `website/components/SearchResults.tsx` — 400w illustrations
- `website/components/SearchInput.tsx` — 400w illustrations
- `website/app/[locale]/recipe/[slug]/page.tsx` — 800w illustration
