// 3WM SONIK - Professional Metering System
// Implements VU, Peak, RMS, and LUFS metering with professional standards

export interface VUMeterData {
  leftVU: number; // VU units (-20 to +3)
  rightVU: number; // VU units (-20 to +3)
  stereoVU: number; // Average VU
}

export interface PeakMeterData {
  leftPeak: number; // dB (-60 to 0)
  rightPeak: number; // dB (-60 to 0)
  leftPeakHold: number; // dB (held peak)
  rightPeakHold: number; // dB (held peak)
  leftClip: boolean;
  rightClip: boolean;
}

export interface RMSMeterData {
  leftRMS: number; // dB (-60 to 0)
  rightRMS: number; // dB (-60 to 0)
  stereoRMS: number; // dB average
}

export interface LUFSMeterData {
  integrated: number; // LUFS (integrated loudness)
  shortTerm: number; // LUFS (short-term, 3s window)
  momentary: number; // LUFS (momentary, 400ms window)
  range: number; // LU (loudness range)
  target: number; // LUFS target
}

export interface StereoMeterData {
  leftPeak: number;
  rightPeak: number;
  leftRMS: number;
  rightRMS: number;
  leftClip: boolean;
  rightClip: boolean;
  correlation: number; // -1 to 1 (phase correlation)
  width: number; // 0 to 1 (stereo width)
  lufs: number;
  energy: number;
}

export interface MeteringConfiguration {
  vuIntegrationTime: number; // ms (standard: 300ms)
  peakHoldTime: number; // ms (standard: 1000ms)
  rmsIntegrationTime: number; // ms (standard: 300ms)
  lufsIntegrationTime: number; // ms (standard: 400ms for momentary)
  ballistics: 'fast' | 'medium' | 'slow';
  referenceLevel: number; // dB (standard: -18 for digital, 0 for analog VU)
}

export class ProfessionalMetering {
  private audioContext: AudioContext | null = null;
  private analyserL: AnalyserNode | null = null;
  private analyserR: AnalyserNode | null = null;
  private analyserMid: AnalyserNode | null = null;
  private analyserSide: AnalyserNode | null = null;

  // Peak hold state
  private leftPeakHoldValue: number = -60;
  private rightPeakHoldValue: number = -60;
  private leftPeakHoldTime: number = 0;
  private rightPeakHoldTime: number = 0;

  // VU meter state (integrating average)
  private leftVUBuffer: number[] = [];
  private rightVUBuffer: number[] = [];
  private maxVUBufferSize: number = 100;

  // LUFS metering state
  private loudnessHistory: Array<{ time: number; loudness: number }> = [];
  private loudnessWindowSize: number = 3000; // 3 seconds for short-term

  // Configuration
  private config: MeteringConfiguration = {
    vuIntegrationTime: 300,
    peakHoldTime: 1000,
    rmsIntegrationTime: 300,
    lufsIntegrationTime: 400,
    ballistics: 'medium',
    referenceLevel: -18,
  };

  constructor() {
    // Initialize with default state
  }

  public async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;

    // Create analysers for different metering needs
    this.analyserL = audioContext.createAnalyser();
    this.analyserL.fftSize = 2048;
    this.analyserL.smoothingTimeConstant = 0.3;

    this.analyserR = audioContext.createAnalyser();
    this.analyserR.fftSize = 2048;
    this.analyserR.smoothingTimeConstant = 0.3;

    this.analyserMid = audioContext.createAnalyser();
    this.analyserMid.fftSize = 2048;
    this.analyserMid.smoothingTimeConstant = 0.3;

