# Savta's Recipes

Personal project to digitize grandmother's handwritten English recipes into a bilingual (English/Hebrew) interactive website.

## Project Structure

- `pipeline/` — Node.js scripts that process scans through dual-model OCR+translation and illustration using AI APIs
- `website/` — Next.js static site for browsing recipes
- `data/recipes/` — Generated recipe JSON files (committed to git)
- `scans/` — Raw scanned recipe images (gitignored, stored locally)
- `prompts/` — AI prompt templates, conversation logs, and plans (always git-tracked)

## Tech Stack

- TypeScript throughout (npm workspaces monorepo)
- Gemini 2.0 Flash + Claude Opus 4.6 (via Claude Code) for dual-model OCR + translation (best result wins)
- Nano Banana Pro (Gemini `gemini-3-pro-image-preview`) for food illustrations
- Next.js with static export for the website
- Tailwind CSS for styling
- Fuse.js for client-side search

## Key Commands

- `npm run process` — Run the processing pipeline on all unprocessed scans
- `npm run process:one -- <file>` — Process a single scan
- `npm run dev` — Start the website dev server
- `npm run build` — Build the static website

## Environment Variables

Copy `pipeline/.env.example` to `pipeline/.env` and fill in:
- `GEMINI_API_KEY` — Google AI (used for Gemini OCR + Nano Banana Pro illustrations)

Claude is used via the Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) which uses your existing Claude Code authentication — no API key needed.

## Languages

All recipes exist in English (original handwritten) and Hebrew (translated).
Hebrew text is RTL. The website supports both directions.

## Data Flow

```
scans/*.jpg → pipeline (dual OCR+translate → rank → illustrate) → data/recipes/*.json → website (static build)
```

## Conversation Logging

Always save a conversation summary to `prompts/conversations/` before ending a session.
Format: `prompts/conversations/{YYYY-MM-DD}-{topic}.md`

All files in `prompts/` are automatically staged by the pre-commit hook — never manually exclude them from commits.
