import re

with open("src/components/views/SettingsView.tsx", "r") as f:
    content = f.read()

# Delete JSX from <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl"> ... for local vault ... up to User workspace identity
content = re.sub(r"\{\/\* -------------------------------------------------------------\n\s*2\. LOCAL BROWSER VAULT.*?\{\/\* -------------------------------------------------------------\n\s*3\. USER & WORKSPACE IDENTITY", r"{/* -------------------------------------------------------------\n          3. USER & WORKSPACE IDENTITY", content, flags=re.DOTALL)

with open("src/components/views/SettingsView.tsx", "w") as f:
    f.write(content)
