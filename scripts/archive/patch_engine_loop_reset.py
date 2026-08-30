import re

with open("src/audio/engine.ts", "r") as f:
    content = f.read()

# find stepAudio and inject resetGlide
old_step_audio = """  private stepAudio(time: number) {
    const lateness = Math.max(0, this.ctx!.currentTime - time) * 1000;
    AudioTelemetry.scheduledLateness = lateness;
    AudioTelemetry.maxLateness = Math.max(AudioTelemetry.maxLateness, lateness);
    const bar = Math.floor(this.currentStep / 16) + 1;
    const beat = (Math.floor(this.currentStep / 4) % 4) + 1;"""

new_step_audio = """  private stepAudio(time: number) {
    const lateness = Math.max(0, this.ctx!.currentTime - time) * 1000;
    AudioTelemetry.scheduledLateness = lateness;
    AudioTelemetry.maxLateness = Math.max(AudioTelemetry.maxLateness, lateness);
    const bar = Math.floor(this.currentStep / 16) + 1;
    const beat = (Math.floor(this.currentStep / 4) % 4) + 1;
    
    // Explicitly reset 808 glide state at loop boundaries
    if (this.currentStep === 0) {
      sonik808Engine.resetGlide();
    }"""
content = content.replace(old_step_audio, new_step_audio)

with open("src/audio/engine.ts", "w") as f:
    f.write(content)

