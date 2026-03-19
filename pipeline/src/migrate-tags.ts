/**
 * Migration script: converts existing recipe tags from plain strings
 * to bilingual { en, he } objects using a tag translation map.
 *
 * Run: node --experimental-strip-types --no-warnings src/migrate-tags.ts
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RECIPES_DIR = resolve(__dirname, "../../data/recipes");

const TAG_TRANSLATIONS: Record<string, string> = {
  // Cuisine type
  ashkenazi: "אשכנזי",
  iraqi: "עיראקי",
  moroccan: "מרוקאי",
  sephardi: "ספרדי",
  american: "אמריקאי",
  jewish: "יהודי",
  italian: "איטלקי",

  // Meal type
  dessert: "קינוח",
  cake: "עוגה",
  pie: "פאי",
  pastry: "מאפה",
  soup: "מרק",
  main: "מנה עיקרית",
  "main course": "מנה עיקרית",
  "side dish": "תוספת",
  appetizer: "מנה ראשונה",
  salad: "סלט",
  bread: "לחם",
  cookie: "עוגייה",
  cookies: "עוגיות",
  pudding: "פודינג",
  noodles: "אטריות",
  kugel: "קוגל",
  cheesecake: "עוגת גבינה",

  // Occasion
  shabbat: "שבת",
  holiday: "חג",
  passover: "פסח",
  rosh_hashana: "ראש השנה",
  hanukkah: "חנוכה",
  purim: "פורים",
  sukkot: "סוכות",
  everyday: "יומיומי",

  // Dietary
  vegetarian: "צמחוני",
  vegan: "טבעוני",
  dairy: "חלבי",
  meat: "בשרי",
  pareve: "פרווה",
  "gluten-free": "ללא גלוטן",

  // Ingredients/style
  fruit: "פירות",
  chocolate: "שוקולד",
  cinnamon: "קינמון",
  coconut: "קוקוס",
  strawberry: "תות",
  apple: "תפוח",
  cheese: "גבינה",
  cream: "שמנת",
  nuts: "אגוזים",
  baked: "אפוי",
  baking: "אפייה",
  basic: "בסיסי",
  "no-bake": "ללא אפייה",
  sweet: "מתוק",
  savory: "מלוח",
  vintage: "קלאסי",
  crust: "בצק",
  custard: "קסטרד",
  "dairy-free": "ללא חלב",
  glaze: "זיגוג",
  coffee: "קפה",
  "coffee cake": "עוגת קפה",
};

function translateTag(tag: string): { en: string; he: string } {
  const normalized = tag.toLowerCase().trim();
  const he = TAG_TRANSLATIONS[normalized];
  if (he) {
    return { en: tag, he };
  }
  // Best effort: keep the English as-is, use it for Hebrew too with a warning
  console.warn(`  Warning: no Hebrew translation for tag "${tag}", using English`);
  return { en: tag, he: tag };
}

const files = readdirSync(RECIPES_DIR).filter(
  (f) => f.endsWith(".json") && f !== "index.json" && !f.startsWith(".")
);

let migrated = 0;
let skipped = 0;

for (const file of files) {
  const filePath = resolve(RECIPES_DIR, file);
  const recipe = JSON.parse(readFileSync(filePath, "utf-8"));

  // Check if already migrated (tags are objects, not strings)
  if (recipe.tags.length > 0 && typeof recipe.tags[0] === "object") {
    console.log(`  Skip: ${recipe.title.en} (tags already bilingual)`);
    skipped++;
    continue;
  }

  console.log(`  Migrating tags: ${recipe.title.en}`);
  recipe.tags = recipe.tags.map((tag: string) => translateTag(tag));
  writeFileSync(filePath, JSON.stringify(recipe, null, 2) + "\n");
  migrated++;
}

// Rebuild index
const allRecipes = files.map((f) => {
  const content = readFileSync(resolve(RECIPES_DIR, f), "utf-8");
  const r = JSON.parse(content);
  return { id: r.id, slug: r.slug, title: r.title, tags: r.tags, illustration: r.illustration };
});

writeFileSync(
  resolve(RECIPES_DIR, "index.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), totalRecipes: allRecipes.length, recipes: allRecipes }, null, 2) + "\n"
);

console.log(`\nDone: ${migrated} migrated, ${skipped} skipped`);
