import re

with open("src/audio/engine.ts", "r") as f:
    content = f.read()

content = content.replace("ringBufferStats: ringStats,", "recordingBufferStats: ringStats,")
with open("src/audio/engine.ts", "w") as f:
    f.write(content)

with open("src/components/audio/AudioEngineDiagnosticOverlay.tsx", "r") as f:
    content = f.read()
    
content = content.replace("diag.ringBufferStats", "diag.recordingBufferStats")
content = content.replace("Ring Buffer Health", "Recording Buffer Health")
content = content.replace("RUN BUFFER TEST", "RUN NODE ALLOC TEST")

with open("src/components/audio/AudioEngineDiagnosticOverlay.tsx", "w") as f:
    f.write(content)
