import re

with open('src/App.tsx', 'r') as f:
    text = f.read()

# The user's App.tsx currently has 3 duplicate handleKeyDown useEffects around lines 103, 136, 169.
# Let's find all of them and replace with a clean initialization block and ONE handleKeyDown block.

# First, find the start of the first useEffect:
start_idx = text.find("  useEffect(() => {\n    const handleKeyDown = (e: KeyboardEvent) => {")

if start_idx != -1:
    # Find the end of the 3rd one. We can just use regex to remove them.
    # The block ends before `// 2. Playback Lifecycle`
    end_idx = text.find("  // 2. Playback Lifecycle")
    
    if end_idx != -1:
        replacement = """  // 1. Initial Load of Tracks & projectStore sync
  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch('/api/tracks');
        if (res.ok) {
          const data = await res.json();
          setTracks(data);
          if (data && data.length > 0) {
            setCurrentTrack(data[0]);
            projectStore.loadProject(data[0]);
            soundEngine.setBpm(data[0].bpm);
          } else {
            setInLandingMode(true);
          }
        }
      } catch (err) {
        console.error('Failed to load initial tracks:', err);
      }
    }
    loadInitialData();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      
      if (!isInput && e.key === " ") {
        e.preventDefault();
        handleTogglePlay();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        projectStore.performAutoSave();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setIsExportModalOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setIsVersionDrawerOpen((prev) => !prev);
      } else if (!isInput && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        projectStore.undo();
      } else if (!isInput && (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && e.shiftKey) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y"))) {
        e.preventDefault();
        projectStore.redo();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, currentTrack]);

"""
        text = text[:start_idx] + replacement + text[end_idx:]

with open('src/App.tsx', 'w') as f:
    f.write(text)

