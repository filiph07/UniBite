import Constants from 'expo-constants';

import type { GeneratedRecipe, InventoryItem } from '@/utils/types';

type GeminiConfig = {
  apiKey: string;
  model?: string;
};

const geminiConfig = Constants.expoConfig?.extra?.gemini as GeminiConfig | undefined;

if (!geminiConfig?.apiKey) {
  // For development: it's okay if this throws early when the feature is used.
  // The Recipe Generator screen can catch and show a friendly message.
  // eslint-disable-next-line no-console
  console.warn(
    'Gemini API key is missing. Add it under expo.extra.gemini in app.json to enable recipe generation.',
  );
}

const DEFAULT_MODEL = geminiConfig?.model ?? 'gemini-1.5-pro';

export async function generateRecipeFromInventory(
  inventory: InventoryItem[],
  pantryStaples: string[],
): Promise<GeneratedRecipe> {
  if (!geminiConfig?.apiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  const ingredientsList = inventory.map((item) => item.ingredientName);

  const prompt =
    'You are UniBite, a helpful cooking assistant for university students. ' +
    'You create simple, budget-friendly recipes using what they already have in their fridge. ' +
    'Generate one simple recipe using ONLY from this list of ingredients as the main components. ' +
    'You may assume the user also has common pantry staples listed separately. ' +
    'Prefer quick, low-effort meals suitable for students.\n\n' +
    `Fridge ingredients: ${JSON.stringify(ingredientsList)}\n` +
    `Pantry staples (always available): ${JSON.stringify(pantryStaples)}\n\n` +
    'Respond with strictly valid JSON in this exact shape, and nothing else:\n' +
    JSON.stringify(
      {
        title: 'string - recipe title',
        timeMinutes: 20,
        ingredientsUsed: ['string'],
        steps: ['string'],
      },
      null,
      2,
    );

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      DEFAULT_MODEL,
    )}:generateContent?key=${encodeURIComponent(geminiConfig.apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.6,
        },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed: ${text}`);
  }

  const json = (await response.json()) as any;
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Unexpected AI response format.');
  }

  // Gemini sometimes wraps JSON in markdown fences or adds prose; try to
  // robustly extract the first JSON object from the response.
  const cleaned = rawText
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();

  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');

  const jsonSlice =
    jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart
      ? cleaned.slice(jsonStart, jsonEnd + 1)
      : cleaned;

  let parsed: GeneratedRecipe;
  try {
    parsed = JSON.parse(jsonSlice) as GeneratedRecipe;
  } catch (e) {
    throw new Error('Failed to parse AI response as JSON.');
  }

  if (!parsed.title || !Array.isArray(parsed.steps)) {
    throw new Error('AI response is missing required fields.');
  }

  return parsed;
}

