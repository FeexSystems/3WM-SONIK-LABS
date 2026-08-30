import re

with open("src/audio/midiEngine.ts", "r") as f:
    content = f.read()

# Replace filter.disconnect() with a safe type-ignored check
content = content.replace(
    "filter.disconnect();",
    "// @ts-ignore\n          if (typeof filter !== 'undefined') filter.disconnect();"
)

with open("src/audio/midiEngine.ts", "w") as f:
    f.write(content)

