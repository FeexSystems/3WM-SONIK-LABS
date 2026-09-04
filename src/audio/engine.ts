// 3WM SONIK — Master Multi-Track Audio Engine, Shared Transport & Stereo Metering (v2.2)
import {
  TrackSettings,
  StemTrack,
  RecordedTake,
  MidiPattern,
  StepSequencerChannel,
} from '../types';
import { midiSynth } from './midiEngine';
import { AudioTelemetry } from './telemetry';
import { sonik808Engine } from './pluginEngine';
import { HighPrecisionRingBuffer, RingBufferStats } from './ringBuffer';
import { transportBridge } from './transportBridge';
import { quantizationEngine } from './quantizationEngine';
import { audioFileHandler } from './audioFileHandler';
import { professionalMetering } from './professionalMetering';
import { MultitrackRecorder } from './multitrackRecorder';
import { BeatDetective } from './beatDetective';
import { ProfessionalMixer } from './professionalMixer';
import { EffectsSuite } from './effectsSuite';
import { MasteringChain } from './masteringChain';
import { LUFSMeter } from './lufsMeter';
import { SpectrumAnalyzer } from './spectrumAnalyzer';
import { dspManager } from './dspManager';

export interface StereoMeterData {
  leftPeak: number; // dB (-60 to 0)
  rightPeak: number; // dB (-60 to 0)
  leftRms: number; // dB
  rightRms: number; // dB
  leftClip: boolean;
  rightClip: boolean;
  lufs: number;
  energy: number;
}

