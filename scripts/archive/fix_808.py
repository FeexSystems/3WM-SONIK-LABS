import re

with open("src/audio/pluginEngine.ts", "r") as f:
    content = f.read()

# Let's replace the wave shaper creation to use a cached curve
cache_code = """
  // Saturation curve cache
  private static cachedCurve: Float32Array | null = null;
  private static cachedDrive: number | null = null;

  private getSaturationCurve(drive: number): Float32Array {
    if (Sonik808Synthesizer.cachedCurve && Sonik808Synthesizer.cachedDrive === drive) {
      return Sonik808Synthesizer.cachedCurve;
    }
    const k = drive * 30 + 1;
    const n = 4096; // Reduced from 44100 for better performance
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    Sonik808Synthesizer.cachedCurve = curve;
    Sonik808Synthesizer.cachedDrive = drive;
    return curve;
  }
"""

if "cachedCurve" not in content:
    content = content.replace(
        "private masterDrive: number = 0.42;",
        "private masterDrive: number = 0.42;\n" + cache_code
    )

old_shaper_logic = """    // Saturation curve for 808
    const k = drive * 30 + 1;
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    shaper.curve = curve;
    shaper.oversample = '4x';"""

new_shaper_logic = """    // Apply cached saturation curve
    shaper.curve = this.getSaturationCurve(drive);
    shaper.oversample = 'none'; // Reduced from 4x to none to prevent CPU/latency overload on rapid triggers"""

content = content.replace(old_shaper_logic, new_shaper_logic)

# Also let's clean up nodes on stop
old_stop_logic = """    osc.start(now);
    subOsc.start(now);
    osc.stop(now + durationSec + release + 0.05);
    subOsc.stop(now + durationSec + release + 0.05);

    this.lastPitch = targetPitch;
    this.lastNoteTime = now;"""

new_stop_logic = """    osc.start(now);
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

content = content.replace(old_stop_logic, new_stop_logic)

with open("src/audio/pluginEngine.ts", "w") as f:
    f.write(content)

