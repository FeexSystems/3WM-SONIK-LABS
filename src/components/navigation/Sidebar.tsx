import React from 'react';
import { Workspace, UserProfile } from '../../types';
import {
  LayoutDashboard,
  HelpCircle,
  FolderKanban,
  Music,
  FolderOpen,
  Sparkles,
  Globe2,
  Radio,
  Mic,
  Sliders,
  Gauge,
  Activity,
  Users,
  Share2,
  Bell,
  BarChart3,
  CreditCard,
  Settings,
  Package,
  Layers,
  Zap,
  BrainCircuit,
  ChevronDown,
  Command,
  LogOut,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  workspace: Workspace;
  user: UserProfile;
  onOpenCommandPalette: () => void;
  onToggleAgentPanel?: () => void;
  isAgentPanelOpen?: boolean;
  onOpenGuide?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  workspace,
  user,
  onOpenCommandPalette,
  onToggleAgentPanel,
  isAgentPanelOpen,
  onOpenGuide,
  isMobileOpen = false,
  onCloseMobile,
  onSignOut,
}) => {
  const navSections = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'beatlab', label: 'Beat Lab & MIDI', icon: Layers, badge: 'v2.2' },
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'studio', label: 'Audio Studio', icon: Music },
        { id: 'library', label: 'Library & Stems', icon: FolderOpen },
        { id: 'market_intelligence', label: 'Market Intelligence', icon: TrendingUp, badge: 'NEW' },
        { id: 'ai_sonic', label: 'AI Sonic Console', icon: Sparkles, badge: 'ORACLE' },
        { id: 'artist_world', label: 'Artist World 3D', icon: Globe2, badge: '3D' },
        { id: 'homefeed', label: 'Creator Feed', icon: Radio, badge: 'LIVE' },
      ],
    },
    {
      title: 'AUDIO TOOLS',
      items: [
        { id: 'recording', label: 'Recording Booth', icon: Mic },
        { id: 'mixer', label: 'Mixer Rack', icon: Sliders },
        { id: 'mastering', label: 'Ozone Mastering', icon: Gauge },
        { id: 'visualizer', label: 'Spectrum Visualizer', icon: Activity },
        { id: 'plugin_marketplace', label: 'Plugin Vault', icon: Package, badge: 'DSP' },
      ],
    },
    {
      title: 'COLLABORATION',
      items: [
        { id: 'collaboration', label: 'Team & Presence', icon: Users },
        { id: 'activity', label: 'Studio Activity', icon: Bell },
      ],
    },
    {
      title: 'ACCOUNT & SAAS',
      items: [
        { id: 'profile', label: 'Artist Profile', icon: Users },
        { id: 'usage_billing', label: 'Usage & Plans', icon: CreditCard, badge: workspace.plan },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <aside className="w-64 bg-neutral-950 border-r border-neutral-850 flex flex-col justify-between shrink-0 h-full select-none">
      {/* Top Brand & Workspace Header */}
      <div className="p-5 border-b border-neutral-850 bg-gradient-to-b from-neutral-900/50 to-transparent">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="text-amber-500 text-xl filter drop-shadow-[0_0_8px_rgba(245,168,0,0.5)]">
              🔱
            </div>
            <div>
              <h1 className="font-display text-2xl text-neutral-100 tracking-wider flex items-center gap-1.5 leading-none">
                <span>3WM SONIK</span>
              </h1>
              <p className="text-[9px] text-neutral-500 font-mono tracking-widest uppercase mt-0.5">
                Studio Operating System
              </p>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              aria-label="Close menu"
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </button>
          )}
        </div>

        {/* Workspace Switcher Pill */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-2.5 flex items-center justify-between hover:border-neutral-700 hover:bg-neutral-900 transition cursor-pointer group shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-neutral-950 border border-neutral-800 flex items-center justify-center text-xs font-bold font-display tracking-widest text-neutral-300 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-colors">
              WS
            </div>
            <div>
              <span className="text-xs font-bold text-neutral-200 block truncate max-w-[110px]">
                {workspace.name}
              </span>
              <span className="text-[9px] font-mono text-amber-500 block">
                {workspace.plan} TIER
              </span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-neutral-500" />
        </div>

        {/* Quick Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          aria-label="Open command palette"
          className="w-full mt-2.5 py-1.5 px-2.5 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg text-neutral-400 text-xs flex items-center justify-between transition focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <span className="flex items-center gap-1.5 text-[11px]">
            <Command className="w-3.5 h-3.5 text-neutral-500" />
            <span>Search or command...</span>
          </span>
          <kbd className="text-[9px] font-mono bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 text-neutral-400">
            ⌘K
          </kbd>
        </button>

        {/* Quick Agent Panel Toggle Button */}
        <button
          onClick={onToggleAgentPanel}
          aria-label={isAgentPanelOpen ? 'Close agent panel' : 'Open agent panel'}
          aria-pressed={isAgentPanelOpen}
          className={`w-full mt-2 py-1.5 px-2.5 rounded-lg border text-xs flex items-center justify-between transition focus-visible:ring-2 focus-visible:ring-amber-500 ${
            isAgentPanelOpen
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-400'
          }`}
        >
          <span className="flex items-center gap-1.5 text-[11px]">
            <BrainCircuit
              className={`w-3.5 h-3.5 ${isAgentPanelOpen ? 'text-amber-400' : 'text-neutral-500'}`}
            />
            <span className={isAgentPanelOpen ? 'font-bold' : ''}>3WM Agents</span>
          </span>
          <span
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
              isAgentPanelOpen
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-neutral-950 border-neutral-800 text-neutral-500'
            }`}
          >
            {isAgentPanelOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin scrollbar-thumb-neutral-800">
        {navSections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <span className="text-[10px] font-bold font-mono tracking-wider text-neutral-400 px-3 uppercase block">
              {sec.title}
            </span>
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/10'
                      : 'text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-neutral-950' : 'text-neutral-400'}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isActive
                          ? 'bg-neutral-950 text-amber-400'
                          : 'bg-neutral-900 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-neutral-850 bg-neutral-950/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <button
            onClick={() => handleItemClick('profile')}
            className="flex items-center gap-2.5 text-left flex-1 min-w-0 hover:opacity-80 transition"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-neutral-950 font-bold text-xs shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user.name[0] || 'U'
              )}
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-neutral-200 block truncate">{user.name}</span>
              <span className="text-[10px] font-mono text-neutral-500 block truncate">
                {user.email || user.role}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1.5 ml-2">
            <span
              className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20"
              title="Session Active"
            />
            <button
              onClick={onOpenGuide}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-800/80 text-neutral-400 hover:text-amber-400 transition-colors"
              title="Studio Guide"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-800/80 text-neutral-400 hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0 shrink-0">{sidebarContent}</div>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
