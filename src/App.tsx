import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Music, Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  Track,
  TrackSettings,
  StemTrack,
  Workspace,
  UserProfile,
  RecordedTake,
  SaaSPlan,
  StudioThemeMode,
} from './types';
import { soundEngine } from './audio/engine';
import { UserProfileModal } from './components/views/UserProfileModal';
import { NewTrackModal } from './components/NewTrackModal';
import { ExportConfirmationModal } from './components/export/ExportConfirmationModal';
import { VersionHistoryDrawer } from './components/project/VersionHistoryDrawer';
import { PluginRackModal } from './components/plugins/PluginRackModal';
import { MidiControllerMappingModal } from './components/audio/MidiControllerMappingModal';
import { AudioEngineDiagnosticOverlay } from './components/audio/AudioEngineDiagnosticOverlay';
import { projectStore } from './services/projectStore';

import { AgentPanel } from './components/agents/AgentPanel';
import { CouncilMode } from './agents/councilMode';
import { ViewErrorBoundary } from './components/ViewErrorBoundary';

import { LandingView } from './components/views/LandingView';
import { Sidebar } from './components/navigation/Sidebar';
import { TransportBar } from './components/navigation/TransportBar';
import { MobileBottomNav } from './components/navigation/MobileBottomNav';
import { AppGuide } from './components/common/AppGuide';
import { CommandPalette } from './components/navigation/CommandPalette';
import { themeManager } from './services/themeManager';
import { Menu } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { ToastProvider } from './components/ui/toaster';

import type { FeedPost } from './types/feed';

