// 3WM SONIK — Lock-Free SPSC Ring Buffer for AudioWorklet
// SharedArrayBuffer-backed lockless ring buffer for real-time audio thread communication.

export class SharedRingBuffer {
  private buffer: SharedArrayBuffer;
  private state: Int32Array; // [0]: writeIndex, [1]: readIndex
  private storage: Float32Array;
  private capacity: number;

  constructor(capacity = 8192) {
    this.capacity = capacity;
    // Header state: 2 Int32 elements (8 bytes) + Float32 data buffer
    const stateBytes = 2 * Int32Array.BYTES_PER_ELEMENT;
    const dataBytes = capacity * Float32Array.BYTES_PER_ELEMENT;

    this.buffer = new SharedArrayBuffer(stateBytes + dataBytes);
    this.state = new Int32Array(this.buffer, 0, 2);
    this.storage = new Float32Array(this.buffer, stateBytes, capacity);
  }

  public getSharedBuffer(): SharedArrayBuffer {
    return this.buffer;
  }

  public static fromSharedBuffer(buffer: SharedArrayBuffer): SharedRingBuffer {
    const instance = Object.create(SharedRingBuffer.prototype);
    instance.buffer = buffer;
    instance.state = new Int32Array(buffer, 0, 2);
    const capacity = (buffer.byteLength - 2 * Int32Array.BYTES_PER_ELEMENT) / Float32Array.BYTES_PER_ELEMENT;
    instance.capacity = capacity;
    instance.storage = new Float32Array(buffer, 2 * Int32Array.BYTES_PER_ELEMENT, capacity);
    return instance;
  }

  public availableWrite(): number {
    const w = Atomics.load(this.state, 0);
    const r = Atomics.load(this.state, 1);
    return this.capacity - 1 - ((w - r + this.capacity) % this.capacity);
  }

  public availableRead(): number {
    const w = Atomics.load(this.state, 0);
    const r = Atomics.load(this.state, 1);
    return (w - r + this.capacity) % this.capacity;
  }

  public write(data: Float32Array): number {
    const avail = this.availableWrite();
    const toWrite = Math.min(avail, data.length);
    let w = Atomics.load(this.state, 0);

    for (let i = 0; i < toWrite; i++) {
      this.storage[w] = data[i];
      w = (w + 1) % this.capacity;
    }

    Atomics.store(this.state, 0, w);
    return toWrite;
  }

  public read(output: Float32Array): number {
    const avail = this.availableRead();
    const toRead = Math.min(avail, output.length);
    let r = Atomics.load(this.state, 1);

    for (let i = 0; i < toRead; i++) {
      output[i] = this.storage[r];
      r = (r + 1) % this.capacity;
    }

    Atomics.store(this.state, 1, r);
    return toRead;
  }
}
