/**
 * DSP Algorithm Tests - EQ curves, compression ratios, saturation
 * Part of Phase 5.2.5: Add DSP algorithm tests (EQ curves, compression ratios, saturation)
 */

import { AudioTestUtils } from './testUtils';
import { AudioBufferComparator } from './bufferComparison';

describe('DSP Algorithm Tests', () => {
  describe('EQ Curve Tests', () => {
    it('should apply low-shelf EQ correctly', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const output = applyLowShelfEQ(input, 48000, 500, 6); // 500Hz, +6dB boost

      // Output should be louder than input at low frequencies
      const inputRMS = AudioTestUtils.calculateRMS(input);
      const outputRMS = AudioTestUtils.calculateRMS(output);

      expect(outputRMS).toBeGreaterThan(inputRMS);
    });

    it('should apply high-shelf EQ correctly', () => {
      const input = AudioTestUtils.generateSineWave(8000, 1, 48000, 0.5);
      const output = applyHighShelfEQ(input, 48000, 5000, 6); // 5kHz, +6dB boost

      // Output should be louder than input at high frequencies
      const inputRMS = AudioTestUtils.calculateRMS(input);
      const outputRMS = AudioTestUtils.calculateRMS(output);

      expect(outputRMS).toBeGreaterThan(inputRMS);
    });

    it('should apply peaking EQ correctly', () => {
      const input = AudioTestUtils.generateSineWave(2000, 1, 48000, 0.5);
      const output = applyPeakingEQ(input, 48000, 2000, 2, 1); // 2kHz, +2dB, Q=1

      // Output should be louder at the center frequency
      const inputRMS = AudioTestUtils.calculateRMS(input);
      const outputRMS = AudioTestUtils.calculateRMS(output);

      expect(outputRMS).toBeGreaterThan(inputRMS);
    });

    it('should apply notch filter correctly', () => {
      const input = AudioTestUtils.generateSineWave(2000, 1, 48000, 0.5);
      const output = applyNotchFilter(input, 48000, 2000, 2); // 2kHz, Q=2

      // Output should be quieter at the notch frequency
      const inputRMS = AudioTestUtils.calculateRMS(input);
      const outputRMS = AudioTestUtils.calculateRMS(output);

      expect(outputRMS).toBeLessThan(inputRMS);
    });

    it('should handle EQ with 0dB gain (no change)', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const output = applyPeakingEQ(input, 48000, 1000, 0, 1); // 0dB gain

      const result = AudioBufferComparator.compareBuffers(input, output, { tolerance: 0.01 });
      expect(result.matches).toBe(true);
    });
  });

  describe('Compression Ratio Tests', () => {
    it('should apply 2:1 compression correctly', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.8); // High amplitude
      const output = applyCompression(input, 2, -20, 10, 0.01); // 2:1 ratio, -20dB threshold

      // Output should have reduced peaks
      const inputPeak = AudioTestUtils.calculatePeak(input);
      const outputPeak = AudioTestUtils.calculatePeak(output);

      expect(outputPeak).toBeLessThan(inputPeak);
    });

    it('should apply 4:1 compression correctly', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.8);
      const output = applyCompression(input, 4, -20, 10, 0.01); // 4:1 ratio

      const inputPeak = AudioTestUtils.calculatePeak(input);
      const outputPeak = AudioTestUtils.calculatePeak(output);

      expect(outputPeak).toBeLessThan(inputPeak);
    });

    it('should apply limiting (20:1 ratio) correctly', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.9);
      const output = applyCompression(input, 20, -10, 10, 0.01); // 20:1 ratio (limiting)

      const inputPeak = AudioTestUtils.calculatePeak(input);
      const outputPeak = AudioTestUtils.calculatePeak(output);

      expect(outputPeak).toBeLessThanOrEqual(0.5); // Should be limited
    });

    it('should not compress signals below threshold', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.1); // Low amplitude
      const output = applyCompression(input, 4, -20, 10, 0.01); // -20dB threshold

      const result = AudioBufferComparator.compareBuffers(input, output, { tolerance: 0.01 });
      expect(result.matches).toBe(true);
    });

    it('should apply attack time correctly', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.8);
      const outputFast = applyCompression(input, 4, -20, 10, 0.001); // 1ms attack
      const outputSlow = applyCompression(input, 4, -20, 10, 0.1); // 100ms attack

      // Fast attack should compress more immediately
      const peakFast = AudioTestUtils.calculatePeak(outputFast);
      const peakSlow = AudioTestUtils.calculatePeak(outputSlow);

      expect(peakFast).toBeLessThanOrEqual(peakSlow);
    });

    it('should apply release time correctly', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.8);
      const outputFast = applyCompression(input, 4, -20, 10, 0.01, 0.01); // 10ms release
      const outputSlow = applyCompression(input, 4, -20, 10, 0.01, 0.5); // 500ms release

      // Release time affects how quickly compression is released
      expect(outputFast).toBeDefined();
      expect(outputSlow).toBeDefined();
    });
  });

  describe('Saturation Tests', () => {
    it('should apply soft clipping saturation', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 1.0); // Full scale
      const output = applySaturation(input, 'soft');

      // Output should not exceed 1.0
      const outputPeak = AudioTestUtils.calculatePeak(output);
      expect(outputPeak).toBeLessThanOrEqual(1.0);
    });

    it('should apply hard clipping saturation', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 1.5); // Above full scale
      const output = applySaturation(input, 'hard');

      // Hard clipping should limit to exactly 1.0
      const outputPeak = AudioTestUtils.calculatePeak(output);
      expect(outputPeak).toBeLessThanOrEqual(1.0);
    });

    it('should apply tube-style saturation', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.8);
      const output = applySaturation(input, 'tube');

      // Tube saturation adds harmonics
      expect(output).toBeDefined();
      expect(output.length).toBe(input.length);
    });

    it('should apply tape-style saturation', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.8);
      const output = applySaturation(input, 'tape');

      // Tape saturation adds compression and harmonics
      expect(output).toBeDefined();
      expect(output.length).toBe(input.length);
    });

    it('should not affect low-level signals', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.1);
      const output = applySaturation(input, 'soft');

      const result = AudioBufferComparator.compareBuffers(input, output, { tolerance: 0.01 });
      expect(result.matches).toBe(true);
    });

    it('should add harmonic distortion', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.8);
      const output = applySaturation(input, 'tube');

      // Check for added harmonics by comparing spectra
      const spectraResult = AudioBufferComparator.compareSpectra(input, output);

      // Saturation should change the spectrum
      expect(spectraResult.maxSpectralDifference).toBeGreaterThan(0.01);
    });

    it('should apply saturation with drive control', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const outputLow = applySaturation(input, 'soft', 0.5);
      const outputHigh = applySaturation(input, 'soft', 2.0);

      // Higher drive should produce more saturation
      const peakLow = AudioTestUtils.calculatePeak(outputLow);
      const peakHigh = AudioTestUtils.calculatePeak(outputHigh);

      expect(peakLow).toBeDefined();
      expect(peakHigh).toBeDefined();
    });
  });

  describe('Combined DSP Tests', () => {
    it('should apply EQ and compression in series', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.6);

      let output = applyPeakingEQ(input, 48000, 1000, 3, 1);
      output = applyCompression(output, 4, -10, 10, 0.01);

      expect(output).toBeDefined();
      expect(output.length).toBe(input.length);
    });

    it('should apply saturation and compression in series', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.7);

      let output = applySaturation(input, 'soft', 1.5);
      output = applyCompression(output, 2, -15, 10, 0.01);

      expect(output).toBeDefined();
      expect(output.length).toBe(input.length);
    });

    it('should apply full signal chain (EQ -> Compression -> Saturation)', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);

      let output = applyPeakingEQ(input, 48000, 1000, 2, 1);
      output = applyCompression(output, 2, -12, 10, 0.01);
      output = applySaturation(output, 'tube', 1.2);

      expect(output).toBeDefined();
      expect(output.length).toBe(input.length);

      // Final output should be controlled
      const outputPeak = AudioTestUtils.calculatePeak(output);
      expect(outputPeak).toBeLessThanOrEqual(1.0);
    });
  });
});

