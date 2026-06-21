# Issue #137 Follow-up: Rugelach Illustration Regeneration

**Date:** 2026-06-21  
**Branch:** claude/issue-137  

## Context

PR #140 (merged) addressed issues #2 and #3 from GitHub issue #137 (Rugelach):
- ✅ Scan rotated 90° clockwise
- ✅ Missing recipe continuation flagged in notes

Issue #137 remains open because issue #1 (wrong illustration) was deferred due to GEMINI_API_KEY not being available in CI.

## Changes in this PR

### 1. Updated recipe description (`data/recipes/3a3442e4-dc25-4729-996f-d4e5f69fd780.json`)

Changed the description from talking about "the recipe card capturing the dough" to explicitly describing what finished rugelach look like:

> Classic Ashkenazi rugelach — small, bite-sized crescent rolls made from a rich yeasted sour-cream dough, tightly rolled around a cinnamon-sugar filling with chopped nuts. The finished cookies are golden-brown, flaky, and dusted with powdered sugar, arranged in neat rows.

This ensures that when the illustration is regenerated, the Gemini model produces an image of **finished rugelach cookies** rather than generic pastry dough.

### 2. Added `pipeline/src/skills/regen-illustration-cli.ts`

A CLI tool that deletes the existing illustration and forces regeneration:

```bash
cd pipeline
GEMINI_API_KEY=<your-key> node --experimental-strip-types --no-warnings \
  src/skills/regen-illustration-cli.ts 3a3442e4-dc25-4729-996f-d4e5f69fd780
```

## Remaining manual step

The illustration at `data/illustrations/3a3442e4-dc25-4729-996f-d4e5f69fd780.webp` still needs to be regenerated locally with a valid `GEMINI_API_KEY`, then committed. The description update in this PR ensures the new illustration will show the correct food.
