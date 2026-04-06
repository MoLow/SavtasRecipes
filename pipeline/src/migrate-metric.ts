/**
 * Migration script: adds metric conversions in brackets to all recipe
 * ingredients and instruction temperatures (imperial → metric).
 *
 * Run: node --experimental-strip-types --no-warnings src/migrate-metric.ts
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RECIPES_DIR = resolve(__dirname, "../../data/recipes");

// --- Conversion tables ---

interface UnitConversion {
  perUnit: number; // ml or g per 1 unit
  metricUnit: "ml" | "g";
}

const UNIT_CONVERSIONS: Record<string, UnitConversion> = {
  cup: { perUnit: 240, metricUnit: "ml" },
  cups: { perUnit: 240, metricUnit: "ml" },
  c: { perUnit: 240, metricUnit: "ml" },
  "scant cup": { perUnit: 220, metricUnit: "ml" },
  tsp: { perUnit: 5, metricUnit: "ml" },
  Tsp: { perUnit: 5, metricUnit: "ml" },
  teaspoon: { perUnit: 5, metricUnit: "ml" },
  teaspoons: { perUnit: 5, metricUnit: "ml" },
  Teaspoons: { perUnit: 5, metricUnit: "ml" },
  tbsp: { perUnit: 15, metricUnit: "ml" },
  tbs: { perUnit: 15, metricUnit: "ml" },
  Tbsp: { perUnit: 15, metricUnit: "ml" },
  Tblspn: { perUnit: 15, metricUnit: "ml" },
  tablespoon: { perUnit: 15, metricUnit: "ml" },
  tablespoons: { perUnit: 15, metricUnit: "ml" },
  Tablespoons: { perUnit: 15, metricUnit: "ml" },
  tbsps: { perUnit: 15, metricUnit: "ml" },
  lb: { perUnit: 454, metricUnit: "g" },
  lbs: { perUnit: 454, metricUnit: "g" },
  "Lb.": { perUnit: 454, metricUnit: "g" },
  oz: { perUnit: 28, metricUnit: "g" },
  pint: { perUnit: 473, metricUnit: "ml" },
  pints: { perUnit: 473, metricUnit: "ml" },
  pt: { perUnit: 473, metricUnit: "ml" },
  quart: { perUnit: 946, metricUnit: "ml" },
  quarts: { perUnit: 946, metricUnit: "ml" },
  jigger: { perUnit: 44, metricUnit: "ml" },
  glass: { perUnit: 240, metricUnit: "ml" },
  glasses: { perUnit: 240, metricUnit: "ml" },
  stick: { perUnit: 113, metricUnit: "g" },
};

// Map English unit keys to regex patterns that match the actual text in `en` strings.
// The `en` string may use a different abbreviation than the `unit` field value.
const EN_UNIT_PATTERNS: Record<string, string> = {
  cup: "cups?|c\\.",
  cups: "cups?|c\\.",
  c: "cups?|c\\.",
  "scant cup": "scant cups?",
  tsp: "tsp\\.?|teaspoons?|Tsp\\.?|Teaspoons?",
  Tsp: "tsp\\.?|teaspoons?|Tsp\\.?|Teaspoons?",
  teaspoon: "tsp\\.?|teaspoons?|Tsp\\.?|Teaspoons?",
  teaspoons: "tsp\\.?|teaspoons?|Tsp\\.?|Teaspoons?",
  Teaspoons: "tsp\\.?|teaspoons?|Tsp\\.?|Teaspoons?",
  tbsp: "tbsp\\.?|tbs\\.?|Tbsp\\.?|Tblspn\\.?|tablespoons?|Tablespoons?|tbsps\\.?",
  tbs: "tbsp\\.?|tbs\\.?|Tbsp\\.?|Tblspn\\.?|tablespoons?|Tablespoons?|tbsps\\.?",
  Tbsp: "tbsp\\.?|tbs\\.?|Tbsp\\.?|Tblspn\\.?|tablespoons?|Tablespoons?|tbsps\\.?",
  Tblspn: "tbsp\\.?|tbs\\.?|Tbsp\\.?|Tblspn\\.?|tablespoons?|Tablespoons?|tbsps\\.?",
  tablespoon: "tbsp\\.?|tbs\\.?|Tbsp\\.?|Tblspn\\.?|tablespoons?|Tablespoons?|tbsps\\.?",
  tablespoons: "tbsp\\.?|tbs\\.?|Tbsp\\.?|Tblspn\\.?|tablespoons?|Tablespoons?|tbsps\\.?",
  Tablespoons: "tbsp\\.?|tbs\\.?|Tbsp\\.?|Tblspn\\.?|tablespoons?|Tablespoons?|tbsps\\.?",
  tbsps: "tbsp\\.?|tbs\\.?|Tbsp\\.?|Tblspn\\.?|tablespoons?|Tablespoons?|tbsps\\.?",
  lb: "lbs?\\.?|Lb\\.?|pounds?",
  lbs: "lbs?\\.?|Lb\\.?|pounds?",
  "Lb.": "lbs?\\.?|Lb\\.?|pounds?",
  oz: "oz\\.?|ounces?",
  pint: "pints?|pt\\.?",
  pints: "pints?|pt\\.?",
  pt: "pints?|pt\\.?",
  quart: "quarts?",
  quarts: "quarts?",
  jigger: "jiggers?",
  glass: "glass(?:es)?",
  glasses: "glass(?:es)?",
  stick: "sticks?",
};

// Hebrew unit words for each canonical English unit
const HEBREW_UNIT_WORDS: Record<string, string[]> = {
  cup: ["כוסות", "כוס"],
  cups: ["כוסות", "כוס"],
  c: ["כוסות", "כוס"],
  "scant cup": ["כוס"],
  tsp: ["כפיות", "כפית"],
  Tsp: ["כפיות", "כפית"],
  teaspoon: ["כפיות", "כפית"],
  teaspoons: ["כפיות", "כפית"],
  Teaspoons: ["כפיות", "כפית"],
  tbsp: ["כפות", "כף"],
  tbs: ["כפות", "כף"],
  Tbsp: ["כפות", "כף"],
  Tblspn: ["כפות", "כף"],
  tablespoon: ["כפות", "כף"],
  tablespoons: ["כפות", "כף"],
  Tablespoons: ["כפות", "כף"],
  tbsps: ["כפות", "כף"],
  lb: ["ליברות", "ליברת", "ליברה", "ליברא", "פאונד"],
  lbs: ["ליברות", "ליברת", "ליברה", "ליברא", "פאונד"],
  "Lb.": ["ליברות", "ליברת", "ליברה", "ליברא", "פאונד"],
  oz: ["אונקיות", "אונקיה"],
  pint: ["פיינט", "פינט"],
  pints: ["פיינט", "פינט"],
  pt: ["פיינט", "פינט"],
  quart: ["ליטר"],
  quarts: ["ליטר"],
  jigger: ["ג'יגר"],
  glass: ["כוסות", "כוס"],
  glasses: ["כוסות", "כוס"],
  stick: ["חפיסת", "חפיסות", "מקל", "מקלות"],
};

// --- Rounding ---

function roundMetric(value: number, unit: "ml" | "g"): number {
  if (unit === "ml") {
    return value < 15 ? Math.round(value) : Math.round(value / 5) * 5;
  }
  return value < 50 ? Math.round(value) : Math.round(value / 5) * 5;
}

// --- Helpers ---

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isCompoundUnit(unit: string): boolean {
  // Compound units like "8oz can", "6oz pkg", "1 lb pkg" — skip these
  return /\d/.test(unit) && /\b(can|pkg|package|jar|bottle|box|container|pack)\b/i.test(unit);
}

function formatMetricEn(value: number, unit: "ml" | "g"): string {
  const rounded = roundMetric(value, unit);
  return `(${rounded}${unit})`;
}

function formatMetricHe(value: number, unit: "ml" | "g"): string {
  const rounded = roundMetric(value, unit);
  const heUnit = unit === "ml" ? 'מ"ל' : "גרם";
  return `(${rounded} ${heUnit})`;
}

// --- Ingredient conversion ---

interface Ingredient {
  en: string;
  he: string;
  item: string;
  amount?: number | null;
  unit?: string | null;
}

function convertIngredient(ing: Ingredient): { changed: boolean; result: Ingredient } {
  const unit = ing.unit;
  if (!unit || !ing.amount || ing.amount <= 0) return { changed: false, result: ing };
  if (isCompoundUnit(unit)) return { changed: false, result: ing };

  const conversion = UNIT_CONVERSIONS[unit];
  if (!conversion) return { changed: false, result: ing };

  const metricValue = ing.amount * conversion.perUnit;
  const metricStr = formatMetricEn(metricValue, conversion.metricUnit);
  const metricStrHe = formatMetricHe(metricValue, conversion.metricUnit);

  let enChanged = false;
  let heChanged = false;
  let newEn = ing.en;
  let newHe = ing.he;

  // --- English ---
  // Skip if already has metric conversion in parens
  if (!/\(\d+\s*(?:ml|g)\)/.test(newEn)) {
    const enPattern = EN_UNIT_PATTERNS[unit];
    if (enPattern) {
      const regex = new RegExp(`(${enPattern})\\.?`);
      const match = newEn.match(regex);
      if (match && match.index !== undefined) {
        const insertPos = match.index + match[0].length;
        newEn = newEn.slice(0, insertPos) + " " + metricStr + newEn.slice(insertPos);
        enChanged = true;
      }
    }
  }

  // --- Hebrew ---
  // Skip if already has metric (גרם or מ"ל)
  if (!/גרם|מ"ל|ק"ג|ליטר/.test(newHe)) {
    const heWords = HEBREW_UNIT_WORDS[unit];
    if (heWords) {
      let inserted = false;
      for (const heWord of heWords) {
        const idx = newHe.indexOf(heWord);
        if (idx !== -1) {
          const insertPos = idx + heWord.length;
          newHe = newHe.slice(0, insertPos) + " " + metricStrHe + newHe.slice(insertPos);
          heChanged = true;
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        console.warn(`    Warning: could not find Hebrew unit word for "${unit}" in: "${newHe}"`);
      }
    }
  }

  if (!enChanged && !heChanged) return { changed: false, result: ing };
  return { changed: true, result: { ...ing, en: newEn, he: newHe } };
}

// --- Temperature conversion ---

function fahrenheitToCelsius(f: number): number {
  return Math.round(((f - 32) * 5) / 9 / 5) * 5;
}

function convertTemperaturesEn(step: string): string {
  // Match °F not already followed by (X°C)
  return step.replace(/(\d+)\s*°\s*F(?!\s*\()/g, (_, fStr) => {
    const c = fahrenheitToCelsius(parseInt(fStr));
    return `${fStr}°F (${c}°C)`;
  });
}

function convertTemperaturesHe(step: string): string {
  // Skip if already has °C
  if (step.includes("°C")) return step;

  // Pattern: "350°F" or "350° F"
  let result = step.replace(/(\d+)\s*°\s*F/g, (_, fStr) => {
    const c = fahrenheitToCelsius(parseInt(fStr));
    return `${c}°C (${fStr}°F)`;
  });

  // Pattern: "350° פרנהייט" or "350 מעלות פרנהייט"
  if (result === step) {
    result = step.replace(/(\d+)\s*(?:°\s*)?(?:מעלות\s+)?פרנהייט/g, (match, fStr) => {
      const c = fahrenheitToCelsius(parseInt(fStr));
      return `${c}°C (${match})`;
    });
  }

  return result;
}

// --- Main ---

const files = readdirSync(RECIPES_DIR).filter(
  (f) => f.endsWith(".json") && f !== "index.json" && !f.startsWith(".")
);

let totalRecipes = 0;
let totalIngredientsConverted = 0;
let totalTempsConverted = 0;

for (const file of files) {
  const filePath = resolve(RECIPES_DIR, file);
  const recipe = JSON.parse(readFileSync(filePath, "utf-8"));
  let recipeChanged = false;
  let ingCount = 0;
  let tempCount = 0;

  // Convert ingredients
  const newIngredients = recipe.ingredients.map((ing: Ingredient) => {
    const { changed, result } = convertIngredient(ing);
    if (changed) {
      ingCount++;
      recipeChanged = true;
    }
    return result;
  });

  // Convert temperatures in English instructions
  const newEnSteps = recipe.instructions.en.map((step: string) => {
    const converted = convertTemperaturesEn(step);
    if (converted !== step) {
      tempCount++;
      recipeChanged = true;
    }
    return converted;
  });

  // Convert temperatures in Hebrew instructions
  const newHeSteps = recipe.instructions.he.map((step: string) => {
    const converted = convertTemperaturesHe(step);
    if (converted !== step) {
      tempCount++;
      recipeChanged = true;
    }
    return converted;
  });

  if (recipeChanged) {
    recipe.ingredients = newIngredients;
    recipe.instructions.en = newEnSteps;
    recipe.instructions.he = newHeSteps;
    writeFileSync(filePath, JSON.stringify(recipe, null, 2) + "\n");
    totalRecipes++;
    totalIngredientsConverted += ingCount;
    totalTempsConverted += tempCount;
    console.log(`  ✓ ${recipe.title.en}: ${ingCount} ingredients, ${tempCount} temps`);
  } else {
    console.log(`  · ${recipe.title.en}: no changes`);
  }
}

// Rebuild index
const allRecipes = files.map((f) => {
  const content = readFileSync(resolve(RECIPES_DIR, f), "utf-8");
  const r = JSON.parse(content);
  return { id: r.id, slug: r.slug, title: r.title, tags: r.tags, illustration: r.illustration };
});

writeFileSync(
  resolve(RECIPES_DIR, "index.json"),
  JSON.stringify(
    { generatedAt: new Date().toISOString(), totalRecipes: allRecipes.length, recipes: allRecipes },
    null,
    2
  ) + "\n"
);

console.log(
  `\nDone: ${totalRecipes} recipes modified, ${totalIngredientsConverted} ingredients converted, ${totalTempsConverted} temperature conversions`
);
