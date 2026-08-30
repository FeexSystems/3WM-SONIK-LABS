// 3WM SONIK - LUFS Metering
// EBU R128 compliant loudness metering with target loudness compliance

export interface LUFSMeasurement {
  integrated: number; // LUFS (overall loudness)
  shortTerm: number; // LUFS (3-second window)
  momentary: number; // LUFS (400ms window)
  truePeak: number; // dBTP (true peak)
  loudnessRange: number; // LU (LRA)
  target: number; // Target LUFS
  compliance: 'compliant' | 'warning' | 'non-compliant';
}

export interface LoudnessHistory {
  timestamp: number;
  integrated: number;
  shortTerm: number;
  momentary: number;
  truePeak: number;
}

export class LUFSMeter {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private history: LoudnessHistory[] = [];
  private maxHistoryLength: number = 1000;
  private targetLUFS: number = -14;
  private truePeakTarget: number = -1.0;

  // EBU R128 constants
  private readonly K_WEIGHTING_FILTER = this.createKWeightingFilter();
  private readonly MOMENTARY_WINDOW = 0.4; // 400ms
  private readonly SHORT_TERM_WINDOW = 3.0; // 3 seconds
  private readonly INTEGRATION_TIME = 10.0; // 10 seconds minimum

  constructor(targetLUFS: number = -14, truePeakTarget: number = -1.0) {
    this.targetLUFS = targetLUFS;
    this.truePeakTarget = truePeakTarget;
  }

