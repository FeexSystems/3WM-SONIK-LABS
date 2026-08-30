import re

with open("src/audio/midiEngine.ts", "r") as f:
    content = f.read()

# For oscillators
content = re.sub(
    r"(osc\.start\(now\);\n\s*osc\.stop\(now \+ [\d\.]+\);)",
    r"\1\n        osc.onended = () => {\n          osc.disconnect();\n          gain.disconnect();\n        };",
    content
)

# For buffer sources
content = re.sub(
    r"(source\.start\(now\);\n\s*source\.stop\(now \+ [\d\.]+\);)",
    r"\1\n        source.onended = () => {\n          source.disconnect();\n          filter.disconnect();\n          gain.disconnect();\n        };",
    content
)

with open("src/audio/midiEngine.ts", "w") as f:
    f.write(content)
