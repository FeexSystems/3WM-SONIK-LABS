/**
 * 3WM SONIK — Gesture System
 * Audio-driven gesture animations for Ricky avatar
 */

export interface GestureParams {
  sensitivity: number; // Sensitivity to audio (0.1 - 2.0)
  smoothing: number; // Smoothing factor (0 - 1)
  threshold: number; // Audio threshold for gestures (0 - 1)
  gestureIntensity: number; // Maximum gesture intensity (0 - 1)
  transitionSpeed: number; // Speed of gesture transitions (0 - 1)
}

export type GestureType =
  | 'idle'
  | 'bounce'
  | 'wave'
  | 'point'
  | 'thumbs_up'
  | 'fist_pump'
  | 'head_nod'
  | 'head_shake'
  | 'body_sway'
  | 'celebrate';

export interface Gesture {
  type: GestureType;
  intensity: number;
  duration: number;
  startTime: number;
}

export class GestureSystem {
  private analyser: AnalyserNode | null = null;
  private audioData: Float32Array<ArrayBuffer> | null = null;
  private params: GestureParams;
  private currentGesture: Gesture | null = null;
  private gestureQueue: Gesture[] = [];
  private isInitialized = false;
  private lastBeatTime = 0;
  private bpm = 120;

  constructor(params: Partial<GestureParams> = {}) {
    this.params = {
      sensitivity: params.sensitivity ?? 1.0,
      smoothing: params.smoothing ?? 0.4,
      threshold: params.threshold ?? 0.15,
      gestureIntensity: params.gestureIntensity ?? 0.7,
      transitionSpeed: params.transitionSpeed ?? 0.5,
    };
  }

  initialize(analyser: AnalyserNode): void {
    this.analyser = analyser;
    this.analyser.fftSize = 512;
    this.audioData = new Float32Array(this.analyser.frequencyBinCount);
    this.isInitialized = true;
  }

  /**
   * Analyze audio and detect beats for gesture triggering
   */
  private detectBeat(): boolean {
    if (!this.isInitialized || !this.analyser || !this.audioData) {
      return false;
    }

    this.analyser.getFloatTimeDomainData(this.audioData);

    // Calculate RMS
    let sum = 0;
    for (const value of this.audioData) {
      sum += value * value;
    }
    const rms = Math.sqrt(sum / this.audioData.length);

    // Apply sensitivity and threshold
    const amplifiedRms = rms * this.params.sensitivity;
    const isBeat = amplifiedRms > this.params.threshold;

    const now = performance.now();
    const minBeatInterval = 60000 / this.bpm; // Minimum time between beats

    if (isBeat && now - this.lastBeatTime > minBeatInterval) {
      this.lastBeatTime = now;
      return true;
    }

    return false;
  }

  /**
   * Update gesture system and return current gesture state
   */
  update(): Gesture | null {
    if (!this.isInitialized) return null;

    // Detect beats for gesture triggering
    if (this.detectBeat()) {
      this.triggerRandomGesture();
    }

    // Update current gesture
    if (this.currentGesture) {
      const now = performance.now();
      const elapsed = (now - this.currentGesture.startTime) / 1000;

      if (elapsed > this.currentGesture.duration) {
        this.currentGesture = null;
        // Start next gesture in queue
        if (this.gestureQueue.length > 0) {
          this.currentGesture = this.gestureQueue.shift()!;
          this.currentGesture.startTime = performance.now();
        }
      } else {
        // Update intensity based on progress
        const progress = elapsed / this.currentGesture.duration;
        this.currentGesture.intensity = this.calculateGestureIntensity(
          this.currentGesture.type,
          progress
        );
      }
    }

    return this.currentGesture;
  }

  /**
   * Calculate gesture intensity over time
   */
  private calculateGestureIntensity(type: GestureType, progress: number): number {
    const maxIntensity = this.params.gestureIntensity;

    switch (type) {
      case 'bounce':
        // Sine wave intensity
        return Math.sin(progress * Math.PI * 2) * maxIntensity;
      case 'wave':
        // Smooth rise and fall
        return Math.sin(progress * Math.PI) * maxIntensity;
      case 'point':
        // Sharp peak
        return progress < 0.3
          ? (progress / 0.3) * maxIntensity
          : ((1 - progress) / 0.7) * maxIntensity;
      case 'thumbs_up':
        // Gradual rise
        return Math.min(1, progress * 2) * maxIntensity;
      case 'fist_pump':
        // Repeated peaks
        return Math.sin(progress * Math.PI * 4) * maxIntensity;
      case 'head_nod':
        // Gentle oscillation
        return Math.sin(progress * Math.PI * 3) * maxIntensity * 0.5;
      case 'head_shake':
        // Side-to-side oscillation
        return Math.sin(progress * Math.PI * 6) * maxIntensity * 0.3;
      case 'body_sway':
        // Slow, continuous movement
        return Math.sin(progress * Math.PI) * maxIntensity * 0.4;
      case 'celebrate':
        // High energy, multiple peaks
        return Math.sin(progress * Math.PI * 8) * maxIntensity;
      default:
        return maxIntensity;
    }
  }