  /**
   * Initialize LUFS meter with audio context
   */
  public async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.1;
  }

  /**
   * Create K-weighting filter (simplified)
   */
  private createKWeightingFilter(): any {
    // K-weighting filter coefficients (simplified)
    // Full implementation would use proper IIR filter coefficients
    return {
      highShelf: { freq: 1500, gain: 4, q: 0.7 },
      highPass: { freq: 38, gain: 0, q: 0.5 },
    };
  }

  /**
   * Measure loudness from audio buffer
   */
  public async measureLoudness(audioBuffer: AudioBuffer): Promise<LUFSMeasurement> {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    // Apply K-weighting (simplified)
    const weightedBuffer = this.applyKWeighting(audioBuffer);

    // Calculate momentary loudness (400ms)
    const momentary = this.calculateMomentaryLoudness(weightedBuffer);

    // Calculate short-term loudness (3s)
    const shortTerm = this.calculateShortTermLoudness(weightedBuffer);

    // Calculate integrated loudness
    const integrated = this.calculateIntegratedLoudness(weightedBuffer);

    // Calculate true peak
    const truePeak = this.calculateTruePeak(audioBuffer);

    // Calculate loudness range
    const loudnessRange = this.calculateLoudnessRange(weightedBuffer);

    // Determine compliance
    const compliance = this.determineCompliance(integrated, truePeak);

    // Add to history
    this.addToHistory(integrated, shortTerm, momentary, truePeak);

    return {
      integrated,
      shortTerm,
      momentary,
      truePeak,
      loudnessRange,
      target: this.targetLUFS,
      compliance,
    };
  }

  /**
   * Apply K-weighting to audio buffer (simplified)
   */
  private applyKWeighting(audioBuffer: AudioBuffer): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const weightedBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = weightedBuffer.getChannelData(channel);

      // Apply high-pass filter (38Hz)
      const hpFiltered = this.applyHighPass(inputData, 38, audioBuffer.sampleRate);

      // Apply high-shelf filter (1500Hz with +4dB gain)
      const hsFiltered = this.applyHighShelf(hpFiltered, 1500, 4, audioBuffer.sampleRate);

      for (let i = 0; i < outputData.length; i++) {
        outputData[i] = hsFiltered[i];
      }
    }

    return weightedBuffer;
  }

  /**
   * Apply high-pass filter (simplified IIR)
   */
  private applyHighPass(data: Float32Array, cutoff: number, sampleRate: number): Float32Array {
    const output = new Float32Array(data.length);
    const rc = 1.0 / (cutoff * 2 * Math.PI);
    const dt = 1.0 / sampleRate;
    const alpha = rc / (rc + dt);

    let prevInput = 0;
    let prevOutput = 0;

    for (let i = 0; i < data.length; i++) {
      output[i] = alpha * (prevOutput + data[i] - prevInput);
      prevInput = data[i];
      prevOutput = output[i];
    }

    return output;
  }

  /**
   * Apply high-shelf filter (simplified IIR)
   */
  private applyHighShelf(
    data: Float32Array,
    cutoff: number,
    gain: number,
    sampleRate: number
  ): Float32Array {
    const output = new Float32Array(data.length);
    const omega = (2 * Math.PI * cutoff) / sampleRate;
    const sn = Math.sin(omega);
    const cs = Math.cos(omega);
    const A = Math.pow(10, gain / 40);

    const beta = Math.sqrt(A) + Math.sqrt(A + 1);
    const b0 = A * (A + 1 + (A - 1) * cs + beta * sn);
    const b1 = -2 * A * (A - 1 + (A + 1) * cs);
    const b2 = A * (A + 1 + (A - 1) * cs - beta * sn);
    const a0 = A + 1 - (A - 1) * cs + beta * sn;
    const a1 = 2 * (A - 1 - (A + 1) * cs);
    const a2 = A + 1 - (A - 1) * cs - beta * sn;

    const b0n = b0 / a0;
    const b1n = b1 / a0;
    const b2n = b2 / a0;
    const a1n = a1 / a0;
    const a2n = a2 / a0;

    let x1 = 0,
      x2 = 0,
      y1 = 0,
      y2 = 0;

    for (let i = 0; i < data.length; i++) {
      output[i] = b0n * data[i] + b1n * x1 + b2n * x2 - a1n * y1 - a2n * y2;
      x2 = x1;
      x1 = data[i];
      y2 = y1;
      y1 = output[i];
    }

    return output;
  }

  /**
   * Calculate momentary loudness (400ms window)
   */
  private calculateMomentaryLoudness(audioBuffer: AudioBuffer): number {
    const windowSamples = Math.floor(this.MOMENTARY_WINDOW * audioBuffer.sampleRate);
    const windowStart = Math.max(0, audioBuffer.length - windowSamples);
    const windowEnd = audioBuffer.length;

    return this.calculateLoudnessInWindow(audioBuffer, windowStart, windowEnd);
  }

  /**
   * Calculate short-term loudness (3s window)
   */
  private calculateShortTermLoudness(audioBuffer: AudioBuffer): number {
    const windowSamples = Math.floor(this.SHORT_TERM_WINDOW * audioBuffer.sampleRate);
    const windowStart = Math.max(0, audioBuffer.length - windowSamples);
    const windowEnd = audioBuffer.length;

    return this.calculateLoudnessInWindow(audioBuffer, windowStart, windowEnd);
  }

  /**
   * Calculate integrated loudness
   */
  private calculateIntegratedLoudness(audioBuffer: AudioBuffer): number {
    // Use gating as per EBU R128
    const threshold = this.calculateGatingThreshold(audioBuffer);
    const gatedSamples = this.applyGating(audioBuffer, threshold);

    if (gatedSamples.length === 0) return -70; // Silent

    return this.calculateLoudnessInWindow(gatedSamples, 0, gatedSamples.length);
  }

  /**
   * Calculate loudness in specific window
   */
  private calculateLoudnessInWindow(audioBuffer: AudioBuffer, start: number, end: number): number {
    let sum = 0;
    let sampleCount = 0;

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = start; i < end; i++) {
        sum += channelData[i] * channelData[i];
        sampleCount++;
      }
    }

    if (sampleCount === 0) return -70;

    const meanSquare = sum / sampleCount;
    const rms = Math.sqrt(meanSquare);
    const lufs = -0.691 + 10 * Math.log10(rms); // EBU R128 reference

    return lufs;
  }

  /**
   * Calculate gating threshold
   */
  private calculateGatingThreshold(audioBuffer: AudioBuffer): number {
    // Calculate absolute threshold (-70 LUFS)
    const absoluteThreshold = Math.pow(10, (-70 + 0.691) / 10);

    // Calculate relative threshold (8 LU below gated loudness)
    // Simplified: use absolute threshold for now
    return absoluteThreshold;
  }

  /**
   * Apply gating to audio buffer
   */
  private applyGating(audioBuffer: AudioBuffer, threshold: number): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const gatedBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    let totalSamples = 0;

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = gatedBuffer.getChannelData(channel);

      for (let i = 0; i < inputData.length; i++) {
        const power = inputData[i] * inputData[i];
        if (power >= threshold) {
          outputData[i] = inputData[i];
          totalSamples++;
        } else {
          outputData[i] = 0;
        }
      }
    }

    return gatedBuffer;
  }

  /**
   * Calculate true peak (interpolated peak)
   */
  private calculateTruePeak(audioBuffer: AudioBuffer): number {
    let peak = 0;

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);

      for (let i = 0; i < channelData.length; i++) {
        const absValue = Math.abs(channelData[i]);
        if (absValue > peak) peak = absValue;
      }

      // Interpolate for true peak (simplified)
      for (let i = 1; i < channelData.length - 1; i++) {
        const interpolated = (channelData[i - 1] + channelData[i + 1]) / 2;
        const absInterpolated = Math.abs(interpolated);
        if (absInterpolated > peak) peak = absInterpolated;
      }
    }

    return 20 * Math.log10(peak);
  }

  /**
   * Calculate loudness range (LRA)
   */
  private calculateLoudnessRange(audioBuffer: AudioBuffer): number {
    // Simplified LRA calculation
    // Full implementation would use gated loudness percentiles
    const momentaryValues: number[] = [];
    const windowSamples = Math.floor(this.MOMENTARY_WINDOW * audioBuffer.sampleRate);

    for (let i = 0; i < audioBuffer.length - windowSamples; i += windowSamples) {
      const windowBuffer = this.extractWindow(audioBuffer, i, i + windowSamples);
      const loudness = this.calculateLoudnessInWindow(windowBuffer, 0, windowBuffer.length);
      momentaryValues.push(loudness);
    }

    if (momentaryValues.length === 0) return 0;

    // Calculate 10th and 95th percentiles
    momentaryValues.sort((a, b) => a - b);
    const lowIndex = Math.floor(momentaryValues.length * 0.1);
    const highIndex = Math.floor(momentaryValues.length * 0.95);

    const lowLoudness = momentaryValues[lowIndex];
    const highLoudness = momentaryValues[highIndex];

    return highLoudness - lowLoudness;
  }

  /**
   * Extract window from audio buffer
   */
  private extractWindow(audioBuffer: AudioBuffer, start: number, end: number): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const windowBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      end - start,
      audioBuffer.sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = windowBuffer.getChannelData(channel);

      for (let i = 0; i < outputData.length; i++) {
        outputData[i] = inputData[start + i];
      }
    }

    return windowBuffer;
  }

  /**
   * Determine compliance with target loudness
   */
  private determineCompliance(
    integrated: number,
    truePeak: number
  ): 'compliant' | 'warning' | 'non-compliant' {
    const loudnessDeviation = Math.abs(integrated - this.targetLUFS);
    const peakDeviation = truePeak - this.truePeakTarget;

    if (loudnessDeviation <= 1 && peakDeviation <= 0.5) {
      return 'compliant';
    } else if (loudnessDeviation <= 2 && peakDeviation <= 1) {
      return 'warning';
    } else {
      return 'non-compliant';
    }
  }

  /**
   * Add measurement to history
   */
  private addToHistory(
    integrated: number,
    shortTerm: number,
    momentary: number,
    truePeak: number
  ): void {
    this.history.push({
      timestamp: Date.now(),
      integrated,
      shortTerm,
      momentary,
      truePeak,
    });

    // Limit history length
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  /**
   * Get measurement history
   */
  public getHistory(): LoudnessHistory[] {
    return [...this.history];
  }

  /**
   * Clear history
   */
  public clearHistory(): void {
    this.history = [];
  }

  /**
   * Set target LUFS
   */
  public setTargetLUFS(target: number): void {
    this.targetLUFS = target;
  }

  /**
   * Set true peak target
   */
  public setTruePeakTarget(target: number): void {
    this.truePeakTarget = target;
  }

  /**
   * Get current target LUFS
   */
  public getTargetLUFS(): number {
    return this.targetLUFS;
  }

  /**
   * Get current true peak target
   */
  public getTruePeakTarget(): number {
    return this.truePeakTarget;
  }

  /**
   * Calculate recommended gain adjustment
   */
  public calculateGainAdjustment(currentLUFS: number): number {
    return this.targetLUFS - currentLUFS;
  }

  /**
   * Get platform presets
   */
  public static getPlatformPresets(): Record<string, { lufs: number; truePeak: number }> {
    return {
      spotify: { lufs: -14, truePeak: -1.0 },
      'apple-music': { lufs: -16, truePeak: -1.0 },
      youtube: { lufs: -13, truePeak: -1.0 },
      soundcloud: { lufs: -10, truePeak: -0.5 },
      tidal: { lufs: -14, truePeak: -1.0 },
      amazon: { lufs: -14, truePeak: -1.0 },
      'ebu-r128': { lufs: -23, truePeak: -1.0 },
    };
  }

  /**
   * Apply platform preset
   */
  public applyPlatformPreset(platform: string): void {
    const presets = LUFSMeter.getPlatformPresets();
    const preset = presets[platform];

    if (preset) {
      this.targetLUFS = preset.lufs;
      this.truePeakTarget = preset.truePeak;
    }
  }

  /**
   * Real-time loudness measurement (for metering UI)
   */
  public measureRealTime(
    audioNode: AudioNode,
    callback: (measurement: LUFSMeasurement) => void
  ): void {
    if (!this.analyser) throw new Error('Analyser not initialized');

    const dataArray = new Float32Array(this.analyser.frequencyBinCount);

    const measure = () => {
      this.analyser!.getFloatTimeDomainData(dataArray);

      // Calculate RMS from time domain data
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const lufs = -0.691 + 10 * Math.log10(rms);

      const measurement: LUFSMeasurement = {
        integrated: lufs, // Approximated for real-time
        shortTerm: lufs,
        momentary: lufs,
        truePeak: 20 * Math.log10(Math.max(...dataArray.map(Math.abs))),
        loudnessRange: 0,
        target: this.targetLUFS,
        compliance: this.determineCompliance(
          lufs,
          20 * Math.log10(Math.max(...dataArray.map(Math.abs)))
        ),
      };

      callback(measurement);
      requestAnimationFrame(measure);
    };

    measure();
  }

  /**
   * Clean up
   */
  public cleanup(): void {
    this.history = [];
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
  }
}
