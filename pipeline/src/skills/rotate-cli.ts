import { rotateRecipeScans } from "./rotate.ts";

const [recipeId, degreesStr, scanIndexStr] = process.argv.slice(2);

if (!recipeId || !degreesStr) {
  console.error("Usage: rotate-cli.ts <recipeId> <degrees> [scanIndex]");
  console.error("  degrees:   90, 180, or 270 (clockwise)");
  console.error("  scanIndex: optional 0-based index to rotate only one scan");
  process.exit(1);
}

const degrees = Number(degreesStr);
if (degrees !== 90 && degrees !== 180 && degrees !== 270) {
  console.error(`Invalid degrees: ${degreesStr}. Must be 90, 180, or 270.`);
  process.exit(1);
}

const scanIndex = scanIndexStr !== undefined ? Number(scanIndexStr) : undefined;

await rotateRecipeScans(recipeId, degrees, scanIndex);
