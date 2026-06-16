import { Router, Request, Response } from 'express';
import { AIParsedRecipeSchema } from '@chef/shared';
import { buildParsePrompt } from '../services/llm/prompt';
import { prisma } from '../index';

const router = Router();
const OLLAMA_GENERATE_URL = 'http://localhost:11434/api/generate';
// TODO: replace with req.user.id once auth lands
const SEEDED_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

router.post('/parse', async (req: Request, res: Response): Promise<void> => {
  const { rawText, language = 'en' } = req.body ?? {};

  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    res.status(400).json({ error: 'rawText is required and must be a non-empty string' });
    return;
  }

  try {
    const ollamaPayloadObject = buildParsePrompt(rawText, language);

    const ollamaResponse = await fetch(OLLAMA_GENERATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ollamaPayloadObject), 
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      throw new Error(`Ollama responded with status ${ollamaResponse.status}. Details: ${errorText}`);
    }

    const ollamaData = (await ollamaResponse.json()) as { response: string };

    let parsedLLMOutput: unknown;
    try {
      parsedLLMOutput = JSON.parse(ollamaData.response);
    } catch (parseError) {
      console.error(
        '[POST /api/recipes/parse] LLM response was not valid JSON:',
        parseError,
        '\nRaw response:',
        ollamaData.response
      );
      res.status(422).json({
        error: 'LLM returned malformed JSON',
        details: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return;
    }

    const validationResult = AIParsedRecipeSchema.safeParse(parsedLLMOutput);
    if (!validationResult.success) {
      console.error(
        '[POST /api/recipes/parse] LLM output failed schema validation:',
        validationResult.error.format()
      );
      res.status(422).json({
        error: 'LLM output failed schema validation',
        details: validationResult.error.format(),
      });
      return;
    }

    const validated = validationResult.data;

    try {
      const recipe = await prisma.$transaction(async (tx) => {
        return tx.recipe.create({
          data: {
            title: validated.title,
            rawText,
            language: validated.language,
            parsedData: validated,
            userId: SEEDED_USER_ID,
            ingredients: {
              create: validated.ingredients.map((ingredient) => ({
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
              })),
            },
            steps: {
              create: validated.steps.map((step) => ({
                stepNumber: step.stepNumber,
                instructionText: step.instructionText,
                timerDurationSeconds: step.possibleTimers[0]?.durationSeconds ?? null,
                audioPath: null,
                audioCached: false,
              })),
            },
          },
          include: { ingredients: true, steps: true },
        });
      });

      res.status(201).json(recipe);
      return;
    } catch (dbError) {
      console.error('[POST /api/recipes/parse] Transaction failed:', dbError);
      res.status(500).json({ error: 'Failed to persist parsed recipe' });
      return;
    }
  } catch (error) {
    console.error('[POST /api/recipes/parse] Ollama request failed:', error);
    res.status(500).json({ error: 'Failed to parse recipe via Ollama' });
    return;
  }
});

export default router;
