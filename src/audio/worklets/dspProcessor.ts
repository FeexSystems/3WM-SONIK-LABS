/**
 * 3WM SONIK — AudioWorklet DSP Processor
 * Low-latency audio DSP processing using Web Audio API AudioWorklet
 * Provides sub-5ms latency for real-time DAW operations
 */

export interface DSPProcessorMessage {
  type: 'setParameter' | 'getParameters' | 'reset';
  parameter?: string;
  value?: number | number[];
}

export interface DSPParameters {
  // Equalizer
  eqLow: number; // -12 to +12 dB
  eqMid: number; // -12 to +12 dB
  eqHigh: number; // -12 to +12 dB
  eqLowFreq: number; // 20 to 500 Hz
  eqMidFreq: number; // 200 to 5000 Hz
  eqHighFreq: number; // 2000 to 20000 Hz

  // Compressor
  compThreshold: number; // -60 to 0 dB
  compRatio: number; // 1 to 20
  compAttack: number; // 0 to 100 ms
  compRelease: number; // 10 to 1000 ms
  compMakeupGain: number; // 0 to +24 dB

  // Reverb
  reverbMix: number; // 0 to 1
  reverbDecay: number; // 0.1 to 10 seconds
  reverbPreDelay: number; // 0 to 100 ms

  // Delay
  delayTime: number; // 0 to 2000 ms
  delayFeedback: number; // 0 to 0.95
  delayMix: number; // 0 to 1

  // Saturation
  saturationDrive: number; // 0 to 100
  saturationMix: number; // 0 to 1

  // Limiter
  limiterThreshold: number; // -20 to 0 dB
  limiterRelease: number; // 10 to 1000 ms
}

class DSPProcessor extends AudioWorkletProcessor {
  private parameters: DSPParameters = {
    // Equalizer (default flat)
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    eqLowFreq: 80,
    eqMidFreq: 1000,
    eqHighFreq: 8000,

    // Compressor (default mild compression)
    compThreshold: -18,
    compRatio: 4,
    compAttack: 10,
    compRelease: 100,
    compMakeupGain: 0,

    // Reverb (default off)
    reverbMix: 0,
    reverbDecay: 2,
    reverbPreDelay: 20,

    // Delay (default off)
    delayTime: 250,
    delayFeedback: 0.3,
    delayMix: 0,

    // Saturation (default off)
    saturationDrive: 0,
    saturationMix: 0,

    // Limiter (default -1 dB ceiling)
    limiterThreshold: -1,
    limiterRelease: 100,
  };

  // Delay buffer
  private delayBuffer: Float32Array[] = [];
  private delayBufferIndex = 0;
  private readonly maxDelaySamples = 96000; // 2 seconds at 48kHz

  // Reverb buffer (simplified for demo)
  private reverbBuffer: Float32Array[] = [];
  private reverbBufferIndex = 0;
  private readonly reverbSize = 32768;

  // Compressor state
  private compEnvelope = 0;
  private readonly compSampleRate = 48000;

  constructor() {
    super();
    this.initializeBuffers();
  }

  private initializeBuffers() {
    const numChannels = 2;
    for (let i = 0; i < numChannels; i++) {
      this.delayBuffer[i] = new Float32Array(this.maxDelaySamples);
      this.reverbBuffer[i] = new Float32Array(this.reverbSize);
    }
  }

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      // EQ parameters
      { name: 'eqLow', defaultValue: 0, minValue: -12, maxValue: 12 },
      { name: 'eqMid', defaultValue: 0, minValue: -12, maxValue: 12 },
      { name: 'eqHigh', defaultValue: 0, minValue: -12, maxValue: 12 },
      { name: 'eqLowFreq', defaultValue: 80, minValue: 20, maxValue: 500 },
      { name: 'eqMidFreq', defaultValue: 1000, minValue: 200, maxValue: 5000 },
      { name: 'eqHighFreq', defaultValue: 8000, minValue: 2000, maxValue: 20000 },

