import React, { useState, useEffect } from 'react';
import { Sun, Moon, Sparkles, Monitor } from 'lucide-react';
import { themeManager, StudioThemeMode, STUDIO_THEMES } from '../../services/themeManager';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [currentMode, setCurrentMode] = useState<StudioThemeMode>(themeManager.getActiveMode());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsub = themeManager.subscribe((mode) => setCurrentMode(mode));
    return () => unsub();
  }, []);

  const handleSelectMode = (mode: StudioThemeMode) => {
    themeManager.setThemeMode(mode);
    setIsOpen(false);
  };

  const getIcon = (mode: StudioThemeMode) => {
    switch (mode) {
      case 'studio-light':
      case 'midnight-light':
        return <Sun className="h-3.5 w-3.5 text-amber-400" />;
      case 'midnight':
        return <Sparkles className="h-3.5 w-3.5 text-[#FF3C00]" />;
      case 'dark':
      default:
        return <Moon className="h-3.5 w-3.5 text-[#F5A800]" />;
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs font-mono text-[#C9C9D4] backdrop-blur-md transition hover:border-[#F5A800]/40 hover:text-white"
        title="Switch Studio Theme"
      >
        {getIcon(currentMode)}
        <span className="hidden sm:inline capitalize text-[11px]">
          {currentMode === 'studio-light' ? 'Light' : currentMode}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-44 rounded-2xl border border-white/10 bg-[#14100C]/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            {STUDIO_THEMES.map((theme) => {
              const isSelected = currentMode === theme.mode;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelectMode(theme.mode)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-sans transition ${
                    isSelected
                      ? 'bg-white/10 font-bold text-white shadow-sm'
                      : 'text-[#C9C9D4]/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getIcon(theme.mode)}
                    <span>{theme.name}</span>
                  </div>
                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-[#F5A800]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;
