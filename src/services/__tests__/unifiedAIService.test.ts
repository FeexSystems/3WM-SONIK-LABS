import {
  UnifiedAIServiceFactory,
  GeminiAdapter,
  ElevenLabsAdapter,
  OpenAIAdapter,
} from '../unifiedAIService';

jest.mock('../geminiService', () => ({
  getGeminiService: jest.fn().mockReturnValue({}),
}));

global.fetch = jest.fn() as any;

describe('UnifiedAIServiceFactory', () => {
  beforeEach(() => {
    UnifiedAIServiceFactory.clearCache();
  });

  it('should create a Gemini adapter when provider is gemini', () => {
    const service = UnifiedAIServiceFactory.createService({
      provider: 'gemini',
      apiKey: 'test-key',
    });
    expect(service).toBeInstanceOf(GeminiAdapter);
  });

  it('should create an ElevenLabs adapter when provider is elevenlabs', () => {
    const service = UnifiedAIServiceFactory.createService({
      provider: 'elevenlabs',
      apiKey: 'test-key',
    });
    expect(service).toBeInstanceOf(ElevenLabsAdapter);
  });

  it('should create an OpenAI adapter when provider is openai', () => {
    const service = UnifiedAIServiceFactory.createService({
      provider: 'openai',
      apiKey: 'test-key',
    });
    expect(service).toBeInstanceOf(OpenAIAdapter);
  });

  it('should cache instances', () => {
    const service1 = UnifiedAIServiceFactory.createService({
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4',
    });
    const service2 = UnifiedAIServiceFactory.createService({
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4',
    });
    expect(service1).toBe(service2);
  });

  it('should throw error for unsupported provider', () => {
    expect(() => {
      UnifiedAIServiceFactory.createService({
        provider: 'unsupported' as any,
        apiKey: 'test-key',
      });
    }).toThrow('Unsupported AI provider: unsupported');
  });
});
