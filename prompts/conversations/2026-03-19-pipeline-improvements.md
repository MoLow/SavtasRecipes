# Pipeline Improvements: Grouper Validation, Concurrency, Progress Bar

**Date:** 2026-03-19

## Summary

Three improvements to the recipe processing pipeline.

### 1. Grouper Consecutive File Validation
The AI grouper could produce false positives by grouping non-adjacent scans. Since all scans were performed serially, pages of the same recipe are always consecutive files. Added a validation step after AI grouping:
- Sort all filenames alphabetically (UUIDs sort chronologically)
- For each multi-page group, verify all files are adjacent in the sorted order
- Non-consecutive groups are split back into individual recipes with a warning
- Also sort scan files in the agent before passing to the grouper for deterministic ordering

### 2. Concurrency with p-map
Replaced unbounded `Promise.all`/`Promise.allSettled` and sequential `for` loops with `p-map` for controlled concurrency:
- Quick OCR (grouper): concurrency 3
- Recipe group processing: concurrency 2
- HEIC→JPEG conversion: concurrency 3
- Scan export + rotation: concurrency 3

### 3. Progress Bar
Added `cli-progress` for visual feedback during processing:
- Overall progress bar tracking all recipes × 5 steps
- Shows current step name (OCR, Rank, Illustrate, Export, Write)
- Shows recipe N/M counter
- Works for both single-file and batch modes

## Files Modified
- `pipeline/src/skills/grouper.ts` — consecutive file validation + p-map
- `pipeline/src/agent.ts` — p-map concurrency + cli-progress bar
- `pipeline/src/utils/image.ts` — p-map for scan export
- `pipeline/package.json` — added p-map, cli-progress dependencies
