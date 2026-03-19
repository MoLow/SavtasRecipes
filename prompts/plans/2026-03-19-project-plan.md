# Savta's Recipes - Project Plan

## Context

Digitize 50+ scanned handwritten English recipe papers from grandmother ("Savta") into a bilingual (English/Hebrew) interactive website. The pipeline uses AI services for OCR, translation, and illustration generation. The site deploys to GitHub Pages as a fully static site.

## Tech Stack

| Component | Technology | Reason |
|-----------|-----------|--------|
| Monorepo | npm workspaces + TypeScript | Single language across pipeline & website |
| OCR + Translation | **Dual-model**: Gemini 2.0 Flash + Claude Opus 4.6 | Both models independently OCR and translate each scan; a ranking step picks the best result |
| Illustration | Nano Banana Pro (Gemini `gemini-3-pro-image-preview`) | Same SDK as OCR (`@google/genai`), one fewer API key, good photorealistic output |
| Website | Next.js (static export) | SSG, App Router, good i18n/RTL support |
| Styling | Tailwind CSS | Fast to build, native RTL support |
| Search | Fuse.js (client-side) | No server needed, ~6KB |
| Deployment | GitHub Pages | Free, already using GitHub |

## Directory Structure

```
SavtasRecipes/
├── CLAUDE.md
├── package.json                  # npm workspaces root
├── tsconfig.base.json
├── scans/                        # Raw scanned images (gitignored)
├── data/
│   └── recipes/
│       ├── recipe-001.json       # Generated structured recipe data
│       └── index.json            # Manifest of all recipes
├── pipeline/
│   ├── CLAUDE.md
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── skills/
│       │   ├── ocr-gemini.ts     # Gemini: OCR + structure + translate (one call)
│       │   ├── ocr-claude.ts     # Claude Opus: OCR + structure + translate (one call)
│       │   ├── ranker.ts         # Validates & ranks results, picks best
│       │   └── illustrator.ts    # Nano Banana Pro (Gemini) illustration
│       ├── agent.ts              # Orchestrator
│       ├── schema.ts             # Zod recipe schema + TS types
│       └── utils/
│           └── api-clients.ts    # API client setup
├── website/
│   ├── CLAUDE.md
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Landing page
│   │   ├── [locale]/
│   │   │   ├── page.tsx          # Recipe grid
│   │   │   └── recipe/[slug]/
│   │   │       └── page.tsx      # Recipe detail
│   │   └── search/
│   │       └── page.tsx
│   ├── components/
│   │   ├── RecipeCard.tsx
│   │   ├── RecipeDetail.tsx
│   │   ├── LanguageToggle.tsx
│   │   ├── SearchBar.tsx
│   │   └── ScanViewer.tsx        # View original scan
│   ├── lib/
│   │   ├── recipes.ts            # Load recipe JSON at build time
│   │   └── search.ts             # Fuse.js search index
│   └── public/
│       ├── illustrations/
│       └── scans/
└── prompts/                      # AI prompt templates & conversation logs (all git-tracked)
    ├── init.md                   # Original project brief
    ├── conversations/            # Claude Code conversation logs
    │   └── 2026-03-19-project-setup.md
    ├── plans/                    # Project plans (committed to repo)
    │   └── 2026-03-19-project-plan.md
    ├── ocr-translate-system.md   # Combined OCR + structure + translate prompt
    └── illustrator-system.md     # Illustration generation prompt
```

## Recipe Data Schema

```json
{
  "id": "recipe-001",
  "slug": "kubeh-hamusta",
  "source": {
    "scanFile": "scans/recipe-001.jpg",
    "processedAt": "2026-03-19T14:30:00Z"
  },
  "title": { "en": "Kubeh Hamusta", "he": "כובה חמוסטא" },
  "description": { "en": "Grandma's tangy kubeh soup...", "he": "..." },
  "ingredients": [
    { "en": "1 cup semolina", "he": "1 כוס סולת", "item": "semolina", "amount": 1, "unit": "cup" }
  ],
  "instructions": {
    "en": ["Step 1: ...", "Step 2: ..."],
    "he": ["שלב 1: ...", "שלב 2: ..."]
  },
  "tags": ["soup", "iraqi", "shabbat"],
  "illustration": "illustrations/recipe-001.webp",
  "ocrRawText": "Original extracted text...",
  "selectedModel": "gemini" | "claude",
  "rankingReason": "Brief explanation of why this result was chosen"
}
```

## Processing Pipeline Flow

```
For each scan in scans/:
  1. Skip if data/recipes/{id}.json exists (idempotent, --force to override)

  2. Dual OCR + Translation (run in parallel):
     a) Gemini path: Send image to Gemini 2.0 Flash →
        single prompt: OCR the handwriting, structure into recipe schema,
        translate EN→HE. Returns structured recipe JSON.
     b) Claude path: Send image to Claude Opus 4.6 (vision) →
        same prompt: OCR + structure + translate. Returns structured recipe JSON.

  3. Rank & Select:
     - Validate both results against Zod schema (reject malformed ones)
     - Score each on: recipe coherence (ingredients make sense together),
       completeness (has title, ingredients, instructions),
       translation quality (Hebrew text is present and reasonable)
     - Use Claude Haiku as a fast/cheap judge to compare and pick the winner
     - If only one passes validation, use that one
     - Store the winning result + which model won (for analysis)

  4. Illustrate: Send winning recipe title+description to Nano Banana Pro →
     save image as WebP

  5. Write recipe JSON to data/recipes/
```

