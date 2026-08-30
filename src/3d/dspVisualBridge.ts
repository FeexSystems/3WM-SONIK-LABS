/**
 * 3WM SONIK — DSP to Visual Bridge
 *
 * Maps real-time audio analysis (RMS, Peak, Bass, Mid, Treble, Spectral Flux, Beat, Energy)
 * to 3D scene parameters: material emission, vertex displacement, particle turbulence, and lighting.
 */

import { landingAudioEngine } from '../audio/landingAudioEngine';

export interface DSPVisualFrame {
  bpm: number;
  beat: boolean;
  bar: number;
  phase: number;
  rms: number;
  peak: number;
  bass: number;
  mid: number;
  treble: number;
  spectralFlux: number;
  energy: number;
}

class DSPVisualBridge {
  private prevSpectrum: Uint8Array = new Uint8Array(64);
  private currentFrame: DSPVisualFrame = {
    bpm: 112,
    beat: false,
    bar: 1,
    phase: 0,
    rms: 0,
    peak: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    spectralFlux: 0,
    energy: 0,
  };

  /**
   * Sample the latest audio frame from the audio engine
   */
  public sampleFrame(): DSPVisualFrame {
    const rawFreqs = landingAudioEngine.getFrequencyData();
    if (!rawFreqs || rawFreqs.length === 0) {
      // Return subtle resting ambient motion
      return this.getRestingFrame();
    }

    const length = rawFreqs.length;
    let sumSquares = 0;
    let peakVal = 0;

    // Bass (0 - 15%), Mid (15% - 60%), Treble (60% - 100%)
    const bassEnd = Math.floor(length * 0.15);
    const midEnd = Math.floor(length * 0.6);

    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    let flux = 0;

    for (let i = 0; i < length; i++) {
      const val = rawFreqs[i] / 255;
      sumSquares += val * val;
      if (val > peakVal) peakVal = val;

      if (i < bassEnd) {
        bassSum += val;
      } else if (i < midEnd) {
        midSum += val;
      } else {
        trebleSum += val;
      }

      // Spectral Flux calculation (rate of spectral change)
      const prevVal = (this.prevSpectrum[i % this.prevSpectrum.length] ?? 0) / 255;
      const diff = val - prevVal;
      if (diff > 0) flux += diff;
    }

    // Save previous spectrum for next flux step
    for (let i = 0; i < this.prevSpectrum.length; i++) {
      this.prevSpectrum[i] = rawFreqs[i] ?? 0;
    }

    const bass = bassEnd > 0 ? bassSum / bassEnd : 0;
    const mid = midEnd > bassEnd ? midSum / (midEnd - bassEnd) : 0;
    const treble = length > midEnd ? trebleSum / (length - midEnd) : 0;
    const rms = Math.sqrt(sumSquares / length);
    const energy = bass * 0.5 + mid * 0.3 + treble * 0.2;

    this.currentFrame = {
      bpm: 112,
      beat: bass > 0.65 || flux > 1.2,
      bar: (Math.floor(Date.now() / 2000) % 8) + 1,
      phase: (Date.now() % 2000) / 2000,
      rms,
      peak: peakVal,
      bass,
      mid,
      treble,
      spectralFlux: flux / length,
      energy,
    };

    return this.currentFrame;
  }

  public getCurrentFrame(): DSPVisualFrame {
    return this.currentFrame;
  }

  private getRestingFrame(): DSPVisualFrame {
    const t = Date.now() * 0.002;
    const subtle = 0.08 + Math.sin(t) * 0.03;
    return {
      bpm: 112,
      beat: false,
      bar: 1,
      phase: (Date.now() % 2000) / 2000,
      rms: subtle,
      peak: subtle * 1.5,
      bass: subtle * 1.2,
      mid: subtle,
      treble: subtle * 0.8,
      spectralFlux: 0.01,
      energy: subtle,
    };
  }
}

export const dspVisualBridge = new DSPVisualBridge();
