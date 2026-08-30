/**
 * 3WM SONIK — Data Visualization System
 * Real-time data visualization for Emar avatar
 */

export interface DataVisualizationParams {
  updateRate: number; // Update rate in Hz (1 - 60)
  smoothing: number; // Smoothing factor (0 - 1)
  maxDataPoints: number; // Maximum data points to display
  color: string; // Visualization color
  backgroundColor: string; // Background color
  showGrid: boolean; // Show grid lines
  showLabels: boolean; // Show axis labels
}

export interface DataPoint {
  value: number;
  timestamp: number;
  label?: string;
}

export interface VisualizationData {
  frequency: DataPoint[];
  amplitude: DataPoint[];
  phase: DataPoint[];
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
}

export class DataVisualizationSystem {
  private analyser: AnalyserNode | null = null;
  private frequencyData: Uint8Array | null = null;
  private timeData: Float32Array | null = null;
  private params: DataVisualizationParams;
  private dataHistory: VisualizationData[] = [];
  private isInitialized: boolean = false;
  private lastUpdateTime: number = 0;

  constructor(params: Partial<DataVisualizationParams> = {}) {
    this.params = {
      updateRate: params.updateRate ?? 30,
      smoothing: params.smoothing ?? 0.3,
      maxDataPoints: params.maxDataPoints ?? 100,
      color: params.color ?? '#2AFFA3',
      backgroundColor: params.backgroundColor ?? '#0D0D0D',
      showGrid: params.showGrid ?? true,
      showLabels: params.showLabels ?? true,
    };
  }

  initialize(analyser: AnalyserNode): void {
    this.analyser = analyser;
    this.analyser.fftSize = 2048;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Float32Array(this.analyser.frequencyBinCount);
    this.isInitialized = true;
  }

  /**
   * Update visualization data
   */
  update(): VisualizationData | null {
    if (!this.isInitialized || !this.analyser || !this.frequencyData || !this.timeData) {
      return null;
    }

    const now = performance.now();
    const updateInterval = 1000 / this.params.updateRate;

    if (now - this.lastUpdateTime < updateInterval) {
      return this.dataHistory[this.dataHistory.length - 1] || null;
    }

    this.lastUpdateTime = now;

    // Get audio data
    this.analyser.getByteFrequencyData(this.frequencyData as any);
    this.analyser.getFloatTimeDomainData(this.timeData as any);

    // Calculate visualization data
    const data = this.calculateVisualizationData();

    // Add to history
    this.dataHistory.push(data);
    if (this.dataHistory.length > this.params.maxDataPoints) {
      this.dataHistory.shift();
    }

    return data;
  }

  /**
   * Calculate visualization data from audio
   */
  private calculateVisualizationData(): VisualizationData {
    const frequency: DataPoint[] = [];
    const amplitude: DataPoint[] = [];
    const phase: DataPoint[] = [];

    // Frequency data
    for (let i = 0; i < this.frequencyData!.length; i++) {
      frequency.push({
        value: this.frequencyData![i] / 255,
        timestamp: performance.now(),
        label: `${((i * this.analyser!.context.sampleRate) / this.analyser!.fftSize).toFixed(0)}Hz`,
      });
    }

    // Amplitude data (RMS)
    let sum = 0;
    for (let i = 0; i < this.timeData!.length; i++) {
      sum += this.timeData![i] * this.timeData![i];
    }
    const rms = Math.sqrt(sum / this.timeData!.length);
    amplitude.push({
      value: rms,
      timestamp: performance.now(),
    });

    // Phase data (simplified)
    for (let i = 0; i < Math.min(50, this.timeData!.length); i++) {
      phase.push({
        value: Math.atan2(
          this.timeData![i],
          this.timeData![Math.min(i + 1, this.timeData!.length - 1)]
        ),
        timestamp: performance.now(),
      });
    }

    // Calculate spectral features
    const spectralCentroid = this.calculateSpectralCentroid();
    const spectralRolloff = this.calculateSpectralRolloff();
    const zeroCrossingRate = this.calculateZeroCrossingRate();

    return {
      frequency,
      amplitude,
      phase,
      spectralCentroid,
      spectralRolloff,
      zeroCrossingRate,
    };
  }

  /**
   * Calculate spectral centroid (brightness)
   */
  private calculateSpectralCentroid(): number {
    if (!this.frequencyData) return 0;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < this.frequencyData.length; i++) {
      const magnitude = this.frequencyData[i];
      numerator += i * magnitude;
      denominator += magnitude;
    }

