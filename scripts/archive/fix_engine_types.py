import re

with open("src/audio/engine.ts", "r") as f:
    content = f.read()

# Fix playMetronomeClick
content = content.replace(
    "public playMetronomeClick(isHighAccent: boolean = false) {",
    "public playMetronomeClick(isHighAccent: boolean = false, time?: number) {"
)
content = content.replace(
    "const now = time;",
    "const now = time !== undefined ? time : this.ctx.currentTime;"
)

with open("src/audio/engine.ts", "w") as f:
    f.write(content)

with open("src/audio/pluginEngine.ts", "r") as f:
    content = f.read()

# Fix ArrayBuffer issue
content = content.replace(
    "shaper.curve = this.getSaturationCurve(drive);",
    "shaper.curve = this.getSaturationCurve(drive) as any;"
)

with open("src/audio/pluginEngine.ts", "w") as f:
    f.write(content)

