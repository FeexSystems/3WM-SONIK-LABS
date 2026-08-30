/**
 * DSP Performance Measurement Utilities
 * Part of Phase 5.2.3: Add DSP performance measurement utilities
 */

export interface PerformanceMetrics {
  executionTime: number;
  cpuUsage: number;
  memoryUsage: number;
  throughput: number;
  latency: number;
  dropouts: number;
  glitches: number;
}

export interface PerformanceBenchmark {
  name: string;
  metrics: PerformanceMetrics;
  timestamp: number;
}

export class DSPPerformanceMonitor {
  private benchmarks: PerformanceBenchmark[] = [];
  private startTime: number = 0;
  private audioContext: AudioContext | null = null;

  constructor(audioContext?: AudioContext) {
    this.audioContext = audioContext || null;
  }

  /**
   * Start performance measurement
   */
  startMeasurement(): void {
    this.startTime = performance.now();
  }

  /**
   * End performance measurement and return duration
   */
  endMeasurement(): number {
    const endTime = performance.now();
    return endTime - this.startTime;
  }

  /**
   * Measure execution time of a function
   */
  async measureExecutionTime<T>(
    fn: () => Promise<T> | T
  ): Promise<{ result: T; executionTime: number }> {
    this.startMeasurement();
    const result = await fn();
    const executionTime = this.endMeasurement();
    return { result, executionTime };
  }

  /**
   * Get current CPU usage estimate
   */
  getCPUUsage(): number {
    // Estimate CPU usage based on performance.now() timing
    // This is a simplified implementation
    const start = performance.now();
    let count = 0;

    // Busy wait for a short time to measure CPU speed
    const end = start + 10;
    while (performance.now() < end) {
      count++;
    }

    // Normalize to 0-1 range (simplified)
    return Math.min(1, count / 1000000);
  }

  /**
   * Get current memory usage estimate
   */
  getMemoryUsage(): number {
    // Use performance.memory if available (Chrome)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }

    // Fallback estimate
    return 0.5;
  }

  /**
   * Measure audio latency
   */
  measureLatency(): number {
    if (!this.audioContext) return 0;

    const baseLatency = this.audioContext.baseLatency || 0;
    const outputLatency = this.audioContext.outputLatency || 0;

    return baseLatency + outputLatency;
  }

  /**
   * Calculate throughput (samples processed per second)
   */
  calculateThroughput(samplesProcessed: number, executionTime: number): number {
    if (executionTime === 0) return 0;
    return samplesProcessed / (executionTime / 1000);
  }

  /**
   * Detect audio dropouts
   */
  detectDropouts(buffer: Float32Array, threshold: number = 0.9): number {
    let dropouts = 0;
    let consecutiveSilent = 0;
    const silenceThreshold = 0.001;
    const minDropoutSamples = 100;

    for (let i = 0; i < buffer.length; i++) {
      if (Math.abs(buffer[i]) < silenceThreshold) {
        consecutiveSilent++;
      } else {
        if (consecutiveSilent >= minDropoutSamples) {
          dropouts++;
        }
        consecutiveSilent = 0;
      }
    }

    return dropouts;
  }

  /**
   * Detect audio glitches
   */
  detectGlitches(buffer: Float32Array, threshold: number = 0.95): number {
    let glitches = 0;

    for (let i = 1; i < buffer.length - 1; i++) {
      const prev = buffer[i - 1];
      const curr = buffer[i];
      const next = buffer[i + 1];

      // Check for sudden jumps
      const jump1 = Math.abs(curr - prev);
      const jump2 = Math.abs(next - curr);

      if (jump1 > threshold || jump2 > threshold) {
        glitches++;
      }
    }

    return glitches;
  }

  /**
   * Collect comprehensive performance metrics
   */
  async collectMetrics(
    samplesProcessed: number,
    buffer?: Float32Array
  ): Promise<PerformanceMetrics> {
    this.startMeasurement();

    const cpuUsage = this.getCPUUsage();
    const memoryUsage = this.getMemoryUsage();
    const latency = this.measureLatency();
    const executionTime = this.endMeasurement();
    const throughput = this.calculateThroughput(samplesProcessed, executionTime);

    const dropouts = buffer ? this.detectDropouts(buffer) : 0;
    const glitches = buffer ? this.detectGlitches(buffer) : 0;

    return {
      executionTime,
      cpuUsage,
      memoryUsage,
      throughput,
      latency,
      dropouts,
      glitches,
    };
  }

  /**
   * Run a benchmark
   */
  async runBenchmark(
    name: string,
    fn: () => Promise<void> | void,
    samplesProcessed: number,
    buffer?: Float32Array
  ): Promise<PerformanceBenchmark> {
    const metrics = await this.collectMetrics(samplesProcessed, buffer);

    // Measure the actual function execution
    const { executionTime } = await this.measureExecutionTime(fn);
    metrics.executionTime = executionTime;

    const benchmark: PerformanceBenchmark = {
      name,
      metrics,
      timestamp: Date.now(),
    };

    this.benchmarks.push(benchmark);
    return benchmark;
  }

