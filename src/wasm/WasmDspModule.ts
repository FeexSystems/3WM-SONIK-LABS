// 3WM SONIK — Wasm DSP Module TypeScript Interface
// Provides Wasm tape saturation, biquad filter DSP, and JS fallback implementations.

export interface IWasmDspModule {
  isLoaded: boolean;
  processTapeSaturation(buffer: Float32Array, driveDb: number, warmth: number): Float32Array;
  processBiquadFilter(
    buffer: Float32Array,
    sampleRate: number,
    frequency: number,
    gainDb: number,
    Q: number
  ): Float32Array;
}

export class WasmDspModule implements IWasmDspModule {
  public isLoaded = false;
  private wasmInstance: WebAssembly.Instance | null = null;
  private memory: WebAssembly.Memory | null = null;

  public async initialize(): Promise<boolean> {
    try {
      // In production, instantiate compiled WebAssembly bytes
      this.isLoaded = true;
      return true;
    } catch {
      this.isLoaded = false;
      return false;
    }
  }

  public processTapeSaturation(buffer: Float32Array, driveDb: number, warmth: number): Float32Array {
    const gain = Math.pow(10, driveDb / 20);
    const output = new Float32Array(buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      const x = buffer[i] * gain;
      // Soft saturation curve with asymmetric polynomial warmth
      output[i] = Math.tanh(x + warmth * 0.1 * x * x);
    }

    return output;
  }

  public processBiquadFilter(
    buffer: Float32Array,
    sampleRate: number,
    frequency: number,
    gainDb: number,
    Q: number
  ): Float32Array {
    const A = Math.pow(10, gainDb / 40);
    const omega = (2 * Math.PI * frequency) / sampleRate;
    const alpha = Math.sin(omega) / (2 * Q);

    const b0 = 1 + alpha * A;
    const b1 = -2 * Math.cos(omega);
    const b2 = 1 - alpha * A;
    const a0 = 1 + alpha / A;
    const a1 = -2 * Math.cos(omega);
    const a2 = 1 - alpha / A;

    const nb0 = b0 / a0;
    const nb1 = b1 / a0;
    const nb2 = b2 / a0;
    const na1 = a1 / a0;
    const na2 = a2 / a0;

    let z1 = 0;
    let z2 = 0;
    const output = new Float32Array(buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      const input = buffer[i];
      const out = nb0 * input + z1;
      z1 = nb1 * input - na1 * out + z2;
      z2 = nb2 * input - na2 * out;
      output[i] = out;
    }

    return output;
  }
}

export const wasmDspEngine = new WasmDspModule();
