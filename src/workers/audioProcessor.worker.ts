// Web Worker for audio processing tasks
const ctx: Worker = self as any;

ctx.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  switch (type) {
    case 'PROCESS_AUDIO_BUFFER':
      processAudioBuffer(data);
      break;
    case 'ANALYZE_WAVEFORM':
      analyzeWaveform(data);
      break;
    case 'APPLY_DSP':
      applyDSP(data);
      break;
    default:
      console.warn('Unknown message type:', type);
  }
};

function processAudioBuffer(data: { buffer: Float32Array; sampleRate: number }) {
  const { buffer, sampleRate } = data;

  // Simulate audio processing (e.g., normalization, compression)
  const processed = new Float32Array(buffer.length);
  let maxAmplitude = 0;

  // Find max amplitude for normalization
  for (let i = 0; i < buffer.length; i++) {
    const abs = Math.abs(buffer[i]);
    if (abs > maxAmplitude) maxAmplitude = abs;
  }

  // Normalize to -1dB
  const targetAmplitude = 0.89;
  const gain = maxAmplitude > 0 ? targetAmplitude / maxAmplitude : 1;

  for (let i = 0; i < buffer.length; i++) {
    processed[i] = buffer[i] * gain;
  }

  ctx.postMessage(
    {
      type: 'AUDIO_BUFFER_PROCESSED',
      data: { buffer: processed, sampleRate },
    },
    [processed.buffer] as any
  );
}

function analyzeWaveform(data: { buffer: Float32Array; resolution: number }) {
  const { buffer, resolution } = data;
  const samples = Math.min(resolution, buffer.length);
  const step = Math.floor(buffer.length / samples);

  const waveform = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    const start = i * step;
    const end = Math.min(start + step, buffer.length);
    let sum = 0;

    for (let j = start; j < end; j++) {
      sum += Math.abs(buffer[j]);
    }

    waveform[i] = sum / (end - start);
  }

  ctx.postMessage(
    {
      type: 'WAVEFORM_ANALYZED',
      data: { waveform },
    },
    [waveform.buffer] as any
  );
}

function applyDSP(data: { buffer: Float32Array; type: string; params: any }) {
  const { buffer, type, params } = data;
  const processed = new Float32Array(buffer.length);

  switch (type) {
    case 'compressor':
      // Simple compression
      const threshold = params.threshold || 0.5;
      const ratio = params.ratio || 4;

      for (let i = 0; i < buffer.length; i++) {
        const input = buffer[i];
        const absInput = Math.abs(input);

        if (absInput > threshold) {
          const excess = absInput - threshold;
          const compressed = threshold + excess / ratio;
          processed[i] = (input / absInput) * compressed;
        } else {
          processed[i] = input;
        }
      }
      break;

    case 'reverb':
      // Simple convolution reverb simulation
      const decay = params.decay || 0.5;
      const mix = params.mix || 0.3;

      for (let i = 0; i < buffer.length; i++) {
        processed[i] = buffer[i] * (1 - mix);

        // Add delayed, attenuated copies
        for (let j = 1; j <= 4; j++) {
          const delay = Math.floor(i + j * 1000);
          if (delay < buffer.length) {
            processed[i] += buffer[delay] * mix * Math.pow(decay, j);
          }
        }
      }
      break;

    default:
      // Pass through
      processed.set(buffer);
  }

  ctx.postMessage(
    {
      type: 'DSP_APPLIED',
      data: { buffer: processed },
    },
    [processed.buffer] as any
  );
}
