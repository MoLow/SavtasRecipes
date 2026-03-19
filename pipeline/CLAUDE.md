# Recipe Processing Pipeline

## Purpose

Processes scanned recipe images into structured bilingual JSON data using a dual-model approach for maximum accuracy.

## Architecture

- `src/skills/ocr-gemini.ts` — Sends scan to Gemini 2.0 Flash for OCR + structuring + EN→HE translation
- `src/skills/ocr-claude.ts` — Uses Claude Code (Agent SDK) for OCR + structuring + EN→HE translation
- `src/skills/ranker.ts` — Validates both results, uses Claude via Claude Code to pick the best one
- `src/skills/illustrator.ts` — Sends recipe description to Nano Banana Pro for illustration
- `src/agent.ts` — Orchestrates all skills: dual OCR → rank → illustrate → write JSON
- `src/schema.ts` — Zod schema for recipe validation

## Running

```
npm run process           # Process all unprocessed scans
npm run process:one FILE  # Process single scan
```

## Conventions

- All skills are async functions with a single input and typed output
- Skills throw on API errors; the agent catches and logs
- Processed recipes are validated against Zod schema before writing
- Pipeline is idempotent: re-running skips already processed recipes (use --force to override)
- Both OCR models run in parallel for speed; ranking picks the winner

## API Notes

- OCR+translation prompt template: `prompts/ocr-translate-system.md`
- Illustration prompt template: `prompts/illustrator-system.md`
