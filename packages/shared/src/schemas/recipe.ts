import { z } from 'zod';

// ─── AI Parsing Schemas (LLM output contract) ────────────────────────────────

export const ChefEngagementSchema = z.enum([
  'preparation',
  'active_cooking',
  'passive_waiting',
]);

export const AIParsedTimerSchema = z.object({
  label: z.string().min(1),
  durationSeconds: z.number().int().positive(),
});

export const EnvironmentalParametersSchema = z.object({
  temperatureCelsius: z.number().nullable(),
  heatLevel: z.enum(['low', 'medium', 'high', 'none']),
  equipmentNeeded: z.array(z.string()),
});

export const AISubTaskSchema = z.object({
  description: z.string().min(1),
  activityType: ChefEngagementSchema,
  relatedIngredients: z.array(z.string()),
});

export const AIParsedIngredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().nullable(),
  unit: z.string().nullable(),
  substitution: z.string().nullable(),
});

export const AIParsedRecipeStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  instructionText: z.string().min(1),
  subTasks: z.array(AISubTaskSchema),
  possibleTimers: z.array(AIParsedTimerSchema),
  environment: EnvironmentalParametersSchema,
});

export const AIParsedRecipeSchema = z.object({
  title: z.string().min(1),
  language: z.string().min(2).default('en'),
  ingredients: z.array(AIParsedIngredientSchema),
  steps: z.array(AIParsedRecipeStepSchema),
});

// ─── DB-Mapped Schemas (mirror Prisma models) ────────────────────────────────

export const RecipeIngredientSchema = z.object({
  id: z.string().uuid(),
  recipeId: z.string().uuid(),
  name: z.string().min(1),
  quantity: z.string().nullable(),
  unit: z.string().nullable(),
});

export const RecipeStepSchema = z.object({
  id: z.string().uuid(),
  recipeId: z.string().uuid(),
  stepNumber: z.number().int().nonnegative(),
  instructionText: z.string().min(1),
  timerDurationSeconds: z.number().int().positive().nullable(),
  audioPath: z.string().nullable(),
  audioCached: z.boolean(),
});

export const RecipeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1),
  rawText: z.string(),
  language: z.string().min(2).default('ru'),
  parsedData: AIParsedRecipeSchema.nullable(),
  ingredients: z.array(RecipeIngredientSchema),
  steps: z.array(RecipeStepSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const UserRawRecipeSchema = z.object({
  title: z.string().min(1).nullable().optional(),
  rawText: z.string().min(10),
  language: z.string().min(2).default('ru'),
});

export const CookingSessionSchema = z.object({
  id: z.string().uuid(),
  recipeId: z.string().uuid(),
  userId: z.string().uuid(),
  currentStep: z.number().int().nonnegative(),
  isComplete: z.boolean(),
  startedAt: z.string().datetime(),
  lastActiveAt: z.string().datetime(),
});
