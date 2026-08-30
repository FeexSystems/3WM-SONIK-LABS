/**
 * Quality/Performance Presets - Adaptive quality settings for different device capabilities
 * Part of Phase 4.2.2: Create quality/performance presets (low, medium, high, ultra)
 */

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

export interface QualityPresetConfig {
  name: string;
  bufferSize: number;
  targetLatency: number;
  maxDSPNodes: number;
  maxConcurrentPlugins: number;
  enableAudioWorklets: boolean;
  enableParameterSmoothing: boolean;
  smoothingTime: number;
  enableAdvancedDSP: boolean;
  enableRealTimeAnalysis: boolean;
  sampleRate: number;
  cpuBudget: number; // Percentage of CPU budget
}

export const QUALITY_PRESETS: Record<QualityPreset, QualityPresetConfig> = {
  low: {
    name: 'Low Quality',
    bufferSize: 2048,
    targetLatency: 0.05,
    maxDSPNodes: 8,
    maxConcurrentPlugins: 4,
    enableAudioWorklets: false,
    enableParameterSmoothing: false,
    smoothingTime: 0.05,
    enableAdvancedDSP: false,
    enableRealTimeAnalysis: false,
    sampleRate: 44100,
    cpuBudget: 30,
  },
  medium: {
    name: 'Medium Quality',
    bufferSize: 1024,
    targetLatency: 0.025,
    maxDSPNodes: 16,
    maxConcurrentPlugins: 8,
    enableAudioWorklets: true,
    enableParameterSmoothing: true,
    smoothingTime: 0.02,
    enableAdvancedDSP: true,
    enableRealTimeAnalysis: false,
    sampleRate: 48000,
    cpuBudget: 50,
  },
  high: {
    name: 'High Quality',
    bufferSize: 512,
    targetLatency: 0.012,
    maxDSPNodes: 32,
    maxConcurrentPlugins: 12,
    enableAudioWorklets: true,
    enableParameterSmoothing: true,
    smoothingTime: 0.01,
    enableAdvancedDSP: true,
    enableRealTimeAnalysis: true,
    sampleRate: 48000,
    cpuBudget: 70,
  },
  ultra: {
    name: 'Ultra Quality',
    bufferSize: 256,
    targetLatency: 0.006,
    maxDSPNodes: 64,
    maxConcurrentPlugins: 16,
    enableAudioWorklets: true,
    enableParameterSmoothing: true,
    smoothingTime: 0.005,
    enableAdvancedDSP: true,
    enableRealTimeAnalysis: true,
    sampleRate: 48000,
    cpuBudget: 85,
  },
};

export class QualityPresetManager {
  private currentPreset: QualityPreset = 'medium';
  private audioContext: AudioContext | null = null;
  private listeners: Set<(preset: QualityPreset) => void> = new Set();

  constructor(audioContext?: AudioContext) {
    this.audioContext = audioContext || null;
  }

  /**
   * Set the quality preset
   */
  setPreset(preset: QualityPreset): void {
    this.currentPreset = preset;
    this.applyPreset(preset);
    this.notifyListeners();
  }

  /**
   * Get the current quality preset
   */
  getCurrentPreset(): QualityPreset {
    return this.currentPreset;
  }

  /**
   * Get the current preset configuration
   */
  getCurrentConfig(): QualityPresetConfig {
    return QUALITY_PRESETS[this.currentPreset];
  }

  /**
   * Get a specific preset configuration
   */
  getPresetConfig(preset: QualityPreset): QualityPresetConfig {
    return QUALITY_PRESETS[preset];
  }

  /**
   * Apply preset to audio context
   */
  private applyPreset(preset: QualityPreset): void {
    const config = QUALITY_PRESETS[preset];

    if (!this.audioContext) return;

    // Apply buffer size if possible
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    console.log(`Applied quality preset: ${config.name}`);
  }

