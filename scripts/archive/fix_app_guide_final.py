with open("src/App.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "onOpenGuide={() => setIsGuideOpen(true)}" in line:
        continue # clear them all
    if "onToggleAgentPanel={() => setIsAgentPanelOpen(!isAgentPanelOpen)}" in line:
        new_lines.append(line)
        # Check if we are inside Sidebar (look back a few lines)
        if any("<Sidebar" in l for l in new_lines[-20:]):
            new_lines.append("        onOpenGuide={() => setIsGuideOpen(true)}\n")
    else:
        new_lines.append(line)

# Let's be safer: just manually rebuild that specific section if the above is tricky.
# I will use a simple regex again but target the exact blocks.

import re

with open("src/App.tsx", "r") as f:
    content = f.read()
    
# Remove all onOpenGuides first
content = re.sub(r"\s*onOpenGuide=\{\(\) => setIsGuideOpen\(true\)\}", "", content)

# Now specifically add it only after onToggleAgentPanel inside Sidebar block
sidebar_regex = r"(<Sidebar[\s\S]*?onToggleAgentPanel=\{\(\) => setIsAgentPanelOpen\(!isAgentPanelOpen\)\})"
content = re.sub(sidebar_regex, r"\1\n        onOpenGuide={() => setIsGuideOpen(true)}", content)

with open("src/App.tsx", "w") as f:
    f.write(content)

