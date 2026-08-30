import re

with open("src/components/views/SettingsView.tsx", "r") as f:
    content = f.read()

# Fix leftover save vault
content = re.sub(r"  const handleManualVaultBackup = async \(\) => \{.*?\n  \};\n\n", "", content, flags=re.DOTALL)

# Delete vault UI
start_str = "{/* -------------------------------------------------------------\n          2. LOCAL BROWSER VAULT (INDEXEDDB)"
end_str = "{/* -------------------------------------------------------------\n          3. USER & WORKSPACE IDENTITY"

if start_str in content and end_str in content:
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    content = content[:start_idx] + content[end_idx:]

with open("src/components/views/SettingsView.tsx", "w") as f:
    f.write(content)

