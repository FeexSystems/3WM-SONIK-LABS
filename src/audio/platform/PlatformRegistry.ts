// 3WM SONIK — Platform Registry Singleton
// Automatically detects environment (Electron Native vs Web Audio) and provides platform adapters.

import {
  IAudioPlatformAdapter,
  IFileSystemAdapter,
  IMidiPlatformAdapter,
  PlatformCapabilities,
} from './IAudioPlatformAdapter';
import { NativeAudioAdapter, NativeFileSystemAdapter, NativeMidiAdapter } from './NativeAudioAdapter';
import { WebAudioAdapter, WebFileSystemAdapter, WebMidiAdapter } from './WebAudioAdapter';

class PlatformRegistryImpl {
  private audioAdapter: IAudioPlatformAdapter;
  private fileSystemAdapter: IFileSystemAdapter;
  private midiAdapter: IMidiPlatformAdapter;
  private isInitialized = false;

  constructor() {
    // Automatically select Native vs Web based on IPC presence
    if (typeof window !== 'undefined' && window.sonikDesktopAPI?.isDesktop) {
      console.log('🔱 PlatformRegistry: Initialized in NATIVE DESKTOP mode (Electron IPC)');
      this.audioAdapter = new NativeAudioAdapter();
      this.fileSystemAdapter = new NativeFileSystemAdapter();
      this.midiAdapter = new NativeMidiAdapter();
    } else {
      console.log('🌐 PlatformRegistry: Initialized in WEB AUDIO mode (Browser / PWA)');
      this.audioAdapter = new WebAudioAdapter();
      this.fileSystemAdapter = new WebFileSystemAdapter();
      this.midiAdapter = new WebMidiAdapter();
    }
  }

  public async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    const audioOk = await this.audioAdapter.initialize();
    const midiOk = await this.midiAdapter.initialize();

    this.isInitialized = audioOk;
    console.log(`🔱 PlatformRegistry readiness: Audio=${audioOk ? 'OK' : 'FAIL'}, MIDI=${midiOk ? 'OK' : 'FAIL'}`);
    return this.isInitialized;
  }

  public getAudioPlatform(): IAudioPlatformAdapter {
    return this.audioAdapter;
  }

  public getFileSystem(): IFileSystemAdapter {
    return this.fileSystemAdapter;
  }

  public getMidiPlatform(): IMidiPlatformAdapter {
    return this.midiAdapter;
  }

  public getCapabilities(): PlatformCapabilities {
    return this.audioAdapter.getCapabilities();
  }

  public isNativeDesktop(): boolean {
    return this.getCapabilities().isNativeDesktop;
  }
}

export const PlatformRegistry = new PlatformRegistryImpl();
