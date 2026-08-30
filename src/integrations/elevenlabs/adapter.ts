import { ProviderAdapter, BaseProviderAdapter } from '../ProviderAdapter.js';
import { elevenLabsProvider } from './client.js';

export class ElevenLabsAudioAdapter extends BaseProviderAdapter<any, any> {
  constructor() {
    super('elevenlabs_audio', 'ElevenLabs Audio Provider');
  }

  async execute(request: any): Promise<any> {
    const type = request.type;

    switch (type) {
      case 'music':
        return await elevenLabsProvider.generateMusic(request.payload);
      case 'sfx':
        return await elevenLabsProvider.generateSoundEffect(request.payload);
      case 'isolate':
        return await elevenLabsProvider.isolateVoice(request.payload);
      case 'transform':
        return await elevenLabsProvider.transformVoice(request.payload);
      default:
        throw new Error(`Unsupported ElevenLabs request type: ${type}`);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Basic health check could involve verifying API key existence
      return !!process.env.ELEVENLABS_API_KEY;
    } catch {
      return false;
    }
  }
}
