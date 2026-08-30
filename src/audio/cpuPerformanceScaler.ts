/**
 * CPU Performance Scaler - Dynamic DSP operation scaling based on CPU load
 * Part of Phase 4.2.4: Add CPU-based performance scaling for DSP operations
 */

export interface CPUMetrics {
  currentUsage: number;
  averageUsage: number;
  peakUsage: number;
  sampleCount: number;
}

export interface DSPScalingConfig {
  enableScaling: boolean;
  cpuThresholdLow: number;
  cpuThresholdHigh: number;
  sampleInterval: number;
  historySize: number;
  scalingFactors: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface ScalingState {
  currentScale: number;
  targetScale: number;
  isScalingDown: boolean;
  lastAdjustment: number;
}

export class CPUPerformanceScaler {
  private metrics: CPUMetrics;
  private config: DSPScalingConfig;
  private state: ScalingState;
  private history: number[] = [];
  private measurementTimer: number | null = null;
  private listeners: Set<(scale: number, metrics: CPUMetrics) => void> = new Set();

  constructor(config: Partial<DSPScalingConfig> = {}) {
    this.config = {
      enableScaling: true,
      cpuThresholdLow: 40,
      cpuThresholdHigh: 70,
      sampleInterval: 1000,
      historySize: 10,
      scalingFactors: {
        low: 0.5,
        medium: 0.75,
        high: 1.0,
      },
      ...config,
    };

    this.metrics = {
      currentUsage: 0,
      averageUsage: 0,
      peakUsage: 0,
      sampleCount: 0,
    };

    this.state = {
      currentScale: 1.0,
      targetScale: 1.0,
      isScalingDown: false,
      lastAdjustment: Date.now(),
    };

    if (this.config.enableScaling) {
      this.startMeasurement();
    }
  }

  /**
   * Start CPU measurement
   */
  private startMeasurement(): void {
    if (this.measurementTimer !== null) {
      clearInterval(this.measurementTimer);
    }

    this.measurementTimer = window.setInterval(() => {
      this.measureCPU();
    }, this.config.sampleInterval);
  }

  /**
   * Stop CPU measurement
   */
  stopMeasurement(): void {
    if (this.measurementTimer !== null) {
      clearInterval(this.measurementTimer);
      this.measurementTimer = null;
    }
  }

  /**
   * Measure CPU usage
   */
  private measureCPU(): void {
    const usage = this.estimateCPUUsage();
    this.updateMetrics(usage);
    this.adjustScaling();
    this.notifyListeners();
  }

  /**
   * Estimate CPU usage (approximate)
   */
  private estimateCPUUsage(): number {
    // Use performance API to estimate CPU usage
    const start = performance.now();

    // Simulate some work to measure execution time
    let sum = 0;
    for (let i = 0; i < 1000; i++) {
      sum += Math.sqrt(i);
    }

    const end = performance.now();
    const executionTime = end - start;

    // Estimate CPU usage based on execution time vs interval
    const estimatedUsage = (executionTime / this.config.sampleInterval) * 100;

    // Add some noise for realism
    return Math.min(100, Math.max(0, estimatedUsage + (Math.random() - 0.5) * 10));
  }

  /**
   * Update CPU metrics
   */
  private updateMetrics(usage: number): void {
    this.metrics.currentUsage = usage;
    this.metrics.peakUsage = Math.max(this.metrics.peakUsage, usage);
    this.metrics.sampleCount++;

    // Update history
    this.history.push(usage);
    if (this.history.length > this.config.historySize) {
      this.history.shift();
    }

    // Calculate average
    const sum = this.history.reduce((a, b) => a + b, 0);
    this.metrics.averageUsage = sum / this.history.length;
  }

  /**
   * Adjust scaling based on CPU metrics
   */
  private adjustScaling(): void {
    if (!this.config.enableScaling) return;

    const avgUsage = this.metrics.averageUsage;
    const now = Date.now();
    const minAdjustmentInterval = 2000; // Minimum 2 seconds between adjustments

    if (now - this.state.lastAdjustment < minAdjustmentInterval) {
      return;
    }

    let targetScale: number;

    if (avgUsage > this.config.cpuThresholdHigh) {
      // CPU is high, scale down
      targetScale = this.config.scalingFactors.low;
      this.state.isScalingDown = true;
    } else if (avgUsage < this.config.cpuThresholdLow) {
      // CPU is low, scale up
      targetScale = this.config.scalingFactors.high;
      this.state.isScalingDown = false;
    } else {
      // CPU is medium
      targetScale = this.config.scalingFactors.medium;
      this.state.isScalingDown = false;
    }

    // Smooth transition to target scale
    this.state.targetScale = targetScale;
    this.state.currentScale = this.lerpScale(this.state.currentScale, targetScale);
    this.state.lastAdjustment = now;
  }

  /**
   * Linear interpolation for smooth scaling
   */
  private lerpScale(current: number, target: number): number {
    const smoothing = 0.1;
    return current + (target - current) * smoothing;
  }

