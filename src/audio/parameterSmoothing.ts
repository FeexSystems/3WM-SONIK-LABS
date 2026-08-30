/**
 * Parameter Smoothing Engine - Glitch-free automation
 * Part of Phase 4.1.4: Add parameter smoothing for glitch-free automation
 */

export enum RampType {
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  LOGARITHMIC = 'logarithmic',
}

export interface ParameterSmoother {
  targetValue: number;
  currentValue: number;
  smoothingTime: number;
  sampleRate: number;
  rampType: RampType;
  startTime: number;
  isSmoothing: boolean;
}

export class ParameterSmoothingEngine {
  private smoothers: Map<string, ParameterSmoother>;
  private audioContext: AudioContext;
  private updateInterval: number = 128; // Update every 128 samples

  constructor(audioContext: AudioContext) {
    this.smoothers = new Map();
    this.audioContext = audioContext;
  }

  /**
   * Create a parameter smoother
   */
  createSmoother(
    parameterId: string,
    initialValue: number,
    smoothingTime: number = 0.01,
    rampType: RampType = RampType.LINEAR
  ): void {
    const smoother: ParameterSmoother = {
      targetValue: initialValue,
      currentValue: initialValue,
      smoothingTime,
      sampleRate: this.audioContext.sampleRate,
      rampType,
      startTime: this.audioContext.currentTime,
      isSmoothing: false,
    };

    this.smoothers.set(parameterId, smoother);
  }

  /**
   * Set target value for a parameter
   */
  setTargetValue(parameterId: string, targetValue: number, smoothingTime?: number): void {
    const smoother = this.smoothers.get(parameterId);
    if (!smoother) {
      console.warn(`Smoother for parameter ${parameterId} not found`);
      return;
    }

    smoother.targetValue = targetValue;
    smoother.startTime = this.audioContext.currentTime;
    smoother.isSmoothing = true;

    if (smoothingTime !== undefined) {
      smoother.smoothingTime = smoothingTime;
    }
  }

  /**
   * Get current smoothed value for a parameter
   */
  getCurrentValue(parameterId: string): number {
    const smoother = this.smoothers.get(parameterId);
    if (!smoother) return 0;

    if (!smoother.isSmoothing) {
      return smoother.currentValue;
    }

    const elapsed = this.audioContext.currentTime - smoother.startTime;
    const progress = Math.min(elapsed / smoother.smoothingTime, 1);

    if (progress >= 1) {
      smoother.currentValue = smoother.targetValue;
      smoother.isSmoothing = false;
      return smoother.currentValue;
    }

    switch (smoother.rampType) {
      case RampType.LINEAR:
        smoother.currentValue = this.linearRamp(
          smoother.currentValue,
          smoother.targetValue,
          progress
        );
        break;

      case RampType.EXPONENTIAL:
        smoother.currentValue = this.exponentialRamp(
          smoother.currentValue,
          smoother.targetValue,
          progress
        );
        break;

      case RampType.LOGARITHMIC:
        smoother.currentValue = this.logarithmicRamp(
          smoother.currentValue,
          smoother.targetValue,
          progress
        );
        break;
    }

    return smoother.currentValue;
  }

  /**
   * Linear ramp
   */
  private linearRamp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  /**
   * Exponential ramp
   */
  private exponentialRamp(start: number, end: number, progress: number): number {
    // Handle zero and negative values
    if (start <= 0 || end <= 0) {
      return this.linearRamp(start, end, progress);
    }

    const ratio = end / start;
    return start * Math.pow(ratio, progress);
  }

  /**
   * Logarithmic ramp
   */
  private logarithmicRamp(start: number, end: number, progress: number): number {
    // Handle zero and negative values
    if (start <= 0 || end <= 0) {
      return this.linearRamp(start, end, progress);
    }

    const logStart = Math.log(start);
    const logEnd = Math.log(end);
    const logCurrent = logStart + (logEnd - logStart) * progress;
    return Math.exp(logCurrent);
  }

