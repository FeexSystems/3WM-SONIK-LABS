import re

with open("src/audio/engine.ts", "r") as f:
    content = f.read()

# Fix playKick
content = re.sub(
    r"(osc\.start\(time\);\n\s*osc\.stop\(time \+ [\d\.]+\);)",
    r"\1\n    osc.onended = () => {\n      osc.disconnect();\n      gain.disconnect();\n    };",
    content
)

# Wait, does the same pattern apply to playRimshot, playShaker, playConga, playLogDrum, playHornStab, playSynthPad?
# They all create osc/gain.

with open("src/audio/engine.ts", "w") as f:
    f.write(content)
