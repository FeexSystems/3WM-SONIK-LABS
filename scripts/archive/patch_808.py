import re

with open("src/audio/pluginEngine.ts", "r") as f:
    content = f.read()

# Add resetGlide
if "public resetGlide" not in content:
    content = content.replace(
        "public trigger808Note(",
        "public resetGlide() {\n    this.lastPitch = null;\n    this.lastNoteTime = 0;\n  }\n\n  public trigger808Note("
    )

# Implement 808 choke / voice stealing
old_trigger = """    // Check if portamento/glide should take effect
    const isGlide = params.legato && this.lastPitch !== null && now - this.lastNoteTime < 0.6;"""

new_trigger = """    // Voice Choking: fade out previous note to avoid muddy bass overlap
    if (this.activeGain) {
      try {
        this.activeGain.gain.cancelScheduledValues(now);
        this.activeGain.gain.setTargetAtTime(0, now, 0.015);
      } catch (e) {}
    }

    // Check if portamento/glide should take effect
    const isGlide = params.legato && this.lastPitch !== null && now - this.lastNoteTime < 0.6;"""
content = content.replace(old_trigger, new_trigger)

old_cleanup = """    osc.start(now);
    subOsc.start(now);
    const stopTime = now + durationSec + release + 0.05;
    osc.stop(stopTime);
    subOsc.stop(stopTime);
    
    // Clean up graph to prevent memory leaks and cracking
    osc.onended = () => {
      osc.disconnect();
      subOsc.disconnect();
      filter.disconnect();
      shaper.disconnect();
      gain.disconnect();
    };

    this.lastPitch = targetPitch;
    this.lastNoteTime = now;"""

new_cleanup = """    osc.start(now);
    subOsc.start(now);
    const stopTime = now + durationSec + release + 0.05;
    osc.stop(stopTime);
    subOsc.stop(stopTime);
    
    this.activeGain = gain;
    
    // Clean up graph to prevent memory leaks and cracking
    osc.onended = () => {
      osc.disconnect();
      subOsc.disconnect();
      filter.disconnect();
      shaper.disconnect();
      gain.disconnect();
      if (this.activeGain === gain) this.activeGain = null;
    };

    this.lastPitch = targetPitch;
    this.lastNoteTime = now;"""
content = content.replace(old_cleanup, new_cleanup)

with open("src/audio/pluginEngine.ts", "w") as f:
    f.write(content)

