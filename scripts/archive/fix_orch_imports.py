import re

with open("src/agents/Orchestrator.ts", "r") as f:
    content = f.read()

if "import { worldState }" not in content:
    content = "import { worldState } from './WorldState';\n" + content

if "import { memoryBank }" not in content:
    content = "import { memoryBank } from './MemoryBank';\n" + content

with open("src/agents/Orchestrator.ts", "w") as f:
    f.write(content)
