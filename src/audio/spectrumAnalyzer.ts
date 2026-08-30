// 3WM SONIK - Spectrum Analyzer
// Real-time frequency spectrum analysis with FFT and visualization data

export interface SpectrumData {
  frequencyBins: number[]; // Hz
  magnitudes: number[]; // dB
  phase: number[]; // radians
  sampleRate: number;
}

export interface SpectrumSettings {
  fftSize: number;
  smoothing: number; // 0-1
  minDecibels: number;
  maxDecibels: number;
  windowFunction: 'hann' | 'hamming' | 'blackman' | 'rectangular';
  showPhase: boolean;
  logarithmic: boolean;
  frequencyRange: [number, number]; // Hz
}

export interface PeakHoldData {
  frequency: number;
  magnitude: number;
  time: number;
}

export class SpectrumAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private settings: SpectrumSettings;
  private peakHolds: PeakHoldData[] = [];
  private peakHoldDecay: number = 0.95; // Decay factor per frame

  constructor() {
    this.settings = {
      fftSize: 2048,
      smoothing: 0.8,
      minDecibels: -90,
      maxDecibels: 0,
      windowFunction: 'hann',
      showPhase: false,
      logarithmic: true,
      frequencyRange: [20, 20000],
    };
  }

  /**
   * Initialize spectrum analyzer with audio context
   */
  public async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = this.settings.fftSize;
    this.analyser.smoothingTimeConstant = this.settings.smoothing;
  }

  /**
   * Connect audio node to analyzer
   */
  public connect(source: AudioNode): void {
    if (!this.analyser) throw new Error('Analyser not initialized');
    source.connect(this.analyser);
  }

  /**
   * Get current spectrum data
   */
  public getSpectrumData(): SpectrumData {
    if (!this.analyser || !this.audioContext) {
      throw new Error('Analyzer not initialized');
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const phaseArray = new Uint8Array(bufferLength);

    this.analyser.getByteFrequencyData(dataArray);
    this.analyser.getByteTimeDomainData(phaseArray);

    // Convert to dB
    const magnitudes = new Array(bufferLength);
    const phases = new Array(bufferLength);
    const frequencyBins = new Array(bufferLength);

    const sampleRate = this.audioContext.sampleRate;
    const binWidth = sampleRate / this.analyser.fftSize;

    for (let i = 0; i < bufferLength; i++) {
      const magnitude = dataArray[i] / 255;
      const magnitudeDb =
        this.settings.minDecibels +
        magnitude * (this.settings.maxDecibels - this.settings.minDecibels);

      magnitudes[i] = magnitudeDb;
      phases[i] = (phaseArray[i] / 255) * 2 * Math.PI - Math.PI;
      frequencyBins[i] = i * binWidth;
    }

    // Apply frequency range filter
    const filteredData = this.filterFrequencyRange(frequencyBins, magnitudes, phases);

    // Update peak holds
    this.updatePeakHolds(filteredData.frequencyBins, filteredData.magnitudes);

    return {
      frequencyBins: filteredData.frequencyBins,
      magnitudes: filteredData.magnitudes,
      phase: filteredData.phase,
      sampleRate,
    };
  }

  /**
   * Filter frequency range
   */
  private filterFrequencyRange(
    frequencies: number[],
    magnitudes: number[],
    phases: number[]
  ): SpectrumData {
    const [minFreq, maxFreq] = this.settings.frequencyRange;
    const filteredFreq: number[] = [];
    const filteredMag: number[] = [];
    const filteredPhase: number[] = [];

    for (let i = 0; i < frequencies.length; i++) {
      if (frequencies[i] >= minFreq && frequencies[i] <= maxFreq) {
        filteredFreq.push(frequencies[i]);
        filteredMag.push(magnitudes[i]);
        filteredPhase.push(phases[i]);
      }
    }

    return {
      frequencyBins: filteredFreq,
      magnitudes: filteredMag,
      phase: filteredPhase,
      sampleRate: this.audioContext!.sampleRate,
    };
  }

  /**
   * Update peak hold data
   */
  private updatePeakHolds(frequencies: number[], magnitudes: number[]): void {
    const now = Date.now();

    // Decay existing peaks
    this.peakHolds = this.peakHolds.map((peak) => ({
      ...peak,
      magnitude: peak.magnitude * this.peakHoldDecay,
      time: now,
    }));

    // Remove old peaks
    this.peakHolds = this.peakHolds.filter((peak) => peak.magnitude > this.settings.minDecibels);

    // Find new peaks
    for (let i = 0; i < frequencies.length; i++) {
      const freq = frequencies[i];
      const mag = magnitudes[i];

      // Check if this is a new peak in this frequency region
      const existingPeak = this.peakHolds.find(
        (p) => Math.abs(p.frequency - freq) < 100 // Within 100Hz
      );

      if (!existingPeak || mag > existingPeak.magnitude) {
        if (!existingPeak) {
          this.peakHolds.push({ frequency: freq, magnitude: mag, time: now });
        } else {
          existingPeak.magnitude = mag;
          existingPeak.time = now;
        }
      }
    }

    // Limit number of peaks
    if (this.peakHolds.length > 50) {
      this.peakHolds.sort((a, b) => b.magnitude - a.magnitude);
      this.peakHolds = this.peakHolds.slice(0, 50);
    }
  }

  /**
   * Get peak hold data
   */
  public getPeakHolds(): PeakHoldData[] {
    return [...this.peakHolds];
  }

  /**
   * Clear peak holds
   */
  public clearPeakHolds(): void {
    this.peakHolds = [];
  }

  /**
   * Get spectrum data in logarithmic frequency scale
   */
  public getLogarithmicSpectrum(bands: number = 64): SpectrumData {
    const linearData = this.getSpectrumData();
    const logFreq: number[] = [];
    const logMag: number[] = [];
    const logPhase: number[] = [];

    const [minFreq, maxFreq] = this.settings.frequencyRange;
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const logRange = logMax - logMin;

    for (let i = 0; i < bands; i++) {
      const logPos = logMin + (i / (bands - 1)) * logRange;
      const freq = Math.pow(10, logPos);

      // Find closest bin in linear data
      let closestMag = this.settings.minDecibels;
      let closestPhase = 0;

      for (let j = 0; j < linearData.frequencyBins.length; j++) {
        if (Math.abs(linearData.frequencyBins[j] - freq) < 100) {
          closestMag = linearData.magnitudes[j];
          closestPhase = linearData.phase[j];
          break;
        }
      }

      logFreq.push(freq);
      logMag.push(closestMag);
      logPhase.push(closestPhase);
    }

    return {
      frequencyBins: logFreq,
      magnitudes: logMag,
      phase: logPhase,
      sampleRate: linearData.sampleRate,
    };
  }

  /**
   * Get octave band spectrum (1/3 octave or 1/1 octave)
   */
  public getOctaveBandSpectrum(octaveFraction: 1 | 3 = 3): SpectrumData {
    const linearData = this.getSpectrumData();
    const octaveFreqs = this.generateOctaveFrequencies(octaveFraction);
    const octaveMag: number[] = [];
    const octavePhase: number[] = [];

    for (const centerFreq of octaveFreqs) {
      const lowerFreq = centerFreq / Math.pow(2, 1 / (2 * octaveFraction));
      const upperFreq = centerFreq * Math.pow(2, 1 / (2 * octaveFraction));

      // Average magnitudes in this band
      let sumMag = 0;
      let sumPhase = 0;
      let count = 0;

      for (let i = 0; i < linearData.frequencyBins.length; i++) {
        const freq = linearData.frequencyBins[i];
        if (freq >= lowerFreq && freq <= upperFreq) {
          sumMag += linearData.magnitudes[i];
          sumPhase += linearData.phase[i];
          count++;
        }
      }

      octaveMag.push(count > 0 ? sumMag / count : this.settings.minDecibels);
      octavePhase.push(count > 0 ? sumPhase / count : 0);
    }

    return {
      frequencyBins: octaveFreqs,
      magnitudes: octaveMag,
      phase: octavePhase,
      sampleRate: linearData.sampleRate,
    };
  }

  /**
   * Generate octave band center frequencies
   */
  private generateOctaveFrequencies(fraction: 1 | 3): number[] {
    const baseFreq = 1000; // 1 kHz reference
    const frequencies: number[] = [];

    // Generate frequencies below 1 kHz
    for (let i = 0; i < 10; i++) {
      const freq = baseFreq / Math.pow(2, i / fraction);
      if (freq >= this.settings.frequencyRange[0]) {
        frequencies.unshift(freq);
      }
    }

    // Generate frequencies above 1 kHz
    for (let i = 0; i < 10; i++) {
      const freq = baseFreq * Math.pow(2, i / fraction);
      if (freq <= this.settings.frequencyRange[1]) {
        frequencies.push(freq);
      }
    }

    return frequencies;
  }

  /**
   * Get spectral centroid (brightness indicator)
   */
  public getSpectralCentroid(): number {
    const data = this.getSpectrumData();

    let weightedSum = 0;
    let magnitudeSum = 0;

    for (let i = 0; i < data.frequencyBins.length; i++) {
      const mag = Math.pow(10, data.magnitudes[i] / 20); // Convert dB to linear
      weightedSum += data.frequencyBins[i] * mag;
      magnitudeSum += mag;
    }

    if (magnitudeSum === 0) return 0;
    return weightedSum / magnitudeSum;
  }

  /**
   * Get spectral rolloff (frequency below which 85% of energy is contained)
   */
  public getSpectralRolloff(percentage: number = 0.85): number {
    const data = this.getSpectrumData();

    let totalEnergy = 0;
    const energies = data.magnitudes.map((mag) => Math.pow(10, mag / 20));
    totalEnergy = energies.reduce((sum, e) => sum + e, 0);

    let cumulativeEnergy = 0;
    for (let i = 0; i < data.frequencyBins.length; i++) {
      cumulativeEnergy += energies[i];
      if (cumulativeEnergy >= totalEnergy * percentage) {
        return data.frequencyBins[i];
      }
    }

    return data.frequencyBins[data.frequencyBins.length - 1];
  }

  /**
   * Get spectral flux (rate of change of spectrum)
   */
  public getSpectralFlux(previousData: SpectrumData | null): number {
    const currentData = this.getSpectrumData();

    if (!previousData) return 0;

    let flux = 0;
    const minLength = Math.min(currentData.magnitudes.length, previousData.magnitudes.length);

    for (let i = 0; i < minLength; i++) {
      const diff = currentData.magnitudes[i] - previousData.magnitudes[i];
      flux += diff > 0 ? diff : 0; // Only positive changes
    }

    return flux / minLength;
  }

  /**
   * Get zero crossing rate (for onset detection)
   */
  public getZeroCrossingRate(): number {
    if (!this.analyser) throw new Error('Analyser not initialized');

    const bufferLength = this.analyser.fftSize;
    const timeData = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(timeData);

    let crossings = 0;
    for (let i = 1; i < timeData.length; i++) {
      if (
        (timeData[i - 1] < 128 && timeData[i] >= 128) ||
        (timeData[i - 1] >= 128 && timeData[i] < 128)
      ) {
        crossings++;
      }
    }

    return crossings / bufferLength;
  }

  /**
   * Update analyzer settings
   */
  public updateSettings(settings: Partial<SpectrumSettings>): void {
    this.settings = { ...this.settings, ...settings };

    if (this.analyser) {
      this.analyser.fftSize = this.settings.fftSize;
      this.analyser.smoothingTimeConstant = this.settings.smoothing;
    }
  }

  /**
   * Get current settings
   */
  public getSettings(): SpectrumSettings {
    return { ...this.settings };
  }

  /**
   * Set FFT size
   */
  public setFFTSize(size: 256 | 512 | 1024 | 2048 | 4096 | 8192): void {
    this.settings.fftSize = size;
    if (this.analyser) {
      this.analyser.fftSize = size;
    }
  }

  /**
   * Set smoothing time constant
   */
  public setSmoothing(smoothing: number): void {
    this.settings.smoothing = Math.max(0, Math.min(1, smoothing));
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = this.settings.smoothing;
    }
  }

  /**
   * Set frequency range
   */
  public setFrequencyRange(min: number, max: number): void {
    this.settings.frequencyRange = [min, max];
  }

  /**
   * Set dB range
   */
  public setDecibelRange(min: number, max: number): void {
    this.settings.minDecibels = min;
    this.settings.maxDecibels = max;
  }

  /**
   * Toggle logarithmic scale
   */
  public setLogarithmic(logarithmic: boolean): void {
    this.settings.logarithmic = logarithmic;
  }

  /**
   * Toggle phase display
   */
  public setShowPhase(show: boolean): void {
    this.settings.showPhase = show;
  }

  /**
   * Set peak hold decay rate
   */
  public setPeakHoldDecay(decay: number): void {
    this.peakHoldDecay = Math.max(0.5, Math.min(0.99, decay));
  }

  /**
   * Start real-time spectrum analysis
   */
  public startRealTimeAnalysis(callback: (data: SpectrumData) => void): () => void {
    let running = true;

    const analyze = () => {
      if (!running) return;

      try {
        const data = this.settings.logarithmic
          ? this.getLogarithmicSpectrum(64)
          : this.getSpectrumData();
        callback(data);
      } catch (error) {
        // Ignore errors during startup
      }

      requestAnimationFrame(analyze);
    };

    analyze();

    return () => {
      running = false;
    };
  }

  /**
   * Get frequency data for visualization (normalized 0-1)
   */
  public getVisualizationData(): { frequencies: number[]; magnitudes: number[] } {
    const data = this.getSpectrumData();

    const normalizedMag = data.magnitudes.map((mag) => {
      const normalized =
        (mag - this.settings.minDecibels) / (this.settings.maxDecibels - this.settings.minDecibels);
      return Math.max(0, Math.min(1, normalized));
    });

    return {
      frequencies: data.frequencyBins,
      magnitudes: normalizedMag,
    };
  }

  /**
   * Get spectrogram data (time-frequency representation)
   */
  public getSpectrogramData(frames: number = 100): number[][] {
    const spectrogram: number[][] = [];

    for (let i = 0; i < frames; i++) {
      const data = this.getSpectrumData();
      spectrogram.push(data.magnitudes);
    }

    return spectrogram;
  }

  /**
   * Analyze harmonic content
   */
  public analyzeHarmonics(fundamentalFreq: number, numHarmonics: number = 10): number[] {
    const data = this.getSpectrumData();
    const harmonics: number[] = [];

    for (let h = 1; h <= numHarmonics; h++) {
      const harmonicFreq = fundamentalFreq * h;
      let harmonicMag = this.settings.minDecibels;

      // Find magnitude at harmonic frequency
      for (let i = 0; i < data.frequencyBins.length; i++) {
        if (Math.abs(data.frequencyBins[i] - harmonicFreq) < 50) {
          harmonicMag = data.magnitudes[i];
          break;
        }
      }

      harmonics.push(harmonicMag);
    }

    return harmonics;
  }

  /**
   * Detect fundamental frequency
   */
  public detectFundamentalFrequency(): number | null {
    const data = this.getSpectrumData();

    // Find the peak in the low frequency range (20-500 Hz)
    let peakMag = this.settings.minDecibels;
    let peakFreq = 0;

    for (let i = 0; i < data.frequencyBins.length; i++) {
      const freq = data.frequencyBins[i];
      if (freq >= 20 && freq <= 500 && data.magnitudes[i] > peakMag) {
        peakMag = data.magnitudes[i];
        peakFreq = freq;
      }
    }

    return peakFreq > this.settings.minDecibels + 10 ? peakFreq : null;
  }

  /**
   * Clean up analyzer
   */
  public cleanup(): void {
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    this.peakHolds = [];
  }
}
