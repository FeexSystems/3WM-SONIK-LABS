// 3WM SONIK - Professional Audio Processing
// Implements audio quantization, time-stretching, and advanced audio manipulation

import { RecordedTake, AudioRegion } from '../types';

export interface QuantizationSettings {
  enabled: boolean;
  strength: number; // 0.0 to 1.0 (how strictly to quantize)
  grid: number; // in milliseconds (e.g., 1/16 note at 120 BPM = 125ms)
  swing: number; // -1.0 to 1.0 (swing amount)
  preserveNoteLength: boolean;
}

export interface TimeStretchSettings {
  ratio: number; // 0.5 = half speed, 2.0 = double speed
  preservePitch: boolean;
  algorithm: 'phase-vocoder' | 'time-domain' | 'frequency-domain';
  quality: 'low' | 'medium' | 'high';
}

export interface AudioProcessingResult {
  success: boolean;
  processedAudio: AudioBuffer | null;
  errorMessage?: string;
  processingTime: number;
}

export class AudioProcessor {
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initialize with default state
  }

  public async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
  }

  /**
   * Quantize audio to grid
   */
  public async quantizeAudio(
    audioBuffer: AudioBuffer,
    settings: QuantizationSettings,
    transientPoints: number[] // in milliseconds
  ): Promise<AudioProcessingResult> {
    if (!this.audioContext) {
      return {
        success: false,
        processedAudio: null,
        errorMessage: 'Audio context not initialized',
        processingTime: 0,
      };
    }

    const startTime = performance.now();

    try {
      const sampleRate = audioBuffer.sampleRate;
      const gridSamples = (settings.grid / 1000) * sampleRate;
      const swingSamples = ((settings.swing * settings.grid) / 1000) * sampleRate;

      // Create new buffer for quantized audio
      const quantizedBuffer = this.audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        sampleRate
      );

      // Process each channel
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const inputData = audioBuffer.getChannelData(channel);
        const outputData = quantizedBuffer.getChannelData(channel);

        // Copy original data
        outputData.set(inputData);

        // Apply quantization to transient points
        for (const transientMs of transientPoints) {
          const transientSample = (transientMs / 1000) * sampleRate;

          // Find nearest grid point
          const nearestGrid = Math.round(transientSample / gridSamples) * gridSamples;

          // Apply swing
          const quantizedPosition = nearestGrid + swingSamples;

          // Calculate move amount
          const moveAmount = quantizedPosition - transientSample;

          // Apply strength (partial quantization)
          const actualMove = Math.round(moveAmount * settings.strength);

          // Move audio segment
          if (actualMove !== 0 && Math.abs(actualMove) < inputData.length) {
            if (actualMove > 0) {
              // Move segment forward
              const segmentStart = Math.floor(transientSample);
              const segmentEnd = Math.min(transientSample + actualMove, inputData.length);

              for (let i = segmentEnd - 1; i >= segmentStart; i--) {
                if (i + actualMove < inputData.length) {
                  outputData[i + actualMove] = inputData[i];
                }
              }

              // Fill gap with crossfade
              for (let i = 0; i < actualMove; i++) {
                const fadeIn = i / actualMove;
                const fadeOut = 1 - fadeIn;
                if (transientSample + i < inputData.length) {
                  outputData[transientSample + i] =
                    inputData[transientSample + i] * fadeOut +
                    inputData[transientSample + i + actualMove] * fadeIn;
                }
              }
            } else {
              // Move segment backward
              const segmentStart = Math.max(transientSample + actualMove, 0);
              const segmentEnd = Math.floor(transientSample);

              for (let i = segmentStart; i < segmentEnd; i++) {
                if (i + actualMove >= 0) {
                  outputData[i + actualMove] = inputData[i];
                }
              }

              // Fill gap with crossfade
              for (let i = 0; i < -actualMove; i++) {
                const fadeIn = i / -actualMove;
                const fadeOut = 1 - fadeIn;
                if (transientSample + i < inputData.length) {
                  outputData[transientSample + i] =
                    inputData[transientSample + i] * fadeOut +
                    inputData[transientSample + i + actualMove] * fadeIn;
                }
              }
            }
          }
        }
      }

      return {
        success: true,
        processedAudio: quantizedBuffer,
        processingTime: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        processedAudio: null,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Time-stretch audio
   */
  public async timeStretchAudio(
    audioBuffer: AudioBuffer,
    settings: TimeStretchSettings
  ): Promise<AudioProcessingResult> {
    if (!this.audioContext) {
      return {
        success: false,
        processedAudio: null,
        errorMessage: 'Audio context not initialized',
        processingTime: 0,
      };
    }

    const startTime = performance.now();

    try {
      const newLength = Math.round(audioBuffer.length * settings.ratio);

      // Create new buffer with stretched length
      const stretchedBuffer = this.audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        newLength,
        audioBuffer.sampleRate
      );

      // Process each channel based on algorithm
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const inputData = audioBuffer.getChannelData(channel);
        const outputData = stretchedBuffer.getChannelData(channel);

        switch (settings.algorithm) {
          case 'phase-vocoder':
            this.phaseVocoderStretch(inputData, outputData, settings.ratio, settings.preservePitch);
            break;
          case 'time-domain':
            this.timeDomainStretch(inputData, outputData, settings.ratio, settings.preservePitch);
            break;
          case 'frequency-domain':
            this.frequencyDomainStretch(
              inputData,
              outputData,
              settings.ratio,
              settings.preservePitch
            );
            break;
        }
      }

      return {
        success: true,
        processedAudio: stretchedBuffer,
        processingTime: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        processedAudio: null,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        processingTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Phase vocoder time-stretching (high quality)
   */
  private phaseVocoderStretch(
    input: Float32Array,
    output: Float32Array,
    ratio: number,
    preservePitch: boolean
  ): void {
    // Simplified phase vocoder implementation
    // In production, this would use a more sophisticated algorithm

    const hopSize = 512;
    const windowSize = 2048;

    for (let i = 0; i < output.length; i++) {
      const inputIndex = Math.floor(i / ratio);

      if (inputIndex < input.length) {
        // Simple linear interpolation (phase vocoder would use spectral processing)
        const idx1 = Math.floor(inputIndex);
        const idx2 = Math.min(idx1 + 1, input.length - 1);
        const frac = inputIndex - idx1;

        output[i] = input[idx1] * (1 - frac) + input[idx2] * frac;
      } else {
        output[i] = 0;
      }
    }
  }

  /**
   * Time-domain time-stretching (faster, lower quality)
   */
  private timeDomainStretch(
    input: Float32Array,
    output: Float32Array,
    ratio: number,
    preservePitch: boolean
  ): void {
    // WSOLA (Waveform Similarity Overlap-Add) simplified implementation

    const frameSize = 2048;
    const overlap = frameSize / 2;

    for (let i = 0; i < output.length; i += overlap) {
      const inputPos = Math.floor(i / ratio);

      if (inputPos + frameSize < input.length) {
        // Copy frame with overlap
        for (let j = 0; j < frameSize && i + j < output.length; j++) {
          if (j < overlap) {
            // Crossfade with previous frame
            const fade = j / overlap;
            output[i + j] = output[i + j] * (1 - fade) + input[inputPos + j] * fade;
          } else {
            output[i + j] = input[inputPos + j];
          }
        }
      }
    }
  }

  /**
   * Frequency-domain time-stretching (best quality, slowest)
   */
  private frequencyDomainStretch(
    input: Float32Array,
    output: Float32Array,
    ratio: number,
    preservePitch: boolean
  ): void {
    // FFT-based time-stretching (simplified)
    // In production, this would use proper FFT/IFFT with phase locking

    const fftSize = 4096;

    for (let i = 0; i < output.length; i++) {
      const inputIndex = Math.floor(i / ratio);

      if (inputIndex < input.length) {
        // In a real implementation, this would perform FFT, modify phases, then IFFT
        // For now, use linear interpolation as fallback
        const idx1 = Math.floor(inputIndex);
        const idx2 = Math.min(idx1 + 1, input.length - 1);
        const frac = inputIndex - idx1;

        output[i] = input[idx1] * (1 - frac) + input[idx2] * frac;
      } else {
        output[i] = 0;
      }
    }
  }

  /**
   * Detect transients in audio
   */
  public detectTransients(audioBuffer: AudioBuffer, threshold: number = 0.1): number[] {
    const transients: number[] = [];
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const sampleRate = audioBuffer.sampleRate;

    // Calculate energy using short-time windows
    const windowSize = 1024;
    const hopSize = 256;

    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += channelData[i + j] * channelData[i + j];
      }
      energy = Math.sqrt(energy / windowSize);

      // Check for significant energy increase (transient)
      if (i > 0) {
        const prevEnergy = this.calculateEnergy(channelData, i - hopSize, windowSize);
        const energyIncrease = energy - prevEnergy;

        if (energyIncrease > threshold) {
          const transientTime = (i / sampleRate) * 1000; // Convert to milliseconds
          transients.push(transientTime);
        }
      }
    }

    return transients;
  }

  /**
   * Calculate energy for a window of audio
   */
  private calculateEnergy(data: Float32Array, start: number, length: number): number {
    let sum = 0;
    for (let i = start; i < start + length && i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / length);
  }

  /**
   * Apply fade to audio buffer
   */
  public applyFade(
    audioBuffer: AudioBuffer,
    fadeInDuration: number,
    fadeOutDuration: number
  ): AudioBuffer {
    const sampleRate = audioBuffer.sampleRate;
    const fadeInSamples = Math.floor((fadeInDuration / 1000) * sampleRate);
    const fadeOutSamples = Math.floor((fadeOutDuration / 1000) * sampleRate);

    const fadedBuffer = this.audioContext!.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = fadedBuffer.getChannelData(channel);

      for (let i = 0; i < inputData.length; i++) {
        let gain = 1.0;

        // Apply fade in
        if (i < fadeInSamples) {
          gain = i / fadeInSamples;
        }

        // Apply fade out
        if (i > inputData.length - fadeOutSamples) {
          gain = (inputData.length - i) / fadeOutSamples;
        }

        outputData[i] = inputData[i] * gain;
      }
    }

    return fadedBuffer;
  }

  /**
   * Normalize audio to target level
   */
  public normalizeAudio(audioBuffer: AudioBuffer, targetLevel: number = -1.0): AudioBuffer {
    const sampleRate = audioBuffer.sampleRate;

    // Find peak level
    let peak = 0;
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        peak = Math.max(peak, Math.abs(channelData[i]));
      }
    }

    // Calculate gain needed
    const targetGain = Math.pow(10, targetLevel / 20);
    const normalizationGain = targetGain / peak;

    const normalizedBuffer = this.audioContext!.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = normalizedBuffer.getChannelData(channel);

      for (let i = 0; i < inputData.length; i++) {
        outputData[i] = inputData[i] * normalizationGain;
      }
    }

    return normalizedBuffer;
  }

  /**
   * Reverse audio
   */
  public reverseAudio(audioBuffer: AudioBuffer): AudioBuffer {
    const sampleRate = audioBuffer.sampleRate;

    const reversedBuffer = this.audioContext!.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = reversedBuffer.getChannelData(channel);

      for (let i = 0; i < inputData.length; i++) {
        outputData[i] = inputData[inputData.length - 1 - i];
      }
    }

    return reversedBuffer;
  }

  /**
   * Convert sample rate
   */
  public async convertSampleRate(
    audioBuffer: AudioBuffer,
    targetSampleRate: number
  ): Promise<AudioBuffer> {
    if (audioBuffer.sampleRate === targetSampleRate) {
      return audioBuffer;
    }

    const ratio = targetSampleRate / audioBuffer.sampleRate;
    const newLength = Math.round(audioBuffer.length * ratio);

    const convertedBuffer = this.audioContext!.createBuffer(
      audioBuffer.numberOfChannels,
      newLength,
      targetSampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = convertedBuffer.getChannelData(channel);

      // Linear interpolation for sample rate conversion
      for (let i = 0; i < newLength; i++) {
        const sourceIndex = i / ratio;
        const idx1 = Math.floor(sourceIndex);
        const idx2 = Math.min(idx1 + 1, inputData.length - 1);
        const frac = sourceIndex - idx1;

        outputData[i] = inputData[idx1] * (1 - frac) + inputData[idx2] * frac;
      }
    }

    return convertedBuffer;
  }
}

// Export singleton instance
export const audioProcessor = new AudioProcessor();
