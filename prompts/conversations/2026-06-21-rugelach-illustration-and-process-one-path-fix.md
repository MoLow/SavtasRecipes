# Rugelach illustration regeneration + `process:one` path fix

Date: 2026-06-21
Branch: `claude/issue-137` (PR #140)

## Context

Working through PR #140 (issue #137) for the Rugelach recipe
(`3a3442e4-dc25-4729-996f-d4e5f69fd780`). The PR's goal for Issue #1 was to
replace the AI illustration (old one showed generic dough, not rugelach).

## Debugging journey

1. **`File not found` running `process:one`.** Root cause: with workspaces,
   the inner script runs with cwd = `pipeline/`, so a repo-root-relative path
   like `data/scans/…` resolved against `pipeline/data/scans/…`. Also `--force`
   was being swallowed by npm itself across the nested `npm run` layers.
   Workaround: pass an absolute path and run with `--workspace=pipeline`.

2. **`Both models failed validation. Gemini: no result / Claude: no result`.**
   Root cause: single-file mode in `pipeline/src/agent.ts` validated the
   `--file` path, then discarded its directory (`basename(fullPath)`) and
   rebuilt the path against the hardcoded `SCANS_DIR` (`scans/`, the raw HEIC
   originals) — not `data/scans/`. Both OCR skills got a nonexistent path,
   `readFileSync` threw `ENOENT`, both results were `null`, and the ranker
   threw.
   **Fix:** added a `scanDir` param to `processRecipeGroup` (defaults to
   `SCANS_DIR`, so batch mode is unchanged); single-file mode now passes
   `dirname(fullPath)`. `--file` now honors whatever directory it's given.

3. **`process:one --force` mints a NEW recipe id.** `processRecipeGroup` calls
   `randomUUID()` unconditionally, so "reprocess" actually creates a duplicate
   recipe rather than overwriting in place. My verification run created a stray
   `9da86eb9-…` recipe (json + illustration + scan) and polluted
   `.processed.json` / `index.json`. All cleaned up afterward (git restore +
   rm).

## What we actually did for the illustration

The full pipeline is the wrong tool (re-OCRs, mints new id). Instead regenerated
ONLY the illustration for the existing recipe id via the `generateIllustration`
skill directly (one-off script in scratchpad):
- Same id, same `data/illustrations/3a3442e4-…webp` filename.
- Updated description (added by the PR) produced a fresh illustration showing
  proper rugelach crescents (verified visually). The old "generic dough" image
  was cached under the old description's hash; the new description hash had no
  cache hit, so a fresh image was generated.

## Final changes on this branch

- `data/illustrations/3a3442e4-…webp` — new rugelach illustration.
- `pipeline/src/agent.ts` — `--file` path fix (kept on this branch by request).

## Known follow-ups

- PR #140's regenerate instructions (`rm … && npm run process:one --force`) are
  still broken — `--force` mints a new UUID. Either update the PR description, or
  fix `process:one --force` to reuse the existing recipe id (reprocess in place).