  /**
   * Check if a parameter is currently smoothing
   */
  isSmoothing(parameterId: string): boolean {
    const smoother = this.smoothers.get(parameterId);
    return smoother ? smoother.isSmoothing : false;
  }

  /**
   * Get smoothing progress (0 to 1)
   */
  getSmoothingProgress(parameterId: string): number {
    const smoother = this.smoothers.get(parameterId);
    if (!smoother || !smoother.isSmoothing) return 1;

    const elapsed = this.audioContext.currentTime - smoother.startTime;
    return Math.min(elapsed / smoother.smoothingTime, 1);
  }

  /**
   * Update all smoothers (called each audio frame)
   */
  process(): void {
    this.smoothers.forEach((smoother, parameterId) => {
      this.getCurrentValue(parameterId);
    });
  }

  /**
   * Remove a parameter smoother
   */
  removeSmoother(parameterId: string): void {
    this.smoothers.delete(parameterId);
  }

  /**
   * Clear all smoothers
   */
  clearAll(): void {
    this.smoothers.clear();
  }

  /**
   * Get all smoother IDs
   */
  getSmootherIds(): string[] {
    return Array.from(this.smoothers.keys());
  }

  /**
   * Get smoother info
   */
  getSmootherInfo(parameterId: string): ParameterSmoother | undefined {
    const smoother = this.smoothers.get(parameterId);
    if (!smoother) return undefined;

    return {
      ...smoother,
      currentValue: this.getCurrentValue(parameterId),
    };
  }

  /**
   * Set ramp type for a parameter
   */
  setRampType(parameterId: string, rampType: RampType): void {
    const smoother = this.smoothers.get(parameterId);
    if (smoother) {
      smoother.rampType = rampType;
    }
  }

  /**
   * Set smoothing time for a parameter
   */
  setSmoothingTime(parameterId: string, smoothingTime: number): void {
    const smoother = this.smoothers.get(parameterId);
    if (smoother) {
      smoother.smoothingTime = smoothingTime;
    }
  }

  /**
   * Force immediate value (skip smoothing)
   */
  forceValue(parameterId: string, value: number): void {
    const smoother = this.smoothers.get(parameterId);
    if (smoother) {
      smoother.currentValue = value;
      smoother.targetValue = value;
      smoother.isSmoothing = false;
    }
  }

  /**
   * Destroy the smoothing engine
   */
  destroy(): void {
    this.clearAll();
  }
}

/**
 * Utility function to smooth AudioParam values
 */
export function smoothAudioParam(
  audioParam: AudioParam,
  targetValue: number,
  smoothingTime: number,
  audioContext: AudioContext,
  rampType: RampType = RampType.LINEAR
): void {
  const currentTime = audioContext.currentTime;

  switch (rampType) {
    case RampType.LINEAR:
      audioParam.linearRampToValueAtTime(targetValue, currentTime + smoothingTime);
      break;

    case RampType.EXPONENTIAL:
      // Exponential ramp requires positive values
      if (targetValue > 0 && audioParam.value > 0) {
        audioParam.exponentialRampToValueAtTime(targetValue, currentTime + smoothingTime);
      } else {
        audioParam.linearRampToValueAtTime(targetValue, currentTime + smoothingTime);
      }
      break;

    case RampType.LOGARITHMIC:
      // Web Audio doesn't have native logarithmic ramp, use linear as fallback
      audioParam.linearRampToValueAtTime(targetValue, currentTime + smoothingTime);
      break;
  }
}

/**
 * Utility function to cancel scheduled parameter changes
 */
export function cancelScheduledParamChanges(
  audioParam: AudioParam,
  audioContext: AudioContext
): void {
  audioParam.cancelScheduledValues(audioContext.currentTime);
  audioParam.setValueAtTime(audioParam.value, audioContext.currentTime);
}
