import re

with open("src/audio/engine.ts", "r") as f:
    content = f.read()

# Add scheduler state variables
if "private nextNoteTime: number = 0;" not in content:
    content = content.replace(
        "private currentStep: number = 0;",
        "private currentStep: number = 0;\n  private nextNoteTime: number = 0;\n  private scheduleAheadTime: number = 0.1;"
    )

# Fix setBpm
old_setbpm = """  public setBpm(newBpm: number) {
    this.bpm = Math.max(40, Math.min(240, newBpm));
    transportBridge.setBpm(this.bpm);
    if (this.isPlaying) {
      const stepIntervalMs = (60 / this.bpm / 4) * 1000;
      if (this.timerId) window.clearInterval(this.timerId);
      this.timerId = window.setInterval(() => {
        this.stepAudio();
      }, stepIntervalMs);
    }
  }"""

new_setbpm = """  public setBpm(newBpm: number) {
    this.bpm = Math.max(40, Math.min(240, newBpm));
    transportBridge.setBpm(this.bpm);
  }"""
content = content.replace(old_setbpm, new_setbpm)

# Fix startPlayback
old_start = """    const stepIntervalMs = (60 / this.bpm / 4) * 1000;
    if (this.timerId) window.clearInterval(this.timerId);

    this.timerId = window.setInterval(() => {
      if (!this.isPlaying) return;
      this.stepAudio();
    }, stepIntervalMs);
  }"""

new_start = """    if (this.timerId) window.clearTimeout(this.timerId);
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.scheduler();
  }
  
  private scheduler() {
    if (!this.isPlaying || !this.ctx) return;
    
    // While there are notes that will need to play before the next interval,
    // schedule them and advance the pointer.
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.stepAudio(this.nextNoteTime);
      this.nextNoteTime += (60 / this.bpm / 4); // Advance 16th note
    }
    
    this.timerId = window.setTimeout(() => this.scheduler(), 25);
  }"""
content = content.replace(old_start, new_start)

# We need to change stepAudio to accept a time parameter
content = re.sub(r"private stepAudio\(\) \{", r"private stepAudio(time: number) {", content)

# Update triggerAfrobeatStep call
content = content.replace(
    "this.triggerAfrobeatStep(this.currentStep % 16);",
    "this.triggerAfrobeatStep(this.currentStep % 16, time);"
)

# Replace the ratchet timeout logic. Window.setTimeout is bad. We can just schedule multiple hits!
old_ratchet = """              if (stepData.ratchet && stepData.ratchet > 1) {
                const subInterval = (60 / this.bpm / 4) / stepData.ratchet;
                for (let r = 0; r < stepData.ratchet; r++) {
                  window.setTimeout(() => {
                    midiSynth.playDrumSample(ch.sampleKey, vel, ch.pan);
                  }, r * subInterval * 1000);
                }
              } else {
                midiSynth.playDrumSample(ch.sampleKey, vel, ch.pan);
              }"""

new_ratchet = """              if (stepData.ratchet && stepData.ratchet > 1) {
                const subInterval = (60 / this.bpm / 4) / stepData.ratchet;
                for (let r = 0; r < stepData.ratchet; r++) {
                  midiSynth.playDrumSample(ch.sampleKey, vel, ch.pan, time + (r * subInterval));
                }
              } else {
                midiSynth.playDrumSample(ch.sampleKey, vel, ch.pan, time);
              }"""
content = content.replace(old_ratchet, new_ratchet)

# Route 808 Lab channels to the specialized DSP synthesizer
content = content.replace(
    "sonik808Engine.trigger808Note(pitch, vel, stepDurationSec, params);",
    "sonik808Engine.trigger808Note(pitch, vel, stepDurationSec, params, time);"
)

# Metronome click
content = content.replace(
    "this.playMetronomeClick(this.currentStep % 16 === 0);",
    "this.playMetronomeClick(this.currentStep % 16 === 0, time);"
)

# MIDI Piano Roll playback
old_piano = """        const noteTime = note.time;
        if (noteTime >= startBeats && noteTime < endBeats) {
          const delaySec = (noteTime - startBeats) * (60 / this.bpm);
          window.setTimeout(() => {
            midiSynth.playMidiNote(note.pitch, note.velocity, note.duration, pat.instrumentId);
          }, delaySec * 1000);
        }"""
new_piano = """        const noteTime = note.time;
        if (noteTime >= startBeats && noteTime < endBeats) {
          const delaySec = (noteTime - startBeats) * (60 / this.bpm);
          midiSynth.playMidiNote(note.pitch, note.velocity, note.duration, pat.instrumentId, time + delaySec);
        }"""
content = content.replace(old_piano, new_piano)

# At the end of stepAudio, it increments currentStep. But our scheduler does this!
# We need to remove currentStep increments from stepAudio, or just handle it.
# Wait! In startPlayback, we have:
old_end_step = """    if (this.onStepCallback) {
      this.onStepCallback(this.currentStep, bar, beat);
    }
    
    // Advance step
    this.currentStep = (this.currentStep + 1) % this.loopLengthSteps;"""

new_end_step = """    if (this.onStepCallback) {
      this.onStepCallback(this.currentStep, bar, beat);
    }
    
    // Advance step
    this.currentStep = (this.currentStep + 1) % this.loopLengthSteps;"""
# Keep it in stepAudio because the scheduler calls stepAudio. But wait, scheduler also does this.currentStep++ !
# Ah! I need to ensure it's not double incremented. Let's just remove it from scheduler.

old_sched = """    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.stepAudio(this.nextNoteTime);
      this.nextNoteTime += (60 / this.bpm / 4); // Advance 16th note
    }"""
new_sched = """    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.stepAudio(this.nextNoteTime);
      this.nextNoteTime += (60 / this.bpm / 4); // Advance 16th note
    }"""
# Wait, I didn't add this.currentStep++ to scheduler in the replace script. So we are fine.

# Fix triggerAfrobeatStep signature
content = re.sub(
    r"private triggerAfrobeatStep\(step: number\) \{",
    r"private triggerAfrobeatStep(step: number, time: number) {",
    content
)
# Use the passed `time` instead of `this.ctx.currentTime`
content = re.sub(
    r"const now = this\.ctx\.currentTime;",
    r"const now = time;",
    content
)

# Fix playMetronomeClick signature
content = re.sub(
    r"private playMetronomeClick\(isDownbeat: boolean\) \{",
    r"private playMetronomeClick(isDownbeat: boolean, time: number) {",
    content
)
content = re.sub(
    r"const now = this\.ctx\.currentTime;",
    r"const now = time;",
    content
)

with open("src/audio/engine.ts", "w") as f:
    f.write(content)