CLI: `npm run process` (all) or `npm run process -- --file scans/recipe-001.jpg` (single)

## Conversation Logging

All Claude Code conversations are saved as markdown summaries in `prompts/conversations/` and git-tracked.

- **Format**: `prompts/conversations/{date}-{topic}.md` — a concise summary of what was discussed, decisions made, and actions taken
- **CLAUDE.md rule**: "Always save a conversation summary to `prompts/conversations/` before ending a session."

### Git Enforcement

**Pre-commit hook** (`.git/hooks/pre-commit`):
- Auto-stages any unstaged files in `prompts/` directory (`git add prompts/`)
- Ensures no conversation log or prompt template is left out of a commit

**Claude Code hook** (`.claude/settings.local.json`):
- `PreCommit` hook: runs `git add prompts/` before every commit

## Implementation Phases

### Phase 1: Project Foundation
- Create `package.json` with npm workspaces (`pipeline`, `website`)
- Create `tsconfig.base.json` and per-workspace tsconfig files
- Create `CLAUDE.md` (root), `pipeline/CLAUDE.md`, `website/CLAUDE.md`
- Create `pipeline/.env.example` with `GEMINI_API_KEY`, `ANTHROPIC_API_KEY` (only 2 keys needed now)
- Define Zod schema in `pipeline/src/schema.ts`
- Rename `propmts/` → `prompts/`, create `prompts/conversations/`
- Add `scans/` to `.gitignore`
- Save this conversation as `prompts/conversations/2026-03-19-project-setup.md`
- Copy plan file to `prompts/plans/2026-03-19-project-plan.md` (so it's tracked in the repo, not just in `.claude/`)
- **Set up git pre-commit hook** (`.git/hooks/pre-commit`): auto-stage `prompts/` files
- **Set up Claude Code hook** (`.claude/settings.local.json`): `PreCommit` hook to run `git add prompts/`
- **Initial commit**: commit plan, conversation log, and all foundation files together

### Phase 2: Dual OCR + Translation Skills
- Implement `pipeline/src/skills/ocr-gemini.ts` — sends scan image to Gemini 2.0 Flash with a single prompt that does OCR + structuring + EN→HE translation, returns structured recipe JSON
- Implement `pipeline/src/skills/ocr-claude.ts` — sends scan image to Claude Opus 4.6 (vision) with the same prompt, returns structured recipe JSON
- Both use the same prompt template from `prompts/ocr-translate-system.md`
- Both return the same Zod-validated schema
- **Requires**: `GEMINI_API_KEY` + `ANTHROPIC_API_KEY`
- Test with 2-3 sample scans to tune the prompt

### Phase 3: Ranker
- Implement `pipeline/src/skills/ranker.ts`
- Validates both model outputs against Zod schema
- Scores on: recipe coherence, completeness, translation quality
- Uses Claude Haiku as a cheap/fast judge to compare the two candidates and pick the best
- Falls back to whichever passes validation if only one does
- Logs which model won per recipe (useful for tuning)

### Phase 4: Illustration Skill
- Implement `pipeline/src/skills/illustrator.ts` using `@google/genai` SDK (same as OCR)
- Model: `gemini-3-pro-image-preview` (Nano Banana Pro)
- Create `prompts/illustrator-system.md` with food photography style prompt
- **Requires**: `GEMINI_API_KEY` (already needed for OCR — no new key)
- Save generated images as WebP

### Phase 5: Processing Agent
- Implement `pipeline/src/agent.ts` orchestrating all 3 skills
- Idempotent, resumable, single-file and batch modes
- Error handling: log failures, continue with next recipe
- Manual review step: user checks output JSON for OCR errors

### Phase 6: Website
- Scaffold Next.js app with static export (`output: 'export'`)
- Recipe grid homepage, detail pages with illustration + bilingual text
- Hebrew routes with RTL (`dir="rtl"`)
- Client-side search with Fuse.js (search by name, ingredients, tags)
- `ScanViewer` component to show original handwritten scan
- Configure for GitHub Pages deployment (base path, GitHub Actions workflow)

### Phase 7: Polish & Deploy
- GitHub Actions workflow for building and deploying to GitHub Pages
- Warm family-cookbook visual design
- Optional: "About Savta" story page

## CLAUDE.md Files to Create

Three files: root `CLAUDE.md`, `pipeline/CLAUDE.md`, `website/CLAUDE.md` — each containing purpose, key commands, conventions, and architecture specific to that workspace.

## Verification

1. **Pipeline**: Process 2-3 test scans end-to-end, verify JSON output matches schema
2. **Website**: `npm run dev` → browse recipes, toggle language, search, view scans
3. **Build**: `npm run build` in website → verify static output works when served
4. **Deploy**: Push to GitHub → GitHub Actions builds and deploys to Pages
