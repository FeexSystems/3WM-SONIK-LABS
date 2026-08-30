// 3WM SONIK - TrueFoundry API Integration Service
// Provides AI capabilities through TrueFoundry gateway (Claude, Grok, GPT-4o-mini, TTS, Embeddings)
import OpenAI from 'openai';

export interface TrueFoundryConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  defaultVoice?: string;
  defaultTTSModel?: string;
  defaultEmbeddingModel?: string;
}

export interface TrueFoundryChatResponse {
  text: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface TrueFoundryTTSResponse {
  audioBuffer: ArrayBuffer;
  format: string;
  duration: number;
}

export interface TrueFoundryEmbeddingResponse {
  embeddings: number[][];
  model: string;
  dimensions: number;
}

export interface TrueFoundryMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class TrueFoundryService {
  private config: TrueFoundryConfig;
  private openai: OpenAI;
  private cache: Map<string, { response: any; timestamp: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor(config: TrueFoundryConfig) {
    this.config = {
      baseUrl: 'https://gateway.truefoundry.ai/api/llm',
      defaultModel: 'anthropic/claude-haiku-4-5-20251001',
      defaultVoice: 'alloy',
      defaultTTSModel: 'openai/gpt-4o-mini-tts-2025-12-15',
      defaultEmbeddingModel: 'aws-bedrock/us.cohere.embed-v4-0',
      ...config,
    };

    // Initialize OpenAI client pointing to TrueFoundry Gateway
    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseUrl,
      dangerouslyAllowBrowser: true,
    });
  }

