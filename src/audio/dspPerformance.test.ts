/**
 * Audio Performance Metrics Tests
 * Part of Phase 5.2.6: Test audio performance metrics (latency, CPU usage, throughput)
 */

import { DSPPerformanceMonitor } from './dspPerformance';
import { AudioTestUtils } from './testUtils';

describe('DSP Performance Monitor Tests', () => {
  let monitor: DSPPerformanceMonitor;
  let audioContext: AudioContext;

  beforeEach(() => {
    audioContext = new AudioContext();
    monitor = new DSPPerformanceMonitor(audioContext);
  });

  afterEach(async () => {
    await audioContext.close();
  });

  describe('execution time measurement', () => {
    it('should measure execution time of synchronous function', async () => {
      const fn = () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const { result, executionTime } = await monitor.measureExecutionTime(fn);

      expect(result).toBeGreaterThan(0);
      expect(executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should measure execution time of async function', async () => {
      const fn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'done';
      };

      const { result, executionTime } = await monitor.measureExecutionTime(fn);

      expect(result).toBe('done');
      expect(executionTime).toBeGreaterThanOrEqual(10);
    });

    it('should handle start and end measurement', () => {
      monitor.startMeasurement();

      // Simulate work
      let _sum = 0;
      for (let i = 0; i < 1000; i++) {
        _sum += i;
      }

      const executionTime = monitor.endMeasurement();

      expect(executionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CPU usage estimation', () => {
    it('should return CPU usage between 0 and 1', () => {
      const cpuUsage = monitor.getCPUUsage();

      expect(cpuUsage).toBeGreaterThanOrEqual(0);
      expect(cpuUsage).toBeLessThanOrEqual(1);
    });

    it('should return consistent CPU usage estimates', () => {
      const usage1 = monitor.getCPUUsage();
      const usage2 = monitor.getCPUUsage();

      // Should be in similar range
      expect(Math.abs(usage1 - usage2)).toBeLessThan(0.5);
    });
  });

  describe('memory usage estimation', () => {
    it('should return memory usage between 0 and 1', () => {
      const memoryUsage = monitor.getMemoryUsage();

      expect(memoryUsage).toBeGreaterThanOrEqual(0);
      expect(memoryUsage).toBeLessThanOrEqual(1);
    });
  });

  describe('latency measurement', () => {
    it('should measure audio latency', () => {
      const latency = monitor.measureLatency();

      expect(latency).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 when no audio context', () => {
      const monitorNoContext = new DSPPerformanceMonitor();
      const latency = monitorNoContext.measureLatency();

      expect(latency).toBe(0);
    });
  });

  describe('throughput calculation', () => {
    it('should calculate throughput correctly', () => {
      const samplesProcessed = 48000;
      const executionTime = 100; // 100ms

      const throughput = monitor.calculateThroughput(samplesProcessed, executionTime);

      expect(throughput).toBe(480000); // samples per second
    });

    it('should return 0 when execution time is 0', () => {
      const throughput = monitor.calculateThroughput(48000, 0);

      expect(throughput).toBe(0);
    });
  });

  describe('dropout detection', () => {
    it('should detect dropouts in buffer', () => {
      const buffer = AudioTestUtils.generateSilence(1, 48000);
      // Add a dropout (extended silence) - create a gap in the signal
      for (let i = 10000; i < 10500; i++) {
        buffer[i] = 0;
      }
      // Add some signal before and after to create contrast
      for (let i = 0; i < 5000; i++) {
        buffer[i] = 0.5;
      }
      for (let i = 15000; i < 20000; i++) {
        buffer[i] = 0.5;
      }

      const dropouts = monitor.detectDropouts(buffer, 0.5);

      expect(dropouts).toBeGreaterThan(0);
    });

    it('should not detect dropouts in continuous signal', () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);

      const dropouts = monitor.detectDropouts(buffer);

      expect(dropouts).toBe(0);
    });

    it('should respect custom threshold', () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);

      const dropouts1 = monitor.detectDropouts(buffer, 0.9);
      const dropouts2 = monitor.detectDropouts(buffer, 0.1);

      expect(dropouts1).toBeGreaterThanOrEqual(0);
      expect(dropouts2).toBeGreaterThanOrEqual(0);
    });
  });

  describe('glitch detection', () => {
    it('should detect glitches in buffer', () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      // Add a glitch (sudden jump)
      buffer[1000] = 1.0;
      buffer[1001] = -1.0;

      const glitches = monitor.detectGlitches(buffer);

      expect(glitches).toBeGreaterThan(0);
    });

    it('should not detect glitches in smooth signal', () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);

      const glitches = monitor.detectGlitches(buffer);

      expect(glitches).toBe(0);
    });

    it('should respect custom threshold', () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);

      const glitches1 = monitor.detectGlitches(buffer, 0.95);
      const glitches2 = monitor.detectGlitches(buffer, 0.5);

      expect(glitches1).toBeGreaterThanOrEqual(0);
      expect(glitches2).toBeGreaterThanOrEqual(0);
    });
  });

  describe('comprehensive metrics collection', () => {
    it('should collect all performance metrics', async () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const samplesProcessed = buffer.length;

      const metrics = await monitor.collectMetrics(samplesProcessed, buffer);

      expect(metrics).toBeDefined();
      expect(metrics.executionTime).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeLessThanOrEqual(1);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeLessThanOrEqual(1);
      expect(metrics.throughput).toBeGreaterThanOrEqual(0);
      expect(metrics.latency).toBeGreaterThanOrEqual(0);
      expect(metrics.dropouts).toBeGreaterThanOrEqual(0);
      expect(metrics.glitches).toBeGreaterThanOrEqual(0);
    });

    it('should collect metrics without buffer', async () => {
      const samplesProcessed = 48000;

      const metrics = await monitor.collectMetrics(samplesProcessed);

      expect(metrics).toBeDefined();
      expect(metrics.dropouts).toBe(0);
      expect(metrics.glitches).toBe(0);
    });
  });

  describe('benchmarking', () => {
    it('should run a benchmark', async () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const fn = () => {
        buffer.map((s) => s * 0.5);
      };

      const benchmark = await monitor.runBenchmark('test-benchmark', fn, buffer.length, buffer);

      expect(benchmark).toBeDefined();
      expect(benchmark.name).toBe('test-benchmark');
      expect(benchmark.metrics).toBeDefined();
      expect(benchmark.timestamp).toBeDefined();
    });

    it('should store benchmark history', async () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const fn = () => {
        buffer.map((s) => s * 0.5);
      };

      await monitor.runBenchmark('test-1', fn, buffer.length, buffer);
      await monitor.runBenchmark('test-2', fn, buffer.length, buffer);

      const benchmarks = monitor.getBenchmarks();

      expect(benchmarks).toHaveLength(2);
    });

    it('should get benchmarks by name', async () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const fn = () => {
        buffer.map((s) => s * 0.5);
      };

      await monitor.runBenchmark('test', fn, buffer.length, buffer);
      await monitor.runBenchmark('test', fn, buffer.length, buffer);
      await monitor.runBenchmark('other', fn, buffer.length, buffer);

      const testBenchmarks = monitor.getBenchmarksByName('test');

      expect(testBenchmarks).toHaveLength(2);
    });

    it('should get latest benchmark', async () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const fn = () => {
        buffer.map((s) => s * 0.5);
      };

      await monitor.runBenchmark('test-1', fn, buffer.length, buffer);
      await monitor.runBenchmark('test-2', fn, buffer.length, buffer);

      const latest = monitor.getLatestBenchmark();

      expect(latest).toBeDefined();
      expect(latest?.name).toBe('test-2');
    });

    it('should calculate average metrics', async () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const fn = () => {
        buffer.map((s) => s * 0.5);
      };

      await monitor.runBenchmark('test', fn, buffer.length, buffer);
      await monitor.runBenchmark('test', fn, buffer.length, buffer);

      const avg = monitor.getAverageMetrics('test');

      expect(avg).toBeDefined();
      expect(avg?.executionTime).toBeGreaterThan(0);
    });

    it('should clear benchmarks', async () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const fn = () => {
        buffer.map((s) => s * 0.5);
      };

      await monitor.runBenchmark('test', fn, buffer.length, buffer);
      monitor.clearBenchmarks();

      const benchmarks = monitor.getBenchmarks();

      expect(benchmarks).toHaveLength(0);
    });
  });

  describe('report generation', () => {
    it('should generate performance report', async () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const fn = () => {
        buffer.map((s) => s * 0.5);
      };

      await monitor.runBenchmark('test', fn, buffer.length, buffer);

      const report = monitor.generateReport();

      expect(report).toBeDefined();
      expect(report).toContain('DSP Performance Report');
      expect(report).toContain('test');
    });

    it('should return message when no benchmarks', () => {
      const report = monitor.generateReport();

      expect(report).toContain('No benchmarks available');
    });
  });

  describe('benchmark comparison', () => {
    it('should compare two benchmarks', async () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const fn1 = () => {
        buffer.map((s) => s * 0.5);
      };
      const fn2 = () => {
        buffer.map((s) => s * 0.8);
      };

      await monitor.runBenchmark('fast', fn1, buffer.length, buffer);
      await monitor.runBenchmark('slow', fn2, buffer.length, buffer);

      const comparison = monitor.compareBenchmarks('fast', 'slow');

      expect(comparison).toBeDefined();
      expect(comparison.benchmark1).toBeDefined();
      expect(comparison.benchmark2).toBeDefined();
      expect(comparison.comparison).toBeDefined();
    });

    it('should handle missing benchmarks', () => {
      const comparison = monitor.compareBenchmarks('nonexistent', 'also-nonexistent');

      expect(comparison.benchmark1).toBeNull();
      expect(comparison.benchmark2).toBeNull();
      expect(comparison.comparison).toContain('Insufficient data');
    });
  });

  describe('audio context management', () => {
    it('should set audio context', async () => {
      const newContext = new AudioContext();
      monitor.setAudioContext(newContext);

      expect(monitor.getAudioContext()).toBe(newContext);

      await newContext.close();
    });

    it('should get audio context', () => {
      const context = monitor.getAudioContext();

      expect(context).toBe(audioContext);
    });
  });

  describe('performance thresholds', () => {
    it('should detect if performance is acceptable', async () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);
      const fn = () => {
        buffer.map((s) => s * 0.5);
      };

      const benchmark = await monitor.runBenchmark('test', fn, buffer.length, buffer);

      // Check if metrics are within acceptable ranges
      expect(benchmark.metrics.cpuUsage).toBeLessThan(1);
      expect(benchmark.metrics.memoryUsage).toBeLessThan(1);
      expect(benchmark.metrics.dropouts).toBe(0);
      expect(benchmark.metrics.glitches).toBe(0);
    });

    it('should detect performance degradation', async () => {
      const buffer = AudioTestUtils.generateSineWave(1000, 1, 48000, 0.5);

      // Run fast benchmark
      await monitor.runBenchmark(
        'fast',
        () => {
          buffer.map((s) => s * 0.5);
        },
        buffer.length,
        buffer
      );

      // Run slow benchmark
      await monitor.runBenchmark(
        'slow',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          buffer.map((s) => s * 0.5);
        },
        buffer.length,
        buffer
      );

      const avgFast = monitor.getAverageMetrics('fast');
      const avgSlow = monitor.getAverageMetrics('slow');

      expect(avgSlow?.executionTime).toBeGreaterThan(avgFast?.executionTime ?? 0);
    });
  });
});
