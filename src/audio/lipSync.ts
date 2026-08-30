/**
 * 3WM SONIK — Lip Sync System
 * Audio-driven lip synchronization for Kingpin avatar
 */

export interface LipSyncParams {
  sensitivity: number; // Sensitivity to audio (0.1 - 2.0)
  smoothing: number; // Smoothing factor (0 - 1)
  threshold: number; // Audio threshold for mouth opening (0 - 1)
  maxOpenAmount: number; // Maximum mouth opening (0 - 1)
  attack: number; // Attack time in seconds
  release: number; // Release time in seconds
}

export class LipSyncSystem {
  private analyser: AnalyserNode | null = null;
  private audioData: Float32Array | null = null;
  private params: LipSyncParams;
  private currentMouthOpen: number = 0;
  private targetMouthOpen: number = 0;
  private lastUpdateTime: number = 0;
  private isInitialized: boolean = false;

  constructor(params: Partial<LipSyncParams> = {}) {
    this.params = {
      sensitivity: params.sensitivity ?? 1.0,
      smoothing: params.smoothing ?? 0.3,
      threshold: params.threshold ?? 0.1,
      maxOpenAmount: params.maxOpenAmount ?? 0.8,
      attack: params.attack ?? 0.01,
      release: params.release ?? 0.05,
    };
  }

  initialize(analyser: AnalyserNode): void {
    this.analyser = analyser;
    this.analyser.fftSize = 512;
    this.audioData = new Float32Array(this.analyser.frequencyBinCount);
    this.isInitialized = true;
  }

  /**
   * Calculate mouth opening based on audio analysis
   */
  update(): number {
    if (!this.isInitialized || !this.analyser || !this.audioData) {
      return 0;
    }

    const now = performance.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // Get audio data
    this.analyser.getFloatTimeDomainData(this.audioData as any);

    // Calculate RMS (Root Mean Square) for overall amplitude
    let sum = 0;
    for (let i = 0; i < this.audioData.length; i++) {
      sum += this.audioData[i] * this.audioData[i];
    }
    const rms = Math.sqrt(sum / this.audioData.length);

    // Apply sensitivity
    const amplifiedRms = rms * this.params.sensitivity;

    // Apply threshold
    const aboveThreshold = Math.max(0, amplifiedRms - this.params.threshold);

    // Normalize to 0-1 range
    const normalized = Math.min(1, aboveThreshold / (1 - this.params.threshold));

    // Apply max open amount
    this.targetMouthOpen = normalized * this.params.maxOpenAmount;

    // Smooth the transition
    const smoothingFactor = this.params.smoothing;
    this.currentMouthOpen =
      this.currentMouthOpen + (this.targetMouthOpen - this.currentMouthOpen) * smoothingFactor;

    return this.currentMouthOpen;
  }

  /**
   * Get phoneme-based mouth shapes
   * Returns a value representing different mouth positions
   */
  getPhonemeShape(): number {
    if (!this.isInitialized || !this.analyser || !this.audioData) {
      return 0; // Closed mouth
    }

    this.analyser.getFloatFrequencyData(this.audioData as any);

    // Analyze frequency bands for phoneme estimation
    const lowFreq = this.getBandEnergy(0, 500); // Low frequencies
    const midFreq = this.getBandEnergy(500, 2000); // Mid frequencies
    const highFreq = this.getBandEnergy(2000, 8000); // High frequencies

    // Simple phoneme classification based on frequency content
    const totalEnergy = lowFreq + midFreq + highFreq;
    if (totalEnergy < this.params.threshold) {
      return 0; // Closed (silence)
    }

    const lowRatio = lowFreq / totalEnergy;
    const midRatio = midFreq / totalEnergy;
    const highRatio = highFreq / totalEnergy;

    // Map to mouth shape values (0 = closed, 1 = fully open)
    if (lowRatio > 0.5) {
      return 0.3; // Vowel sounds (A, O, U)
    } else if (midRatio > 0.4) {
      return 0.6; // Consonant sounds (M, N, L)
    } else if (highRatio > 0.3) {
      return 0.8; // Fricative sounds (S, F, TH)
    } else {
      return 0.5; // Mixed sounds
    }
  }

