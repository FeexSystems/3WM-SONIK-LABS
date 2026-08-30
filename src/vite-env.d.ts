/// <reference types="vite/client" />

// AudioWorklet global augmentation (for src/audio/worklets/dspProcessor.ts)
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor(options?: AudioWorkletNodeOptions);
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}
declare function registerProcessor(name: string, processorCtor: typeof AudioWorkletProcessor): void;
declare interface AudioParamDescriptor {
  name: string;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  automationRate?: 'a-rate' | 'k-rate';
}

// Navigator GPU (for onnxStemSeparator)
interface Navigator {
  gpu?: unknown;
}

// E2E audioEngine handle
interface Window {
  audioEngine?: any;
}
