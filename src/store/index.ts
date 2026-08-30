import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Track state
interface TrackState {
  currentTrack: any | null;
  tracks: any[];
  setCurrentTrack: (track: any) => void;
  addTrack: (track: any) => void;
  updateTrack: (id: string, updates: Partial<any>) => void;
  deleteTrack: (id: string) => void;
}

export const useTrackStore = create<TrackState>()(
  devtools(
    persist(
      (set) => ({
        currentTrack: null,
        tracks: [],
        setCurrentTrack: (track) => set({ currentTrack: track }),
        addTrack: (track) => set((state) => ({ tracks: [...state.tracks, track] })),
        updateTrack: (id, updates) =>
          set((state) => ({
            tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
            currentTrack:
              state.currentTrack?.id === id
                ? { ...state.currentTrack, ...updates }
                : state.currentTrack,
          })),
        deleteTrack: (id) =>
          set((state) => ({
            tracks: state.tracks.filter((t) => t.id !== id),
            currentTrack: state.currentTrack?.id === id ? null : state.currentTrack,
          })),
      }),
      { name: '3wm-track-storage' }
    )
  )
);

// UI state
interface UIState {
  sidebarOpen: boolean;
  theme: 'dark' | 'midnight' | 'studio-light';
  selectedView: string;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'dark' | 'midnight' | 'studio-light') => void;
  setSelectedView: (view: string) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        theme: 'dark',
        selectedView: 'studio',
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setTheme: (theme) => set({ theme }),
        setSelectedView: (view) => set({ selectedView: view }),
      }),
      { name: '3wm-ui-storage' }
    )
  )
);

// Audio state
interface AudioState {
  isPlaying: boolean;
  bpm: number;
  volume: number;
  currentStep: number;
  setIsPlaying: (playing: boolean) => void;
  setBpm: (bpm: number) => void;
  setVolume: (volume: number) => void;
  setCurrentStep: (step: number) => void;
  togglePlay: () => void;
}

export const useAudioStore = create<AudioState>()(
  devtools(
    (set, get) => ({
      isPlaying: false,
      bpm: 120,
      volume: 0.8,
      currentStep: 0,
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setBpm: (bpm) => set({ bpm }),
      setVolume: (volume) => set({ volume }),
      setCurrentStep: (step) => set({ currentStep: step }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    }),
    { name: '3wm-audio-storage' }
  )
);

// Agent state
interface AgentState {
  activeAgent: string | null;
  agentHistory: Array<{ agent: string; action: string; timestamp: string }>;
  setActiveAgent: (agent: string | null) => void;
  addAgentAction: (agent: string, action: string) => void;
  clearHistory: () => void;
}

export const useAgentStore = create<AgentState>()(
  devtools(
    (set) => ({
      activeAgent: null,
      agentHistory: [],
      setActiveAgent: (agent) => set({ activeAgent: agent }),
      addAgentAction: (agent, action) =>
        set((state) => ({
          agentHistory: [
            ...state.agentHistory,
            { agent, action, timestamp: new Date().toISOString() },
          ],
        })),
      clearHistory: () => set({ agentHistory: [] }),
    }),
    { name: '3wm-agent-storage' }
  )
);
