import { Router, Request, Response } from 'express';
import { buildParsePrompt } from '../services/llm/prompt';

const router = Router();
const OLLAMA_GENERATE_URL = 'http://localhost:11434/api/generate';

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

    res.status(200).json({ response: ollamaData.response });
    return;
  } catch (error) {
    console.error('[POST /api/recipes/parse] Ollama request failed:', error);
    res.status(500).json({ error: 'Failed to parse recipe via Ollama' });
    return;
  }
});

export default router;