  /**
   * Get energy in a specific frequency band
   */
  private getBandEnergy(startFreq: number, endFreq: number): number {
    if (!this.analyser || !this.audioData) return 0;

    const sampleRate = this.analyser.context.sampleRate;
    const binSize = sampleRate / this.analyser.fftSize;

    const startBin = Math.floor(startFreq / binSize);
    const endBin = Math.floor(endFreq / binSize);

    let energy = 0;
    for (let i = startBin; i < endBin && i < this.audioData.length; i++) {
      energy += this.audioData[i] * this.audioData[i];
    }

    return Math.sqrt(energy / (endBin - startBin));
  }

  /**
   * Get viseme (visual phoneme) for animation
   * Returns a standard viseme name or index
   */
  getViseme(): string {
    const mouthOpen = this.update();
    const phonemeShape = this.getPhonemeShape();

    // Map to standard visemes
    if (mouthOpen < 0.1) return 'sil'; // Silence
    if (mouthOpen < 0.3) return 'PP'; // P, B, M
    if (mouthOpen < 0.5) return 'FF'; // F, V
    if (mouthOpen < 0.7) return 'TH'; // TH, DH
    if (phonemeShape < 0.4) return 'aa'; // A, O, U (open vowels)
    if (phonemeShape < 0.6) return 'E'; // E, I (closed vowels)
    return 'rest'; // Default
  }

  /**
   * Get blend shape values for 3D models
   * Returns an object with blend shape names and values
   */
  getBlendShapes(): Record<string, number> {
    const mouthOpen = this.update();
    const phonemeShape = this.getPhonemeShape();

    return {
      jaw_open: mouthOpen * 0.8,
      mouth_smile: phonemeShape > 0.5 ? phonemeShape * 0.3 : 0,
      mouth_frown: phonemeShape < 0.3 ? (1 - phonemeShape) * 0.2 : 0,
      mouth_pucker: phonemeShape < 0.4 ? (1 - phonemeShape) * 0.4 : 0,
      mouth_wide: phonemeShape > 0.6 ? (phonemeShape - 0.6) * 0.5 : 0,
      tongue_up: phonemeShape > 0.5 ? phonemeShape * 0.2 : 0,
      tongue_down: phonemeShape < 0.3 ? (1 - phonemeShape) * 0.3 : 0,
    };
  }

  setParams(params: Partial<LipSyncParams>): void {
    this.params = { ...this.params, ...params };
  }

  getParams(): LipSyncParams {
    return { ...this.params };
  }

  getCurrentMouthOpen(): number {
    return this.currentMouthOpen;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

/**
 * Advanced lip sync with co-articulation support
 */
export class AdvancedLipSync extends LipSyncSystem {
  private visemeHistory: string[] = [];
  private coarticulationWindow: number = 3;
  private transitionSpeed: number = 0.5;

  getViseme(): string {
    const currentViseme = super.getViseme();

    // Add to history
    this.visemeHistory.push(currentViseme);
    if (this.visemeHistory.length > this.coarticulationWindow) {
      this.visemeHistory.shift();
    }

    // Apply co-articulation (blending between adjacent visemes)
    return this.blendVisemes(currentViseme);
  }

  private blendVisemes(currentViseme: string): string {
    if (this.visemeHistory.length < 2) return currentViseme;

    // Simple co-articulation: return current if different from previous
    const previousViseme = this.visemeHistory[this.visemeHistory.length - 2];

    // If transitioning between similar visemes, blend
    if (this.areSimilarViseme(previousViseme, currentViseme)) {
      return currentViseme;
    }

    // For dissimilar transitions, use intermediate
    return this.getIntermediateViseme(previousViseme, currentViseme);
  }

  private areSimilarViseme(v1: string, v2: string): boolean {
    const similarGroups = [
      ['PP', 'BB', 'MM'],
      ['FF', 'VV'],
      ['TH', 'DH'],
      ['aa', 'E', 'rest'],
    ];

    for (const group of similarGroups) {
      if (group.includes(v1) && group.includes(v2)) {
        return true;
      }
    }

    return v1 === v2;
  }

  private getIntermediateViseme(v1: string, v2: string): string {
    // Return a neutral intermediate viseme
    return 'rest';
  }

  setCoarticulationWindow(window: number): void {
    this.coarticulationWindow = Math.max(1, window);
  }

  setTransitionSpeed(speed: number): void {
    this.transitionSpeed = Math.max(0, Math.min(1, speed));
  }
}
