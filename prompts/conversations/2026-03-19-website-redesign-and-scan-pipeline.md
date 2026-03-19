# Website Redesign & Scan Export Pipeline

**Date:** 2026-03-19
**Session:** Complete website redesign + scan pipeline improvements

## What was done

### 1. Full Website Redesign — "The Archive Table"
Deleted the old ugly website and rebuilt from scratch with a distinctive editorial aesthetic:
- **Typography**: DM Serif Display (headings), Source Serif 4 (body), Heebo (Hebrew), JetBrains Mono (metadata)
- **Color palette**: Aged paper (#FAF7F2), espresso ink (#2C1810), burnt sienna accent (#C4553A)
- **Special effects**: Paper grain texture overlay, frosted glass card overlays, photo-styled scan viewer
- **Pages**: Home grid, recipe detail (hero + ingredients/instructions + "The Original" scans), search
- **Components**: Navbar (frosted glass), LanguageToggle (segmented pill), SearchInput (Fuse.js dropdown), RecipeCard (square with frost band), ScanViewer (photo-styled with dark lightbox), SearchResults
- **RTL**: Full Hebrew support with logical properties
- Fixed missing `@tailwindcss/postcss` dependency (Tailwind v4 + Next.js requirement)

### 2. Scan Export Pipeline
Made original handwritten scans available on the website:
- **New skill**: `orient.ts` — AI-powered rotation detection using Gemini
  - Challenge: All AI models auto-apply EXIF orientation, so they always see upright text
  - Solution: Check pixel dimensions (landscape = needs rotation), then ask Gemini which direction text flows relative to the pixel grid to determine 90° vs 270°
  - Model: `gemini-3-flash-preview`
- **New utility**: `exportWebScans()` in `image.ts` — converts HEIC→JPEG with AI rotation, saves to `data/scans/`
- **Pipeline integration**: New step 4/5 in agent.ts, recipe JSON now references web-friendly JPEGs
- **Migration script**: `migrate-scans.ts` with `--force` flag for re-processing
- **Website**: Symlink `website/public/scans → ../../data/scans`
- **Gitignore**: Removed `scans/` ignore, added `!data/scans/` exception for web exports

### 3. Savta's Photo & Dedication
- Added grandmother's photo as circular portrait on home page
- Double-ring frame effect (CSS box-shadow)
- Dedication line: "Thanks to Neal Atlow & Stuart Atlow" (bilingual)

## Commits
1. `2f31a9f` — Redesign website: "The Archive Table" design system
2. `2db72f9` — Fix website build: add Tailwind PostCSS plugin and extract SearchResults component
3. `ba67f87` — Add scan export pipeline with AI rotation detection
4. `70e115d` — Add Savta's photo and family dedication to home page

## Key decisions
- Serif-first typography for editorial feel (unusual for web, memorable)
- Scans displayed as "physical photos" with white borders and rotation — celebrates the handwritten originals
- AI rotation detection needed because HEIC→JPEG conversion doesn't preserve orientation metadata
- Used `gemini-3-flash-preview` for orient detection (Gemini Pro also works but flash is faster)
- All scan files committed to git (both raw HEIC and exported JPEG) per user preference

### 4. S3 + CloudFront Deployment Infrastructure
Replaced GitHub Pages with S3 static website + CloudFront CDN:
- **CloudFormation template** (`infra/cloudformation.yaml`): S3 bucket, CloudFront with OAC, ACM cert, Route53 A record
- **Custom domain**: `recepies.atlow.co.il` (Route53 hosted zone `ZBK1TP4S8FJSM`)
- **GitHub Actions** (`.github/workflows/deploy.yml`): Build → S3 sync (with cache headers) → CloudFront invalidation
- **Auth**: GitHub OIDC → IAM Role (no long-lived keys)
- Smart cache headers: immutable for static assets, short TTL for HTML/JSON

## Commits
1. `2f31a9f` — Redesign website: "The Archive Table" design system
2. `2db72f9` — Fix website build: add Tailwind PostCSS plugin and extract SearchResults component
3. `ba67f87` — Add scan export pipeline with AI rotation detection
4. `70e115d` — Add Savta's photo and family dedication to home page
5. `0e75777` — Add conversation log
6. TBD — S3 + CloudFront deployment infrastructure

## Key decisions
- Serif-first typography for editorial feel (unusual for web, memorable)
- Scans displayed as "physical photos" with white borders and rotation — celebrates the handwritten originals
- AI rotation detection needed because HEIC→JPEG conversion doesn't preserve orientation metadata
- Used `gemini-3-flash-preview` for orient detection (Gemini Pro also works but flash is faster)
- All scan files committed to git (both raw HEIC and exported JPEG) per user preference
- CloudFormation over Terraform — single template, no extra tooling, AWS-native
- GitHub OIDC over access keys — more secure, no key rotation needed
- CloudFront OAC over OAI — newer, more secure S3 access method

## Technical notes
- Tailwind v4 with Next.js requires `@tailwindcss/postcss` package + `postcss.config.mjs`
- HEIC files from iPhones store rotation via `irot` box, not standard EXIF orientation
- `sips` on macOS doesn't expose or apply HEIC rotation during format conversion
- AI models auto-apply orientation metadata when processing images, making direct rotation detection impossible — workaround is to reason about pixel dimensions + text flow direction
- ACM certificate must be in `us-east-1` for CloudFront (even if other resources are elsewhere)
- CloudFront hosted zone ID `Z2FDTNDATAQYW2` is a global AWS constant for alias records
