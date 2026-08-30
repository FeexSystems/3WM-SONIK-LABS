import React, { useState, useEffect } from 'react';
import {
  Command,
  Search,
  Music,
  Sliders,
  Gauge,
  Sparkles,
  Globe2,
  Radio,
  Mic,
  FolderOpen,
  CreditCard,
  Settings,
  X,
  ArrowRight,
  Play,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onRunAiCommand: (prompt: string) => void;
  onOpenNewProject: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onRunAiCommand,
  onOpenNewProject,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    {
      label: 'Open Audio Studio DAW',
      category: 'Navigation',
      icon: Music,
      action: () => {
        onNavigate('studio');
        onClose();
      },
    },
    {
      label: 'Record New Vocal Take',
      category: 'Audio Tools',
      icon: Mic,
      action: () => {
        onNavigate('recording');
        onClose();
      },
    },
    {
      label: 'Open Mixer & FX Rack',
      category: 'Audio Tools',
      icon: Sliders,
      action: () => {
        onNavigate('mixer');
        onClose();
      },
    },
    {
      label: 'Apply Ozone 11 Mastering (Lagos Bounce)',
      category: 'Mastering',
      icon: Gauge,
      action: () => {
        onNavigate('mastering');
        onClose();
      },
    },
    {
      label: 'Enter 3D Artist World & Studio',
      category: '3D World',
      icon: Globe2,
      action: () => {
        onNavigate('artist_world');
        onClose();
      },
    },
    {
      label: 'Open Creator Feed',
      category: 'Community',
      icon: Radio,
      action: () => {
        onNavigate('homefeed');
        onClose();
      },
    },
    {
      label: 'Create New 3WM Session',
      category: 'Projects',
      icon: FolderOpen,
      action: () => {
        onOpenNewProject();
        onClose();
      },
    },
    {
      label: 'Ask BushBot for Mix Cleanup',
      category: 'AI Sonic',
      icon: Sparkles,
      action: () => {
        onNavigate('ai_sonic');
        onRunAiCommand('Clean up low-mid frequency mud and punch up the log drums');
        onClose();
      },
    },
    {
      label: 'View SaaS Usage & Plan Entitlements',
      category: 'Billing',
      icon: CreditCard,
      action: () => {
        onNavigate('usage_billing');
        onClose();
      },
    },
  ];

  const filtered = quickActions.filter(
    (a) =>
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-start justify-center pt-24 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-none w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Bar */}
        <div className="p-3 border-b border-neutral-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, studio tool, or AI prompt..."
            className="w-full bg-transparent text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
          />
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-800 text-left transition group text-xs text-neutral-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-amber-400 group-hover:border-amber-500/40">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-100 block">{item.label}</span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-amber-400 transition transform group-hover:translate-x-0.5" />
                </button>
              );
            })
          ) : query.trim() ? (
            <button
              onClick={() => {
                onNavigate('ai_sonic');
                onRunAiCommand(query);
                onClose();
              }}
              className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left flex items-center justify-between text-xs text-amber-400 hover:bg-amber-500/20 transition"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Execute AI command: "{query}"</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-500">
          <span>NAVIGATION & AI COMMAND DISPATCHER</span>
          <div className="flex items-center gap-2">
            <span>ESC to close</span>
            <span>↵ to select</span>
          </div>
        </div>
      </div>
    </div>
  );
};