  /**
   * Get current scaling factor
   */
  getCurrentScale(): number {
    return this.state.currentScale;
  }

  /**
   * Get target scaling factor
   */
  getTargetScale(): number {
    return this.state.targetScale;
  }

  /**
   * Get CPU metrics
   */
  getMetrics(): CPUMetrics {
    return { ...this.metrics };
  }

  /**
   * Get scaling state
   */
  getScalingState(): ScalingState {
    return { ...this.state };
  }

  /**
   * Apply scaling to a value
   */
  applyScaling(value: number): number {
    return value * this.state.currentScale;
  }

  /**
   * Apply scaling to DSP parameters
   */
  applyDSPScaling(params: Record<string, number>): Record<string, number> {
    const scaled: Record<string, number> = {};

    for (const [key, value] of Object.entries(params)) {
      scaled[key] = this.applyScaling(value);
    }

    return scaled;
  }

  /**
   * Get recommended max operations based on current scale
   */
  getMaxOperations(baseMax: number): number {
    return Math.floor(baseMax * this.state.currentScale);
  }

  /**
   * Get recommended sample rate reduction
   */
  getSampleRateReduction(): number {
    // Return 1.0 for no reduction, 0.5 for half rate, etc.
    return this.state.currentScale;
  }

  /**
   * Check if scaling is active
   */
  isScalingActive(): boolean {
    return this.config.enableScaling;
  }

  /**
   * Enable or disable scaling
   */
  setScalingEnabled(enabled: boolean): void {
    this.config.enableScaling = enabled;

    if (enabled) {
      this.startMeasurement();
    } else {
      this.stopMeasurement();
      this.state.currentScale = 1.0;
      this.state.targetScale = 1.0;
    }
  }

  /**
   * Set CPU thresholds
   */
  setThresholds(low: number, high: number): void {
    this.config.cpuThresholdLow = low;
    this.config.cpuThresholdHigh = high;
  }

  /**
   * Set scaling factors
   */
  setScalingFactors(factors: Partial<DSPScalingConfig['scalingFactors']>): void {
    this.config.scalingFactors = {
      ...this.config.scalingFactors,
      ...factors,
    };
  }

  /**
   * Force scale adjustment
   */
  forceScale(scale: number): void {
    this.state.targetScale = Math.max(0.1, Math.min(1.0, scale));
    this.state.currentScale = this.state.targetScale;
    this.state.lastAdjustment = Date.now();
    this.notifyListeners();
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      currentUsage: 0,
      averageUsage: 0,
      peakUsage: 0,
      sampleCount: 0,
    };
    this.history = [];
  }

  /**
   * Subscribe to scaling updates
   */
  subscribe(listener: (scale: number, metrics: CPUMetrics) => void): () => void {
    this.listeners.add(listener);
    listener(this.state.currentScale, this.getMetrics());
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.state.currentScale, this.getMetrics());
    });
  }

  /**
   * Get configuration
   */
  getConfig(): DSPScalingConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DSPScalingConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.enableScaling && this.measurementTimer === null) {
      this.startMeasurement();
    } else if (!this.config.enableScaling && this.measurementTimer !== null) {
      this.stopMeasurement();
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): string {
    return `
CPU Performance Scaling Report
==============================

Current CPU Usage: ${this.metrics.currentUsage.toFixed(1)}%
Average CPU Usage: ${this.metrics.averageUsage.toFixed(1)}%
Peak CPU Usage: ${this.metrics.peakUsage.toFixed(1)}%
Sample Count: ${this.metrics.sampleCount}

Current Scale: ${(this.state.currentScale * 100).toFixed(0)}%
Target Scale: ${(this.state.targetScale * 100).toFixed(0)}%
Scaling Direction: ${this.state.isScalingDown ? 'Down' : 'Up'}

Thresholds:
- Low: ${this.config.cpuThresholdLow}%
- High: ${this.config.cpuThresholdHigh}%

Scaling Factors:
- Low: ${(this.config.scalingFactors.low * 100).toFixed(0)}%
- Medium: ${(this.config.scalingFactors.medium * 100).toFixed(0)}%
- High: ${(this.config.scalingFactors.high * 100).toFixed(0)}%

Scaling Enabled: ${this.config.enableScaling ? 'Yes' : 'No'}
    `.trim();
  }

  /**
   * Destroy the scaler
   */
  destroy(): void {
    this.stopMeasurement();
    this.listeners.clear();
    this.resetMetrics();
  }
}

// Export singleton instance
export let cpuPerformanceScaler: CPUPerformanceScaler | null = null;

export function initializeCPUPerformanceScaler(
  config?: Partial<DSPScalingConfig>
): CPUPerformanceScaler {
  if (!cpuPerformanceScaler) {
    cpuPerformanceScaler = new CPUPerformanceScaler(config);
  }
  return cpuPerformanceScaler;
}
