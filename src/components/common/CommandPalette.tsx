import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Zap,
  Music,
  Download,
  History,
  Layers,
  Sparkles,
  Sliders,
  Palette,
  Play,
  Square,
  Bot,
  Flame,
  X,
  Keyboard,
} from 'lucide-react';
import { themeManager, STUDIO_THEMES } from '../../services/themeManager';
import { soundEngine } from '../../audio/engine';
import { orchestrator } from '../../agents/Orchestrator';

interface CommandItem {
  id: string;
  category:
    'Navigation' | 'Audio Engine' | 'AI Producer' | 'Project & Export' | 'Themes' | '3WM Agents';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onOpenExport: () => void;
  onOpenVersions: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenExport,
  onOpenVersions,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-beat-lab',
      category: 'Navigation',
      title: 'Open Afrofusion Beat Lab',
      subtitle: 'Piano Roll & 16-Step Drum Sequencer',
      icon: <Layers className="w-4 h-4 text-amber-400" />,
      shortcut: 'G B',
      action: () => onNavigate('beatlab'),
    },
    {
      id: 'nav-studio',
      category: 'Navigation',
      title: 'Open Studio Multitrack Console',
      subtitle: 'Stem mixing, EQ, and channel routing',
      icon: <Music className="w-4 h-4 text-blue-400" />,
      shortcut: 'G S',
      action: () => onNavigate('studio'),
    },
    {
      id: 'nav-soundstage',
      category: 'Navigation',
      title: 'Open 3D Spatial Soundstage',
      subtitle: 'Interactive Three.js binaural positioning',
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      shortcut: 'G 3',
      action: () => onNavigate('soundstage'),
    },
    {
      id: 'nav-mastering',
      category: 'Navigation',
      title: 'Open Ozone 11 & T-RackS Mastering',
      subtitle: 'Loudness normalization & harmonic saturation',
      icon: <Sliders className="w-4 h-4 text-purple-400" />,
      shortcut: 'G M',
      action: () => onNavigate('mastering'),
    },
    {
      id: 'nav-memory',
      category: 'Navigation',
      title: 'Open Vector Memory & Sonic DNA',
      subtitle: 'Browse embedded stylistic references and prompt chains',
      icon: <Flame className="w-4 h-4 text-red-400" />,
      action: () => onNavigate('memory'),
    },
    {
      id: 'nav-agents',
      category: 'Navigation',
      title: 'Open 3WM AI Avatars & Wisdom Council',
      subtitle: 'Interact with Ricky, Emar, and Kingpin personas',
      icon: <Bot className="w-4 h-4 text-amber-400" />,
      action: () => onNavigate('agents'),
    },

    // Audio Engine
    {
      id: 'audio-toggle-play',
      category: 'Audio Engine',
      title: soundEngine.getPlaying() ? 'Stop Transport Playback' : 'Start Transport Playback',
      subtitle: 'Toggle shared master clock (BPM synced)',
      icon: soundEngine.getPlaying() ? (
        <Square className="w-4 h-4 text-red-400" />
      ) : (
        <Play className="w-4 h-4 text-emerald-400" />
      ),
      shortcut: 'Space',
      action: () => {
        if (soundEngine.getPlaying()) {
          soundEngine.stopPlayback();
        } else {
          soundEngine.startPlayback();
        }
      },
    },

    // Project & Export
    {
      id: 'export-server-wav',
      category: 'Project & Export',
      title: 'Export Master Audio (Server WAV)',
      subtitle: '24-bit 48kHz lossless render with quota check',
      icon: <Download className="w-4 h-4 text-amber-400" />,
      shortcut: 'Cmd+E',
      action: onOpenExport,
    },
    {
      id: 'project-versions',
      category: 'Project & Export',
      title: 'Open Version History & Snapshots',
      subtitle: 'Non-destructive rollback timeline',
      icon: <History className="w-4 h-4 text-emerald-400" />,
      shortcut: 'Cmd+H',
      action: onOpenVersions,
    },

    // AI Producer
    {
      id: 'ai-generate-drums',
      category: 'AI Producer',
      title: 'AI Drummer: Lagos Bounce Beat',
      subtitle: 'Generate syncopated kick, rimshot, and shaker grooves',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => {
        onNavigate('beatlab');
      },
    },
    {
      id: 'ai-generate-logdrum',
      category: 'AI Producer',
      title: 'AI Bassist: Amapiano Log Drum Pattern',
      subtitle: 'Generate pitched sub bassline slides',
      icon: <Sparkles className="w-4 h-4 text-blue-400" />,
      action: () => {
        onNavigate('beatlab');
      },
    },

    // 3WM Agents
    {
      id: 'agent-ask-emar',
      category: '3WM Agents',
      title: 'Ask Emar (The Scientist)',
      subtitle: 'Audio Engineering, Mixing, Mastering',
      icon: <Bot className="w-4 h-4 text-emerald-400" />,
      action: () => orchestrator.dispatchUserIntent('Ask Emar for engineering advice'),
    },
    {
      id: 'agent-ask-ricky',
      category: '3WM Agents',
      title: 'Ask Ricky (The Sound God)',
      subtitle: 'Instruments, Drums, 808, Groove',
      icon: <Bot className="w-4 h-4 text-amber-400" />,
      action: () => orchestrator.dispatchUserIntent('Ask Ricky for musical advice'),
    },
    {
      id: 'agent-ask-kingpin',
      category: '3WM Agents',
      title: 'Ask Kingpin (The Vocal Oracle)',
      subtitle: 'Vocals, Harmony, Arrangement',
      icon: <Bot className="w-4 h-4 text-purple-400" />,
      action: () => orchestrator.dispatchUserIntent('Ask Kingpin for vocal advice'),
    },
    {
      id: 'agent-review-project',
      category: '3WM Agents',
      title: 'Review Project (Trinity Review)',
      subtitle: 'Get a full 3WM Scorecard for the current project',
      icon: <Layers className="w-4 h-4 text-white" />,
      action: () => orchestrator.dispatchUserIntent('Review this project'),
    },
    {
      id: 'agent-analyze-mix',
      category: '3WM Agents',
      title: 'Analyze Mix',
      subtitle: 'Emar will analyze the current mix',
      icon: <Sliders className="w-4 h-4 text-emerald-400" />,
      action: () => orchestrator.dispatchUserIntent('Analyze the current mix'),
    },
    {
      id: 'agent-optimize-low-end',
      category: '3WM Agents',
      title: 'Optimize Low End',
      subtitle: 'Emar will optimize kick and 808 relationships',
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      action: () => orchestrator.dispatchUserIntent('Optimize the low end'),
    },
    {
      id: 'agent-generate-beat',
      category: '3WM Agents',
      title: 'Generate Beat',
      subtitle: 'Ricky will generate a new beat pattern',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => orchestrator.dispatchUserIntent('Generate a new beat'),
    },
    {
      id: 'agent-generate-808',
      category: '3WM Agents',
      title: 'Generate 808',
      subtitle: 'Ricky will generate a new 808 pattern',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      action: () => orchestrator.dispatchUserIntent('Generate a new 808 pattern'),
    },
    {
      id: 'agent-build-vocal-stack',
      category: '3WM Agents',
      title: 'Build Vocal Stack',
      subtitle: 'Kingpin will arrange vocal layers and harmonies',
      icon: <Music className="w-4 h-4 text-purple-400" />,
      action: () => orchestrator.dispatchUserIntent('Build a vocal stack for the chorus'),
    },

    // Themes
    ...STUDIO_THEMES.map((theme) => ({
      id: `theme-${theme.id}`,
      category: 'Themes' as const,
      title: `Theme: ${theme.name}`,
      subtitle: theme.description,
      icon: <Palette className="w-4 h-4" style={{ color: theme.accentColor }} />,
      action: () => themeManager.setMode(theme.id as any),
    })),
  ];

  const filteredCommands = commands.filter((cmd) => {
    const searchStr = `${cmd.title} ${cmd.subtitle || ''} ${cmd.category}`.toLowerCase();
    return searchStr.includes(query.toLowerCase());
  });

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length)
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredCommands[selectedIndex];
      if (target) {
        target.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-none bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-800 bg-neutral-900/90">
          <Search className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search (e.g., Beat Lab, Export WAV, AI Drummer)..."
            className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-neutral-500"
            role="searchbox"
            aria-autocomplete="list"
            aria-controls="command-list"
            aria-activedescendant={
              filteredCommands.length > 0 ? `command-${selectedIndex}` : undefined
            }
          />
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
            <span>ESC to close</span>
          </div>
        </div>

        {/* Command Results List */}
        <div
          id="command-list"
          role="listbox"
          className="max-h-96 overflow-y-auto p-2 divide-y divide-neutral-900"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500" role="status">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  id={`command-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-300 hover:bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                      {cmd.icon}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{cmd.title}</div>
                      {cmd.subtitle && (
                        <div className="text-[11px] text-neutral-400">{cmd.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase px-2 py-0.5 rounded bg-neutral-900/80">
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <kbd className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-t border-neutral-800 text-[11px] text-neutral-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>3WM SONIK CORE v2.2</span>
        </div>
      </div>
    </div>
  );
};
