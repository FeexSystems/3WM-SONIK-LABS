// 3WM SONIK — Web Platform Adapters
// Standard browser implementation using Web Audio API, Web MIDI API, and Browser File APIs.

import {
  AudioDeviceDescriptor,
  AudioPlatformConfig,
  IAudioPlatformAdapter,
  IFileSystemAdapter,
  IMidiPlatformAdapter,
  MidiPortDescriptor,
  PlatformCapabilities,
  SystemMetrics,
} from './IAudioPlatformAdapter';

export class WebAudioAdapter implements IAudioPlatformAdapter {
  readonly platformName = 'WebAudio';
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private config: AudioPlatformConfig = {
    sampleRate: 48000,
    bufferSize: 512,
  };

  async initialize(config?: Partial<AudioPlatformConfig>): Promise<boolean> {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) {
        console.error('WebAudioAdapter: Web Audio API is not supported in this browser.');
        return false;
      }

      if (config) {
        this.config = { ...this.config, ...config };
      }

      this.ctx = new AudioCtxClass({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive',
      });

      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      return true;
    } catch (err) {
      console.error('WebAudioAdapter initialization error:', err);
      return false;
    }
  }

  async dispose(): Promise<void> {
    if (this.ctx && this.ctx.state !== 'closed') {
      await this.ctx.close();
      this.ctx = null;
    }
  }

  getCapabilities(): PlatformCapabilities {
    const isMac = navigator.userAgent.toLowerCase().includes('mac');
    const isWin = navigator.userAgent.toLowerCase().includes('win');
    const isLinux = navigator.userAgent.toLowerCase().includes('linux');

    return {
      isNativeDesktop: false,
      os: isMac ? 'macos' : isWin ? 'windows' : isLinux ? 'linux' : 'browser',
      supportsASIO: false,
      supportsCoreAudio: false,
      supportsVST3: false,
      supportsAU: false,
      supportsDirectML: false,
      supportsWebGPU: 'gpu' in navigator,
      supportsSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      maxSampleRate: 96000,
      supportedBufferSizes: [128, 256, 512, 1024, 2048],
      hardwareThreads: navigator.hardwareConcurrency || 4,
      totalMemoryMb: ((navigator as unknown as { deviceMemory?: number }).deviceMemory || 8) * 1024,
    };
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    return {
      cpuUsagePercent: 0, // Web browser restricted
      audioThreadLoadPercent: this.ctx ? (this.ctx.baseLatency ? (this.ctx.baseLatency * 1000) : 10) : 0,
      memoryUsedMb: memory ? Math.round(memory.usedJSHeapSize / (1024 * 1024)) : 128,
      memoryTotalMb: memory ? Math.round(memory.jsHeapSizeLimit / (1024 * 1024)) : 2048,
      dspLatencyMs: this.ctx ? (this.ctx.baseLatency || 0.005) * 1000 : 10,
      roundtripLatencyMs: this.ctx ? ((this.ctx.baseLatency || 0.005) + (this.ctx.outputLatency || 0.01)) * 1000 : 20,
      bufferUnderrunsCount: 0,
    };
  }

  async getAudioDevices(): Promise<AudioDeviceDescriptor[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [
        {
          id: 'default-output',
          name: 'System Default Audio Output',
          type: 'output',
          driverType: 'WebAudio',
          sampleRates: [44100, 48000, 96000],
          inputChannels: 0,
          outputChannels: 2,
          isDefault: true,
        },
      ];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const descriptors: AudioDeviceDescriptor[] = [];

      devices.forEach((dev, idx) => {
        if (dev.kind === 'audioinput' || dev.kind === 'audiooutput') {
          descriptors.push({
            id: dev.deviceId || `web-device-${idx}`,
            name: dev.label || `${dev.kind === 'audioinput' ? 'Microphone / Input' : 'Speakers / Output'} (${idx + 1})`,
            type: dev.kind === 'audioinput' ? 'input' : 'output',
            driverType: 'WebAudio',
            sampleRates: [44100, 48000],
            inputChannels: dev.kind === 'audioinput' ? 2 : 0,
            outputChannels: dev.kind === 'audiooutput' ? 2 : 0,
            isDefault: dev.deviceId === 'default' || idx === 0,
          });
        }
      });

      return descriptors;
    } catch {
      return [];
    }
  }

  async setAudioConfig(config: Partial<AudioPlatformConfig>): Promise<boolean> {
    this.config = { ...this.config, ...config };
    return true;
  }

  getAudioConfig(): AudioPlatformConfig {
    return { ...this.config };
  }

  async startAudioContext(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  async suspendAudioContext(): Promise<void> {
    if (this.ctx && this.ctx.state === 'running') {
      await this.ctx.suspend();
    }
  }

  async resumeAudioContext(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  getAudioState(): 'running' | 'suspended' | 'closed' | 'interrupted' {
    return this.ctx ? (this.ctx.state as 'running' | 'suspended' | 'closed' | 'interrupted') : 'closed';
  }

  getMasterVolume(): number {
    return this.masterGain ? this.masterGain.gain.value : 1.0;
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(2, volume)), this.ctx.currentTime, 0.01);
    }
  }

  getPeakLevels(): { left: number; right: number; lufs: number } {
    if (!this.analyser) return { left: -60, right: -60, lufs: -60 };

    const buffer = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatTimeDomainData(buffer);

    let sum = 0;
    let peak = 0;
    for (let i = 0; i < buffer.length; i++) {
      const abs = Math.abs(buffer[i]);
      if (abs > peak) peak = abs;
      sum += abs * abs;
    }

    const rms = Math.sqrt(sum / buffer.length);
    const dbPeak = peak > 0 ? 20 * Math.log10(peak) : -60;
    const dbRms = rms > 0 ? 20 * Math.log10(rms) : -60;

    return {
      left: Math.max(-60, dbPeak),
      right: Math.max(-60, dbPeak),
      lufs: Math.max(-60, dbRms - 3), // Estimated integrated loudness
    };
  }

  getRawContext(): AudioContext | null {
    return this.ctx;
  }
}

