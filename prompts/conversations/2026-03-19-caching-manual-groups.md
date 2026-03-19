# AI Response Caching, Manual Scan Groups, and Grouper Progress Bar

**Date:** 2026-03-19

## Summary

### 1. Filesystem Cache for AI Calls
Created a shared cache utility (`pipeline/src/utils/cache.ts`) that caches all AI model responses to `.ai-cache/` on disk. This allows re-entrance — if the pipeline crashes or is restarted, completed AI calls are not repeated.

Cached calls:
- `ocr-gemini` — keyed by image file fingerprints
- `ocr-claude` — keyed by image file fingerprints
- `orient` (rotation detection) — keyed by image file fingerprint
- `ranker` (judgeWithClaude) — keyed by hash of both OCR results
- `illustrator` — keyed by title + description hash (also checks if output file already exists)
- `grouper` (quickOcr + clustering) — keyed by image fingerprint / scan list hash

Cache keys use file fingerprints (path + size + mtime) to avoid reading large image files for hashing.

### 2. Manual Scan Groups
Replaced the AI grouper with a manually-verified `data/scan-groups.json` file. The AI grouper had 7 false negatives (missed multi-page recipes) out of 42 total multi-page groups — a ~17% miss rate. Zero false positives though.

The JSON file contains 154 groups (42 multi-page, 112 single-page) covering all 197 scan files. The agent now reads this file instead of calling the AI grouper.

### 3. Grouper Progress Bar
Added `cli-progress` bar to the grouper showing scan-by-scan progress during quick OCR phase (retained in the grouper code even though it's no longer called by default).

## Files Created
- `pipeline/src/utils/cache.ts` — shared filesystem cache utility
- `data/scan-groups.json` — manually-verified scan groupings

## Files Modified
- `pipeline/src/agent.ts` — use scan-groups.json instead of AI grouper
- `pipeline/src/skills/ocr-gemini.ts` — cached
- `pipeline/src/skills/ocr-claude.ts` — cached
- `pipeline/src/skills/orient.ts` — cached
- `pipeline/src/skills/ranker.ts` — cached
- `pipeline/src/skills/illustrator.ts` — cached + existing file check
- `pipeline/src/skills/grouper.ts` — cached + progress bar
- `.gitignore` — added pipeline/.ai-cache/
