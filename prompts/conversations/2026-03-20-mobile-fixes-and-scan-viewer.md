# 2026-03-20 — Mobile Fixes, Social Tags & Scan Viewer Improvements

## Summary

Deep-dive debugging session fixing iOS Chrome double-tap issue, plus several UX improvements.

---

## 1. iOS Double-Tap Bug — Root Cause & Fix

### Symptoms
All links on the site required two taps on iPhone Chrome to navigate.

### Debugging process
- Playwright browser used to inspect the live site at `recipes.atlow.co.il/he`
- Confirmed `hover:hover=false` on iPhone Chrome (good)
- `touch-action: manipulation` was already deployed ✓
- No DOM elements blocking touches ✓
- No non-passive touch listeners registered ✓
- Event log showed: `pointerdown → touchstart → touchend` — but **no `click` event**
- Target of all events: `DIV` or `IMG` inside the `<a>` tag

### Root cause
iOS Chrome does not synthesize a `click` event from touch when the touch target is a **child element** (div/img) inside a link, in certain conditions. The click event simply never fires, so the Next.js router never intercepts it, and native navigation also never triggers.

This is NOT caused by:
- `overflow: hidden` on `<a>` (tried, didn't fix)
- `pointer-events` on images (tried, didn't fix)
- Non-passive React listeners (none found)
- `@media(hover:hover)` hover state (already scoped correctly)

### Fix: `MobileTapFix` client component
Added `website/components/MobileTapFix.tsx` — a global touch handler mounted in root layout that:
1. Tracks `touchstart`/`touchmove` to detect scrolling vs. tapping
2. On `touchend` without movement: finds the nearest `<a[href]>` ancestor and calls `router.push(href)`
3. Prevents the subsequent (occasional) `click` event from double-navigating

This runs once globally for all pages and uses the Next.js router for SPA navigation.

---

## 2. Mobile Meta Tags

Added to `app/layout.tsx`:
- `theme-color: #FAF7F2`
- `apple-mobile-web-app-capable: yes`
- `apple-mobile-web-app-title: Savta's Recipes`
- `apple-mobile-web-app-status-bar-style: default`
- `mobile-web-app-capable: yes`

---

## 3. Social Share / OG Tags

Added `generateMetadata()` to:

**`app/[locale]/page.tsx`** (recipe grid):
- Locale-aware title (`המתכונים של סבתא` / `Savta's Recipes`)
- `og:image` → `/savta.jpg`
- `og:locale` per language

**`app/[locale]/recipe/[slug]/page.tsx`** (recipe detail):
- `og:title` / `og:description` from recipe JSON in the current locale
- `og:image` → the recipe's illustration (`/illustrations/[uuid].webp`)
- `twitter:card: summary_large_image`
- `twitter:image` → same illustration

**`app/layout.tsx`** (root):
- `metadataBase: https://recipes.atlow.co.il`
- Default `og:image` → `/savta.jpg`
- Title template: `%s | Savta's Recipes`

---

## 4. ScanViewer — Swipe + Slide Effect

Replaced the custom swipe implementation with **Embla Carousel** (`embla-carousel-react`), which is the industry-standard library (used by Shadcn/ui).

Features:
- Native momentum swipe between scan pages
- Prev/next buttons trigger the same smooth slide
- Dot indicators at the bottom showing current page
- Image always fits viewport (`maxHeight: 100%`, no scrollbar)
- Keyboard navigation (ArrowLeft/Right, Escape) preserved

Also added CSS keyframes `scanSlideFromRight` / `scanSlideFromLeft` to `globals.css` (kept in case they're useful, though Embla handles its own transitions).

---

## Files Changed

| File | Change |
|------|--------|
| `website/components/MobileTapFix.tsx` | NEW — global iOS tap fix |
| `website/app/layout.tsx` | Root metadata, mobile meta tags |
| `website/app/[locale]/page.tsx` | `generateMetadata` for recipe grid |
| `website/app/[locale]/recipe/[slug]/page.tsx` | `generateMetadata` with recipe OG image |
| `website/components/ScanViewer.tsx` | Embla carousel, swipe, dots, image fit |
| `website/components/RecipeCard.tsx` | Kept `@media(hover:hover)` hover scoping |
| `website/components/SearchResults.tsx` | Same hover fix |
| `website/app/globals.css` | `touch-action: manipulation`, slide keyframes |
| `website/package.json` | Added `embla-carousel-react` |