export class WebFileSystemAdapter implements IFileSystemAdapter {
  isLocalDiskAvailable(): boolean {
    return false; // In browser mode, direct file path access is sandbox-restricted
  }

  async showOpenFileDialog(options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    properties?: ('openFile' | 'openDirectory' | 'multiSelections')[];
  }): Promise<string[] | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = Boolean(options?.properties?.includes('multiSelections'));
      if (options?.filters && options.filters.length > 0) {
        input.accept = options.filters.flatMap((f) => f.extensions.map((ext) => `.${ext}`)).join(',');
      }

      input.onchange = () => {
        if (input.files && input.files.length > 0) {
          const fileUrls: string[] = [];
          for (let i = 0; i < input.files.length; i++) {
            fileUrls.push(URL.createObjectURL(input.files[i]));
          }
          resolve(fileUrls);
        } else {
          resolve(null);
        }
      };

      input.onerror = () => resolve(null);
      input.click();
    });
  }

  async showSaveFileDialog(): Promise<string | null> {
    return 'sonik_project_' + Date.now() + '.3wm';
  }

  async readFileAsArrayBuffer(filePath: string): Promise<ArrayBuffer> {
    const res = await fetch(filePath);
    return await res.arrayBuffer();
  }

  async writeFileFromArrayBuffer(_filePath: string, buffer: ArrayBuffer): Promise<boolean> {
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '3wm_project_export.zip';
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const res = await fetch(filePath, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getTempDirectory(): Promise<string> {
    return '/tmp';
  }
}

export class WebMidiAdapter implements IMidiPlatformAdapter {
  private midiAccess: MIDIAccess | null = null;

  async initialize(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) {
      console.warn('WebMidiAdapter: Web MIDI API not supported in this browser.');
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      return true;
    } catch (err) {
      console.error('WebMidiAdapter initialization error:', err);
      return false;
    }
  }

  async getMidiPorts(): Promise<MidiPortDescriptor[]> {
    if (!this.midiAccess) return [];

    const ports: MidiPortDescriptor[] = [];
    this.midiAccess.inputs.forEach((port) => {
      ports.push({
        id: port.id,
        name: port.name || 'MIDI Input Device',
        manufacturer: port.manufacturer || undefined,
        type: 'input',
        state: port.state === 'connected' ? 'connected' : 'disconnected',
      });
    });

    this.midiAccess.outputs.forEach((port) => {
      ports.push({
        id: port.id,
        name: port.name || 'MIDI Output Device',
        manufacturer: port.manufacturer || undefined,
        type: 'output',
        state: port.state === 'connected' ? 'connected' : 'disconnected',
      });
    });

    return ports;
  }

  onMidiMessage(callback: (event: { portId: string; data: Uint8Array; timestamp: number }) => void): () => void {
    if (!this.midiAccess) return () => {};

    const handlers: { port: MIDIInput; handler: (e: MIDIMessageEvent) => void }[] = [];

    this.midiAccess.inputs.forEach((input) => {
      const handler = (e: MIDIMessageEvent) => {
        if (e.data) {
          callback({
            portId: input.id,
            data: e.data,
            timestamp: e.timeStamp,
          });
        }
      };
      input.onmidimessage = handler;
      handlers.push({ port: input, handler });
    });

    return () => {
      handlers.forEach(({ port }) => {
        port.onmidimessage = null;
      });
    };
  }

  sendMidiMessage(portId: string, data: Uint8Array, timestamp?: number): void {
    if (!this.midiAccess) return;
    const output = this.midiAccess.outputs.get(portId);
    if (output) {
      output.send(data, timestamp);
    }
  }
}