// Lazy-loaded heavy views — keeps initial bundle lean
const LazyBeatLabView = lazy(() =>
  import('./components/views/BeatLabView').then((m) => ({ default: m.BeatLabView }))
);
const LazyMixerView = lazy(() =>
  import('./components/views/MixerView').then((m) => ({ default: m.MixerView }))
);
const LazyMasteringView = lazy(() =>
  import('./components/views/MasteringView').then((m) => ({ default: m.MasteringView }))
);
const LazyRecordingView = lazy(() =>
  import('./components/views/RecordingView').then((m) => ({ default: m.RecordingView }))
);
const LazyStudioView = lazy(() =>
  import('./components/views/StudioView').then((m) => ({ default: m.StudioView }))
);
const LazyArtistWorld3DView = lazy(() =>
  import('./components/views/ArtistWorld3DView').then((m) => ({ default: m.ArtistWorld3DView }))
);
const LazyHomefeedScreen = lazy(() =>
  import('./components/views/HomefeedScreen').then((m) => ({ default: m.HomefeedScreen }))
);
const LazyCouncilView = lazy(() =>
  import('./components/views/CouncilView').then((m) => ({ default: m.CouncilView }))
);
const LazyPluginMarketplaceView = lazy(() =>
  import('./components/views/PluginMarketplaceView').then((m) => ({
    default: m.PluginMarketplaceView,
  }))
);
const LazyDashboardView = lazy(() =>
  import('./components/views/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const LazyProjectsView = lazy(() =>
  import('./components/views/ProjectsView').then((m) => ({ default: m.ProjectsView }))
);
const LazyAiOracleView = lazy(() =>
  import('./components/views/AiOracleView').then((m) => ({ default: m.AiOracleView }))
);
const LazySpectrumVisualizerView = lazy(() =>
  import('./components/views/SpectrumVisualizerView').then((m) => ({
    default: m.SpectrumVisualizerView,
  }))
);
const LazyLibraryView = lazy(() =>
  import('./components/views/LibraryView').then((m) => ({ default: m.LibraryView }))
);
const LazyMarketIntelligenceHub = lazy(() =>
  import('./components/market-intelligence').then((m) => ({
    default: m.MarketIntelligenceHub,
  }))
);
const LazyCollaborationView = lazy(() =>
  import('./components/views/CollaborationView').then((m) => ({
    default: m.CollaborationView,
  }))
);
const LazyUsageBillingView = lazy(() =>
  import('./components/views/UsageBillingView').then((m) => ({
    default: m.UsageBillingView,
  }))
);
const LazySettingsView = lazy(() =>
  import('./components/views/SettingsView').then((m) => ({ default: m.SettingsView }))
);

// Suspense fallback for lazy-loaded views
const ViewLoader = () => (
  <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-500">
    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
    <span className="text-xs font-mono uppercase tracking-widest">Loading Module...</span>
  </div>
);

// Singleton council instance
const council = new CouncilMode();

// Initial Mock User & Workspace
const initialUser: UserProfile = {
  id: 'usr-3wm-owner',
  name: 'Kappachino Emar',
  email: 'emar@3wm.audio',
  role: 'Artist',
  avatar: '',
  favoriteGenres: ['Afrofusion', 'Amapiano'],
  workflowFocus: ['Recording', 'Mixing', 'Mastering'],
  aiRelationship: 'Engineer',
  onboardingCompleted: true,
};

const initialWorkspace: Workspace = {
  id: 'ws-main',
  name: 'Three Wise Men Studio',
  plan: 'PRO',
  membersCount: 3,
  usage: {
    aiActionsUsed: 14,
    aiActionsLimit: 500,
    masterExportsUsed: 3,
    masterExportsLimit: 50,
    storageUsedGb: 1.4,
    storageLimitGb: 50,
  },
};

const AppContent: React.FC = () => {
  const { user: authUser, profile, openAuthModal, signOutUser } = useAuth();

  // Navigation & Mode
  const [inLandingMode, setInLandingMode] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<string>('beatlab');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isNewTrackModalOpen, setIsNewTrackModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isPluginRackOpen, setIsPluginRackOpen] = useState<boolean>(false);
  const [pluginRackInitialId, setPluginRackInitialId] = useState<string>('808-lab');
  const [isMidiModalOpen, setIsMidiModalOpen] = useState<boolean>(false);
  const [isDiagModalOpen, setIsDiagModalOpen] = useState<boolean>(false);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState<boolean>(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // User & Workspace
  const [user, setUser] = useState<UserProfile>(() => profile || initialUser);
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [themeMode, setThemeMode] = useState<StudioThemeMode>(() => themeManager.getActiveMode());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Sync profile when authenticated user changes
  useEffect(() => {
    if (profile) {
      setUser(profile);
    }
  }, [profile]);

  // Audio State & Tracks
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Sync React State with ProjectStore
  useEffect(() => {
    const unsubscribe = projectStore.subscribeProject((project) => {
      setCurrentTrack(project);
      setTracks((prev) => prev.map((t) => (t.id === project.id ? project : t)));
    });
    return unsubscribe;
  }, []);

  // 1. Initial Load of Tracks & projectStore sync
  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch('/api/tracks');
        const contentType = res.headers.get('content-type') ?? '';
        if (res.ok && contentType.includes('application/json')) {
          const data = (await res.json()) as Track[];
          if (Array.isArray(data) && data.length > 0) {
            const firstTrack = data[0];
            setTracks(data);
            setCurrentTrack(firstTrack);
            projectStore.loadProject(firstTrack);
            await soundEngine.init();
            soundEngine.setBpm(firstTrack.bpm);
            soundEngine.updateDsp(firstTrack.settings);
          } else {
            setInLandingMode(true);
          }
        } else {
          setInLandingMode(true);
        }
      } catch (err) {
        console.warn('Backend API offline, initialized local audio workspace:', err);
        setInLandingMode(true);
      }
    }
    void loadInitialData();
  }, []);

  // 2. Playback Lifecycle
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      soundEngine.stopPlayback();
      setIsPlaying(false);
    } else {
      if (currentTrack) {
        soundEngine.setBpm(currentTrack.bpm);
        soundEngine.updateDsp(currentTrack.settings);
      }
      void soundEngine.startPlayback();
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrack]);

  const handleStop = () => {
    soundEngine.stopPlayback();
    setIsPlaying(false);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (!isInput && e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void projectStore.performAutoSave();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportModalOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsVersionDrawerOpen((prev) => !prev);
      } else if (
        !isInput &&
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === 'z' &&
        !e.shiftKey
      ) {
        e.preventDefault();
        projectStore.undo();
      } else if (
        !isInput &&
        (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && e.shiftKey) ||
          ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y'))
      ) {
        e.preventDefault();
        projectStore.redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay]);

  const handleSelectTrack = (t: Track) => {
    setCurrentTrack(t);
    projectStore.loadProject(t);
    soundEngine.setBpm(t.bpm);
    soundEngine.updateDsp(t.settings);
  };

  const handleUpdateTrackSettings = (
    settingsPatch: Partial<TrackSettings>,
    stems?: StemTrack[]
  ) => {
    if (!currentTrack) return;
    const updated: Track = {
      ...currentTrack,
      settings: {
        ...currentTrack.settings,
        ...settingsPatch,
        eq: { ...currentTrack.settings.eq, ...(settingsPatch.eq ?? {}) },
        compression: { ...currentTrack.settings.compression, ...(settingsPatch.compression ?? {}) },
        reverb: { ...currentTrack.settings.reverb, ...(settingsPatch.reverb ?? {}) },
      },
      stems: stems ?? currentTrack.stems,
    };
    projectStore.updateProject(updated);
    soundEngine.updateDsp(updated.settings);
  };

  const handleAddRecordedTake = (take: RecordedTake) => {
    if (!currentTrack) return;
    const updatedTakes = [...(currentTrack.takes ?? []), take];
    const updated: Track = {
      ...currentTrack,
      takes: updatedTakes,
    };
    setCurrentTrack(updated);
    setTracks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleNavigate = (view: string) => {
    if (view === 'profile') {
      setIsProfileModalOpen(true);
    } else {
      setCurrentView(view);
    }
  };

  const handleForkFeedPost = (post: FeedPost) => {
    if (!currentTrack) {
      setCurrentView('projects');
      return;
    }
    projectStore.createVersion(
      `Feed fork · ${post.authorName}`,
      'BEAT',
      `Reference snapshot from ${post.source.projectId}/${post.source.versionId}; source media unchanged.`
    );
    setCurrentView('studio');
  };

  const handleCreateTrack = async (trackData: Partial<Track>) => {
    let createdTrack: Track | null = null;

    try {
      const res = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackData),
      });
      const contentType = res.headers.get('content-type') ?? '';
      if (res.ok && contentType.includes('application/json')) {
        createdTrack = (await res.json()) as Track;
      }
    } catch (err) {
      console.warn('Backend API offline, initializing project locally:', err);
    }

    if (!createdTrack) {
      const id = `track-${Date.now()}`;
      createdTrack = {
        id,
        title: trackData.title ?? 'Lagos Sonic Session',
        artist: trackData.artist ?? 'Kappachino Producer',
        genre: trackData.genre ?? 'Afrofusion / Amapiano Hybrid',
        bpm: trackData.bpm ?? 112,
        key: trackData.key ?? 'F# Minor',
        duration: 180,
        createdAt: new Date().toISOString(),
        status: 'PRODUCTION',
        stage: 'PRODUCTION',
        version: 1,
        settings: {
          volume: 0.85,
          pan: 0,
          eq: { low: 2.0, mid: 0.0, high: 1.5 },
          compression: { threshold: -18, ratio: 4, attack: 0.01, release: 0.15, makeupGain: 2 },
          reverb: { type: 'shrine', amount: 25, decay: 1.8 },
          mastering: {
            preset: 'Lagos Bounce',
            limiterCeiling: -0.1,
            targetLufs: -14.0,
            warmthSaturation: 65,
            stereoWidth: 1.15,
          },
        },
        stems: [
          {
            id: 'stem-drums',
            name: '808 & Kick Drums',
            type: 'audio',
            volume: 0.9,
            pan: 0,
            muted: false,
            solo: false,
            color: '#F5A800',
            waveformSeed: 1234,
          },
          {
            id: 'stem-log-drum',
            name: 'Amapiano Log Drum',
            type: 'audio',
            volume: 0.95,
            pan: 0,
            muted: false,
            solo: false,
            color: '#F5A800',
            waveformSeed: 5678,
          },
          {
            id: 'stem-chords',
            name: 'Acoustic Rhodes / Keys',
            type: 'instrument',
            volume: 0.75,
            pan: -0.15,
            muted: false,
            solo: false,
            color: '#2AFFA3',
            waveformSeed: 9101,
          },
          {
            id: 'stem-vocals',
            name: 'Lead Vocal Chant',
            type: 'audio',
            volume: 0.85,
            pan: 0.1,
            muted: false,
            solo: false,
            color: '#FF3C00',
            waveformSeed: 1121,
          },
        ],
        history: [],
      };
    }

    const finalTrack = createdTrack;
    setTracks((prev) => [finalTrack, ...prev]);
    setCurrentTrack(finalTrack);
    projectStore.loadProject(finalTrack);
    soundEngine.setBpm(finalTrack.bpm);
    soundEngine.updateDsp(finalTrack.settings);
    setCurrentView('studio');
  };

  const handleUpdatePlan = (newPlan: SaaSPlan) => {
    setWorkspace((prev) => ({
      ...prev,
      plan: newPlan,
      usage: {
        ...prev.usage,
        storageLimitGb: newPlan === 'PRO' ? 50 : newPlan === 'STUDIO' ? 500 : 10,
      },
    }));
  };

  // If in Landing Mode
  if (inLandingMode) {
    return (
      <>
        <LandingView
          onEnterStudio={(_sessionData) => {
            if (authUser) {
              setInLandingMode(false);
            } else {
              openAuthModal('signin');
            }
          }}
          onExploreSonic={() => {
            if (authUser) {
              setInLandingMode(false);
              setCurrentView('artist_world');
            } else {
              openAuthModal('signup');
            }
          }}
        />
        <AuthModal />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex overflow-hidden selection:bg-amber-500 selection:text-neutral-950 font-sans transition-colors duration-300">
      {/* 1. Global Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        workspace={workspace}
        user={user}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isAgentPanelOpen={isAgentPanelOpen}
        onToggleAgentPanel={() => setIsAgentPanelOpen(!isAgentPanelOpen)}
        onOpenGuide={() => setIsGuideOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onSignOut={async () => {
          await signOutUser();
          setInLandingMode(true);
        }}
      />

      {/* 2. Main Studio Content Area */}
      <div className="flex-1 flex h-screen overflow-hidden relative">
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Mobile Top Header */}
          <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-neutral-950 border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-amber-500 hover:bg-neutral-800"
                aria-label="Open Sidebar Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1.5 font-display text-base tracking-wider text-amber-400">
                <span>🔱</span>
                <span>3WM SONIK</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="px-2 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] font-mono uppercase text-neutral-400"
              >
                ⌘K
              </button>
              <button
                onClick={() => setIsAgentPanelOpen(!isAgentPanelOpen)}
                className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold"
              >
                THE THREE
              </button>
            </div>
          </div>

          {/* Global Master Transport Bar */}
          <TransportBar
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onStop={handleStop}
            onOpenRecording={() => setCurrentView('recording')}
            onOpenExport={() => setIsExportModalOpen(true)}
            onOpenVersions={() => setIsVersionDrawerOpen(true)}
            onOpenPlugins={() => {
              setPluginRackInitialId('808-lab');
              setIsPluginRackOpen(true);
            }}
            onOpenMidi={() => setIsMidiModalOpen(true)}
            onOpenDiagnostics={() => setIsDiagModalOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onToggleAgentPanel={() => setIsAgentPanelOpen(!isAgentPanelOpen)}
            isAgentPanelOpen={isAgentPanelOpen}
            onUpdateTrackSettings={handleUpdateTrackSettings}
          />

          {/* Dynamic Viewport */}
          <main className="flex-1 overflow-y-auto bg-neutral-950 pb-20 md:pb-0 scrollbar-thin scrollbar-thumb-neutral-800">
            <ViewErrorBoundary name={currentView}>
              {!currentTrack &&
                ![
                  'dashboard',
                  'projects',
                  'usage_billing',
                  'settings',
                  'artist_world',
                  'plugin_marketplace',
                ].includes(currentView) && (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-4">
                    <Music className="w-12 h-12 opacity-50" />
                    <h2 className="text-xl font-bold text-neutral-300">No Project Loaded</h2>
                    <p className="text-sm max-w-md text-center">
                      Create a new track or select one from the Dashboard.
                    </p>
                    <button
                      onClick={() => setIsNewTrackModalOpen(true)}
                      className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition"
                    >
                      Create New Track
                    </button>
                  </div>
                )}

              {currentView === 'beatlab' && currentTrack && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyBeatLabView
                    track={currentTrack}
                    onUpdateTrack={(updated) => projectStore.updateProject(updated)}
                  />
                </Suspense>
              )}
              {currentView === 'dashboard' && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyDashboardView
                    user={user}
                    workspace={workspace}
                    currentTrack={currentTrack}
                    tracks={tracks}
                    onSelectTrack={handleSelectTrack}
                    onNavigate={handleNavigate}
                    onOpenNewProject={() => setIsNewTrackModalOpen(true)}
                  />
                </Suspense>
              )}
              {currentView === 'projects' && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyProjectsView
                    tracks={tracks}
                    currentTrack={currentTrack}
                    onSelectTrack={handleSelectTrack}
                    onOpenNewProject={() => setIsNewTrackModalOpen(true)}
                    onNavigate={handleNavigate}
                    onOpenExport={() => setIsExportModalOpen(true)}
                  />
                </Suspense>
              )}
              {currentView === 'studio' && currentTrack && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyStudioView
                    track={currentTrack}
                    isPlaying={isPlaying}
                    onUpdateTrackSettings={handleUpdateTrackSettings}
                    onOpenRecording={() => setCurrentView('recording')}
                    onNavigate={handleNavigate}
                  />
                </Suspense>
              )}
              {currentView === 'recording' && currentTrack && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyRecordingView
                    track={currentTrack}
                    onAddTake={handleAddRecordedTake}
                    onNavigate={handleNavigate}
                  />
                </Suspense>
              )}
              {currentView === 'mixer' && currentTrack && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyMixerView
                    track={currentTrack}
                    onUpdateTrackSettings={handleUpdateTrackSettings}
                    isPlaying={isPlaying}
                  />
                </Suspense>
              )}
              {currentView === 'mastering' && currentTrack && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyMasteringView
                    track={currentTrack}
                    isPlaying={isPlaying}
                    onTogglePlay={handleTogglePlay}
                    onUpdateTrackSettings={handleUpdateTrackSettings}
                    onOpenExport={() => setIsExportModalOpen(true)}
                  />
                </Suspense>
              )}
              {currentView === 'ai_sonic' && currentTrack && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyAiOracleView
                    track={currentTrack}
                    onApplySettings={handleUpdateTrackSettings}
                  />
                </Suspense>
              )}
              {currentView === 'council' && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyCouncilView council={council} />
                </Suspense>
              )}
              {currentView === 'artist_world' && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyArtistWorld3DView
                    track={currentTrack ?? undefined}
                    isPlaying={isPlaying}
                    onTogglePlay={handleTogglePlay}
                  />
                </Suspense>
              )}
              {currentView === 'homefeed' && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyHomefeedScreen
                    currentTrack={currentTrack ?? undefined}
                    onForkToStudio={handleForkFeedPost}
                  />
                </Suspense>
              )}
              {currentView === 'visualizer' && (
                <Suspense fallback={<ViewLoader />}>
                  <LazySpectrumVisualizerView
                    isPlaying={isPlaying}
                    onTogglePlay={handleTogglePlay}
                  />
                </Suspense>
              )}
              {currentView === 'plugin_marketplace' && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyPluginMarketplaceView />
                </Suspense>
              )}
              {currentView === 'library' && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyLibraryView
                    tracks={tracks}
                    onSelectTrack={handleSelectTrack}
                    onNavigate={handleNavigate}
                  />
                </Suspense>
              )}
              {currentView === 'market_intelligence' && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyMarketIntelligenceHub />
                </Suspense>
              )}
              {currentView === 'collaboration' && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyCollaborationView workspace={workspace} />
                </Suspense>
              )}
              {currentView === 'usage_billing' && (
                <Suspense fallback={<ViewLoader />}>
                  <LazyUsageBillingView workspace={workspace} onUpdatePlan={handleUpdatePlan} />
                </Suspense>
              )}
              {currentView === 'settings' && (
                <Suspense fallback={<ViewLoader />}>
                  <LazySettingsView
                    user={user}
                    workspace={workspace}
                    themeMode={themeMode}
                    onUpdateUser={(p) => setUser((u) => ({ ...u, ...p }))}
                    onUpdateWorkspace={(w) => setWorkspace((ws) => ({ ...ws, ...w }))}
                    onUpdateTheme={(mode) => {
                      setThemeMode(mode);
                      themeManager.setMode(mode);
                    }}
                  />
                </Suspense>
              )}
            </ViewErrorBoundary>
          </main>
        </div>

        <AppGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

        {/* The Three Wise Men - Agent System Panel */}
        <AgentPanel
          isCollapsed={!isAgentPanelOpen}
          onClose={() => setIsAgentPanelOpen(false)}
          currentTrack={currentTrack}
        />
      </div>

      <NewTrackModal
        isOpen={isNewTrackModalOpen}
        onClose={() => setIsNewTrackModalOpen(false)}
        onCreateTrack={(trackData) => void handleCreateTrack(trackData)}
      />

      {/* 3. Global Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onRunAiCommand={(prompt) => {
          console.warn('Running AI command from palette:', prompt);
        }}
        onOpenNewProject={() => setIsNewTrackModalOpen(true)}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
      />

      {/* 4. Lossless Master & Multi-Track Stems Export Modal */}
      {currentTrack && (
        <ExportConfirmationModal
          track={currentTrack}
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* 5. Plugin Rack Modal */}
      <PluginRackModal
        isOpen={isPluginRackOpen}
        onClose={() => setIsPluginRackOpen(false)}
        initialPluginId={pluginRackInitialId}
      />

      {/* 6. MIDI Controller Mapping Modal */}
      <MidiControllerMappingModal
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
      />

      {/* 7. Audio Engine Diagnostic Overlay */}
      <AudioEngineDiagnosticOverlay
        isOpen={isDiagModalOpen}
        onClose={() => setIsDiagModalOpen(false)}
      />

      {/* 8. Firebase Authentication Modal */}
      <AuthModal />

      {/* Global Version History Drawer */}
      {currentTrack && (
        <VersionHistoryDrawer
          isOpen={isVersionDrawerOpen}
          onClose={() => setIsVersionDrawerOpen(false)}
          track={currentTrack}
          onVersionRestored={(version) => {
            const restoredVersion = projectStore.restoreVersion(version);
            if (restoredVersion) {
              const updatedTrack = projectStore.getCurrentProject();
              if (updatedTrack) {
                setCurrentTrack(updatedTrack);
                setTracks((prev) => prev.map((t) => (t.id === updatedTrack.id ? updatedTrack : t)));
              }
              setIsVersionDrawerOpen(false);
            }
          }}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onToggleAgentPanel={() => setIsAgentPanelOpen(!isAgentPanelOpen)}
        isAgentPanelOpen={isAgentPanelOpen}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
