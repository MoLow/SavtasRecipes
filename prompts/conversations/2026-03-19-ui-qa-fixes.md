# UI QA Fixes & Scan Viewer Improvements

**Date:** 2026-03-19

## Summary

Fixed multiple UI issues identified during QA review of the redesigned website.

## Changes Made

### 1. Broken CSS class names
A previous `replace_all` of `font-display` to `font-semibold` created concatenated classes like `font-semiboldtext-2xl` (missing space) across 6 files:
- `website/app/[locale]/page.tsx`
- `website/app/[locale]/recipe/[slug]/page.tsx`
- `website/components/RecipeCard.tsx`
- `website/components/Navbar.tsx`
- `website/components/SearchResults.tsx`

All fixed with `font-semibold text-` (space restored).

### 2. Recipe page layout — unified hero + scans
The "Original Scans" section was separate from the hero and had a different width (`max-w-5xl` vs the hero's full-bleed recessed background). Merged them into one cohesive recessed section:
- Illustration + title at top
- Original scans below a subtle `border-t` divider
- All within the same `bg-[var(--color-bg-recessed)]` block

### 3. Lightbox overlay — React portal
The scan lightbox (`ScanViewer`) was rendered inside `<main className="max-w-6xl">`, which could constrain the `fixed` overlay if any ancestor had CSS containment. Fixed by rendering the lightbox via `createPortal(…, document.body)` so it always covers the full viewport regardless of parent styling.

### 4. Lightbox vertical alignment
The lightbox image was pushed to the top (`items-start`). Changed to `items-center` so images shorter than the viewport are vertically centered, while tall images remain scrollable.

## Files Modified
- `website/app/[locale]/page.tsx`
- `website/app/[locale]/recipe/[slug]/page.tsx`
- `website/components/RecipeCard.tsx`
- `website/components/Navbar.tsx`
- `website/components/SearchResults.tsx`
- `website/components/ScanViewer.tsx`
