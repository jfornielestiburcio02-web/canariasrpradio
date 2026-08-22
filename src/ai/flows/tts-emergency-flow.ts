'use server';
/**
 * @fileOverview Flujo de Genkit ultra-optimizado para mínima latencia en avisos de emergencia.
 * Utiliza construcción manual de cabecera WAV para evitar sobrecarga de librerías externas.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import { Buffer } from 'buffer';

const TTSEmergencyInputSchema = z.object({
  nombre: z.string(),
  ubicacion: z.string(),
  motivo: z.string(),
  unidades: z.array(z.string()),
});

export type TTSEmergencyInput = z.infer<typeof TTSEmergencyInputSchema>;

export async function generateEmergencyAudio(input: TTSEmergencyInput) {
  return generateEmergencyAudioFlow(input);
}

/**
 * Inserta manualmente una cabecera WAV para PCM 24kHz Mono 16-bit.
 * Esto es significativamente más rápido que usar streams o librerías pesadas.
 */
function createWavDataUri(pcmBuffer: Buffer): string {
  const pcmLength = pcmBuffer.length;
  const header = Buffer.alloc(44);
  
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);      // Subchunk1Size
  header.writeUInt16LE(1, 20);       // AudioFormat (PCM)
  header.writeUInt16LE(1, 22);       // NumChannels (1 = Mono)
  header.writeUInt32LE(24000, 24);   // SampleRate
  header.writeUInt32LE(24000 * 2, 28); // ByteRate (SampleRate * NumChannels * 2)
  header.writeUInt16LE(2, 32);       // BlockAlign
  header.writeUInt16LE(16, 34);      // BitsPerSample
  header.write('data', 36);
  header.writeUInt32LE(pcmLength, 40);

  const fullAudio = Buffer.concat([header, pcmBuffer]);
  return `data:audio/wav;base64,${fullAudio.toString('base64')}`;
}

const generateEmergencyAudioFlow = ai.defineFlow(
  {
    name: 'generateEmergencyAudioFlow',
    inputSchema: TTSEmergencyInputSchema,
    outputSchema: z.object({ media: z.string() }),
  },
  async (input) => {
    // Texto minimalista para reducir latencia de cómputo del modelo
    const text = `${input.motivo}. En ${input.ubicacion}. Unidades: ${input.unidades.join(' ')}.`;

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: text,
    });

    if (!media) throw new Error('No media returned');

    const pcmBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    return {
      media: createWavDataUri(pcmBuffer),
    };
  }
);