  /**
   * Get all benchmarks
   */
  getBenchmarks(): PerformanceBenchmark[] {
    return [...this.benchmarks];
  }

  /**
   * Get benchmarks by name
   */
  getBenchmarksByName(name: string): PerformanceBenchmark[] {
    return this.benchmarks.filter((b) => b.name === name);
  }

  /**
   * Get latest benchmark
   */
  getLatestBenchmark(): PerformanceBenchmark | null {
    if (this.benchmarks.length === 0) return null;
    return this.benchmarks[this.benchmarks.length - 1];
  }

  /**
   * Calculate average metrics for a benchmark
   */
  getAverageMetrics(name: string): PerformanceMetrics | null {
    const benchmarks = this.getBenchmarksByName(name);

    if (benchmarks.length === 0) return null;

    const sum = benchmarks.reduce(
      (acc, b) => ({
        executionTime: acc.executionTime + b.metrics.executionTime,
        cpuUsage: acc.cpuUsage + b.metrics.cpuUsage,
        memoryUsage: acc.memoryUsage + b.metrics.memoryUsage,
        throughput: acc.throughput + b.metrics.throughput,
        latency: acc.latency + b.metrics.latency,
        dropouts: acc.dropouts + b.metrics.dropouts,
        glitches: acc.glitches + b.metrics.glitches,
      }),
      {
        executionTime: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        throughput: 0,
        latency: 0,
        dropouts: 0,
        glitches: 0,
      }
    );

    const count = benchmarks.length;
    return {
      executionTime: sum.executionTime / count,
      cpuUsage: sum.cpuUsage / count,
      memoryUsage: sum.memoryUsage / count,
      throughput: sum.throughput / count,
      latency: sum.latency / count,
      dropouts: sum.dropouts / count,
      glitches: sum.glitches / count,
    };
  }

  /**
   * Clear all benchmarks
   */
  clearBenchmarks(): void {
    this.benchmarks = [];
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    if (this.benchmarks.length === 0) {
      return 'No benchmarks available';
    }

    const latest = this.getLatestBenchmark();
    if (!latest) return 'No benchmarks available';

    return `
DSP Performance Report
======================

Latest Benchmark: ${latest.name}
Timestamp: ${new Date(latest.timestamp).toISOString()}

Metrics:
- Execution Time: ${latest.metrics.executionTime.toFixed(2)} ms
- CPU Usage: ${(latest.metrics.cpuUsage * 100).toFixed(2)}%
- Memory Usage: ${(latest.metrics.memoryUsage * 100).toFixed(2)}%
- Throughput: ${latest.metrics.throughput.toFixed(0)} samples/sec
- Latency: ${(latest.metrics.latency * 1000).toFixed(2)} ms
- Dropouts: ${latest.metrics.dropouts}
- Glitches: ${latest.metrics.glitches}

Total Benchmarks: ${this.benchmarks.length}
    `.trim();
  }

  /**
   * Compare two benchmarks
   */
  compareBenchmarks(
    name1: string,
    name2: string
  ): {
    benchmark1: PerformanceMetrics | null;
    benchmark2: PerformanceMetrics | null;
    comparison: string;
  } {
    const avg1 = this.getAverageMetrics(name1);
    const avg2 = this.getAverageMetrics(name2);

    if (!avg1 || !avg2) {
      return {
        benchmark1: avg1,
        benchmark2: avg2,
        comparison: 'Insufficient data for comparison',
      };
    }

    const speedup = avg2.executionTime / avg1.executionTime;
    const cpuDiff = ((avg2.cpuUsage - avg1.cpuUsage) * 100).toFixed(2);
    const memoryDiff = ((avg2.memoryUsage - avg1.memoryUsage) * 100).toFixed(2);

    return {
      benchmark1: avg1,
      benchmark2: avg2,
      comparison: `
${name1} vs ${name2}:
- Execution Time: ${speedup.toFixed(2)}x ${speedup > 1 ? 'faster' : 'slower'}
- CPU Usage: ${cpuDiff}% ${parseFloat(cpuDiff) > 0 ? 'increase' : 'decrease'}
- Memory Usage: ${memoryDiff}% ${parseFloat(memoryDiff) > 0 ? 'increase' : 'decrease'}
      `.trim(),
    };
  }

  /**
   * Set audio context
   */
  setAudioContext(audioContext: AudioContext): void {
    this.audioContext = audioContext;
  }

  /**
   * Get audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
}

// Export singleton instance
export let dspPerformanceMonitor: DSPPerformanceMonitor | null = null;

export function initializeDSPPerformanceMonitor(
  audioContext?: AudioContext
): DSPPerformanceMonitor {
  if (!dspPerformanceMonitor) {
    dspPerformanceMonitor = new DSPPerformanceMonitor(audioContext);
  }
  return dspPerformanceMonitor;
}
