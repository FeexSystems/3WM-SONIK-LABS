import re

with open("src/services/projectStore.ts", "r") as f:
    content = f.read()

# Imports
content = re.sub(r"import \{ indexedDbVault \} from '\./indexedDbVault';\n", "", content)

# Properties
content = re.sub(r"  private lastIndexedDbSavedAt: string \| null = null;\n", "", content)
content = re.sub(r"  public getLastIndexedDbSave\(\): string \| null \{\n    return this.lastIndexedDbSavedAt;\n  \}\n\n", "", content)

# Initialization IndexedDB call
old_init = """    // Trigger initial IndexedDB cache
    indexedDbVault.saveAutoSaveSnapshot(this.currentProject).then(() => {
      this.lastIndexedDbSavedAt = new Date().toISOString();
    }).catch((err) => console.warn('Initial IndexedDB snapshot failed:', err));"""
content = content.replace(old_init, "")

# loadLocalRecovery inside loadProject
old_load = """  public loadProject(track: Track) {
    // Check if we have a newer local recovery cache
    const cached = this.loadLocalRecovery(track.id);
    if (cached && new Date(cached.updatedAt || cached.createdAt) > new Date(track.updatedAt || track.createdAt)) {
      this.currentProject = cached;
    } else {
      this.currentProject = track;
    }"""
new_load = """  public loadProject(track: Track) {
    this.currentProject = track;"""
content = content.replace(old_load, new_load)

# In updateProject, remove saveLocalRecovery
content = re.sub(r"    this\.saveLocalRecovery\(this\.currentProject\);\n", "", content)

# In auto-save, remove indexedDB save
old_auto_save = """    try {
      // 1. Save to IndexedDB Vault immediately (Resilient against crashes)
      await indexedDbVault.saveAutoSaveSnapshot(this.currentProject);
      this.lastIndexedDbSavedAt = new Date().toISOString();

      // 2. Save track settings and metadata to backend API"""
new_auto_save = """    try {
      // Save track settings and metadata to backend API"""
content = content.replace(old_auto_save, new_auto_save)

# Auto-save error log
content = content.replace("console.warn('Auto-save to backend had error, saved safely to IndexedDB & LocalStorage:', err);", "console.warn('Auto-save to backend had error:', err);")

# startPeriodicSafetyCheck indexedDb save
old_safety = """      if (this.currentProject) {
        // Always ensure IndexedDB has an updated serialized copy every 30s
        try {
          await indexedDbVault.saveAutoSaveSnapshot(this.currentProject);
          this.lastIndexedDbSavedAt = new Date().toISOString();
        } catch (e) {
          console.warn('Periodic IndexedDB save error:', e);
        }
        if (this.isDirty) {"""
new_safety = """      if (this.currentProject) {
        if (this.isDirty) {"""
content = content.replace(old_safety, new_safety)

# Delete loadLocalRecovery and saveLocalRecovery
content = re.sub(r"  // -------------------------------------------------------------\n  // Local Recovery Cache Storage\n  // -------------------------------------------------------------\n  private saveLocalRecovery\(project: Track\) \{.*?\n  \}\n\n  private loadLocalRecovery\(projectId: string\): Track \| null \{.*?\n  \}\n", "", content, flags=re.DOTALL)

# Delete saveVersions and refactor getVersions
content = re.sub(r"  private saveVersions\(projectId: string, versions: ProjectVersion\[\]\) \{.*?\n  \}\n", "", content, flags=re.DOTALL)

old_get_versions = """  public getVersions(projectId: string): ProjectVersion[] {
    try {
      const data = localStorage.getItem(`${LOCAL_STORAGE_VERSIONS_PREFIX}${projectId}`);
      if (data) return JSON.parse(data);
    } catch (e) {
      // Fallback
    }"""
new_get_versions = """  public getVersions(projectId: string): ProjectVersion[] {
    if (this.currentProject && this.currentProject.id === projectId && this.currentProject.versions) {
       return this.currentProject.versions;
    }"""
content = content.replace(old_get_versions, new_get_versions)

# Remove saveVersions calls
content = re.sub(r"    this\.saveVersions\(this\.currentProject\.id, updatedVersions\);\n", "", content)

# Remove unused LOCAL_STORAGE variables
content = re.sub(r"const LOCAL_STORAGE_KEY_PREFIX = '3wm_sonik_project_';\n", "", content)
content = re.sub(r"const LOCAL_STORAGE_VERSIONS_PREFIX = '3wm_sonik_versions_';\n", "", content)


with open("src/services/projectStore.ts", "w") as f:
    f.write(content)

