// 3WM SONIK — MP3 Encoding Web Worker
// Offloads CPU-intensive LAME MP3 encoding to a background thread
// so the DAW UI stays buttery smooth during exports.

self.onmessage = async (e) => {
  const { wavData, channels, sampleRate, kbps } = e.data;

  try {
    // Dynamic import of lamejs inside the worker context
    importScripts('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js');

    const mp3encoder = new lamejs.Mp3Encoder(channels || 2, sampleRate || 48000, kbps || 320);
    const mp3Chunks = [];

    // Skip 44-byte WAV header, assume 16-bit PCM
    const samples = new Int16Array(wavData, 44, (wavData.byteLength - 44) / 2);
    const sampleBlockSize = 1152;

    // De-interleave stereo
    const numChannels = channels || 2;
    const samplesPerChannel = Math.floor(samples.length / numChannels);
    const left = new Int16Array(samplesPerChannel);
    const right = numChannels === 2 ? new Int16Array(samplesPerChannel) : null;

    for (let i = 0; i < samples.length; i += numChannels) {
      const idx = Math.floor(i / numChannels);
      left[idx] = samples[i];
      if (right && numChannels === 2) {
        right[idx] = samples[i + 1];
      }
    }

    // Encode in blocks, reporting progress
    const totalBlocks = Math.ceil(samplesPerChannel / sampleBlockSize);
    let blocksProcessed = 0;

    for (let i = 0; i < samplesPerChannel; i += sampleBlockSize) {
      const leftChunk = left.subarray(i, i + sampleBlockSize);
      const rightChunk = right ? right.subarray(i, i + sampleBlockSize) : leftChunk;

      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Chunks.push(new Uint8Array(mp3buf));
      }

      blocksProcessed++;
      // Report progress every 50 blocks
      if (blocksProcessed % 50 === 0 || blocksProcessed === totalBlocks) {
        self.postMessage({
          type: 'progress',
          progress: Math.round((blocksProcessed / totalBlocks) * 100),
        });
      }
    }

    // Flush remaining
    const finalBuf = mp3encoder.flush();
    if (finalBuf.length > 0) {
      mp3Chunks.push(new Uint8Array(finalBuf));
    }

    // Concatenate all chunks into a single ArrayBuffer
    const totalLength = mp3Chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const mp3Output = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of mp3Chunks) {
      mp3Output.set(chunk, offset);
      offset += chunk.length;
    }

    // Transfer the buffer back to the main thread (zero-copy)
    self.postMessage(
      { type: 'complete', mp3Data: mp3Output.buffer },
      [mp3Output.buffer]
    );
  } catch (err) {
    self.postMessage({ type: 'error', error: err.message || 'MP3 encoding failed' });
  }
};
