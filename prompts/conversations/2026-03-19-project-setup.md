# 2026-03-19: Project Setup & Architecture Planning

## What was discussed

Initial project setup for Savta's Recipes — digitizing 50+ scanned handwritten English recipe papers into a bilingual (EN/HE) interactive website.

## Decisions made

1. **Tech stack**: TypeScript monorepo (npm workspaces) with `pipeline/` and `website/` packages
2. **Dual-model OCR**: Both Gemini 2.0 Flash and Claude Opus 4.6 independently OCR + structure + translate each scan. A ranker (Claude Haiku) picks the best result.
3. **Illustrations**: Nano Banana Pro (`gemini-3-pro-image-preview`) — shares the same `@google/genai` SDK as OCR, so only 2 API keys needed (Gemini + Anthropic)
4. **Website**: Next.js static export deployed to GitHub Pages, Tailwind CSS, Fuse.js for search
5. **Languages**: Recipes are in English (original), translated to Hebrew. Website supports both with RTL.
6. **Conversation logging**: All Claude Code conversations saved to `prompts/conversations/` and auto-staged via git pre-commit hook + Claude Code hook
7. **Plans tracked in repo**: Plans saved to `prompts/plans/` and committed alongside code

## Questions asked

- Where are scans stored? → Ready, 50+ recipes
- API keys available? → None yet, will get as needed
- Deployment preference? → GitHub Pages
- Original recipe language? → English

## Actions taken

### Phase 1: Foundation
- Renamed `propmts/` → `prompts/`, created `conversations/` and `plans/` subdirs
- Created npm workspaces monorepo (`package.json` at root, `pipeline/`, `website/`)
- Created TypeScript configs (`tsconfig.base.json`, `pipeline/tsconfig.json`)
- Created `CLAUDE.md` files (root, pipeline, website)
- Created `pipeline/.env.example` and `.gitignore`
- Defined Zod recipe schema in `pipeline/src/schema.ts`
- Set up git pre-commit hook to auto-stage `prompts/`
- Set up Claude Code `PreToolUse` hook to auto-stage `prompts/` before git commits
- Saved conversation log and project plan to `prompts/`

### Phase 2: Dual OCR + Translation Skills
- Created `pipeline/src/utils/api-clients.ts` — loads keys from `pipeline/.env` (gitignored), lazy-inits Gemini + Anthropic clients
- Created `pipeline/src/skills/ocr-gemini.ts` — Gemini 2.0 Flash vision OCR + structure + translate
- Created `pipeline/src/skills/ocr-claude.ts` — Claude Opus 4.6 vision OCR + structure + translate
- Created `prompts/ocr-translate-system.md` — shared prompt template for both models
- Created `pipeline/.env` from `.env.example` (gitignored, user fills in API keys)

### Phase 3: Ranker + README
- Created `pipeline/src/skills/ranker.ts` — validates both OCR results with Zod, uses Claude Haiku as judge when both pass
- Updated `README.md` with project description, tech stack, and "vibe coded with Claude Code" note

### Phase 4: Illustration Skill
- Created `pipeline/src/skills/illustrator.ts` — sends recipe title + description to Nano Banana Pro (`gemini-3-pro-image-preview`), saves image to `data/illustrations/`
- Created `prompts/illustrator-system.md` — style prompt for hyper-realistic food photography (top-down, rustic table, warm lighting)

### Phase 5: Processing Agent
- Created `pipeline/src/agent.ts` — orchestrator that ties all skills together
- Batch mode: processes all scans in `scans/` directory
- Single file mode: `npm run process:one -- --file <path>`
- Idempotent: skips already-processed recipes unless `--force` is passed
- Runs Gemini and Claude OCR in parallel via `Promise.allSettled`
- Builds `data/recipes/index.json` manifest after processing
- Progress logging for each step (OCR → rank → illustrate → write)

### Phase 6: Website
- Scaffolded Next.js app with static export (`output: 'export'`) and Tailwind CSS
- Created `website/lib/recipes.ts` — loads recipe JSON from `data/recipes/` at build time
- Created `website/lib/search.ts` — Fuse.js search index builder with weighted fields
- **Components**:
  - `RecipeCard` — card with illustration, title, tags; links to recipe detail
  - `LanguageToggle` — switches between EN/HE, rewrites URL path
  - `SearchBar` — client-side fuzzy search with instant filtering
  - `ScanViewer` — modal overlay to view original handwritten scan
