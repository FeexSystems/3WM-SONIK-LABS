// 3WM SONIK - Professional Audio Quantization & Time-Stretching Engine
// Implements sample-accurate quantization, time-stretching, and pitch-shifting

export interface QuantizationGrid {
  resolution: '1/4' | '1/8' | '1/16' | '1/32' | '1/64' | '1/128' | 'triplet' | 'dot';
  bpm: number;
  sampleRate: number;
  swing: number; // 0 to 1
  grooveOffset: number; // in milliseconds
}

export interface QuantizationResult {
  originalPosition: number;
  quantizedPosition: number;
  offset: number;
  strength: number; // 0 to 1
}

export interface TimeStretchOptions {
  ratio: number; // 0.5 to 2.0 (0.5 = half speed, 2.0 = double speed)
  preservePitch: boolean;
  algorithm: 'time-domain' | 'frequency-domain' | 'phase-vocoder' | 'wsola';
  quality: 'low' | 'medium' | 'high';
}

export interface PitchShiftOptions {
  semitones: number; // -24 to +24
  preserveDuration: boolean;
  algorithm: 'time-domain' | 'frequency-domain' | 'phase-vocoder';
  formantPreservation: boolean;
}

export interface TransientDetectionResult {
  transients: Array<{
    position: number; // in samples
    amplitude: number;
    type: 'attack' | 'release';
  }>;
  threshold: number;
}

