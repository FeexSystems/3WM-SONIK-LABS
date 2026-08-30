// AudioWorklet processor for real-time audio monitoring
// Replaces deprecated ScriptProcessorNode for better performance and browser compatibility

class AudioMonitorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 1024;
    this.ringBuffer = new Float32Array(this.bufferSize * 2); // Stereo buffer
    this.writeIndex = 0;
    this.monitoringEnabled = false;
    
    // Handle messages from the main thread
    this.port.onmessage = (event) => {
      if (event.data.type === 'setMonitoring') {
        this.monitoringEnabled = event.data.enabled;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length === 0) {
      return true;
    }

    const inputChannel = input[0];
    const outputLeft = output[0];
    const outputRight = output[1];

    if (this.monitoringEnabled && outputLeft && outputRight) {
      for (let i = 0; i < inputChannel.length; i++) {
        // Write to ring buffer
        this.ringBuffer[this.writeIndex] = inputChannel[i];
        this.ringBuffer[this.writeIndex + this.bufferSize] = inputChannel[i]; // Duplicate for stereo
        this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
        
        // Read from ring buffer with delay for monitoring
        const readIndex = (this.writeIndex - 64 + this.bufferSize) % this.bufferSize; // Small delay
        outputLeft[i] = this.ringBuffer[readIndex];
        outputRight[i] = this.ringBuffer[readIndex + this.bufferSize];
      }
    } else if (outputLeft && outputRight) {
      // Output silence when monitoring is disabled
      for (let i = 0; i < inputChannel.length; i++) {
        outputLeft[i] = 0;
        outputRight[i] = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-monitor-processor', AudioMonitorProcessor);