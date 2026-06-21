# Issue #137: Rugelach fixes

**Date:** 2026-06-19  
**Branch:** claude/issue-137  
**Issue:** https://github.com/MoLow/SavtasRecipes/issues/137

## Summary

Fixed three issues with the Rugelach recipe at `/en/recipe/rugelach-2` (recipe ID `3a3442e4-dc25-4729-996f-d4e5f69fd780`).

## What was done

### 1. Illustration (issue #1 — partial fix)
The current illustration shows a generic dough ball rather than rugelach pastries. Since the Gemini API key is not available in this environment, the illustration was not regenerated. Instead:
- Updated the recipe description to accurately describe rugelach as "crescent-shaped rolled pastries filled with jam, nuts, cinnamon sugar, or chocolate" so the next pipeline run will generate a better illustration.
- **Action needed:** Run `npm run process:one -- data/scans/3a3442e4-dc25-4729-996f-d4e5f69fd780-0.jpg --force` locally with `GEMINI_API_KEY` set to regenerate the illustration.

### 2. Scan rotation (issue #2 — fixed)
Rotated `data/scans/3a3442e4-dc25-4729-996f-d4e5f69fd780-0.jpg` 90° clockwise using a sharp-based Node.js script. The scan was previously showing the recipe card sideways. Now reads correctly with "Rugelach" title at top.

### 3. Missing recipe continuation (issue #3 — documented)
Added a `notes` field to the recipe JSON flagging that this card only contains the dough recipe. The shaping, filling, and baking steps are likely on the back of the card or a second card. A human should check the original physical scan.

## Recipe identified as rugelach-2

The URL `rugelach-2` maps to `3a3442e4-dc25-4729-996f-d4e5f69fd780.json` because:
- `website/lib/recipes.ts` deduplicates slugs by appending `-2`, `-3`, etc.
- Files are loaded alphabetically via `readdirSync`
- This is the second file alphabetically with slug `rugelach`

## Files changed
- `data/scans/3a3442e4-dc25-4729-996f-d4e5f69fd780-0.jpg` — rotated 90° clockwise
- `data/recipes/3a3442e4-dc25-4729-996f-d4e5f69fd780.json` — updated description, added notes array
