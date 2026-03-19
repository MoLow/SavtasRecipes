import { execSync } from "child_process";
import { existsSync, mkdirSync, copyFileSync } from "fs";
import { resolve, dirname, extname } from "path";
import { fileURLToPath } from "url";
import { detectRotation } from "../skills/orient.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(__dirname, "../../.image-cache");
const WEB_SCANS_DIR = resolve(__dirname, "../../../data/scans");

const NEEDS_CONVERSION = new Set([".heic", ".heif", ".tiff"]);

/**
 * Ensures the image is in a format supported by AI APIs (JPEG/PNG/WebP).
 * Converts HEIC/HEIF/TIFF to JPEG using macOS sips if needed, caching the result.
 * Returns the path to a compatible image file.
 */
export async function ensureCompatibleImage(imagePath: string): Promise<string> {
  const ext = extname(imagePath).toLowerCase();

  if (!NEEDS_CONVERSION.has(ext)) {
    return imagePath; // Already compatible
  }

  mkdirSync(CACHE_DIR, { recursive: true });

  const cacheFile = resolve(
    CACHE_DIR,
    Buffer.from(imagePath).toString("base64url") + ".jpg"
  );

  if (existsSync(cacheFile)) {
    return cacheFile; // Already converted
  }

  // Use macOS sips for HEIC conversion (native support, no extra deps)
  execSync(`sips -s format jpeg "${imagePath}" --out "${cacheFile}"`, {
    stdio: "pipe",
  });

  return cacheFile;
}

/**
 * Exports scan images to web-friendly JPEG format with AI-detected rotation.
 * Converts any format to JPEG, then uses Gemini to detect correct orientation
 * and applies the rotation via sips.
 * Saves to data/scans/{recipeId}-{pageIndex}.jpg (committed to git).
 * Returns new relative paths like ["scans/{recipeId}-0.jpg", ...].
 */
export async function exportWebScans(
  recipeId: string,
  scanPaths: string[]
): Promise<string[]> {
  mkdirSync(WEB_SCANS_DIR, { recursive: true });

  const results: string[] = [];

  for (let i = 0; i < scanPaths.length; i++) {
    const scanPath = scanPaths[i];
    const ext = extname(scanPath).toLowerCase();
    const outFile = resolve(WEB_SCANS_DIR, `${recipeId}-${i}.jpg`);

    if (existsSync(outFile)) {
      results.push(`scans/${recipeId}-${i}.jpg`);
      continue;
    }

    // Step 1: Convert to JPEG
    if (ext === ".jpg" || ext === ".jpeg") {
      copyFileSync(scanPath, outFile);
    } else {
      execSync(`sips -s format jpeg "${scanPath}" --out "${outFile}"`, {
        stdio: "pipe",
      });
    }

    // Step 2: Detect correct orientation using AI
    const rotation = await detectRotation(outFile);
    if (rotation !== 0) {
      console.log(`    Rotating scan ${i + 1} by ${rotation}°`);
      execSync(`sips -r ${rotation} "${outFile}"`, { stdio: "pipe" });
    }

    results.push(`scans/${recipeId}-${i}.jpg`);
  }

  return results;
}
