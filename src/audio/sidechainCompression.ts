/**
 * 3WM SONIK — Sidechain Compression
 * Implementation of sidechain compression for ducking effects
 */

export interface SidechainParams {
  threshold: number; // Threshold in dB (-60 to 0)
  ratio: number; // Compression ratio (1 to 20)
  attack: number; // Attack time in seconds (0.001 to 1)
  release: number; // Release time in seconds (0.01 to 2)
  knee: number; // Knee in dB (0 to 24)
  sidechainGain: number; // Sidechain input gain (0 to 1)
  wetLevel: number; // Wet level (0 to 1)
  dryLevel: number; // Dry level (0 to 1)
}

export class SidechainCompressor {
  protected audioContext: AudioContext;
  protected compressor: DynamicsCompressorNode | null = null;
  protected sidechainInput: GainNode | null = null;
  protected sidechainAnalyser: AnalyserNode | null = null;
  protected inputGain: GainNode | null = null;
  protected outputGain: GainNode | null = null;
  protected dryGain: GainNode | null = null;
  protected wetGain: GainNode | null = null;
  protected params: SidechainParams;
  protected sidechainData: Float32Array | null = null;
  protected isSidechaining: boolean = false;

  constructor(audioContext: AudioContext, params: Partial<SidechainParams> = {}) {
    this.audioContext = audioContext;
    this.params = {
      threshold: params.threshold ?? -20,
      ratio: params.ratio ?? 4,
      attack: params.attack ?? 0.01,
      release: params.release ?? 0.1,
      knee: params.knee ?? 6,
      sidechainGain: params.sidechainGain ?? 1,
      wetLevel: params.wetLevel ?? 1,
      dryLevel: params.dryLevel ?? 0,
    };
  }

  async initialize(): Promise<void> {
    // Create main compressor
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = this.params.threshold;
    this.compressor.ratio.value = this.params.ratio;
    this.compressor.attack.value = this.params.attack;
    this.compressor.release.value = this.params.release;
    this.compressor.knee.value = this.params.knee;

    // Create sidechain input
    this.sidechainInput = this.audioContext.createGain();
    this.sidechainInput.gain.value = this.params.sidechainGain;

    // Create sidechain analyser for level detection
    this.sidechainAnalyser = this.audioContext.createAnalyser();
    this.sidechainAnalyser.fftSize = 256;
    this.sidechainData = new Float32Array(this.sidechainAnalyser.frequencyBinCount);

    // Create input/output routing
    this.inputGain = this.audioContext.createGain();
    this.outputGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();

    // Set initial wet/dry mix
    this.dryGain.gain.value = this.params.dryLevel;
    this.wetGain.gain.value = this.params.wetLevel;

    // Connect routing
    this.inputGain.connect(this.dryGain);
    this.dryGain.connect(this.outputGain);

    this.inputGain.connect(this.compressor);
    this.compressor.connect(this.wetGain);
    this.wetGain.connect(this.outputGain);

    // Connect sidechain input to analyser
    this.sidechainInput.connect(this.sidechainAnalyser);
  }

  connect(destination: AudioNode): void {
    this.outputGain?.connect(destination);
  }

  disconnect(): void {
    this.inputGain?.disconnect();
    this.outputGain?.disconnect();
    this.compressor?.disconnect();
    this.sidechainInput?.disconnect();
    this.sidechainAnalyser?.disconnect();
    this.dryGain?.disconnect();
    this.wetGain?.disconnect();
  }

  /**
   * Connect sidechain input source (e.g., kick drum)
   */
  connectSidechain(source: AudioNode): void {
    source.connect(this.sidechainInput!);
    this.isSidechaining = true;
  }

  /**
   * Disconnect sidechain input
   */
  disconnectSidechain(): void {
    this.sidechainInput?.disconnect();
    this.isSidechaining = false;
  }