  /**
   * Generate chat completions with TrueFoundry
   */
  public async chatCompletions(
    messages: TrueFoundryMessage[],
    model?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<TrueFoundryChatResponse> {
    const cacheKey = this.generateCacheKey(messages, model, options);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.response;
    }

    const selectedModel = model || this.config.defaultModel!;

    try {
      const response = await this.openai.chat.completions.create(
        {
          model: selectedModel,
          messages: messages as any,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 4096,
        },
        {
          headers: {
            'X-TFY-METADATA': '{}',
            'X-TFY-LOGGING-CONFIG': '{"enabled": true}',
          },
        }
      );

      const tfResponse: TrueFoundryChatResponse = {
        text: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        finishReason: response.choices[0]?.finish_reason || 'stop',
      };

      // Cache the response
      this.cache.set(cacheKey, {
        response: tfResponse,
        timestamp: Date.now(),
      });

      return tfResponse;
    } catch (error) {
      console.error('TrueFoundry chat completions failed:', error);
      throw new Error(
        `TrueFoundry chat completions failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Stream chat completions with TrueFoundry
   */
  public async *chatCompletionsStream(
    messages: TrueFoundryMessage[],
    model?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): AsyncGenerator<string, void, unknown> {
    const selectedModel = model || this.config.defaultModel!;

    try {
      const stream = await this.openai.chat.completions.create(
        {
          model: selectedModel,
          messages: messages as any,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 4096,
          stream: true,
        },
        {
          headers: {
            'X-TFY-METADATA': '{}',
            'X-TFY-LOGGING-CONFIG': '{"enabled": true}',
          },
        }
      );

      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          yield chunk.choices[0].delta.content;
        }
      }
    } catch (error) {
      console.error('TrueFoundry streaming failed:', error);
      throw new Error(
        `TrueFoundry streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Text-to-Speech with TrueFoundry (OpenAI TTS)
   */
  public async textToSpeech(
    text: string,
    model?: string,
    voice?: string,
    options?: {
      format?: 'wav' | 'mp3';
      languageCode?: string;
    }
  ): Promise<TrueFoundryTTSResponse> {
    const selectedModel = model || this.config.defaultTTSModel!;
    const selectedVoice = voice || this.config.defaultVoice!;
    const format = options?.format || 'wav';

    try {
      // Utilizing the SDK for audio generation
      const response = await this.openai.audio.speech.create(
        {
          model: selectedModel,
          voice: selectedVoice as any,
          input: text,
          response_format: format as any,
        },
        {
          headers: {
            'X-TFY-METADATA': '{}',
            'X-TFY-LOGGING-CONFIG': '{"enabled": true}',
          },
        }
      );

      const arrayBuffer = await response.arrayBuffer();

      return {
        audioBuffer: arrayBuffer,
        format,
        duration: arrayBuffer.byteLength, // Approximate duration
      };
    } catch (error) {
      console.error('TrueFoundry TTS failed:', error);
      throw new Error(
        `TrueFoundry TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Text-to-Speech with Google Vertex TTS via TrueFoundry
   */
  public async googleVertexTTS(
    text: string,
    voice?: string,
    options?: {
      languageCode?: string;
      format?: 'mp3' | 'wav';
    }
  ): Promise<TrueFoundryTTSResponse> {
    const selectedVoice = voice || 'en-US-Wavenet-D';
    const languageCode = options?.languageCode || 'en-US';
    const format = options?.format || 'mp3';

    try {
      // Keeping fetch for Vertex as it uses standard Google Cloud TTS REST interface
      const response = await fetch('https://gateway.truefoundry.ai/tts/google-vertex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tfy-api-key': this.config.apiKey,
          'x-tfy-model-name': 'google-vertex/gemini-3.1-flash-tts-preview',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            language_code: languageCode,
            name: selectedVoice,
          },
          audio_config: {
            audio_encoding: format.toUpperCase() === 'MP3' ? 'MP3' : 'LINEAR16',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`TrueFoundry Google Vertex TTS error: ${response.status} - ${error}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      return {
        audioBuffer: arrayBuffer,
        format,
        duration: arrayBuffer.byteLength,
      };
    } catch (error) {
      console.error('TrueFoundry Google Vertex TTS failed:', error);
      throw new Error(
        `TrueFoundry Google Vertex TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create embeddings with TrueFoundry (Cohere)
   */
  public async createEmbeddings(
    input: string | string[],
    model?: string,
    options?: {
      encodingFormat?: 'float' | 'base64';
    }
  ): Promise<TrueFoundryEmbeddingResponse> {
    const selectedModel = model || this.config.defaultEmbeddingModel!;
    const encodingFormat = options?.encodingFormat || 'float';

    try {
      const response = await this.openai.embeddings.create(
        {
          input,
          model: selectedModel,
          encoding_format: encodingFormat as any,
        },
        {
          headers: {
            'X-TFY-METADATA': '{}',
            'X-TFY-LOGGING-CONFIG': '{"enabled": true}',
          },
        }
      );

      const embeddings: number[][] = response.data.map(
        (item) =>
          (typeof item.embedding === 'string'
            ? JSON.parse(item.embedding)
            : item.embedding) as number[]
      );

      return {
        embeddings,
        model: selectedModel,
        dimensions: embeddings[0]?.length ?? 0,
      };
    } catch (error) {
      console.error('TrueFoundry embeddings failed:', error);
      throw new Error(
        `TrueFoundry embeddings failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate cache key for caching responses
   */
  private generateCacheKey(messages: TrueFoundryMessage[], model?: string, options?: any): string {
    const messagesStr = messages.map((m) => `${m.role}:${m.content}`).join('|');
    const modelStr = model || this.config.defaultModel;
    const optionsStr = options ? JSON.stringify(options) : '';
    return `${modelStr}:${messagesStr}:${optionsStr}`;
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  public clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    hitRate: number;
    expiredCount: number;
  } {
    const now = Date.now();
    let expiredCount = 0;

    for (const value of this.cache.values()) {
      if (now - value.timestamp > this.cacheTTL) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      hitRate: 0,
      expiredCount,
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<TrueFoundryConfig>): void {
    this.config = { ...this.config, ...config };
    // Reinitialize OpenAI client if key or baseUrl changes
    if (config.apiKey || config.baseUrl) {
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseUrl,
      });
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): TrueFoundryConfig {
    return { ...this.config };
  }

  /**
   * Get available models
   */
  public getAvailableModels(): {
    chat: string[];
    tts: string[];
    embeddings: string[];
  } {
    return {
      chat: [
        'anthropic/claude-haiku-4-5-20251001',
        'aws-claude-platform/claude-haiku-4-5-20251001',
        'xai/grok-build-latest',
        'openai/gpt-4o-mini',
      ],
      tts: ['openai/gpt-4o-mini-tts-2025-12-15', 'google-vertex/gemini-2.5-flash-tts'],
      embeddings: ['aws-bedrock/us.cohere.embed-v4-0'],
    };
  }

  /**
   * Check if API key is valid
   */
  public async validateApiKey(): Promise<boolean> {
    try {
      await this.openai.chat.completions.create(
        {
          messages: [{ role: 'user', content: 'Hello' }],
          model: this.config.defaultModel!,
          max_tokens: 10,
        },
        {
          headers: {
            'X-TFY-METADATA': '{}',
            'X-TFY-LOGGING-CONFIG': '{"enabled": true}',
          },
        }
      );
      return true;
    } catch {
      return false;
    }
  }
}

// Create singleton instance with environment configuration
let trueFoundryServiceInstance: TrueFoundryService | null = null;

export function getTrueFoundryService(): TrueFoundryService {
  if (!trueFoundryServiceInstance) {
    const apiKey = process.env.TRUEFOUNDRY_API_KEY;
    if (!apiKey) {
      throw new Error('TrueFoundry API key not found in environment variables');
    }

    trueFoundryServiceInstance = new TrueFoundryService({ apiKey });
  }

  return trueFoundryServiceInstance;
}

export function resetTrueFoundryService(): void {
  trueFoundryServiceInstance = null;
}
