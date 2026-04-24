/**
 * Post-build script: generates .md versions of all recipe pages in out/.
 * These are served when a request includes Accept: text/markdown (AI agents).
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

const RECIPES_DIR = resolve(import.meta.dirname, '../../data/recipes');
const OUT_DIR = resolve(import.meta.dirname, '../out');

interface Recipe {
  slug: string;
  title: { en: string; he: string };
  description: { en: string; he: string };
  ingredients: Array<{ en: string; he: string }>;
  instructions: { en: string[]; he: string[] };
  tags: Array<{ en: string; he: string }>;
}

type Locale = 'en' | 'he';

function loadRecipes(): Recipe[] {
  if (!existsSync(RECIPES_DIR)) return [];
  const slugCounts = new Map<string, number>();
  return readdirSync(RECIPES_DIR)
    .filter((f) => f.endsWith('.json') && !f.startsWith('.') && f !== 'index.json')
    .map((f) => {
      const recipe = JSON.parse(readFileSync(resolve(RECIPES_DIR, f), 'utf-8')) as Recipe;
      const count = (slugCounts.get(recipe.slug) ?? 0) + 1;
      slugCounts.set(recipe.slug, count);
      if (count > 1) recipe.slug = recipe.slug + '-' + count;
      return recipe;
    });
}

function write(filePath: string, content: string) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, content, 'utf-8');
}

function recipeMarkdown(recipe: Recipe, locale: Locale): string {
  const url = 'https://recipes.atlow.co.il/' + locale + '/recipe/' + recipe.slug;
  const ingredients = recipe.ingredients.map((i) => '- ' + i[locale]).join('
');
  const instructions = recipe.instructions[locale].map((s, i) => (i + 1) + '. ' + s).join('
');
  const tags = recipe.tags.map((t) => t[locale]).join(', ');
  return '# ' + recipe.title[locale] + '

' +
    recipe.description[locale] + '

' +
    '**Tags:** ' + tags + '

' +
    '## Ingredients

' + ingredients + '

' +
    '## Instructions

' + instructions + '

' +
    '---
Source: ' + url + '
';
}

function indexMarkdown(recipes: Recipe[], locale: Locale): string {
  const base = 'https://recipes.atlow.co.il';
  const heading = locale === 'he' ? 'מתכונים של סבתא' : "Savta's Recipes";
  const intro = locale === 'he'
    ? 'מתכונים בכתב יד של סבתא, ממוינים ומתורגמים.'
    : "Grandmother's handwritten recipes, digitized and translated.";
  const list = recipes.map((r) => '- [' + r.title[locale] + '](' + base + '/' + locale + '/recipe/' + r.slug + ')').join('
');
  return '# ' + heading + '

' + intro + '

## Recipes

' + list + '

---
Source: ' + base + '/' + locale + '
';
}

const recipes = loadRecipes();

for (const locale of ['en', 'he'] as Locale[]) {
  write(resolve(OUT_DIR, locale + '.md'), indexMarkdown(recipes, locale));
  for (const recipe of recipes) {
    write(resolve(OUT_DIR, locale + '/recipe/' + recipe.slug + '.md'), recipeMarkdown(recipe, locale));
  }
}

console.log('Generated markdown for ' + recipes.length + ' recipes x 2 locales + 2 index pages');
