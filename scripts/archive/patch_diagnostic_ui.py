import re

with open("src/components/audio/AudioEngineDiagnosticOverlay.tsx", "r") as f:
    content = f.read()

new_stress = """  // Real Audio Node Load Harness
  const handleRunStressTest = () => {
    setStressTesting(true);
    const ctx = (soundEngine as any).ctx as AudioContext | undefined;
    if (ctx) {
      const now = ctx.currentTime;
      // Schedule 1000 overlapping nodes over the next 1 second
      for (let i = 0; i < 1000; i++) {
        const time = now + (i * 0.001);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 100 + (Math.random() * 500);
        gain.gain.value = 0.0001; // Silent so it doesn't blow out speakers
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.1);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      }
    }
    setTimeout(() => {
      setStressTesting(false);
    }, 1200);
  };"""

old_stress = re.search(r"  // Ring Buffer Stress Test Trigger.*?\n  \};", content, re.DOTALL)
if old_stress:
    content = content.replace(old_stress.group(0), new_stress)
    
# Fix typescript issues
content = content.replace("export const AudioEngineDiagnosticOverlay: React.FC<AudioEngineDiagnosticOverlayProps> = ({", "import { soundEngine } from '../../audio/engine';\n\nexport const AudioEngineDiagnosticOverlay: React.FC<AudioEngineDiagnosticOverlayProps> = ({")
# (Assuming soundEngine is already imported, let's check)

with open("src/components/audio/AudioEngineDiagnosticOverlay.tsx", "w") as f:
    f.write(content)

