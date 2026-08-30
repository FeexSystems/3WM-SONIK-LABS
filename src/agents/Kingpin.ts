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

    if (message.payload?.context?.hasVocals) {
      this.logAction(`Analyzing vocal stacks in ${message.payload.context.key} key...`);
    } else if (message.payload?.context) {
      this.logAction(`Checking for vocal arrangement opportunities...`);
    }

    // Process message logic here
    await new Promise((resolve) => setTimeout(resolve, 2500));

    this.setState('IDLE');
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
