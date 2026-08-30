// 3WM SONIK - Professional Audio File Handler
// Implements sample rate conversion, bit depth conversion, and professional file handling

export interface AudioFileMetadata {
  sampleRate: number;
  bitDepth: 16 | 24 | 32;
  channels: number;
  duration: number;
  fileSize: number;
  format: 'wav' | 'aiff' | 'flac' | 'mp3';
  encoding: 'PCM' | 'IEEE_FLOAT' | 'ALAW' | 'ULAW';
}

export interface ConversionOptions {
  targetSampleRate: number;
  targetBitDepth: 16 | 24 | 32;
  targetChannels?: number;
  dithering: boolean;
  ditherType: 'triangular' | 'rectangular' | 'shaped';
  antiAliasing: boolean;
  quality: 'low' | 'medium' | 'high';
}

export interface NormalizationOptions {
  mode: 'peak' | 'rms' | 'loudness' | 'ebu-r128';
  targetLevel: number; // dB
  ceiling: number; // dB headroom
  stereoLinking: boolean;
}

export class AudioFileHandler {
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initialize with default state
  }

  public async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
  }

  /**
   * Parse audio file metadata
   */
  public async parseMetadata(file: File): Promise<AudioFileMetadata> {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.decodeAudioData(arrayBuffer);

    return {
      sampleRate: audioBuffer.sampleRate,
      bitDepth: this.detectBitDepth(file),
      channels: audioBuffer.numberOfChannels,
      duration: audioBuffer.duration,
      fileSize: file.size,
      format: this.detectFormat(file),
      encoding: 'PCM',
    };
  }

  /**
   * Detect audio format from file
   */
  private detectFormat(file: File): AudioFileMetadata['format'] {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'wav':
        return 'wav';
      case 'aiff':
      case 'aif':
        return 'aiff';
      case 'flac':
        return 'flac';
      case 'mp3':
        return 'mp3';
      default:
        return 'wav';
    }
  }

  /**
   * Detect bit depth from file (simplified)
   */
  private detectBitDepth(file: File): 16 | 24 | 32 {
    const extension = file.name.split('.').pop()?.toLowerCase();
    // In production, this would parse the actual file header
    return 16;
  }

  /**
   * Decode audio data
   */
  private async decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }
    return await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
  }

  /**
   * Convert sample rate
   */
  public async convertSampleRate(
    buffer: AudioBuffer,
    targetSampleRate: number,
    quality: 'low' | 'medium' | 'high' = 'high'
  ): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    if (buffer.sampleRate === targetSampleRate) {
      return buffer;
    }

    const ratio = targetSampleRate / buffer.sampleRate;
    const newLength = Math.round(buffer.length * ratio);

    const convertedBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      newLength,
      targetSampleRate
    );

    const filterOrder = quality === 'high' ? 8 : quality === 'medium' ? 4 : 2;

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sourceData = buffer.getChannelData(channel);
      const targetData = convertedBuffer.getChannelData(channel);

      if (ratio > 1) {
        // Upsampling - use sinc interpolation
        this.sincInterpolation(sourceData, targetData, ratio, filterOrder);
      } else {
        // Downsampling - apply anti-aliasing filter first
        const filteredData = this.applyAntiAliasingFilter(sourceData, ratio, filterOrder);
        this.linearInterpolation(filteredData, targetData, ratio);
      }
    }

    return convertedBuffer;
  }

  /**
   * Sinc interpolation for high-quality upsampling
   */
  private sincInterpolation(
    source: Float32Array,
    target: Float32Array,
    ratio: number,
    filterOrder: number
  ): void {
    const kernelSize = filterOrder * 4;
    const beta = 8.0; // Kaiser window beta

    for (let i = 0; i < target.length; i++) {
      const sourcePos = i / ratio;
      const centerIndex = Math.floor(sourcePos);

      let sum = 0;
      let weightSum = 0;

      for (let k = -kernelSize; k <= kernelSize; k++) {
        const sourceIndex = centerIndex + k;
        if (sourceIndex >= 0 && sourceIndex < source.length) {
          const x = (sourcePos - sourceIndex) * Math.PI;
          let sinc = 0;
          if (Math.abs(x) < 0.0001) {
            sinc = 1;
          } else {
            sinc = Math.sin(x) / x;
          }

          // Apply Kaiser window
          const window = this.kaiserWindow(k, kernelSize, beta);
          const weight = sinc * window;

          sum += source[sourceIndex] * weight;
          weightSum += weight;
        }
      }

      target[i] = weightSum > 0 ? sum / weightSum : 0;
    }
  }

  /**
   * Linear interpolation for downsampling
   */
  private linearInterpolation(source: Float32Array, target: Float32Array, ratio: number): void {
    for (let i = 0; i < target.length; i++) {
      const sourcePos = i / ratio;
      const index = Math.floor(sourcePos);
      const fraction = sourcePos - index;

      if (index < source.length - 1) {
        target[i] = source[index] * (1 - fraction) + source[index + 1] * fraction;
      } else if (index < source.length) {
        target[i] = source[index];
      } else {
        target[i] = 0;
      }
    }
  }

  /**
   * Apply anti-aliasing filter for downsampling
   */
  private applyAntiAliasingFilter(
    data: Float32Array,
    ratio: number,
    filterOrder: number
  ): Float32Array {
    const filtered = new Float32Array(data.length);
    const cutoff = 0.45 * ratio; // Nyquist frequency

    // Simple IIR low-pass filter
    const alpha = 0.1;
    filtered[0] = data[0];

    for (let i = 1; i < data.length; i++) {
      filtered[i] = alpha * data[i] + (1 - alpha) * filtered[i - 1];
    }

    return filtered;
  }

  /**
   * Kaiser window for sinc interpolation
   */
  private kaiserWindow(n: number, N: number, beta: number): number {
    const x = n / N;
    const i0 = besselI0(beta);
    return besselI0(beta * Math.sqrt(1 - x * x)) / i0;
  }

  /**
   * Convert bit depth with dithering
   */
  public async convertBitDepth(
    buffer: AudioBuffer,
    targetBitDepth: 16 | 24 | 32,
    dithering: boolean = true,
    ditherType: 'triangular' | 'rectangular' | 'shaped' = 'triangular'
  ): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const convertedBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sourceData = buffer.getChannelData(channel);
      const targetData = convertedBuffer.getChannelData(channel);

      for (let i = 0; i < sourceData.length; i++) {
        let sample = sourceData[i];

        // Apply dithering
        if (dithering && targetBitDepth < 32) {
          sample = this.applyDither(sample, ditherType);
        }

        // Quantize to target bit depth
        targetData[i] = this.quantizeSample(sample, targetBitDepth);
      }
    }

    return convertedBuffer;
  }

  /**
   * Apply dithering to sample
   */
  private applyDither(sample: number, type: 'triangular' | 'rectangular' | 'shaped'): number {
    const dither = this.generateDitherNoise(type);
    return sample + dither;
  }

  /**
   * Generate dither noise
   */
  private generateDitherNoise(type: 'triangular' | 'rectangular' | 'shaped'): number {
    switch (type) {
      case 'triangular':
        return (Math.random() - Math.random()) / 32768;
      case 'rectangular':
        return (Math.random() - 0.5) / 32768;
      case 'shaped':
        // Shaped dither (noise shaping)
        return (Math.random() - Math.random() + (Math.random() - Math.random())) / 65536;
      default:
        return 0;
    }
  }

  /**
   * Quantize sample to target bit depth
   */
  private quantizeSample(sample: number, bitDepth: 16 | 24 | 32): number {
    const maxValue = Math.pow(2, bitDepth - 1) - 1;
    const minValue = -Math.pow(2, bitDepth - 1);

    // Clamp to valid range
    const clamped = Math.max(minValue, Math.min(maxValue, sample * maxValue));

    // Quantize
    const quantized = Math.round(clamped);

    // Convert back to normalized range
    return quantized / maxValue;
  }

  /**
   * Full audio conversion
   */
  public async convertAudio(buffer: AudioBuffer, options: ConversionOptions): Promise<AudioBuffer> {
    let convertedBuffer = buffer;

    // Convert sample rate first
    if (options.targetSampleRate !== buffer.sampleRate) {
      convertedBuffer = await this.convertSampleRate(
        convertedBuffer,
        options.targetSampleRate,
        options.quality
      );
    }

    // Convert bit depth
    convertedBuffer = await this.convertBitDepth(
      convertedBuffer,
      options.targetBitDepth,
      options.dithering,
      options.ditherType
    );

    // Convert channels if specified
    if (
      options.targetChannels !== undefined &&
      options.targetChannels !== convertedBuffer.numberOfChannels
    ) {
      convertedBuffer = await this.convertChannels(convertedBuffer, options.targetChannels);
    }

    return convertedBuffer;
  }

  /**
   * Convert channel count
   */
  public async convertChannels(buffer: AudioBuffer, targetChannels: number): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    if (buffer.numberOfChannels === targetChannels) {
      return buffer;
    }

    const convertedBuffer = this.audioContext.createBuffer(
      targetChannels,
      buffer.length,
      buffer.sampleRate
    );

    if (targetChannels === 1 && buffer.numberOfChannels > 1) {
      // Mix down to mono
      const monoData = convertedBuffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        let sum = 0;
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          sum += buffer.getChannelData(channel)[i];
        }
        monoData[i] = sum / buffer.numberOfChannels;
      }
    } else if (targetChannels === 2 && buffer.numberOfChannels === 1) {
      // Duplicate to stereo
      const sourceData = buffer.getChannelData(0);
      convertedBuffer.getChannelData(0).set(sourceData);
      convertedBuffer.getChannelData(1).set(sourceData);
    } else if (targetChannels > buffer.numberOfChannels) {
      // Copy existing channels to new ones
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        convertedBuffer.getChannelData(channel).set(buffer.getChannelData(channel));
      }
      // Fill remaining channels with silence or copy from last channel
      for (let channel = buffer.numberOfChannels; channel < targetChannels; channel++) {
        const sourceChannel = Math.min(channel, buffer.numberOfChannels - 1);
        convertedBuffer.getChannelData(channel).set(buffer.getChannelData(sourceChannel));
      }
    }

    return convertedBuffer;
  }

  /**
   * Normalize audio
   */
  public async normalizeAudio(
    buffer: AudioBuffer,
    options: NormalizationOptions
  ): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const normalizedBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    let maxGain = 1;

    switch (options.mode) {
      case 'peak':
        maxGain = this.calculatePeakNormalization(buffer, options.targetLevel, options.ceiling);
        break;
      case 'rms':
        maxGain = this.calculateRMSNormalization(buffer, options.targetLevel, options.ceiling);
        break;
      case 'loudness':
        maxGain = this.calculateLoudnessNormalization(buffer, options.targetLevel, options.ceiling);
        break;
      case 'ebu-r128':
        maxGain = this.calculateEBUR128Normalization(buffer, options.targetLevel, options.ceiling);
        break;
    }

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sourceData = buffer.getChannelData(channel);
      const targetData = normalizedBuffer.getChannelData(channel);

      for (let i = 0; i < sourceData.length; i++) {
        targetData[i] = sourceData[i] * maxGain;
      }
    }

    return normalizedBuffer;
  }

  /**
   * Calculate peak normalization gain
   */
  private calculatePeakNormalization(
    buffer: AudioBuffer,
    targetLevel: number,
    ceiling: number
  ): number {
    let peak = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        peak = Math.max(peak, Math.abs(data[i]));
      }
    }

    const targetPeak = Math.pow(10, (targetLevel - ceiling) / 20);
    return peak > 0 ? targetPeak / peak : 1;
  }

  /**
   * Calculate RMS normalization gain
   */
  private calculateRMSNormalization(
    buffer: AudioBuffer,
    targetLevel: number,
    ceiling: number
  ): number {
    let sumSquares = 0;
    let totalSamples = 0;

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        sumSquares += data[i] * data[i];
        totalSamples++;
      }
    }

    const rms = Math.sqrt(sumSquares / totalSamples);
    const targetRMS = Math.pow(10, (targetLevel - ceiling) / 20);
    return rms > 0 ? targetRMS / rms : 1;
  }

  /**
   * Calculate loudness normalization gain (simplified)
   */
  private calculateLoudnessNormalization(
    buffer: AudioBuffer,
    targetLevel: number,
    ceiling: number
  ): number {
    // Simplified loudness calculation
    return this.calculateRMSNormalization(buffer, targetLevel, ceiling);
  }

  /**
   * Calculate EBU R128 normalization gain
   */
  private calculateEBUR128Normalization(
    buffer: AudioBuffer,
    targetLevel: number,
    ceiling: number
  ): number {
    // EBU R128 implementation would require more complex analysis
    // Using RMS as approximation for now
    return this.calculateRMSNormalization(buffer, targetLevel - 3, ceiling);
  }

  /**
   * Export buffer as WAV file
   */
  public async exportAsWAV(buffer: AudioBuffer, bitDepth: 16 | 24 | 32 = 16): Promise<Blob> {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitDepthValue = bitDepth;
    const bytesPerSample = bitDepthValue / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const fileSize = 36 + dataSize;

    const arrayBuffer = new ArrayBuffer(fileSize);
    const view = new DataView(arrayBuffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepthValue, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    const offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        const intSample = Math.max(-1, Math.min(1, sample));
        const scaledSample = intSample < 0 ? intSample * 0x8000 : intSample * 0x7fff;

        if (bitDepthValue === 16) {
          view.setInt16(offset + i * blockAlign + channel * 2, scaledSample, true);
        } else if (bitDepthValue === 24) {
          view.setInt32(offset + i * blockAlign + channel * 3, scaledSample << 8, true);
        } else if (bitDepthValue === 32) {
          view.setInt32(offset + i * blockAlign + channel * 4, scaledSample, true);
        }
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Import audio file
   */
  public async importAudioFile(file: File): Promise<AudioBuffer> {
    const arrayBuffer = await file.arrayBuffer();
    return await this.decodeAudioData(arrayBuffer);
  }

  /**
   * Batch convert multiple files
   */
  public async batchConvert(files: File[], options: ConversionOptions): Promise<AudioBuffer[]> {
    const results: AudioBuffer[] = [];

    for (const file of files) {
      const buffer = await this.importAudioFile(file);
      const converted = await this.convertAudio(buffer, options);
      results.push(converted);
    }

    return results;
  }

  /**
   * Get supported sample rates
   */
  public getSupportedSampleRates(): number[] {
    return [44100, 48000, 88200, 96000, 176400, 192000];
  }

  /**
   * Get supported bit depths
   */
  public getSupportedBitDepths(): (16 | 24 | 32)[] {
    return [16, 24, 32];
  }

  /**
   * Validate conversion options
   */
  public validateConversionOptions(options: ConversionOptions): boolean {
    const supportedSampleRates = this.getSupportedSampleRates();
    const supportedBitDepths = this.getSupportedBitDepths();

    if (!supportedSampleRates.includes(options.targetSampleRate)) {
      return false;
    }

    if (!supportedBitDepths.includes(options.targetBitDepth)) {
      return false;
    }

    if (
      options.targetChannels !== undefined &&
      (options.targetChannels < 1 || options.targetChannels > 8)
    ) {
      return false;
    }

    return true;
  }
}

// Helper function to write strings to DataView
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Helper function for Bessel I0
function besselI0(x: number): number {
  const ax = Math.abs(x);
  if (ax < 3.75) {
    const y = (x / 3.75) * (x / 3.75);
    return (
      1 + y * (3.5156229 + y * (3.0899424 + y * (1.2067492 + y * (0.2659732 + y * 0.360768e-1))))
    );
  } else {
    const y = 3.75 / ax;
    return (
      (Math.exp(ax) / Math.sqrt(ax)) *
      (0.39894228 +
        y *
          (0.1328592e-1 +
            y *
              (0.225319e-2 +
                y * (-0.157565e-2 + y * (0.91628e-3 + y * (-0.20575e-3 + y * 0.263e-4))))))
    );
  }
}

// Export singleton instance
export const audioFileHandler = new AudioFileHandler();
