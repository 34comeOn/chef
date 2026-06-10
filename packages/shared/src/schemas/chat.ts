import { z } from 'zod';

export const ChatRoleSchema = z.enum(['user', 'assistant', 'system']);

export const ChatMessageSchema = z.object({
  role: ChatRoleSchema,
  content: z.string(),
});

export const LLMRequestSchema = z.object({
  messages: z.array(ChatMessageSchema),
  recipeId: z.string().optional(),
  currentStepIndex: z.number().int().nonnegative().optional(),
});

export const LLMResponseSchema = z.object({
  content: z.string(),
  provider: z.enum(['ollama', 'openai']),
});
