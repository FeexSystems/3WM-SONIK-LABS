import React from 'react';
import { LayoutDashboard, Layers, Music, Mic, Sparkles, FolderKanban } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onToggleAgentPanel?: () => void;
  isAgentPanelOpen?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onToggleAgentPanel,
  isAgentPanelOpen,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'beatlab', label: 'Beat Lab', icon: Layers },
    { id: 'studio', label: 'Studio', icon: Music },
    { id: 'recording', label: 'Booth', icon: Mic },
    { id: 'council', label: 'The Three', icon: Sparkles, isAgentToggle: true },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0d0d0d]/95 backdrop-blur-2xl border-t border-white/10 px-3 py-2 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.8)] pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.isAgentToggle ? isAgentPanelOpen : currentView === tab.id;

        return (
          <button
            key={tab.id}
            aria-label={tab.label}
            aria-pressed={isActive}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              if (tab.isAgentToggle && onToggleAgentPanel) {
                onToggleAgentPanel();
              } else {
                onNavigate(tab.id);
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isActive
                ? 'text-[#f5a800] bg-white/5 font-bold scale-105'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {tab.isAgentToggle && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#f5a800] animate-pulse" />
              )}
            </div>
            <span className="font-mono text-[9px] uppercase tracking-wider">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
