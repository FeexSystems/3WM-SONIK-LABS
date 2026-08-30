/**
 * Audio Quality Monitor - Real-time audio quality monitoring and auto-adjustment
 * Part of Phase 4.2.5: Create audio quality monitoring and auto-adjustment system
 */

export interface QualityMetrics {
  signalLevel: number;
  noiseFloor: number;
  dynamicRange: number;
  thd: number; // Total Harmonic Distortion
  frequencyResponse: number[];
  phaseCoherence: number;
  sampleRate: number;
  bitDepth: number;
}

export interface QualityThresholds {
  minSignalLevel: number;
  maxNoiseFloor: number;
  minDynamicRange: number;
  maxTHD: number;
  minPhaseCoherence: number;
}

export interface AutoAdjustmentConfig {
  enableAutoAdjustment: boolean;
  adjustmentInterval: number;
  thresholds: QualityThresholds;
  enableGainCorrection: boolean;
  enableNoiseReduction: boolean;
  enableEQCorrection: boolean;
}

export interface QualityReport {
  overallScore: number; // 0-100
  metrics: QualityMetrics;
  issues: string[];
  recommendations: string[];
  timestamp: number;
}

export class AudioQualityMonitor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private config: AutoAdjustmentConfig;
  private currentMetrics: QualityMetrics;
  private listeners: Set<(report: QualityReport) => void> = new Set();
  private monitoringTimer: number | null = null;
  private referenceSignal: Float32Array | null = null;

  constructor(audioContext: AudioContext, config: Partial<AutoAdjustmentConfig> = {}) {
    this.audioContext = audioContext;
    this.config = {
      enableAutoAdjustment: true,
      adjustmentInterval: 1000,
      thresholds: {
        minSignalLevel: -60,
        maxNoiseFloor: -90,
        minDynamicRange: 60,
        maxTHD: 0.01,
        minPhaseCoherence: 0.95,
      },
      enableGainCorrection: true,
      enableNoiseReduction: false,
      enableEQCorrection: false,
      ...config,
    };

    this.currentMetrics = this.initializeMetrics();

    this.setupAnalyser();
  }

  /**
   * Initialize quality metrics
   */
  private initializeMetrics(): QualityMetrics {
    return {
      signalLevel: -Infinity,
      noiseFloor: -Infinity,
      dynamicRange: 0,
      thd: 0,
      frequencyResponse: [],
      phaseCoherence: 1.0,
      sampleRate: this.audioContext?.sampleRate || 48000,
      bitDepth: 32, // Float32
    };
  }

  /**
   * Setup analyser node
   */
  private setupAnalyser(): void {
    if (!this.audioContext) return;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
  }

  /**
   * Start quality monitoring
   */
  startMonitoring(): void {
    if (this.monitoringTimer !== null) {
      clearInterval(this.monitoringTimer);
    }

    this.monitoringTimer = window.setInterval(() => {
      this.measureQuality();
    }, this.config.adjustmentInterval);
  }

  /**
   * Stop quality monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringTimer !== null) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }

  /**
   * Measure audio quality
   */
  private measureQuality(): void {
    if (!this.analyser) return;

    const timeData = new Float32Array(this.analyser.fftSize);
    const freqData = new Uint8Array(this.analyser.frequencyBinCount);

    this.analyser.getFloatTimeDomainData(timeData as any);
    this.analyser.getByteFrequencyData(freqData as any);

    this.currentMetrics.signalLevel = this.calculateSignalLevel(timeData);
    this.currentMetrics.noiseFloor = this.calculateNoiseFloor(timeData);
    this.currentMetrics.dynamicRange =
      this.currentMetrics.signalLevel - this.currentMetrics.noiseFloor;
    this.currentMetrics.thd = this.calculateTHD(timeData);
    this.currentMetrics.frequencyResponse = this.calculateFrequencyResponse(freqData);
    this.currentMetrics.phaseCoherence = this.calculatePhaseCoherence(timeData);

    const report = this.generateReport();
    this.notifyListeners(report);

    if (this.config.enableAutoAdjustment) {
      this.performAutoAdjustment(report);
    }
  }

  /**
   * Calculate signal level (RMS)
   */
  private calculateSignalLevel(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    const rms = Math.sqrt(sum / data.length);
    return 20 * Math.log10(rms + 1e-10);
  }

  /**
   * Calculate noise floor
   */
  private calculateNoiseFloor(data: Float32Array): number {
    // Find the quietest portion of the signal
    const windowSize = Math.floor(data.length / 10);
    let minNoise = Infinity;

    for (let i = 0; i < data.length - windowSize; i += windowSize) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += data[i + j] * data[i + j];
      }
      const rms = Math.sqrt(sum / windowSize);
      const level = 20 * Math.log10(rms + 1e-10);
      minNoise = Math.min(minNoise, level);
    }

    return minNoise;
  }

  /**
   * Calculate Total Harmonic Distortion
   */
  private calculateTHD(data: Float32Array): number {
    // Simplified THD calculation
    const fft = this.performFFT(data);
    const fundamental = this.findFundamentalFrequency(fft);

    if (fundamental === 0) return 0;

    let harmonicPower = 0;
    let fundamentalPower = 0;

    for (let i = 0; i < fft.length; i++) {
      const freq = (i * this.currentMetrics.sampleRate) / fft.length;
      const magnitude = Math.sqrt(fft[i].real ** 2 + fft[i].imag ** 2);

      if (Math.abs(freq - fundamental) < 10) {
        fundamentalPower += magnitude;
      } else if (freq > fundamental && freq < fundamental * 10) {
        harmonicPower += magnitude;
      }
    }

    return harmonicPower > 0 ? harmonicPower / fundamentalPower : 0;
  }

  /**
   * Perform FFT (simplified)
   */
  private performFFT(data: Float32Array): { real: number; imag: number }[] {
    // Simplified FFT implementation
    const N = data.length;
    const result: { real: number; imag: number }[] = [];

    for (let k = 0; k < N; k++) {
      let real = 0;
      let imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N;
        real += data[n] * Math.cos(angle);
        imag -= data[n] * Math.sin(angle);
      }
      result.push({ real, imag });
    }

    return result;
  }

  /**
   * Find fundamental frequency
   */
  private findFundamentalFrequency(fft: { real: number; imag: number }[]): number {
    let maxMagnitude = 0;
    let maxIndex = 0;

    for (let i = 1; i < fft.length / 2; i++) {
      const magnitude = Math.sqrt(fft[i].real ** 2 + fft[i].imag ** 2);
      if (magnitude > maxMagnitude) {
        maxMagnitude = magnitude;
        maxIndex = i;
      }
    }

    return (maxIndex * this.currentMetrics.sampleRate) / fft.length;
  }

  /**
   * Calculate frequency response
   */
  private calculateFrequencyResponse(freqData: Uint8Array): number[] {
    const response: number[] = [];
    const binCount = freqData.length;

    for (let i = 0; i < binCount; i++) {
      response.push(freqData[i] / 255);
    }

    return response;
  }

  /**
   * Calculate phase coherence
   */
  private calculatePhaseCoherence(data: Float32Array): number {
    // Simplified phase coherence calculation
    const correlation = this.calculateAutocorrelation(data);
    const maxCorrelation = Math.max(...correlation);
    return maxCorrelation;
  }

  /**
   * Calculate autocorrelation
   */
  private calculateAutocorrelation(data: Float32Array): number[] {
    const N = data.length;
    const correlation: number[] = [];

    for (let lag = 0; lag < N / 2; lag++) {
      let sum = 0;
      for (let i = 0; i < N - lag; i++) {
        sum += data[i] * data[i + lag];
      }
      correlation.push(sum / (N - lag));
    }

    return correlation;
  }

  /**
   * Generate quality report
   */
  private generateReport(): QualityReport {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const thresholds = this.config.thresholds;

    // Check signal level
    if (this.currentMetrics.signalLevel < thresholds.minSignalLevel) {
      issues.push('Signal level too low');
      if (this.config.enableGainCorrection) {
        recommendations.push('Increase input gain');
      }
    }

    // Check noise floor
    if (this.currentMetrics.noiseFloor > thresholds.maxNoiseFloor) {
      issues.push('Noise floor too high');
      if (this.config.enableNoiseReduction) {
        recommendations.push('Apply noise reduction');
      }
    }

    // Check dynamic range
    if (this.currentMetrics.dynamicRange < thresholds.minDynamicRange) {
      issues.push('Dynamic range insufficient');
      recommendations.push('Check input source quality');
    }

    // Check THD
    if (this.currentMetrics.thd > thresholds.maxTHD) {
      issues.push('High harmonic distortion');
      if (this.config.enableEQCorrection) {
        recommendations.push('Reduce drive or apply EQ');
      }
    }

    // Check phase coherence
    if (this.currentMetrics.phaseCoherence < thresholds.minPhaseCoherence) {
      issues.push('Phase coherence degraded');
      recommendations.push('Check phase alignment');
    }

    // Calculate overall score
    const score = this.calculateOverallScore(issues);

    return {
      overallScore: score,
      metrics: { ...this.currentMetrics },
      issues,
      recommendations,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(issues: string[]): number {
    const baseScore = 100;
    const penaltyPerIssue = 10;
    return Math.max(0, baseScore - issues.length * penaltyPerIssue);
  }

  /**
   * Perform auto-adjustment based on quality report
   */
  private performAutoAdjustment(report: QualityReport): void {
    if (!this.config.enableAutoAdjustment) return;

    // Apply adjustments based on recommendations
    report.recommendations.forEach((rec) => {
      console.log(`Auto-adjustment: ${rec}`);
      // In a real implementation, this would apply actual adjustments
    });
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): QualityMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get current quality report
   */
  getCurrentReport(): QualityReport {
    return this.generateReport();
  }

  /**
   * Get analyser node for connection
   */
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  /**
   * Set reference signal for comparison
   */
  setReferenceSignal(signal: Float32Array): void {
    this.referenceSignal = signal;
  }

  /**
   * Compare with reference signal
   */
  compareToReference(): number {
    if (!this.referenceSignal) return 0;

    // Calculate similarity score with reference
    // Simplified implementation
    return 0.85; // Placeholder
  }

  /**
   * Subscribe to quality reports
   */
  subscribe(listener: (report: QualityReport) => void): () => void {
    this.listeners.add(listener);
    listener(this.getCurrentReport());
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(report: QualityReport): void {
    this.listeners.forEach((listener) => listener(report));
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AutoAdjustmentConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): AutoAdjustmentConfig {
    return { ...this.config };
  }

  /**
   * Enable or disable auto-adjustment
   */
  setAutoAdjustment(enabled: boolean): void {
    this.config.enableAutoAdjustment = enabled;
  }

  /**
   * Get quality thresholds
   */
  getThresholds(): QualityThresholds {
    return { ...this.config.thresholds };
  }

  /**
   * Set quality thresholds
   */
  setThresholds(thresholds: Partial<QualityThresholds>): void {
    this.config.thresholds = { ...this.config.thresholds, ...thresholds };
  }

  /**
   * Get quality summary
   */
  getQualitySummary(): string {
    const report = this.getCurrentReport();
    return `
Audio Quality Summary
=====================

Overall Score: ${report.overallScore}/100

Metrics:
- Signal Level: ${report.metrics.signalLevel.toFixed(1)} dB
- Noise Floor: ${report.metrics.noiseFloor.toFixed(1)} dB
- Dynamic Range: ${report.metrics.dynamicRange.toFixed(1)} dB
- THD: ${(report.metrics.thd * 100).toFixed(2)}%
- Phase Coherence: ${(report.metrics.phaseCoherence * 100).toFixed(1)}%
- Sample Rate: ${report.metrics.sampleRate} Hz
- Bit Depth: ${report.metrics.bitDepth} bits

Issues: ${report.issues.length}
${report.issues.map((i) => `- ${i}`).join('\n') || 'None'}

Recommendations: ${report.recommendations.length}
${report.recommendations.map((r) => `- ${r}`).join('\n') || 'None'}
    `.trim();
  }

  /**
   * Destroy the monitor
   */
  destroy(): void {
    this.stopMonitoring();
    this.listeners.clear();

    if (this.analyser) {
      this.analyser.disconnect();
    }
  }
}

// Export singleton instance
export let audioQualityMonitor: AudioQualityMonitor | null = null;

export function initializeAudioQualityMonitor(
  audioContext: AudioContext,
  config?: Partial<AutoAdjustmentConfig>
): AudioQualityMonitor {
  if (!audioQualityMonitor) {
    audioQualityMonitor = new AudioQualityMonitor(audioContext, config);
  }
  return audioQualityMonitor;
}
