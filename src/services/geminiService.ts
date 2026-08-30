// 3WM SONIK - Google Gemini API Integration Service
// Provides AI capabilities for the Three Wise Men agent system

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export interface GeminiMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

export interface GeminiToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface GeminiInteractionConfig {
  model?: string;
  agent?: 'deep-research-preview-04-2026' | 'deep-research-max-preview-04-2026' | string;
  input: string | any[];
  systemInstruction?: string;
  previousInteractionId?: string;
  store?: boolean;
  background?: boolean;
  agentConfig?: {
    type: 'deep-research' | string;
    thinking_summaries?: 'auto' | 'none';
    visualization?: 'auto' | 'off';
    collaborative_planning?: boolean;
  };
  tools?: any[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

export interface LyriaMusicConfig {
  model?: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
  prompt: string;
  images?: Array<{ mimeType: string; data: string }>;
  responseFormat?: { type: 'audio' };
}

export interface LyriaMusicResponse {
  id: string;
  audioBase64?: string;
  audioMimeType: string;
  lyrics?: string;
  structure?: string;
  model: string;
}

export interface DeepResearchProgressStep {
  timestamp: string;
  step: string;
  details?: string;
}

export interface GeminiInteractionResponse {
  id: string;
  text: string;
  model?: string;
  agent?: string;
  status?: 'in_progress' | 'completed' | 'failed';
  error?: string;
  steps?: DeepResearchProgressStep[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  previousInteractionId?: string;
}

export class GeminiService {
  private config: GeminiConfig;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta';
  private cache: Map<string, { response: GeminiResponse; timestamp: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor(config: GeminiConfig) {
    this.config = {
      model: 'gemini-3.7-flash',
      temperature: 0.7,
      maxTokens: 4096,
      topP: 0.9,
      topK: 40,
      ...config,
    };
  }

  /**
   * Create an Interaction using the Gemini Interactions API
   * Supports standard models and autonomous agents (e.g. deep-research-preview-04-2026).
   */
  public async createInteraction(
    params: GeminiInteractionConfig
  ): Promise<GeminiInteractionResponse> {
    const isAgent = !!params.agent;
    const model = isAgent ? undefined : params.model || this.config.model || 'gemini-3.7-flash';

    try {
      const payload: Record<string, any> = {
        input: params.input,
        system_instruction: params.systemInstruction,
        previous_interaction_id: params.previousInteractionId,
        store: params.store !== undefined ? params.store : true,
        background: params.background || false,
        tools: params.tools,
      };

      if (isAgent) {
        payload.agent = params.agent;
        if (params.agentConfig) {
          payload.agent_config = params.agentConfig;
        }
      } else {
        payload.model = model;
        payload.generation_config = {
          temperature: params.generationConfig?.temperature ?? this.config.temperature,
          max_output_tokens: params.generationConfig?.maxOutputTokens ?? this.config.maxTokens,
          top_p: params.generationConfig?.topP ?? this.config.topP,
          top_k: params.generationConfig?.topK ?? this.config.topK,
        };
      }

      const response = await fetch(`${this.baseUrl}/interactions?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (!isAgent) {
          return this.fallbackToGenerateContent(params);
        }
        const err = await response.json();
        throw new Error(err.error?.message || response.statusText);
      }

      const data = await response.json();
      const outputText =
        data.model_output?.text ||
        data.steps
          ?.find((s: any) => s.type === 'model_output')
          ?.content?.map((c: any) => c.text)
          .filter(Boolean)
          .join('\n') ||
        data.steps?.find((s: any) => s.type === 'model_output')?.text ||
        data.text ||
        '';

      return {
        id: data.id || `interaction-${Date.now()}`,
        text: outputText,
        model: data.model || model,
        agent: data.agent || params.agent,
        status: data.status || 'completed',
        steps: data.steps || [],
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        previousInteractionId: params.previousInteractionId,
      };
    } catch (err) {
      if (!isAgent) {
        console.warn('Interactions API direct call fallback:', err);
        return this.fallbackToGenerateContent(params);
      }
      throw err;
    }
  }

  /**
   * Retrieve the status and results of an existing Interaction (for background tasks like Deep Research)
   */
  public async getInteraction(interactionId: string): Promise<GeminiInteractionResponse> {
    const response = await fetch(
      `${this.baseUrl}/interactions/${interactionId}?key=${this.config.apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `Failed to fetch interaction ${interactionId}`);
    }

    const data = await response.json();
    const outputText =
      data.model_output?.text ||
      data.steps
        ?.find((s: any) => s.type === 'model_output')
        ?.content?.map((c: any) => c.text)
        .filter(Boolean)
        .join('\n') ||
      data.steps?.find((s: any) => s.type === 'model_output')?.text ||
      data.text ||
      '';

    return {
      id: data.id,
      text: outputText,
      model: data.model,
      agent: data.agent,
      status: data.status || 'completed',
      error: data.error,
      steps: data.steps || [],
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      previousInteractionId: data.previous_interaction_id,
    };
  }

  /**
   * Start an autonomous Deep Research task
   */
  public async startDeepResearch(params: {
    topic: string;
    agentVersion?: 'deep-research-preview-04-2026' | 'deep-research-max-preview-04-2026';
    collaborativePlanning?: boolean;
    visualization?: boolean;
    thinkingSummaries?: boolean;
    previousInteractionId?: string;
    tools?: any[];
    multimodalInputs?: any[];
  }): Promise<GeminiInteractionResponse> {
    const agent = params.agentVersion || 'deep-research-preview-04-2026';

    let input: any = params.topic;
    if (params.multimodalInputs && params.multimodalInputs.length > 0) {
      input = [{ type: 'text', text: params.topic }, ...params.multimodalInputs];
    }

    return this.createInteraction({
      agent,
      input,
      background: true,
      store: true,
      previousInteractionId: params.previousInteractionId,
      agentConfig: {
        type: 'deep-research',
        thinking_summaries: params.thinkingSummaries !== false ? 'auto' : 'none',
        visualization: params.visualization !== false ? 'auto' : 'off',
        collaborative_planning: !!params.collaborativePlanning,
      },
      tools: params.tools,
    });
  }

  /**
   * Poll an ongoing background Deep Research task until completion
   */
  public async pollDeepResearch(
    interactionId: string,
    onProgress?: (interaction: GeminiInteractionResponse) => void,
    delayMs: number = 5000,
    maxAttempts: number = 120
  ): Promise<GeminiInteractionResponse> {
    let attempts = 0;
    while (attempts < maxAttempts) {
      const interaction = await this.getInteraction(interactionId);
      if (onProgress) {
        onProgress(interaction);
      }

      if (interaction.status === 'completed') {
        return interaction;
      }
      if (interaction.status === 'failed') {
        throw new Error(`Deep Research failed: ${interaction.error || 'Unknown error'}`);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempts++;
    }

    throw new Error(`Deep Research timed out after ${(attempts * delayMs) / 1000} seconds.`);
  }

  /**
   * Generate 44.1 kHz stereo music using Google Lyria 3 (Clip or Pro)
   * Supports multimodal prompt inputs (text + visual moodboard images)
   */
  public async generateLyriaMusic(config: LyriaMusicConfig): Promise<LyriaMusicResponse> {
    const model = config.model || 'lyria-3-clip-preview';

    let inputPayload: any = config.prompt;
    if (config.images && config.images.length > 0) {
      inputPayload = [
        { type: 'text', text: config.prompt },
        ...config.images.map((img) => ({
          type: 'image',
          mime_type: img.mimeType,
          data: img.data,
        })),
      ];
    }

    try {
      const response = await fetch(`${this.baseUrl}/interactions?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: inputPayload,
          response_format: config.responseFormat || { type: 'audio' },
          store: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Lyria generation failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract audio data and lyrics from steps
      let audioBase64: string | undefined = data.output_audio?.data;
      let lyrics: string | undefined = data.output_text;

      if (!audioBase64 && data.steps) {
        for (const step of data.steps) {
          if (step.type === 'model_output' && step.content) {
            for (const content of step.content) {
              if (content.type === 'audio' && content.data) {
                audioBase64 = content.data;
              } else if (content.type === 'text' && content.text) {
                lyrics = (lyrics ? `${lyrics}\n` : '') + content.text;
              }
            }
          }
        }
      }

      return {
        id: data.id || `lyria-${Date.now()}`,
        audioBase64,
        audioMimeType: 'audio/mp3',
        lyrics,
        model,
      };
    } catch (err) {
      console.warn('Lyria API invocation failed:', err);
      throw err;
    }
  }

  private async fallbackToGenerateContent(
    params: GeminiInteractionConfig
  ): Promise<GeminiInteractionResponse> {
    const messages: GeminiMessage[] = [];
    if (params.systemInstruction) {
      messages.push({ role: 'system', content: params.systemInstruction });
    }
    messages.push({
      role: 'user',
      content: typeof params.input === 'string' ? params.input : JSON.stringify(params.input),
    });

    const res = await this.generateContent(messages, params.tools);
    return {
      id: `fallback-${Date.now()}`,
      text: res.text,
      model: res.model,
      usage: res.usage,
      previousInteractionId: params.previousInteractionId,
    };
  }

  /**
   * Generate content with Gemini API
   */
  public async generateContent(messages: GeminiMessage[], tools?: any[]): Promise<GeminiResponse> {
    const cacheKey = this.generateCacheKey(messages, tools);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.response;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: messages.map((msg) => ({
              role: msg.role === 'model' ? 'model' : 'user',
              parts: [{ text: msg.content }],
            })),
            generationConfig: {
              temperature: this.config.temperature,
              maxOutputTokens: this.config.maxTokens,
              topP: this.config.topP,
              topK: this.config.topK,
            },
            tools: tools ? [{ functionDeclarations: tools }] : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const geminiResponse = this.parseResponse(data);

      // Cache the response
      this.cache.set(cacheKey, {
        response: geminiResponse,
        timestamp: Date.now(),
      });

      return geminiResponse;
    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  /**
   * Generate content with streaming
   */
  public async *generateContentStream(
    messages: GeminiMessage[],
    tools?: any[]
  ): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.config.model}:streamGenerateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: messages.map((msg) => ({
              role: msg.role === 'model' ? 'model' : 'user',
              parts: [{ text: msg.content }],
            })),
            generationConfig: {
              temperature: this.config.temperature,
              maxOutputTokens: this.config.maxTokens,
              topP: this.config.topP,
              topK: this.config.topK,
            },
            tools: tools ? [{ functionDeclarations: tools }] : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim().startsWith('data:')) {
            const data = JSON.parse(line.trim().slice(5));
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              yield data.candidates[0].content.parts[0].text;
            }
          }
        }
      }
    } catch (error) {
      console.error('Gemini streaming failed:', error);
      throw error;
    }
  }

  /**
   * Parse Gemini API response
   */
  private parseResponse(data: any): GeminiResponse {
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.[0];

    return {
      text: content?.text || '',
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      model: this.config.model || 'gemini-3.7-flash',
      finishReason: candidate?.finishReason || 'STOP',
    };
  }

  /**
   * Generate cache key for caching responses
   */
  private generateCacheKey(messages: GeminiMessage[], tools?: any[]): string {
    const messagesStr = messages.map((m) => `${m.role}:${m.content}`).join('|');
    const toolsStr = tools ? JSON.stringify(tools) : '';
    return `${this.config.model}:${messagesStr}:${toolsStr}`;
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
      hitRate: 0, // Would need to track hits/misses
      expiredCount,
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if Gemini service is available
   */
  public async isAvailable(): Promise<boolean> {
    return this.validateApiKey();
  }

  /**
   * Generate simple text from prompt
   */
  public async generateText(params: { model?: string; prompt: string }): Promise<{ text: string }> {
    const interaction = await this.createInteraction({
      model: params.model ?? this.config.model,
      input: params.prompt,
    });
    return { text: interaction.text };
  }

  /**
   * Get current configuration
   */
  public getConfig(): GeminiConfig {
    return { ...this.config };
  }

  /**
   * Check if API key is valid
   */
  public async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
            generationConfig: {
              maxOutputTokens: 10,
            },
          }),
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }
}

// Create singleton instance with environment configuration
let geminiServiceInstance: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!geminiServiceInstance) {
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found in environment variables');
    }

    geminiServiceInstance = new GeminiService({ apiKey });
  }

  return geminiServiceInstance;
}

export function resetGeminiService(): void {
  geminiServiceInstance = null;
}
