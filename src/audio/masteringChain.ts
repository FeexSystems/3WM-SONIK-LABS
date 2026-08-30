// 3WM SONIK - Professional Mastering Chain
// Industry-standard mastering chain with EQ, multi-band compression, stereo enhancement, limiting

export interface MasteringChainSettings {
  eq: MasteringEQSettings;
  multiBandCompressor: MultiBandCompressorSettings;
  stereoEnhancer: StereoEnhancerSettings;
  harmonicExciter: HarmonicExciterSettings;
  limiter: LimiterSettings;
  dither: DitherSettings;
  targetLoudness: TargetLoudnessSettings;
}

export interface MasteringEQSettings {
  enabled: boolean;
  bands: MasteringEQBand[];
}

export interface MasteringEQBand {
  frequency: number; // Hz
  gain: number; // dB
  q: number;
  type: 'lowshelf' | 'highshelf' | 'peaking';
  enabled: boolean;
}

export interface MultiBandCompressorSettings {
  enabled: boolean;
  crossoverLow: number; // Hz
  crossoverHigh: number; // Hz
  lowBand: BandCompressorSettings;
  midBand: BandCompressorSettings;
  highBand: BandCompressorSettings;
}

export interface BandCompressorSettings {
  enabled: boolean;
  threshold: number; // dB
  ratio: number;
  attack: number; // ms
  release: number; // ms
  makeupGain: number; // dB
}

export interface StereoEnhancerSettings {
  enabled: boolean;
  width: number; // 0-2 (1 = normal, >1 = wider, <1 = narrower)
  midGain: number; // dB
  sideGain: number; // dB
}

export interface HarmonicExciterSettings {
  enabled: boolean;
  amount: number; // 0-100
  frequency: number; // Hz
  mix: number; // 0-1
}

export interface LimiterSettings {
  enabled: boolean;
  threshold: number; // dB
  ceiling: number; // dB
  release: number; // ms
  lookahead: number; // ms
}

export interface DitherSettings {
  enabled: boolean;
  type: 'none' | 'triangular' | 'rectangular' | 'shaped';
  bitDepth: 16 | 24 | 32;
}

export interface TargetLoudnessSettings {
  targetLUFS: number; // e.g., -14 for Spotify, -16 for Apple Music
  truePeak: number; // dBTP (e.g., -1.0)
  integratedLoudness: number; // LUFS
  shortTermLoudness: number; // LUFS
  momentaryLoudness: number; // LUFS
}

export interface MasteringStats {
  inputLUFS: number;
  outputLUFS: number;
  peakLevel: number; // dBTP
  dynamicRange: number; // LU
  crestFactor: number; // dB
}

export class MasteringChain {
  private audioContext: AudioContext | null = null;
  private chain: AudioNode[] = [];
  private settings: MasteringChainSettings;

  constructor() {
    this.settings = this.createDefaultSettings();
  }

