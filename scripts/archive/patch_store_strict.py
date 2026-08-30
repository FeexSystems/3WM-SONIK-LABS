import re

with open("src/services/projectStore.ts", "r") as f:
    content = f.read()

bad_block = """        // Always ensure IndexedDB has an updated serialized copy every 30s
        try {
          await indexedDbVault.saveAutoSaveSnapshot(this.currentProject);
          this.lastIndexedDbSavedAt = new Date().toISOString();
        } catch (e) {
          console.warn('Periodic IndexedDB save error:', e);
        }"""
content = content.replace(bad_block, "")

with open("src/services/projectStore.ts", "w") as f:
    f.write(content)
