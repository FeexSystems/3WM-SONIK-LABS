// 3WM SONIK - Professional Effects Suite
// Industry-standard audio effects: Reverb, Delay, Compression, EQ, Modulation, Distortion

export interface EffectSettings {
  enabled: boolean;
  bypass: boolean;
  wetDry: number; // 0-1
}

export interface ReverbSettings extends EffectSettings {
  type: 'room' | 'hall' | 'plate' | 'spring' | 'convolution';
  decayTime: number; // 0.1-10 seconds
  preDelay: number; // 0-100 ms
  diffusion: number; // 0-1
  density: number; // 0-1
  highFrequencyDamping: number; // 0-1
  roomSize: number; // 0-1
  mix: number; // 0-1
}

export interface DelaySettings extends EffectSettings {
  type: 'tape' | 'digital' | 'ping-pong' | 'slapback';
  time: number; // 1-2000 ms
  feedback: number; // 0-0.95
  mix: number; // 0-1
  lowPassFilter: number; // Hz
  highPassFilter: number; // Hz
  modulation: {
    enabled: boolean;
    rate: number; // Hz
    depth: number; // ms
  };
}

export interface CompressionSettings extends EffectSettings {
  type: 'compressor' | 'limiter' | 'bus-compressor';
  threshold: number; // dB
  ratio: number; // 1:1 to 20:1
  attack: number; // ms
  release: number; // ms
  knee: number; // dB (soft knee)
  makeupGain: number; // dB
  autoRelease: boolean;
  lookahead: number; // ms
}

export interface EQSettings extends EffectSettings {
  type: 'parametric' | 'graphic' | 'dynamic';
  bands: EQBand[];
}

export interface EQBand {
  frequency: number; // Hz
  gain: number; // dB
  q: number; // Quality factor
  type: 'lowshelf' | 'highshelf' | 'peaking' | 'lowpass' | 'highpass' | 'bandpass';
  enabled: boolean;
}

export interface ChorusSettings extends EffectSettings {
  rate: number; // 0.1-10 Hz
  depth: number; // 0-100%
  feedback: number; // 0-0.9
  mix: number; // 0-1
  voices: number; // 1-4
}

export interface FlangerSettings extends EffectSettings {
  rate: number; // 0.1-10 Hz
  depth: number; // 0-100%
  feedback: number; // 0-0.9
  mix: number; // 0-1
  manual: number; // 0-100%
}

export interface PhaserSettings extends EffectSettings {
  rate: number; // 0.1-10 Hz
  depth: number; // 0-100%
  feedback: number; // 0-0.9
  mix: number; // 0-1
  stages: number; // 2-12
}

export interface DistortionSettings extends EffectSettings {
  type: 'soft-clip' | 'hard-clip' | 'fuzz' | 'overdrive' | 'tube';
  drive: number; // 0-100
  tone: number; // 0-100
  output: number; // 0-100
  mix: number; // 0-1
}

export interface LimiterSettings extends EffectSettings {
  threshold: number; // dB
  ceiling: number; // dB
  release: number; // ms
  lookahead: number; // ms
}

export class EffectsSuite {
  private audioContext: AudioContext | null = null;
  private effects: Map<string, AudioNode> = new Map();

  constructor() {}