  /**
   * Initialize mastering chain with audio context
   */
  public async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
  }

  /**
   * Create default mastering settings
   */
  private createDefaultSettings(): MasteringChainSettings {
    return {
      eq: {
        enabled: false,
        bands: [
          { frequency: 50, gain: 0, q: 0.7, type: 'lowshelf', enabled: true },
          { frequency: 200, gain: 0, q: 1, type: 'peaking', enabled: true },
          { frequency: 1000, gain: 0, q: 1, type: 'peaking', enabled: true },
          { frequency: 4000, gain: 0, q: 1, type: 'peaking', enabled: true },
          { frequency: 12000, gain: 0, q: 0.7, type: 'highshelf', enabled: true },
        ],
      },
      multiBandCompressor: {
        enabled: true,
        crossoverLow: 250,
        crossoverHigh: 4000,
        lowBand: {
          enabled: true,
          threshold: -20,
          ratio: 2,
          attack: 50,
          release: 200,
          makeupGain: 0,
        },
        midBand: {
          enabled: true,
          threshold: -18,
          ratio: 3,
          attack: 30,
          release: 150,
          makeupGain: 0,
        },
        highBand: {
          enabled: true,
          threshold: -16,
          ratio: 2.5,
          attack: 20,
          release: 100,
          makeupGain: 0,
        },
      },
      stereoEnhancer: {
        enabled: false,
        width: 1.1,
        midGain: 0,
        sideGain: 0,
      },
      harmonicExciter: {
        enabled: false,
        amount: 30,
        frequency: 5000,
        mix: 0.3,
      },
      limiter: {
        enabled: true,
        threshold: -10,
        ceiling: -1.0,
        release: 100,
        lookahead: 5,
      },
      dither: {
        enabled: true,
        type: 'shaped',
        bitDepth: 16,
      },
      targetLoudness: {
        targetLUFS: -14,
        truePeak: -1.0,
        integratedLoudness: -14,
        shortTermLoudness: -14,
        momentaryLoudness: -14,
      },
    };
  }

  /**
   * Build mastering chain
   */
  public buildChain(input: AudioNode, output: AudioNode): void {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    // Clear existing chain
    this.cleanup();

    let currentNode = input;

    // 1. Mastering EQ
    if (this.settings.eq.enabled) {
      const eqNode = this.createMasteringEQ(this.settings.eq);
      currentNode.connect(eqNode);
      currentNode = eqNode;
      this.chain.push(eqNode);
    }

    // 2. Multi-band Compressor
    if (this.settings.multiBandCompressor.enabled) {
      const mbcNode = this.createMultiBandCompressor(this.settings.multiBandCompressor);
      currentNode.connect(mbcNode);
      currentNode = mbcNode;
      this.chain.push(mbcNode);
    }

    // 3. Stereo Enhancer
    if (this.settings.stereoEnhancer.enabled) {
      const stereoNode = this.createStereoEnhancer(this.settings.stereoEnhancer);
      currentNode.connect(stereoNode);
      currentNode = stereoNode;
      this.chain.push(stereoNode);
    }

    // 4. Harmonic Exciter
    if (this.settings.harmonicExciter.enabled) {
      const exciterNode = this.createHarmonicExciter(this.settings.harmonicExciter);
      currentNode.connect(exciterNode);
      currentNode = exciterNode;
      this.chain.push(exciterNode);
    }

    // 5. Limiter
    if (this.settings.limiter.enabled) {
      const limiterNode = this.createLimiter(this.settings.limiter);
      currentNode.connect(limiterNode);
      currentNode = limiterNode;
      this.chain.push(limiterNode);
    }

    // Connect to output
    currentNode.connect(output);
  }

  /**
   * Create mastering EQ
   */
  private createMasteringEQ(settings: MasteringEQSettings): AudioNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const inputGain = this.audioContext.createGain();
    const outputGain = this.audioContext.createGain();
    const filters: BiquadFilterNode[] = [];

    let previousNode = inputGain;

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

    previousNode.connect(outputGain);

    return inputGain;
  }

  /**
   * Create multi-band compressor
   */
  private createMultiBandCompressor(settings: MultiBandCompressorSettings): AudioNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    // Create crossover filters
    const inputGain = this.audioContext.createGain();
    const lowSplit = this.audioContext.createBiquadFilter();
    const midSplitLow = this.audioContext.createBiquadFilter();
    const midSplitHigh = this.audioContext.createBiquadFilter();
    const highSplit = this.audioContext.createBiquadFilter();

    lowSplit.type = 'lowpass';
    lowSplit.frequency.value = settings.crossoverLow;

    midSplitLow.type = 'highpass';
    midSplitLow.frequency.value = settings.crossoverLow;

    midSplitHigh.type = 'lowpass';
    midSplitHigh.frequency.value = settings.crossoverHigh;

    highSplit.type = 'highpass';
    highSplit.frequency.value = settings.crossoverHigh;

    // Create compressors for each band
    const lowComp = this.createBandCompressor(settings.lowBand);
    const midComp = this.createBandCompressor(settings.midBand);
    const highComp = this.createBandCompressor(settings.highBand);

    // Create output mixer
    const outputGain = this.audioContext.createGain();

    // Connect routing
    inputGain.connect(lowSplit);
    inputGain.connect(midSplitLow);
    inputGain.connect(midSplitHigh);
    inputGain.connect(highSplit);

    lowSplit.connect(lowComp);
    lowComp.connect(outputGain);

    midSplitLow.connect(midComp);
    midComp.connect(outputGain);

    highSplit.connect(highComp);
    highComp.connect(outputGain);

    return inputGain;
  }

  /**
   * Create band compressor
   */
  private createBandCompressor(settings: BandCompressorSettings): DynamicsCompressorNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const compressor = this.audioContext.createDynamicsCompressor();

    compressor.threshold.value = settings.threshold;
    compressor.ratio.value = settings.ratio;
    compressor.attack.value = settings.attack / 1000;
    compressor.release.value = settings.release / 1000;

    // Add makeup gain
    const makeupGain = this.audioContext.createGain();
    makeupGain.gain.value = this.dbToLinear(settings.makeupGain);
    compressor.connect(makeupGain);

    return makeupGain as any; // Return the final node in the chain
  }

  /**
   * Create stereo enhancer
   */
  private createStereoEnhancer(settings: StereoEnhancerSettings): AudioNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    // Create mid-side processing
    const inputGain = this.audioContext.createGain();
    const midGain = this.audioContext.createGain();
    const sideGain = this.audioContext.createGain();
    const outputGain = this.audioContext.createGain();

    midGain.gain.value = this.dbToLinear(settings.midGain);
    sideGain.gain.value = this.dbToLinear(settings.sideGain) * settings.width;

    // Simplified stereo width implementation
    // In a full implementation, this would use mid-side encoding/decoding
    inputGain.connect(midGain);
    inputGain.connect(sideGain);
    midGain.connect(outputGain);
    sideGain.connect(outputGain);

    return inputGain;
  }

  /**
   * Create harmonic exciter
   */
  private createHarmonicExciter(settings: HarmonicExciterSettings): AudioNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const inputGain = this.audioContext.createGain();
    const highPass = this.audioContext.createBiquadFilter();
    const distortion = this.audioContext.createWaveShaper();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();
    const outputGain = this.audioContext.createGain();

    highPass.type = 'highpass';
    highPass.frequency.value = settings.frequency;

    const curve = this.makeExciterCurve(settings.amount);
    distortion.curve = curve as unknown as Float32Array<ArrayBuffer>;
    distortion.oversample = '4x';

    wetGain.gain.value = settings.mix;
    dryGain.gain.value = 1 - settings.mix;

    inputGain.connect(dryGain);
    inputGain.connect(highPass);
    highPass.connect(distortion);
    distortion.connect(wetGain);
    dryGain.connect(outputGain);
    wetGain.connect(outputGain);

    return inputGain;
  }

  /**
   * Generate exciter curve
   */
  private makeExciterCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = x + (Math.sin(x * Math.PI * 2) * amount) / 100;
    }

    return curve;
  }

  /**
   * Create limiter
   */
  private createLimiter(settings: LimiterSettings): DynamicsCompressorNode {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const limiter = this.audioContext.createDynamicsCompressor();

    limiter.threshold.value = settings.threshold;
    limiter.knee.value = 0; // Hard knee for limiter
    limiter.ratio.value = 20; // High ratio for limiting
    limiter.attack.value = settings.lookahead / 1000;
    limiter.release.value = settings.release / 1000;

    // Add ceiling gain
    const ceilingGain = this.audioContext.createGain();
    ceilingGain.gain.value = this.dbToLinear(settings.ceiling);
    limiter.connect(ceilingGain);

    return ceilingGain as any; // Return the final node
  }

  /**
   * Apply dithering (simplified - would need proper implementation)
   */
  public applyDither(audioBuffer: AudioBuffer, settings: DitherSettings): AudioBuffer {
    if (!settings.enabled || settings.type === 'none') {
      return audioBuffer;
    }

    const numChannels = audioBuffer.numberOfChannels;
    const ditheredBuffer = this.audioContext!.createBuffer(
      numChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const ditheredData = ditheredBuffer.getChannelData(channel);

      for (let i = 0; i < channelData.length; i++) {
        let ditherNoise = 0;

        switch (settings.type) {
          case 'triangular':
            ditherNoise = Math.random() - 0.5 + (Math.random() - 0.5);
            break;
          case 'rectangular':
            ditherNoise = Math.random() - 0.5;
            break;
          case 'shaped':
            // Shaped dither (TPDF with noise shaping)
            ditherNoise = Math.random() - 0.5 + (Math.random() - 0.5);
            // Add noise shaping (simplified)
            if (i > 0) {
              ditherNoise += ditheredData[i - 1] * 0.5;
            }
            break;
        }

        // Scale dither to appropriate bit depth
        const ditherScale = 1 / Math.pow(2, settings.bitDepth - 1);
        ditherNoise *= ditherScale;

        ditheredData[i] = channelData[i] + ditherNoise;
      }
    }

    return ditheredBuffer;
  }

  /**
   * Get current settings
   */
  public getSettings(): MasteringChainSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  public updateSettings(settings: Partial<MasteringChainSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Reset to default settings
   */
  public resetSettings(): void {
    this.settings = this.createDefaultSettings();
  }

  /**
   * Set preset for target platform
   */
  public setPlatformPreset(platform: 'spotify' | 'apple-music' | 'youtube' | 'soundcloud'): void {
    switch (platform) {
      case 'spotify':
        this.settings.targetLoudness.targetLUFS = -14;
        this.settings.targetLoudness.truePeak = -1.0;
        this.settings.limiter.threshold = -10;
        this.settings.limiter.ceiling = -1.0;
        break;
      case 'apple-music':
        this.settings.targetLoudness.targetLUFS = -16;
        this.settings.targetLoudness.truePeak = -1.0;
        this.settings.limiter.threshold = -12;
        this.settings.limiter.ceiling = -1.0;
        break;
      case 'youtube':
        this.settings.targetLoudness.targetLUFS = -13;
        this.settings.targetLoudness.truePeak = -1.0;
        this.settings.limiter.threshold = -9;
        this.settings.limiter.ceiling = -1.0;
        break;
      case 'soundcloud':
        this.settings.targetLoudness.targetLUFS = -10;
        this.settings.targetLoudness.truePeak = -0.5;
        this.settings.limiter.threshold = -6;
        this.settings.limiter.ceiling = -0.5;
        break;
    }
  }

  /**
   * Analyze audio and calculate mastering stats
   */
  public async analyzeAudio(audioBuffer: AudioBuffer): Promise<MasteringStats> {
    const lufsMeter = await this.calculateLUFS(audioBuffer);
    const peakLevel = this.calculatePeakLevel(audioBuffer);
    const dynamicRange = this.calculateDynamicRange(audioBuffer);
    const crestFactor = this.calculateCrestFactor(audioBuffer);

    return {
      inputLUFS: lufsMeter,
      outputLUFS: lufsMeter, // Would need to process through chain for actual output
      peakLevel,
      dynamicRange,
      crestFactor,
    };
  }

  /**
   * Calculate LUFS (simplified implementation)
   */
  private async calculateLUFS(audioBuffer: AudioBuffer): Promise<number> {
    // Simplified LUFS calculation
    // Full implementation would use EBU R128 standard
    const channelData = audioBuffer.getChannelData(0);
    let sum = 0;

    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }

    const rms = Math.sqrt(sum / channelData.length);
    const lufs = 20 * Math.log10(rms) + 10; // Approximate LUFS

    return lufs;
  }

  /**
   * Calculate peak level
   */
  private calculatePeakLevel(audioBuffer: AudioBuffer): number {
    let peak = 0;

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        const absValue = Math.abs(channelData[i]);
        if (absValue > peak) peak = absValue;
      }
    }

    return 20 * Math.log10(peak);
  }

  /**
   * Calculate dynamic range
   */
  private calculateDynamicRange(audioBuffer: AudioBuffer): number {
    const peak = this.calculatePeakLevel(audioBuffer);
    const rms = this.calculateRMS(audioBuffer);
    return peak - rms;
  }

  /**
   * Calculate crest factor
   */
  private calculateCrestFactor(audioBuffer: AudioBuffer): number {
    const peak = this.calculatePeakLevel(audioBuffer);
    const rms = this.calculateRMS(audioBuffer);
    return peak - rms;
  }

  /**
   * Calculate RMS
   */
  private calculateRMS(audioBuffer: AudioBuffer): number {
    let sum = 0;
    let samples = 0;

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
        samples++;
      }
    }

    const rms = Math.sqrt(sum / samples);
    return 20 * Math.log10(rms);
  }

  /**
   * Convert dB to linear
   */
  private dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }

  /**
   * Clean up mastering chain
   */
  public cleanup(): void {
    for (const node of this.chain) {
      node.disconnect();
    }
    this.chain = [];
  }
}
