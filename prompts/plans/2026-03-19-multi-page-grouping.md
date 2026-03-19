# Multi-Page Scan Grouping

## Context

Some of Savta's recipes span multiple scanned pages (front/back, or long recipes on 2+ sheets). Currently the pipeline treats each image as a separate recipe, producing incomplete or duplicate results. We need a pre-processing step that groups related scans before OCR.

## Approach

Add a new **grouper skill** that runs before the existing pipeline. It does a quick OCR pass on all unprocessed scans, then asks an LLM to cluster them by recipe based on text content.

## Implementation

### Step 1: New skill — `pipeline/src/skills/grouper.ts`

```
Input:  scanPaths: string[]   (all unprocessed image paths)
Output: string[][]            (groups of filenames — each group = one recipe)
```

1. Quick-OCR each scan with Gemini Flash (parallel) — just extract raw text, no structuring
2. Build summaries: `{ filename, textSnippet (first ~200 chars) }[]`
3. Single LLM call (Gemini Flash) with clustering prompt — given all filenames + snippets, group by recipe
4. Parse JSON response, validate every filename appears exactly once
5. Fallback: if parsing fails, treat each scan as its own group

New prompt file: `prompts/grouper-system.md`

### Step 2: Modify OCR skills to accept multiple images

- **`ocr-gemini.ts`**: Change to `ocrWithGemini(imagePaths: string[])` — send all images as separate `inlineData` parts in one Gemini call
- **`ocr-claude.ts`**: Change to `ocrWithClaude(imagePaths: string[])` — list all image paths for Claude to read
- **`prompts/ocr-translate-system.md`**: Add one line: "You may receive multiple images representing consecutive pages of a single recipe. Combine all content into one unified recipe."

### Step 3: Update `pipeline/src/schema.ts`

- `source.scanFile: string` → `source.scanFiles: string[]`

### Step 4: Update `pipeline/src/agent.ts`

New flow:
1. Discover all images in `scans/`
2. Filter out already-processed (via `.processed.json`)
3. Call grouper on unprocessed files → get groups
4. For each group: run dual OCR (passing all images), rank, illustrate, write JSON
5. In `.processed.json`, map every filename in a group to the same recipe UUID

`--file` mode: skip grouper, process as single-element group.

### Step 5: Update website

- **`website/lib/recipes.ts`**: `source.scanFiles: string[]`
- **`website/components/ScanViewer.tsx`**: Render multiple scan images (stacked)
- **`website/app/[locale]/recipe/[slug]/page.tsx`**: Pass `scanFiles` array

### Step 6: Migrate existing data

One-off: edit the 4 existing recipe JSONs — `scanFile: "x"` → `scanFiles: ["x"]`

## Edge Cases

- Grouper fails → fallback to one-scan-per-group (current behavior)
- Wrong grouping → user can verify and re-run with `--force`
- Already-processed file in a group with unprocessed ones → skip group, warn

## Files to Modify

| File | Change |
|------|--------|
| `pipeline/src/skills/grouper.ts` | **New** — grouping skill |
| `prompts/grouper-system.md` | **New** — clustering prompt |
| `pipeline/src/skills/ocr-gemini.ts` | Accept `imagePaths: string[]` |
| `pipeline/src/skills/ocr-claude.ts` | Accept `imagePaths: string[]` |
| `pipeline/src/schema.ts` | `scanFile` → `scanFiles` array |
| `pipeline/src/agent.ts` | Insert grouper step, iterate groups |
| `prompts/ocr-translate-system.md` | Add multi-page note |
| `website/lib/recipes.ts` | Update source type |
| `website/components/ScanViewer.tsx` | Render multiple scans |
| `website/app/[locale]/recipe/[slug]/page.tsx` | Pass `scanFiles` |
| `data/recipes/*.json` | Migrate `scanFile` → `scanFiles` |

## Verification

1. Add multi-page test scans to `scans/`
2. Run `npm run process` — verify grouper clusters them correctly
3. Check output JSON has `scanFiles` array with all pages
4. `npm run build` — verify website builds
5. Browse recipe detail — verify ScanViewer shows all pages
