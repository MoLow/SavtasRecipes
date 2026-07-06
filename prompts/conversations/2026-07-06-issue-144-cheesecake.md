# Issue #144: Cheesecake fixes

**Date:** 2026-07-06
**Branch:** `claude/issue-144`

## Issue

https://recipes.atlow.co.il/en/recipe/cheesecake

1. Scan image was displayed upside down (needed a 180° rotation).
2. Original handwriting says "1/2 cup bisq." but the site showed "flour".
3. Topping sugar should be 2 tbsp, not 1/4 cup.
4. Asked whether a second page/back of the card exists with missing instructions.

## Investigation

- Two different recipes in `data/recipes/` are both slugged `cheesecake`
  (`41ffbe1b-...` and `8ab077fa-...`). `website/lib/recipes.ts` already
  dedupes slug collisions by appending `-2`, and index.json ordering puts
  `41ffbe1b-...` first, so it owns the plain `/cheesecake` URL — this is the
  recipe the issue is about. No bug here, just noted for context.
- Read the actual scan (`data/scans/41ffbe1b-f370-4e72-adb8-084111d8faf2-0.jpg`)
  and confirmed it was rotated 180°.
- Rotated it in place with the existing pipeline tool:
  `node --experimental-strip-types --no-warnings pipeline/src/skills/rotate-cli.ts 41ffbe1b-f370-4e72-adb8-084111d8faf2 180`
- After rotating, zoomed into crops (via a throwaway sharp script) to confirm
  handwriting:
  - Ingredient line clearly reads "1/2 C Bisq." — Bisquick, not flour.
  - Topping line clearly reads "2 tbsp sugar" (a correction visible over a
    crossed-out word), and also reveals the sour cream topping amount is
    "1 C" (previously recorded as unknown/null).
  - The title reads "Imp. Cheesecake" — i.e. "Impossible Cheesecake", a
    classic Bisquick recipe format where the baking mix settles to the
    bottom and forms its own crust during baking. This explains why the
    original instructions had an uncertain "crust not specified" note —
    there isn't supposed to be a separate crust.

## Changes

- `data/scans/41ffbe1b-f370-4e72-adb8-084111d8faf2-0.jpg`: rotated 180°.
- `data/recipes/41ffbe1b-f370-4e72-adb8-084111d8faf2.json`:
  - Title/description updated to "Impossible Cheesecake" and explain the
    self-crusting Bisquick method.
  - Ingredient corrected from flour to Bisquick baking mix.
  - Topping sour cream amount filled in as 1 cup (previously null).
  - Topping sugar corrected from 1/4 cup to 2 tbsp.
  - Instructions (en/he) updated to match: Bisquick instead of flour, no
    separate crust needed, corrected topping sugar amount.
  - `ocrRawText` corrected to match the actual handwriting.
- `data/recipes/index.json`: synced the title for this recipe.

## Item 4 (second page)

Only one scan file exists for this recipe in the repo
(`source.scanFiles` has a single entry), and there's no second image to
pull additional instructions from. The recipe's `description` field already
flags that preparation steps are inferred from standard cheesecake method,
not transcribed from a card. Noted this limitation in the PR description;
if a scan of the back of the card exists physically, it should be added as
a second scan file and reprocessed.
