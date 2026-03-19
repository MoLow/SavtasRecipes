# About / How It Works Page

**Date:** 2026-03-19

## Summary

Added a bilingual "How It Works" page explaining the technical implementation and that the project is 100% vibe coded with Claude Code.

## Sections
- **100% Vibe Coded** — explains the project was built entirely through conversation with Claude Code
- **The Pipeline** — numbered steps: dual OCR, ranking, orientation detection, illustration, structured output
- **The Website** — static Next.js, Tailwind, Fuse.js, S3+CloudFront, GitHub Actions
- **Architecture** — ASCII diagram of the data flow from scans to website
- **Open Source** — GitHub link
- **Credits** — Neal Atlow, Stuart Atlow, Moshe Atlow

## Files
- `website/app/[locale]/about/page.tsx` — new page
- `website/components/Navbar.tsx` — added "How It Works" link (desktop only)
