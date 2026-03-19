# Savta's Recipes

Digitizing my grandmother's ("Savta" in Hebrew) handwritten recipe collection into a bilingual English/Hebrew interactive website.

50+ handwritten recipe papers, scanned and processed through AI to preserve them for the family — structured, translated, and beautifully illustrated.

## How it works

```
Scanned papers → Dual AI OCR → Rank best result → Translate EN↔HE → Generate illustration → Static website
```

1. **Dual-model OCR + Translation** — Each scanned recipe is processed independently by both Gemini 2.0 Flash and Claude Opus 4.6. Both extract the handwritten text, structure it into a recipe, and translate it to Hebrew. A ranking step picks the best result.
2. **AI Illustrations** — Nano Banana Pro generates hyper-realistic food photography for each recipe.
3. **Static Website** — A Next.js site with bilingual support (English + Hebrew/RTL), recipe browsing, and search.

## Tech stack

- **Pipeline**: TypeScript, Gemini 2.0 Flash, Claude Opus 4.6, Nano Banana Pro
- **Website**: Next.js (static export), Tailwind CSS, Fuse.js
- **Deployment**: GitHub Pages

## Vibe coded

This entire project is vibe coded with [Claude Code](https://claude.ai/claude-code) — from architecture planning to implementation. Every conversation and prompt is tracked in the [`prompts/`](prompts/) directory.
