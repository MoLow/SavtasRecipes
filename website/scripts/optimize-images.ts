/**
 * Optimizes images for web delivery by generating WebP variants at multiple sizes.
 *
 * Run: node --experimental-strip-types --no-warnings src/optimize-images.ts
 * Add --force to regenerate existing optimized files.
 *
 * Illustrations: 400w (card), 800w (detail), full (re-encoded WebP)
 * Scans: 400w (thumbnail), 1200w (lightbox)
 */

import { readdirSync, existsSync } from "fs";
import { resolve, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import pMap from "p-map";
import cliProgress from "cli-progress";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "../..");
const ILLUSTRATIONS_DIR = resolve(ROOT_DIR, "data/illustrations");
const SCANS_DIR = resolve(ROOT_DIR, "data/scans");
const PUBLIC_DIR = resolve(__dirname, "../public");

const force = process.argv.includes("--force");

interface Variant {
  suffix: string;
  width: number;
  quality: number;
  format?: "webp" | "png";
}

async function optimizeFile(
  inputPath: string,
  outputDir: string,
  nameBase: string,
  variants: Variant[]
): Promise<number> {
  let generated = 0;

  for (const variant of variants) {
    const format = variant.format ?? "webp";
    const outPath = resolve(outputDir, `${nameBase}${variant.suffix}.${format}`);

    if (existsSync(outPath) && !force) {
      continue;
    }

    const pipeline = sharp(inputPath).resize(variant.width, undefined, { withoutEnlargement: true });
    if (format === "png") {
      await pipeline.png({ quality: variant.quality, compressionLevel: 8 }).toFile(outPath);
    } else {
      await pipeline.webp({ quality: variant.quality }).toFile(outPath);
    }

    generated++;
  }

  return generated;
}

async function main() {
  let totalFiles = 0;
  let totalGenerated = 0;

  // Collect all work items
  const work: Array<{
    input: string;
    outputDir: string;
    nameBase: string;
    variants: Variant[];
    label: string;
  }> = [];

  // Illustrations
  if (existsSync(ILLUSTRATIONS_DIR)) {
    const files = readdirSync(ILLUSTRATIONS_DIR).filter(
      (f) => /\.(jpe?g|png|webp)$/i.test(f) && !/-\d+w\.webp$/.test(f)
    );

    for (const file of files) {
      const name = basename(file, extname(file));
      work.push({
        input: resolve(ILLUSTRATIONS_DIR, file),
        outputDir: ILLUSTRATIONS_DIR,
        nameBase: name,
        variants: [
          { suffix: "-400w", width: 400, quality: 80 },
          { suffix: "-800w", width: 800, quality: 80 },
          { suffix: "-og", width: 1200, quality: 90, format: "png" },
        ],
        label: `illus/${file}`,
      });
    }
  }

  // Scans
  if (existsSync(SCANS_DIR)) {
    const files = readdirSync(SCANS_DIR).filter(
      (f) => /\.(jpe?g|png|webp)$/i.test(f) && !/-\d+w\.webp$/.test(f)
    );

    for (const file of files) {
      const name = basename(file, extname(file));
      work.push({
        input: resolve(SCANS_DIR, file),
        outputDir: SCANS_DIR,
        nameBase: name,
        variants: [
          { suffix: "-400w", width: 400, quality: 85 },
          { suffix: "-1200w", width: 1200, quality: 85 },
        ],
        label: `scans/${file}`,
      });
    }
  }


  // Static public assets
  const staticAssets = [
    { file: 'savta.jpg', variants: [{ suffix: '', width: 300, quality: 85 }] },
  ];

  for (const { file, variants } of staticAssets) {
    const inputPath = resolve(PUBLIC_DIR, file);
    if (existsSync(inputPath)) {
      const name = basename(file, extname(file));
      work.push({
        input: inputPath,
        outputDir: PUBLIC_DIR,
        nameBase: name,
        variants: variants.map((v) => ({ ...v, format: 'webp' as const })),
        label: `public/${file}`,
      });
    }
  }

  totalFiles = work.length;

  if (totalFiles === 0) {
    console.log("No images found to optimize.");
    return;
  }

  console.log(`Optimizing ${totalFiles} images...\n`);

  const bar = new cliProgress.SingleBar({
    format: "  {bar} {percentage}% | {value}/{total} images",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
    barsize: 30,
  }, cliProgress.Presets.shades_classic);

  bar.start(totalFiles, 0);

  await pMap(work, async (item) => {
    const generated = await optimizeFile(
      item.input,
      item.outputDir,
      item.nameBase,
      item.variants
    );
    totalGenerated += generated;
    bar.increment();
  }, { concurrency: 4 });

  bar.stop();

  console.log(`\nDone: ${totalGenerated} new variants generated from ${totalFiles} source images.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
