import * as ort from 'onnxruntime-web';
import { modelCache, type ModelSource } from './modelCache';
import { webGpuDsp } from './webgpuDsp';
export type StemType = 'vocals' | 'drums' | 'bass' | 'other';
export interface OnnxStemSeparationOptions {
  model: 'demucs-v4-ht';
  sampleRate?: number;
  quality?: 'fast' | 'high_precision';
  modelUrls?: readonly string[];
  onProgress?: (progressPercent: number, statusMessage: string) => void;
}
export interface OnnxSeparatedStemsResult {
  trackId: string;
  sourceDurationSeconds: number;
  stems: Record<StemType, { audioBuffer: AudioBuffer; volume: number; pan: number }>;
  metrics: {
    processingTimeMs: number;
    sampleRate: number;
    modelUsed: string;
    inferenceTimeMs: number;
  };
}
const STEMS: readonly StemType[] = ['drums', 'bass', 'other', 'vocals'];
const MODEL: ModelSource = {
  name: 'htdemucs-4stems-int8',
  version: '1.0.0',
  urls: ['/models/htdemucs-4stems-int8.onnx'],
};

export class OnnxStemSeparator {
  private static instance: OnnxStemSeparator | null = null;
  private session: ort.InferenceSession | null = null;
  private ready = false;
  private readonly modelRate = 44100;
  private readonly chunkFrames = this.modelRate * 8;
  static getInstance(): OnnxStemSeparator {
    return (this.instance ??= new OnnxStemSeparator());
  }
  async initialize(modelUrls?: readonly string[]): Promise<boolean> {
    if (this.ready) return true;
    if (!this.hasWebGpu()) return false;
    try {
      ort.env.wasm.simd = true;
      ort.env.wasm.numThreads = Math.max(1, navigator.hardwareConcurrency || 1);
      // This optional compute pass performs PCM normalization before the
      // session run; ONNX keeps model intermediates and outputs on its GPU.
      await webGpuDsp.initialize();
      const binary = await modelCache.getModel(
        modelUrls?.length ? { ...MODEL, urls: modelUrls } : MODEL
      );
      this.session = await ort.InferenceSession.create(binary, {
        executionProviders: ['webgpu'],
        graphOptimizationLevel: 'all',
        enableGraphCapture: true,
        preferredOutputLocation: 'gpu-buffer',
      });
      this.ready = true;
      return true;
    } catch (error) {
      this.session = null;
      this.ready = false;
      console.warn('[3WM-ONNX] WebGPU HT-Demucs unavailable:', error);
      return false;
    }
  }
  isWebGpuReady(): boolean {
    return this.ready && this.hasWebGpu();
  }
  async separateAudio(
    audio: AudioBuffer,
    options: OnnxStemSeparationOptions = { model: 'demucs-v4-ht' }
  ): Promise<OnnxSeparatedStemsResult> {
    if (!this.session) throw new Error('HT-Demucs session is not initialized');
    const started = performance.now();
    const input = this.resample(this.toStereo(audio), audio.sampleRate, this.modelRate);
    const chunks: Record<StemType, Float32Array[]> = { vocals: [], drums: [], bass: [], other: [] };
    const count = Math.ceil(input.left.length / this.chunkFrames);
    let inferenceTimeMs = 0;
    options.onProgress?.(5, 'Normalizing audio for HT-Demucs');
    for (let i = 0; i < count; i++) {
      const start = i * this.chunkFrames;
      const frames = Math.min(this.chunkFrames, input.left.length - start);
      const left = new Float32Array(this.chunkFrames) as any;
      const right = new Float32Array(this.chunkFrames) as any;
      left.set(input.left.subarray(start, start + frames));
      right.set(input.right.subarray(start, start + frames));
      options.onProgress?.(10 + (i / count) * 75, `Running WebGPU inference ${i + 1}/${count}`);
      const before = performance.now();
      const separated = await this.runChunk(left, right);
      inferenceTimeMs += performance.now() - before;
      for (const stem of STEMS) chunks[stem].push(separated[stem].subarray(0, frames * 2));
    }
    options.onProgress?.(90, 'Reconstructing separated stems');
    const stems = this.toAudioBuffers(chunks, audio.sampleRate, audio.length);
    options.onProgress?.(100, 'HT-Demucs WebGPU separation complete');
    return {
      trackId: `onnx_sep_${Date.now()}`,
      sourceDurationSeconds: audio.duration,
      stems,
      metrics: {
        processingTimeMs: performance.now() - started,
        inferenceTimeMs,
        sampleRate: audio.sampleRate,
        modelUsed: 'demucs-v4-ht-int8-webgpu',
      },
    };
  }
  private async runChunk(
    left: Float32Array,
    right: Float32Array
  ): Promise<Record<StemType, Float32Array>> {
    if (!this.session) throw new Error('HT-Demucs session is not initialized');
    const frames = left.length;
    const planar = new Float32Array(frames * 2) as any;
    planar.set(left);
    planar.set(right, frames);
    const normalized = (await webGpuDsp.normalizeAudioForInference(planar)) ?? planar;
    const tensor = new ort.Tensor('float32', normalized, [1, 2, frames]);
    try {
      const result = await this.session.run({ [this.session.inputNames[0]]: tensor });
      const output = result[this.session.outputNames[0]];
      if (!output) throw new Error('HT-Demucs produced no output tensor');
      // GPU IO binding: ORT retains outputs in GPU buffers and downloads only for final AudioBuffer construction.
      const data = (await output.getData()) as Float32Array;
      const outputFrames = Number(output.dims.at(-1));
      if (outputFrames < frames || data.length < 8 * outputFrames)
        throw new Error(`Unexpected HT-Demucs output shape: [${output.dims}]`);
      const separated = {} as Record<StemType, Float32Array>;
      STEMS.forEach((stem, stemIndex) => {
        const interleaved = new Float32Array(outputFrames * 2) as any;
        const offset = stemIndex * 2 * outputFrames;
        for (let frame = 0; frame < outputFrames; frame++) {
          interleaved[frame * 2] = data[offset + frame];
          interleaved[frame * 2 + 1] = data[offset + outputFrames + frame];
        }
        separated[stem] = interleaved;
      });
      return separated;
    } finally {
      tensor.dispose();
    }
  }
  private toStereo(buffer: AudioBuffer) {
    const left = new Float32Array(buffer.length) as any;
    const right = new Float32Array(buffer.length) as any;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const source = buffer.getChannelData(channel);
      const target = channel % 2 ? right : left;
      for (let i = 0; i < buffer.length; i++)
        target[i] += source[i] / Math.ceil(buffer.numberOfChannels / 2);
    }
    if (buffer.numberOfChannels === 1) right.set(left);
    return { left, right };
  }
  private resample(stereo: { left: Float32Array; right: Float32Array }, from: number, to: number) {
    if (from === to) return stereo;
    const length = Math.round((stereo.left.length * to) / from);
    const ratio = from / to;
    const convert = (source: Float32Array) => {
      const result = new Float32Array(length) as any;
      for (let i = 0; i < length; i++) {
        const at = i * ratio;
        const base = Math.floor(at);
        const next = Math.min(base + 1, source.length - 1);
        result[i] = source[base] + (source[next] - source[base]) * (at - base);
      }
      return result;
    };
    return { left: convert(stereo.left), right: convert(stereo.right) };
  }
  private toAudioBuffers(chunks: Record<StemType, Float32Array[]>, rate: number, length: number) {
    const build = (stem: StemType, volume: number) => {
      const total = chunks[stem].reduce((sum, chunk) => sum + chunk.length, 0);
      const raw = new Float32Array(total) as any;
      let offset = 0;
      for (const chunk of chunks[stem]) {
        raw.set(chunk, offset);
        offset += chunk.length;
      }
      const left = new Float32Array(raw.length / 2) as any;
      const right = new Float32Array(raw.length / 2) as any;
      for (let i = 0; i < left.length; i++) {
        left[i] = raw[i * 2];
        right[i] = raw[i * 2 + 1];
      }
      const converted = this.resample({ left, right }, this.modelRate, rate);
      const audioBuffer = new AudioBuffer({ length, numberOfChannels: 2, sampleRate: rate });
      audioBuffer.copyToChannel(converted.left.subarray(0, length), 0);
      audioBuffer.copyToChannel(converted.right.subarray(0, length), 1);
      return { audioBuffer, volume, pan: 0 };
    };
    return {
      vocals: build('vocals', 0.85),
      drums: build('drums', 0.9),
      bass: build('bass', 0.95),
      other: build('other', 0.8),
    };
  }
  private hasWebGpu(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.gpu;
  }
  async dispose(): Promise<void> {
    await this.session?.release();
    this.session = null;
    this.ready = false;
  }
}
export const onnxStemSeparator = OnnxStemSeparator.getInstance();