    return denominator > 0 ? numerator / denominator / this.frequencyData.length : 0;
  }

  /**
   * Calculate spectral rolloff (frequency below which 85% of energy is contained)
   */
  private calculateSpectralRolloff(): number {
    if (!this.frequencyData) return 0;

    const totalEnergy = this.frequencyData.reduce((sum, val) => sum + val, 0);
    const targetEnergy = totalEnergy * 0.85;
    let cumulativeEnergy = 0;

    for (let i = 0; i < this.frequencyData.length; i++) {
      cumulativeEnergy += this.frequencyData[i];
      if (cumulativeEnergy >= targetEnergy) {
        return i / this.frequencyData.length;
      }
    }

    return 1;
  }

  /**
   * Calculate zero-crossing rate
   */
  private calculateZeroCrossingRate(): number {
    if (!this.timeData) return 0;

    let crossings = 0;
    for (let i = 1; i < this.timeData.length; i++) {
      if (
        (this.timeData[i] >= 0 && this.timeData[i - 1] < 0) ||
        (this.timeData[i] < 0 && this.timeData[i - 1] >= 0)
      ) {
        crossings++;
      }
    }

    return crossings / this.timeData.length;
  }

  /**
   * Get formatted data for visualization
   */
  getVisualizationData(): {
    frequency: number[];
    amplitude: number[];
    phase: number[];
    spectralCentroid: number;
    spectralRolloff: number;
    zeroCrossingRate: number;
  } | null {
    const data = this.update();
    if (!data) return null;

    return {
      frequency: data.frequency.map((p) => p.value),
      amplitude: data.amplitude.map((p) => p.value),
      phase: data.phase.map((p) => p.value),
      spectralCentroid: data.spectralCentroid,
      spectralRolloff: data.spectralRolloff,
      zeroCrossingRate: data.zeroCrossingRate,
    };
  }

  /**
   * Get historical data for time-series visualization
   */
  getHistoricalData(type: 'frequency' | 'amplitude' | 'phase'): number[][] {
    return this.dataHistory.map((data) => {
      switch (type) {
        case 'frequency':
          return data.frequency.map((p) => p.value);
        case 'amplitude':
          return data.amplitude.map((p) => p.value);
        case 'phase':
          return data.phase.map((p) => p.value);
        default:
          return [];
      }
    });
  }

  /**
   * Get data for 3D visualization (e.g., floating data cubes around Emar)
   */
  get3DVisualizationData(): {
    cubes: Array<{
      position: [number, number, number];
      scale: number;
      color: string;
      rotationSpeed: number;
    }>;
    rings: Array<{
      radius: number;
      rotation: number;
      intensity: number;
    }>;
  } {
    const data = this.update();
    if (!data) {
      return { cubes: [], rings: [] };
    }

    // Generate floating data cubes based on frequency data
    const cubes: Array<{
      position: [number, number, number];
      scale: number;
      color: string;
      rotationSpeed: number;
    }> = [];

    const numCubes = 8;
    for (let i = 0; i < numCubes; i++) {
      const freqIndex = Math.floor((i / numCubes) * (data.frequency.length || 1));
      const value = data.frequency[freqIndex]?.value || 0;

      const angle = (i / numCubes) * Math.PI * 2;
      const radius = 0.5 + value * 0.3;

      cubes.push({
        position: [
          Math.cos(angle) * radius,
          0.3 + Math.sin(performance.now() / 1000 + i) * 0.1,
          Math.sin(angle) * radius,
        ],
        scale: 0.1 + value * 0.2,
        color: this.params.color,
        rotationSpeed: 0.01 + value * 0.05,
      });
    }

    // Generate data rings based on spectral features
    const rings: Array<{
      radius: number;
      rotation: number;
      intensity: number;
    }> = [];

    rings.push({
      radius: 0.4 + data.spectralCentroid * 0.3,
      rotation: performance.now() / 2000,
      intensity: data.spectralCentroid,
    });

    rings.push({
      radius: 0.6 + data.spectralRolloff * 0.2,
      rotation: -performance.now() / 2500,
      intensity: data.spectralRolloff,
    });

    return { cubes, rings };
  }

  setParams(params: Partial<DataVisualizationParams>): void {
    this.params = { ...this.params, ...params };
  }

  getParams(): DataVisualizationParams {
    return { ...this.params };
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  clearHistory(): void {
    this.dataHistory = [];
  }
}

/**
 * Advanced data visualization with pattern recognition
 */
export class AdvancedDataVisualization extends DataVisualizationSystem {
  private patterns: string[] = [];
  private patternHistory: string[] = [];

  /**
   * Detect audio patterns
   */
  detectPatterns(): string[] {
    const data = this.update();
    if (!data) return [];

    const detectedPatterns: string[] = [];

    // Detect steady tone
    if (data.spectralCentroid > 0.7 && data.zeroCrossingRate < 0.1) {
      detectedPatterns.push('steady_tone');
    }

    // Detect rhythmic pattern
    if (data.amplitude.length > 10) {
      const variance = this.calculateVariance(data.amplitude.map((p) => p.value));
      if (variance > 0.3 && variance < 0.7) {
        detectedPatterns.push('rhythmic');
      }
    }

    // Detect noise
    if (data.spectralCentroid > 0.8 && data.zeroCrossingRate > 0.5) {
      detectedPatterns.push('noise');
    }

    // Detect harmonic content
    if (data.spectralRolloff > 0.6 && data.spectralCentroid < 0.5) {
      detectedPatterns.push('harmonic');
    }

    this.patterns = detectedPatterns;
    this.patternHistory.push(detectedPatterns.join(','));
    if (this.patternHistory.length > 20) {
      this.patternHistory.shift();
    }

    return detectedPatterns;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getPatterns(): string[] {
    return this.patterns;
  }

  getPatternHistory(): string[] {
    return [...this.patternHistory];
  }
}
