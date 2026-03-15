import { GoogleGenAI, type Tool, type GenerateContentConfig, ThinkingLevel } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string
});

const tools: Tool[] = [{ googleSearch: {} }]

const config: GenerateContentConfig = {
  thinkingConfig: {
    thinkingLevel: ThinkingLevel.HIGH
  },
  tools
};

const model = "gemma-2-27b-it";

export async function askCoach(userMessage: string): Promise<string> {
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: userMessage,
        },
      ],
    },
  ];

  const result = await ai.models.generateContent({
    model,
    config,
    contents,
  });

  return result.text as string;
}

export async function categorizeTransaction(
  description: string,
  amount: number
): Promise<string> {
  const prompt = `Catégorise cette transaction en une seule catégorie parmi: alimentation, transport, logement, santé, loisirs, vêtements, éducation, épargne, tontine, envoi d'argent, autre.
Transaction: "${description}", montant: ${amount}
Réponds uniquement par le nom de la catégorie, sans explication.`;

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: prompt,
        },
      ],
    },
  ];

  const result = await ai.models.generateContent({
    model,
    config,
    contents
  });
  return result.text?.trim().toLowerCase() as string;
}
