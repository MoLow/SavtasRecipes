import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(__dirname, "../../.ai-cache");

/**
 * File-system cache for AI model responses.
 * Cache keys are hashed to filenames. Cached values are JSON-serialized.
 */

function ensureCacheDir(subdir: string): string {
  const dir = resolve(CACHE_DIR, subdir);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex").slice(0, 16);
}

/** Hash a file by its path + size + mtime (fast, avoids reading large files) */
export function fileFingerprint(filePath: string): string {
  const stat = statSync(filePath);
  return hashKey(`${filePath}:${stat.size}:${stat.mtimeMs}`);
}

/**
 * Cache an async function's result on the filesystem.
 * @param namespace - subdirectory name (e.g. "ocr-gemini", "orient")
 * @param key - cache key string (will be hashed)
 * @param fn - async function to call on cache miss
 */
export async function cached<T>(
  namespace: string,
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const dir = ensureCacheDir(namespace);
  const hash = hashKey(key);
  const cachePath = resolve(dir, `${hash}.json`);

  if (existsSync(cachePath)) {
    return JSON.parse(readFileSync(cachePath, "utf-8")) as T;
  }

  console.log(`Cache miss for key: ${key}, namespace: ${namespace}`);
  const result = await fn();
  writeFileSync(cachePath, JSON.stringify(result) + "\n");
  return result;
}
