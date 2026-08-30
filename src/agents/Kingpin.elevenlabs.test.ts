/**
 * Kingpin ElevenLabs Integration Tests
 */

const sharedMockService = {
  synthesizeVoice: jest.fn(),
  cloneVoice: jest.fn(),
  streamSynthesis: jest.fn(),
  getAvailableVoices: jest.fn(),
};

// Mock ElevenLabs service
jest.mock('../services/elevenLabsService', () => ({
  getElevenLabsService: jest.fn(() => sharedMockService),
  resetElevenLabsService: jest.fn(),
}));

// Mock Unified AI Service
jest.mock('../services/unifiedAIService', () => ({
  getUnifiedAIService: jest.fn(() => sharedMockService),
}));

let kingpin: any;

describe('Kingpin ElevenLabs Integration', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env.VITE_ELEVENLABS_API_KEY = 'test-api-key';
    process.env.VITE_ELEVENLABS_MODEL = 'eleven_multilingual_v2';
    process.env.VITE_ELEVENLABS_DEFAULT_VOICE = 'default-voice-id';

    // Clear mock history
    jest.clearAllMocks();
    jest.resetModules();

    // Require Kingpin after setting env vars
    const KingpinModule = require('./Kingpin');
    kingpin = KingpinModule.kingpin;
  });

  describe('ElevenLabs Availability', () => {
    it('should check if ElevenLabs is available', () => {
      const isAvailable = kingpin.isElevenLabsAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should return default voice ID', () => {
      const defaultVoice = kingpin.getDefaultVoice();
      expect(defaultVoice).toBeDefined();
    });
  });

  describe('Vocal Audio Generation', () => {
    it('should generate vocal audio from suggestion', async () => {
      const mockAudioBuffer = new AudioContext().createBuffer(2, 48000, 48000);

      // Mock the ElevenLabs service
      const { getElevenLabsService } = require('../services/elevenLabsService');
      const mockService = getElevenLabsService();
      mockService.synthesizeVoice.mockResolvedValue(mockAudioBuffer);

      const result = await kingpin.generateVocalAudio('Test vocal suggestion', 'test-voice-id');

      expect(result).toBeDefined();
      expect(mockService.synthesizeVoice).toHaveBeenCalledWith(
        'Test vocal suggestion',
        'test-voice-id',
        { outputFormat: 'mp3' }
      );
    });

    it('should throw error when ElevenLabs is not available', async () => {
      process.env.VITE_ELEVENLABS_API_KEY = '';

      // Re-initialize kingpin without API key
      jest.resetModules();
      const { kingpin: newKingpin } = require('./Kingpin');

      await expect(newKingpin.generateVocalAudio('Test', 'voice-id')).rejects.toThrow(
        'AI service not initialized'
      );
    });

    it('should use default voice when voice style is not provided', async () => {
      const mockAudioBuffer = new AudioContext().createBuffer(2, 48000, 48000);

      const { getElevenLabsService } = require('../services/elevenLabsService');
      const mockService = getElevenLabsService();
      mockService.synthesizeVoice.mockResolvedValue(mockAudioBuffer);

      await kingpin.generateVocalAudio('Test suggestion');

      expect(mockService.synthesizeVoice).toHaveBeenCalledWith(
        'Test suggestion',
        'default-voice-id',
        { outputFormat: 'mp3' }
      );
    });
  });

  describe('Voice Cloning', () => {
    it('should create custom vocal style', async () => {
      const mockFiles = [new File(['audio data'], 'sample1.mp3', { type: 'audio/mpeg' })];

      const { getElevenLabsService } = require('../services/elevenLabsService');
      const mockService = getElevenLabsService();
      mockService.cloneVoice.mockResolvedValue('cloned-voice-id');

      const result = await kingpin.createCustomVocalStyle(
        'My Custom Voice',
        'Custom vocal style for My Custom Voice - created by Kingpin',
        mockFiles
      );

      expect(result).toBe('cloned-voice-id');
      expect(mockService.cloneVoice).toHaveBeenCalledWith({
        name: 'My Custom Voice',
        description: 'Custom vocal style for My Custom Voice - created by Kingpin',
        audioSamples: mockFiles,
      });
    });

    it('should throw error when ElevenLabs is not available for cloning', async () => {
      process.env.VITE_ELEVENLABS_API_KEY = '';

      jest.resetModules();
      const { kingpin: newKingpin } = require('./Kingpin');

      await expect(newKingpin.createCustomVocalStyle('Test', [])).rejects.toThrow(
        'ElevenLabs service not initialized'
      );
    });
  });

  describe('Vocal Guidance Streaming', () => {
    it('should stream vocal guidance', async () => {
      const mockChunks = [
        { data: new ArrayBuffer(100), timestamp: 1000 },
        { data: new ArrayBuffer(100), timestamp: 2000 },
      ];

      const { getElevenLabsService } = require('../services/elevenLabsService');
      const mockService = getElevenLabsService();

      // Mock async generator
      async function* mockStream() {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      }

      mockService.streamSynthesis.mockImplementation(mockStream);

      const chunks = [];
      for await (const chunk of kingpin.streamVocalGuidance('Test guidance', 'voice-id')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(2);
      expect(mockService.streamSynthesis).toHaveBeenCalledWith('Test guidance', 'voice-id');
    });

    it('should use default voice for streaming when not provided', async () => {
      const { getElevenLabsService } = require('../services/elevenLabsService');
      const mockService = getElevenLabsService();

      async function* mockStream() {
        yield { data: new ArrayBuffer(100), timestamp: 1000 };
      }

      mockService.streamSynthesis.mockImplementation(mockStream);

      for await (const _ of kingpin.streamVocalGuidance('Test guidance')) {
        // Consume generator
      }

      expect(mockService.streamSynthesis).toHaveBeenCalledWith('Test guidance', 'default-voice-id');
    });
  });

  describe('Available Voices', () => {
    it('should get available voices', async () => {
      const mockVoices = [
        { voice_id: 'voice1', name: 'Voice 1' },
        { voice_id: 'voice2', name: 'Voice 2' },
      ];

      const { getElevenLabsService } = require('../services/elevenLabsService');
      const mockService = getElevenLabsService();
      mockService.getAvailableVoices.mockResolvedValue(mockVoices);

      const result = await kingpin.getAvailableVoices();

      expect(result).toEqual(mockVoices);
      expect(mockService.getAvailableVoices).toHaveBeenCalled();
    });

    it('should throw error when ElevenLabs is not available for getting voices', async () => {
      process.env.VITE_ELEVENLABS_API_KEY = '';

      jest.resetModules();
      const { kingpin: newKingpin } = require('./Kingpin');

      await expect(newKingpin.getAvailableVoices()).rejects.toThrow(
        'ElevenLabs service not initialized'
      );
    });
  });
});
