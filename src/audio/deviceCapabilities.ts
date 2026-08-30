/**
 * Device Capability Detection - CPU, audio hardware, and browser support detection
 * Part of Phase 4.2.1: Implement device capability detection (CPU, audio hardware, browser support)
 */

export interface DeviceCapabilities {
  cpu: CPUCapabilities;
  audio: AudioCapabilities;
  browser: BrowserCapabilities;
  performance: PerformanceCapabilities;
}

export interface CPUCapabilities {
  cores: number;
  hardwareConcurrency: number;
  memory: number; // in GB
  estimatedPerformance: 'low' | 'medium' | 'high' | 'ultra';
}

export interface AudioCapabilities {
  sampleRate: number;
  latency: number;
  bufferSize: number;
  channels: number;
  supportsAudioWorklet: boolean;
  supportsWebMIDI: boolean;
  maxOutputChannels: number;
  maxInputChannels: number;
}

export interface BrowserCapabilities {
  name: string;
  version: string;
  platform: string;
  supportsWebGL2: boolean;
  supportsOffscreenCanvas: boolean;
  supportsWebAssembly: boolean;
  supportsSharedArrayBuffer: boolean;
}

export interface PerformanceCapabilities {
  recommendedBufferSize: number;
  recommendedLatency: number;
  maxDSPNodes: number;
  maxConcurrentPlugins: number;
  qualityPreset: 'low' | 'medium' | 'high' | 'ultra';
}

export class DeviceCapabilityDetector {
  private capabilities: DeviceCapabilities | null = null;
  private audioContext: AudioContext | null = null;

  /**
   * Detect all device capabilities
   */
  async detectCapabilities(audioContext?: AudioContext): Promise<DeviceCapabilities> {
    this.audioContext = audioContext || new AudioContext();

    const cpu = await this.detectCPUCapabilities();
    const audio = await this.detectAudioCapabilities();
    const browser = this.detectBrowserCapabilities();
    const performance = this.calculatePerformanceCapabilities(cpu, audio, browser);

    this.capabilities = {
      cpu,
      audio,
      browser,
      performance,
    };

    return this.capabilities;
  }

  /**
   * Detect CPU capabilities
   */
  private async detectCPUCapabilities(): Promise<CPUCapabilities> {
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4; // in GB

    // Estimate performance based on cores and memory
    let estimatedPerformance: 'low' | 'medium' | 'high' | 'ultra';
    if (hardwareConcurrency >= 8 && memory >= 16) {
      estimatedPerformance = 'ultra';
    } else if (hardwareConcurrency >= 6 && memory >= 8) {
      estimatedPerformance = 'high';
    } else if (hardwareConcurrency >= 4 && memory >= 4) {
      estimatedPerformance = 'medium';
    } else {
      estimatedPerformance = 'low';
    }

    return {
      cores: hardwareConcurrency,
      hardwareConcurrency,
      memory,
      estimatedPerformance,
    };
  }

  /**
   * Detect audio capabilities
   */
  private async detectAudioCapabilities(): Promise<AudioCapabilities> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = this.detectOptimalBufferSize();
    const latency = bufferSize / sampleRate;
    const channels = 2; // Stereo by default

    // Check AudioWorklet support
    let supportsAudioWorklet = false;
    try {
      supportsAudioWorklet = 'AudioWorkletNode' in window;
    } catch (e) {
      supportsAudioWorklet = false;
    }

    // Check WebMIDI support
    const supportsWebMIDI = 'requestMIDIAccess' in navigator;

    // Get max input/output channels
    const maxOutputChannels = this.audioContext.destination.maxChannelCount || 2;
    const maxInputChannels = this.detectMaxInputChannels();

