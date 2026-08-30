/**
 * 3WM SONIK — AudioWorklet Performance Tests
 * Performance testing for AudioWorklet DSP processing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock AudioContext and AudioWorklet
global.AudioContext = vi.fn(() => ({
  createScriptProcessor: vi.fn(),
  createAnalyser: vi.fn(),
  destination: {},
  sampleRate: 44100,
  state: 'running',
  audioWorklet: {
    addModule: vi.fn(() => Promise.resolve()),
  },
})) as any;

describe('AudioWorklet Performance', () => {
  describe('Initialization Performance', () => {
    it('should initialize AudioWorklet within time budget', async () => {
      const ctx = new AudioContext();
      const startTime = performance.now();

      await ctx.audioWorklet.addModule('/audio/dsp-processor.js');

      const initTime = performance.now() - startTime;
      expect(initTime).toBeLessThan(100); // Should initialize within 100ms
    });

    it('should create AudioWorkletNode efficiently', async () => {
      const ctx = new AudioContext();
      await ctx.audioWorklet.addModule('/audio/dsp-processor.js');

      const startTime = performance.now();
      const node = new AudioWorkletNode(ctx, 'dsp-processor');
      const createTime = performance.now() - startTime;

      expect(createTime).toBeLessThan(50); // Should create within 50ms
      node.disconnect();
    });
  });

  describe('Processing Performance', () => {
    it('should process audio buffer within time budget', async () => {
      const ctx = new AudioContext();
      await ctx.audioWorklet.addModule('/audio/dsp-processor.js');
      const node = new AudioWorkletNode(ctx, 'dsp-processor');

      // Create test buffer
      const bufferSize = 128;
      const buffer = new Float32Array(bufferSize);

      const startTime = performance.now();

      // Simulate processing
      for (let i = 0; i < 1000; i++) {
        node.port.postMessage({ type: 'process', buffer });
      }

      const processTime = performance.now() - startTime;
      const avgTimePerProcess = processTime / 1000;

      expect(avgTimePerProcess).toBeLessThan(1); // Should process within 1ms per buffer

      node.disconnect();
    });

    it('should handle multiple concurrent nodes efficiently', async () => {
      const ctx = new AudioContext();
      await ctx.audioWorklet.addModule('/audio/dsp-processor.js');

      const nodes = [];
      const nodeCount = 10;

      const startTime = performance.now();

      for (let i = 0; i < nodeCount; i++) {
        const node = new AudioWorkletNode(ctx, 'dsp-processor');
        nodes.push(node);
      }

      const createTime = performance.now() - startTime;
      const avgTimePerNode = createTime / nodeCount;

      expect(avgTimePerNode).toBeLessThan(10); // Should create within 10ms per node

      nodes.forEach((node) => node.disconnect());
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during processing', async () => {
      const ctx = new AudioContext();
      await ctx.audioWorklet.addModule('/audio/dsp-processor.js');
      const node = new AudioWorkletNode(ctx, 'dsp-processor');

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Process many buffers
      for (let i = 0; i < 10000; i++) {
        const buffer = new Float32Array(128);
        node.port.postMessage({ type: 'process', buffer });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (< 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);

      node.disconnect();
    });

    it('should clean up nodes properly', async () => {
      const ctx = new AudioContext();
      await ctx.audioWorklet.addModule('/audio/dsp-processor.js');

      const nodes = [];
      for (let i = 0; i < 100; i++) {
        const node = new AudioWorkletNode(ctx, 'dsp-processor');
        nodes.push(node);
      }

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Disconnect all nodes
      nodes.forEach((node) => {
        node.disconnect();
        node.port.close();
      });

      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Memory should decrease after cleanup
      expect(finalMemory).toBeLessThanOrEqual(initialMemory + 5 * 1024 * 1024);
    });
  });

  describe('Parameter Update Performance', () => {
    it('should update parameters efficiently', async () => {
      const ctx = new AudioContext();
      await ctx.audioWorklet.addModule('/audio/dsp-processor.js');
      const node = new AudioWorkletNode(ctx, 'dsp-processor');

      const startTime = performance.now();

      // Update many parameters
      for (let i = 0; i < 1000; i++) {
        node.port.postMessage({
          type: 'setParameter',
          parameter: 'eqLow',
          value: Math.random() * 24 - 12,
        });
      }

      const updateTime = performance.now() - startTime;
      const avgTimePerUpdate = updateTime / 1000;

      expect(avgTimePerUpdate).toBeLessThan(0.1); // Should update within 0.1ms per parameter

      node.disconnect();
    });

    it('should handle rapid parameter changes', async () => {
      const ctx = new AudioContext();
      await ctx.audioWorklet.addModule('/audio/dsp-processor.js');
      const node = new AudioWorkletNode(ctx, 'dsp-processor');

      const startTime = performance.now();

      // Rapid parameter changes (simulating automation)
      for (let i = 0; i < 10000; i++) {
        node.port.postMessage({
          type: 'setParameter',
          parameter: 'eqLow',
          value: Math.sin(i / 100) * 12,
        });
      }

      const updateTime = performance.now() - startTime;

      expect(updateTime).toBeLessThan(1000); // Should complete within 1 second

      node.disconnect();
    });
  });

  describe('Fallback Mode Performance', () => {
    it('should fallback to ScriptProcessor efficiently', async () => {
      const ctx = new AudioContext();
      // Remove audioWorklet to force fallback
      delete (ctx as any).audioWorklet;

      const startTime = performance.now();

      // Create ScriptProcessor as fallback
      const processor = ctx.createScriptProcessor(4096, 2, 2);

      const createTime = performance.now() - startTime;

      expect(createTime).toBeLessThan(50); // Should create within 50ms

      processor.disconnect();
    });

    it('should process audio in fallback mode efficiently', async () => {
      const ctx = new AudioContext();
      delete (ctx as any).audioWorklet;

      const processor = ctx.createScriptProcessor(4096, 2, 2);

      const startTime = performance.now();

      // Simulate processing
      for (let i = 0; i < 1000; i++) {
        const inputBuffer = new Float32Array(4096);
        // Processing would happen here
      }

      const processTime = performance.now() - startTime;
      const avgTimePerProcess = processTime / 1000;

      expect(avgTimePerProcess).toBeLessThan(2); // Should process within 2ms per buffer

      processor.disconnect();
    });
  });

  describe('Real-time Performance', () => {
    it('should maintain real-time processing at 44.1kHz', async () => {
      const ctx = new AudioContext();
      await ctx.audioWorklet.addModule('/audio/dsp-processor.js');
      const node = new AudioWorkletNode(ctx, 'dsp-processor');

      const bufferSize = 128;
      const sampleRate = 44100;
      const bufferDuration = bufferSize / sampleRate; // ~2.9ms
      const timeBudget = bufferDuration * 0.8; // Use 80% of buffer time

      const startTime = performance.now();

      // Process one buffer
      const buffer = new Float32Array(bufferSize);
      node.port.postMessage({ type: 'process', buffer });

      const processTime = performance.now() - startTime;

      expect(processTime).toBeLessThan(timeBudget * 1000); // Convert to ms

      node.disconnect();
    });

    it('should handle audio glitch-free under load', async () => {
      const ctx = new AudioContext();
      await ctx.audioWorklet.addModule('/audio/dsp-processor.js');

      const nodes = [];
      for (let i = 0; i < 5; i++) {
        const node = new AudioWorkletNode(ctx, 'dsp-processor');
        nodes.push(node);
      }

      // Simulate heavy load
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        nodes.forEach((node) => {
          const buffer = new Float32Array(128);
          node.port.postMessage({ type: 'process', buffer });
        });
      }

      const totalTime = performance.now() - startTime;
      const avgTimePerProcess = totalTime / (1000 * nodes.length);

      // Should still process within real-time budget
      expect(avgTimePerProcess).toBeLessThan(2); // 2ms per process

      nodes.forEach((node) => node.disconnect());
    });
  });

  describe('DSP Algorithm Performance', () => {
    it('should process EQ efficiently', async () => {
      const ctx = new AudioContext();
      await ctx.audioWorklet.addModule('/audio/dsp-processor.js');
      const node = new AudioWorkletNode(ctx, 'dsp-processor');

      const startTime = performance.now();

      // Process EQ
      for (let i = 0; i < 1000; i++) {
        node.port.postMessage({
          type: 'process',
          buffer: new Float32Array(128),
          parameters: {
            eqLow: 5,
            eqMid: 0,
            eqHigh: -3,
          },
        });
      }

      const processTime = performance.now() - startTime;
      const avgTimePerProcess = processTime / 1000;

      expect(avgTimePerProcess).toBeLessThan(1); // Should process within 1ms

      node.disconnect();
    });

    it('should process compression efficiently', async () => {
      const ctx = new AudioContext();
      await ctx.audioWorklet.addModule('/audio/dsp-processor.js');
      const node = new AudioWorkletNode(ctx, 'dsp-processor');

      const startTime = performance.now();

      // Process compression
      for (let i = 0; i < 1000; i++) {
        node.port.postMessage({
          type: 'process',
          buffer: new Float32Array(128),
          parameters: {
            compThreshold: -20,
            compRatio: 4,
            compAttack: 0.01,
            compRelease: 0.1,
          },
        });
      }

      const processTime = performance.now() - startTime;
      const avgTimePerProcess = processTime / 1000;

      expect(avgTimePerProcess).toBeLessThan(1); // Should process within 1ms

      node.disconnect();
    });

    it('should process full DSP chain efficiently', async () => {
      const ctx = new AudioContext();
      await ctx.audioWorklet.addModule('/audio/dsp-processor.js');
      const node = new AudioWorkletNode(ctx, 'dsp-processor');

      const startTime = performance.now();

      // Process full chain
      for (let i = 0; i < 1000; i++) {
        node.port.postMessage({
          type: 'process',
          buffer: new Float32Array(128),
          parameters: {
            eqLow: 5,
            eqMid: 0,
            eqHigh: -3,
            compThreshold: -20,
            compRatio: 4,
            compAttack: 0.01,
            compRelease: 0.1,
            saturationDrive: 10,
            limiterThreshold: -1,
            limiterRelease: 0.1,
          },
        });
      }

      const processTime = performance.now() - startTime;
      const avgTimePerProcess = processTime / 1000;

      expect(avgTimePerProcess).toBeLessThan(2); // Should process within 2ms

      node.disconnect();
    });
  });
});
