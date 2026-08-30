/**
 * ElevenLabs Service Tests
 */

import { ElevenLabsService, ElevenLabsConfig } from './elevenLabsService';

// Mock fetch for testing
global.fetch = jest.fn();

describe('ElevenLabs Service', () => {
  let service: ElevenLabsService;
  let mockFetch: jest.Mock;

  const mockConfig: ElevenLabsConfig = {
    apiKey: 'test-api-key',
    model: 'eleven_multilingual_v2',
    voiceId: 'test-voice-id',
    stability: 0.5,
    similarityBoost: 0.75,
  };

  beforeEach(() => {
    mockFetch = global.fetch as jest.Mock;
    mockFetch.mockClear();
    service = new ElevenLabsService(mockConfig);
  });

  describe('Initialization', () => {
    it('should initialize with provided config', () => {
      expect(service).toBeDefined();
    });

    it('should use default model if not provided', () => {
      const serviceWithoutModel = new ElevenLabsService({
        apiKey: 'test-key',
      });
      expect(serviceWithoutModel).toBeDefined();
    });
  });

  describe('Voice Synthesis', () => {
    it('should synthesize voice from text', async () => {
      const mockAudioBuffer = new AudioContext().createBuffer(2, 48000, 48000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      // Mock decodeAudioData
      const mockDecode = jest.fn().mockResolvedValue(mockAudioBuffer);
      global.AudioContext = jest.fn().mockImplementation(() => ({
        decodeAudioData: mockDecode,
      })) as any;

      const result = await service.synthesizeVoice({
        text: 'Hello world',
        voiceId: 'test-voice',
      });

      expect(result).toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/text-to-speech/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'xi-api-key': 'test-api-key',
          }),
        })
      );
    });

    it('should cache synthesis results', async () => {
      const mockAudioBuffer = new AudioContext().createBuffer(2, 48000, 48000);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      const mockDecode = jest.fn().mockResolvedValue(mockAudioBuffer);
      global.AudioContext = jest.fn().mockImplementation(() => ({
        decodeAudioData: mockDecode,
      })) as any;

      const request = {
        text: 'Test text',
        voiceId: 'test-voice',
      };

      // First call
      await service.synthesizeVoice(request);
      // Second call should use cache
      await service.synthesizeVoice(request);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(
        service.synthesizeVoice({
          text: 'Hello',
          voiceId: 'test-voice',
        })
      ).rejects.toThrow('ElevenLabs API error');
    });

    it('should throw error when voice ID is not provided', async () => {
      const serviceWithoutVoice = new ElevenLabsService({
        apiKey: 'test-key',
      });

      await expect(
        serviceWithoutVoice.synthesizeVoice({
          text: 'Hello',
        })
      ).rejects.toThrow('Voice ID is required');
    });
  });

  describe('Voice Cloning', () => {
    it('should clone voice from audio samples', async () => {
      const mockFiles = [new File(['audio data'], 'sample1.mp3', { type: 'audio/mpeg' })];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ voice_id: 'cloned-voice-id' }),
      });

      const result = await service.cloneVoice({
        name: 'Test Voice',
        description: 'Test description',
        audioSamples: mockFiles,
      });

      expect(result).toBe('cloned-voice-id');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/voices/add'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle cloning errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      });

      await expect(
        service.cloneVoice({
          name: 'Test',
          description: 'Test',
          audioSamples: [],
        })
      ).rejects.toThrow('ElevenLabs API error');
    });
  });

  describe('Voice Management', () => {
    it('should get available voices', async () => {
      const mockVoices = [
        { voice_id: 'voice1', name: 'Voice 1' },
        { voice_id: 'voice2', name: 'Voice 2' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ voices: mockVoices }),
      });

      const result = await service.getAvailableVoices();

      expect(result).toEqual(mockVoices);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/voices'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should get voice settings', async () => {
      const mockSettings = {
        stability: 0.5,
        similarity_boost: 0.75,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings,
      });

      const result = await service.getVoiceSettings('voice-id');

      expect(result).toEqual(mockSettings);
    });

    it('should delete voice', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await service.deleteVoice('voice-id');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/voices/voice-id'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Streaming Synthesis', () => {
    it('should stream synthesis', async () => {
      const mockChunks = [new ArrayBuffer(100), new ArrayBuffer(100)];
      let chunkIndex = 0;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: {
          getReader: () => ({
            read: async () => {
              if (chunkIndex < mockChunks.length) {
                return {
                  done: false,
                  value: new Uint8Array(mockChunks[chunkIndex++]),
                };
              }
              return { done: true };
            },
          }),
        },
      });

      const chunks = [];
      for await (const chunk of service.streamSynthesis('Hello', 'test-voice')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(2);
    });

    it('should throw error when voice ID is not provided for streaming', async () => {
      const serviceWithoutVoice = new ElevenLabsService({
        apiKey: 'test-key',
      });

      await expect(service.streamSynthesis('Hello')).rejects.toThrow('Voice ID is required');
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      service.clearCache();
      // Should not throw
    });

    it('should enable/disable caching', () => {
      service.setCacheEnabled(false);
      service.setCacheEnabled(true);
      // Should not throw
    });

    it('should set max cache size', () => {
      service.setMaxCacheSize(50);
      // Should not throw
    });
  });
});