  /**
   * Initialize effects suite with audio context
   */
  public async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
  }

  /**
   * Create reverb effect
   */
  public createReverb(settings: ReverbSettings): ConvolverNode | AudioNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    if (settings.type === 'convolution') {
      // Use convolution reverb with impulse response
      const convolver = this.audioContext.createConvolver();
      const impulseResponse = this.generateImpulseResponse(settings.decayTime, settings.diffusion);
      convolver.buffer = impulseResponse;
      return convolver;
    } else {
      // Use algorithmic reverb (simplified - would need more complex implementation)
      return this.createAlgorithmicReverb(settings);
    }
  }

  /**
   * Generate impulse response for convolution reverb
   */
  private generateImpulseResponse(duration: number, diffusion: number): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.exp((-3 * i) / length);
        const noise = (Math.random() * 2 - 1) * decay * diffusion;
        channelData[i] = noise;
      }
    }

    return impulse;
  }

  /**
   * Create algorithmic reverb (simplified)
   */
  private createAlgorithmicReverb(settings: ReverbSettings): AudioNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    // Create a simple delay-based reverb
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();
    const delay = this.audioContext.createDelay(2);
    const feedback = this.audioContext.createGain();

    delay.delayTime.value = settings.decayTime * 0.5;
    feedback.gain.value = 0.3;
    wetGain.gain.value = settings.mix;
    dryGain.gain.value = 1 - settings.mix;

    // Connect nodes
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wetGain);

    return wetGain;
  }

  /**
   * Create delay effect
   */
  public createDelay(settings: DelaySettings): AudioNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const delay = this.audioContext.createDelay(2);
    const feedback = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();
    const lowPass = this.audioContext.createBiquadFilter();
    const highPass = this.audioContext.createBiquadFilter();

    delay.delayTime.value = settings.time / 1000;
    feedback.gain.value = settings.feedback;
    wetGain.gain.value = settings.mix;
    dryGain.gain.value = 1 - settings.mix;
    lowPass.frequency.value = settings.lowPassFilter;
    lowPass.type = 'lowpass';
    highPass.frequency.value = settings.highPassFilter;
    highPass.type = 'highpass';

    // Connect nodes
    delay.connect(feedback);
    feedback.connect(lowPass);
    lowPass.connect(highPass);
    highPass.connect(delay);
    delay.connect(wetGain);

    return wetGain;
  }

  /**
   * Create compressor effect
   */
  public createCompressor(settings: CompressionSettings): DynamicsCompressorNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const compressor = this.audioContext.createDynamicsCompressor();

    compressor.threshold.value = settings.threshold;
    compressor.knee.value = settings.knee;
    compressor.ratio.value = settings.ratio;
    compressor.attack.value = settings.attack / 1000;
    compressor.release.value = settings.autoRelease ? 0.25 : settings.release / 1000;

    return compressor;
  }

  /**
   * Create parametric EQ
   */
  public createParametricEQ(settings: EQSettings): AudioNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    // Create a chain of biquad filters for each band
    const input = this.audioContext.createGain();
    const output = this.audioContext.createGain();
    const filters: BiquadFilterNode[] = [];

    let previousNode = input;

    for (const band of settings.bands) {
      if (!band.enabled) continue;

      const filter = this.audioContext.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.frequency;
      filter.gain.value = band.gain;
      filter.Q.value = band.q;

      filters.push(filter);
      previousNode.connect(filter);
      previousNode = filter;
    }

    previousNode.connect(output);

    return input;
  }

  /**
   * Create chorus effect
   */
  public createChorus(settings: ChorusSettings): AudioNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const delay = this.audioContext.createDelay(0.1);
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();

    lfo.frequency.value = settings.rate;
    lfoGain.gain.value = settings.depth * 0.002; // Convert to seconds
    delay.delayTime.value = 0.025; // 25ms base delay
    wetGain.gain.value = settings.mix;
    dryGain.gain.value = 1 - settings.mix;

    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    lfo.start();

    return wetGain;
  }

  /**
   * Create flanger effect
   */
  public createFlanger(settings: FlangerSettings): AudioNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const delay = this.audioContext.createDelay(0.01);
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    const feedback = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();

    lfo.frequency.value = settings.rate;
    lfoGain.gain.value = settings.depth * 0.005; // Convert to seconds
    delay.delayTime.value = settings.manual * 0.0001;
    feedback.gain.value = settings.feedback;
    wetGain.gain.value = settings.mix;
    dryGain.gain.value = 1 - settings.mix;

    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    lfo.start();

    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wetGain);

    return wetGain;
  }

  /**
   * Create phaser effect
   */
  public createPhaser(settings: PhaserSettings): AudioNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();

    lfo.frequency.value = settings.rate;
    lfoGain.gain.value = settings.depth * 1000;
    wetGain.gain.value = settings.mix;
    dryGain.gain.value = 1 - settings.mix;

    // Create all-pass filters for phasing
    const filters: BiquadFilterNode[] = [];
    let previousNode = wetGain;

    for (let i = 0; i < settings.stages; i++) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'allpass';
      filter.frequency.value = 1000;
      filter.Q.value = 10;

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      filters.push(filter);
      previousNode.connect(filter);
      previousNode = filter;
    }

    lfo.start();

    return wetGain;
  }

  /**
   * Create distortion effect
   */
  public createDistortion(settings: DistortionSettings): WaveShaperNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const distortion = this.audioContext.createWaveShaper();
    const curve = this.makeDistortionCurve(settings.drive);
    distortion.curve = curve as any;
    distortion.oversample = '4x';

    return distortion;
  }

  /**
   * Generate distortion curve
   */
  private makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  /**
   * Create limiter effect
   */
  public createLimiter(settings: LimiterSettings): DynamicsCompressorNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const limiter = this.audioContext.createDynamicsCompressor();

    limiter.threshold.value = settings.threshold;
    limiter.knee.value = 0; // Hard knee for limiter
    limiter.ratio.value = 20; // High ratio for limiting
    limiter.attack.value = 0.001; // Fast attack
    limiter.release.value = settings.release / 1000;

    return limiter;
  }

  /**
   * Create sidechain compressor
   */
  public createSidechainCompressor(
    settings: CompressionSettings,
    sidechainSource: AudioNode
  ): DynamicsCompressorNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const compressor = this.audioContext.createDynamicsCompressor();

    compressor.threshold.value = settings.threshold;
    compressor.knee.value = settings.knee;
    compressor.ratio.value = settings.ratio;
    compressor.attack.value = settings.attack / 1000;
    compressor.release.value = settings.release / 1000;

    // Connect sidechain source to compressor
    sidechainSource.connect(compressor);

    return compressor;
  }

  /**
   * Create multi-band compressor
   */
  public createMultiBandCompressor(
    lowSettings: CompressionSettings,
    midSettings: CompressionSettings,
    highSettings: CompressionSettings,
    crossoverLow: number = 250,
    crossoverHigh: number = 4000
  ): AudioNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    // Create crossover filters
    const lowSplit = this.audioContext.createBiquadFilter();
    const midSplitLow = this.audioContext.createBiquadFilter();
    const midSplitHigh = this.audioContext.createBiquadFilter();
    const highSplit = this.audioContext.createBiquadFilter();

    lowSplit.type = 'lowpass';
    lowSplit.frequency.value = crossoverLow;

    midSplitLow.type = 'highpass';
    midSplitLow.frequency.value = crossoverLow;

    midSplitHigh.type = 'lowpass';
    midSplitHigh.frequency.value = crossoverHigh;

    highSplit.type = 'highpass';
    highSplit.frequency.value = crossoverHigh;

    // Create compressors for each band
    const lowComp = this.createCompressor(lowSettings);
    const midComp = this.createCompressor(midSettings);
    const highComp = this.createCompressor(highSettings);

    // Create output mixer
    const output = this.audioContext.createGain();

    // Connect routing
    lowSplit.connect(lowComp);
    lowComp.connect(output);

    midSplitLow.connect(midComp);
    midComp.connect(output);

    highSplit.connect(highComp);
    highComp.connect(output);

    return lowSplit; // Return input node
  }

  /**
   * Create stereo imager
   */
  public createStereoImager(width: number = 1): AudioNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    // Create mid-side processing
    const midGain = this.audioContext.createGain();
    const sideGain = this.audioContext.createGain();

    midGain.gain.value = 1 - (width - 1) * 0.5;
    sideGain.gain.value = width;

    return midGain;
  }

  /**
   * Create saturation effect
   */
  public createSaturation(amount: number = 50): WaveShaperNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const saturation = this.audioContext.createWaveShaper();
    const curve = this.makeSaturationCurve(amount);
    saturation.curve = curve as any;
    saturation.oversample = '4x';

    return saturation;
  }

  /**
   * Generate saturation curve
   */
  private makeSaturationCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(x * (amount / 10));
    }

    return curve;
  }

  /**
   * Clean up effects
   */
  public cleanup(): void {
    for (const [id, node] of this.effects) {
      node.disconnect();
      this.effects.delete(id);
    }
  }
}
