import re

with open("vite.config.ts", "r") as f:
    content = f.read()

content = content.replace("__dirname", "import.meta.dirname")

with open("vite.config.ts", "w") as f:
    f.write(content)
