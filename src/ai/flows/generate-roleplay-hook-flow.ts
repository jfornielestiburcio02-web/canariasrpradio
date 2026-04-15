'use server';
/**
 * @fileOverview This file provides a Genkit flow to generate creative story hooks or character concepts
 * relevant to the 'Cadiz Roleplay' theme based on user input.
 *
 * - generateRoleplayHook - A function that handles the generation of roleplay content.
 * - GenerateRoleplayHookInput - The input type for the generateRoleplayHook function.
 * - GenerateRoleplayHookOutput - The return type for the generateRoleplayHook function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateRoleplayHookInputSchema = z.object({
  type: z.enum(['story_hook', 'character_concept']).describe('The type of roleplay content to generate (story_hook or character_concept).'),
  topic: z.string().describe('A topic or theme for the roleplay content.').optional(),
});
export type GenerateRoleplayHookInput = z.infer<typeof GenerateRoleplayHookInputSchema>;

const GenerateRoleplayHookOutputSchema = z.object({
  title: z.string().describe('A title for the generated roleplay content.'),
  suggestion: z.string().describe('The generated story hook or character concept.'),
});
export type GenerateRoleplayHookOutput = z.infer<typeof GenerateRoleplayHookOutputSchema>;

export async function generateRoleplayHook(input: GenerateRoleplayHookInput): Promise<GenerateRoleplayHookOutput> {
  return generateRoleplayHookFlow(input);
}

const generateRoleplayHookPrompt = ai.definePrompt({
  name: 'generateRoleplayHookPrompt',
  input: { schema: GenerateRoleplayHookInputSchema },
  output: { schema: GenerateRoleplayHookOutputSchema },
  prompt: `Eres un asistente creativo para 'Cadiz Roleplay', especializado en generar ideas para historias y personajes en un contexto histórico y marítimo de Cádiz.

Genera un/a {{type}} basado en el siguiente tema:

Tema: {{{topic}}}

Si el tipo es 'story_hook', crea una premisa de historia intrigante y original, con un título sugerente.
Si el tipo es 'character_concept', desarrolla una idea de personaje con su trasfondo, personalidad y un gancho para el rolplay, incluyendo un nombre sugerente.

Asegúrate de que la sugerencia sea creativa, inspiradora y relevante para la temática de 'Cadiz Roleplay'.`,
});

const generateRoleplayHookFlow = ai.defineFlow(
  {
    name: 'generateRoleplayHookFlow',
    inputSchema: GenerateRoleplayHookInputSchema,
    outputSchema: GenerateRoleplayHookOutputSchema,
  },
  async (input) => {
    const { output } = await generateRoleplayHookPrompt(input);
    if (!output) {
      throw new Error('Failed to generate roleplay content.');
    }
    return output;
  }
);
