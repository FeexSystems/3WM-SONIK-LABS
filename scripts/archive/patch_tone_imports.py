import re
import os

files_to_patch = [
    "src/components/views/BeatLabView.tsx",
    "src/components/navigation/TransportBar.tsx",
    "src/App.tsx"
]

for filepath in files_to_patch:
    if not os.path.exists(filepath): continue
    with open(filepath, "r") as f:
        content = f.read()
    
    # Remove import
    content = re.sub(r"import \{ toneEngine \} from '.*ToneEngine';\n", "", content)
    
    # Remove usages
    if filepath == "src/components/views/BeatLabView.tsx":
        content = re.sub(r"toneEngine\.setSequence\(.*?\);\n", "", content)
        content = re.sub(r"toneEngine\.applyDSP\(.*?\);\n", "", content)
    elif filepath == "src/components/navigation/TransportBar.tsx":
        content = re.sub(r"toneEngine\.play\(\);\n", "", content)
        content = re.sub(r"toneEngine\.stop\(\);\n", "", content)
    elif filepath == "src/App.tsx":
        content = re.sub(r"toneEngine\.initialize\(\);\n", "", content)
        
    with open(filepath, "w") as f:
        f.write(content)

