// TrueFoundry Adapter for Unified AI Service Layer
// Implements UnifiedAIService interface using TrueFoundry gateway

import {
  UnifiedAIService,
  UnifiedAIServiceConfig,
  AIMessage,
  AIResponse,
  AIChunk,
  AudioAnalysis,
} from './unifiedAIService';
import { TrueFoundryService, TrueFoundryMessage } from './trueFoundryService';

export class TrueFoundryAdapter implements UnifiedAIService {
  private config: UnifiedAIServiceConfig;
  private trueFoundryService: TrueFoundryService;

  constructor(config: UnifiedAIServiceConfig) {
    this.config = config;
    this.trueFoundryService = new TrueFoundryService({
      apiKey: config.apiKey,
      baseUrl: 'https://gateway.truefoundry.ai/api/llm',
      defaultModel: config.model || 'anthropic/claude-haiku-4-5-20251001',
      defaultVoice: config.options?.voiceId,
      defaultTTSModel: config.options?.ttsModel,
      defaultEmbeddingModel: config.options?.embeddingModel,
    });
  }

  async generateContent(messages: AIMessage[], config?: Record<string, any>): Promise<AIResponse> {
    try {
      const tfMessages: TrueFoundryMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const model = config?.model || this.config.model;
      const response = await this.trueFoundryService.chatCompletions(tfMessages, model, {
        temperature: config?.temperature,
        maxTokens: config?.maxTokens,
      });

      return {
        text: response.text,
        model: response.model,
        usage: response.usage,
        metadata: {
          finishReason: response.finishReason,
        },
      };
    } catch (error) {
      throw new Error(
        `TrueFoundry generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async *streamContent(
    messages: AIMessage[],
    config?: Record<string, any>
  ): AsyncGenerator<AIChunk> {
    try {
      const tfMessages: TrueFoundryMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const model = config?.model || this.config.model;
      const stream = this.trueFoundryService.chatCompletionsStream(tfMessages, model, {
        temperature: config?.temperature,
        maxTokens: config?.maxTokens,
      });

      for await (const chunk of stream) {
        yield {
          text: chunk,
          done: false,
        };
      }

      // Final chunk to indicate completion
      yield {
        text: '',
        done: true,
      };
    } catch (error) {
      throw new Error(
        `TrueFoundry streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  analyzeAudio(_audioBuffer: AudioBuffer, _analysisType: string): Promise<AudioAnalysis> {
    return Promise.reject(new Error('Audio analysis not supported by TrueFoundry adapter'));
  }

  async synthesizeVoice(
    text: string,
    voiceId?: string,
    options?: Record<string, any>
  ): Promise<AudioBuffer> {
    try {
      const voice = voiceId ?? this.config.options?.voiceId ?? 'alloy';
      const model =
        options?.model ?? this.config.options?.ttsModel ?? 'openai/gpt-4o-mini-tts-2025-12-15';
      const format = options?.format ?? 'wav';

      let response;

      // Use Google Vertex TTS if model starts with google-vertex
      if (typeof model === 'string' && model.startsWith('google-vertex')) {
        response = await this.trueFoundryService.googleVertexTTS(text, voice, {
          format,
          languageCode: options?.languageCode,
        });
      } else {
        response = await this.trueFoundryService.textToSpeech(text, model, voice, {
          format,
        });
      }

      // In a Node environment, window does not exist. We convert ArrayBuffer to a Node Buffer.
      // Cast to 'any' to satisfy the AudioBuffer interface strictly defined in unifiedAIService.
      return Buffer.from(response.audioBuffer) as any;
    } catch (error) {
      throw new Error(
        `TrueFoundry voice synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  getAvailableModels(): string[] {
    const models = this.trueFoundryService.getAvailableModels();
    return [...models.chat, ...models.tts, ...models.embeddings];
  }

  getCapabilities() {
    return {
      textGeneration: true,
      audioAnalysis: false,
      voiceSynthesis: true,
      streaming: true,
    };
  }
}
