/**
 * 3WM SONIK - Gemini Persona TTS & Speech Service
 * Generates and streams persona-accurate speech using Gemini TTS (gemini-3.1-flash-tts-preview)
 * and Browser SpeechSynthesis fallback with tuned pitch/rate/timbre.
 */

import {
  AgentId,
  buildPersonaTtsPrompt,
  buildCouncilDebatePrompt,
  AGENT_VOICE_CONFIGS,
} from '../audio/personaVoicePrompts';
import { landingAudioEngine } from '../audio/landingAudioEngine';

export interface TtsGenerationResult {
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  duration: number;
}

class GeminiTtsService {
  private audioContext: AudioContext | null = null;
  private cache: Map<string, AudioBuffer> = new Map();
  private currentSource: AudioBufferSourceNode | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Generates persona voice audio for a specific 3WM agent
   */
  public async generateSpeech(
    transcript: string,
    agentId: AgentId = 'orchestrator'
  ): Promise<TtsGenerationResult> {
    const cacheKey = `${agentId}:${transcript.trim()}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return { audioBuffer: cached, duration: cached.duration };
    }

    const { prompt, voice } = buildPersonaTtsPrompt(agentId, transcript);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          voice,
          agentId,
          transcript,
        }),
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        let audioArrayBuffer: ArrayBuffer | null = null;

        if (contentType.includes('application/json')) {
          const json = await response.json();
          if (json.audioBase64) {
            const binaryString = atob(json.audioBase64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            audioArrayBuffer = bytes.buffer;
          }
        } else {
          audioArrayBuffer = await response.arrayBuffer();
        }

        if (audioArrayBuffer) {
          const ctx = this.getAudioContext();
          const decodedBuffer = await ctx.decodeAudioData(audioArrayBuffer);
          this.cache.set(cacheKey, decodedBuffer);

          return {
            audioBuffer: decodedBuffer,
            duration: decodedBuffer.duration,
          };
        }
      }
    } catch (err) {
      console.warn('[GeminiTtsService] API synthesis fallback:', err);
    }

    return {
      duration: Math.max(2.0, transcript.length * 0.06),
    };
  }

  /**
   * Spoken speech coordinator: Plays Gemini TTS audio buffer if available,
   * otherwise speaks the text aloud using browser SpeechSynthesis with agent persona tuning!
   */
  public async speakPersonaResponse(
    text: string,
    agentId: AgentId = 'orchestrator',
    onLevel?: (level: number) => void,
    onEnded?: () => void
  ): Promise<() => void> {
    this.stopPlayback();

    // 1. Try fetching Gemini TTS audio buffer
    try {
      const result = await this.generateSpeech(text, agentId);
      if (result.audioBuffer) {
        return this.playBuffer(result.audioBuffer, onLevel, onEnded);
      }
    } catch (err) {
      console.warn(
        '[GeminiTtsService] TTS buffer synthesis failed, falling back to Web Speech:',
        err
      );
    }

    // 2. Client-side Web Speech Synthesis fallback — SPEAKS REAL WORDS
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      // Clean markdown or audio tags from spoken text
      const cleanText = text
        .replace(/\[.*?\]/g, '')
        .replace(/[\*\_#]/g, '')
        .trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Configure distinct Persona Pitch & Rate
      if (agentId === 'kingpin') {
        utterance.pitch = 0.72; // Deep, gravelly resonance
        utterance.rate = 0.92; // Majestic, soulful cadence
      } else if (agentId === 'ricky') {
        utterance.pitch = 1.15; // Upbeat, energetic
        utterance.rate = 1.12; // Fast, punchy swagger
      } else if (agentId === 'emar') {
        utterance.pitch = 0.95; // Precise, analytical
        utterance.rate = 1.0; // Measured academic pace
      } else {
        utterance.pitch = 1.0;
        utterance.rate = 1.05;
      }

      // Try selecting a suitable English voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (agentId === 'kingpin') {
          const maleVoice = voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Male') || v.name.includes('David') || v.name.includes('George'))
          );
          if (maleVoice) utterance.voice = maleVoice;
        } else if (agentId === 'ricky') {
          const energeticVoice = voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Guy'))
          );
          if (energeticVoice) utterance.voice = energeticVoice;
        } else if (agentId === 'emar') {
          const clearVoice = voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('UK') || v.name.includes('British') || v.name.includes('Daniel'))
          );
          if (clearVoice) utterance.voice = clearVoice;
        }
      }

      let intervalId: any = null;
      if (onLevel) {
        intervalId = setInterval(() => {
          if (window.speechSynthesis.speaking) {
            const fakeLevel = 0.3 + Math.random() * 0.5;
            onLevel(fakeLevel);
          }
        }, 80);
      }

      utterance.onend = () => {
        if (intervalId) clearInterval(intervalId);
        onLevel?.(0);
        onEnded?.();
      };

      utterance.onerror = () => {
        if (intervalId) clearInterval(intervalId);
        onLevel?.(0);
        onEnded?.();
      };

      window.speechSynthesis.speak(utterance);

      return () => {
        if (intervalId) clearInterval(intervalId);
        window.speechSynthesis.cancel();
        onLevel?.(0);
      };
    }

    // Default timer fallback if SpeechSynthesis unavailable
    const durationMs = Math.max(2000, text.length * 50);
    const timer = setTimeout(() => {
      onLevel?.(0);
      onEnded?.();
    }, durationMs);

    return () => clearTimeout(timer);
  }

  /**
   * Plays the generated AudioBuffer with amplitude callbacks
   */
  public async playBuffer(
    buffer: AudioBuffer,
    onLevel?: (level: number) => void,
    onEnded?: () => void
  ): Promise<() => void> {
    this.stopPlayback();

    const ctx = this.getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;

    source.connect(analyser);
    analyser.connect(ctx.destination);

    this.currentSource = source;

    let animId: number | null = null;
    if (onLevel) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        onLevel(Math.min(1, avg / 128));
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);
    }

    return new Promise<() => void>((resolve) => {
      source.onended = () => {
        if (animId !== null) cancelAnimationFrame(animId);
        onLevel?.(0);
        onEnded?.();
      };

      source.start(0);

      const stopFn = () => {
        try {
          source.stop();
        } catch {
          // Ignore if already stopped
        }
        if (animId !== null) cancelAnimationFrame(animId);
        onLevel?.(0);
      };

      resolve(stopFn);
    });
  }

  /**
   * Stops current voice playback
   */
  public stopPlayback() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Already stopped
      }
      this.currentSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const geminiTtsService = new GeminiTtsService();
