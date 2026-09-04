// 3WM SONIK — Production Performance Diagnostics & Audio Watchdog
// Real-time audio performance watchdog, buffer underrun/xrun tracker, and system health metrics.

import { PlatformRegistry } from '../audio/platform/PlatformRegistry';

export interface PerformanceSnapshot {
  timestamp: number;
  engineMode: 'Native-ASIO' | 'Native-CoreAudio' | 'WebAudio-WASM' | 'WebGPU-Accelerated';
  audioThreadLoadPercent: number;
  cpuUsagePercent: number;
  dspLatencyMs: number;
  roundtripLatencyMs: number;
  bufferUnderrunsCount: number;
  activeVoices: number;
  eventLoopLagMs: number;
  memoryUsedMb: number;
  isHealthy: boolean;
}

export class ProductionDiagnostics {
  private underrunCount = 0;
  private lastLoopTime = performance.now();
  private eventLoopLag = 0;
  private snapshots: PerformanceSnapshot[] = [];
  private listeners: Set<(snapshot: PerformanceSnapshot) => void> = new Set();
  private watchdogInterval: number | null = null;

  constructor() {
    this.startWatchdog();
  }

  public recordUnderrun(): void {
    this.underrunCount++;
    console.warn(`⚠️ [3WM SONIK Diagnostics] Audio buffer underrun detected! (Total: ${this.underrunCount})`);
  }

  public async captureSnapshot(activeVoices = 16): Promise<PerformanceSnapshot> {
    const now = performance.now();
    this.eventLoopLag = Math.max(0, now - this.lastLoopTime - 1000 / 60);
    this.lastLoopTime = now;

    const platform = PlatformRegistry.getAudioPlatform();
    const systemMetrics = await platform.getSystemMetrics();
    const caps = PlatformRegistry.getCapabilities();

    let engineMode: PerformanceSnapshot['engineMode'] = 'WebAudio-WASM';
    if (caps.isNativeDesktop) {
      engineMode = caps.supportsASIO ? 'Native-ASIO' : 'Native-CoreAudio';
    } else if (caps.supportsWebGPU) {
      engineMode = 'WebGPU-Accelerated';
    }

    const memoryMb = systemMetrics.memoryUsedMb || (performance as any).memory
      ? Math.round((performance as any).memory?.usedJSHeapSize / (1024 * 1024)) || 120
      : 120;

    const isHealthy =
      systemMetrics.audioThreadLoadPercent < 85 &&
      this.underrunCount === 0 &&
      this.eventLoopLag < 30;

    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      engineMode,
      audioThreadLoadPercent: systemMetrics.audioThreadLoadPercent,
      cpuUsagePercent: systemMetrics.cpuUsagePercent,
      dspLatencyMs: parseFloat(systemMetrics.dspLatencyMs.toFixed(2)),
      roundtripLatencyMs: parseFloat(systemMetrics.roundtripLatencyMs.toFixed(2)),
      bufferUnderrunsCount: this.underrunCount,
      activeVoices,
      eventLoopLagMs: parseFloat(this.eventLoopLag.toFixed(2)),
      memoryUsedMb: memoryMb,
      isHealthy,
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > 100) this.snapshots.shift();

    this.notify(snapshot);
    return snapshot;
  }

  private startWatchdog(): void {
    if (typeof window === 'undefined') return;

    this.watchdogInterval = window.setInterval(() => {
      this.captureSnapshot();
    }, 1000);
  }

  public subscribe(listener: (snapshot: PerformanceSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(snapshot: PerformanceSnapshot): void {
    this.listeners.forEach((l) => l(snapshot));
  }

  public getRecentSnapshots(): PerformanceSnapshot[] {
    return [...this.snapshots];
  }

  public destroy(): void {
    if (this.watchdogInterval !== null) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
    }
    this.listeners.clear();
  }
}

export const productionDiagnostics = new ProductionDiagnostics();
