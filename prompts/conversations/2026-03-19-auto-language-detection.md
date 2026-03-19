# Auto-detect Browser Language + Persist Preference

**Date:** 2026-03-19

## Summary

The root page (`/`) previously hard-redirected to `/en` via meta refresh. Hebrew speakers had to manually toggle every visit. Added automatic language detection with preference persistence.

## Design Decision

Discussed three options for handling returning visitors:
1. **Detect + remember** — use `navigator.language` for first visit, save to `localStorage` on manual toggle (chosen)
2. Detect only, no memory — always use browser language
3. Remember only, no detect — default to English, save on toggle

Option 1 was chosen as it provides the best UX: first-time visitors get their browser language, and manual choices are remembered.

## Implementation

### Root page (`website/app/page.tsx`)
- Converted from static meta refresh to `"use client"` component
- Detection priority: `localStorage` saved preference → `navigator.language` → default `"en"`
- Uses `window.location.replace()` (no back-button entry)
- `<noscript>` fallback redirects to `/en`

### Language toggle (`website/components/LanguageToggle.tsx`)
- Added `onClick` handler to both Link elements
- Calls `localStorage.setItem("locale", locale)` on toggle

## Files Modified
- `website/app/page.tsx` — client-side language detection
- `website/components/LanguageToggle.tsx` — persist locale to localStorage
