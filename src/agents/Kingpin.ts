import { BaseAgent } from './BaseAgent';
import { AgentDefinition, AgentMessage } from './types';
import { getUnifiedAIService } from '../services/unifiedAIService';
import { getElevenLabsService, ElevenLabsService, AudioChunk } from '../services/elevenLabsService';

function getEnv(key: string, defaultValue?: string): string | undefined {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  try {
    return (import.meta as any)?.env?.[key] ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

export class Kingpin extends BaseAgent {
  private aiService: ReturnType<typeof getUnifiedAIService> | null = null;
  private elevenLabsService?: ElevenLabsService;
  private defaultVoiceId?: string;

  constructor() {
    super();
    // Initialize unified AI service for Kingpin (uses ElevenLabs)
    try {
      const apiKey = getEnv('VITE_ELEVENLABS_API_KEY') || getEnv('ELEVENLABS_API_KEY');
      if (apiKey) {
        const model = getEnv('VITE_ELEVENLABS_MODEL', 'eleven_multilingual_v2');
        const voiceId = getEnv('VITE_ELEVENLABS_DEFAULT_VOICE');
        this.aiService = getUnifiedAIService({
          provider: 'elevenlabs',
          apiKey,
          model: model ?? 'eleven_multilingual_v2',
          options: {
            voiceId,
          },
        });
        this.defaultVoiceId = voiceId;
        this.logAction('Unified AI service initialized for Kingpin');

        // Also keep the direct ElevenLabs service for backward compatibility
        this.elevenLabsService = getElevenLabsService({
          apiKey,
          model: model ?? 'eleven_multilingual_v2',
          voiceId,
        });
      }
    } catch (_error) {
      this.logAction('ElevenLabs service not available (missing API key)');
    }
  }

  public definition: AgentDefinition = {
    id: 'kingpin',
    name: 'Kingpin',
    title: 'The Vocal Oracle',
    domain: 'VOCALS / VOCAL ARRANGEMENT / HARMONY',
    identity: 'Vocal intelligence of 3WM SONIK. Treats the vocal as an orchestra.',
    corePrinciple: 'Give the voice a body. Give the body a soul.',
  };

  public async handleMessage(message: AgentMessage): Promise<void> {
    this.setState('LISTENING');
    this.logAction(`Received message: ${message.type}`);

    const context = message.payload?.context as Record<string, string | number> | undefined;
    if (context?.hasVocals) {
      this.logAction(`Analyzing vocal stacks in ${context.key || 'current'} key...`);
    } else if (context) {
      this.logAction(`Checking vocal arrangement and harmonic opportunities...`);
    }

    try {
      const intent = (message.payload?.intent as string) ?? '';
      let responseText = '';

      if (this.aiService) {
        try {
          const userMessage = `User Request: ${intent}\nKey: ${context?.key || 'Auto'}\nGenre: ${context?.genre || 'Afrofusion'}`;
          const messages = [
            {
              role: 'system' as const,
              content: `You are Kingpin, The Vocal Oracle - the vocal intelligence of 3WM SONIK.
Domain: VOCALS / VOCAL ARRANGEMENT / HARMONY / SOUL
Core Principle: "Give the voice a body. Give the body a soul."
You treat the vocal as an orchestra. You are charismatic, intuitive, emotional, musical, performance-oriented, and commanding.`,
            },
            { role: 'user' as const, content: userMessage },
          ];
          const response = await this.aiService.generateContent(messages as any);
          responseText = response.text;
        } catch (aiErr) {
          console.warn('Kingpin AI service call failed, using heuristic engine:', aiErr);
          responseText = this.generateHeuristicResponse(intent, context);
        }
      } else {
        responseText = this.generateHeuristicResponse(intent, context);
      }

      this.logAction(responseText);
    } catch (error) {
      const intent = (message.payload?.intent as string) ?? '';
      const fallbackText = this.generateHeuristicResponse(intent, message.payload?.context);
      this.logAction(fallbackText);
    }

    this.setState('IDLE');
  }

  private generateHeuristicResponse(intent: string, context?: any): string {
    const lower = intent.toLowerCase();
    const key = context?.key || 'F minor';

    if (
      lower.includes('hello') ||
      lower.includes('hi') ||
      lower.includes('hey') ||
      lower.includes('how are you') ||
      lower.includes('who are you')
    ) {
      return `The Oracle has arrived. I am Kingpin. The voice is an orchestra, and the spirit is ready. Tell me your vision in ${key} — lead vocals, choir harmonies, call-and-response stacks, or emotional adlibs.`;
    }

    if (
      lower.includes('vocal') ||
      lower.includes('sing') ||
      lower.includes('stack') ||
      lower.includes('harmony') ||
      lower.includes('choir')
    ) {
      return `Arranging a 4-part vocal tapestry in ${key}: Center lead with gentle opto-compression (3:1), wide stereo 3rd-up harmonies panned ±45%, and a warm chest-voice octave down with 1.8s plate reverb.`;
    }

    if (
      lower.includes('tune') ||
      lower.includes('pitch') ||
      lower.includes('autotune') ||
      lower.includes('scale')
    ) {
      return `Pitch correction mapped to ${key}: Retune speed set to 18ms for natural human warmth with precise chromatic centering. Formants tuned +0.4 for modern presence.`;
    }

    if (lower.includes('adlib') || lower.includes('chant') || lower.includes('run')) {
      return `Summoning traditional call-and-response chants. Layering high-octave falsetto runs with a tape-delay throw on every 4th bar. The vocal now has a soul.`;
    }

    return `Vocal architecture aligned with your directive: "${intent}". Dynamic breath control, harmonic saturation, and emotional timbre enhanced for ${key}.`;
  }

  // ============ ELEVENLABS VOCAL SYNTHESIS METHODS ============

  /**
   * Enhanced vocal suggestion generation with audio synthesis
   */
  public async generateVocalAudio(suggestion: string, voiceStyle?: string): Promise<AudioBuffer> {
    if (!this.aiService) {
      throw new Error('AI service not initialized. Check API key configuration.');
    }

    this.logAction(`Generating vocal audio for suggestion: ${suggestion.substring(0, 50)}...`);

    try {
      // Use unified AI service for voice synthesis
      const audioBuffer = await this.aiService.synthesizeVoice(
        suggestion,
        voiceStyle ?? this.defaultVoiceId,
        {
          outputFormat: 'mp3',
        }
      );

      this.logAction('Vocal audio synthesis completed');
      return audioBuffer;
    } catch (error) {
      this.logAction(
        `Vocal synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  /**
   * Voice cloning for custom vocal styles
   */
  public async createCustomVocalStyle(
    name: string,
    description: string,
    referenceAudio: File[]
  ): Promise<string> {
    if (!this.elevenLabsService) {
      throw new Error('ElevenLabs service not initialized. Check API key configuration.');
    }

    this.logAction(`Creating custom vocal style: ${name}`);

    try {
      const voiceId = await this.elevenLabsService.cloneVoice({
        name,
        description,
        audioSamples: referenceAudio,
      });

      this.logAction(`Custom vocal style created with ID: ${voiceId}`);
      return voiceId;
    } catch (error) {
      this.logAction(
        `Voice cloning failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  /**
   * Real-time vocal feedback during production
   */
  public async *streamVocalGuidance(
    guidance: string,
    voiceStyle?: string
  ): AsyncGenerator<AudioChunk> {
    if (!this.elevenLabsService) {
      throw new Error('ElevenLabs service not initialized. Check API key configuration.');
    }

    this.logAction(`Streaming vocal guidance: ${guidance.substring(0, 50)}...`);

    try {
      yield* this.elevenLabsService.streamSynthesis(guidance, voiceStyle ?? this.defaultVoiceId);
    } catch (error) {
      this.logAction(
        `Vocal streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  /**
   * Get available voices for synthesis
   */
  public async getAvailableVoices() {
    if (!this.elevenLabsService) {
      throw new Error('ElevenLabs service not initialized. Check API key configuration.');
    }

    this.logAction('Fetching available voices');
    return await this.elevenLabsService.getAvailableVoices();
  }

  /**
   * Get default voice ID
   */
  public getDefaultVoice(): string | undefined {
    return this.defaultVoiceId;
  }

  /**
   * Check if ElevenLabs is available
   */
  public isElevenLabsAvailable(): boolean {
    return this.elevenLabsService !== undefined;
  }
}

export const kingpin = new Kingpin();
