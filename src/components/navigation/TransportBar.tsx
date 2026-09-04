import React, { useState, useEffect } from 'react';
import { Track, HistoryState } from '../../types';
import { soundEngine } from '../../audio/engine';
import { transportBridge } from '../../audio/transportBridge';
import { StereoMeter } from '../audio/StereoMeter';
import { SaveIndicator } from '../project/SaveIndicator';
import { ThemeSelector } from '../common/ThemeSelector';
import { projectStore } from '../../services/projectStore';
import { worldState } from '../../agents/WorldState';
import { SonikWorldState } from '../../agents/types';
import {
  Play,
  Pause,
  Square,
  Circle,
  Repeat,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Download,
  History,
  Command,
  Layers,
  Radio,
  Activity,
  Undo2,
  Redo2,
  BrainCircuit,
  Plus,
  Minus,
} from 'lucide-react';

interface TransportBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;

  onOpenRecording: () => void;
  onOpenExport?: () => void;
  onOpenVersions?: () => void;
  onOpenPlugins?: () => void;
  onOpenMidi?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenCommandPalette?: () => void;
  onToggleAgentPanel?: () => void;
  isAgentPanelOpen?: boolean;
  onUpdateTrackSettings?: (settings: any) => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onStop,

  onOpenRecording,
  onOpenExport,
  onOpenVersions,
  onOpenPlugins,
  onOpenMidi,
  onOpenDiagnostics,
  onOpenCommandPalette,
  onToggleAgentPanel,
  isAgentPanelOpen,
  onUpdateTrackSettings,
}) => {
  const [bpm, setBpm] = useState(currentTrack?.bpm || 112);
  const [bpmInput, setBpmInput] = useState(String(currentTrack?.bpm || 112));
  const [isLooping, setIsLooping] = useState(true);
  const [masterVolume, setMasterVolume] = useState(currentTrack?.settings?.volume || 0.85);
  const [localStep, setLocalStep] = useState(0);
  const [showBpmMenu, setShowBpmMenu] = useState(false);
  const [tapFlash, setTapFlash] = useState(false);
  const tapTimesRef = React.useRef<number[]>([]);

  useEffect(() => {
    return transportBridge.subscribe('STEP_TICK', (state) => {
      setLocalStep(state.currentStep);
    });
  }, []);

  const [agentState, setAgentState] = useState(worldState.getState().agentState);

  useEffect(() => {
    return worldState.subscribe((state) => {
      setAgentState(state.agentState);
    });
  }, []);

  // History state for Undo / Redo
  const [historyState, setHistoryState] = useState<HistoryState>(() =>
    projectStore.getHistoryState()
  );

  useEffect(() => {
    return projectStore.subscribeHistory((h) => {
      setHistoryState(h);
    });
  }, []);

  useEffect(() => {
    if (currentTrack?.bpm) {
      setBpm(currentTrack.bpm);
      setBpmInput(String(currentTrack.bpm));
    }
    if (currentTrack?.settings?.volume !== undefined) {
      setMasterVolume(currentTrack.settings.volume);
    }
  }, [currentTrack?.bpm, currentTrack?.settings?.volume]);

  const handleBpmCommit = (rawVal: number) => {
    const val = Math.max(40, Math.min(240, Math.round(rawVal)));
    setBpm(val);
    setBpmInput(String(val));
    soundEngine.setBpm(val);
    if (currentTrack && onUpdateTrackSettings) {
      onUpdateTrackSettings({ ...currentTrack.settings, bpm: val });
    }
  };

  const handleTapTempo = () => {
    const now = Date.now();
    const recentTaps = tapTimesRef.current.filter((t) => now - t < 3000);
    recentTaps.push(now);
    tapTimesRef.current = recentTaps;

    setTapFlash(true);
    setTimeout(() => setTapFlash(false), 150);

    if (recentTaps.length >= 2) {
      const deltas: number[] = [];
      for (let i = 1; i < recentTaps.length; i++) {
        deltas.push(recentTaps[i] - recentTaps[i - 1]);
      }
      const avgMs = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      if (avgMs > 0) {
        const calculatedBpm = Math.round(60000 / avgMs);
        if (calculatedBpm >= 40 && calculatedBpm <= 240) {
          handleBpmCommit(calculatedBpm);
        }
      }
    }
  };

  const handleVolumeChange = (vol: number) => {
    setMasterVolume(vol);
    if (currentTrack) {
      soundEngine.updateDsp({ ...currentTrack.settings, volume: vol });
      if (onUpdateTrackSettings) {
        onUpdateTrackSettings({ volume: vol });
      }
    }
  };

  const handleUndo = () => {
    const success = projectStore.undo();
    if (success && currentTrack) {
      soundEngine.updateDsp(currentTrack.settings);
    }
  };

  const handleRedo = () => {
    const success = projectStore.redo();
    if (success && currentTrack) {
      soundEngine.updateDsp(currentTrack.settings);
    }
  };

  // Convert step to 4-bar measure position display (e.g. 01:03:02)
  const bar = Math.floor(localStep / 16) + 1;
  const beat = (Math.floor(localStep / 4) % 4) + 1;
  const sub = (localStep % 4) + 1;
  const timeDisplay = `0${bar}:0${beat}:0${sub}`;

  return (
    <div className="fixed md:absolute bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 w-max max-w-[96vw] bg-[#080808]/90 backdrop-blur-2xl border border-neutral-800/80 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl flex items-center justify-between gap-3 sm:gap-6 z-40 shadow-2xl shadow-black/90 ring-1 ring-white/5 text-neutral-100 overflow-x-auto scrollbar-none">
      {/* 1. Track Info, Auto-Save Status & Undo/Redo */}
      <div className="flex items-center gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2
              className="text-xs font-bold text-neutral-100 truncate max-w-[150px]"
              title={currentTrack?.title}
            >
              {currentTrack?.title || '3WM Afrofusion Session'}
            </h2>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase font-semibold">
              v{currentTrack?.version || '2.5'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
            <span>{currentTrack?.key || 'F# Minor'}</span>
            <span>•</span>
            <SaveIndicator />
          </div>
        </div>

        {/* Global Undo / Redo Controls */}
        <div className="hidden sm:flex items-center bg-neutral-950 p-0.5 rounded-xl border border-neutral-800 gap-0.5">
          <button
            onClick={handleUndo}
            disabled={!historyState.canUndo}
            className={`p-1.5 rounded-lg text-xs transition ${
              historyState.canUndo
                ? 'text-neutral-200 hover:text-white hover:bg-neutral-850'
                : 'text-neutral-600 cursor-not-allowed'
            }`}
            title={`Undo ${historyState.lastAction ? `"${historyState.lastAction}"` : ''} (Cmd+Z)`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRedo}
            disabled={!historyState.canRedo}
            className={`p-1.5 rounded-lg text-xs transition ${
              historyState.canRedo
                ? 'text-neutral-200 hover:text-white hover:bg-neutral-850'
                : 'text-neutral-600 cursor-not-allowed'
            }`}
            title="Redo Action (Cmd+Shift+Z / Cmd+Y)"
            aria-label="Redo Action (Cmd+Shift+Z / Cmd+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Master Transport Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Playhead Time Counter */}
        <div className="bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800 text-center font-mono">
          <span className="text-[8px] text-neutral-500 block leading-tight font-sans">
            BAR : BEAT
          </span>
          <span className="text-xs sm:text-sm font-bold text-amber-400 tracking-wider">
            {isPlaying ? timeDisplay : '01:01:01'}
          </span>
        </div>

        {/* Transport Buttons */}
        <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 gap-1">
          <button
            onClick={onStop}
            className="p-2 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition"
            title="Stop Playback"
            aria-label="Stop Playback"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            className={`p-2 sm:p-2.5 rounded-lg transition font-bold ${
              isPlaying
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'
            }`}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded-lg text-xs font-mono transition ${
              isLooping
                ? 'bg-neutral-800 text-amber-400'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
            title="Toggle Loop"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* BPM Input & Tap Tempo */}
        <div className="relative flex items-center bg-neutral-950 px-2 py-1 rounded-xl border border-neutral-800 gap-1">
          <button
            onClick={() => setShowBpmMenu(!showBpmMenu)}
            className="text-[10px] font-mono text-neutral-400 font-bold hover:text-amber-400 transition cursor-pointer select-none px-1 rounded hover:bg-neutral-800"
            title="Genre Tempo Presets"
          >
            BPM
          </button>
          <button
            onClick={() => handleBpmCommit(bpm - 1)}
            className="p-0.5 rounded text-neutral-500 hover:text-amber-400 hover:bg-neutral-800 transition"
            title="Decrease Tempo (-1)"
          >
            <Minus className="w-3 h-3" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={bpmInput}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setBpmInput(val);
              const parsed = parseInt(val, 10);
              if (!isNaN(parsed) && parsed >= 40 && parsed <= 240) {
                handleBpmCommit(parsed);
              }
            }}
            onBlur={() => {
              const parsed = parseInt(bpmInput, 10);
              handleBpmCommit(isNaN(parsed) ? bpm : parsed);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const parsed = parseInt(bpmInput, 10);
                handleBpmCommit(isNaN(parsed) ? bpm : parsed);
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-9 bg-transparent text-xs font-bold font-mono text-amber-400 text-center focus:outline-none focus:bg-neutral-900 rounded px-0.5"
            title="Double-click or type to edit BPM"
          />
          <button
            onClick={() => handleBpmCommit(bpm + 1)}
            className="p-0.5 rounded text-neutral-500 hover:text-amber-400 hover:bg-neutral-800 transition"
            title="Increase Tempo (+1)"
          >
            <Plus className="w-3 h-3" />
          </button>

          {/* Tap Tempo Button */}
          <button
            onClick={handleTapTempo}
            className={`px-1.5 py-0.5 ml-0.5 text-[9px] font-mono font-bold rounded transition tracking-wider ${
              tapFlash
                ? 'bg-amber-400 text-neutral-950 shadow-sm shadow-amber-400/50 scale-105'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 border border-neutral-800'
            }`}
            title="Tap repeatedly in rhythm to set BPM"
          >
            TAP
          </button>

          {/* Quick BPM Genre Presets Dropdown */}
          {showBpmMenu && (
            <div className="absolute bottom-full mb-2 left-0 w-44 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 text-left">
              <div className="text-[9px] font-mono text-neutral-500 uppercase px-2 py-1 tracking-wider border-b border-neutral-900 mb-1">
                Tempo Presets
              </div>
              {[
                { label: 'Afrobeat Warmth', value: 100 },
                { label: 'Amapiano Groove', value: 112 },
                { label: 'Afropop / Dance', value: 120 },
                { label: 'UK / NY Drill', value: 140 },
                { label: 'Trap Bounce', value: 150 },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => {
                    handleBpmCommit(p.value);
                    setShowBpmMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-mono transition ${
                    bpm === p.value
                      ? 'bg-amber-400/10 text-amber-400 font-bold'
                      : 'hover:bg-neutral-900 text-neutral-300'
                  }`}
                >
                  <span className="text-[11px] font-sans">{p.label}</span>
                  <span className="font-bold text-amber-400">{p.value}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Stereo Metering & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* THREEWM COUNCIL STATUS */}
        <div className="hidden xl:flex items-center gap-3 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
          <span className="text-amber-500 text-xs">🔱</span>
          <span className="text-[10px] font-display text-neutral-400 tracking-widest uppercase border-r border-neutral-800 pr-3">
            THREEWM COUNCIL
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${agentState.kappachino_emar !== 'IDLE' ? 'bg-emar animate-pulse' : 'bg-neutral-700'}`}
              />
              <span
                className={`text-[9px] font-mono uppercase ${agentState.kappachino_emar !== 'IDLE' ? 'text-emar' : 'text-neutral-500'}`}
              >
                EMAR:{' '}
                {agentState.kappachino_emar === 'IDLE' ? 'STANDBY' : agentState.kappachino_emar}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${agentState.kappachino_ricky !== 'IDLE' ? 'bg-ricky animate-pulse' : 'bg-neutral-700'}`}
              />
              <span
                className={`text-[9px] font-mono uppercase ${agentState.kappachino_ricky !== 'IDLE' ? 'text-ricky' : 'text-neutral-500'}`}
              >
                RICKY:{' '}
                {agentState.kappachino_ricky === 'IDLE' ? 'STANDBY' : agentState.kappachino_ricky}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${agentState.kingpin !== 'IDLE' ? 'bg-kingpin animate-pulse' : 'bg-neutral-700'}`}
              />
              <span
                className={`text-[9px] font-mono uppercase ${agentState.kingpin !== 'IDLE' ? 'text-kingpin' : 'text-neutral-500'}`}
              >
                KINGPIN: {agentState.kingpin === 'IDLE' ? 'STANDBY' : agentState.kingpin}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Stereo VU Metering */}
        <div className="hidden md:block">
          <StereoMeter isPlaying={isPlaying} />
        </div>

        {/* Master Volume Slider */}
        <div className="hidden lg:flex items-center gap-2 bg-neutral-950 px-2.5 py-1 rounded-xl border border-neutral-800">
          <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-14 accent-amber-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
          />
          <span className="text-[10px] font-mono text-neutral-400 w-6">
            {Math.round(masterVolume * 100)}
          </span>
        </div>

        {/* MIDI Hardware Map Button */}
        {onOpenMidi && (
          <button
            onClick={onOpenMidi}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-cyan-400 rounded-xl border border-cyan-500/30 text-xs font-semibold transition-colors"
            title="MIDI Hardware Controller Mapping"
            aria-label="MIDI Hardware Controller Mapping"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden md:inline">MIDI</span>
          </button>
        )}

        {/* Engine Diagnostics Button */}
        {onOpenDiagnostics && (
          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-amber-400 rounded-xl border border-amber-500/30 text-xs font-semibold transition-colors"
            title="Audio Engine DSP Diagnostics"
            aria-label="Audio Engine DSP Diagnostics"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Plugins / 808 Lab */}
        {onOpenPlugins && (
          <button
            onClick={onOpenPlugins}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 rounded-xl border border-amber-500/30 text-xs font-mono font-bold transition shadow-sm"
            title="Open 3WM SONIK Plugin Rack"
            aria-label="Open 3WM SONIK Plugin Rack"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">RACK</span>
          </button>
        )}

        {/* Version History Button */}
        {onOpenVersions && (
          <button
            onClick={onOpenVersions}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded-xl border border-neutral-800 text-xs font-semibold transition-colors"
            title="Version History & Non-Destructive Rollback"
            aria-label="Version History & Non-Destructive Rollback"
          >
            <History className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Export Action */}
        {onOpenExport && (
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black rounded-xl text-xs font-bold shadow-md shadow-amber-400/20 transition-all"
            title="Export Server WAV (24-bit 48kHz)"
            aria-label="Export Server WAV (24-bit 48kHz)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">BOUNCE</span>
          </button>
        )}

        {/* Command Palette Toggle */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="p-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Command Palette (Cmd+K)"
            aria-label="Command Palette (Cmd+K)"
          >
            <Command className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Studio Theme Switcher */}
        <ThemeSelector />

        {/* Agent Panel Toggle Button */}
        {onToggleAgentPanel && (
          <button
            onClick={onToggleAgentPanel}
            className={`p-1.5 rounded-xl border transition-colors ${
              isAgentPanelOpen
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Toggle 3WM Agent Console"
            aria-label="Toggle 3WM Agent Console"
          >
            <BrainCircuit className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
