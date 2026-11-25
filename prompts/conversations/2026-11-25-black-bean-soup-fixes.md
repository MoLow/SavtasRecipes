# Fix black-bean-soup recipe (issue #156)

- Issue: scan rotated; broth should be 5 1/2 C; garlic has no quantity; thyme should be 1 tsp.
- Slug `black-bean-soup` (no suffix) is the first of two duplicates -> `551b5d1b-b3f6-40e7-8403-1147334442b4` (the other, `da2fdca7`, is `black-bean-soup-2`).
- Scan was stored sideways with EXIF orientation 6; ran `rotate-cli.ts 551b5d1b-... 90`, which bakes the rotation into the pixels and strips EXIF.
- Corrected ingredients in the recipe JSON: broth 5 1/2 C, garlic without quantity, thyme 1 tsp (`teaspoon`); fixed `ocrRawText` to match.
