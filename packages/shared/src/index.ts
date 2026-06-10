import { z } from 'zod';

export * from './schemas/recipe';
export * from './schemas/chat';

import {
  RecipeStepSchema,
  RecipeSchema,
  CreateRecipeInputSchema,
  ParsedRecipeSchema,
} from './schemas/recipe';
import {
  ChatMessageSchema,
  LLMRequestSchema,
  LLMResponseSchema,
} from './schemas/chat';

export type RecipeStep = z.infer<typeof RecipeStepSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type CreateRecipeInput = z.infer<typeof CreateRecipeInputSchema>;
export type ParsedRecipe = z.infer<typeof ParsedRecipeSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type LLMRequest = z.infer<typeof LLMRequestSchema>;
export type LLMResponse = z.infer<typeof LLMResponseSchema>;
