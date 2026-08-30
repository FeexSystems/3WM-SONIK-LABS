/**
 * Audio Buffer Comparison Utilities - Compare audio buffers with tolerance
 * Part of Phase 5.2.2: Implement audio buffer comparison utilities with tolerance
 */

export interface ComparisonResult {
  matches: boolean;
  maxDifference: number;
  meanDifference: number;
  rmsDifference: number;
  differenceBuffer: Float32Array;
  tolerance: number;
}

export interface ComparisonOptions {
  tolerance: number;
  relativeTolerance: boolean;
  checkLength: boolean;
  checkSampleRate: boolean;
}

export class AudioBufferComparator {
  /**
   * Compare two audio buffers with tolerance
   */
  static compareBuffers(
    buffer1: Float32Array,
    buffer2: Float32Array,
    options: Partial<ComparisonOptions> = {}
  ): ComparisonResult {
    const opts: ComparisonOptions = {
      tolerance: 0.001,
      relativeTolerance: false,
      checkLength: true,
      checkSampleRate: false,
      ...options,
    };

    // Check length if required
    if (opts.checkLength && buffer1.length !== buffer2.length) {
      return {
        matches: false,
        maxDifference: Infinity,
        meanDifference: Infinity,
        rmsDifference: Infinity,
        differenceBuffer: new Float32Array(0),
        tolerance: opts.tolerance,
      };
    }

    const minLength = Math.min(buffer1.length, buffer2.length);
    const differenceBuffer = new Float32Array(minLength);
    let maxDiff = 0;
    let sumDiff = 0;
    let sumSquaredDiff = 0;

    for (let i = 0; i < minLength; i++) {
      const sample1 = buffer1[i];
      const sample2 = buffer2[i];

      let diff: number;
      if (opts.relativeTolerance) {
        const maxSample = Math.max(Math.abs(sample1), Math.abs(sample2), 1e-10);
        diff = Math.abs(sample1 - sample2) / maxSample;
      } else {
        diff = Math.abs(sample1 - sample2);
      }

      differenceBuffer[i] = diff;
      maxDiff = Math.max(maxDiff, diff);
      sumDiff += diff;
      sumSquaredDiff += diff * diff;
    }

    const meanDiff = sumDiff / minLength;
    const rmsDiff = Math.sqrt(sumSquaredDiff / minLength);
    const matches = maxDiff <= opts.tolerance;

    return {
      matches,
      maxDifference: maxDiff,
      meanDifference: meanDiff,
      rmsDifference: rmsDiff,
      differenceBuffer,
      tolerance: opts.tolerance,
    };
  }

  /**
   * Compare two AudioBuffers
   */
  static compareAudioBuffers(
    buffer1: AudioBuffer,
    buffer2: AudioBuffer,
    options: Partial<ComparisonOptions> = {}
  ): ComparisonResult {
    const opts: ComparisonOptions = {
      tolerance: 0.001,
      relativeTolerance: false,
      checkLength: true,
      checkSampleRate: true,
      ...options,
    };

    // Check sample rate if required
    if (opts.checkSampleRate && buffer1.sampleRate !== buffer2.sampleRate) {
      return {
        matches: false,
        maxDifference: Infinity,
        meanDifference: Infinity,
        rmsDifference: Infinity,
        differenceBuffer: new Float32Array(0),
        tolerance: opts.tolerance,
      };
    }

    // Check channel count
    if (buffer1.numberOfChannels !== buffer2.numberOfChannels) {
      return {
        matches: false,
        maxDifference: Infinity,
        meanDifference: Infinity,
        rmsDifference: Infinity,
        differenceBuffer: new Float32Array(0),
        tolerance: opts.tolerance,
      };
    }

    // Compare each channel
    let overallMatches = true;
    let overallMaxDiff = 0;
    let overallMeanDiff = 0;
    let overallRmsDiff = 0;

    for (let channel = 0; channel < buffer1.numberOfChannels; channel++) {
      const channel1 = buffer1.getChannelData(channel);
      const channel2 = buffer2.getChannelData(channel);

      const result = this.compareBuffers(channel1, channel2, opts);

      overallMatches = overallMatches && result.matches;
      overallMaxDiff = Math.max(overallMaxDiff, result.maxDifference);
      overallMeanDiff += result.meanDifference;
      overallRmsDiff += result.rmsDifference;
    }

    overallMeanDiff /= buffer1.numberOfChannels;
    overallRmsDiff /= buffer1.numberOfChannels;

    return {
      matches: overallMatches,
      maxDifference: overallMaxDiff,
      meanDifference: overallMeanDiff,
      rmsDifference: overallRmsDiff,
      differenceBuffer: new Float32Array(0),
      tolerance: opts.tolerance,
    };
  }

  /**
   * Check if buffers are approximately equal
   */
  static approximatelyEqual(
    buffer1: Float32Array,
    buffer2: Float32Array,
    tolerance: number = 0.001
  ): boolean {
    const result = this.compareBuffers(buffer1, buffer2, { tolerance });
    return result.matches;
  }

  /**
   * Calculate signal-to-noise ratio between two buffers
   */
  static calculateSNR(signal: Float32Array, noise: Float32Array): number {
    const signalPower = this.calculatePower(signal);
    const noisePower = this.calculatePower(noise);

    if (noisePower === 0) return Infinity;

    return 10 * Math.log10(signalPower / noisePower);
  }

