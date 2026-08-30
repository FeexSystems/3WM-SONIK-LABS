import React, { useState, useEffect } from 'react';
import { themeManager, STUDIO_THEMES } from '../../services/themeManager';
import { StudioThemeMode } from '../../types';
import { Palette, Check, Moon, Sun, Sparkles } from 'lucide-react';

export const ThemeSelector: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<StudioThemeMode>(() =>
    themeManager.getActiveMode()
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    return themeManager.subscribe((mode) => {
      setCurrentMode(mode);
    });
  }, []);

  const getModeIcon = (mode: StudioThemeMode) => {
    switch (mode) {
      case 'studio-light':
        return <Sun className="w-3.5 h-3.5 text-amber-500" />;
      case 'midnight':
        return <Sparkles className="w-3.5 h-3.5 text-[#FF3C00]" />;
      default:
        return <Moon className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 transition-colors"
        title="Toggle Theme: 3WM Dark / Midnight OLED / Studio Light"
      >
        {getModeIcon(currentMode)}
        <span className="hidden sm:inline text-[11px] font-semibold capitalize">
          {currentMode === 'studio-light' ? 'Light' : currentMode}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 p-2 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl z-50 animate-in fade-in">
            <div className="flex items-center justify-between px-2.5 py-2 border-b border-neutral-800 text-xs font-bold text-neutral-300">
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Studio Lighting & Themes</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 uppercase">{currentMode}</span>
            </div>

            <div className="mt-1.5 space-y-1">
              {STUDIO_THEMES.map((theme) => {
                const isSelected = currentMode === theme.mode;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      themeManager.setMode(theme.mode);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-neutral-900 border border-amber-500/40 text-white font-semibold shadow'
                        : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full border border-black/50 shrink-0"
                        style={{ backgroundColor: theme.accentColor }}
                      />
                      <div>
                        <div className="text-xs font-bold text-neutral-100">{theme.name}</div>
                        <div className="text-[10px] text-neutral-500 line-clamp-1">
                          {theme.description}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
