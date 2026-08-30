// 3WM SONIK - Lyria RealTime Streaming Audio Engine
// Connects to Google's Lyria RealTime (models/lyria-realtime-exp) via WebSocket
// Supports live prompt steering, weighted prompt morphing, and Web Audio PCM16 playback.

export interface WeightedPrompt {
  text: string;
  weight: number;
}

export type LyriaScale =
  | 'C_MAJOR_A_MINOR'
  | 'D_FLAT_MAJOR_B_FLAT_MINOR'
  | 'D_MAJOR_B_MINOR'
  | 'E_FLAT_MAJOR_C_MINOR'
  | 'E_MAJOR_D_FLAT_MINOR'
  | 'F_MAJOR_D_MINOR'
  | 'G_FLAT_MAJOR_E_FLAT_MINOR'
  | 'G_MAJOR_E_MINOR'
  | 'A_FLAT_MAJOR_F_MINOR'
  | 'A_MAJOR_G_FLAT_MINOR'
  | 'B_FLAT_MAJOR_G_MINOR'
  | 'B_MAJOR_A_FLAT_MINOR'
  | 'SCALE_UNSPECIFIED';

export interface LiveMusicGenerationConfig {
  bpm?: number;
  density?: number;
  brightness?: number;
  scale?: LyriaScale;
  temperature?: number;
  guidance?: number;
  mute_bass?: boolean;
  mute_drums?: boolean;
  only_bass_and_drums?: boolean;
  music_generation_mode?: 'QUALITY' | 'DIVERSITY' | 'VOCALIZATION';
  audioFormat?: 'pcm16';
  sampleRateHz?: number;
}

export class LyriaRealtimeEngine {
  private ws: WebSocket | null = null;
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private isConnected: boolean = false;
  private scheduledTime: number = 0;
  private apiKey: string;
  private weightedPrompts: WeightedPrompt[] = [];
  private config: LiveMusicGenerationConfig = {
    bpm: 112,
    density: 0.7,
    brightness: 0.6,
    scale: 'C_MAJOR_A_MINOR',
    temperature: 1.1,
    guidance: 4.0,
    music_generation_mode: 'QUALITY',
    audioFormat: 'pcm16',
    sampleRateHz: 48000,
  };

  private listeners: {
    onAudioChunk?: (chunk: Float32Array) => void;
    onStatusChange?: (
      status: 'connected' | 'disconnected' | 'playing' | 'paused' | 'error',
      message?: string
    ) => void;
  } = {};

  constructor(apiKey?: string) {
    this.apiKey = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  }

  public setCallbacks(listeners: typeof this.listeners) {
    this.listeners = { ...this.listeners, ...listeners };
  }

  /**
   * Connect to Lyria RealTime WebSocket endpoint
   */
  public async connect(): Promise<void> {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass({ sampleRate: 48000 });
    }

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateMusic?key=${this.apiKey}`;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.listeners.onStatusChange?.('connected');
          this.sendInitialSetup();
          resolve();
        };

        this.ws.onmessage = async (event) => {
          this.handleIncomingMessage(event.data);
        };

        this.onerror = (error: any) => {
          this.listeners.onStatusChange?.('error', error?.message || 'WebSocket Error');
          reject(error);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.isPlaying = false;
          this.listeners.onStatusChange?.('disconnected');
        };
      } catch (err) {
        this.listeners.onStatusChange?.('error', String(err));
        reject(err);
      }
    });
  }

  private set onerror(handler: any) {
    if (this.ws) this.ws.onerror = handler;
  }

  private sendInitialSetup() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Send initial configuration and prompts
    this.ws.send(
      JSON.stringify({
        setup: {
          model: 'models/lyria-realtime-exp',
          generation_config: this.config,
        },
      })
    );
  }

  /**
   * Steer the music with weighted natural language prompts
   */
  public async setWeightedPrompts(prompts: WeightedPrompt[]): Promise<void> {
    this.weightedPrompts = prompts;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          client_content: {
            weighted_prompts: prompts,
          },
        })
      );
    }
  }

  /**
   * Update the live generation parameters (BPM, Density, Brightness, Scale, Bass/Drums mutes)
   */
  public async setMusicGenerationConfig(
    config: Partial<LiveMusicGenerationConfig>,
    resetContext: boolean = false
  ): Promise<void> {
    this.config = { ...this.config, ...config };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          client_content: {
            music_generation_config: this.config,
            reset_context: resetContext,
          },
        })
      );
    }
  }

  /**
   * Start or resume real-time music streaming
   */
  public async play(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.isPlaying = true;
    this.scheduledTime = this.audioCtx?.currentTime || 0;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          client_content: {
            playback_control: { action: 'PLAY' },
          },
        })
      );
    }

    this.listeners.onStatusChange?.('playing');
  }

  /**
   * Pause real-time music streaming
   */
  public pause(): void {
    this.isPlaying = false;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          client_content: {
            playback_control: { action: 'PAUSE' },
          },
        })
      );
    }
    this.listeners.onStatusChange?.('paused');
  }

  /**
   * Stop real-time music streaming and reset context
   */
  public stop(): void {
    this.isPlaying = false;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          client_content: {
            playback_control: { action: 'STOP' },
          },
        })
      );
    }
    this.listeners.onStatusChange?.('paused');
  }

  public resetContext(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          client_content: {
            playback_control: { action: 'RESET_CONTEXT' },
          },
        })
      );
    }
  }

  /**
   * Handle incoming binary or JSON messages containing 16-bit PCM audio chunks
   */
  private handleIncomingMessage(data: any) {
    if (!this.isPlaying || !this.audioCtx) return;

    try {
      if (typeof data === 'string') {
        const msg = JSON.parse(data);
        if (msg.serverContent?.audioChunks) {
          for (const chunk of msg.serverContent.audioChunks) {
            if (chunk.data) {
              const pcmData = this.base64ToArrayBuffer(chunk.data);
              this.playPcmChunk(pcmData);
            }
          }
        }
      } else if (data instanceof ArrayBuffer) {
        this.playPcmChunk(data);
      }
    } catch (err) {
      console.warn('Error processing Lyria audio packet:', err);
    }
  }

  /**
   * Decode raw 16-bit stereo PCM audio buffer to Web Audio AudioBuffer and schedule seamless playback
   */
  private playPcmChunk(buffer: ArrayBuffer) {
    if (!this.audioCtx || !this.isPlaying) return;

    const sampleRate = this.config.sampleRateHz || 48000;
    const int16Array = new Int16Array(buffer);
    const numChannels = 2;
    const numFrames = int16Array.length / numChannels;

    if (numFrames <= 0) return;

    const audioBuffer = this.audioCtx.createBuffer(numChannels, numFrames, sampleRate);
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.getChannelData(1);

    for (let i = 0; i < numFrames; i++) {
      leftChannel[i] = int16Array[i * 2] / 32768.0;
      rightChannel[i] = int16Array[i * 2 + 1] / 32768.0;
    }

    // Pass to visualizer listener
    this.listeners.onAudioChunk?.(leftChannel);

    // Schedule sample accurately to eliminate jitter and pops
    const sourceNode = this.audioCtx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(this.audioCtx.destination);

    const currentTime = this.audioCtx.currentTime;
    if (this.scheduledTime < currentTime) {
      this.scheduledTime = currentTime + 0.05; // 50ms buffer
    }

    sourceNode.start(this.scheduledTime);
    this.scheduledTime += audioBuffer.duration;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  public disconnect() {
    this.stop();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Global Singleton instance
export const lyriaRealtime = new LyriaRealtimeEngine();
