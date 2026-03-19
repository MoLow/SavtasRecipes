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

- Renamed `propmts/` → `prompts/`, created `conversations/` and `plans/` subdirs
- Created npm workspaces monorepo (`package.json` at root, `pipeline/`, `website/`)
- Created TypeScript configs (`tsconfig.base.json`, `pipeline/tsconfig.json`)
- Created `CLAUDE.md` files (root, pipeline, website)
- Created `pipeline/.env.example` and `.gitignore`
- Defined Zod recipe schema in `pipeline/src/schema.ts`
- Set up git pre-commit hook to auto-stage `prompts/`
- Set up Claude Code `PreToolUse` hook to auto-stage `prompts/` before git commits
- Saved this conversation log and the project plan to `prompts/`
