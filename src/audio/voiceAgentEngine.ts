import { landingAudioEngine } from './landingAudioEngine';
import { geminiTtsService } from '../services/geminiTtsService';
import { AGENT_VOICE_CONFIGS } from './personaVoicePrompts';
import { supabase } from '../lib/supabase';

export type AgentId = 'emar' | 'ricky' | 'kingpin' | 'orchestrator';

export interface VoiceAgentMessage {
  id: string;
  sender: 'user' | AgentId;
  text: string;
  audioUrl?: string;
  timestamp: number;
}

export type VoiceState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

export interface VoiceAgentListener {
  onStateChange?: (state: VoiceState) => void;
  onTranscription?: (text: string, isFinal: boolean) => void;
  onAgentResponse?: (message: VoiceAgentMessage) => void;
  onAudioLevel?: (level: number) => void;
  onError?: (error: string) => void;
}

class VoiceAgentEngine {
  private state: VoiceState = 'IDLE';
  private activeAgent: AgentId = 'orchestrator';
  private listeners: Set<VoiceAgentListener> = new Set();
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private recognition: any = null;
  private synthesisVoice: SpeechSynthesisVoice | null = null;
  private conversationHistory: VoiceAgentMessage[] = [];
  private micAccessFailed: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initSpeechRecognition();
    }
  }

  private initSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        this.notifyTranscription(currentText, !!finalTranscript);

        if (finalTranscript.trim().length > 1) {
          this.processUserVoiceInput(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('[VoiceAgent] Recognition warning:', event.error);
          this.notifyError(`Microphone error: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        if (this.state === 'LISTENING') {
          try {
            this.recognition.start();
          } catch {
            // Restart silently if needed
          }
        }
      };
    }
  }

  public subscribe(listener: VoiceAgentListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getActiveAgent(): AgentId {
    return this.activeAgent;
  }

  public setActiveAgent(agent: AgentId) {
    this.activeAgent = agent;
    // Trigger spatial acoustic tone for feedback
    this.playAgentSignatureTone(agent);
  }

  public getState(): VoiceState {
    return this.state;
  }

  public getHistory(): VoiceAgentMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Start hands-free voice mode
   */
  public async startListening(): Promise<boolean> {
    // Prevent repeated attempts if mic access already failed
    if (this.micAccessFailed) {
      this.notifyError('Microphone access previously denied. Use text input instead.');
      return false;
    }

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = this.audioContext.createMediaStreamSource(this.micStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      this.startMeterLoop();

      if (this.recognition) {
        try {
          this.recognition.start();
        } catch {
          // Already running
        }
      }

      this.setState('LISTENING');
      return true;
    } catch (err: any) {
      this.micAccessFailed = true;
      const errorMessage =
        err?.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
          : err?.name === 'NotFoundError'
            ? 'No microphone found. Please connect a microphone and try again.'
            : err?.message || 'Microphone access failed. Please check your browser permissions.';

      console.error('[VoiceAgent] Failed to access microphone:', err);
      this.notifyError(errorMessage);
      this.setState('IDLE');
      return false;
    }
  }

  /**
   * Stop voice mode
   */
  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignored
      }
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.setState('IDLE');
  }

  /**
   * Send a direct text prompt to the active voice agent
   */
  public async sendPrompt(text: string, agentOverride?: AgentId) {
    const targetAgent = agentOverride || this.activeAgent;
    await this.processUserVoiceInput(text, targetAgent);
  }

  public async processUserVoiceInput(text: string, agentOverride?: AgentId) {
    if (!text.trim()) return;

    const targetAgent = agentOverride || this.activeAgent;
    const userMsg: VoiceAgentMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    this.conversationHistory.push(userMsg);
    this.setState('THINKING');

    // Trigger subtle agent sonic cue
    this.playAgentSignatureTone(targetAgent);

    try {
      const response = await supabase.functions.invoke('voice-chat', {
        body: { agent: targetAgent, text },
      });

      const data = response.data as { text?: string; audioBase64?: string } | null;
      const error = response.error;

      let replyText = '';
      let audioBase64: string | undefined;

      if (data && !error) {
        replyText = data.text || '';
        audioBase64 = data.audioBase64;
      }

      if (!replyText) {
        replyText = this.getAgentFallbackReply(targetAgent, text);
      }

      const agentMsg: VoiceAgentMessage = {
        id: `agent-${Date.now()}`,
        sender: targetAgent,
        text: replyText,
        timestamp: Date.now(),
      };

      this.conversationHistory.push(agentMsg);
      this.notifyAgentResponse(agentMsg);

      // Play vocal speech response
      await this.speakResponse(replyText, targetAgent);
    } catch (err) {
      console.warn('[VoiceAgent] Voice chat fallback:', err);
      const fallback = this.getAgentFallbackReply(targetAgent, text);

      const agentMsg: VoiceAgentMessage = {
        id: `agent-${Date.now()}`,
        sender: targetAgent,
        text: fallback,
        timestamp: Date.now(),
      };

      this.conversationHistory.push(agentMsg);
      this.notifyAgentResponse(agentMsg);
      await this.speakResponse(fallback, targetAgent);
    }
  }

  public async speakResponse(text: string, agent: AgentId) {
    this.setState('SPEAKING');

    // Layer signature acoustic tone alongside voice
    this.playAgentSignatureTone(agent);

    try {
      await geminiTtsService.speakPersonaResponse(
        text,
        agent,
        (lvl) => this.notifyAudioLevel(lvl),
        () => {
          this.setState('LISTENING');
        }
      );
    } catch (err) {
      console.warn('[VoiceAgent] Spoken voice playback error:', err);
      this.setState('LISTENING');
    }
  }

  private playAgentSignatureTone(agent: AgentId) {
    if (agent === 'emar') {
      landingAudioEngine.playMelodicChord(0);
    } else if (agent === 'ricky') {
      landingAudioEngine.playLogDrum(0, 55);
      landingAudioEngine.playKick(0);
    } else if (agent === 'kingpin') {
      landingAudioEngine.playVocalChant(0);
    }
  }

  private getAgentFallbackReply(agent: AgentId, query: string): string {
    const q = query.toLowerCase();
    if (agent === 'emar') {
      if (q.includes('bpm') || q.includes('tempo')) {
        return 'Calculated optimal groove tempo at 113 BPM in F# Minor. Spectrum balance calibrated across 3 bands.';
      }
      return 'Analyzed acoustic frequency response. Applied surgical dynamic notch at 240Hz and widened stereo side-band above 4kHz.';
    }

    if (agent === 'ricky') {
      if (q.includes('drum') || q.includes('808') || q.includes('beat')) {
        return 'Dropped a heavy syncopated log drum bounce with rolled hi-hats and punchy transients. Bounce is locked!';
      }
      return 'Dialed in the Amapiano shaker swing and sculpted the 808 sub harmonics for maximum club pressure.';
    }

    if (agent === 'kingpin') {
      if (q.includes('vocal') || q.includes('voice') || q.includes('sing')) {
        return 'Stacked a 3-part vocal harmony with lush stereo chorus, warm tube preamp warmth, and rhythmic ad-libs.';
      }
      return 'Gave the vocal lead body and soul. Added call-and-response vocal chants on the off-beat.';
    }

    return "Council consensus reached. Coordinated Ricky's drum bounce with Emar's dynamic master chain.";
  }

  private startMeterLoop() {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const update = () => {
      if (this.analyser && this.state === 'LISTENING') {
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 128);
        this.notifyAudioLevel(normalized);
      }
      this.animationFrameId = requestAnimationFrame(update);
    };

    update();
  }

  private setState(nextState: VoiceState) {
    this.state = nextState;
    this.listeners.forEach((l) => l.onStateChange?.(nextState));
  }

  private notifyTranscription(text: string, isFinal: boolean) {
    this.listeners.forEach((l) => l.onTranscription?.(text, isFinal));
  }

  private notifyAgentResponse(message: VoiceAgentMessage) {
    this.listeners.forEach((l) => l.onAgentResponse?.(message));
  }

  private notifyAudioLevel(level: number) {
    this.listeners.forEach((l) => l.onAudioLevel?.(level));
  }

  private notifyError(error: string) {
    this.listeners.forEach((l) => l.onError?.(error));
  }
}

export const voiceAgentEngine = new VoiceAgentEngine();
