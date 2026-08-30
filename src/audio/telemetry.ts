export class AudioTelemetry {
  public static activeVoices: number = 0;
  public static nodeAllocations: number = 0;
  public static scheduledLateness: number = 0; // ms
  public static maxLateness: number = 0;
  public static eventLoopLag: number = 0;

  private static lastLoopTime: number = performance.now();
  private static allocsLastSec: number = 0;
  private static lastAllocSnapshotTime: number = performance.now();

  public static updateEventLoop() {
    const now = performance.now();
    const lag = now - this.lastLoopTime;
    this.eventLoopLag = lag;
    this.lastLoopTime = now;
  }

  public static trackAllocation() {
    this.nodeAllocations++;
    const now = performance.now();
    if (now - this.lastAllocSnapshotTime >= 1000) {
      this.allocsLastSec = this.nodeAllocations;
      this.nodeAllocations = 0;
      this.lastAllocSnapshotTime = now;
    }
  }

  public static getAllocationsPerSec() {
    const now = performance.now();
    if (now - this.lastAllocSnapshotTime >= 1000) {
      this.allocsLastSec = this.nodeAllocations;
      this.nodeAllocations = 0;
      this.lastAllocSnapshotTime = now;
    }
    return this.allocsLastSec;
  }

  public static trackVoiceStart(node: OscillatorNode | AudioBufferSourceNode) {
    this.trackAllocation();
    this.activeVoices++;
    node.addEventListener('ended', () => {
      this.activeVoices--;
    });
  }
}
