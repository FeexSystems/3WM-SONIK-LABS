/**
 * Compression AudioWorklet Processor - Dynamic range compression
 * Part of Phase 4.1.3: Create AudioWorklet processors for common DSP effects
 */

class CompressionProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Compression parameters
    this.threshold = -24;
    this.ratio = 4;
    this.knee = 6;
    this.attack = 0.003;
    this.release = 0.25;
    this.makeupGain = 0;
    
    // Envelope follower state
    this.envelope = 0;
    this.gainReduction = 0;
    
    this.port.onmessage = (event) => {
      if (event.data.type === 'updateParams') {
        this.updateParameters(event.data.params);
      }
    };
  }
  
  updateParameters(params) {
    if (params.threshold !== undefined) this.threshold = params.threshold;
    if (params.ratio !== undefined) this.ratio = params.ratio;
    if (params.knee !== undefined) this.knee = params.knee;
    if (params.attack !== undefined) this.attack = params.attack;
    if (params.release !== undefined) this.release = params.release;
    if (params.makeupGain !== undefined) this.makeupGain = params.makeupGain;
  }
  
  calculateGainReduction(inputLevel) {
    const inputDb = 20 * Math.log10(Math.abs(inputLevel) + 1e-10);
    
    // Soft knee calculation
    const kneeHalf = this.knee / 2;
    let gainDb;
    
    if (inputDb < this.threshold - kneeHalf) {
      gainDb = 0;
    } else if (inputDb > this.threshold + kneeHalf) {
      gainDb = (this.threshold - inputDb) * (1 - 1 / this.ratio);
    } else {
      // In knee region
      const x = inputDb - (this.threshold - kneeHalf);
      const y = x / this.knee;
      gainDb = y * (this.threshold - inputDb) * (1 - 1 / this.ratio);
    }
    
    return gainDb;
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !output) return true;
    
    const sampleRate = 48000;
    const attackCoeff = Math.exp(-1 / (this.attack * sampleRate));
    const releaseCoeff = Math.exp(-1 / (this.release * sampleRate));
    
    for (let channel = 0; channel < input.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      
      if (!inputChannel || !outputChannel) continue;
      
      for (let i = 0; i < inputChannel.length; ++i) {
        const inputSample = inputChannel[i];
        const inputLevel = Math.abs(inputSample);
        
        // Update envelope follower
        const targetEnvelope = inputLevel;
        const coeff = targetEnvelope > this.envelope ? attackCoeff : releaseCoeff;
        this.envelope = targetEnvelope + coeff * (this.envelope - targetEnvelope);
        
        // Calculate gain reduction
        const targetGainReduction = this.calculateGainReduction(this.envelope);
        const gainCoeff = targetGainReduction > this.gainReduction ? attackCoeff : releaseCoeff;
        this.gainReduction = targetGainReduction + gainCoeff * (this.gainReduction - targetGainReduction);
        
        // Apply gain reduction and makeup gain
        const linearGain = Math.pow(10, (this.gainReduction + this.makeupGain) / 20);
        outputChannel[i] = inputSample * linearGain;
      }
    }
    
    return true;
  }
}

registerProcessor('compression-processor', CompressionProcessor);
