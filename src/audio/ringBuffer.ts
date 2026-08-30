// 3WM SONIK — High-Precision Lock-Free Circular Ring Buffer for Audio Engine & Live Monitoring
// Eliminates audio dropouts, clicking, and glitches under high-CPU plugin loads and GC pauses.

export interface RingBufferStats {
  capacity: number;
  availableRead: number;
  availableWrite: number;
  underruns: number;
  overflows: number;
  sampleRate: number;
  latencyMs: number;
}

export class HighPrecisionRingBuffer {
  private bufferL: Float32Array;
  private bufferR: Float32Array;
  private capacity: number;
  private mask: number;
  private writeIndex: number = 0;
  private readIndex: number = 0;
  private underruns: number = 0;
  private overflows: number = 0;
  private sampleRate: number;

  constructor(capacity: number = 16384, sampleRate: number = 48000) {
    // Ensure capacity is a power of 2 for fast bitwise masking
    let p2 = 1;
    while (p2 < capacity) {
      p2 <<= 1;
    }
    this.capacity = p2;
    this.mask = this.capacity - 1;
    this.sampleRate = sampleRate;
    this.bufferL = new Float32Array(this.capacity);
    this.bufferR = new Float32Array(this.capacity);
  }

  public getCapacity(): number {
    return this.capacity;
  }

  public getAvailableRead(): number {
    return (this.writeIndex - this.readIndex) & this.mask;
  }

  public getAvailableWrite(): number {
    return this.capacity - 1 - this.getAvailableRead();
  }

  /**
   * Write interleaved or dual-channel audio into the ring buffer
   */
  public write(channelL: Float32Array, channelR?: Float32Array): number {
    const numFrames = channelL.length;
    const available = this.getAvailableWrite();

    if (numFrames > available) {
      this.overflows++;
      // Write as much as fits to preserve newest or drop gracefully
    }

    const framesToWrite = Math.min(numFrames, available);
    const rData = channelR || channelL; // Mono fallback

    for (let i = 0; i < framesToWrite; i++) {
      const idx = (this.writeIndex + i) & this.mask;
      this.bufferL[idx] = channelL[i];
      this.bufferR[idx] = rData[i];
    }

    this.writeIndex = (this.writeIndex + framesToWrite) & (2 * this.capacity - 1);
    return framesToWrite;
  }

  /**
   * Read stereo frames out of the ring buffer with anti-underrun zero-padding & smooth decay
   */
  public read(outL: Float32Array, outR: Float32Array, numFrames: number): number {
    const available = this.getAvailableRead();
    const framesToRead = Math.min(numFrames, available);

    for (let i = 0; i < framesToRead; i++) {
      const idx = (this.readIndex + i) & this.mask;
      outL[i] = this.bufferL[idx];
      outR[i] = this.bufferR[idx];
    }

    // If an underrun occurs (e.g. CPU spike), softly ramp out the remaining frames to avoid clicking
    if (framesToRead < numFrames) {
      this.underruns++;
      let lastValL = framesToRead > 0 ? outL[framesToRead - 1] : 0;
      let lastValR = framesToRead > 0 ? outR[framesToRead - 1] : 0;

      for (let i = framesToRead; i < numFrames; i++) {
        lastValL *= 0.92; // Smooth exponential fade to zero
        lastValR *= 0.92;
        outL[i] = lastValL;
        outR[i] = lastValR;
      }
    }

    this.readIndex = (this.readIndex + framesToRead) & (2 * this.capacity - 1);
    return framesToRead;
  }

  /**
   * Peak check for live monitoring visualization without consuming from buffer
   */
  public getPeakLevel(): number {
    const available = this.getAvailableRead();
    if (available === 0) return 0;

    let peak = 0;
    const checkFrames = Math.min(available, 512);
    for (let i = 0; i < checkFrames; i++) {
      const idx = (this.readIndex + i) & this.mask;
      const absL = Math.abs(this.bufferL[idx]);
      const absR = Math.abs(this.bufferR[idx]);
      if (absL > peak) peak = absL;
      if (absR > peak) peak = absR;
    }
    return peak;
  }

  public clear(): void {
    this.writeIndex = 0;
    this.readIndex = 0;
    this.bufferL.fill(0);
    this.bufferR.fill(0);
  }

  public getStats(): RingBufferStats {
    const availableRead = this.getAvailableRead();
    return {
      capacity: this.capacity,
      availableRead,
      availableWrite: this.getAvailableWrite(),
      underruns: this.underruns,
      overflows: this.overflows,
      sampleRate: this.sampleRate,
      latencyMs: Number(((availableRead / this.sampleRate) * 1000).toFixed(2)),
    };
  }
}