  /**
   * Auto-select preset based on device capabilities
   */
  autoSelectPreset(
    cpuCores: number,
    memoryGB: number,
    supportsAudioWorklet: boolean
  ): QualityPreset {
    if (cpuCores >= 8 && memoryGB >= 16 && supportsAudioWorklet) {
      this.setPreset('ultra');
    } else if (cpuCores >= 6 && memoryGB >= 8 && supportsAudioWorklet) {
      this.setPreset('high');
    } else if (cpuCores >= 4 && memoryGB >= 4) {
      this.setPreset('medium');
    } else {
      this.setPreset('low');
    }

    return this.currentPreset;
  }

  /**
   * Subscribe to preset changes
   */
  subscribe(listener: (preset: QualityPreset) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentPreset);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of preset change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentPreset));
  }

  /**
   * Check if a feature is enabled in current preset
   */
  isFeatureEnabled(feature: keyof QualityPresetConfig): boolean {
    const config = this.getCurrentConfig();
    const value = config[feature];

    if (typeof value === 'boolean') {
      return value;
    }

    return false;
  }

  /**
   * Get CPU budget for current preset
   */
  getCPUBudget(): number {
    return this.getCurrentConfig().cpuBudget;
  }

  /**
   * Get max DSP nodes for current preset
   */
  getMaxDSPNodes(): number {
    return this.getCurrentConfig().maxDSPNodes;
  }

  /**
   * Get max concurrent plugins for current preset
   */
  getMaxConcurrentPlugins(): number {
    return this.getCurrentConfig().maxConcurrentPlugins;
  }

  /**
   * Get target latency for current preset
   */
  getTargetLatency(): number {
    return this.getCurrentConfig().targetLatency;
  }

  /**
   * Get buffer size for current preset
   */
  getBufferSize(): number {
    return this.getCurrentConfig().bufferSize;
  }

  /**
   * Get smoothing time for current preset
   */
  getSmoothingTime(): number {
    return this.getCurrentConfig().smoothingTime;
  }

  /**
   * Get sample rate for current preset
   */
  getSampleRate(): number {
    return this.getCurrentConfig().sampleRate;
  }

  /**
   * Compare two presets
   */
  comparePresets(preset1: QualityPreset, preset2: QualityPreset): number {
    const presetOrder = ['low', 'medium', 'high', 'ultra'];
    const index1 = presetOrder.indexOf(preset1);
    const index2 = presetOrder.indexOf(preset2);
    return index1 - index2;
  }

  /**
   * Get next higher preset
   */
  getNextHigherPreset(): QualityPreset | null {
    const presetOrder: QualityPreset[] = ['low', 'medium', 'high', 'ultra'];
    const currentIndex = presetOrder.indexOf(this.currentPreset);

    if (currentIndex < presetOrder.length - 1) {
      return presetOrder[currentIndex + 1];
    }

    return null;
  }

  /**
   * Get next lower preset
   */
  getNextLowerPreset(): QualityPreset | null {
    const presetOrder: QualityPreset[] = ['low', 'medium', 'high', 'ultra'];
    const currentIndex = presetOrder.indexOf(this.currentPreset);

    if (currentIndex > 0) {
      return presetOrder[currentIndex - 1];
    }

    return null;
  }

  /**
   * Upgrade to next higher preset if available
   */
  upgradePreset(): boolean {
    const nextPreset = this.getNextHigherPreset();
    if (nextPreset) {
      this.setPreset(nextPreset);
      return true;
    }
    return false;
  }

  /**
   * Downgrade to next lower preset if available
   */
  downgradePreset(): boolean {
    const nextPreset = this.getNextLowerPreset();
    if (nextPreset) {
      this.setPreset(nextPreset);
      return true;
    }
    return false;
  }

  /**
   * Set audio context
   */
  setAudioContext(audioContext: AudioContext): void {
    this.audioContext = audioContext;
    this.applyPreset(this.currentPreset);
  }

  /**
   * Destroy preset manager
   */
  destroy(): void {
    this.listeners.clear();
  }
}

// Export singleton instance
export const qualityPresetManager = new QualityPresetManager();
