import { z } from "zod";

const bilingualText = z.object({
  en: z.string(),
  he: z.string(),
});

const ingredientSchema = z.object({
  en: z.string(),
  he: z.string(),
  item: z.string(),
  amount: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
});

export const recipeSchema = z.object({
  id: z.string(),
  slug: z.string(),
  source: z.object({
    scanFiles: z.array(z.string()).min(1),
    processedAt: z.string().datetime(),
  }),
  title: bilingualText,
  description: bilingualText,
  ingredients: z.array(ingredientSchema).min(1),
  instructions: z.object({
    en: z.array(z.string()).min(1),
    he: z.array(z.string()).min(1),
  }),
  tags: z.array(bilingualText),
  illustration: z.string(),
  ocrRawText: z.string(),
  selectedModel: z.enum(["gemini", "claude"]),
  rankingReason: z.string(),
  notes: z.array(bilingualText).optional(),
});

export type Recipe = z.infer<typeof recipeSchema>;
export type Ingredient = z.infer<typeof ingredientSchema>;

/** Schema for the recipe index manifest */
export const recipeIndexSchema = z.object({
  generatedAt: z.string().datetime(),
  totalRecipes: z.number(),
  recipes: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      title: bilingualText,
      tags: z.array(bilingualText),
      illustration: z.string(),
    })
  ),
});

export type RecipeIndex = z.infer<typeof recipeIndexSchema>;
