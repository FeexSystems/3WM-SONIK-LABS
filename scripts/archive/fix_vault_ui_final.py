import re

with open("src/components/views/SettingsView.tsx", "r") as f:
    content = f.read()

# I will find the exact index of "IndexedDB Local Crash-Prevention Vault"
idx = content.find("IndexedDB Local Crash-Prevention Vault")
if idx != -1:
    # Find the nearest preceding <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
    start_idx = content.rfind('<div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">', 0, idx)
    
    # Find the next {/* -------------------------------------------------------------
    end_idx = content.find('{/* -------------------------------------------------------------\n          3. USER & WORKSPACE IDENTITY', idx)
    
    if start_idx != -1 and end_idx != -1:
        content = content[:start_idx] + content[end_idx:]

with open("src/components/views/SettingsView.tsx", "w") as f:
    f.write(content)
