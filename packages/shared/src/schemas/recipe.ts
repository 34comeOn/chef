import { z } from 'zod';

export const RecipeStepSchema = z.object({
  id: z.string(),
  order: z.number().int().nonnegative(),
  instruction: z.string().min(1),
  durationSec: z.number().int().positive().nullable(),
  audioPath: z.string().nullable(),
  audioCached: z.boolean(),
});

export const RecipeSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  rawText: z.string(),
  steps: z.array(RecipeStepSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateRecipeInputSchema = z.object({
  title: z.string().min(1),
  rawText: z.string().min(10),
});

// Shape the LLM must produce when parsing raw recipe text into structured steps
export const ParsedRecipeSchema = z.object({
  title: z.string(),
  steps: z.array(
    z.object({
      order: z.number().int().nonnegative(),
      instruction: z.string().min(1),
      durationSec: z.number().int().positive().nullable(),
    })
  ),
});