    return {
      sampleRate,
      latency,
      bufferSize,
      channels,
      supportsAudioWorklet,
      supportsWebMIDI,
      maxOutputChannels,
      maxInputChannels,
    };
  }

  /**
   * Detect optimal buffer size
   */
  private detectOptimalBufferSize(): number {
    if (!this.audioContext) return 256;

    // Test different buffer sizes to find optimal
    const bufferSizes = [128, 256, 512, 1024, 2048, 4096];

    // Start with a safe default
    let optimalSize = 512;

    // Try to detect the lowest stable buffer size
    for (const size of bufferSizes) {
      try {
        if (this.audioContext.baseLatency !== undefined) {
          const estimatedLatency = size / this.audioContext.sampleRate;
          if (estimatedLatency < 0.01) {
            // < 10ms
            optimalSize = size;
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }

    return optimalSize;
  }

  /**
   * Detect max input channels
   */
  private detectMaxInputChannels(): number {
    // Try to enumerate audio devices
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const audioInputs = devices.filter((device) => device.kind === 'audioinput');
          return audioInputs.length;
        })
        .catch(() => {
          return 1; // Default to 1 if enumeration fails
        });
    }
    return 1;
  }

  /**
   * Detect browser capabilities
   */
  private detectBrowserCapabilities(): BrowserCapabilities {
    const userAgent = navigator.userAgent;
    let name = 'Unknown';
    let version = 'Unknown';
    let platform = navigator.platform;

    // Detect browser name and version
    if (userAgent.includes('Chrome')) {
      const match = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
      name = 'Chrome';
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
      name = 'Firefox';
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari')) {
      const match = userAgent.match(/Version\/(\d+\.\d+)/);
      name = 'Safari';
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Edge')) {
      const match = userAgent.match(/Edge\/(\d+\.\d+\.\d+\.\d+)/);
      name = 'Edge';
      version = match ? match[1] : 'Unknown';
    }

    // Check WebGL2 support
    const supportsWebGL2 = (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!canvas.getContext('webgl2');
      } catch (e) {
        return false;
      }
    })();

    // Check OffscreenCanvas support
    const supportsOffscreenCanvas = 'OffscreenCanvas' in window;

    // Check WebAssembly support
    const supportsWebAssembly = 'WebAssembly' in window;

    // Check SharedArrayBuffer support
    const supportsSharedArrayBuffer = 'SharedArrayBuffer' in window;

    return {
      name,
      version,
      platform,
      supportsWebGL2,
      supportsOffscreenCanvas,
      supportsWebAssembly,
      supportsSharedArrayBuffer,
    };
  }

  /**
   * Calculate performance capabilities based on detected capabilities
   */
  private calculatePerformanceCapabilities(
    cpu: CPUCapabilities,
    audio: AudioCapabilities,
    browser: BrowserCapabilities
  ): PerformanceCapabilities {
    let qualityPreset: 'low' | 'medium' | 'high' | 'ultra' = 'medium';

    // Determine quality preset based on CPU and audio capabilities
    if (cpu.estimatedPerformance === 'ultra' && audio.supportsAudioWorklet) {
      qualityPreset = 'ultra';
    } else if (cpu.estimatedPerformance === 'high' && audio.supportsAudioWorklet) {
      qualityPreset = 'high';
    } else if (cpu.estimatedPerformance === 'medium') {
      qualityPreset = 'medium';
    } else {
      qualityPreset = 'low';
    }

    // Calculate recommended settings based on quality preset
    const recommendedBufferSize = this.getRecommendedBufferSize(qualityPreset);
    const recommendedLatency = recommendedBufferSize / audio.sampleRate;
    const maxDSPNodes = this.getMaxDSPNodes(qualityPreset);
    const maxConcurrentPlugins = this.getMaxConcurrentPlugins(qualityPreset);

    return {
      recommendedBufferSize,
      recommendedLatency,
      maxDSPNodes,
      maxConcurrentPlugins,
      qualityPreset,
    };
  }

  /**
   * Get recommended buffer size for quality preset
   */
  private getRecommendedBufferSize(preset: string): number {
    switch (preset) {
      case 'ultra':
        return 128;
      case 'high':
        return 256;
      case 'medium':
        return 512;
      case 'low':
        return 1024;
      default:
        return 512;
    }
  }

  /**
   * Get max DSP nodes for quality preset
   */
  private getMaxDSPNodes(preset: string): number {
    switch (preset) {
      case 'ultra':
        return 64;
      case 'high':
        return 32;
      case 'medium':
        return 16;
      case 'low':
        return 8;
      default:
        return 16;
    }
  }

  /**
   * Get max concurrent plugins for quality preset
   */
  private getMaxConcurrentPlugins(preset: string): number {
    switch (preset) {
      case 'ultra':
        return 16;
      case 'high':
        return 12;
      case 'medium':
        return 8;
      case 'low':
        return 4;
      default:
        return 8;
    }
  }

  /**
   * Get detected capabilities
   */
  getCapabilities(): DeviceCapabilities | null {
    return this.capabilities;
  }

  /**
   * Check if device meets minimum requirements
   */
  meetsMinimumRequirements(): boolean {
    if (!this.capabilities) return false;

    const { cpu, audio, browser } = this.capabilities;

    // Minimum requirements
    const minCores = 2;
    const minMemory = 2; // GB
    const minSampleRate = 44100;

    return (
      cpu.cores >= minCores &&
      cpu.memory >= minMemory &&
      audio.sampleRate >= minSampleRate &&
      browser.supportsWebAssembly
    );
  }

  /**
   * Get capability report
   */
  getCapabilityReport(): string {
    if (!this.capabilities) return 'Capabilities not detected yet';

    const { cpu, audio, browser, performance } = this.capabilities;

    return `
Device Capability Report
========================

CPU:
- Cores: ${cpu.cores}
- Memory: ${cpu.memory} GB
- Performance: ${cpu.estimatedPerformance}

Audio:
- Sample Rate: ${audio.sampleRate} Hz
- Buffer Size: ${audio.bufferSize}
- Latency: ${audio.latency.toFixed(3)} s
- AudioWorklet: ${audio.supportsAudioWorklet ? 'Supported' : 'Not Supported'}
- WebMIDI: ${audio.supportsWebMIDI ? 'Supported' : 'Not Supported'}

Browser:
- Name: ${browser.name} ${browser.version}
- Platform: ${browser.platform}
- WebGL2: ${browser.supportsWebGL2 ? 'Supported' : 'Not Supported'}
- WebAssembly: ${browser.supportsWebAssembly ? 'Supported' : 'Not Supported'}

Performance:
- Quality Preset: ${performance.qualityPreset}
- Recommended Buffer Size: ${performance.recommendedBufferSize}
- Recommended Latency: ${performance.recommendedLatency.toFixed(3)} s
- Max DSP Nodes: ${performance.maxDSPNodes}
- Max Concurrent Plugins: ${performance.maxConcurrentPlugins}

Minimum Requirements Met: ${this.meetsMinimumRequirements() ? 'Yes' : 'No'}
    `.trim();
  }

  /**
   * Destroy detector
   */
  destroy(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.capabilities = null;
  }
}

// Export singleton instance
export const deviceCapabilityDetector = new DeviceCapabilityDetector();