  /**
   * Calculate power of a buffer
   */
  static calculatePower(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return sum / buffer.length;
  }

  /**
   * Calculate correlation between two buffers
   */
  static calculateCorrelation(buffer1: Float32Array, buffer2: Float32Array): number {
    const minLength = Math.min(buffer1.length, buffer2.length);

    let sum1 = 0,
      sum2 = 0,
      sumProduct = 0;
    let sum1Sq = 0,
      sum2Sq = 0;

    for (let i = 0; i < minLength; i++) {
      const sample1 = buffer1[i];
      const sample2 = buffer2[i];

      sum1 += sample1;
      sum2 += sample2;
      sumProduct += sample1 * sample2;
      sum1Sq += sample1 * sample1;
      sum2Sq += sample2 * sample2;
    }

    const numerator = sumProduct - (sum1 * sum2) / minLength;
    const denominator = Math.sqrt(
      (sum1Sq - (sum1 * sum1) / minLength) * (sum2Sq - (sum2 * sum2) / minLength)
    );

    if (denominator === 0) return 0;

    return numerator / denominator;
  }

  /**
   * Find the time offset between two similar buffers
   */
  static findTimeOffset(
    buffer1: Float32Array,
    buffer2: Float32Array,
    maxOffset: number = 100
  ): number {
    let bestOffset = 0;
    let bestCorrelation = -Infinity;

    for (let offset = -maxOffset; offset <= maxOffset; offset++) {
      const correlation = this.calculateCorrelationAtOffset(buffer1, buffer2, offset);

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    return bestOffset;
  }

  /**
   * Calculate correlation at a specific offset
   */
  private static calculateCorrelationAtOffset(
    buffer1: Float32Array,
    buffer2: Float32Array,
    offset: number
  ): number {
    const length = Math.min(buffer1.length, buffer2.length) - Math.abs(offset);

    if (length <= 0) return 0;

    let sumProduct = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;

    for (let i = 0; i < length; i++) {
      const index1 = offset >= 0 ? i : i - offset;
      const index2 = offset >= 0 ? i + offset : i;

      const sample1 = buffer1[index1];
      const sample2 = buffer2[index2];

      sumProduct += sample1 * sample2;
      sum1Sq += sample1 * sample1;
      sum2Sq += sample2 * sample2;
    }

    const denominator = Math.sqrt(sum1Sq * sum2Sq);
    if (denominator === 0) return 0;

    return sumProduct / denominator;
  }

  /**
   * Check if buffer is silent (below threshold)
   */
  static isSilent(buffer: Float32Array, threshold: number = 1e-6): boolean {
    for (let i = 0; i < buffer.length; i++) {
      if (Math.abs(buffer[i]) > threshold) {
        return false;
      }
    }
    return true;
  }

  /**
   * Calculate the difference in dB between two buffers
   */
  static calculateDifferenceDb(buffer1: Float32Array, buffer2: Float32Array): number {
    const power1 = this.calculatePower(buffer1);
    const power2 = this.calculatePower(buffer2);

    if (power1 === 0 && power2 === 0) return 0;
    if (power1 === 0) return -Infinity;
    if (power2 === 0) return Infinity;

    return 10 * Math.log10(power1 / power2);
  }

  /**
   * Generate a detailed comparison report
   */
  static generateComparisonReport(result: ComparisonResult): string {
    return `
Audio Buffer Comparison Report
==============================

Matches: ${result.matches ? 'Yes' : 'No'}
Tolerance: ${result.tolerance}

Statistics:
- Max Difference: ${result.maxDifference.toFixed(6)}
- Mean Difference: ${result.meanDifference.toFixed(6)}
- RMS Difference: ${result.rmsDifference.toFixed(6)}

Status: ${result.matches ? 'PASS' : 'FAIL'}
    `.trim();
  }

  /**
   * Compare frequency spectra of two buffers
   */
  static compareSpectra(
    buffer1: Float32Array,
    buffer2: Float32Array,
    fftSize: number = 2048
  ): { matches: boolean; maxSpectralDifference: number } {
    const spectrum1 = this.calculateSpectrum(buffer1, fftSize);
    const spectrum2 = this.calculateSpectrum(buffer2, fftSize);

    let maxDiff = 0;
    const minLength = Math.min(spectrum1.length, spectrum2.length);

    for (let i = 0; i < minLength; i++) {
      const diff = Math.abs(spectrum1[i] - spectrum2[i]);
      maxDiff = Math.max(maxDiff, diff);
    }

    return {
      matches: maxDiff < 0.01, // 1% tolerance
      maxSpectralDifference: maxDiff,
    };
  }

  /**
   * Calculate frequency spectrum
   */
  private static calculateSpectrum(buffer: Float32Array, fftSize: number): Float32Array {
    // Simplified FFT implementation
    const spectrum = new Float32Array(fftSize / 2);

    for (let i = 0; i < fftSize / 2; i++) {
      let real = 0;
      let imag = 0;

      for (let j = 0; j < Math.min(buffer.length, fftSize); j++) {
        const angle = (2 * Math.PI * i * j) / fftSize;
        real += buffer[j] * Math.cos(angle);
        imag -= buffer[j] * Math.sin(angle);
      }

      spectrum[i] = Math.sqrt(real * real + imag * imag);
    }

    return spectrum;
  }
}
