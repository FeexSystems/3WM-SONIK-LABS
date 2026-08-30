import re

with open("src/App.tsx", "r") as f:
    content = f.read()

if "import { initYjsCollaboration } from './collaboration/yjsSetup';" not in content:
    content = content.replace("import { initMultiplayer } from './collaboration/socket';", "import { initMultiplayer } from './collaboration/socket';\nimport { initYjsCollaboration } from './collaboration/yjsSetup';")

old_init = "initMultiplayer();"
new_init = "initMultiplayer();\n      initYjsCollaboration();"
if "initYjsCollaboration();" not in content:
    content = content.replace(old_init, new_init)

with open("src/App.tsx", "w") as f:
    f.write(content)