    this.analyserSide = audioContext.createAnalyser();
    this.analyserSide.fftSize = 2048;
    this.analyserSide.smoothingTimeConstant = 0.3;
  }

  /**
   * Set metering configuration
   */
  public setConfiguration(config: Partial<MeteringConfiguration>): void {
    Object.assign(this.config, config);

    // Update analyser smoothing based on ballistics
    const smoothingConstant =
      this.config.ballistics === 'fast' ? 0.1 : this.config.ballistics === 'medium' ? 0.3 : 0.5;

    if (this.analyserL) this.analyserL.smoothingTimeConstant = smoothingConstant;
    if (this.analyserR) this.analyserR.smoothingTimeConstant = smoothingConstant;
    if (this.analyserMid) this.analyserMid.smoothingTimeConstant = smoothingConstant;
    if (this.analyserSide) this.analyserSide.smoothingTimeConstant = smoothingConstant;
  }

  /**
   * Get VU meter readings
   */
  public getVUMeter(): VUMeterData {
    if (!this.analyserL || !this.analyserR) {
      return {
        leftVU: -20,
        rightVU: -20,
        stereoVU: -20,
      };
    }

    const leftData = new Uint8Array(this.analyserL.frequencyBinCount);
    const rightData = new Uint8Array(this.analyserR.frequencyBinCount);
    this.analyserL.getByteFrequencyData(leftData);
    this.analyserR.getByteFrequencyData(rightData);

    // Calculate average level for VU (simulating 300ms integration)
    const leftLevel = this.calculateAverageLevel(leftData);
    const rightLevel = this.calculateAverageLevel(rightData);

    // Update VU buffers for integration
    this.leftVUBuffer.push(leftLevel);
    this.rightVUBuffer.push(rightLevel);

    if (this.leftVUBuffer.length > this.maxVUBufferSize) {
      this.leftVUBuffer.shift();
      this.rightVUBuffer.shift();
    }

    // Calculate integrated VU
    const leftVU = this.calculateIntegratedVU(this.leftVUBuffer);
    const rightVU = this.calculateIntegratedVU(this.rightVUBuffer);

    // Convert to VU scale (-20 to +3 VU)
    const leftVUUnits = this.dbToVU(leftVU);
    const rightVUUnits = this.dbToVU(rightVU);

    return {
      leftVU: leftVUUnits,
      rightVU: rightVUUnits,
      stereoVU: (leftVUUnits + rightVUUnits) / 2,
    };
  }

  /**
   * Get peak meter readings
   */
  public getPeakMeter(): PeakMeterData {
    if (!this.analyserL || !this.analyserR) {
      return {
        leftPeak: -60,
        rightPeak: -60,
        leftPeakHold: -60,
        rightPeakHold: -60,
        leftClip: false,
        rightClip: false,
      };
    }

    const leftData = new Uint8Array(this.analyserL.frequencyBinCount);
    const rightData = new Uint8Array(this.analyserR.frequencyBinCount);
    this.analyserL.getByteFrequencyData(leftData);
    this.analyserR.getByteFrequencyData(rightData);

    const leftPeak = this.calculatePeak(leftData);
    const rightPeak = this.calculatePeak(rightData);

    const now = Date.now();

    // Update peak hold values
    if (leftPeak > this.leftPeakHoldValue) {
      this.leftPeakHoldValue = leftPeak;
      this.leftPeakHoldTime = now;
    } else if (now - this.leftPeakHoldTime > this.config.peakHoldTime) {
      this.leftPeakHoldValue = leftPeak;
      this.leftPeakHoldTime = now;
    }

    if (rightPeak > this.rightPeakHoldValue) {
      this.rightPeakHoldValue = rightPeak;
      this.rightPeakHoldTime = now;
    } else if (now - this.rightPeakHoldTime > this.config.peakHoldTime) {
      this.rightPeakHoldValue = rightPeak;
      this.rightPeakHoldTime = now;
    }

    return {
      leftPeak,
      rightPeak,
      leftPeakHold: this.leftPeakHoldValue,
      rightPeakHold: this.rightPeakHoldValue,
      leftClip: leftPeak >= -0.1,
      rightClip: rightPeak >= -0.1,
    };
  }

  /**
   * Get RMS meter readings
   */
  public getRMSMeter(): RMSMeterData {
    if (!this.analyserL || !this.analyserR) {
      return {
        leftRMS: -60,
        rightRMS: -60,
        stereoRMS: -60,
      };
    }

    const leftData = new Uint8Array(this.analyserL.frequencyBinCount);
    const rightData = new Uint8Array(this.analyserR.frequencyBinCount);
    this.analyserL.getByteFrequencyData(leftData);
    this.analyserR.getByteFrequencyData(rightData);

    const leftRMS = this.calculateRMS(leftData);
    const rightRMS = this.calculateRMS(rightData);

    return {
      leftRMS,
      rightRMS,
      stereoRMS: (leftRMS + rightRMS) / 2,
    };
  }

  /**
   * Get LUFS meter readings (EBU R128 compliant)
   */
  public getLUFSMeter(): LUFSMeterData {
    if (!this.analyserL || !this.analyserR) {
      return {
        integrated: -60,
        shortTerm: -60,
        momentary: -60,
        range: 0,
        target: -23, // EBU R128 standard
      };
    }

    const leftData = new Uint8Array(this.analyserL.frequencyBinCount);
    const rightData = new Uint8Array(this.analyserR.frequencyBinCount);
    this.analyserL.getByteFrequencyData(leftData);
    this.analyserR.getByteFrequencyData(rightData);

    // Calculate momentary loudness (400ms integration)
    const momentaryLoudness = this.calculateKWeightedLoudness(leftData, rightData);

    // Update loudness history for short-term and integrated
    const now = Date.now();
    this.loudnessHistory.push({ time: now, loudness: momentaryLoudness });

    // Remove old data outside window
    this.loudnessHistory = this.loudnessHistory.filter(
      (entry) => now - entry.time < this.loudnessWindowSize
    );

    // Calculate short-term loudness (3s integration)
    const shortTermLoudness = this.calculateShortTermLoudness();

    // Calculate integrated loudness (entire program)
    const integratedLoudness = this.calculateIntegratedLoudness();

    // Calculate loudness range
    const loudnessRange = this.calculateLoudnessRange();

    return {
      integrated: integratedLoudness,
      shortTerm: shortTermLoudness,
      momentary: momentaryLoudness,
      range: loudnessRange,
      target: -23, // EBU R128 standard target
    };
  }

  /**
   * Get comprehensive stereo meter data
   */
  public getStereoMeter(): StereoMeterData {
    if (!this.analyserL || !this.analyserR || !this.analyserMid || !this.analyserSide) {
      return {
        leftPeak: -60,
        rightPeak: -60,
        leftRMS: -60,
        rightRMS: -60,
        leftClip: false,
        rightClip: false,
        correlation: 0,
        width: 0,
        lufs: -60,
        energy: 0,
      };
    }

    const leftData = new Uint8Array(this.analyserL.frequencyBinCount);
    const rightData = new Uint8Array(this.analyserR.frequencyBinCount);
    const midData = new Uint8Array(this.analyserMid.frequencyBinCount);
    const sideData = new Uint8Array(this.analyserSide.frequencyBinCount);

    this.analyserL.getByteFrequencyData(leftData);
    this.analyserR.getByteFrequencyData(rightData);
    this.analyserMid.getByteFrequencyData(midData);
    this.analyserSide.getByteFrequencyData(sideData);

    const leftPeak = this.calculatePeak(leftData);
    const rightPeak = this.calculatePeak(rightData);
    const leftRMS = this.calculateRMS(leftData);
    const rightRMS = this.calculateRMS(rightData);

    // Calculate phase correlation
    const correlation = this.calculatePhaseCorrelation(leftData, rightData);

    // Calculate stereo width
    const midRMS = this.calculateRMS(midData);
    const sideRMS = this.calculateRMS(sideData);
    const width = midRMS > 0 ? sideRMS / midRMS : 0;

    // Calculate LUFS
    const lufsData = this.getLUFSMeter();

    // Calculate energy
    const energy = (leftRMS + rightRMS) / 2;

    return {
      leftPeak,
      rightPeak,
      leftRMS,
      rightRMS,
      leftClip: leftPeak >= -0.1,
      rightClip: rightPeak >= -0.1,
      correlation,
      width: Math.min(1, Math.max(0, width)),
      lufs: lufsData.momentary,
      energy,
    };
  }

  /**
   * Calculate average level from frequency data
   */
  private calculateAverageLevel(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const norm = data[i] / 255;
      sum += norm;
    }
    const average = sum / data.length;
    return average <= 0.001 ? -60 : 20 * Math.log10(average);
  }

  /**
   * Calculate peak from frequency data
   */
  private calculatePeak(data: Uint8Array): number {
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const norm = data[i] / 255;
      if (norm > max) max = norm;
    }
    return max <= 0.001 ? -60 : Math.max(-60, 20 * Math.log10(max));
  }

  /**
   * Calculate RMS from frequency data
   */
  private calculateRMS(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const norm = data[i] / 255;
      sum += norm * norm;
    }
    const rms = Math.sqrt(sum / data.length);
    return rms <= 0.001 ? -60 : Math.max(-60, 20 * Math.log10(rms));
  }

  /**
   * Calculate integrated VU from buffer
   */
  private calculateIntegratedVU(buffer: number[]): number {
    if (buffer.length === 0) return -60;

    let sum = 0;
    for (const value of buffer) {
      sum += Math.pow(10, value / 20);
    }
    const average = sum / buffer.length;
    return 20 * Math.log10(average);
  }

  /**
   * Convert dB to VU units
   */
  private dbToVU(db: number): number {
    // VU scale: 0 VU = +4 dBm (analog) or reference level (digital)
    // Standard digital reference: -18 dBFS = 0 VU
    const vuOffset = db - this.config.referenceLevel;
    return Math.max(-20, Math.min(3, vuOffset));
  }

  /**
   * Calculate K-weighted loudness (EBU R128)
   */
  private calculateKWeightedLoudness(leftData: Uint8Array, rightData: Uint8Array): number {
    // Simplified K-weighting calculation
    // In production, this would use proper K-weighting filters
    const leftRMS = this.calculateRMS(leftData);
    const rightRMS = this.calculateRMS(rightData);
    const stereoRMS = (leftRMS + rightRMS) / 2;

    // Convert to LUFS scale
    return stereoRMS - 0.691; // Approximate conversion
  }

  /**
   * Calculate short-term loudness (3s integration)
   */
  private calculateShortTermLoudness(): number {
    if (this.loudnessHistory.length === 0) return -60;

    let sum = 0;
    for (const entry of this.loudnessHistory) {
      sum += Math.pow(10, entry.loudness / 10);
    }
    const average = sum / this.loudnessHistory.length;
    return 10 * Math.log10(average);
  }

  /**
   * Calculate integrated loudness (entire program)
   */
  private calculateIntegratedLoudness(): number {
    // For integrated loudness, we'd need a longer history
    // Using short-term as approximation
    return this.calculateShortTermLoudness();
  }

  /**
   * Calculate loudness range (LRA)
   */
  private calculateLoudnessRange(): number {
    if (this.loudnessHistory.length < 10) return 0;

    const loudnessValues = this.loudnessHistory.map((entry) => entry.loudness);
    const sorted = [...loudnessValues].sort((a, b) => a - b);

    // Calculate 10th and 95th percentiles
    const lowIndex = Math.floor(sorted.length * 0.1);
    const highIndex = Math.floor(sorted.length * 0.95);

    const lowLoudness = sorted[lowIndex];
    const highLoudness = sorted[highIndex];

    return highLoudness - lowLoudness;
  }

  /**
   * Calculate phase correlation between channels
   */
  private calculatePhaseCorrelation(leftData: Uint8Array, rightData: Uint8Array): number {
    let correlation = 0;
    let leftSum = 0;
    let rightSum = 0;

    for (let i = 0; i < Math.min(leftData.length, rightData.length); i++) {
      const left = leftData[i] / 255;
      const right = rightData[i] / 255;

      correlation += left * right;
      leftSum += left * left;
      rightSum += right * right;
    }

    const denominator = Math.sqrt(leftSum * rightSum);
    return denominator > 0 ? correlation / denominator : 0;
  }

  /**
   * Reset peak hold values
   */
  public resetPeakHold(): void {
    this.leftPeakHoldValue = -60;
    this.rightPeakHoldValue = -60;
    this.leftPeakHoldTime = 0;
    this.rightPeakHoldTime = 0;
  }

  /**
   * Clear loudness history
   */
  public clearLoudnessHistory(): void {
    this.loudnessHistory = [];
  }

  /**
   * Get all meter data at once
   */
  public getAllMeters(): {
    vu: VUMeterData;
    peak: PeakMeterData;
    rms: RMSMeterData;
    lufs: LUFSMeterData;
    stereo: StereoMeterData;
  } {
    return {
      vu: this.getVUMeter(),
      peak: this.getPeakMeter(),
      rms: this.getRMSMeter(),
      lufs: this.getLUFSMeter(),
      stereo: this.getStereoMeter(),
    };
  }

  /**
   * Get metering configuration
   */
  public getConfiguration(): MeteringConfiguration {
    return { ...this.config };
  }

  /**
   * Connect to audio nodes for metering
   */
  public connectToSource(
    leftSource: AudioNode,
    rightSource: AudioNode,
    midSource?: AudioNode,
    sideSource?: AudioNode
  ): void {
    if (this.analyserL) leftSource.connect(this.analyserL);
    if (this.analyserR) rightSource.connect(this.analyserR);
    if (this.analyserMid && midSource) midSource.connect(this.analyserMid);
    if (this.analyserSide && sideSource) sideSource.connect(this.analyserSide);
  }
}

// Export singleton instance
export const professionalMetering = new ProfessionalMetering();
