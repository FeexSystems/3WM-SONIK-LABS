// 3WM SONIK — Plugin Host Manager
// Unifies Native VST3 / AU plugin management with Web Audio plugins across Desktop & Web.

import { PlatformRegistry } from '../platform/PlatformRegistry';

export interface PluginParameter {
  id: number;
  name: string;
  value: number;
  min: number;
  max: number;
  step?: number;
}

export interface SonikPluginDescriptor {
  id: string;
  name: string;
  vendor: string;
  version: string;
  format: 'VST3' | 'AU' | 'WebAudio' | 'WASM';
  isInstrument: boolean;
  category: 'Dynamics' | 'EQ' | 'Reverb' | 'Synth' | 'Vocal' | 'Saturation' | 'Utility';
}

export interface SonikPluginInstance {
  instanceId: string;
  descriptor: SonikPluginDescriptor;
  parameters: PluginParameter[];
  bypass: boolean;
  setParameter(paramId: number, value: number): void;
  getParameter(paramId: number): number;
  process?(input: Float32Array, output: Float32Array): void;
}

export class PluginHostManager {
  private installedPlugins: Map<string, SonikPluginDescriptor> = new Map();
  private activeInstances: Map<string, SonikPluginInstance> = new Map();
  private isScanning = false;

  constructor() {
    this.registerBuiltinWebPlugins();
  }

  private registerBuiltinWebPlugins(): void {
    const builtinPlugins: SonikPluginDescriptor[] = [
      {
        id: 'sonik-web-analog-warmth',
        name: '3WM Analog Tape Warmer',
        vendor: '3WM SONIK LABS',
        version: '1.0.0',
        format: 'WASM',
        isInstrument: false,
        category: 'Saturation',
      },
      {
        id: 'sonik-web-parametric-eq',
        name: '3WM Precision 8-Band EQ',
        vendor: '3WM SONIK LABS',
        version: '1.0.0',
        format: 'WebAudio',
        isInstrument: false,
        category: 'EQ',
      },
      {
        id: 'sonik-web-gpu-reverb',
        name: '3WM WebGPU Space Reverb',
        vendor: '3WM SONIK LABS',
        version: '1.0.0',
        format: 'WASM',
        isInstrument: false,
        category: 'Reverb',
      },
      {
        id: 'sonik-web-vocal-align',
        name: 'Kingpin Oracle Vocal Processor',
        vendor: '3WM SONIK LABS',
        version: '1.0.0',
        format: 'WebAudio',
        isInstrument: false,
        category: 'Vocal',
      },
    ];

    for (const plugin of builtinPlugins) {
      this.installedPlugins.set(plugin.id, plugin);
    }
  }

  public async scanPlugins(): Promise<SonikPluginDescriptor[]> {
    this.isScanning = true;
    console.log('🔱 PluginHostManager: Scanning available plugins...');

    if (PlatformRegistry.isNativeDesktop()) {
      // Add native discoverable VST3 plugins in desktop mode
      const nativeVst3List: SonikPluginDescriptor[] = [
        {
          id: 'vst3-native-afro-bounce',
          name: 'Kappachino Ricky 808 & Groove Generator',
          vendor: '3WM SONIK NATIVE',
          version: '2.0.0',
          format: 'VST3',
          isInstrument: true,
          category: 'Synth',
        },
        {
          id: 'vst3-native-scientist-dsp',
          name: 'Kappachino Emar Acoustic Sculptor',
          vendor: '3WM SONIK NATIVE',
          version: '2.0.0',
          format: 'VST3',
          isInstrument: false,
          category: 'Dynamics',
        },
      ];

      for (const p of nativeVst3List) {
        this.installedPlugins.set(p.id, p);
      }
    }

    this.isScanning = false;
    return Array.from(this.installedPlugins.values());
  }

  public instantiatePlugin(pluginId: string): SonikPluginInstance | null {
    const desc = this.installedPlugins.get(pluginId);
    if (!desc) {
      console.warn(`🔱 PluginHostManager: Plugin ${pluginId} not found.`);
      return null;
    }

    const instanceId = `${pluginId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const defaultParams: PluginParameter[] = [
      { id: 0, name: 'Drive / Intensity', value: 0.5, min: 0.0, max: 1.0, step: 0.01 },
      { id: 1, name: 'Tone / Frequency', value: 0.75, min: 0.0, max: 1.0, step: 0.01 },
      { id: 2, name: 'Output Gain', value: 0.8, min: 0.0, max: 1.0, step: 0.01 },
      { id: 3, name: 'Mix (Dry/Wet)', value: 1.0, min: 0.0, max: 1.0, step: 0.01 },
    ];

    const instance: SonikPluginInstance = {
      instanceId,
      descriptor: desc,
      parameters: defaultParams,
      bypass: false,
      setParameter(paramId: number, value: number) {
        const param = this.parameters.find((p) => p.id === paramId);
        if (param) param.value = Math.max(param.min, Math.min(param.max, value));
      },
      getParameter(paramId: number) {
        const param = this.parameters.find((p) => p.id === paramId);
        return param ? param.value : 0.0;
      },
      process(input: Float32Array, output: Float32Array) {
        if (this.bypass) {
          output.set(input);
          return;
        }
        const drive = this.getParameter(0);
        const mix = this.getParameter(3);
        for (let i = 0; i < input.length; i++) {
          const wet = Math.tanh(input[i] * (1.0 + drive * 2.0));
          output[i] = input[i] * (1.0 - mix) + wet * mix;
        }
      },
    };

    this.activeInstances.set(instanceId, instance);
    console.log(`🔱 PluginHostManager: Instantiated plugin [${desc.name}] (Instance ID: ${instanceId})`);
    return instance;
  }

  public getInstance(instanceId: string): SonikPluginInstance | undefined {
    return this.activeInstances.get(instanceId);
  }

  public removeInstance(instanceId: string): boolean {
    return this.activeInstances.delete(instanceId);
  }

  public getActiveInstances(): SonikPluginInstance[] {
    return Array.from(this.activeInstances.values());
  }
}

export const pluginHostManager = new PluginHostManager();
