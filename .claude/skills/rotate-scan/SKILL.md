---
name: rotate-scan
description: Rotate incorrectly oriented recipe scan images. Use this skill whenever a user mentions a recipe scan being sideways, upside down, rotated wrong, or needing orientation correction — including when referencing a GitHub issue about image rotation. Also trigger when the user says "rotate", "flip", or "fix orientation" in the context of recipe scans or images.
---

# Rotate Recipe Scans

Fix incorrectly oriented recipe scan images by rotating them in place.

## When this happens

Users browse the recipe website, notice a scan is displayed sideways or upside down, and open a GitHub issue (or tell you directly). Your job is to identify the recipe and apply the correct rotation.

## Workflow

### 1. Identify the recipe

The user will reference a recipe by name, slug, URL, or GitHub issue. Find the matching recipe JSON in `data/recipes/`.

- If given a **slug or URL**: match against the `slug` field in recipe JSON files
- If given a **recipe name**: search recipe JSONs for a matching `title.en` or `title.he`
- If given a **GitHub issue**: read the issue to extract the recipe reference, then match as above

### 2. Confirm with the user

Before rotating, tell the user:
- Which recipe you found (title + ID)
- Which scan file(s) will be rotated
- What rotation you'll apply

If the user didn't specify the rotation amount, ask. Common cases:
- "sideways" or "on its side" → 90 or 270 (ask which direction, or look at the image yourself to determine)
- "upside down" → 180

### 3. Apply the rotation

Run the existing pipeline script:

```bash
cd /Users/mosheatlow/repos/SavtasRecipes
node --experimental-strip-types --no-warnings pipeline/src/skills/rotate-cli.ts <recipeId> <degrees>
```

Where:
- `<recipeId>` is the recipe UUID
- `<degrees>` is 90, 180, or 270 (clockwise)

### 4. Verify

After rotating, read the scan image to visually confirm the orientation looks correct. If it doesn't, rotate again to fix it.

### 5. Re-process if needed

If the rotation changes how the text reads, the recipe may need re-processing through the OCR pipeline. Ask the user if they want to re-run `npm run process:one -- <scanFile>`.
