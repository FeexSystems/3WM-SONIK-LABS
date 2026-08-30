/**
 * EQ AudioWorklet Processor - 3-band parametric EQ
 * Part of Phase 4.1.3: Create AudioWorklet processors for common DSP effects
 */

class EQProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // EQ parameters
    this.lowFreq = 200;
    this.midFreq = 1000;
    this.highFreq = 4000;
    this.lowGain = 0;
    this.midGain = 0;
    this.highGain = 0;
    this.lowQ = 1;
    this.midQ = 1;
    this.highQ = 1;
    
    // Filter coefficients
    this.lowCoeffs = { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0 };
    this.midCoeffs = { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0 };
    this.highCoeffs = { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0 };
    
    // Filter state
    this.lowState = { x1: 0, x2: 0, y1: 0, y2: 0 };
    this.midState = { x1: 0, x2: 0, y1: 0, y2: 0 };
    this.highState = { x1: 0, x2: 0, y1: 0, y2: 0 };
    
    this.updateCoefficients();
    
    this.port.onmessage = (event) => {
      if (event.data.type === 'updateParams') {
        this.updateParameters(event.data.params);
      }
    };
  }
  
  updateParameters(params) {
    if (params.lowFreq !== undefined) this.lowFreq = params.lowFreq;
    if (params.midFreq !== undefined) this.midFreq = params.midFreq;
    if (params.highFreq !== undefined) this.highFreq = params.highFreq;
    if (params.lowGain !== undefined) this.lowGain = params.lowGain;
    if (params.midGain !== undefined) this.midGain = params.midGain;
    if (params.highGain !== undefined) this.highGain = params.highGain;
    if (params.lowQ !== undefined) this.lowQ = params.lowQ;
    if (params.midQ !== undefined) this.midQ = params.midQ;
    if (params.highQ !== undefined) this.highQ = params.highQ;
    
    this.updateCoefficients();
  }
  
  updateCoefficients() {
    const sampleRate = 48000;
    
    // Calculate peaking EQ coefficients for each band
    this.lowCoeffs = this.calculatePeakingCoefficients(this.lowFreq, this.lowGain, this.lowQ, sampleRate);
    this.midCoeffs = this.calculatePeakingCoefficients(this.midFreq, this.midGain, this.midQ, sampleRate);
    this.highCoeffs = this.calculatePeakingCoefficients(this.highFreq, this.highGain, this.highQ, sampleRate);
  }
  
  calculatePeakingCoefficients(frequency, gain, Q, sampleRate) {
    const A = Math.pow(10, gain / 40);
    const omega = 2 * Math.PI * frequency / sampleRate;
    const alpha = Math.sin(omega) / (2 * Q);
    
    const b0 = 1 + alpha * A;
    const b1 = -2 * Math.cos(omega);
    const b2 = 1 - alpha * A;
    const a0 = 1 + alpha / A;
    const a1 = -2 * Math.cos(omega);
    const a2 = 1 - alpha / A;
    
    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: a1 / a0,
      a2: a2 / a0
    };
  }
  
  applyBiquadFilter(input, coeffs, state) {
    const output = coeffs.b0 * input + coeffs.b1 * state.x1 + coeffs.b2 * state.x2 
                  - coeffs.a1 * state.y1 - coeffs.a2 * state.y2;
    
    state.x2 = state.x1;
    state.x1 = input;
    state.y2 = state.y1;
    state.y1 = output;
    
    return output;
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !output) return true;
    
    for (let channel = 0; channel < input.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      
      if (!inputChannel || !outputChannel) continue;
      
      for (let i = 0; i < inputChannel.length; ++i) {
        let sample = inputChannel[i];
        
        // Apply low band
        sample = this.applyBiquadFilter(sample, this.lowCoeffs, this.lowState);
        
        // Apply mid band
        sample = this.applyBiquadFilter(sample, this.midCoeffs, this.midState);
        
        // Apply high band
        sample = this.applyBiquadFilter(sample, this.highCoeffs, this.highState);
        
        outputChannel[i] = sample;
      }
    }
    
    return true;
  }
}

registerProcessor('eq-processor', EQProcessor);