export class SonicAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timerId: number | null = null;
  private bpm = 112;
  private currentStep = 0;
  private nextNoteTime = 0;
  private scheduleAheadTime = 0.1;
  private loopLengthSteps = 16;
  private metronomeEnabled = false;
  private activeTransientSources: Set<AudioScheduledSourceNode> = new Set();

  // Audio Context State Management
  private audioContextState: AudioContextState | 'uninitialized' = 'uninitialized';
  private userInteractionHandlers: (() => void)[] = [];
  private stateChangeCallbacks: ((state: string) => void)[] = [];

  // High-Precision Circular Ring Buffer (16k samples ~341ms at 48kHz, absorbs high-CPU plugin bursts)
  private ringBuffer: HighPrecisionRingBuffer = new HighPrecisionRingBuffer(16384);
  private monitorProcessor: AudioWorkletNode | null = null;

  // Master Nodes
  private masterGain: GainNode | null = null;
  private lowFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private highFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private saturationNode: WaveShaperNode | null = null;
  private stereoSplitter: ChannelSplitterNode | null = null;
  private leftAnalyser: AnalyserNode | null = null;
  private rightAnalyser: AnalyserNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private analyserDataBuffer: Uint8Array | null = null;

  // Peak hold & Clip flags
  private leftClipHold = false;
  private rightClipHold = false;

  // Dynamic Sidechain Ducking Bus & DSP
  private sidechainDuckingGain: GainNode | null = null;
  private sidechainEnabled = true;
  private duckAmountDb = -6.0;
  private duckThresholdDb = -26.0;
  private duckReleaseMs = 220;
  private currentSidechainGainReductionDb = 0.0;
  private dspProcessingStartTime: number = 0;
  private lastCpuPercent = 14.5;

  // Stem Sub-Mixers
  private stemGains = new Map<string, GainNode>();
  private stemPans = new Map<string, StereoPannerNode>();

  // Active Patterns for playback
  private activeMidiPatterns: MidiPattern[] = [];
  private activeStepChannels: StepSequencerChannel[] = [];

  // A/B Comparison State
  private isAbBypassed = false;

  // Recording State
  private isRecording = false;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStartTime: number = 0;
  private inputAnalyser: AnalyserNode | null = null;

  // Multitrack Recording System
  private multitrackRecorder: MultitrackRecorder | null = null;

  // Beat Detective and Tempo Mapping
  private beatDetective: BeatDetective | null = null;

  // Professional Mixing & Mastering System
  private professionalMixer: ProfessionalMixer | null = null;
  private effectsSuite: EffectsSuite | null = null;
  private masteringChain: MasteringChain | null = null;
  private lufsMeter: LUFSMeter | null = null;
  private spectrumAnalyzer: SpectrumAnalyzer | null = null;

  private onStepCallback: ((step: number, bar: number, beat: number) => void) | null = null;

  public async init(): Promise<AudioContext | null> {
    if (this.ctx) return this.ctx;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    this.ctx = new AudioCtx();

    // Load AudioWorklet module for monitoring
    try {
      await this.ctx.audioWorklet.addModule('/worklets/audio-monitor-processor.js');
    } catch (error) {
      console.warn('Failed to load AudioWorklet module:', error);
      // Continue without worklet support
    }

    // Track transient audio sources for instant playback choking & loop stopping
    const trackTransient = (node: AudioScheduledSourceNode) => {
      if ((node as any).__persistent) return;
      this.activeTransientSources.add(node);
      const existingOnEnded = node.onended;
      node.onended = (ev) => {
        this.activeTransientSources.delete(node);
        if (typeof existingOnEnded === 'function') {
          existingOnEnded.call(node, ev);
        }
      };
    };

    // Instrument AudioContext for telemetry and active voice tracking
    const origCreateOsc = this.ctx.createOscillator.bind(this.ctx);
    this.ctx.createOscillator = () => {
      const node = origCreateOsc();
      AudioTelemetry.trackVoiceStart(node);
      trackTransient(node);
      return node;
    };

    const origCreateBufferSource = this.ctx.createBufferSource.bind(this.ctx);
    this.ctx.createBufferSource = () => {
      const node = origCreateBufferSource();
      AudioTelemetry.trackVoiceStart(node);
      trackTransient(node);
      return node;
    };

    // Start Event Loop lag tracker
    const loopTracker = () => {
      AudioTelemetry.updateEventLoop();
      requestAnimationFrame(loopTracker);
    };
    requestAnimationFrame(loopTracker);

    // Audio Context State Management
    this.setupAudioContextStateManagement();

    // 1. Analysers for Real-time Stereo Metering
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 256;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    this.leftAnalyser = this.ctx.createAnalyser();
    this.leftAnalyser.fftSize = 256;
    this.leftAnalyser.smoothingTimeConstant = 0.5;

    this.rightAnalyser = this.ctx.createAnalyser();
    this.rightAnalyser.fftSize = 256;
    this.rightAnalyser.smoothingTimeConstant = 0.5;

    this.stereoSplitter = this.ctx.createChannelSplitter(2);

    // 2. Saturation (Warm Tube Modeling for T-RackS & Lagos Sound - Clean Soft Curve)
    this.saturationNode = this.ctx.createWaveShaper();
    this.saturationNode.curve = this.makeDistortionCurve(0) as any;
    this.saturationNode.oversample = '4x';

    // 3. Compressor (Transparent Studio Bus Compressor with Soft Knee)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(6.0, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(2.2, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.015, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

    // 4. 3-Band Parametric EQ
    this.lowFilter = this.ctx.createBiquadFilter();
    this.lowFilter.type = 'lowshelf';
    this.lowFilter.frequency.value = 120;

    this.midFilter = this.ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = 1.0;

    this.highFilter = this.ctx.createBiquadFilter();
    this.highFilter.type = 'highshelf';
    this.highFilter.frequency.value = 8000;

    // 4b. Dynamic Sidechain Ducking Bus Gain (Attenuates drums/instruments when vocals enter)
    this.sidechainDuckingGain = this.ctx.createGain();
    this.sidechainDuckingGain.gain.value = 1.0;

    // 4c. Brickwall Limiter (True-Peak safety, fast attack)
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime);
    this.limiter.knee.setValueAtTime(0, this.ctx.currentTime);
    this.limiter.ratio.setValueAtTime(20, this.ctx.currentTime);
    this.limiter.attack.setValueAtTime(0.001, this.ctx.currentTime);
    this.limiter.release.setValueAtTime(0.05, this.ctx.currentTime);

    // 5. Master Output Gain & Headroom Limiter Stage
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.82;

    // DSP Connection Chain:
    // Stems/Synths -> sidechainDuckingGain -> lowFilter -> midFilter -> highFilter -> saturationNode -> compressor -> masterGain
    // masterGain -> destination
    // masterGain -> masterAnalyser
    // masterGain -> stereoSplitter -> leftAnalyser / rightAnalyser
    this.sidechainDuckingGain.connect(this.lowFilter);
    this.lowFilter.connect(this.midFilter);
    this.midFilter.connect(this.highFilter);
    this.highFilter.connect(this.saturationNode);
    this.saturationNode.connect(this.compressor);
    this.compressor!.connect(this.limiter);
    this.limiter!.connect(this.masterGain);

    this.masterGain.connect(this.ctx.destination);
    this.masterGain.connect(this.masterAnalyser);
    this.masterGain.connect(this.stereoSplitter);

    this.stereoSplitter.connect(this.leftAnalyser, 0);
    this.stereoSplitter.connect(this.rightAnalyser, 1);

    // Initialize MIDI Synthesizer & 808 DSP Engine routed into the Sidechain/EQ stage
    midiSynth.init(this.ctx, this.sidechainDuckingGain);
    sonik808Engine.init(this.ctx, this.sidechainDuckingGain);

    // Initialize Professional Mixing & Mastering System
    this.professionalMixer = new ProfessionalMixer();
    void this.professionalMixer.initialize(this.ctx);

    this.effectsSuite = new EffectsSuite();
    void this.effectsSuite.initialize(this.ctx);

    this.masteringChain = new MasteringChain();
    void this.masteringChain.initialize(this.ctx);

    this.lufsMeter = new LUFSMeter(-14, -1.0);
    void this.lufsMeter.initialize(this.ctx);

    this.spectrumAnalyzer = new SpectrumAnalyzer();
    void this.spectrumAnalyzer.initialize(this.ctx);

    // Initialize DSP Manager with AudioWorklet support
    await dspManager.initialize(this.ctx);
    console.log('DSP Manager initialized:', dspManager.getMode());

    return this.ctx;
  }

  // Transparent Tube Saturation Curve Builder (Zero Distortion / Noise by Default, Smooth Warm Tanh Harmonics when Engaged)
  private makeDistortionCurve(amount: number): Float32Array {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    if (!amount || amount <= 0.5) {
      for (let i = 0; i < n_samples; ++i) {
        curve[i] = (i * 2) / n_samples - 1; // Pure clean linear unity
      }
      return curve;
    }

    const drive = 1 + (amount / 100) * 1.8;
    const norm = Math.tanh(drive);
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = Math.tanh(x * drive) / norm;
    }
    return curve;
  }

  // Setup Stem Routing Nodes
  public registerStems(stems: StemTrack[]) {
    if (!this.ctx || !this.lowFilter) return;

    stems.forEach((stem) => {
      if (!this.stemGains.has(stem.id)) {
        const gainNode = this.ctx!.createGain();
        let pannerNode: StereoPannerNode | null = null;
        if (typeof this.ctx!.createStereoPanner === 'function') {
          pannerNode = this.ctx!.createStereoPanner();
        }

        if (pannerNode) {
          gainNode.connect(pannerNode);
          pannerNode.connect(this.lowFilter!);
          this.stemPans.set(stem.id, pannerNode);
        } else {
          gainNode.connect(this.lowFilter!);
        }

        this.stemGains.set(stem.id, gainNode);
      }

      this.updateStemParameters(
        stem,
        stems.some((s) => s.solo)
      );
    });
  }

  public updateStemParameters(stem: StemTrack, anySoloed: boolean) {
    const gainNode = this.stemGains.get(stem.id);
    const pannerNode = this.stemPans.get(stem.id);
    if (!gainNode || !this.ctx) return;

    const isAudible = anySoloed ? stem.solo : !stem.muted;
    const targetVol = isAudible ? stem.volume : 0;

    gainNode.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.03);

    if (pannerNode) {
      pannerNode.pan.setTargetAtTime(stem.pan, this.ctx.currentTime, 0.03);
    }
  }

  // DSP Node Management for per-track processing
  private trackDSPNodes = new Map<string, any>();

  public async createTrackDSPNode(trackId: string): Promise<boolean> {
    if (!this.ctx || !dspManager.isReady()) return false;

    const node = await dspManager.createDSPNode(trackId);
    if (node) {
      this.trackDSPNodes.set(trackId, node);
      return true;
    }
    return false;
  }

  public removeTrackDSPNode(trackId: string): void {
    dspManager.removeDSPNode(trackId);
    this.trackDSPNodes.delete(trackId);
  }

  public getTrackDSPNode(trackId: string): any {
    return this.trackDSPNodes.get(trackId);
  }

  /**
   * Get master analyser for audio visualization and analysis
   * Used by AgentAvatarContainer for audio-reactive animations
   */
  public getMasterAnalyser(): AnalyserNode | null {
    return this.masterAnalyser;
  }

  /**
   * Get audio context for external components
   */
  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  /**
   * Get DSP manager mode (worklet or fallback)
   */
  public getDSPMode(): string {
    return dspManager.getMode();
  }

  /**
   * Check if DSP is ready
   */
  public isDSPReady(): boolean {
    return dspManager.isReady();
  }

  public updateDsp(settings: TrackSettings) {
    if (!this.ctx) return;
    const time = this.ctx.currentTime;

    if (this.isAbBypassed) {
      if (this.lowFilter) this.lowFilter.gain.setTargetAtTime(0, time, 0.05);
      if (this.midFilter) this.midFilter.gain.setTargetAtTime(0, time, 0.05);
      if (this.highFilter) this.highFilter.gain.setTargetAtTime(0, time, 0.05);
      if (this.saturationNode) this.saturationNode.curve = this.makeDistortionCurve(0) as any;
      if (this.masterGain) this.masterGain.gain.setTargetAtTime(settings.volume, time, 0.05);
      return;
    }

    // Update existing AudioNode-based DSP (master bus)
    if (this.lowFilter) this.lowFilter.gain.setTargetAtTime(settings.eq.low, time, 0.05);
    if (this.midFilter) this.midFilter.gain.setTargetAtTime(settings.eq.mid, time, 0.05);
    if (this.highFilter) this.highFilter.gain.setTargetAtTime(settings.eq.high, time, 0.05);

    if (this.compressor) {
      this.compressor.threshold.setTargetAtTime(settings.compression.threshold, time, 0.05);
      this.compressor.ratio.setTargetAtTime(settings.compression.ratio, time, 0.05);
      this.compressor.attack.setTargetAtTime(settings.compression.attack / 1000, time, 0.05);
      this.compressor.release.setTargetAtTime(settings.compression.release / 1000, time, 0.05);
    }

    if (this.saturationNode) {
      const satAmount = ((settings.mastering?.warmthSaturation || 50) / 100) * 25;
      this.saturationNode.curve = this.makeDistortionCurve(satAmount) as any;
    }

    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(settings.volume, time, 0.05);
    }

    // Update track-specific DSP nodes if using AudioWorklet
    this.trackDSPNodes.forEach((node, trackId) => {
      dspManager.setDSPParameters(trackId, {
        eqLow: settings.eq.low,
        eqMid: settings.eq.mid,
        eqHigh: settings.eq.high,
        compThreshold: settings.compression.threshold,
        compRatio: settings.compression.ratio,
        compAttack: settings.compression.attack / 1000,
        compRelease: settings.compression.release / 1000,
        saturationDrive: ((settings.mastering?.warmthSaturation || 50) / 100) * 25,
        limiterThreshold: -1.0,
        limiterRelease: 0.1,
      });
    });
  }

  public applyMasteringProfile(profile: {
    frequencyBalance: { low: number; mid: number; high: number };
    harmonicWarmth: number;
  }) {
    if (!this.ctx) return;
    const time = this.ctx.currentTime;
    if (this.lowFilter)
      this.lowFilter.gain.setTargetAtTime(profile.frequencyBalance.low, time, 0.05);
    if (this.midFilter)
      this.midFilter.gain.setTargetAtTime(profile.frequencyBalance.mid, time, 0.05);
    if (this.highFilter)
      this.highFilter.gain.setTargetAtTime(profile.frequencyBalance.high, time, 0.05);
    if (this.saturationNode) {
      const sat = (profile.harmonicWarmth / 100) * 25;
      this.saturationNode.curve = this.makeDistortionCurve(sat) as any;
    }
  }

  public setAbBypass(bypassed: boolean, settings: TrackSettings) {
    this.isAbBypassed = bypassed;
    this.updateDsp(settings);
  }

  public getAbBypass(): boolean {
    return this.isAbBypassed;
  }

  // -------------------------------------------------------------
  // Real-Time Stereo Peak & RMS Metering (Left & Right Channels)
  // -------------------------------------------------------------

  public getStereoMeters(): StereoMeterData {
    if (!this.leftAnalyser || !this.rightAnalyser) {
      return {
        leftPeak: -60,
        rightPeak: -60,
        leftRms: -60,
        rightRms: -60,
        leftClip: false,
        rightClip: false,
        lufs: -60,
        energy: 0,
      };
    }

    const leftData = new Uint8Array(this.leftAnalyser.frequencyBinCount);
    const rightData = new Uint8Array(this.rightAnalyser.frequencyBinCount);
    this.leftAnalyser.getByteFrequencyData(leftData as any);
    this.rightAnalyser.getByteFrequencyData(rightData as any);

    const calcChannel = (data: Uint8Array) => {
      let sum = 0;
      let max = 0;
      for (const value of data) {
        const norm = value / 255;
        sum += norm * norm;
        if (norm > max) max = norm;
      }
      const rms = Math.sqrt(sum / data.length);
      const peakDb = max <= 0.001 ? -60 : Math.max(-60, 20 * Math.log10(max));
      const rmsDb = rms <= 0.001 ? -60 : Math.max(-60, 20 * Math.log10(rms));
      const isClipping = max >= 0.98;
      return { peakDb, rmsDb, isClipping, rmsNorm: rms };
    };

    const l = calcChannel(leftData);
    const r = calcChannel(rightData);

    if (l.isClipping) this.leftClipHold = true;
    if (r.isClipping) this.rightClipHold = true;

    const avgRmsDb = (l.rmsDb + r.rmsDb) / 2;
    const lufs = avgRmsDb <= -59 ? -60 : Number((avgRmsDb - 3.1).toFixed(1));

    return {
      leftPeak: Number(l.peakDb.toFixed(1)),
      rightPeak: Number(r.peakDb.toFixed(1)),
      leftRms: Number(l.rmsDb.toFixed(1)),
      rightRms: Number(r.rmsDb.toFixed(1)),
      leftClip: this.leftClipHold,
      rightClip: this.rightClipHold,
      lufs,
      energy: (l.rmsNorm + r.rmsNorm) / 2,
    };
  }

  public resetClipHold() {
    this.leftClipHold = false;
    this.rightClipHold = false;
  }

  public getAnalyserData(): Uint8Array | null {
    if (!this.masterAnalyser) return null;
    const size = this.masterAnalyser.frequencyBinCount;
    if (!this.analyserDataBuffer || this.analyserDataBuffer.length !== size) {
      this.analyserDataBuffer = new Uint8Array(size);
    }
    this.masterAnalyser.getByteFrequencyData(this.analyserDataBuffer as any);
    return this.analyserDataBuffer;
  }

  // -------------------------------------------------------------
  // Shared Transport & Playback Scheduler
  // -------------------------------------------------------------

  public setBpm(newBpm: number) {
    this.bpm = Math.max(40, Math.min(240, newBpm));
    transportBridge.setBpm(this.bpm);
  }

  public getBpm(): number {
    return this.bpm;
  }

  public setMetronome(enabled: boolean) {
    this.metronomeEnabled = enabled;
    transportBridge.setMetronome(enabled);
  }

  public getMetronome(): boolean {
    return this.metronomeEnabled;
  }

  public setLoopLength(steps: number) {
    this.loopLengthSteps = steps;
  }

  public setActivePatterns(midiPatterns: MidiPattern[], stepChannels: StepSequencerChannel[]) {
    this.activeMidiPatterns = midiPatterns;
    this.activeStepChannels = stepChannels;

    // Derive loop length from active patterns
    let maxSteps = 16;
    stepChannels.forEach((ch) => {
      if (ch.steps.length > maxSteps) maxSteps = ch.steps.length;
    });
    midiPatterns.forEach((pat) => {
      if (pat.lengthSteps > maxSteps) maxSteps = pat.lengthSteps;
    });
    this.loopLengthSteps = maxSteps;

    transportBridge.syncChannels(stepChannels);
    transportBridge.syncPatterns(midiPatterns);
  }

  public async startPlayback(onStep?: (step: number, bar: number, beat: number) => void) {
    await this.init();
    if (!this.ctx) return;

    // Use new state management for autoplay policy
    const isRunning = await this.ensureAudioContextRunning();
    if (!isRunning) {
      console.warn('Could not ensure audio context is running');
      return;
    }

    this.isPlaying = true;
    this.currentStep = 0;
    if (onStep) this.onStepCallback = onStep;
    transportBridge.setPlayState(true);

    if (this.timerId) window.clearTimeout(this.timerId);
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.scheduler();
  }

  private scheduler() {
    if (!this.isPlaying || !this.ctx) return;

    // While there are notes that will need to play before the next interval,
    // schedule them and advance the pointer.
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.stepAudio(this.nextNoteTime);
      this.nextNoteTime += 60 / this.bpm / 4; // Advance 16th note
    }

    this.timerId = window.setTimeout(() => this.scheduler(), 25);
  }

  private stepAudio(time: number) {
    const lateness = Math.max(0, this.ctx!.currentTime - time) * 1000;
    AudioTelemetry.scheduledLateness = lateness;
    AudioTelemetry.maxLateness = Math.max(AudioTelemetry.maxLateness, lateness);
    const bar = Math.floor(this.currentStep / 16) + 1;
    const beat = (Math.floor(this.currentStep / 4) % 4) + 1;

    // Explicitly reset 808 glide state at loop boundaries
    if (this.currentStep === 0) {
      sonik808Engine.resetGlide();
    }

    // Metronome Click on quarter beats
    if (this.metronomeEnabled && this.currentStep % 4 === 0) {
      this.playMetronomeClick(this.currentStep % 16 === 0, time);
    }

    // 1. Procedural Stem Drums (if no explicit step channels are active)
    if (this.activeStepChannels.length === 0) {
      this.triggerAfrobeatStep(this.currentStep % 16, time);
    } else {
      // 2. Play Step Sequencer Channels
      this.activeStepChannels.forEach((ch) => {
        if (ch.muted) return;
        const stepIdx = this.currentStep % ch.steps.length;
        const stepData = ch.steps[stepIdx];
        if (stepData && stepData.enabled) {
          const prob = stepData.probability ?? 1;
          if (Math.random() <= prob) {
            const vel = stepData.accent
              ? Math.min(127, Math.round(stepData.velocity * 1.25))
              : stepData.velocity;

            // Route 808 Lab channels to the specialized DSP synthesizer
            if (
              ch.is808Channel ||
              ch.sampleKey === 'sonik_808' ||
              ch.sampleKey === '808' ||
              ch.sampleKey === 'sub_808' ||
              ch.sampleKey === '808_sub_heavy' ||
              ch.sampleKey === '808_spinz' ||
              ch.sampleKey === '808_drill_slide'
            ) {
              const pitch = stepData.pitch ?? ch.pitch ?? 36;
              const stepDurationSec = (60 / this.bpm / 4) * 2.5;
              const params = {
                ...(ch.eight08Params || {}),
                legato:
                  stepData.slide !== undefined
                    ? stepData.slide
                    : (ch.eight08Params?.legato ?? true),
              };
              sonik808Engine.trigger808Note(pitch, vel, stepDurationSec, params, time);
            } else {
              // Standard drum samples with ratchet roll support
              if (stepData.ratchet && stepData.ratchet > 1) {
                const subInterval = 60 / this.bpm / 4 / stepData.ratchet;
                for (let r = 0; r < stepData.ratchet; r++) {
                  midiSynth.playDrumSample(ch.sampleKey, vel, ch.pan, time + r * subInterval);
                }
              } else {
                midiSynth.playDrumSample(ch.sampleKey, vel, ch.pan, time);
              }
            }
          }
        }
      });
    }

    // 3. Play MIDI Piano Roll Patterns
    if (this.activeMidiPatterns && this.activeMidiPatterns.length > 0) {
      this.activeMidiPatterns.forEach((pattern) => {
        if (pattern.isMuted) return;
        const patternStep = this.currentStep % (pattern.lengthSteps || 16);
        const matchingNotes = pattern.notes.filter((n) => n.startStep === patternStep);
        matchingNotes.forEach((n) => {
          const prob = n.probability ?? 1;
          if (Math.random() <= prob) {
            const stepDurSec = (60 / this.bpm / 4) * (n.durationSteps || 1);
            midiSynth.playNote(
              n.pitch,
              n.velocity,
              stepDurSec,
              pattern.instrumentType || 'synth_lead',
              n.pan || 0,
              time
            );
          }
        });
      });
    }

    if (this.onStepCallback) this.onStepCallback(this.currentStep, bar, beat);
    transportBridge.stepTick(this.currentStep, bar, beat);
    this.currentStep = (this.currentStep + 1) % this.loopLengthSteps;
  }

  public playMetronomeClick(isHighAccent: boolean = false, time?: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = time !== undefined ? time : this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(isHighAccent ? 1600 : 950, now);
    gain.gain.setValueAtTime(isHighAccent ? 0.35 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  public stopPlayback() {
    this.isPlaying = false;
    if (this.timerId) {
      window.clearTimeout(this.timerId);
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.currentStep = 0;
    transportBridge.setPlayState(false);

    // 1. Instantly silence 808 synthesizer voices and reset glide
    try {
      sonik808Engine.stopAll();
    } catch (e) {}

    // 2. Instantly choke all MIDI Synthesizer notes and drum samples
    try {
      midiSynth.stopAllNotes();
    } catch (e) {}

    // 3. Stop and disconnect every active/scheduled transient oscillator or buffer source
    this.activeTransientSources.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this.activeTransientSources.clear();

    // 4. Stop all vocal tracks
    this.vocalTracks.forEach((vt) => {
      if (vt.source) {
        try {
          vt.source.stop();
        } catch (e) {}
      }
    });

    // 5. Instantly clamp and smoothly reset sidechain and master buses to cut off any delay feedback or resonance
    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.sidechainDuckingGain) {
        try {
          this.sidechainDuckingGain.gain.cancelScheduledValues(now);
          this.sidechainDuckingGain.gain.setValueAtTime(0, now);
          this.sidechainDuckingGain.gain.setValueAtTime(1.0, now + 0.04);
        } catch (e) {}
      }
      if (this.masterGain) {
        try {
          this.masterGain.gain.cancelScheduledValues(now);
          this.masterGain.gain.setValueAtTime(0, now);
          this.masterGain.gain.setValueAtTime(0.82, now + 0.04);
        } catch (e) {}
      }
    }
  }

  public getRingBufferStats(): RingBufferStats {
    return this.ringBuffer.getStats();
  }

  public getPlaying(): boolean {
    return this.isPlaying;
  }

  public getRecording(): boolean {
    return this.isRecording;
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  // Auditioning helpers for Piano Roll and Step Sequencer UI
  public async auditionNote(
    pitch: number,
    velocity: number = 100,
    durationSec: number = 0.3,
    instrumentType: string = 'synth_lead'
  ) {
    await this.init();
    midiSynth.playNote(pitch, velocity, durationSec, instrumentType);
  }

  public async auditionDrumSample(
    sampleKey: string,
    velocity: number = 100,
    pitch?: number,
    eight08Params?: Record<string, any>
  ) {
    await this.init();
    if (sampleKey === 'sonik_808' || sampleKey === '808' || sampleKey === 'sub_808') {
      sonik808Engine.trigger808Note(pitch ?? 36, velocity, 1.2, eight08Params || {});
    } else {
      midiSynth.playDrumSample(sampleKey, velocity);
    }
  }

  // Procedural Afrobeat Synthesizer fallback
  private triggerAfrobeatStep(step: number, time: number) {
    if (!this.ctx || !this.lowFilter) return;
    const now = time !== undefined ? time : this.ctx.currentTime;

    if ([0, 4, 8, 11, 14].includes(step)) this.playKick(now);
    if ([4, 10, 12].includes(step)) this.playRimshot(now);
    this.playShaker(now, step % 2 === 1 ? 0.08 : 0.04);
    if ([2, 5, 9, 13].includes(step)) this.playConga(now, step % 2 === 0 ? 320 : 260);

    if ([0, 3, 6, 8, 12, 14].includes(step)) {
      const freq = step === 0 ? 55 : step === 3 ? 65.4 : step === 6 ? 49 : step === 8 ? 55 : 58.2;
      this.playLogDrum(now, freq);
    }

    if ([2, 7, 10].includes(step)) {
      this.playHornStab(now);
    }

    if (step === 0 || step === 8) {
      this.playSynthPad(now);
    }
  }

  private playKick(time: number) {
    if (!this.ctx || !this.lowFilter) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.09);

    gain.gain.setValueAtTime(0.75, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.lowFilter);

    osc.start(time);
    osc.stop(time + 0.23);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private playRimshot(time: number) {
    if (!this.ctx || !this.lowFilter) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, time);
    osc.frequency.exponentialRampToValueAtTime(180, time + 0.06);

    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(this.lowFilter);

    osc.start(time);
    osc.stop(time + 0.09);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private playConga(time: number, freq: number) {
    if (!this.ctx || !this.lowFilter) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, time + 0.12);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.lowFilter);

    osc.start(time);
    osc.stop(time + 0.15);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private playShaker(time: number, vol: number) {
    if (!this.ctx || !this.lowFilter) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.03);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.lowFilter);

    whiteNoise.start(time);
    whiteNoise.stop(time + 0.035);
  }

  private playLogDrum(time: number, freq: number) {
    if (!this.ctx || !this.lowFilter) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.04);

    gain.gain.setValueAtTime(0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(this.lowFilter);

    osc.start(time);
    osc.stop(time + 0.36);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private playHornStab(time: number) {
    if (!this.ctx || !this.lowFilter) return;
    const freqs = [370, 440, 554.3];
    freqs.forEach((f) => {
      if (!this.ctx || !this.lowFilter) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, time);

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.connect(gain);
      gain.connect(this.lowFilter);

      osc.start(time);
      osc.stop(time + 0.19);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
  }

  private playSynthPad(time: number) {
    if (!this.ctx || !this.lowFilter) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, time);

    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

    osc.connect(gain);
    gain.connect(this.lowFilter);

    osc.start(time);
    osc.stop(time + 0.52);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private monitorGain: GainNode | null = null;
  private isMonitoringEnabled: boolean = false;

  // --- Real In-Browser Recording Engine with High-Precision Ring Buffered Monitoring ---
  public async startRecording(enableDirectMonitoring: boolean = false): Promise<boolean> {
    await this.init();
    if (!this.ctx) return false;

    try {
      this.ringBuffer.clear();
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const source = this.ctx.createMediaStreamSource(this.mediaStream);
      this.inputAnalyser = this.ctx.createAnalyser();
      this.inputAnalyser.fftSize = 128;
      source.connect(this.inputAnalyser);

      // Low latency headphone direct monitoring node through Ring Buffer de-jitter
      this.monitorGain = this.ctx.createGain();
      this.isMonitoringEnabled = enableDirectMonitoring;
      this.monitorGain.gain.value = enableDirectMonitoring ? 0.75 : 0.0;

      // Use AudioWorklet for monitoring if available
      try {
        this.monitorProcessor = new AudioWorkletNode(this.ctx, 'audio-monitor-processor');
        this.monitorProcessor.port.postMessage({
          type: 'setMonitoring',
          enabled: enableDirectMonitoring,
        });

        source.connect(this.monitorProcessor);
        this.monitorProcessor.connect(this.monitorGain);
      } catch (error) {
        console.warn('AudioWorklet not available, falling back to direct connection:', error);
        source.connect(this.monitorGain);
      }

      this.monitorGain.connect(this.ctx.destination);

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined,
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100);
      this.recordingStartTime = Date.now();
      this.isRecording = true;
      transportBridge.setRecordState(true);
      return true;
    } catch (err) {
      console.error('Microphone access failed or denied:', err);
      this.isRecording = false;
      return false;
    }
  }

  public setDirectMonitoring(enabled: boolean, volume: number = 0.7) {
    this.isMonitoringEnabled = enabled;
    transportBridge.setDirectMonitoring(enabled, Math.round(volume * 100));
    if (this.monitorGain && this.ctx) {
      this.monitorGain.gain.setTargetAtTime(enabled ? volume : 0.0, this.ctx.currentTime, 0.02);
    }
    // Update AudioWorklet processor if available
    if (this.monitorProcessor instanceof AudioWorkletNode) {
      this.monitorProcessor.port.postMessage({ type: 'setMonitoring', enabled });
    }
  }

  public getInputLevel(): number {
    if (!this.inputAnalyser) return 0;
    const data = new Uint8Array(this.inputAnalyser.frequencyBinCount);
    this.inputAnalyser.getByteFrequencyData(data as any);
    let sum = 0;
    for (const value of data) {
      sum += value;
    }
    return sum / (data.length * 255);
  }

  // -------------------------------------------------------------
  // Professional Audio Processing Integration
  // -------------------------------------------------------------

  /**
   * Initialize professional audio processing engines
   */
  public async initializeProfessionalEngines(): Promise<void> {
    if (this.ctx) {
      await quantizationEngine.initialize(this.ctx);
      await audioFileHandler.initialize(this.ctx);
      await professionalMetering.initialize(this.ctx);

      // Connect professional metering to master output
      if (this.masterGain && this.stereoSplitter) {
        professionalMetering.connectToSource(this.masterGain, this.masterGain);
      }
    }
  }

  /**
   * Quantize audio buffer to grid
   */
  public async quantizeAudio(
    buffer: AudioBuffer,
    bpm: number,
    resolution: '1/4' | '1/8' | '1/16' | '1/32' | '1/64' | '1/128' | 'triplet' | 'dot',
    strength: number = 1.0
  ): Promise<AudioBuffer> {
    const grid = {
      resolution,
      bpm,
      sampleRate: this.ctx?.sampleRate || 48000,
      swing: 0,
      grooveOffset: 0,
    };

    const transients = quantizationEngine.detectTransients(buffer);
    const transientPositions = transients.transients.map((t) => t.position);

    return quantizationEngine.quantizeAudioBuffer(buffer, transientPositions, grid, strength);
  }

  /**
   * Time-stretch audio buffer
   */
  public async timeStretchAudio(
    buffer: AudioBuffer,
    ratio: number,
    preservePitch: boolean = true,
    quality: 'low' | 'medium' | 'high' = 'high'
  ): Promise<AudioBuffer> {
    return quantizationEngine.timeStretch(buffer, {
      ratio,
      preservePitch,
      algorithm: 'wsola',
      quality,
    });
  }

  /**
   * Pitch-shift audio buffer
   */
  public async pitchShiftAudio(
    buffer: AudioBuffer,
    semitones: number,
    preserveDuration: boolean = true
  ): Promise<AudioBuffer> {
    return quantizationEngine.pitchShift(buffer, {
      semitones,
      preserveDuration,
      algorithm: 'phase-vocoder',
      formantPreservation: false,
    });
  }

  /**
   * Convert audio file format
   */
  public async convertAudioFile(
    buffer: AudioBuffer,
    targetSampleRate: number,
    targetBitDepth: 16 | 24 | 32,
    dithering: boolean = true
  ): Promise<AudioBuffer> {
    return audioFileHandler.convertAudio(buffer, {
      targetSampleRate,
      targetBitDepth,
      dithering,
      ditherType: 'triangular',
      antiAliasing: true,
      quality: 'high',
    });
  }

  /**
   * Normalize audio buffer
   */
  public async normalizeAudio(
    buffer: AudioBuffer,
    targetLevel: number = -1.0,
    mode: 'peak' | 'rms' | 'loudness' = 'peak'
  ): Promise<AudioBuffer> {
    return audioFileHandler.normalizeAudio(buffer, {
      mode,
      targetLevel,
      ceiling: -0.1,
      stereoLinking: true,
    });
  }

  /**
   * Export audio as WAV file
   */
  public async exportAsWAV(buffer: AudioBuffer, bitDepth: 16 | 24 | 32 = 24): Promise<Blob> {
    return audioFileHandler.exportAsWAV(buffer, bitDepth);
  }

  /**
   * Get professional metering data
   */
  public getProfessionalMeters() {
    return professionalMetering.getAllMeters();
  }

  /**
   * Configure professional metering
   */
  public configureMetering(config: {
    ballistics?: 'fast' | 'medium' | 'slow';
    referenceLevel?: number;
    peakHoldTime?: number;
  }): void {
    professionalMetering.setConfiguration(config);
  }

  /**
   * Reset peak hold on meters
   */
  public resetMeterPeakHold(): void {
    professionalMetering.resetPeakHold();
  }

  /**
   * Initialize multitrack recording system
   */
  public initializeMultitrackRecorder(sampleRate: number = 48000, bitDepth: number = 24): string {
    if (!this.ctx) {
      throw new Error('AudioContext not initialized');
    }

    if (!this.multitrackRecorder) {
      this.multitrackRecorder = new MultitrackRecorder(this.ctx);
    }

    return this.multitrackRecorder.createSession(sampleRate, bitDepth);
  }

  /**
   * Add a track to multitrack recording
   */
  public addRecordingTrack(trackId: string, inputSource?: string): void {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.multitrackRecorder.addTrack(trackId, inputSource);
  }

  /**
   * Arm a track for recording
   */
  public armRecordingTrack(trackId: string, inputSource?: string): void {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.multitrackRecorder.armTrack(trackId, inputSource);
  }

  /**
   * Disarm a track
   */
  public disarmRecordingTrack(trackId: string): void {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.multitrackRecorder.disarmTrack(trackId);
  }

  /**
   * Enable monitoring for a track
   */
  public enableTrackMonitoring(trackId: string, latency: number = 5): void {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.multitrackRecorder.enableMonitoring(trackId, latency);
  }

  /**
   * Disable monitoring for a track
   */
  public disableTrackMonitoring(trackId: string): void {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.multitrackRecorder.disableMonitoring(trackId);
  }

  /**
   * Set input gain for a track
   */
  public setTrackInputGain(trackId: string, gain: number): void {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.multitrackRecorder.setInputGain(trackId, gain);
  }

  /**
   * Set input pan for a track
   */
  public setTrackInputPan(trackId: string, pan: number): void {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.multitrackRecorder.setInputPan(trackId, pan);
  }

  /**
   * Start multitrack recording
   */
  public async startMultitrackRecording(projectStartTime: number = 0): Promise<void> {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.isRecording = true;
    transportBridge.setRecordState(true);
    await this.multitrackRecorder.startRecording(projectStartTime);
  }

  /**
   * Stop multitrack recording
   */
  public async stopMultitrackRecording(projectStopTime: number = 0): Promise<any[]> {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.isRecording = false;
    transportBridge.setRecordState(false);
    return await this.multitrackRecorder.stopRecording(projectStopTime);
  }

  /**
   * Punch in at a specific time
   */
  public async punchIn(trackId: string, punchInTime: number): Promise<void> {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    await this.multitrackRecorder.punchIn(trackId, punchInTime);
  }

  /**
   * Punch out at a specific time
   */
  public async punchOut(trackId: string, punchOutTime: number): Promise<any> {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    return await this.multitrackRecorder.punchOut(trackId, punchOutTime);
  }

  /**
   * Configure punch in/out settings
   */
  public configurePunchSettings(settings: any): void {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.multitrackRecorder.configurePunchSettings(settings);
  }

  /**
   * Get punch settings
   */
  public getPunchSettings(): any | null {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    return this.multitrackRecorder.getPunchSettings();
  }

  /**
   * Get all takes for a track
   */
  public getTakesForTrack(trackId: string): any[] {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    return this.multitrackRecorder.getTakesForTrack(trackId);
  }

  /**
   * Get all takes in the session
   */
  public getAllRecordingTakes(): any[] {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    return this.multitrackRecorder.getAllTakes();
  }

  /**
   * Select a take
   */
  public selectTake(takeId: string): void {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.multitrackRecorder.selectTake(takeId);
  }

  /**
   * Comp takes together
   */
  public compTakes(trackId: string, selectedTakeIds: string[]): any | null {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    return this.multitrackRecorder.compTakes(trackId, selectedTakeIds);
  }

  /**
   * Delete a take
   */
  public deleteTake(takeId: string): void {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.multitrackRecorder.deleteTake(takeId);
  }

  /**
   * Rename a take
   */
  public renameTake(takeId: string, notes: string): void {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.multitrackRecorder.renameTake(takeId, notes);
  }

  /**
   * Rate a take
   */
  public rateTake(takeId: string, rating: number): void {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.multitrackRecorder.rateTake(takeId, rating);
  }

  /**
   * Consolidate takes
   */
  public consolidateTakes(trackId: string): any | null {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    return this.multitrackRecorder.consolidateTakes(trackId);
  }

  /**
   * Get recording session info
   */
  public getRecordingSessionInfo(): any | null {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    return this.multitrackRecorder.getSessionInfo();
  }

  /**
   * Get track recording state
   */
  public getTrackRecordingState(trackId: string): any | null {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    return this.multitrackRecorder.getTrackState(trackId);
  }

  /**
   * Get all track states
   */
  public getAllTrackRecordingStates(): Map<string, any> {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    return this.multitrackRecorder.getAllTrackStates();
  }

  /**
   * Set direct monitoring mode for multitrack recorder
   */
  public setMultitrackDirectMonitoring(enabled: boolean): void {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    this.multitrackRecorder.setDirectMonitoring(enabled);
  }

  /**
   * Decode audio blob to AudioBuffer
   */
  public async decodeTakeAudio(takeId: string): Promise<AudioBuffer | null> {
    if (!this.multitrackRecorder) {
      throw new Error('Multitrack recorder not initialized');
    }

    return await this.multitrackRecorder.decodeAudioBlob(takeId);
  }

  /**
   * Get recording statistics
   */
  public getRecordingStatistics(): {
    totalTracks: number;
    armedTracks: number;
    recordingTracks: number;
    totalTakes: number;
    sessionDuration: number;
  } {
    if (!this.multitrackRecorder) {
      return {
        totalTracks: 0,
        armedTracks: 0,
        recordingTracks: 0,
        totalTakes: 0,
        sessionDuration: 0,
      };
    }

    return this.multitrackRecorder.getStatistics();
  }

  /**
   * Clean up multitrack recording session
   */
  public cleanupMultitrackSession(): void {
    if (this.multitrackRecorder) {
      this.multitrackRecorder.cleanup();
    }
  }

  /**
   * Initialize beat detective
   */
  public initializeBeatDetective(sampleRate: number = 48000): void {
    if (!this.ctx) {
      throw new Error('AudioContext not initialized');
    }

    this.beatDetective = new BeatDetective(sampleRate, this.ctx);
  }

  /**
   * Detect transients in audio buffer
   */
  public detectTransients(
    audioBuffer: AudioBuffer,
    sensitivity: number = 0.5,
    minTransientInterval: number = 0.05
  ): any[] {
    if (!this.beatDetective) {
      throw new Error('Beat detective not initialized');
    }

    return this.beatDetective.detectTransients(audioBuffer, sensitivity, minTransientInterval);
  }

  /**
   * Analyze beat pattern from transients
   */
  public analyzeBeatPattern(
    transients: any[],
    expectedTempoRange: [number, number] = [60, 180]
  ): any {
    if (!this.beatDetective) {
      throw new Error('Beat detective not initialized');
    }

    return this.beatDetective.analyzeBeatPattern(transients, expectedTempoRange);
  }

  /**
   * Create tempo map from beat pattern
   */
  public createTempoMap(beatPattern: any): any {
    if (!this.beatDetective) {
      throw new Error('Beat detective not initialized');
    }

    return this.beatDetective.createTempoMap(beatPattern);
  }

  /**
   * Create warp markers from beat pattern
   */
  public createWarpMarkers(beatPattern: any, targetTempo: number): any[] {
    if (!this.beatDetective) {
      throw new Error('Beat detective not initialized');
    }

    return this.beatDetective.createWarpMarkers(beatPattern, targetTempo);
  }

  /**
   * Warp audio buffer to match tempo
   */
  public warpAudio(
    audioBuffer: AudioBuffer,
    warpMarkers: any[],
    algorithm: 'time-domain' | 'phase-vocoder' = 'phase-vocoder'
  ): AudioBuffer | null {
    if (!this.beatDetective || !this.ctx) {
      throw new Error('Beat detective or AudioContext not initialized');
    }

    return this.beatDetective.warpAudio(audioBuffer, warpMarkers, this.ctx, algorithm);
  }

  /**
   * Extract groove from audio
   */
  public extractGroove(audioBuffer: AudioBuffer, beatPattern: any): number[] {
    if (!this.beatDetective) {
      throw new Error('Beat detective not initialized');
    }

    return this.beatDetective.extractGroove(audioBuffer, beatPattern);
  }

  /**
   * Apply groove to audio
   */
  public applyGroove(
    audioBuffer: AudioBuffer,
    groove: number[],
    beatPattern: any,
    strength: number = 1.0
  ): AudioBuffer | null {
    if (!this.beatDetective || !this.ctx) {
      throw new Error('Beat detective or AudioContext not initialized');
    }

    return this.beatDetective.applyGroove(audioBuffer, groove, beatPattern, this.ctx, strength);
  }

  /**
   * Analyze tempo changes
   */
  public analyzeTempoChanges(audioBuffer: AudioBuffer, windowSize: number = 4): any {
    if (!this.beatDetective) {
      throw new Error('Beat detective not initialized');
    }

    return this.beatDetective.analyzeTempoChanges(audioBuffer, windowSize);
  }

  /**
   * Smooth tempo map
   */
  public smoothTempoMap(tempoMap: any, smoothingFactor: number = 0.5): any {
    if (!this.beatDetective) {
      throw new Error('Beat detective not initialized');
    }

    return this.beatDetective.smoothTempoMap(tempoMap, smoothingFactor);
  }

  public async stopRecording(): Promise<RecordedTake | null> {
    this.isRecording = false;
    if (this.monitorProcessor) {
      this.monitorProcessor.disconnect();
      this.monitorProcessor = null;
    }
    if (this.monitorGain) {
      this.monitorGain.disconnect();
      this.monitorGain = null;
    }

    transportBridge.setRecordState(false);

    if (!this.mediaRecorder) return null;

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const durationMs = Date.now() - this.recordingStartTime;
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const blobUrl = URL.createObjectURL(blob);

        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((t) => t.stop());
          this.mediaStream = null;
        }

        const take: RecordedTake = {
          id: `take-${Date.now()}`,
          stemId: 'stem-1',
          takeNumber: Math.floor(Math.random() * 10) + 1,
          durationMs,
          blobUrl,
          createdAt: new Date().toISOString(),
          label: `Lead Vocal Take ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
          isActive: true,
        };

        transportBridge.notifyTakeAdded(take);
        resolve(take);
      };

      this.mediaRecorder!.stop();
    });
  }

  // Dynamic Sidechain-Style Vocal Ducking Processor
  public setSidechainDucking(
    enabled: boolean,
    duckAmountDb: number = -6.0,
    thresholdDb: number = -26.0,
    releaseMs: number = 220
  ) {
    this.sidechainEnabled = enabled;
    this.duckAmountDb = duckAmountDb;
    this.duckThresholdDb = thresholdDb;
    this.duckReleaseMs = releaseMs;

    if (!enabled && this.sidechainDuckingGain && this.ctx) {
      this.sidechainDuckingGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.05);
      this.currentSidechainGainReductionDb = 0.0;
    }
  }

  public updateSidechainDucking(inputLevelNorm: number) {
    if (!this.sidechainEnabled || !this.sidechainDuckingGain || !this.ctx) {
      this.currentSidechainGainReductionDb = 0;
      return;
    }

    // Convert normalized 0.0 - 1.0 to approximate dBFS (-60 to 0)
    const levelDb = inputLevelNorm > 0.001 ? 20 * Math.log10(inputLevelNorm) : -60;

    if (levelDb > this.duckThresholdDb) {
      // Vocal active: calculate dynamic attenuation
      const overshoot = Math.min(18, levelDb - this.duckThresholdDb);
      const ratio = overshoot / 18; // 0 to 1
      const attenuationDb = this.duckAmountDb * ratio; // e.g. -6dB * 0.8 = -4.8dB
      this.currentSidechainGainReductionDb = attenuationDb;

      const linearGain = Math.pow(10, attenuationDb / 20);
      this.sidechainDuckingGain.gain.setTargetAtTime(
        Math.max(0.15, linearGain),
        this.ctx.currentTime,
        0.02
      ); // 20ms attack
    } else {
      // Return to full unity gain with smooth release curve
      const releaseSec = Math.max(0.08, this.duckReleaseMs / 1000);
      this.sidechainDuckingGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, releaseSec);
      this.currentSidechainGainReductionDb = this.currentSidechainGainReductionDb * 0.85;
      if (Math.abs(this.currentSidechainGainReductionDb) < 0.1) {
        this.currentSidechainGainReductionDb = 0;
      }
    }
  }

  public getSidechainGainReduction(): number {
    return this.currentSidechainGainReductionDb;
  }

  // Graphical Automation Parameter Dispatcher
  public applyAutomation(param: string, value: number, time?: number) {
    if (!this.ctx) return;
    const now = time !== undefined ? time : this.ctx.currentTime;

    switch (param) {
      case 'volume':
        if (this.masterGain) {
          this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1.0, value)), now, 0.02);
        }
        break;
      case 'pan':
        // Master pan or stem pan
        break;
      case 'filter_cutoff':
        if (this.midFilter) {
          this.midFilter.frequency.setTargetAtTime(
            Math.max(200, Math.min(18000, value)),
            now,
            0.02
          );
        }
        break;
      case 'eq_low':
        if (this.lowFilter) {
          this.lowFilter.gain.setTargetAtTime(Math.max(-12, Math.min(12, value)), now, 0.02);
        }
        break;
      case 'eq_high':
        if (this.highFilter) {
          this.highFilter.gain.setTargetAtTime(Math.max(-12, Math.min(12, value)), now, 0.02);
        }
        break;
      case 'reverb':
        // Reverb wet mix
        break;
      case 'saturation':
        if (this.saturationNode) {
          this.saturationNode.curve = this.makeDistortionCurve(value) as any;
        }
        break;
      case 'eight_oh_eight_drive':
        sonik808Engine.setDrive(value);
        break;
      case 'bpm':
        this.setBpm(value);
        break;
      default:
        break;
    }
  }

  // Diagnostic Session Performance & DSP Engine Health
  public getEngineDiagnostics() {
    const memory = (window.performance as unknown as { memory?: { usedJSHeapSize: number } })
      ?.memory;
    const heapMb = memory ? memory.usedJSHeapSize / (1024 * 1024) : 0;
    const ringStats = this.ringBuffer.getStats();

    return {
      cpuLoadPercent: parseFloat(AudioTelemetry.eventLoopLag.toFixed(1)), // Repurposed for lag
      memoryHeapMb: parseFloat(heapMb.toFixed(1)),
      contextState: this.audioContextState,
      nativeContextState: this.ctx ? this.ctx.state : 'uninitialized',
      sampleRate: this.ctx ? this.ctx.sampleRate : 48000,
      baseLatencyMs: this.ctx ? parseFloat(((this.ctx.baseLatency || 0) * 1000).toFixed(2)) : 0,
      recordingBufferStats: ringStats,
      bufferHealthPercent: Math.max(0, Math.min(100, Math.round(100 - ringStats.underruns * 2))),
      activeVoices: AudioTelemetry.activeVoices,
      allocationsPerSec: AudioTelemetry.getAllocationsPerSec(),
      scheduledLateness: parseFloat(AudioTelemetry.scheduledLateness.toFixed(2)),
      maxLateness: parseFloat(AudioTelemetry.maxLateness.toFixed(2)),
      sidechainGainReductionDb: parseFloat(this.currentSidechainGainReductionDb.toFixed(1)),
      isRecording: this.isRecording,
      isPlaying: this.isPlaying,
      canStartAudio: this.canStartAudioContext(),
    };
  }

  // ==================== PROFESSIONAL MIXING & MASTERING API ====================

  /**
   * Get professional mixer instance
   */
  public getProfessionalMixer(): ProfessionalMixer | null {
    return this.professionalMixer;
  }

  /**
   * Get effects suite instance
   */
  public getEffectsSuite(): EffectsSuite | null {
    return this.effectsSuite;
  }

  /**
   * Get mastering chain instance
   */
  public getMasteringChain(): MasteringChain | null {
    return this.masteringChain;
  }

  /**
   * Get LUFS meter instance
   */
  public getLUFSMeter(): LUFSMeter | null {
    return this.lufsMeter;
  }

  /**
   * Get spectrum analyzer instance
   */
  public getSpectrumAnalyzer(): SpectrumAnalyzer | null {
    return this.spectrumAnalyzer;
  }

  /**
   * Apply mastering chain to audio
   */
  public async applyMastering(input: AudioNode, output: AudioNode): Promise<void> {
    if (!this.masteringChain) throw new Error('Mastering chain not initialized');
    this.masteringChain.buildChain(input, output);
  }

  /**
   * Measure LUFS of audio buffer
   */
  public async measureLUFS(audioBuffer: AudioBuffer): Promise<any> {
    if (!this.lufsMeter) throw new Error('LUFS meter not initialized');
    return await this.lufsMeter.measureLoudness(audioBuffer);
  }

  /**
   * Get spectrum data for visualization
   */
  public getSpectrumData(): any {
    if (!this.spectrumAnalyzer) throw new Error('Spectrum analyzer not initialized');
    return this.spectrumAnalyzer.getSpectrumData();
  }

  /**
   * Connect spectrum analyzer to audio node
   */
  public connectSpectrumAnalyzer(source: AudioNode): void {
    if (!this.spectrumAnalyzer) throw new Error('Spectrum analyzer not initialized');
    this.spectrumAnalyzer.connect(source);
  }

  /**
   * Set platform loudness preset
   */
  public setPlatformLoudnessPreset(
    platform: 'spotify' | 'apple-music' | 'youtube' | 'soundcloud'
  ): void {
    if (!this.lufsMeter) throw new Error('LUFS meter not initialized');
    this.lufsMeter.applyPlatformPreset(platform);
    if (this.masteringChain) {
      this.masteringChain.setPlatformPreset(platform);
    }
  }

  /**
   * Create channel strip for track
   */
  public createChannelStrip(trackId: string, name: string): any {
    if (!this.professionalMixer) throw new Error('Professional mixer not initialized');
    return this.professionalMixer.createChannel(trackId, name);
  }

  /**
   * Get channel strip by ID
   */
  public getChannelStrip(channelId: string): any {
    if (!this.professionalMixer) throw new Error('Professional mixer not initialized');
    return this.professionalMixer.getChannel(channelId);
  }

  /**
   * Set channel fader
   */
  public setChannelFader(channelId: string, fader: number): void {
    if (!this.professionalMixer) throw new Error('Professional mixer not initialized');
    this.professionalMixer.setChannelFader(channelId, fader);
  }

  /**
   * Set channel pan
   */
  public setChannelPan(channelId: string, pan: number): void {
    if (!this.professionalMixer) throw new Error('Professional mixer not initialized');
    this.professionalMixer.setChannelPan(channelId, pan);
  }

  /**
   * Toggle channel mute
   */
  public toggleChannelMute(channelId: string): boolean {
    if (!this.professionalMixer) throw new Error('Professional mixer not initialized');
    return this.professionalMixer.toggleChannelMute(channelId);
  }

  /**
   * Toggle channel solo
   */
  public toggleChannelSolo(channelId: string): boolean {
    if (!this.professionalMixer) throw new Error('Professional mixer not initialized');
    return this.professionalMixer.toggleChannelSolo(channelId);
  }

  /**
   * Create mix bus
   */
  public createMixBus(id: string, name: string, type: 'aux' | 'submix' = 'aux'): any {
    if (!this.professionalMixer) throw new Error('Professional mixer not initialized');
    return this.professionalMixer.createBus(id, name, type);
  }

  /**
   * Add send to channel
   */
  public addSendToChannel(
    channelId: string,
    targetBusId: string,
    prePost: 'pre' | 'post' = 'post'
  ): any {
    if (!this.professionalMixer) throw new Error('Professional mixer not initialized');
    return this.professionalMixer.addSend(channelId, targetBusId, prePost);
  }

  /**
   * Create VCA group
   */
  public createVCAGroup(id: string, name: string): any {
    if (!this.professionalMixer) throw new Error('Professional mixer not initialized');
    return this.professionalMixer.createVCAGroup(id, name);
  }

  /**
   * Add channel to VCA group
   */
  public addChannelToVCA(channelId: string, vcaGroupId: string): void {
    if (!this.professionalMixer) throw new Error('Professional mixer not initialized');
    this.professionalMixer.addChannelToVCA(channelId, vcaGroupId);
  }

  /**
   * Set VCA fader
   */
  public setVCAFader(vcaGroupId: string, fader: number): void {
    if (!this.professionalMixer) throw new Error('Professional mixer not initialized');
    this.professionalMixer.setVCAFader(vcaGroupId, fader);
  }

  // ============ VOCAL TRACK SUPPORT ============

  private vocalTracks: Map<string, VocalTrack> = new Map();
  private vocalMonitoringEnabled: boolean = false;

  /**
   * Add synthesized vocal to project
   */
  public async addSynthesizedVocal(audioBuffer: AudioBuffer, trackId: string): Promise<void> {
    if (!this.ctx) {
      throw new Error('Audio context not initialized');
    }

    const vocalTrack: VocalTrack = {
      id: trackId,
      audioBuffer,
      source: null,
      gain: this.ctx.createGain(),
      panner: this.ctx.createStereoPanner(),
      startTime: 0,
      duration: audioBuffer.duration,
    };

    // Create buffer source
    vocalTrack.source = this.ctx.createBufferSource();
    vocalTrack.source.buffer = audioBuffer;
    vocalTrack.source.connect(vocalTrack.gain);
    vocalTrack.gain.connect(vocalTrack.panner);

    // Connect to master
    vocalTrack.panner.connect(this.masterGain!);

    this.vocalTracks.set(trackId, vocalTrack);
    console.log(`[SonicAudioEngine] Added vocal track: ${trackId}`);
  }

  /**
   * Play vocal track
   */
  public playVocalTrack(trackId: string, startTime: number = 0): void {
    const vocalTrack = this.vocalTracks.get(trackId);
    if (!vocalTrack || !vocalTrack.source) {
      throw new Error(`Vocal track not found: ${trackId}`);
    }

    if (vocalTrack.source.context.state === 'suspended') {
      (vocalTrack.source.context as AudioContext).resume();
    }

    vocalTrack.source.start(this.ctx!.currentTime + startTime);
    vocalTrack.startTime = this.ctx!.currentTime;
    console.log(`[SonicAudioEngine] Playing vocal track: ${trackId}`);
  }

  /**
   * Stop vocal track
   */
  public stopVocalTrack(trackId: string): void {
    const vocalTrack = this.vocalTracks.get(trackId);
    if (!vocalTrack || !vocalTrack.source) {
      throw new Error(`Vocal track not found: ${trackId}`);
    }

    try {
      vocalTrack.source.stop();
      console.log(`[SonicAudioEngine] Stopped vocal track: ${trackId}`);
    } catch (e) {
      // Already stopped
    }
  }

  /**
   * Remove vocal track
   */
  public removeVocalTrack(trackId: string): void {
    const vocalTrack = this.vocalTracks.get(trackId);
    if (!vocalTrack) {
      throw new Error(`Vocal track not found: ${trackId}`);
    }

    if (vocalTrack.source) {
      try {
        vocalTrack.source.stop();
      } catch (e) {
        // Already stopped
      }
    }

    vocalTrack.gain.disconnect();
    vocalTrack.panner.disconnect();
    this.vocalTracks.delete(trackId);
    console.log(`[SonicAudioEngine] Removed vocal track: ${trackId}`);
  }

  /**
   * Set vocal track volume
   */
  public setVocalTrackVolume(trackId: string, volume: number): void {
    const vocalTrack = this.vocalTracks.get(trackId);
    if (!vocalTrack) {
      throw new Error(`Vocal track not found: ${trackId}`);
    }

    vocalTrack.gain.gain.value = volume;
  }

  /**
   * Set vocal track pan
   */
  public setVocalTrackPan(trackId: string, pan: number): void {
    const vocalTrack = this.vocalTracks.get(trackId);
    if (!vocalTrack) {
      throw new Error(`Vocal track not found: ${trackId}`);
    }

    vocalTrack.panner.pan.value = pan;
  }

  /**
   * Get all vocal tracks
   */
  public getVocalTracks(): Map<string, VocalTrack> {
    return this.vocalTracks;
  }

  /**
   * Enable or disable vocal monitoring
   */
  public enableVocalMonitoring(enabled: boolean): void {
    this.vocalMonitoringEnabled = enabled;
    console.log(`[SonicAudioEngine] Vocal monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if vocal monitoring is enabled
   */
  public isVocalMonitoringEnabled(): boolean {
    return this.vocalMonitoringEnabled;
  }

  // ==================== AUDIO CONTEXT STATE MANAGEMENT ====================

  /**
   * Setup audio context state management with autoplay policy handling
   */
  private setupAudioContextStateManagement(): void {
    if (!this.ctx) return;

    // Track state changes
    this.ctx.onstatechange = () => {
      // @ts-ignore — AudioContextState includes 'interrupted' in newer lib
      this.audioContextState = this.ctx?.state || 'uninitialized';
      this.notifyStateChange(this.audioContextState);
    };

    // Initial state
    // @ts-ignore — AudioContextState includes 'interrupted' in newer lib
    this.audioContextState = this.ctx.state || 'uninitialized';

    // Setup user interaction handlers for autoplay policy
    const resumeHandler = async () => {
      await this.ensureAudioContextRunning();
    };

    this.userInteractionHandlers.push(resumeHandler);

    // Register handlers for common user interactions
    document.addEventListener('click', resumeHandler, { once: true, passive: true });
    document.addEventListener('keydown', resumeHandler, { once: true, passive: true });
    document.addEventListener('touchstart', resumeHandler, { once: true, passive: true });
    document.addEventListener('mousedown', resumeHandler, { once: true, passive: true });
  }

  /**
   * Ensure audio context is running, handling autoplay policies
   */
  public async ensureAudioContextRunning(): Promise<boolean> {
    if (!this.ctx) {
      await this.init();
      return (this.ctx as AudioContext | null)?.state === 'running';
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
        this.audioContextState = 'running';
        return true;
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
        return false;
      }
    }

    if (this.ctx.state === 'closed') {
      console.warn('Audio context is closed, reinitializing...');
      this.ctx = null;
      this.audioContextState = 'uninitialized';
      await this.init();
      return (this.ctx as AudioContext | null)?.state === 'running';
    }

    return this.ctx.state === 'running';
  }

  /**
   * Get current audio context state
   */
  public getAudioContextState(): string {
    return this.audioContextState;
  }

  /**
   * Register callback for state changes
   */
  public onStateChange(callback: (state: string) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Remove state change callback
   */
  public offStateChange(callback: (state: string) => void): void {
    this.stateChangeCallbacks = this.stateChangeCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * Notify all registered callbacks of state change
   */
  private notifyStateChange(state: string): void {
    this.stateChangeCallbacks.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  /**
   * Suspend audio context (for power saving or user pause)
   */
  public async suspendAudioContext(): Promise<boolean> {
    if (!this.ctx || this.ctx.state === 'closed') return false;

    try {
      await this.ctx.suspend();
      this.audioContextState = 'suspended';
      return true;
    } catch (error) {
      console.warn('Failed to suspend audio context:', error);
      return false;
    }
  }

  /**
   * Close audio context (cleanup)
   */
  public async closeAudioContext(): Promise<boolean> {
    if (!this.ctx || this.ctx.state === 'closed') return false;

    try {
      // Stop playback if running
      if (this.isPlaying) {
        this.stopPlayback();
      }

      // Clean up user interaction handlers
      this.userInteractionHandlers = [];

      await this.ctx.close();
      this.audioContextState = 'closed';
      this.ctx = null;
      return true;
    } catch (error) {
      console.warn('Failed to close audio context:', error);
      return false;
    }
  }

  /**
   * Check if audio context can be started (autoplay policy check)
   */
  public canStartAudioContext(): boolean {
    // In most browsers, audio context can be started after user interaction
    // This is a heuristic check - actual behavior depends on browser implementation
    return this.audioContextState !== 'closed';
  }
}

export const soundEngine = new SonicAudioEngine();

/**
 * Vocal track interface
 */
export interface VocalTrack {
  id: string;
  audioBuffer: AudioBuffer;
  source: AudioBufferSourceNode | null;
  gain: GainNode;
  panner: StereoPannerNode;
  startTime: number;
  duration: number;
}