- **Pages**:
  - `/` — landing page with language selection (English / עברית)
  - `/[locale]` — recipe grid with all recipes
  - `/[locale]/recipe/[slug]` — full recipe detail with illustration, ingredients, numbered instructions, tags, and scan viewer
  - `/search` — search across all recipes by name, ingredients, tags
- Locale layout applies `dir="rtl"` for Hebrew, sticky header with nav + language toggle
- Warm family-cookbook color palette (cream, brown, gold, tan)

### Phase 7: Polish & Deploy
- Created `.github/workflows/deploy.yml` — GitHub Actions workflow for building and deploying to GitHub Pages
- Installed all dependencies (`npm install`)
- Fixed Next.js 15 async params issue (params are now `Promise` in layouts/pages)
- Verified static build passes (`npx next build` succeeds, outputs to `website/out/`)
- User noted conversation log wasn't being updated before commits — fixed by updating log before every commit going forward

### Dependency Updates
- Updated all npm packages to latest stable versions (March 2026)
- Pipeline: `@anthropic-ai/sdk` 0.79.0, `@google/genai` 1.45.0, `sharp` 0.34.5, `tsx` 4.21.0, `typescript` 5.9.3
- Website: `react` 19.2.4, `next` 15.5.13, `tailwindcss` 4.2.1, `fuse.js` 7.1.0, `typescript` 5.9.3
- Kept Zod at 3.x (4.x has breaking API changes), kept Next.js at 15.x (16.x would need code changes)
- GitHub Actions: `checkout` v6, `setup-node` v6, Node.js 22
- Verified build still passes after updates

### Switch to Claude Code SDK
- User requested using Claude Code instead of Anthropic API key for Claude calls
- Replaced `@anthropic-ai/sdk` with `@anthropic-ai/claude-agent-sdk` in pipeline
- Rewrote `ocr-claude.ts` to use `query()` from Agent SDK — reads images via Claude Code's built-in Read tool
- Rewrote `ranker.ts` to use `query()` with Haiku model for judging
- Removed `getAnthropicClient()` from `api-clients.ts`
- Removed `ANTHROPIC_API_KEY` from `.env` and `.env.example`
- Now only one API key needed: `GEMINI_API_KEY`
- Claude uses existing Claude Code authentication (subscription)

### Modernizations
- Replaced `tsx` with Node.js native type stripping (`--experimental-strip-types`)
- Replaced custom `.env` parser with Node.js native `--env-file=.env`
- Removed `sharp` dependency — HEIC conversion uses macOS-native `sips` instead
- Updated tsconfig: `allowImportingTsExtensions`, `noEmit`, `verbatimModuleSyntax`
- Changed all `.js` import extensions to `.ts`

### First Pipeline Run (4 demo scans)
- Added HEIC support (iPhone photos) via `sips` conversion to JPEG
- Recipe IDs changed from filenames to random UUIDs (tracked via `.processed.json`)
- Gemini OCR model `gemini-2.0-flash` was deprecated, updated to `gemini-2.5-flash`
- Claude OCR successfully extracted all 4 recipes: Pie Crust, Coconut Custard Pie, Nani's Noodle Pudding, Apple Cake
- Nano Banana Pro generated illustrations for all 4
- Output: 4 recipe JSONs + 4 WebP illustrations in `data/`

### Website Build Fix & Verification
- Fixed `generateStaticParams` in recipe detail page — nested route should only return `slug`, not `locale` (parent layout handles that)
- Fixed `getAllRecipes()` picking up `.processed.json` — added `!f.startsWith(".")` filter
- Symlinked `data/illustrations/` → `website/public/illustrations/` so Next.js can serve them
- Build succeeded: 15 static pages (4 recipes × 2 languages + landing + grid×2 + search + 404)
- Verified locally with Playwright:
  - Landing page: language selection works
  - English grid: all 4 recipe cards with illustrations
  - Recipe detail: full content (title, description, ingredients, instructions, tags, scan viewer)
  - Hebrew version: RTL layout, Hebrew translations, language toggle between en/he
