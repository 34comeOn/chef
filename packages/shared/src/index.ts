import { z } from 'zod';

export * from './schemas/recipe';
export * from './schemas/chat';

import {
  ChefEngagementSchema,
  AIParsedTimerSchema,
  EnvironmentalParametersSchema,
  AISubTaskSchema,
  AIParsedIngredientSchema,
  AIParsedRecipeStepSchema,
  AIParsedRecipeSchema,
  RecipeIngredientSchema,
  RecipeStepSchema,
  RecipeSchema,
  UserRawRecipeSchema,
  CookingSessionSchema,
} from './schemas/recipe';
import {
  ChatMessageSchema,
  LLMRequestSchema,
  LLMResponseSchema,
} from './schemas/chat';

// AI parsing types
export type ChefEngagement = z.infer<typeof ChefEngagementSchema>;
export type AIParsedTimer = z.infer<typeof AIParsedTimerSchema>;
export type EnvironmentalParameters = z.infer<typeof EnvironmentalParametersSchema>;
export type AISubTask = z.infer<typeof AISubTaskSchema>;
export type AIParsedIngredient = z.infer<typeof AIParsedIngredientSchema>;
export type AIParsedRecipeStep = z.infer<typeof AIParsedRecipeStepSchema>;
export type AIParsedRecipe = z.infer<typeof AIParsedRecipeSchema>;

// DB model types
export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;
export type RecipeStep = z.infer<typeof RecipeStepSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type UserRawRecipe = z.infer<typeof UserRawRecipeSchema>;
export type CookingSession = z.infer<typeof CookingSessionSchema>;

// Chat types
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type LLMRequest = z.infer<typeof LLMRequestSchema>;
export type LLMResponse = z.infer<typeof LLMResponseSchema>;