  /**
   * Get sidechain level for visualization
   */
  getSidechainLevel(): number {
    if (!this.sidechainAnalyser || !this.sidechainData) return 0;

    this.sidechainAnalyser.getFloatTimeDomainData(this.sidechainData as any);

    // Calculate RMS
    let sum = 0;
    for (let i = 0; i < this.sidechainData.length; i++) {
      sum += this.sidechainData[i] * this.sidechainData[i];
    }
    const rms = Math.sqrt(sum / this.sidechainData.length);

    return rms;
  }

  /**
   * Get current gain reduction
   */
  getGainReduction(): number {
    if (!this.compressor) return 0;
    return this.compressor.reduction;
  }

  setParams(params: Partial<SidechainParams>): void {
    if (params.threshold !== undefined && this.compressor) {
      this.params.threshold = params.threshold;
      this.compressor.threshold.value = this.params.threshold;
    }
    if (params.ratio !== undefined && this.compressor) {
      this.params.ratio = params.ratio;
      this.compressor.ratio.value = this.params.ratio;
    }
    if (params.attack !== undefined && this.compressor) {
      this.params.attack = params.attack;
      this.compressor.attack.value = this.params.attack;
    }
    if (params.release !== undefined && this.compressor) {
      this.params.release = params.release;
      this.compressor.release.value = this.params.release;
    }
    if (params.knee !== undefined && this.compressor) {
      this.params.knee = params.knee;
      this.compressor.knee.value = this.params.knee;
    }
    if (params.sidechainGain !== undefined && this.sidechainInput) {
      this.params.sidechainGain = params.sidechainGain;
      this.sidechainInput.gain.value = this.params.sidechainGain;
    }
    if (params.wetLevel !== undefined && this.wetGain) {
      this.params.wetLevel = params.wetLevel;
      this.wetGain.gain.value = this.params.wetLevel;
    }
    if (params.dryLevel !== undefined && this.dryGain) {
      this.params.dryLevel = params.dryLevel;
      this.dryGain.gain.value = this.params.dryLevel;
    }
  }

  getInput(): AudioNode | null {
    return this.inputGain;
  }

  getOutput(): AudioNode | null {
    return this.outputGain;
  }

  getSidechainInput(): AudioNode | null {
    return this.sidechainInput;
  }

  isSidechainActive(): boolean {
    return this.isSidechaining;
  }
}

/**
 * Advanced sidechain with multiple sources and ducking curves
 */
export class AdvancedSidechain extends SidechainCompressor {
  private duckingCurve: 'linear' | 'exponential' | 'logarithmic' = 'exponential';
  private lookAhead: number = 0; // Look-ahead time in seconds
  private lookAheadDelay: DelayNode | null = null;

  constructor(audioContext: AudioContext, params: Partial<SidechainParams> = {}) {
    super(audioContext, params);
  }

  async initialize(): Promise<void> {
    await super.initialize();

    // Create look-ahead delay for pre-ducking
    this.lookAheadDelay = this.audioContext.createDelay(0.1);
    this.lookAheadDelay.delayTime.value = this.lookAhead;

    // Re-route input through look-ahead
    this.inputGain?.disconnect();
    this.inputGain?.connect(this.lookAheadDelay!);
    this.lookAheadDelay!.connect(this.dryGain!);
    this.lookAheadDelay!.connect(this.compressor!);
  }

  setDuckingCurve(curve: 'linear' | 'exponential' | 'logarithmic'): void {
    this.duckingCurve = curve;
    // Apply curve to compressor response
    if (this.compressor) {
      switch (curve) {
        case 'linear':
          this.compressor.knee.value = 0;
          break;
        case 'exponential':
          this.compressor.knee.value = 6;
          break;
        case 'logarithmic':
          this.compressor.knee.value = 12;
          break;
      }
    }
  }

  setLookAhead(time: number): void {
    this.lookAhead = time;
    if (this.lookAheadDelay) {
      this.lookAheadDelay.delayTime.value = time;
    }
  }

  getDuckingCurve(): 'linear' | 'exponential' | 'logarithmic' {
    return this.duckingCurve;
  }

  getLookAhead(): number {
    return this.lookAhead;
  }
}
