/**
 * Audio Test Utils - Test audio buffer generation and utilities
 * Part of Phase 5.2.1: Create AudioTestUtils class with test audio buffer generation
 */

export class AudioTestUtils {
  /**
   * Generate a sine wave buffer
   */
  static generateSineWave(
    frequency: number,
    duration: number,
    sampleRate: number = 48000,
    amplitude: number = 0.5
  ): Float32Array {
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      buffer[i] = amplitude * Math.sin(2 * Math.PI * frequency * time);
    }

    return buffer;
  }

  /**
   * Generate white noise buffer
   */
  static generateWhiteNoise(
    duration: number,
    sampleRate: number = 48000,
    amplitude: number = 0.5
  ): Float32Array {
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      buffer[i] = amplitude * (Math.random() * 2 - 1);
    }

    return buffer;
  }

  /**
   * Generate pink noise buffer
   */
  static generatePinkNoise(
    duration: number,
    sampleRate: number = 48000,
    amplitude: number = 0.5
  ): Float32Array {
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = new Float32Array(numSamples);

    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;

    for (let i = 0; i < numSamples; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      buffer[i] = amplitude * (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    return buffer;
  }

  /**
   * Generate frequency sweep buffer (chirp)
   */
  static generateSweep(
    startFreq: number,
    endFreq: number,
    duration: number,
    sampleRate: number = 48000,
    amplitude: number = 0.5
  ): Float32Array {
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      const progress = time / duration;
      const frequency = startFreq + (endFreq - startFreq) * progress;
      buffer[i] = amplitude * Math.sin(2 * Math.PI * frequency * time);
    }

    return buffer;
  }

  /**
   * Generate impulse response
   */
  static generateImpulseResponse(
    duration: number,
    sampleRate: number = 48000,
    decay: number = 0.5
  ): Float32Array {
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      buffer[i] = Math.exp(-decay * time) * (Math.random() * 2 - 1);
    }

    return buffer;
  }

  /**
   * Generate silence buffer
   */
  static generateSilence(duration: number, sampleRate: number = 48000): Float32Array {
    const numSamples = Math.floor(duration * sampleRate);
    return new Float32Array(numSamples);
  }

  /**
   * Generate square wave buffer
   */
  static generateSquareWave(
    frequency: number,
    duration: number,
    sampleRate: number = 48000,
    amplitude: number = 0.5
  ): Float32Array {
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      const phase = (time * frequency) % 1;
      buffer[i] = amplitude * (phase < 0.5 ? 1 : -1);
    }

    return buffer;
  }

  /**
   * Generate sawtooth wave buffer
   */
  static generateSawtoothWave(
    frequency: number,
    duration: number,
    sampleRate: number = 48000,
    amplitude: number = 0.5
  ): Float32Array {
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      const phase = (time * frequency) % 1;
      buffer[i] = amplitude * (2 * phase - 1);
    }

    return buffer;
  }

  /**
   * Generate triangle wave buffer
   */
  static generateTriangleWave(
    frequency: number,
    duration: number,
    sampleRate: number = 48000,
    amplitude: number = 0.5
  ): Float32Array {
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      const phase = (time * frequency) % 1;
      buffer[i] = amplitude * (2 * Math.abs(2 * phase - 1) - 1);
    }

    return buffer;
  }

  /**
   * Generate stereo buffer from mono
   */
  static toStereo(monoBuffer: Float32Array): [Float32Array, Float32Array] {
    const left = new Float32Array(monoBuffer);
    const right = new Float32Array(monoBuffer);
    return [left, right];
  }

  /**
   * Generate AudioBuffer from Float32 data
   */
  static createAudioBuffer(
    data: Float32Array | Float32Array[],
    sampleRate: number = 48000
  ): AudioBuffer {
    const audioContext = new AudioContext({ sampleRate });

    const channels = Array.isArray(data) ? data : [data];
    const buffer = audioContext.createBuffer(channels.length, channels[0].length, sampleRate);

    channels.forEach((channelData, channelIndex) => {
      const channelBuffer = buffer.getChannelData(channelIndex);
      channelBuffer.set(channelData);
    });

    audioContext.close();
    return buffer;
  }

  /**
   * Apply fade-in to buffer
   */
  static applyFadeIn(
    buffer: Float32Array,
    duration: number,
    sampleRate: number = 48000
  ): Float32Array {
    const fadeSamples = Math.floor(duration * sampleRate);
    const result = new Float32Array(buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      let gain = 1;
      if (i < fadeSamples) {
        gain = i / fadeSamples;
      }
      result[i] = buffer[i] * gain;
    }

    return result;
  }

  /**
   * Apply fade-out to buffer
   */
  static applyFadeOut(
    buffer: Float32Array,
    duration: number,
    sampleRate: number = 48000
  ): Float32Array {
    const fadeSamples = Math.floor(duration * sampleRate);
    const result = new Float32Array(buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      let gain = 1;
      if (i > buffer.length - fadeSamples) {
        gain = (buffer.length - i) / fadeSamples;
      }
      result[i] = buffer[i] * gain;
    }

    return result;
  }

  /**
   * Normalize buffer to target level
   */
  static normalize(buffer: Float32Array, targetLevel: number = 0.9): Float32Array {
    let maxSample = 0;
    for (let i = 0; i < buffer.length; i++) {
      maxSample = Math.max(maxSample, Math.abs(buffer[i]));
    }

    if (maxSample === 0) return buffer;

    const scale = targetLevel / maxSample;
    const result = new Float32Array(buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      result[i] = buffer[i] * scale;
    }

    return result;
  }

  /**
   * Mix two buffers
   */
  static mix(buffer1: Float32Array, buffer2: Float32Array, ratio: number = 0.5): Float32Array {
    const minLength = Math.min(buffer1.length, buffer2.length);
    const result = new Float32Array(minLength);

    for (let i = 0; i < minLength; i++) {
      result[i] = buffer1[i] * (1 - ratio) + buffer2[i] * ratio;
    }

    return result;
  }

  /**
   * Calculate RMS level of buffer
   */
  static calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Calculate peak level of buffer
   */
  static calculatePeak(buffer: Float32Array): number {
    let peak = 0;
    for (let i = 0; i < buffer.length; i++) {
      peak = Math.max(peak, Math.abs(buffer[i]));
    }
    return peak;
  }

  /**
   * Calculate dB level from linear amplitude
   */
  static linearToDb(linear: number): number {
    return 20 * Math.log10(Math.max(linear, 1e-10));
  }

  /**
   * Calculate linear amplitude from dB level
   */
  static dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }
}
