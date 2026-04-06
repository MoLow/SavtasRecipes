import { rotateRecipeScans } from "./rotate.ts";

const [recipeId, degreesStr] = process.argv.slice(2);

if (!recipeId || !degreesStr) {
  console.error("Usage: rotate-cli.ts <recipeId> <degrees>");
  console.error("  degrees: 90, 180, or 270 (clockwise)");
  process.exit(1);
}

const degrees = Number(degreesStr);
if (degrees !== 90 && degrees !== 180 && degrees !== 270) {
  console.error(`Invalid degrees: ${degreesStr}. Must be 90, 180, or 270.`);
  process.exit(1);
}

await rotateRecipeScans(recipeId, degrees);
