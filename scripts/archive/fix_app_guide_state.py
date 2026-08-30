import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add state
if "const [isGuideOpen, setIsGuideOpen] = useState(false);" not in content:
    content = content.replace("const [isAgentPanelOpen, setIsAgentPanelOpen] = useState<boolean>(true);", "const [isAgentPanelOpen, setIsAgentPanelOpen] = useState<boolean>(true);\n  const [isGuideOpen, setIsGuideOpen] = useState(false);")

# Find and replace Sidebar's onToggleAgentPanel
content = re.sub(
    r"isAgentPanelOpen=\{isAgentPanelOpen\}\n\s*onToggleAgentPanel=\{\(\) => setIsAgentPanelOpen\(!isAgentPanelOpen\)\}",
    "isAgentPanelOpen={isAgentPanelOpen}\n        onToggleAgentPanel={() => setIsAgentPanelOpen(!isAgentPanelOpen)}\n        onOpenGuide={() => setIsGuideOpen(true)}",
    content
)

# Remove onOpenGuide from TransportBar if it got added there incorrectly
# TransportBar doesn't accept onOpenGuide
transport_bar_pattern = r"(<TransportBar[\s\S]*?)onOpenGuide=\{\(\) => setIsGuideOpen\(true\)\}\s*(isAgentPanelOpen=\{isAgentPanelOpen\}\s*/>)"
content = re.sub(transport_bar_pattern, r"\1\2", content)

with open("src/App.tsx", "w") as f:
    f.write(content)