      // Compressor parameters
      { name: 'compThreshold', defaultValue: -18, minValue: -60, maxValue: 0 },
      { name: 'compRatio', defaultValue: 4, minValue: 1, maxValue: 20 },
      { name: 'compAttack', defaultValue: 10, minValue: 0, maxValue: 100 },
      { name: 'compRelease', defaultValue: 100, minValue: 10, maxValue: 1000 },
      { name: 'compMakeupGain', defaultValue: 0, minValue: 0, maxValue: 24 },

      // Reverb parameters
      { name: 'reverbMix', defaultValue: 0, minValue: 0, maxValue: 1 },
      { name: 'reverbDecay', defaultValue: 2, minValue: 0.1, maxValue: 10 },
      { name: 'reverbPreDelay', defaultValue: 20, minValue: 0, maxValue: 100 },

      // Delay parameters
      { name: 'delayTime', defaultValue: 250, minValue: 0, maxValue: 2000 },
      { name: 'delayFeedback', defaultValue: 0.3, minValue: 0, maxValue: 0.95 },
      { name: 'delayMix', defaultValue: 0, minValue: 0, maxValue: 1 },

      // Saturation parameters
      { name: 'saturationDrive', defaultValue: 0, minValue: 0, maxValue: 100 },
      { name: 'saturationMix', defaultValue: 0, minValue: 0, maxValue: 1 },

