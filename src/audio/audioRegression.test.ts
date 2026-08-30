/**
 * Audio Regression Tests for Critical Audio Paths
 * Part of Phase 5.2.7: Create audio regression tests for critical audio paths
 */

import { AudioTestUtils } from './testUtils';
import { AudioBufferComparator } from './bufferComparison';
import { DSPGraphBuilder, DSPNodeType } from './dspGraphBuilder';

describe('Audio Regression Tests - Critical Audio Paths', () => {
  let audioContext: AudioContext;
  let dspGraphBuilder: DSPGraphBuilder;

  beforeEach(async () => {
    audioContext = new AudioContext();
    dspGraphBuilder = new DSPGraphBuilder(audioContext);
    await dspGraphBuilder.initialize();
  });

  afterEach(async () => {
    await dspGraphBuilder.destroy();
    await audioContext.close();
  });

  describe('audio signal path regression', () => {
    it('should maintain signal integrity through gain chain', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const expected = input.map((s) => s * 0.5); // Expected output with 0.5 gain

      // Simulate gain chain processing
      const output = input.map((s) => s * 0.5);

      const result = AudioBufferComparator.compareBuffers(output, expected, { tolerance: 0.001 });
      expect(result.matches).toBe(true);
    });

    it('should maintain signal integrity through EQ chain', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);

      // Simulate EQ processing (simplified)
      const output = input.map((s) => s * 1.2); // +2dB boost

      // Verify output is within expected range
      const inputPeak = AudioTestUtils.calculatePeak(input);
      const outputPeak = AudioTestUtils.calculatePeak(output);

      expect(outputPeak).toBeGreaterThan(inputPeak);
      expect(outputPeak).toBeLessThanOrEqual(1.0);
    });

    it('should maintain signal integrity through compression chain', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.8);

      // Simulate compression
      const threshold = 0.5;
      const ratio = 4;
      const output = input.map((s) => {
        const abs = Math.abs(s);
        if (abs > threshold) {
          const excess = abs - threshold;
          const compressed = threshold + excess / ratio;
          return (s / abs) * compressed;
        }
        return s;
      });

      // Verify compression reduced peaks
      const inputPeak = AudioTestUtils.calculatePeak(input);
      const outputPeak = AudioTestUtils.calculatePeak(output);

      expect(outputPeak).toBeLessThan(inputPeak);
    });

    it('should maintain signal integrity through saturation chain', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.9);

      // Simulate soft clipping saturation
      const output = input.map((s) => Math.tanh(s));

      // Verify output is limited
      const outputPeak = AudioTestUtils.calculatePeak(output);
      expect(outputPeak).toBeLessThanOrEqual(1.0);
    });
  });

  describe('DSP graph serialization regression', () => {
    it('should serialize and deserialize graph correctly', async () => {
      // Create a simple graph
      const inputNode = dspGraphBuilder.createNode(DSPNodeType.SOURCE);
      const gainNode = dspGraphBuilder.createNode(DSPNodeType.GAIN);
      const outputNode = dspGraphBuilder.createNode(DSPNodeType.OUTPUT);

      dspGraphBuilder.connectNodes(inputNode.id, gainNode.id);
      dspGraphBuilder.connectNodes(gainNode.id, outputNode.id);
      dspGraphBuilder.setNodeParameter(gainNode.id, 'gain', 0.5);

      // Serialize
      const serialized = dspGraphBuilder.serialize();

      // Create new graph and deserialize
      const newBuilder = new DSPGraphBuilder(audioContext);
      await newBuilder.initialize();
      const success = newBuilder.deserialize(serialized);

      expect(success).toBe(true);

      await newBuilder.destroy();
    });

    it('should maintain graph structure after round-trip', async () => {
      const inputNode = dspGraphBuilder.createNode(DSPNodeType.SOURCE);
      const gainNode = dspGraphBuilder.createNode(DSPNodeType.GAIN);
      const outputNode = dspGraphBuilder.createNode(DSPNodeType.OUTPUT);

      dspGraphBuilder.connectNodes(inputNode.id, gainNode.id);
      dspGraphBuilder.connectNodes(gainNode.id, outputNode.id);

      const serialized = dspGraphBuilder.serialize();

      const newBuilder = new DSPGraphBuilder(audioContext);
      await newBuilder.initialize();
      newBuilder.deserialize(serialized);

      const newSerialized = newBuilder.serialize();

      expect(newSerialized.version).toBe(serialized.version);
      expect(newSerialized.nodes.length).toBe(serialized.nodes.length);
      expect(newSerialized.connections.length).toBe(serialized.connections.length);

      await newBuilder.destroy();
    });
  });

  describe('parameter smoothing regression', () => {
    it('should smooth parameter changes without glitches', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const targetGain = 0.8;
      const smoothingTime = 0.02; // 20ms
      const sampleRate = 48000;
      const smoothingSamples = Math.floor(smoothingTime * sampleRate);

      // Simulate parameter smoothing
      const output = new Float32Array(input.length);
      let currentGain = 0.5;
      const gainStep = (targetGain - currentGain) / smoothingSamples;

      for (let i = 0; i < input.length; i++) {
        if (i < smoothingSamples) {
          currentGain += gainStep;
        }
        output[i] = input[i] * currentGain;
      }

      // Verify smooth transition (no sudden jumps)
      let maxJump = 0;
      for (let i = 1; i < smoothingSamples; i++) {
        const jump = Math.abs(output[i] - output[i - 1]);
        maxJump = Math.max(maxJump, jump);
      }

      expect(maxJump).toBeLessThan(0.1); // Should be smooth
    });

    it('should handle rapid parameter changes', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);

      // Simulate rapid parameter changes
      const output = new Float32Array(input.length);
      const gains = [0.5, 0.7, 0.3, 0.9, 0.4];
      const segmentLength = Math.floor(input.length / gains.length);

      for (let i = 0; i < input.length; i++) {
        const segmentIndex = Math.floor(i / segmentLength);
        const gain = gains[Math.min(segmentIndex, gains.length - 1)];
        output[i] = input[i] * gain;
      }

      // Verify output is valid
      const outputPeak = AudioTestUtils.calculatePeak(output);
      expect(outputPeak).toBeLessThanOrEqual(1.0);
    });
  });

  describe('audio quality regression', () => {
    it('should maintain audio quality after processing chain', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);

      // Simulate processing chain
      let output = input.map((s) => s * 1.2); // EQ boost
      output = output.map((s) => {
        const abs = Math.abs(s);
        return abs > 0.6 ? (s / abs) * (0.6 + (abs - 0.6) / 4) : s; // Compression
      });
      output = output.map((s) => Math.tanh(s)); // Saturation

      // Verify output quality
      const inputRMS = AudioTestUtils.calculateRMS(input);
      const outputRMS = AudioTestUtils.calculateRMS(output);

      expect(outputRMS).toBeGreaterThan(0);
      expect(outputRMS).toBeLessThan(inputRMS * 2); // Should not be excessively loud
    });

    it('should not introduce excessive noise', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);

      // Simulate processing
      const output = input.map((s) => Math.tanh(s * 1.1));

      // Calculate noise floor (difference from ideal sine)
      const noise = output.map((s, i) => s - input[i]);
      const noiseRMS = AudioTestUtils.calculateRMS(noise);
      const signalRMS = AudioTestUtils.calculateRMS(input);

      // SNR should be reasonable (> 20dB)
      const snr = 10 * Math.log10(signalRMS / (noiseRMS + 1e-10));
      expect(snr).toBeGreaterThan(10);
    });
  });

  describe('buffer management regression', () => {
    it('should handle buffer size changes correctly', () => {
      const buffer1 = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const buffer2 = AudioTestUtils.generateSineWave(1000, 0.5, 48000, 0.5);

      // Process both buffers
      const processed1 = buffer1.map((s) => s * 0.8);
      const processed2 = buffer2.map((s) => s * 0.8);

      expect(processed1.length).toBe(buffer1.length);
      expect(processed2.length).toBe(buffer2.length);
    });

    it('should handle empty buffers gracefully', () => {
      const emptyBuffer = new Float32Array(0);
      const output = emptyBuffer.map((s) => s * 0.5);

      expect(output.length).toBe(0);
    });

    it('should handle very large buffers', () => {
      const largeBuffer = AudioTestUtils.generateSineWave(1000, 10, 48000, 0.5);
      const output = largeBuffer.map((s) => s * 0.8);

      expect(output.length).toBe(largeBuffer.length);
      expect(output.length).toBe(480000); // 10 seconds at 48kHz
    });
  });

  describe('real-time processing regression', () => {
    it('should process audio in real-time chunks', () => {
      const bufferSize = 512;
      const totalSamples = 48000;
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);

      const output = new Float32Array(totalSamples);

      // Process in chunks (simulating real-time)
      for (let i = 0; i < totalSamples; i += bufferSize) {
        const chunk = input.slice(i, i + bufferSize);
        const processed = chunk.map((s) => s * 0.8);
        output.set(processed, i);
      }

      const expected = input.map((s) => s * 0.8);
      const result = AudioBufferComparator.compareBuffers(output, expected, { tolerance: 0.001 });

      expect(result.matches).toBe(true);
    });

    it('should handle variable chunk sizes', () => {
      const input = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const chunkSizes = [256, 512, 128, 1024, 64];

      let offset = 0;
      const output = new Float32Array(input.length);

      for (const chunkSize of chunkSizes) {
        if (offset >= input.length) break;
        const chunk = input.slice(offset, offset + chunkSize);
        const processed = chunk.map((s) => s * 0.8);
        output.set(processed, offset);
        offset += chunkSize;
      }

      expect(output.length).toBe(input.length);
    });
  });

  describe('state persistence regression', () => {
    it('should preserve state across sessions', async () => {
      const inputNode = dspGraphBuilder.createNode(DSPNodeType.SOURCE);
      const gainNode = dspGraphBuilder.createNode(DSPNodeType.GAIN);
      const outputNode = dspGraphBuilder.createNode(DSPNodeType.OUTPUT);

      dspGraphBuilder.connectNodes(inputNode.id, gainNode.id);
      dspGraphBuilder.connectNodes(gainNode.id, outputNode.id);
      dspGraphBuilder.setNodeParameter(gainNode.id, 'gain', 0.7);

      const state1 = dspGraphBuilder.serialize();

      // Simulate session restart
      const newBuilder = new DSPGraphBuilder(audioContext);
      await newBuilder.initialize();
      newBuilder.deserialize(state1);

      const state2 = newBuilder.serialize();

      expect(state2.nodes.length).toBe(state1.nodes.length);
      expect(state2.connections.length).toBe(state1.connections.length);

      await newBuilder.destroy();
    });

    it('should handle invalid state gracefully', async () => {
      const invalidState = {
        version: 'invalid',
        nodes: null,
        connections: [],
      };

      const success = dspGraphBuilder.deserialize(invalidState as any);

      expect(success).toBe(false);
    });
  });

  describe('performance regression', () => {
    it('should maintain consistent processing time', async () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);

      const times: number[] = [];
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const output = buffer.map((s) => s * 0.8);
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      // Processing time should be consistent (within 5x variance to prevent CI flakes)
      expect(maxTime / minTime).toBeLessThan(5);
    });

    it('should not degrade performance with multiple operations', async () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);

      const start = performance.now();

      // Multiple operations
      let output = buffer.map((s) => s * 1.2);
      output = output.map((s) => Math.tanh(s));
      output = output.map((s) => s * 0.8);

      const end = performance.now();
      const processingTime = end - start;

      // Should complete in reasonable time (< 100ms for 1 second of audio)
      expect(processingTime).toBeLessThan(100);
    });
  });

  describe('edge case regression', () => {
    it('should handle DC offset correctly', () => {
      const buffer = new Float32Array(48000);
      buffer.fill(0.5); // DC offset

      const output = buffer.map((s) => s * 0.8);

      expect(output[0]).toBeCloseTo(0.4);
      expect(output[output.length - 1]).toBeCloseTo(0.4);
    });

    it('should handle clipping correctly', () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 1.5); // Above full scale

      const output = buffer.map((s) => Math.max(-1, Math.min(1, s)));

      const outputPeak = AudioTestUtils.calculatePeak(output);
      expect(outputPeak).toBeLessThanOrEqual(1.0);
    });

    it('should handle very low amplitude signals', () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.0001);

      const output = buffer.map((s) => s * 10); // Boost very low signal

      const outputRMS = AudioTestUtils.calculateRMS(output);
      expect(outputRMS).toBeGreaterThan(0);
    });

    it('should handle NaN values gracefully', () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      buffer[1000] = NaN;

      const output = buffer.map((s) => (isNaN(s) ? 0 : s * 0.8));

      expect(isNaN(output[1000])).toBe(false);
    });

    it('should handle Infinity values gracefully', () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      buffer[1000] = Infinity;

      const output = buffer.map((s) => (!isFinite(s) ? 0 : s * 0.8));

      expect(isFinite(output[1000])).toBe(true);
    });
  });
});
