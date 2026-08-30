import re

with open("src/agents/Orchestrator.ts", "r") as f:
    content = f.read()

if "import { memoryBank } from './MemoryBank';" not in content:
    content = content.replace("import { worldState } from './WorldState';", "import { worldState } from './WorldState';\nimport { memoryBank } from './MemoryBank';")

# Hook memory bank into dispatchUserIntent
dispatch_regex = r"(public async dispatchUserIntent[^{]+\{)"
replacement = r"\1\n    const relevantMemories = await memoryBank.querySemanticMemory(intent);\n    if (relevantMemories.length > 0) {\n      worldState.logActivity('ThreeWMOrchestrator', `[Memory Context Retrieved]: ${relevantMemories[0].content}`);\n    }\n"
content = re.sub(dispatch_regex, replacement, content)

with open("src/agents/Orchestrator.ts", "w") as f:
    f.write(content)

