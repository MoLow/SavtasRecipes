import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { resolve, dirname, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(__dirname, "../../.image-cache");

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
