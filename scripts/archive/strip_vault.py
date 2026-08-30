import re

with open("src/components/views/SettingsView.tsx", "r") as f:
    content = f.read()

content = re.sub(r"  const handleTriggerManualSnapshot = async \(\) => \{.*?\n  \};\n\n", "", content, flags=re.DOTALL)

start_vault_jsx = "{/* -------------------------------------------------------------\n          2. LOCAL BROWSER VAULT (INDEXEDDB)"
end_vault_jsx = "{/* -------------------------------------------------------------\n          3. USER & WORKSPACE IDENTITY"

if start_vault_jsx in content and end_vault_jsx in content:
    start = content.find(start_vault_jsx)
    end = content.find(end_vault_jsx)
    content = content[:start] + content[end:]

with open("src/components/views/SettingsView.tsx", "w") as f:
    f.write(content)
