/** Returns the optimized WebP variant path for an image. */
export function optimizedImage(path: string, width: number): string {
  const dot = path.lastIndexOf(".");
  if (dot === -1) return path;
  return `${path.slice(0, dot)}-${width}w.webp`;
}
