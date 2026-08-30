import re

with open('src/components/agents/AgentPanel.tsx', 'r') as f:
    text = f.read()

text = text.replace("currentTrack.vocals !== undefined", "currentTrack.stems?.some(s => s.name.toLowerCase().includes('vocal')) || false")

with open('src/components/agents/AgentPanel.tsx', 'w') as f:
    f.write(text)
