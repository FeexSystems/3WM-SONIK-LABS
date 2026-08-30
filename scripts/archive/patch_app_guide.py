import re

with open("src/App.tsx", "r") as f:
    content = f.read()

if "import { AppGuide } from './components/common/AppGuide';" not in content:
    content = content.replace("import { Sidebar } from './components/navigation/Sidebar';", "import { Sidebar } from './components/navigation/Sidebar';\nimport { AppGuide } from './components/common/AppGuide';")

if "const [isGuideOpen, setIsGuideOpen] = useState(false);" not in content:
    content = content.replace("const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);", "const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);\n  const [isGuideOpen, setIsGuideOpen] = useState(false);")

if "onOpenGuide={() => setIsGuideOpen(true)}" not in content:
    content = content.replace("onToggleAgentPanel={() => setIsAgentPanelOpen(!isAgentPanelOpen)}", "onToggleAgentPanel={() => setIsAgentPanelOpen(!isAgentPanelOpen)}\n        onOpenGuide={() => setIsGuideOpen(true)}")

if "<AppGuide" not in content:
    content = content.replace("</main>\n        </div>", "</main>\n        </div>\n\n        <AppGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />")

with open("src/App.tsx", "w") as f:
    f.write(content)