  /**
   * Trigger a random gesture based on audio characteristics
   */
  private triggerRandomGesture(): void {
    if (this.currentGesture) return; // Don't interrupt current gesture

    const gestures: GestureType[] = ['bounce', 'wave', 'head_nod', 'body_sway'];

    // Add more energetic gestures for high-energy audio
    const energyLevel = this.getEnergyLevel();
    if (energyLevel > 0.7) {
      gestures.push('fist_pump', 'celebrate');
    }

    const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
    const duration = this.getGestureDuration(randomGesture);

    this.currentGesture = {
      type: randomGesture,
      intensity: 0,
      duration,
      startTime: performance.now(),
    };
  }

  /**
   * Get current energy level from audio
   */
  private getEnergyLevel(): number {
    if (!this.isInitialized || !this.analyser || !this.audioData) {
      return 0;
    }

    this.analyser.getFloatFrequencyData(this.audioData);

    let sum = 0;
    for (const value of this.audioData) {
      sum += value;
    }

    return Math.min(1, (sum / this.audioData.length) * this.params.sensitivity);
  }

  /**
   * Get appropriate duration for gesture type
   */
  private getGestureDuration(type: GestureType): number {
    switch (type) {
      case 'bounce':
        return 0.5;
      case 'wave':
        return 1.0;
      case 'point':
        return 0.3;
      case 'thumbs_up':
        return 0.8;
      case 'fist_pump':
        return 0.4;
      case 'head_nod':
        return 0.6;
      case 'head_shake':
        return 0.5;
      case 'body_sway':
        return 1.5;
      case 'celebrate':
        return 1.2;
      default:
        return 0.5;
    }
  }

  /**
   * Queue a specific gesture
   */
  queueGesture(type: GestureType, duration?: number): void {
    const gestureDuration = duration ?? this.getGestureDuration(type);
    this.gestureQueue.push({
      type,
      intensity: 0,
      duration: gestureDuration,
      startTime: 0, // Will be set when started
    });
  }

  /**
   * Trigger a specific gesture immediately
   */
  triggerGesture(type: GestureType, duration?: number): void {
    const gestureDuration = duration ?? this.getGestureDuration(type);
    this.currentGesture = {
      type,
      intensity: 0,
      duration: gestureDuration,
      startTime: performance.now(),
    };
  }

  /**
   * Get transform values for current gesture
   * Returns position, rotation, and scale modifications
   */
  getGestureTransforms(): {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  } {
    const gesture = this.currentGesture;
    if (!gesture) {
      return { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
    }

    const intensity = gesture.intensity;

    switch (gesture.type) {
      case 'bounce':
        return {
          position: [0, intensity * 0.2, 0],
          rotation: [0, 0, 0],
          scale: [1, 1 + intensity * 0.1, 1],
        };
      case 'wave':
        return {
          position: [0, 0, 0],
          rotation: [0, intensity * 0.5, intensity * 0.3],
          scale: [1, 1, 1],
        };
      case 'point':
        return {
          position: [intensity * 0.1, intensity * 0.1, intensity * 0.2],
          rotation: [-intensity * 0.2, intensity * 0.3, 0],
          scale: [1, 1, 1],
        };
      case 'thumbs_up':
        return {
          position: [0, intensity * 0.15, 0],
          rotation: [-intensity * 0.5, 0, 0],
          scale: [1, 1, 1],
        };
      case 'fist_pump':
        return {
          position: [0, intensity * 0.3, 0],
          rotation: [intensity * 0.3, 0, intensity * 0.2],
          scale: [1 + intensity * 0.1, 1, 1],
        };
      case 'head_nod':
        return {
          position: [0, 0, 0],
          rotation: [intensity * 0.4, 0, 0],
          scale: [1, 1, 1],
        };
      case 'head_shake':
        return {
          position: [0, 0, 0],
          rotation: [0, 0, intensity * 0.5],
          scale: [1, 1, 1],
        };
      case 'body_sway':
        return {
          position: [Math.sin(performance.now() / 500) * intensity * 0.1, 0, 0],
          rotation: [0, Math.sin(performance.now() / 700) * intensity * 0.2, 0],
          scale: [1, 1, 1],
        };
      case 'celebrate':
        return {
          position: [0, intensity * 0.4, 0],
          rotation: [intensity * 0.5, intensity * 0.8, intensity * 0.3],
          scale: [1 + intensity * 0.15, 1 + intensity * 0.1, 1],
        };
      default:
        return { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
    }
  }

  setParams(params: Partial<GestureParams>): void {
    this.params = { ...this.params, ...params };
  }

  getParams(): GestureParams {
    return { ...this.params };
  }

  getCurrentGesture(): Gesture | null {
    return this.currentGesture;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  setBPM(bpm: number): void {
    this.bpm = Math.max(60, Math.min(200, bpm));
  }

  getBPM(): number {
    return this.bpm;
  }
}
