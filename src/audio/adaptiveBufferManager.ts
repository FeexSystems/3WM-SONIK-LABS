/**
 * Adaptive Buffer Manager - Dynamic buffer size adjustment based on device capabilities
 * Part of Phase 4.2.3: Implement adaptive buffer size adjustment based on device capabilities
 */

import { QualityPreset } from './qualityPresets';

export interface BufferMetrics {
  currentBufferSize: number;
  currentLatency: number;
  targetLatency: number;
  cpuUsage: number;
  dropoutCount: number;
  glitchDetected: boolean;
}

export interface AdaptiveBufferConfig {
  minBufferSize: number;
  maxBufferSize: number;
  targetLatency: number;
  cpuThreshold: number;
  dropoutThreshold: number;
  adjustmentInterval: number;
  enableAutoAdjustment: boolean;
}

export class AdaptiveBufferManager {
  private audioContext: AudioContext | null = null;
  private currentBufferSize: number = 512;
  private metrics: BufferMetrics;
  private config: AdaptiveBufferConfig;
  private adjustmentTimer: number | null = null;
  private listeners: Set<(metrics: BufferMetrics) => void> = new Set();
  private dropoutCount: number = 0;
  private lastCpuMeasurement: number = 0;

  constructor(audioContext: AudioContext, config: Partial<AdaptiveBufferConfig> = {}) {
    this.audioContext = audioContext;
    this.currentBufferSize = this.detectCurrentBufferSize();

    this.config = {
      minBufferSize: 128,
      maxBufferSize: 4096,
      targetLatency: 0.01,
      cpuThreshold: 80,
      dropoutThreshold: 3,
      adjustmentInterval: 5000,
      enableAutoAdjustment: true,
      ...config,
    };

    this.metrics = {
      currentBufferSize: this.currentBufferSize,
      currentLatency: this.calculateLatency(this.currentBufferSize),
      targetLatency: this.config.targetLatency,
      cpuUsage: 0,
      dropoutCount: 0,
      glitchDetected: false,
    };

    if (this.config.enableAutoAdjustment) {
      this.startAutoAdjustment();
    }
  }

  /**
   * Detect current buffer size from audio context
   */
  private detectCurrentBufferSize(): number {
    if (!this.audioContext) return 512;

    // Web Audio API doesn't expose buffer size directly
    // Estimate based on base latency
    if (this.audioContext.baseLatency !== undefined) {
      const estimatedSize = Math.round(
        this.audioContext.baseLatency * this.audioContext.sampleRate
      );
      return Math.max(128, Math.min(4096, this.powerOfTwo(estimatedSize)));
    }

    return 512;
  }

  /**
   * Round to nearest power of 2
   */
  private powerOfTwo(value: number): number {
    return Math.pow(2, Math.round(Math.log2(value)));
  }

  /**
   * Calculate latency for a given buffer size
   */
  private calculateLatency(bufferSize: number): number {
    if (!this.audioContext) return 0;
    return bufferSize / this.audioContext.sampleRate;
  }

  /**
   * Start automatic buffer adjustment
   */
  private startAutoAdjustment(): void {
    if (this.adjustmentTimer !== null) {
      clearInterval(this.adjustmentTimer);
    }

    this.adjustmentTimer = window.setInterval(() => {
      this.adjustBuffer();
    }, this.config.adjustmentInterval);
  }

  /**
   * Stop automatic buffer adjustment
   */
  stopAutoAdjustment(): void {
    if (this.adjustmentTimer !== null) {
      clearInterval(this.adjustmentTimer);
      this.adjustmentTimer = null;
    }
  }

  /**
   * Adjust buffer size based on metrics
   */
  private adjustBuffer(): void {
    if (!this.config.enableAutoAdjustment) return;

    const cpuUsage = this.measureCPUUsage();
    this.metrics.cpuUsage = cpuUsage;

    // Check for dropouts
    if (this.metrics.dropoutCount >= this.config.dropoutThreshold) {
      this.increaseBufferSize();
      this.metrics.dropoutCount = 0;
      return;
    }

    // Adjust based on CPU usage
    if (cpuUsage > this.config.cpuThreshold) {
      this.increaseBufferSize();
    } else if (cpuUsage < this.config.cpuThreshold * 0.6) {
      this.decreaseBufferSize();
    }

    this.notifyListeners();
  }

  /**
   * Measure CPU usage (approximate)
   */
  private measureCPUUsage(): number {
    // Use performance API to estimate CPU usage
    const now = performance.now();

    if (this.lastCpuMeasurement === 0) {
      this.lastCpuMeasurement = now;
      return 0;
    }

    // This is a rough approximation
    // In a real implementation, you'd use more sophisticated measurement
    const elapsed = now - this.lastCpuMeasurement;
    this.lastCpuMeasurement = now;

    // Return a simulated value for now
    // In production, this would use actual audio worklet timing
    return Math.random() * 30 + 20; // 20-50% simulated
  }