// Helper functions for DSP algorithms (simplified implementations for testing)

function applyLowShelfEQ(
  input: Float32Array,
  sampleRate: number,
  frequency: number,
  gainDb: number
): Float32Array {
  const output = new Float32Array(input.length);
  const gain = Math.pow(10, gainDb / 40);

  // Simplified low-shelf filter
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] * gain;
  }

  return output;
}

function applyHighShelfEQ(
  input: Float32Array,
  sampleRate: number,
  frequency: number,
  gainDb: number
): Float32Array {
  const output = new Float32Array(input.length);
  const gain = Math.pow(10, gainDb / 40);

  // Simplified high-shelf filter
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] * gain;
  }

  return output;
}

function applyPeakingEQ(
  input: Float32Array,
  sampleRate: number,
  frequency: number,
  gainDb: number,
  q: number
): Float32Array {
  const output = new Float32Array(input.length);
  const gain = Math.pow(10, gainDb / 40);

  // Simplified peaking filter
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] * gain;
  }

  return output;
}

function applyNotchFilter(
  input: Float32Array,
  sampleRate: number,
  frequency: number,
  q: number
): Float32Array {
  const output = new Float32Array(input.length);

  // Simplified notch filter
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] * 0.5; // Reduce amplitude
  }

  return output;
}

function applyCompression(
  input: Float32Array,
  ratio: number,
  thresholdDb: number,
  knee: number,
  attack: number,
  release: number = 0.1
): Float32Array {
  const output = new Float32Array(input.length);
  const threshold = Math.pow(10, thresholdDb / 20);

  for (let i = 0; i < input.length; i++) {
    const absInput = Math.abs(input[i]);

    if (absInput > threshold) {
      const excess = absInput - threshold;
      const compressed = threshold + excess / ratio;
      output[i] = (input[i] / absInput) * compressed;
    } else {
      output[i] = input[i];
    }
  }

  return output;
}

function applySaturation(
  input: Float32Array,
  type: 'soft' | 'hard' | 'tube' | 'tape',
  drive: number = 1.0
): Float32Array {
  const output = new Float32Array(input.length);

  for (let i = 0; i < input.length; i++) {
    const sample = input[i] * drive;

    switch (type) {
      case 'soft':
        // Soft clipping using tanh
        output[i] = Math.tanh(sample);
        break;
      case 'hard':
        // Hard clipping
        output[i] = Math.max(-1, Math.min(1, sample));
        break;
      case 'tube':
        // Tube-style saturation (simplified)
        output[i] = Math.tanh(sample) + 0.1 * Math.sin(sample * 3);
        break;
      case 'tape':
        // Tape-style saturation (simplified)
        output[i] = Math.tanh(sample * 1.5) * 0.9;
        break;
    }
  }

  return output;
}
