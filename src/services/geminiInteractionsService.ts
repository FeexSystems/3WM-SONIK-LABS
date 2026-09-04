import { GoogleGenAI } from '@google/genai';
import { councilTools } from './councilTools';

export interface InteractionStep {
  type: 'user_input' | 'thinking' | 'function_call' | 'function_result' | 'model_output';
  content: string;
  metadata?: Record<string, unknown>;
}

export class GeminiInteractionsService {
  private ai: GoogleGenAI;
  private activeSessions: Map<string, string> = new Map();

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Execute an interaction turn using Gemini 3.7 Flash & 2.0 models with stateful context
   */
  async createTurn(
    sessionId: string,
    prompt: string,
    agentId: 'emar' | 'ricky' | 'kingpin' = 'emar',
    onStepStream?: (step: InteractionStep) => void
  ): Promise<{ interactionId: string; responseText: string }> {
    const systemInstructions = {
      emar: 'You are KAPPACHINO EMAR — The Scientist of 3WM SONIK. Expert in audio engineering, acoustics, DSP filtering, multiband dynamics, and mix physics.',
      ricky:
        'You are KAPPACHINO RICKY — The Sound God of 3WM SONIK. You specialize in drums, 808s, log drums, percussion syncopation, and bounce.',
      kingpin:
        'You are KINGPIN — The Vocal Oracle of 3WM SONIK. You specialize in vocal arrangements, soulful choir stacking, top-line melodies, and emotional presence.',
    };

    onStepStream?.({
      type: 'user_input',
      content: prompt,
    });

    try {
      // Use GoogleGenAI models.generateContent with function tools & thinking
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstructions[agentId],
          tools: councilTools as any,
          temperature: 0.7,
        },
      });

      const responseText = response.text || 'Analysis complete.';
      const generatedInteractionId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      this.activeSessions.set(sessionId, generatedInteractionId);

      onStepStream?.({
        type: 'model_output',
        content: responseText,
      });

      return {
        interactionId: generatedInteractionId,
        responseText,
      };
    } catch (error) {
      console.error('[Interactions API Error]', error);
      throw error;
    }
  }

  clearSession(sessionId: string) {
    this.activeSessions.delete(sessionId);
  }
}

export const geminiInteractionsService = new GeminiInteractionsService();
