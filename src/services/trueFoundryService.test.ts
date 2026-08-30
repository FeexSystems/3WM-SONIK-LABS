// TrueFoundry Service Integration Tests

import { TrueFoundryService, TrueFoundryConfig, TrueFoundryMessage } from './trueFoundryService';

// Mock fetch API
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Polyfill TextEncoder for Node.js environment
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

describe('TrueFoundryService', () => {
  let service: TrueFoundryService;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  const testConfig: TrueFoundryConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://gateway.truefoundry.ai/api/llm',
    defaultModel: 'anthropic/claude-haiku-4-5-20251001',
  };

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
    service = new TrueFoundryService(testConfig);
  });

  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      expect(service.getConfig().apiKey).toBe(testConfig.apiKey);
      expect(service.getConfig().baseUrl).toBe(testConfig.baseUrl);
      expect(service.getConfig().defaultModel).toBe(testConfig.defaultModel);
    });

    it('should allow configuration updates', () => {
      service.updateConfig({ defaultModel: 'xai/grok-build-latest' });
      expect(service.getConfig().defaultModel).toBe('xai/grok-build-latest');
    });

    it('should return available models', () => {
      const models = service.getAvailableModels();
      expect(models.chat).toContain('anthropic/claude-haiku-4-5-20251001');
      expect(models.chat).toContain('xai/grok-build-latest');
      expect(models.tts).toContain('openai/gpt-4o-mini-tts-2025-12-15');
      expect(models.embeddings).toContain('aws-bedrock/us.cohere.embed-v4-0');
    });
  });

  describe('Chat Completions', () => {
    it('should successfully generate chat completion with Claude Haiku', async () => {
      const mockResponse = {
        choices: [
          {
            message: { content: 'Test response' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const messages: TrueFoundryMessage[] = [{ role: 'user', content: 'Hello' }];

      const response = await service.chatCompletions(
        messages,
        'anthropic/claude-haiku-4-5-20251001'
      );

      expect(response.text).toBe('Test response');
      expect(response.model).toBe('anthropic/claude-haiku-4-5-20251001');
      expect(response.usage?.totalTokens).toBe(15);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gateway.truefoundry.ai/api/llm/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-TFY-METADATA': '{}',
            'X-TFY-LOGGING-CONFIG': '{"enabled": true}',
          }),
        })
      );
    });

    it('should successfully generate chat completion with Grok', async () => {
      const mockResponse = {
        choices: [
          {
            message: { content: 'Grok response' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 8,
          completion_tokens: 4,
          total_tokens: 12,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const messages: TrueFoundryMessage[] = [{ role: 'user', content: 'Test' }];

      const response = await service.chatCompletions(messages, 'xai/grok-build-latest');

      expect(response.text).toBe('Grok response');
      expect(response.model).toBe('xai/grok-build-latest');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'API Error: Invalid request',
      } as Response);

      const messages: TrueFoundryMessage[] = [{ role: 'user', content: 'Hello' }];

      await expect(service.chatCompletions(messages)).rejects.toThrow('TrueFoundry API error');
    });

    it('should cache responses', async () => {
      const mockResponse = {
        choices: [
          {
            message: { content: 'Cached response' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const messages: TrueFoundryMessage[] = [{ role: 'user', content: 'Hello' }];

      // First call
      await service.chatCompletions(messages);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await service.chatCompletions(messages);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
    });
  });

  describe('Streaming Chat Completions', () => {
    it('should successfully stream chat completion', async () => {
      const mockChunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        'data: [DONE]\n\n',
      ];

      const mockReader = {
        read: jest
          .fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockChunks[0]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockChunks[1]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockChunks[2]) })
          .mockResolvedValueOnce({ done: true, value: new Uint8Array() }),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response);

      const messages: TrueFoundryMessage[] = [{ role: 'user', content: 'Hello' }];

      const chunks: string[] = [];
      for await (const chunk of service.chatCompletionsStream(messages)) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' world']);
    });

    it('should handle streaming errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Stream error',
      } as Response);

      const messages: TrueFoundryMessage[] = [{ role: 'user', content: 'Hello' }];

      const stream = service.chatCompletionsStream(messages);
      await expect(async () => {
        for await (const _ of stream) {
          // Should not reach here
        }
      }).rejects.toThrow('TrueFoundry streaming failed');
    });
  });

  describe('Text-to-Speech', () => {
    it('should successfully generate speech with OpenAI TTS', async () => {
      const mockAudioBuffer = new ArrayBuffer(1024);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockAudioBuffer,
      } as Response);

      const response = await service.textToSpeech(
        'Hello world',
        'openai/gpt-4o-mini-tts-2025-12-15',
        'alloy'
      );

      expect(response.audioBuffer).toBe(mockAudioBuffer);
      expect(response.format).toBe('wav');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gateway.truefoundry.ai/api/llm/audio/speech',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini-tts-2025-12-15',
            voice: 'alloy',
            input: 'Hello world',
            response_format: 'wav',
          }),
        })
      );
    });

    it('should handle TTS errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'TTS error',
      } as Response);

      await expect(
        service.textToSpeech('Hello', 'openai/gpt-4o-mini-tts-2025-12-15')
      ).rejects.toThrow('TrueFoundry TTS error');
    });
  });

  describe('Google Vertex TTS', () => {
    it('should successfully generate speech with Google Vertex TTS', async () => {
      const mockAudioBuffer = new ArrayBuffer(2048);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => mockAudioBuffer,
      } as Response);

      const response = await service.googleVertexTTS('Hello world', 'en-US-Wavenet-D');

      expect(response.audioBuffer).toBe(mockAudioBuffer);
      expect(response.format).toBe('mp3');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gateway.truefoundry.ai/tts/google-vertex',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-tfy-api-key': testConfig.apiKey,
            'x-tfy-model-name': 'google-vertex/gemini-2.5-flash-tts',
          }),
        })
      );
    });

    it('should handle Google Vertex TTS errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Google TTS error',
      } as Response);

      await expect(service.googleVertexTTS('Hello')).rejects.toThrow(
        'TrueFoundry Google Vertex TTS error'
      );
    });
  });

  describe('Embeddings', () => {
    it('should successfully generate embeddings with Cohere', async () => {
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2, 0.3] }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await service.createEmbeddings(
        'test text',
        'aws-bedrock/us.cohere.embed-v4-0'
      );

      expect(response.embeddings).toEqual([[0.1, 0.2, 0.3]]);
      expect(response.model).toBe('aws-bedrock/us.cohere.embed-v4-0');
      expect(response.dimensions).toBe(3);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gateway.truefoundry.ai/api/llm/embeddings',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            input: 'test text',
            model: 'aws-bedrock/us.cohere.embed-v4-0',
            encoding_format: 'float',
          }),
        })
      );
    });

    it('should handle batch embeddings', async () => {
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2] }, { embedding: [0.3, 0.4] }, { embedding: [0.5, 0.6] }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await service.createEmbeddings(['text1', 'text2', 'text3']);

      expect(response.embeddings).toHaveLength(3);
      expect(response.embeddings[0]).toEqual([0.1, 0.2]);
    });

    it('should handle embedding errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Embedding error',
      } as Response);

      await expect(service.createEmbeddings('test')).rejects.toThrow(
        'TrueFoundry embeddings error'
      );
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      service.clearCache();
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should clear expired cache entries', async () => {
      const mockResponse = {
        choices: [
          {
            message: { content: 'Test' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await service.chatCompletions([{ role: 'user', content: 'Hello' }]);

      // Check cache has entry
      let stats = service.getCacheStats();
      expect(stats.size).toBe(1);

      // Manually expire cache entry by setting timestamp to past (beyond 5 min TTL)
      const cache = (service as any).cache;
      const cacheKey = cache.keys().next().value;
      if (cacheKey) {
        const entry = cache.get(cacheKey);
        if (entry) {
          entry.timestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago (beyond 5 min TTL)
        }
      }

      // Check expired count before clearing
      stats = service.getCacheStats();
      expect(stats.expiredCount).toBeGreaterThan(0);

      // Clear expired entries
      service.clearExpiredCache();
      stats = service.getCacheStats();

      // Cache should now be empty after clearing expired entries
      expect(stats.size).toBe(0);
    });

    it('should return cache statistics', () => {
      const stats = service.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('expiredCount');
    });
  });

  describe('API Key Validation', () => {
    it('should validate API key successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      const isValid = await service.validateApiKey();
      expect(isValid).toBe(true);
    });

    it('should return false for invalid API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      const isValid = await service.validateApiKey();
      expect(isValid).toBe(false);
    });

    it('should handle validation errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const isValid = await service.validateApiKey();
      expect(isValid).toBe(false);
    });
  });
});

describe('TrueFoundryService Singleton', () => {
  const originalEnv = process.env.TRUEFOUNDRY_API_KEY;

  beforeEach(() => {
    // Reset the singleton instance
    const { resetTrueFoundryService } = require('./trueFoundryService');
    resetTrueFoundryService();
  });

  afterEach(() => {
    process.env.TRUEFOUNDRY_API_KEY = originalEnv;
    // Reset the singleton instance
    const { resetTrueFoundryService } = require('./trueFoundryService');
    resetTrueFoundryService();
  });

  it('should throw error when API key is not configured', () => {
    delete process.env.TRUEFOUNDRY_API_KEY;

    expect(() => {
      const { getTrueFoundryService } = require('./trueFoundryService');
      getTrueFoundryService();
    }).toThrow('TrueFoundry API key not found in environment variables');
  });
});
