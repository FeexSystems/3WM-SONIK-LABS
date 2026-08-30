import re

with open("src/audio/engine.ts", "r") as f:
    content = f.read()

new_set = """  public setActivePatterns(midiPatterns: MidiPattern[], stepChannels: StepSequencerChannel[]) {
    this.activeMidiPatterns = midiPatterns;
    this.activeStepChannels = stepChannels;
    
    // Derive loop length from active patterns
    let maxSteps = 16;
    stepChannels.forEach(ch => {
      if (ch.steps.length > maxSteps) maxSteps = ch.steps.length;
    });
    midiPatterns.forEach(pat => {
      if (pat.lengthSteps > maxSteps) maxSteps = pat.lengthSteps;
    });
    this.loopLengthSteps = maxSteps;
    
    transportBridge.syncChannels(stepChannels);
    transportBridge.syncPatterns(midiPatterns);
  }"""

old_set = """  public setActivePatterns(midiPatterns: MidiPattern[], stepChannels: StepSequencerChannel[]) {
    this.activeMidiPatterns = midiPatterns;
    this.activeStepChannels = stepChannels;
    transportBridge.syncChannels(stepChannels);
    transportBridge.syncPatterns(midiPatterns);
  }"""
content = content.replace(old_set, new_set)

with open("src/audio/engine.ts", "w") as f:
    f.write(content)
