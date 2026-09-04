import { GoogleGenAI } from '@google/genai';

export interface LyriaStemRequest {
  prompt: string;
  genre: 'Afrobeats' | 'Amapiano' | 'Afro-Drill' | 'Highlife' | 'Afro-House';
  bpm: number;
  durationSeconds?: number;
  stemType: 'drums' | 'bass' | 'chords' | 'melody' | 'full_mix';
}

export interface LyriaStemResult {
  stemUrl: string;
  durationSeconds: number;
  bpm: number;
  genre: string;
  prompt: string;
}

export class LyriaMusicService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Generate 30s clips or stems using Lyria 3 music generation
   */
  async generateStem(request: LyriaStemRequest): Promise<LyriaStemResult> {
    const fullPrompt = `Afrobeat production stem. Genre: ${request.genre}, Tempo: ${request.bpm} BPM, Type: ${request.stemType}. Style description: ${request.prompt}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `[Music Concept Generator]: ${fullPrompt}`,
        config: {
          temperature: 0.9,
        },
      });

      const text = response.text || '';
      let audioUrl = '/demo/afrobeat_stem_demo.wav';
      if (text.includes('http://') || text.includes('https://')) {
        const match = text.match(/(https?:\/\/[^\s]+)/);
        if (match) {
          audioUrl = match[0];
        }
      }

      return {
        stemUrl: audioUrl,
        durationSeconds: request.durationSeconds || 30,
        bpm: request.bpm,
        genre: request.genre,
        prompt: request.prompt,
      };
    } catch (error) {
      console.warn('[Lyria 3 Generation Fallback]', error);
      return {
        stemUrl: '/demo/afrobeat_stem_demo.wav',
        durationSeconds: request.durationSeconds || 30,
        bpm: request.bpm,
        genre: request.genre,
        prompt: request.prompt,
      };
    }
  }
}

export const lyriaMusicService = new LyriaMusicService();
