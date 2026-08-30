/**
 * 3WM SONIK — MP3 Export via Web Worker
 *
 * Spawns a dedicated Web Worker to perform CPU-intensive LAME MP3 encoding
 * off the main thread, keeping the DAW UI responsive during exports.
 */

export interface Mp3EncodeOptions {
  channels?: number;
  sampleRate?: number;
  kbps?: number;
  onProgress?: (percent: number) => void;
}

export function encodeWavToMp3Worker(
  wavArrayBuffer: ArrayBuffer,
  options: Mp3EncodeOptions = {}
): Promise<ArrayBuffer> {
  const { channels = 2, sampleRate = 48000, kbps = 320, onProgress } = options;

  return new Promise((resolve, reject) => {
    const worker = new Worker('/workers/mp3EncoderWorker.js');

    worker.onmessage = (e) => {
      const { type, mp3Data, progress, error } = e.data;

      if (type === 'progress' && onProgress) {
        onProgress(progress);
      } else if (type === 'complete') {
        worker.terminate();
        resolve(mp3Data);
      } else if (type === 'error') {
        worker.terminate();
        reject(new Error(error));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(new Error(`MP3 Worker error: ${err.message}`));
    };

    // Transfer the WAV buffer to the worker (zero-copy)
    worker.postMessage({ wavData: wavArrayBuffer, channels, sampleRate, kbps }, [wavArrayBuffer]);
  });
}
