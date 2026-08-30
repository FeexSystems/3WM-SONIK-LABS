import re

with open("src/audio/engine.ts", "r") as f:
    content = f.read()

content = content.replace(
    "public applyAutomation(param: string, value: number) {",
    "public applyAutomation(param: string, value: number, time?: number) {"
)

with open("src/audio/engine.ts", "w") as f:
    f.write(content)

