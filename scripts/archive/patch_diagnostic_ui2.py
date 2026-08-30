import re

with open("src/components/audio/AudioEngineDiagnosticOverlay.tsx", "r") as f:
    content = f.read()

# Fix the Event Loop Lag UI
content = content.replace("DSP CPU LOAD", "EVENT LOOP LAG")
content = content.replace("{diag.cpuLoadPercent}", "{diag.cpuLoadPercent.toFixed(1)}")
content = content.replace("<span className=\"text-sm font-normal text-neutral-400\">%</span>", "<span className=\"text-sm font-normal text-neutral-400\">ms</span>")
content = content.replace("getCpuStatusColor(diag.cpuLoadPercent)", "getCpuStatusColor(diag.cpuLoadPercent * 5)") # scaling
content = content.replace("diag.cpuLoadPercent > 60", "diag.cpuLoadPercent > 16")
content = content.replace("diag.cpuLoadPercent > 70 ? 'bg-red-500' : diag.cpuLoadPercent > 40 ? 'bg-amber-400' : 'bg-emerald-400'", "diag.cpuLoadPercent > 16 ? 'bg-red-500' : diag.cpuLoadPercent > 8 ? 'bg-amber-400' : 'bg-emerald-400'")

# Let's add Scheduled Lateness and Allocations per Sec somewhere.
# Wait, let's just replace some existing generic stats.
# Search for Active Voices
old_voices = """            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-bold text-neutral-300">Active Voices</span>
              <span className="text-xl font-black font-mono text-white">{diag.activeVoices}</span>
            </div>"""

new_voices = """            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-xs font-bold text-neutral-300">Active Voices</span>
              <span className="text-xl font-black font-mono text-white">{diag.activeVoices}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-xs font-bold text-neutral-300">Max Lateness</span>
              <span className="text-xl font-black font-mono text-amber-400">{(diag as any).maxLateness}ms</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
              <span className="text-xs font-bold text-neutral-300">Allocations/sec</span>
              <span className="text-xl font-black font-mono text-emerald-400">{(diag as any).allocationsPerSec}</span>
            </div>"""

if "Active Voices" in content:
    content = content.replace(old_voices, new_voices)
    
with open("src/components/audio/AudioEngineDiagnosticOverlay.tsx", "w") as f:
    f.write(content)