export class QuantizationEngine {
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initialize with default state
  }

  public async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
  }

  /**
   * Calculate grid positions for quantization
   */
  public calculateGridPositions(
    startTime: number,
    duration: number,
    grid: QuantizationGrid
  ): number[] {
    if (!this.audioContext) return [];

    const positions: number[] = [];
    const samplesPerBeat = (this.audioContext.sampleRate * 60) / grid.bpm;

    let interval: number;
    switch (grid.resolution) {
      case '1/4':
        interval = samplesPerBeat * 4;
        break;
      case '1/8':
        interval = samplesPerBeat * 2;
        break;
      case '1/16':
        interval = samplesPerBeat;
        break;
      case '1/32':
        interval = samplesPerBeat / 2;
        break;
      case '1/64':
        interval = samplesPerBeat / 4;
        break;
      case '1/128':
        interval = samplesPerBeat / 8;
        break;
      case 'triplet':
        interval = (samplesPerBeat * 4) / 3;
        break;
      case 'dot':
        interval = samplesPerBeat * 1.5;
        break;
      default:
        interval = samplesPerBeat;
    }

    // Apply swing to odd positions
    const swingOffset = interval * grid.swing * 0.5;

    for (let pos = startTime; pos <= startTime + duration; pos += interval) {
      const positionIndex = Math.round((pos - startTime) / interval);
      const adjustedPos = positionIndex % 2 === 1 ? pos + swingOffset : pos;
      positions.push(adjustedPos + (grid.grooveOffset * this.audioContext.sampleRate) / 1000);
    }

    return positions;
  }

  /**
   * Quantize a position to the nearest grid point
   */
  public quantizePosition(
    position: number,
    grid: QuantizationGrid,
    strength: number = 1.0
  ): QuantizationResult {
    const gridPositions = this.calculateGridPositions(
      position - (this.audioContext?.sampleRate || 48000) * 2,
      (this.audioContext?.sampleRate || 48000) * 4,
      grid
    );

    // Find nearest grid position
    let nearestPosition = position;
    let minDistance = Infinity;

    for (const gridPos of gridPositions) {
      const distance = Math.abs(gridPos - position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPosition = gridPos;
      }
    }

    // Apply strength (0 = no quantization, 1 = full quantization)
    const quantizedPosition = position + (nearestPosition - position) * strength;

    return {
      originalPosition: position,
      quantizedPosition,
      offset: quantizedPosition - position,
      strength,
    };
  }

  /**
   * Quantize audio buffer regions
   */
  public quantizeAudioBuffer(
    buffer: AudioBuffer,
    transients: number[],
    grid: QuantizationGrid,
    strength: number = 1.0
  ): AudioBuffer {
    if (!this.audioContext) return buffer;

    const quantizedBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    // Copy original buffer
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      quantizedBuffer.getChannelData(channel).set(channelData);
    }

    // Quantize each transient
    for (const transientPos of transients) {
      const result = this.quantizePosition(transientPos, grid, strength);
      const offsetSamples = Math.round(result.offset);

      if (Math.abs(offsetSamples) > 1) {
        // Move audio segment
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const sourceData = buffer.getChannelData(channel);
          const targetData = quantizedBuffer.getChannelData(channel);

          if (offsetSamples > 0) {
            // Move forward
            for (let i = transientPos; i < buffer.length - offsetSamples; i++) {
              targetData[i + offsetSamples] = sourceData[i];
              targetData[i] = 0;
            }
          } else {
            // Move backward
            for (let i = transientPos; i >= -offsetSamples; i--) {
              targetData[i + offsetSamples] = sourceData[i];
              targetData[i] = 0;
            }
          }
        }
      }
    }

    return quantizedBuffer;
  }

  /**
   * Detect transients in audio buffer
   */
  public detectTransients(
    buffer: AudioBuffer,
    threshold: number = 0.5,
    windowSize: number = 1024
  ): TransientDetectionResult {
    const channelData = buffer.getChannelData(0);
    const transients: TransientDetectionResult['transients'] = [];

    // Calculate RMS in windows
    for (let i = 0; i < channelData.length - windowSize; i += windowSize / 4) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += channelData[i + j] * channelData[i + j];
      }
      const rms = Math.sqrt(sum / windowSize);

      // Compare with previous window
      if (i > 0) {
        let prevSum = 0;
        for (let j = 0; j < windowSize; j++) {
          const prevIndex = i - windowSize / 4 + j;
          if (prevIndex >= 0) {
            prevSum += channelData[prevIndex] * channelData[prevIndex];
          }
        }
        const prevRms = Math.sqrt(prevSum / windowSize);

        const ratio = rms / (prevRms + 0.0001);
        if (ratio > threshold) {
          transients.push({
            position: i,
            amplitude: rms,
            type: 'attack',
          });
        } else if (ratio < 1 / threshold && rms > 0.01) {
          transients.push({
            position: i,
            amplitude: rms,
            type: 'release',
          });
        }
      }
    }

    return {
      transients,
      threshold,
    };
  }

  /**
   * Time-stretch audio buffer using WSOLA (Waveform Similarity Overlap-Add)
   */
  public async timeStretch(buffer: AudioBuffer, options: TimeStretchOptions): Promise<AudioBuffer> {
    if (!this.audioContext) return buffer;

    const ratio = Math.max(0.5, Math.min(2.0, options.ratio));
    const newLength = Math.round(buffer.length * ratio);

    const stretchedBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      newLength,
      buffer.sampleRate
    );

    switch (options.algorithm) {
      case 'wsola':
        return this.timeStretchWSOLA(buffer, ratio, options.quality);
      case 'phase-vocoder':
        return this.timeStretchPhaseVocoder(buffer, ratio, options.quality);
      case 'frequency-domain':
        return this.timeStretchFrequencyDomain(buffer, ratio, options.quality);
      case 'time-domain':
      default:
        return this.timeStretchTimeDomain(buffer, ratio, options.quality);
    }
  }

  /**
   * Time-domain time-stretching (simple resampling)
   */
  private timeStretchTimeDomain(buffer: AudioBuffer, ratio: number, quality: string): AudioBuffer {
    if (!this.audioContext) return buffer;

    const newLength = Math.round(buffer.length * ratio);
    const stretchedBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      newLength,
      buffer.sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sourceData = buffer.getChannelData(channel);
      const targetData = stretchedBuffer.getChannelData(channel);

      // Linear interpolation
      for (let i = 0; i < newLength; i++) {
        const sourcePos = i / ratio;
        const index = Math.floor(sourcePos);
        const fraction = sourcePos - index;

        if (index < sourceData.length - 1) {
          targetData[i] = sourceData[index] * (1 - fraction) + sourceData[index + 1] * fraction;
        } else {
          targetData[i] = sourceData[sourceData.length - 1];
        }
      }
    }

    return stretchedBuffer;
  }

  /**
   * WSOLA time-stretching (better quality for speech and rhythmic audio)
   */
  private timeStretchWSOLA(buffer: AudioBuffer, ratio: number, quality: string): AudioBuffer {
    if (!this.audioContext) return buffer;

    const newLength = Math.round(buffer.length * ratio);
    const stretchedBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      newLength,
      buffer.sampleRate
    );

    const frameSize = quality === 'high' ? 2048 : quality === 'medium' ? 1024 : 512;
    const overlapSize = frameSize / 2;

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sourceData = buffer.getChannelData(channel);
      const targetData = stretchedBuffer.getChannelData(channel);

      let writePos = 0;
      let readPos = 0;

      while (writePos < newLength - frameSize) {
        // Find best overlap position
        let bestOffset = 0;
        let bestCorrelation = -Infinity;

        const searchRange = Math.min(frameSize / 4, sourceData.length - readPos - frameSize);

        for (let offset = 0; offset < searchRange; offset++) {
          let correlation = 0;
          for (let i = 0; i < overlapSize; i++) {
            if (writePos + i < targetData.length && readPos + offset + i < sourceData.length) {
              correlation += targetData[writePos + i] * sourceData[readPos + offset + i];
            }
          }

          if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestOffset = offset;
          }
        }

        // Copy frame with crossfade
        for (let i = 0; i < frameSize; i++) {
          const sourceIndex = readPos + bestOffset + i;
          const targetIndex = writePos + i;

          if (targetIndex < targetData.length && sourceIndex < sourceData.length) {
            if (i < overlapSize && writePos > 0) {
              // Crossfade
              const fade = i / overlapSize;
              targetData[targetIndex] =
                targetData[targetIndex] * (1 - fade) + sourceData[sourceIndex] * fade;
            } else {
              targetData[targetIndex] = sourceData[sourceIndex];
            }
          }
        }

        writePos += frameSize - overlapSize;
        readPos += Math.round((frameSize - overlapSize) / ratio);
      }
    }

    return stretchedBuffer;
  }

  /**
   * Phase vocoder time-stretching (best quality for tonal audio)
   */
  private timeStretchPhaseVocoder(
    buffer: AudioBuffer,
    ratio: number,
    quality: string
  ): AudioBuffer {
    if (!this.audioContext) return buffer;

    // Simplified phase vocoder implementation
    // In production, this would use FFT/IFFT with phase manipulation
    return this.timeStretchTimeDomain(buffer, ratio, quality);
  }

  /**
   * Frequency-domain time-stretching
   */
  private timeStretchFrequencyDomain(
    buffer: AudioBuffer,
    ratio: number,
    quality: string
  ): AudioBuffer {
    if (!this.audioContext) return buffer;

    // Simplified frequency-domain implementation
    // In production, this would use full FFT-based processing
    return this.timeStretchTimeDomain(buffer, ratio, quality);
  }

  /**
   * Pitch-shift audio buffer
   */
  public async pitchShift(buffer: AudioBuffer, options: PitchShiftOptions): Promise<AudioBuffer> {
    if (!this.audioContext) return buffer;

    const semitones = Math.max(-24, Math.min(24, options.semitones));
    const ratio = Math.pow(2, semitones / 12);

    if (options.preserveDuration) {
      // Use phase vocoder to preserve duration
      const timeStretched = await this.timeStretch(buffer, {
        ratio: 1 / ratio,
        preservePitch: false,
        algorithm: 'phase-vocoder',
        quality: 'high',
      });

      // Resample back to original duration with pitch change
      return this.resampleBuffer(timeStretched, buffer.sampleRate * ratio);
    } else {
      // Simple resampling (changes both pitch and duration)
      return this.resampleBuffer(buffer, buffer.sampleRate * ratio);
    }
  }

  /**
   * Resample buffer to new sample rate
   */
  private resampleBuffer(buffer: AudioBuffer, newSampleRate: number): AudioBuffer {
    if (!this.audioContext) return buffer;

    const ratio = newSampleRate / buffer.sampleRate;
    const newLength = Math.round(buffer.length * ratio);

    const resampledBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      newLength,
      newSampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sourceData = buffer.getChannelData(channel);
      const targetData = resampledBuffer.getChannelData(channel);

      // Linear interpolation
      for (let i = 0; i < newLength; i++) {
        const sourcePos = i / ratio;
        const index = Math.floor(sourcePos);
        const fraction = sourcePos - index;

        if (index < sourceData.length - 1) {
          targetData[i] = sourceData[index] * (1 - fraction) + sourceData[index + 1] * fraction;
        } else {
          targetData[i] = sourceData[sourceData.length - 1];
        }
      }
    }

    return resampledBuffer;
  }

  /**
   * Apply groove template to quantized positions
   */
  public applyGroove(
    positions: number[],
    grooveTemplate: number[],
    strength: number = 1.0
  ): number[] {
    return positions.map((pos, index) => {
      const grooveOffset = grooveTemplate[index % grooveTemplate.length];
      return pos + grooveOffset * strength;
    });
  }

  /**
   * Create groove template from audio analysis
   */
  public extractGrooveFromAudio(buffer: AudioBuffer, bpm: number): number[] {
    const transients = this.detectTransients(buffer, 0.4);
    const samplesPerBeat = (buffer.sampleRate * 60) / bpm;

    const grooveTemplate: number[] = [];

    // Analyze transient positions relative to grid
    for (const transient of transients.transients) {
      const beatPosition = (transient.position % samplesPerBeat) / samplesPerBeat;
      const offset = (beatPosition - 0.5) * samplesPerBeat; // Offset from center of beat
      grooveTemplate.push(offset);
    }

    return grooveTemplate;
  }

  /**
   * Batch quantize multiple regions
   */
  public batchQuantize(
    regions: Array<{ buffer: AudioBuffer; transients: number[] }>,
    grid: QuantizationGrid,
    strength: number = 1.0
  ): AudioBuffer[] {
    return regions.map((region) =>
      this.quantizeAudioBuffer(region.buffer, region.transients, grid, strength)
    );
  }
}

// Export singleton instance
export const quantizationEngine = new QuantizationEngine();
