/**
 * ElevenLabs Service
 * Provides text-to-speech, voice cloning, and real-time synthesis capabilities for Kingpin
 */

export interface ElevenLabsConfig {
  apiKey: string;
  model?: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
}

export interface VoiceSynthesisRequest {
  text: string;
  voiceId?: string;
  model?: string;
  outputFormat?: 'mp3' | 'pcm' | 'wav';
  stability?: number;
  similarityBoost?: number;
}

export interface VoiceCloningRequest {
  name: string;
  description: string;
  audioSamples: File[];
}

export interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
  description?: string;
  preview_url?: string;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
}

interface SynthesisCache {
  [key: string]: {
    audioBuffer: AudioBuffer;
    timestamp: number;
  };
}

export class ElevenLabsService {
  private config: ElevenLabsConfig;
  private cache: SynthesisCache = {};
  private maxCacheSize: number = 100;
  private cacheEnabled: boolean = true;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';

  constructor(config: ElevenLabsConfig) {
    this.config = {
      model: 'eleven_multilingual_v2',
      stability: 0.5,
      similarityBoost: 0.75,
      ...config,
    };
  }

  /**
   * Synthesize voice from text
   */
  async synthesizeVoice(request: VoiceSynthesisRequest): Promise<AudioBuffer> {
    const cacheKey = this.generateCacheKey(request);

    // Check cache first
    if (this.cacheEnabled && this.cache[cacheKey]) {
      console.log('[ElevenLabs] Cache hit for synthesis request');
      return this.cache[cacheKey].audioBuffer;
    }

    const voiceId = request.voiceId || this.config.voiceId;
    const model = request.model || this.config.model;
    const stability = request.stability ?? this.config.stability;
    const similarityBoost = request.similarityBoost ?? this.config.similarityBoost;

    if (!voiceId) {
      throw new Error(
        'Voice ID is required for synthesis. Set default voice in config or request.'
      );
    }

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          text: request.text,
          model_id: model,
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
          },
          output_format: request.outputFormat || 'mp3_44100_128',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext({ sampleRate: 48000 });
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Cache the result
      if (this.cacheEnabled) {
        this.cache[cacheKey] = {
          audioBuffer,
          timestamp: Date.now(),
        };
        this.cleanupCache();
      }

      return audioBuffer;
    } catch (error) {
      console.error('[ElevenLabs] Synthesis error:', error);
      throw error;
    }
  }

  /**
   * Clone voice from audio samples
   */
  async cloneVoice(request: VoiceCloningRequest): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('name', request.name);
      formData.append('description', request.description);

      request.audioSamples.forEach((sample, index) => {
        formData.append(`samples`, sample, `sample_${index}.mp3`);
      });

      const response = await fetch(`${this.baseUrl}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      return result.voice_id;
    } catch (error) {
      console.error('[ElevenLabs] Voice cloning error:', error);
      throw error;
    }
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(): Promise<Voice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      return result.voices;
    } catch (error) {
      console.error('[ElevenLabs] Get voices error:', error);
      throw error;
    }
  }

  /**
   * Get voice settings
   */
  async getVoiceSettings(voiceId: string): Promise<VoiceSettings> {
    try {
      const response = await fetch(`${this.baseUrl}/voices/${voiceId}/settings`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[ElevenLabs] Get voice settings error:', error);
      throw error;
    }
  }

  /**
   * Stream synthesis for real-time audio generation
   */
  async *streamSynthesis(text: string, voiceId?: string): AsyncGenerator<AudioChunk> {
    const targetVoiceId = voiceId || this.config.voiceId;

    if (!targetVoiceId) {
      throw new Error('Voice ID is required for streaming synthesis');
    }

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${targetVoiceId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: this.config.model,
          voice_settings: {
            stability: this.config.stability,
            similarity_boost: this.config.similarityBoost,
          },
          output_format: 'pcm_16000',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const timestamp = Date.now();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        yield {
          data: value.buffer,
          timestamp: timestamp + Date.now(),
        };
      }
    } catch (error) {
      console.error('[ElevenLabs] Stream synthesis error:', error);
      throw error;
    }
  }

  /**
   * Delete a custom voice
   */
  async deleteVoice(voiceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
        method: 'DELETE',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
      }
    } catch (error) {
      console.error('[ElevenLabs] Delete voice error:', error);
      throw error;
    }
  }

  /**
   * Clear synthesis cache
   */
  clearCache(): void {
    this.cache = {};
    console.log('[ElevenLabs] Cache cleared');
  }

  /**
   * Enable or disable caching
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }

  /**
   * Set maximum cache size
   */
  setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;
    this.cleanupCache();
  }

  /**
   * Generate cache key for synthesis request
   */
  private generateCacheKey(request: VoiceSynthesisRequest): string {
    const keyParts = [
      request.text,
      request.voiceId || this.config.voiceId,
      request.model || this.config.model,
      request.stability ?? this.config.stability,
      request.similarityBoost ?? this.config.similarityBoost,
    ];
    return keyParts.join('|');
  }

  /**
   * Cleanup old cache entries
   */
  private cleanupCache(): void {
    const keys = Object.keys(this.cache);
    if (keys.length <= this.maxCacheSize) return;

    // Sort by timestamp and remove oldest entries
    const sortedKeys = keys.sort((a, b) => this.cache[a].timestamp - this.cache[b].timestamp);

    const keysToRemove = sortedKeys.slice(0, keys.length - this.maxCacheSize);
    keysToRemove.forEach((key) => delete this.cache[key]);
  }
}

// Singleton instance
let elevenLabsServiceInstance: ElevenLabsService | null = null;

export function getElevenLabsService(config?: ElevenLabsConfig): ElevenLabsService {
  if (!elevenLabsServiceInstance) {
    if (!config) {
      throw new Error('ElevenLabs config is required for first initialization');
    }
    elevenLabsServiceInstance = new ElevenLabsService(config);
  }
  return elevenLabsServiceInstance;
}

export function resetElevenLabsService(): void {
  elevenLabsServiceInstance = null;
}
