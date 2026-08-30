// 3WM SONIK - Recording Audio Worklet Processor
// Handles low-latency audio processing for multitrack recording

class RecordingProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 128;
    this.recordingEnabled = false;
    this.inputGain = 1.0;
    this.latencyCompensation = 0;
    this.buffer = [];
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'recordingEnabled',
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
      },
      {
        name: 'inputGain',
        defaultValue: 1.0,
        minValue: 0,
        maxValue: 2,
      },
      {
        name: 'latencyCompensation',
        defaultValue: 0,
        minValue: 0,
        maxValue: 48000, // Maximum 1 second at 48kHz
      },
    ];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    const recordingEnabled = parameters.recordingEnabled[0] === 1;
    const inputGain = parameters.inputGain[0];
    const latencyCompensation = Math.round(parameters.latencyCompensation[0]);

    if (!input || !output) {
      return true;
    }

    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      if (inputChannel && outputChannel) {
        for (let i = 0; i < inputChannel.length; i++) {
          // Apply input gain
          const sample = inputChannel[i] * inputGain;
          
          // Store for recording if enabled
          if (recordingEnabled) {
            this.buffer.push(sample);
          }
          
          // Pass through to output for monitoring
          outputChannel[i] = sample;
        }
      }
    }

    // Send buffer data to main thread periodically
    if (this.buffer.length >= this.bufferSize) {
      this.port.postMessage({
        type: 'audioData',
        buffer: new Float32Array(this.buffer),
      });
      this.buffer = [];
    }

    return true;
  }
}

registerProcessor('recording-processor', RecordingProcessor);