import re

with open("src/components/views/SettingsView.tsx", "r") as f:
    content = f.read()

# Remove import
content = re.sub(r"import \{ indexedDbVault \} from '\.\./\.\./services/indexedDbVault';\n", "", content)

# Remove vault state variables
content = re.sub(r"  const \[vaultStats, setVaultStats\] = useState<VaultStats \| null>\(null\);\n  const \[vaultSnapshots, setVaultSnapshots\] = useState<VaultBackupRecord\[\]>\(\[\]\);\n  const \[isRefreshingVault, setIsRefreshingVault\] = useState\(false\);\n  const \[vaultMessage, setVaultMessage\] = useState<string \| null>\(null\);\n", "", content)

# Remove loadVaultData
old_load = """  const loadVaultData = async () => {
    setIsRefreshingVault(true);
    try {
      const stats = await indexedDbVault.getVaultStats();
      const all = await indexedDbVault.getAllSnapshots();
      setVaultStats(stats);
      setVaultSnapshots(all.slice(0, 5));
    } catch (err) {
      console.warn('Failed to read IndexedDB statistics:', err);
    } finally {
      setIsRefreshingVault(false);
    }
  };

  useEffect(() => {
    loadVaultData();
  }, []);"""
content = content.replace(old_load, "")

# Remove handleExportVaultJson
old_export = """  const handleExportVaultJson = async () => {
    try {
      const all = await indexedDbVault.getAllSnapshots();
      const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `3wm-sonik-indexeddb-vault-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };"""
content = content.replace(old_export, "")

# Remove the entire JSX block for section 2
content = re.sub(r"      \{\/\* -------------------------------------------------------------\n          2\. LOCAL BROWSER VAULT \(INDEXEDDB\)\n         ------------------------------------------------------------- \*\/\}.*?      \{\/\* -------------------------------------------------------------\n          3\. USER & WORKSPACE IDENTITY\n         ------------------------------------------------------------- \*\/\}", r"      {/* -------------------------------------------------------------\n          3. USER & WORKSPACE IDENTITY\n         ------------------------------------------------------------- */}", content, flags=re.DOTALL)

with open("src/components/views/SettingsView.tsx", "w") as f:
    f.write(content)

