import re

with open("src/services/projectStore.ts", "r") as f:
    content = f.read()

content = re.sub(r"    this\.saveLocalRecovery\(updated\);\n", "", content)

old_safety = """        // Always ensure IndexedDB has an updated serialized copy every 30s
        try {
          await indexedDbVault.saveAutoSaveSnapshot(this.currentProject);
          this.lastIndexedDbSavedAt = new Date().toISOString();
        } catch (e) {
          console.warn('Periodic IndexedDB save error:', e);
        }
        if (this.isDirty) {"""
new_safety = """        if (this.isDirty) {"""
content = content.replace(old_safety, new_safety)

with open("src/services/projectStore.ts", "w") as f:
    f.write(content)