      // Limiter parameters
      { name: 'limiterThreshold', defaultValue: -1, minValue: -20, maxValue: 0 },
      { name: 'limiterRelease', defaultValue: 100, minValue: 10, maxValue: 1000 },
    ];
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    const output = outputs[0];
    const input = inputs[0];

    if (!input || !output) {
      return true;
    }

    // Update parameters from automation
    this.updateParameters(parameters);

    const numChannels = Math.min(input.length, output.length);

    for (let channel = 0; channel < numChannels; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      for (let i = 0; i < inputChannel.length; i++) {
        let sample = inputChannel[i];

        // Apply EQ (simplified biquad filter simulation)
        sample = this.applyEQ(sample, channel);

        // Apply compression
        sample = this.applyCompression(sample);

        // Apply saturation
        sample = this.applySaturation(sample);

        // Apply delay
        sample = this.applyDelay(sample, channel);

        // Apply reverb
        sample = this.applyReverb(sample, channel);

        // Apply limiter
        sample = this.applyLimiter(sample);

        outputChannel[i] = sample;
      }
    }

    return true;
  }

  private updateParameters(parameters: Record<string, Float32Array>) {
    // Update all parameters from automation values
    for (const [key, values] of Object.entries(parameters)) {
      if (values.length > 0) {
        (this.parameters as any)[key] = values[0];
      }
    }
  }

  private applyEQ(sample: number, channel: number): number {
    // Simplified shelving EQ using first-order filters
    // Low shelf
    const lowFreq = this.parameters.eqLowFreq;
    const lowGain = this.parameters.eqLow;
    const lowA = Math.exp((-2 * Math.PI * lowFreq) / this.compSampleRate);
    const lowB0 = 1 - lowGain * lowA;
    const lowB1 = 0;
    const lowA1 = -lowA;

    // High shelf
    const highFreq = this.parameters.eqHighFreq;
    const highGain = this.parameters.eqHigh;
    const highA = Math.exp((-2 * Math.PI * highFreq) / this.compSampleRate);
    const highB0 = highGain * (1 + highA);
    const highB1 = -highGain * (1 + highA) * highA;
    const highA1 = -highA;

    // Apply low shelf (simplified)
    let processed = sample * lowB0;
    processed += this.getPreviousSample(channel) * lowB1;
    processed -= this.getPreviousSample(channel) * lowA1;

    // Apply high shelf (simplified)
    processed = processed * highB0;
    processed += this.getPreviousSample(channel) * highB1;
    processed -= this.getPreviousSample(channel) * highA1;

    // Mid EQ (peaking filter - simplified)
    const midFreq = this.parameters.eqMidFreq;
    const midGain = this.parameters.eqMid;
    const midA = Math.exp((-2 * Math.PI * midFreq) / this.compSampleRate);
    const midB0 = 1 + midGain * midA;
    const midB1 = -2 * midA;
    const midA1 = -midA;

    processed = processed * midB0;
    processed += this.getPreviousSample(channel) * midB1;
    processed -= this.getPreviousSample(channel) * midA1;

    this.setPreviousSample(channel, sample);
    return processed;
  }

  private applyCompression(sample: number): number {
    const threshold = Math.pow(10, this.parameters.compThreshold / 20);
    const ratio = this.parameters.compRatio;
    const attack = this.parameters.compAttack / 1000;
    const release = this.parameters.compRelease / 1000;
    const makeupGain = Math.pow(10, this.parameters.compMakeupGain / 20);

    const inputLevel = Math.abs(sample);
    const targetGain = inputLevel > threshold ? Math.pow(threshold / inputLevel, 1 - 1 / ratio) : 1;

    // Envelope follower with attack/release
    const attackCoeff = Math.exp(-1 / (attack * this.compSampleRate));
    const releaseCoeff = Math.exp(-1 / (release * this.compSampleRate));
    const coeff = targetGain < this.compEnvelope ? attackCoeff : releaseCoeff;

    this.compEnvelope = this.compEnvelope * coeff + targetGain * (1 - coeff);

    return sample * this.compEnvelope * makeupGain;
  }

  private applySaturation(sample: number): number {
    const drive = this.parameters.saturationDrive / 100;
    const mix = this.parameters.saturationMix;

    if (drive === 0) return sample;

    // Soft clipping saturation
    const driven = sample * (1 + drive * 10);
    const saturated = Math.tanh(driven);

    return sample * (1 - mix) + saturated * mix;
  }

  private applyDelay(sample: number, channel: number): number {
    const delayTime = this.parameters.delayTime / 1000;
    const feedback = this.parameters.delayFeedback;
    const mix = this.parameters.delayMix;

    if (mix === 0) return sample;

    const delaySamples = Math.floor(delayTime * this.compSampleRate);
    const buffer = this.delayBuffer[channel];

    // Write current sample
    buffer[this.delayBufferIndex] =
      sample +
      buffer[(this.delayBufferIndex - delaySamples + this.maxDelaySamples) % this.maxDelaySamples] *
        feedback;

    // Read delayed sample
    const delayedSample =
      buffer[(this.delayBufferIndex - delaySamples + this.maxDelaySamples) % this.maxDelaySamples];

    this.delayBufferIndex = (this.delayBufferIndex + 1) % this.maxDelaySamples;

    return sample * (1 - mix) + delayedSample * mix;
  }

  private applyReverb(sample: number, channel: number): number {
    const mix = this.parameters.reverbMix;
    const decay = this.parameters.reverbDecay;

    if (mix === 0) return sample;

    const buffer = this.reverbBuffer[channel];
    const decayFactor = Math.exp(-1 / (decay * this.compSampleRate));

    // Simple diffusion reverb
    buffer[this.reverbBufferIndex] =
      sample * 0.5 +
      buffer[(this.reverbBufferIndex - 1 + this.reverbSize) % this.reverbSize] * decayFactor;

    const reverbSample = buffer[(this.reverbBufferIndex - 100 + this.reverbSize) % this.reverbSize];

    this.reverbBufferIndex = (this.reverbBufferIndex + 1) % this.reverbSize;

    return sample * (1 - mix) + reverbSample * mix;
  }

  private applyLimiter(sample: number): number {
    const threshold = Math.pow(10, this.parameters.limiterThreshold / 20);
    const release = this.parameters.limiterRelease / 1000;

    const absSample = Math.abs(sample);
    if (absSample <= threshold) return sample;

    const limitedSample = Math.sign(sample) * threshold;
    const releaseCoeff = Math.exp(-1 / (release * this.compSampleRate));

    // Smooth limiting
    return sample * releaseCoeff + limitedSample * (1 - releaseCoeff);
  }

  private previousSamples: Map<number, number> = new Map();

  private getPreviousSample(channel: number): number {
    return this.previousSamples.get(channel) || 0;
  }

  private setPreviousSample(channel: number, value: number): void {
    this.previousSamples.set(channel, value);
  }
}

registerProcessor('dsp-processor', DSPProcessor);
