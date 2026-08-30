/**
 * Saturation AudioWorklet Processor - Analog-style saturation
 * Part of Phase 4.1.3: Create AudioWorklet processors for common DSP effects
 */

class SaturationProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Saturation parameters
    this.drive = 1;
    this.tone = 0.5;
    this.mix = 1;
    this.output = 1;
    
    // Saturation mode: 'soft', 'hard', 'tape', 'tube'
    this.mode = 'soft';
    
    // State for anti-aliasing
    this.prevSample = 0;
    
    this.port.onmessage = (event) => {
      if (event.data.type === 'updateParams') {
        this.updateParameters(event.data.params);
      }
    };
  }
  
  updateParameters(params) {
    if (params.drive !== undefined) this.drive = params.drive;
    if (params.tone !== undefined) this.tone = params.tone;
    if (params.mix !== undefined) this.mix = params.mix;
    if (params.output !== undefined) this.output = params.output;
    if (params.mode !== undefined) this.mode = params.mode;
  }
  
  softClip(x) {
    // Soft clipping using tanh
    return Math.tanh(x);
  }
  
  hardClip(x) {
    // Hard clipping
    return Math.max(-1, Math.min(1, x));
  }
  
  tapeSaturation(x) {
    // Tape-style saturation with asymmetric clipping
    const drive = this.drive;
    const positive = x > 0;
    const absX = Math.abs(x) * drive;
    
    // Asymmetric saturation curve
    const saturated = positive 
      ? (1 - Math.exp(-absX)) 
      : -(1 - Math.exp(-absX));
    
    return saturated / drive;
  }
  
  tubeSaturation(x) {
    // Tube-style saturation with warm harmonics
    const drive = this.drive;
    const x2 = x * drive;
    const x3 = x2 * x2 * x2;
    
    // Cubic nonlinearity for tube warmth
    return (x2 + 0.1 * x3) / (1 + 0.1 * x3 * x3);
  }
  
  applySaturation(sample) {
    const driven = sample * this.drive;
    
    switch (this.mode) {
      case 'soft':
        return this.softClip(driven);
      case 'hard':
        return this.hardClip(driven);
      case 'tape':
        return this.tapeSaturation(sample);
      case 'tube':
        return this.tubeSaturation(sample);
      default:
        return this.softClip(driven);
    }
  }
  
  applyToneFilter(sample) {
    // Simple low-pass filter for tone control
    const cutoff = 200 + this.tone * 18000;
    const sampleRate = 48000;
    const rc = 1.0 / (cutoff * 2 * Math.PI);
    const dt = 1.0 / sampleRate;
    const alpha = dt / (rc + dt);
    
    // Simple one-pole low-pass filter
    const filtered = this.prevSample + alpha * (sample - this.prevSample);
    this.prevSample = filtered;
    
    return filtered;
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
        const sample = inputChannel[i];
        
        // Apply saturation
        const saturated = this.applySaturation(sample);
        
        // Apply tone filter
        const toned = this.applyToneFilter(saturated);
        
        // Mix dry/wet
        const mixed = sample * (1 - this.mix) + toned * this.mix;
        
        // Apply output gain
        outputChannel[i] = mixed * this.output;
      }
    }
    
    return true;
  }
}

registerProcessor('saturation-processor', SaturationProcessor);
