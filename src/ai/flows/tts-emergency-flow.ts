
'use server';
/**
 * @fileOverview Flujo de Genkit optimizado para convertir avisos de emergencia en voz con mínima latencia.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import wav from 'wav';
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

async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

const generateEmergencyAudioFlow = ai.defineFlow(
  {
    name: 'generateEmergencyAudioFlow',
    inputSchema: TTSEmergencyInputSchema,
    outputSchema: z.object({ media: z.string() }),
  },
  async (input) => {
    const unitsStr = input.unidades.join(', ');
    // Texto acortado para reducir latencia de generación (Gemini genera más rápido textos breves)
    const text = `Aviso: ${input.motivo}. Ubicación: ${input.ubicacion}. Unidades: ${unitsStr}.`;

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

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      media: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