  /**
   * Increase buffer size to reduce CPU load
   */
  private increaseBufferSize(): void {
    const newSize = Math.min(this.config.maxBufferSize, this.currentBufferSize * 2);

    if (newSize !== this.currentBufferSize) {
      this.setBufferSize(newSize);
      console.log(`Increased buffer size to ${newSize} (CPU high)`);
    }
  }

  /**
   * Decrease buffer size to reduce latency
   */
  private decreaseBufferSize(): void {
    const newSize = Math.max(this.config.minBufferSize, this.currentBufferSize / 2);

    if (newSize !== this.currentBufferSize) {
      this.setBufferSize(newSize);
      console.log(`Decreased buffer size to ${newSize} (CPU low)`);
    }
  }

  /**
   * Set buffer size
   */
  private setBufferSize(size: number): void {
    this.currentBufferSize = this.powerOfTwo(size);
    this.metrics.currentBufferSize = this.currentBufferSize;
    this.metrics.currentLatency = this.calculateLatency(this.currentBufferSize);

    // Note: Web Audio API doesn't allow changing buffer size dynamically
    // This would require recreating the audio context in a real implementation
    // For now, we track the desired size for future context recreation
  }

  /**
   * Report a dropout/glitch
   */
  reportDropout(): void {
    this.metrics.dropoutCount++;
    this.metrics.glitchDetected = true;
    console.warn(`Audio dropout detected. Total: ${this.metrics.dropoutCount}`);
  }

  /**
   * Reset dropout counter
   */
  resetDropoutCounter(): void {
    this.metrics.dropoutCount = 0;
    this.metrics.glitchDetected = false;
  }

  /**
   * Get current metrics
   */
  getMetrics(): BufferMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current buffer size
   */
  getCurrentBufferSize(): number {
    return this.currentBufferSize;
  }

  /**
   * Get current latency
   */
  getCurrentLatency(): number {
    return this.metrics.currentLatency;
  }

  /**
   * Set target latency
   */
  setTargetLatency(latency: number): void {
    this.config.targetLatency = latency;
    this.metrics.targetLatency = latency;

    // Adjust buffer size to meet target
    if (!this.audioContext) return;

    const targetBufferSize = Math.round(latency * this.audioContext.sampleRate);
    const adjustedSize = this.powerOfTwo(targetBufferSize);

    if (adjustedSize >= this.config.minBufferSize && adjustedSize <= this.config.maxBufferSize) {
      this.setBufferSize(adjustedSize);
    }
  }

  /**
   * Set quality preset
   */
  setQualityPreset(preset: QualityPreset): void {
    const presetMap: Record<QualityPreset, number> = {
      low: 2048,
      medium: 1024,
      high: 512,
      ultra: 256,
    };

    const targetSize = presetMap[preset];
    this.setBufferSize(targetSize);
  }

  /**
   * Enable or disable auto adjustment
   */
  setAutoAdjustment(enabled: boolean): void {
    this.config.enableAutoAdjustment = enabled;

    if (enabled) {
      this.startAutoAdjustment();
    } else {
      this.stopAutoAdjustment();
    }
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(listener: (metrics: BufferMetrics) => void): () => void {
    this.listeners.add(listener);
    listener(this.getMetrics());
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getMetrics()));
  }

  /**
   * Get configuration
   */
  getConfig(): AdaptiveBufferConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AdaptiveBufferConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.enableAutoAdjustment && this.adjustmentTimer === null) {
      this.startAutoAdjustment();
    } else if (!this.config.enableAutoAdjustment && this.adjustmentTimer !== null) {
      this.stopAutoAdjustment();
    }
  }

  /**
   * Force buffer size adjustment
   */
  forceAdjustment(): void {
    this.adjustBuffer();
  }

  /**
   * Destroy the buffer manager
   */
  destroy(): void {
    this.stopAutoAdjustment();
    this.listeners.clear();
  }
}

// Export singleton instance
export let adaptiveBufferManager: AdaptiveBufferManager | null = null;

export function initializeAdaptiveBufferManager(
  audioContext: AudioContext,
  config?: Partial<AdaptiveBufferConfig>
): AdaptiveBufferManager {
  if (!adaptiveBufferManager) {
    adaptiveBufferManager = new AdaptiveBufferManager(audioContext, config);
  }
  return adaptiveBufferManager;
}
