// 3WM SONIK — Platform Abstraction Layer (PAL) Interfaces
// Defines canonical contracts for Web, Desktop (Electron), and C++ Native execution environments.

export interface AudioDeviceDescriptor {
  id: string;
  name: string;
  type: 'input' | 'output';
  driverType: 'ASIO' | 'CoreAudio' | 'WASAPI' | 'DirectSound' | 'WebAudio' | 'PulseAudio';
  sampleRates: number[];
  inputChannels: number;
  outputChannels: number;
  isDefault: boolean;
  minBufferSize?: number;
  maxBufferSize?: number;
}

export interface PlatformCapabilities {
  isNativeDesktop: boolean;
  os: 'windows' | 'macos' | 'linux' | 'browser';
  supportsASIO: boolean;
  supportsCoreAudio: boolean;
  supportsVST3: boolean;
  supportsAU: boolean;
  supportsDirectML: boolean;
  supportsWebGPU: boolean;
  supportsSharedArrayBuffer: boolean;
  maxSampleRate: number;
  supportedBufferSizes: number[];
  hardwareThreads: number;
  totalMemoryMb: number;
}

export interface SystemMetrics {
  cpuUsagePercent: number;
  audioThreadLoadPercent: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  dspLatencyMs: number;
  roundtripLatencyMs: number;
  bufferUnderrunsCount: number;
}

export interface AudioPlatformConfig {
  sampleRate: number;
  bufferSize: number;
  inputDeviceId?: string;
  outputDeviceId?: string;
  driverType?: AudioDeviceDescriptor['driverType'];
  enableExclusiveMode?: boolean;
}

export interface IAudioPlatformAdapter {
  readonly platformName: 'WebAudio' | 'NativeIPC' | 'JUCECore';

  initialize(config?: Partial<AudioPlatformConfig>): Promise<boolean>;
  dispose(): Promise<void>;

  getCapabilities(): PlatformCapabilities;
  getSystemMetrics(): Promise<SystemMetrics>;

  // Device Management
  getAudioDevices(): Promise<AudioDeviceDescriptor[]>;
  setAudioConfig(config: Partial<AudioPlatformConfig>): Promise<boolean>;
  getAudioConfig(): AudioPlatformConfig;

  // Engine Lifecycle
  startAudioContext(): Promise<void>;
  suspendAudioContext(): Promise<void>;
  resumeAudioContext(): Promise<void>;
  getAudioState(): 'running' | 'suspended' | 'closed' | 'interrupted';

  // Real-time Audio DSP & Metering
  getMasterVolume(): number;
  setMasterVolume(volume: number): void;
  getPeakLevels(): { left: number; right: number; lufs: number };

  // Audio Context Access for Web DSP nodes
  getRawContext(): AudioContext | null;
}

export interface FileDescriptor {
  path: string;
  name: string;
  sizeBytes: number;
  lastModified: number;
  mimeType: string;
}

export interface IFileSystemAdapter {
  isLocalDiskAvailable(): boolean;
  showOpenFileDialog(options?: {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    properties?: ('openFile' | 'openDirectory' | 'multiSelections')[];
  }): Promise<string[] | null>;

  showSaveFileDialog(options?: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }): Promise<string | null>;

  readFileAsArrayBuffer(filePath: string): Promise<ArrayBuffer>;
  writeFileFromArrayBuffer(filePath: string, buffer: ArrayBuffer): Promise<boolean>;
  exists(filePath: string): Promise<boolean>;
  getTempDirectory(): Promise<string>;
}

export interface MidiPortDescriptor {
  id: string;
  name: string;
  manufacturer?: string;
  type: 'input' | 'output';
  state: 'connected' | 'disconnected';
}

export interface IMidiPlatformAdapter {
  initialize(): Promise<boolean>;
  getMidiPorts(): Promise<MidiPortDescriptor[]>;
  onMidiMessage(callback: (event: { portId: string; data: Uint8Array; timestamp: number }) => void): () => void;
  sendMidiMessage(portId: string, data: Uint8Array, timestamp?: number): void;
}
