import re

with open("src/audio/engine.ts", "r") as f:
    content = f.read()

import_stmt = "import { AudioTelemetry } from './telemetry';\n"
if "AudioTelemetry" not in content:
    content = content.replace("import { sonik808Engine }", import_stmt + "import { sonik808Engine }")

init_hook = """
    this.ctx = new AudioCtx();

    // Instrument AudioContext for telemetry
    const origCreateOsc = this.ctx.createOscillator.bind(this.ctx);
    this.ctx.createOscillator = () => {
      const node = origCreateOsc();
      AudioTelemetry.trackVoiceStart(node);
      return node;
    };
    
    const origCreateBufferSource = this.ctx.createBufferSource.bind(this.ctx);
    this.ctx.createBufferSource = () => {
      const node = origCreateBufferSource();
      AudioTelemetry.trackVoiceStart(node);
      return node;
    };
    
    // Start Event Loop lag tracker
    const loopTracker = () => {
      AudioTelemetry.updateEventLoop();
      requestAnimationFrame(loopTracker);
    };
    requestAnimationFrame(loopTracker);
"""
content = content.replace("this.ctx = new AudioCtx();", init_hook)

# Now fix getEngineDiagnostics
diag_replacement = """  public getEngineDiagnostics() {
    const memory = (window.performance as any)?.memory;
    const heapMb = memory ? memory.usedJSHeapSize / (1024 * 1024) : 0;
    const ringStats = this.ringBuffer.getStats();

    return {
      cpuLoadPercent: parseFloat(AudioTelemetry.eventLoopLag.toFixed(1)), // Repurposed for lag
      memoryHeapMb: parseFloat(heapMb.toFixed(1)),
      contextState: this.ctx ? this.ctx.state : 'uninitialized',
      sampleRate: this.ctx ? this.ctx.sampleRate : 48000,
      baseLatencyMs: this.ctx ? parseFloat(((this.ctx.baseLatency || 0) * 1000).toFixed(2)) : 0,
      ringBufferStats: ringStats,
      bufferHealthPercent: Math.max(0, Math.min(100, Math.round(100 - (ringStats.underruns * 2)))),
      activeVoices: AudioTelemetry.activeVoices,
      allocationsPerSec: AudioTelemetry.getAllocationsPerSec(),
      scheduledLateness: parseFloat(AudioTelemetry.scheduledLateness.toFixed(2)),
      maxLateness: parseFloat(AudioTelemetry.maxLateness.toFixed(2)),
      sidechainGainReductionDb: parseFloat(this.currentSidechainGainReductionDb.toFixed(1)),
      isRecording: this.isRecording,
      isPlaying: this.isPlaying,
    };
  }"""

old_diag = re.search(r"  public getEngineDiagnostics\(\) \{.*?\n  \}", content, re.DOTALL)
if old_diag:
    content = content.replace(old_diag.group(0), diag_replacement)

# Track scheduled lateness in stepAudio
step_audio = re.search(r"private stepAudio\(time: number\) \{", content)
if step_audio:
    content = content.replace(
        "private stepAudio(time: number) {",
        "private stepAudio(time: number) {\n    const lateness = Math.max(0, this.ctx!.currentTime - time) * 1000;\n    AudioTelemetry.scheduledLateness = lateness;\n    AudioTelemetry.maxLateness = Math.max(AudioTelemetry.maxLateness, lateness);"
    )

with open("src/audio/engine.ts", "w") as f:
    f.write(content)

