/**
 * 3WM SONIK — Landing Page Audio & WebDSP Engine
 * Procedural Web Audio synthesis, 4-stem real-time processing, agent FX, and spectrum analysis.
 */

export interface StemState {
  id: 'drums' | 'bass' | 'melodics' | 'vocals';
  name: string;
  muted: boolean;
  solo: boolean;
  volume: number;
}

export interface AgentFxState {
  emarAirEq: boolean; // Emar Spectral Air High Shelf Booster
  rickySubPunch: boolean; // Ricky 808 Sub Harmonizer & Saturation
  kingpinDoubler: boolean; // Kingpin Stereo Vocal Formant & Chorus
}

export class LandingAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // FX Nodes
  private airEqNode: BiquadFilterNode | null = null;
  private subPunchNode: WaveShaperNode | null = null;
  private doublerDelayNode: DelayNode | null = null;
  private doublerGainNode: GainNode | null = null;

  // Stems Gain Nodes
  private stemGains: Record<string, GainNode> = {};

  // Internal State
  private isPlaying = false;
  private bpm = 112;
  private key = 'F# Min';
  private currentGenre = 'Amapiano';
  private timerId: number | null = null;
  private currentStep = 0;
  private activeSources: Set<AudioScheduledSourceNode> = new Set();

  // Listeners
  private listeners: Set<() => void> = new Set();

  public stems: StemState[] = [
    { id: 'drums', name: 'Drum Groove', muted: false, solo: false, volume: 0.9 },
    { id: 'bass', name: 'Amapiano Log Drum', muted: false, solo: false, volume: 1.0 },
    { id: 'melodics', name: 'Afro Keys & Brass', muted: false, solo: false, volume: 0.85 },
    { id: 'vocals', name: 'Ancestral Chants', muted: false, solo: false, volume: 0.8 },
  ];

  public fx: AgentFxState = {
    emarAirEq: true,
    rickySubPunch: true,
    kingpinDoubler: false,
  };

  public stepPattern: Record<string, boolean[]> = {
    kick: [
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
    ],
    shaker: [
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ],
    logdrum: [
      true,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      false,
    ],
    rim: [
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
    ],
  };

  constructor() {
    // Lazy audio context init on user interaction
  }

  private initCtx() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass({ sampleRate: 48000 });

    const trackSource = (node: AudioScheduledSourceNode) => {
      this.activeSources.add(node);
      const existingEnded = node.onended;
      node.onended = (ev) => {
        this.activeSources.delete(node);
        if (typeof existingEnded === 'function') {
          existingEnded.call(node, ev);
        }
      };
    };

    const origOsc = this.ctx.createOscillator.bind(this.ctx);
    this.ctx.createOscillator = () => {
      const n = origOsc();
      trackSource(n);
      return n;
    };

    const origBuf = this.ctx.createBufferSource.bind(this.ctx);
    this.ctx.createBufferSource = () => {
      const n = origBuf();
      trackSource(n);
      return n;
    };

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.8;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;

    // Emar Air EQ Node (High shelf boost at 10kHz)
    this.airEqNode = this.ctx.createBiquadFilter();
    this.airEqNode.type = 'highshelf';
    this.airEqNode.frequency.value = 10000;
    this.airEqNode.gain.value = this.fx.emarAirEq ? 4 : 0;

    // Ricky Sub Punch WaveShaper Node
    this.subPunchNode = this.ctx.createWaveShaper();
    this.subPunchNode.curve = this.makeDistortionCurve(this.fx.rickySubPunch ? 15 : 0) as any;

    // Kingpin Vocal Doubler Delay Node
    this.doublerDelayNode = this.ctx.createDelay();
    this.doublerDelayNode.delayTime.value = 0.028; // 28ms micro-doubler
    this.doublerGainNode = this.ctx.createGain();
    this.doublerGainNode.gain.value = this.fx.kingpinDoubler ? 0.6 : 0.0;

    // Master Bus Brickwall Limiter
    const limiter = this.ctx.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-0.5, this.ctx.currentTime);
    limiter.knee.setValueAtTime(0, this.ctx.currentTime);
    limiter.ratio.setValueAtTime(20, this.ctx.currentTime);
    limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
    limiter.release.setValueAtTime(0.05, this.ctx.currentTime);

    // Connect Stem Gains -> FX Chain -> Analyser -> Master Gain -> Limiter -> Destination
    const fxInputNode = this.airEqNode;
    this.airEqNode.connect(this.subPunchNode);
    this.subPunchNode.connect(this.analyser);

    // Doubler parallel routing
    this.doublerDelayNode.connect(this.doublerGainNode);
    this.doublerGainNode.connect(this.analyser);

    this.analyser.connect(this.masterGain);
    this.masterGain.connect(limiter);
    limiter.connect(this.ctx.destination);

    // Wire individual stems to FX chain
    this.stems.forEach((stem) => {
      const gainNode = this.ctx!.createGain();
      gainNode.gain.value = stem.muted ? 0 : stem.volume;
      this.stemGains[stem.id] = gainNode;

      gainNode.connect(fxInputNode);
      if (stem.id === 'vocals') {
        gainNode.connect(this.doublerDelayNode!);
      }
    });
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 10;
    const n_samples = 48000;
    const curve = new Float32Array(n_samples);
    if (k <= 0) {
      for (let i = 0; i < n_samples; ++i) {
        curve[i] = (i * 2) / n_samples - 1;
      }
      return curve;
    }
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = Math.tanh(x * (1 + k / 20));
    }
    return curve;
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb());
  }

  public async togglePlay() {
    this.initCtx();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  public start() {
    this.initCtx();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.scheduleNextStep();
    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.stopAudition();

    // Instantly choke and disconnect all active or scheduled sources
    this.activeSources.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this.activeSources.clear();

    // Smoothly clamp master and stem gains to eliminate any trailing delay/reverb ring
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      try {
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(0, now);
        this.masterGain.gain.setValueAtTime(0.8, now + 0.04);
      } catch (e) {}
    }

    this.notify();
  }

  private scheduleNextStep = () => {
    if (!this.isPlaying || !this.ctx) return;

    this.triggerStep(this.currentStep);
    this.currentStep = (this.currentStep + 1) % 16;

    const stepDuration = (60 / this.bpm / 4) * 1000;
    this.timerId = window.setTimeout(this.scheduleNextStep, stepDuration);
  };

  private triggerStep(step: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const anySolo = this.stems.some((s) => s.solo);

    // Kick / Drums
    if (this.stepPattern.kick[step] && this.isStemActive('drums', anySolo)) {
      this.playKick(now);
    }
    if (this.stepPattern.shaker[step] && this.isStemActive('drums', anySolo)) {
      this.playShaker(now);
    }
    if (this.stepPattern.rim[step] && this.isStemActive('drums', anySolo)) {
      this.playRim(now);
    }

    // Amapiano Log Drum / Bass
    if (this.stepPattern.logdrum[step] && this.isStemActive('bass', anySolo)) {
      this.playLogDrum(now, step % 2 === 0 ? 55 : 49);
    }

    // Melodics
    if ((step === 0 || step === 6 || step === 12) && this.isStemActive('melodics', anySolo)) {
      this.playMelodicChord(now);
    }

    // Vocals
    if ((step === 4 || step === 12) && this.isStemActive('vocals', anySolo)) {
      this.playVocalChant(now);
    }
  }

  private isStemActive(id: string, anySolo: boolean): boolean {
    const stem = this.stems.find((s) => s.id === id);
    if (!stem) return false;
    if (stem.muted) return false;
    if (anySolo) return stem.solo;
    return true;
  }

  public playKick(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.08);

    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.stemGains.drums || this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  public playLogDrum(time: number, freq = 55) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.04);

    const punch = this.fx.rickySubPunch ? 1.4 : 1.0;
    gain.gain.setValueAtTime(0.9 * punch, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(gain);
    gain.connect(this.stemGains.bass || this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.28);
  }

  public playShaker(time: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.stemGains.drums || this.masterGain!);

    whiteNoise.start(time);
    whiteNoise.stop(time + 0.035);
  }

  public playRim(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, time);
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(gain);
    gain.connect(this.stemGains.drums || this.masterGain!);
    osc.start(time);
    osc.stop(time + 0.04);
  }

  public playMelodicChord(time: number) {
    if (!this.ctx) return;
    const freqs = [185.0, 220.0, 277.18];
    freqs.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, time);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

      osc.connect(gain);
      gain.connect(this.stemGains.melodics || this.masterGain!);

      osc.start(time);
      osc.stop(time + 0.6);
    });
  }

  public playVocalChant(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(370, time);
    filter.type = 'bandpass';
    filter.frequency.value = 1200;

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.stemGains.vocals || this.masterGain!);

    osc.start(time);
    osc.stop(time + 0.45);
  }

  // Audition Sound Signature State & Methods
  public isAuditioning: boolean = false;
  public currentAuditionGearId: string | null = null;
  private auditionInterval: number | null = null;
  private auditionListeners: Set<(isAuditioning: boolean, gearId: string | null) => void> =
    new Set();

  public subscribeAudition(
    cb: (isAuditioning: boolean, gearId: string | null) => void
  ): () => void {
    this.auditionListeners.add(cb);
    cb(this.isAuditioning, this.currentAuditionGearId);
    return () => this.auditionListeners.delete(cb);
  }

  private notifyAudition() {
    this.auditionListeners.forEach((cb) => cb(this.isAuditioning, this.currentAuditionGearId));
  }

  public async auditionSoundSignature(gearId: string, category: string): Promise<boolean> {
    this.initCtx();
    if (!this.ctx) return false;

    if (this.isAuditioning && this.currentAuditionGearId === gearId) {
      this.stopAudition();
      return false;
    }

    this.stopAudition();
    this.isAuditioning = true;
    this.currentAuditionGearId = gearId;
    this.notifyAudition();

    const playSignatureLoop = () => {
      if (!this.isAuditioning || !this.ctx) return;
      const now = this.ctx.currentTime;

      if (category === 'console') {
        // 32-bus Analog Master Console: Saturated chords + Warm Summing Bus
        this.playMelodicChord(now);
        setTimeout(() => {
          if (this.isAuditioning && this.ctx) {
            this.playMelodicChord(this.ctx.currentTime);
          }
        }, 600);
      } else if (category === 'drum_machine') {
        // Afro-Drum Matrix 808: Deep sub roll + Log drum bounce
        this.playKick(now);
        this.playLogDrum(now + 0.15, 60);
        this.playLogDrum(now + 0.35, 55);
        this.playLogDrum(now + 0.65, 48);
      } else if (category === 'vocal_mic') {
        // Gold Tube Vocal Chamber: Layered harmony chant + Plate Reverb
        this.playVocalChant(now);
        setTimeout(() => {
          if (this.isAuditioning && this.ctx) {
            this.playVocalChant(this.ctx.currentTime);
          }
        }, 500);
      } else {
        // High-Definition Monitors & Subs: Full mastered spectrum
        this.playKick(now);
        this.playLogDrum(now + 0.2, 55);
        this.playMelodicChord(now);
        this.playVocalChant(now + 0.4);
      }
    };

    // Play first hit immediately
    playSignatureLoop();

    // Loop every 1.4 seconds for a musical signature groove
    this.auditionInterval = window.setInterval(playSignatureLoop, 1400);
    return true;
  }

  public stopAudition() {
    if (this.auditionInterval) {
      clearInterval(this.auditionInterval);
      this.auditionInterval = null;
    }
    this.isAuditioning = false;
    this.currentAuditionGearId = null;
    this.notifyAudition();
  }

  public speakAgentVoice(agentId: 'emar' | 'ricky' | 'kingpin' | 'orchestrator', text: string) {
    if (typeof window === 'undefined') return;

    // Trigger distinctive acoustic sound signature burst for character entry
    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (agentId === 'emar') this.playMelodicChord(now);
      if (agentId === 'ricky') this.playLogDrum(now, 55);
      if (agentId === 'kingpin') this.playVocalChant(now);
    }

    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Realistic Gemini & Lyria style acoustic personas with formant characteristics
    if (agentId === 'emar') {
      utterance.pitch = 1.06;
      utterance.rate = 1.02;
      utterance.lang = 'en-GB'; // British scientific clarity
    } else if (agentId === 'ricky') {
      utterance.pitch = 0.94;
      utterance.rate = 1.12;
      utterance.lang = 'en-NG'; // West African / Lagos rhythm and confidence
    } else if (agentId === 'kingpin') {
      utterance.pitch = 0.78;
      utterance.rate = 0.88;
      utterance.lang = 'en-US'; // Deep, commanding vocal authority
    } else {
      utterance.pitch = 0.98;
      utterance.rate = 1.0;
    }

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(
      (v) =>
        v.lang === utterance.lang ||
        v.lang.startsWith(utterance.lang.slice(0, 2)) ||
        (agentId === 'emar' && v.name.includes('UK')) ||
        (agentId === 'kingpin' && (v.name.includes('Natural') || v.name.includes('Male')))
    );

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  public setGenrePill(genre: string, bpm: number, key: string) {
    this.currentGenre = genre;
    this.bpm = bpm;
    this.key = key;

    if (genre === 'Amapiano') {
      this.stepPattern.logdrum = [
        true,
        false,
        false,
        true,
        false,
        false,
        true,
        false,
        false,
        true,
        false,
        true,
        false,
        true,
        false,
        false,
      ];
    } else if (genre === 'Afrobeats') {
      this.stepPattern.logdrum = [
        true,
        false,
        true,
        false,
        false,
        true,
        false,
        false,
        true,
        false,
        true,
        false,
        false,
        true,
        false,
        false,
      ];
    } else if (genre === 'UK Drill') {
      this.stepPattern.logdrum = [
        true,
        false,
        false,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        false,
        true,
      ];
    }
    this.notify();
  }

  public toggleStemMute(id: string) {
    const stem = this.stems.find((s) => s.id === id);
    if (stem) {
      stem.muted = !stem.muted;
      this.notify();
    }
  }

  public toggleStemSolo(id: string) {
    const stem = this.stems.find((s) => s.id === id);
    if (stem) {
      stem.solo = !stem.solo;
      this.notify();
    }
  }

  public setStemVolume(id: string, vol: number) {
    const stem = this.stems.find((s) => s.id === id);
    if (stem) {
      stem.volume = vol;
      if (this.stemGains[id]) {
        this.stemGains[id].gain.value = vol;
      }
      this.notify();
    }
  }

  public toggleFx(key: keyof AgentFxState) {
    this.fx[key] = !this.fx[key];
    if (key === 'emarAirEq' && this.airEqNode) {
      this.airEqNode.gain.value = this.fx.emarAirEq ? 6 : 0;
    }
    if (key === 'rickySubPunch' && this.subPunchNode) {
      this.subPunchNode.curve = this.makeDistortionCurve(this.fx.rickySubPunch ? 25 : 0) as any;
    }
    if (key === 'kingpinDoubler' && this.doublerGainNode) {
      this.doublerGainNode.gain.value = this.fx.kingpinDoubler ? 0.6 : 0.0;
    }
    this.notify();
  }

  public toggleStep(track: string, stepIndex: number) {
    if (this.stepPattern[track]) {
      this.stepPattern[track][stepIndex] = !this.stepPattern[track][stepIndex];
      this.notify();
    }
  }

  public generateRickyBounce() {
    const patterns = [
      [
        true,
        false,
        true,
        false,
        false,
        true,
        false,
        true,
        false,
        true,
        false,
        false,
        true,
        false,
        true,
        false,
      ],
      [
        true,
        false,
        false,
        true,
        false,
        true,
        false,
        false,
        true,
        false,
        true,
        false,
        false,
        true,
        false,
        true,
      ],
      [
        true,
        true,
        false,
        false,
        true,
        false,
        true,
        false,
        true,
        true,
        false,
        true,
        false,
        false,
        true,
        false,
      ],
    ];
    const choice = patterns[Math.floor(Math.random() * patterns.length)];
    this.stepPattern.logdrum = [...choice];
    this.notify();
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(64).fill(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  /**
   * Play dedicated Audition Tones for capability feature previews
   */
  public playAuditionTone(type: string) {
    this.initCtx();
    if (!this.ctx) return;

    switch (type.toLowerCase()) {
      case 'piano_roll':
      case 'piano roll':
        this.playMelodicChord(0);
        setTimeout(() => this.playMelodicChord(2), 250);
        setTimeout(() => this.playMelodicChord(4), 500);
        break;
      case 'recording':
        this.playVocalChant(0);
        setTimeout(() => this.playVocalChant(2), 400);
        break;
      case 'mixer & fx':
      case 'mixer':
        this.playKick(0);
        this.playMelodicChord(0);
        this.playShaker(0.1);
        this.playShaker(0.25);
        break;
      case 'mastering':
        this.playLogDrum(0, 45);
        this.playKick(0);
        setTimeout(() => this.playLogDrum(0, 55), 200);
        break;
      case 'lightning sync':
      case 'sync':
      case 'storage':
        this.playMelodicChord(4);
        setTimeout(() => this.playMelodicChord(0), 200);
        break;
      case 'multiplayer':
      case 'collaboration':
        this.playVocalChant(0);
        this.playLogDrum(0, 60);
        break;
      case 'agent memory':
      case 'ai console':
      default:
        this.playKick(0);
        this.playLogDrum(0, 55);
        this.playMelodicChord(0);
        break;
    }
  }

  /**
   * Generates and plays a 5-second dynamic procedural audio session in response to a user query
   */
  public generateQueryAudio(
    promptText: string,
    agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator' = 'orchestrator',
    onProgress?: (progress: number) => void,
    onComplete?: () => void
  ): { stop: () => void; duration: number } {
    this.initCtx();
    if (!this.ctx) {
      return { stop: () => {}, duration: 5 };
    }
    const ctx = this.ctx;

    const startTime = ctx.currentTime + 0.05;
    const duration = 5.0; // exactly 5 seconds
    const interval = 60 / this.bpm / 2; // 16th note interval (~0.134s at 112bpm)
    const totalSteps = Math.floor(duration / interval);

    const target = agent as string;
    const isAmapiano = /amapiano|log|drum|bounce/i.test(promptText);
    const isVocal = /vocal|hook|sing|voice|chant|harmony/i.test(promptText) || target === 'kingpin';
    const isMelodic =
      /chord|melody|keys|piano|synth|analyze/i.test(promptText) || target === 'emar';
    const is808 = /808|bass|sub|low/i.test(promptText) || target === 'ricky';

    // Schedule 5-second pattern
    for (let step = 0; step < totalSteps; step++) {
      const stepTime = startTime + step * interval;

      // Kicks & Rhythms (on beats 0, 4, 8, 12, 16, 20...)
      if (step % 4 === 0) {
        this.playKick(stepTime - ctx.currentTime);
      }

      // Shakers on every 16th
      if (step % 2 === 0 || isAmapiano) {
        this.playShaker(stepTime - ctx.currentTime);
      }

      // Log drum / 808 patterns
      if (is808 || isAmapiano || target === 'ricky' || target === 'orchestrator') {
        if (step % 3 === 0 || step % 8 === 2 || step % 8 === 5) {
          const pitch = 50 + (step % 4) * 4;
          this.playLogDrum(stepTime - ctx.currentTime, pitch);
        }
      }

      // Chords and Melodics
      if (isMelodic || target === 'emar' || target === 'orchestrator') {
        if (step % 8 === 0) {
          this.playMelodicChord(stepTime - ctx.currentTime);
        }
      }

      // Vocals and Chants
      if (isVocal || target === 'kingpin' || (target === 'orchestrator' && step > 8)) {
        if (step % 12 === 0 || step === 4 || step === 16) {
          this.playVocalChant(stepTime - ctx.currentTime);
        }
      }
    }

    // Interval tracking for progress animation
    const progressInterval = 50; // ms
    const totalIntervals = (duration * 1000) / progressInterval;
    let currentInterval = 0;

    const timer = setInterval(() => {
      currentInterval++;
      const p = Math.min(currentInterval / totalIntervals, 1);
      onProgress?.(p);
      if (p >= 1) {
        clearInterval(timer);
        onComplete?.();
      }
    }, progressInterval);

    return {
      stop: () => {
        clearInterval(timer);
      },
      duration: 5,
    };
  }

  public exportSessionState() {
    return {
      bpm: this.bpm,
      key: this.key,
      genre: this.currentGenre,
      stems: this.stems.map((s) => ({ ...s })),
      fx: { ...this.fx },
      stepPattern: JSON.parse(JSON.stringify(this.stepPattern)),
      timestamp: Date.now(),
    };
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      bpm: this.bpm,
      key: this.key,
      currentGenre: this.currentGenre,
      currentStep: this.currentStep,
      stems: this.stems,
      fx: this.fx,
      stepPattern: this.stepPattern,
    };
  }
}

export const landingAudioEngine = new LandingAudioEngine();
