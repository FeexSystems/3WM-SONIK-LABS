export interface MusicGenerationRequest {
  prompt: string;
  duration_seconds?: number;
  composition_plan?: boolean;
}

export interface SoundEffectRequest {
  prompt: string;
  duration_seconds?: number;
  prompt_influence?: number;
}

export interface VoiceIsolationRequest {
  audioBuffer: Buffer;
  contentType: string;
}

export interface VoiceTransformRequest {
  audioBuffer: Buffer;
  contentType: string;
  voice_id: string;
}

export interface GeneratedAsset {
  id: string;
  url: string; // Internal temporary URL or object storage URL
  duration?: number;
  provider_job_id?: string;
}

export interface ElevenLabsProvider {
  generateMusic(input: MusicGenerationRequest): Promise<GeneratedAsset>;
  streamMusic(input: MusicGenerationRequest): AsyncIterable<Buffer>;
  generateSoundEffect(input: SoundEffectRequest): Promise<GeneratedAsset>;
  isolateVoice(input: VoiceIsolationRequest): Promise<GeneratedAsset>;
  transformVoice(input: VoiceTransformRequest): Promise<GeneratedAsset>;
}
