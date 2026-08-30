import React, { useState, useEffect, useCallback } from 'react';
import { Track, StemTrack, TrackSettings, RecordedTake } from '../../types';
import { transportBridge } from '../../audio/transportBridge';
import { ArrangementTimeline } from './ArrangementTimeline';
import { DSPVisualizer } from '../dsp/DSPVisualizer';
import { AssetBrowser } from '../audio/AssetBrowser';
import { AIGenerators } from '../audio/AIGenerators';
import { StudioConsole } from '../audio/StudioConsole';
import { StemLane } from '../audio/StemLane';
import { ParameterAutomationControls } from '../audio/ParameterAutomationControls';

import { useAgentAudit } from '../../hooks/useAgentAudit';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { soundEngine } from '../../audio/engine';
import { useToast } from '../ui/toaster';
import { smartBounceProject } from '../../audio/offlineBounce';
import {
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Mic,
  Plus,
  Play,
  RotateCcw,
  Check,
  Activity,
  Layers,
  Scissors,
  Bookmark,
  Download,
  Loader2,
  Undo,
  Redo,
  Save,
  Keyboard,
} from 'lucide-react';

interface StudioViewProps {
  track: Track;
  isPlaying: boolean;
  onUpdateTrackSettings: (settingsPatch: Partial<TrackSettings>, stems?: StemTrack[]) => void;
  onOpenRecording: () => void;
  onNavigate: (view: string) => void;
}

export const StudioView: React.FC<StudioViewProps> = ({
  track,
  isPlaying,
  onUpdateTrackSettings,
  onOpenRecording,
  onNavigate,
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const { auditMessage, clearAudit } = useAgentAudit(isPlaying, track);

  const [selectedStemId, setSelectedStemId] = useState<string>(track.stems[0]?.id || 'stem-1');
  const [isBouncing, setIsBouncing] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Use custom undo/redo hook
  const {
    state: trackState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo(track, { maxHistory: 50 });

  useEffect(() => {
    return transportBridge.subscribe('STEP_TICK', (state) => {
      setCurrentStep(state.currentStep);
    });
  }, []);

  // Use custom keyboard shortcuts hook
  useKeyboardShortcuts([
    {
      key: 'z',
      ctrlKey: true,
      callback: () => {
        const previousState = undo();
        if (previousState) {
          onUpdateTrackSettings(previousState.settings, previousState.stems);
        }
      },
      description: 'Undo',
    },
    {
      key: 'y',
      ctrlKey: true,
      callback: () => {
        const nextState = redo();
        if (nextState) {
          onUpdateTrackSettings(nextState.settings, nextState.stems);
        }
      },
      description: 'Redo',
    },
    {
      key: 's',
      ctrlKey: true,
      callback: () => {
        console.log('Saving track state...');
        // This would call an API to persist the track
      },
      description: 'Save',
    },
    {
      key: '?',
      callback: () => setShowShortcuts(!showShortcuts),
      description: 'Toggle Shortcuts',
    },
  ]);

  const handleSave = useCallback(() => {
    console.log('Saving track state...');
    // This would call an API to persist the track
  }, []);

  const handleSmartBounce = async () => {
    setIsBouncing(true);
    try {
      const wavBlob = await smartBounceProject(track);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.title.replace(/\s+/g, '_')}_SmartBounce.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast({
        type: 'error',
        title: 'Smart Bounce failed',
        description: 'Could not render the mix. Please try again.',
      });
    } finally {
      setIsBouncing(false);
    }
  };

  // Multi-track Stem Controls
  const handleToggleMute = (stemId: string) => {
    const updated = track.stems.map((s) => (s.id === stemId ? { ...s, muted: !s.muted } : s));
    const newTrack = { ...track, stems: updated };
    pushState(newTrack);
    onUpdateTrackSettings(track.settings, updated);
  };

  const handleToggleSolo = (stemId: string) => {
    const target = track.stems.find((s) => s.id === stemId);
    const newSoloState = !target?.solo;
    const updated = track.stems.map((s) => (s.id === stemId ? { ...s, solo: newSoloState } : s));
    const newTrack = { ...track, stems: updated };
    pushState(newTrack);
    onUpdateTrackSettings(track.settings, updated);
  };

  const handleStemVolume = (stemId: string, vol: number) => {
    const updated = track.stems.map((s) => (s.id === stemId ? { ...s, volume: vol } : s));
    const newTrack = { ...track, stems: updated };
    pushState(newTrack);
    onUpdateTrackSettings(track.settings, updated);
  };

  const handleStemPan = (stemId: string, pan: number) => {
    const updated = track.stems.map((s) => (s.id === stemId ? { ...s, pan } : s));
    const newTrack = { ...track, stems: updated };
    pushState(newTrack);
    onUpdateTrackSettings(track.settings, updated);
  };

  const activeStem = track.stems.find((s) => s.id === selectedStemId) || track.stems[0];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const payload = JSON.parse(data);
        if (payload.type === 'elevenlabs_asset') {
          // Add new stem from this asset
          const newStem: StemTrack = {
            id: `stem-${Date.now()}`,
            name: payload.name || 'Generated Asset',
            type: 'audio',
            volume: 0.8,
            pan: 0,
            muted: false,
            solo: false,
            color: '#34d399', // emerald-400
            audioBlobUrl: payload.assetUrl,
            waveformSeed: Math.random(),
          };

          const updatedTrack = {
            ...track,
            stems: [...track.stems, newStem],
            history: [
              {
                id: `evt-${Date.now()}`,
                timestamp: new Date().toISOString(),
                agent: 'Producer',
                action: 'Imported Asset',
                details: `Imported generated asset to timeline.`,
              },
              ...track.history,
            ],
          };
          onUpdateTrackSettings(track.settings, [...track.stems, newStem]);
        }
      }
    } catch (err) {
      console.warn('Drop error', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4" onDragOver={handleDragOver} onDrop={handleDrop}>
          {/* Studio Top Control Strip */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>DAW Multi-Track Timeline</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                {track.stems.length} STEM LANES • 44.1kHz 24-BIT
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Undo/Redo Controls */}
              <div className="flex items-center gap-1 border-r border-neutral-700 pr-2 mr-1">
                <button
                  onClick={() => {
                    const previousState = undo();
                    if (previousState) {
                      onUpdateTrackSettings(previousState.settings, previousState.stems);
                    }
                  }}
                  disabled={!canUndo}
                  className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const nextState = redo();
                    if (nextState) {
                      onUpdateTrackSettings(nextState.settings, nextState.stems);
                    }
                  }}
                  disabled={!canRedo}
                  className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleSave}
                  className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                  title="Save (Ctrl+S)"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                title="Keyboard Shortcuts (?)"
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleSmartBounce}
                disabled={isBouncing}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBouncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isBouncing ? 'BOUNCING...' : 'SMART BOUNCE'}</span>
              </button>

              <button
                onClick={onOpenRecording}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>RECORD VOCAL TAKE</span>
              </button>

              <button
                onClick={() => onNavigate('mixer')}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>CHANNEL RACK</span>
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts Modal */}
          {showShortcuts && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowShortcuts(false)}
            >
              <div
                className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-amber-400" />
                    Keyboard Shortcuts
                  </h3>
                  <button
                    onClick={() => setShowShortcuts(false)}
                    className="text-neutral-400 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Undo</span>
                    <kbd className="px-2 py-1 bg-neutral-950 rounded text-neutral-300 font-mono">
                      Ctrl+Z
                    </kbd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Redo</span>
                    <kbd className="px-2 py-1 bg-neutral-950 rounded text-neutral-300 font-mono">
                      Ctrl+Y
                    </kbd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Save</span>
                    <kbd className="px-2 py-1 bg-neutral-950 rounded text-neutral-300 font-mono">
                      Ctrl+S
                    </kbd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Play/Pause</span>
                    <kbd className="px-2 py-1 bg-neutral-950 rounded text-neutral-300 font-mono">
                      Space
                    </kbd>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-neutral-400">Toggle Shortcuts</span>
                    <kbd className="px-2 py-1 bg-neutral-950 rounded text-neutral-300 font-mono">
                      ?
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Ruler & Marker Strip */}
          <div className="bg-neutral-950 border border-neutral-850 rounded-t-xl px-4 py-2 flex items-center justify-between text-[10px] font-mono text-neutral-500">
            <div className="w-64">TRACK / CHANNEL</div>
            <div className="flex-1 flex justify-between px-4 border-l border-neutral-850">
              <span>01 INTRO</span>
              <span>05 MAIN GROOVE</span>
              <span>09 VERSE 1</span>
              <span>13 CHORUS / HOOK</span>
              <span>17 LOG DRUM DROP</span>
              <span>21 OUTRO</span>
            </div>
          </div>

          {/* Multi-Track Stem Lanes */}
          <div className="space-y-2">
            {track.stems.map((stem, idx) => {
              const isSelected = stem.id === selectedStemId;
              return (
                <StemLane
                  key={stem.id}
                  stem={stem}
                  idx={idx}
                  isSelected={isSelected}
                  isPlaying={isPlaying}
                  currentStep={currentStep}
                  onSelect={setSelectedStemId}
                  onToggleMute={handleToggleMute}
                  onToggleSolo={handleToggleSolo}
                  onVolumeChange={handleStemVolume}
                />
              );
            })}
          </div>

          {/* Parameter Automation Controls */}
          <ParameterAutomationControls
            trackId={track.id}
            onParameterUpdate={(parameter, value) => {
              // Map parameter to TrackSettings
              const settingsPatch: Partial<TrackSettings> = {};
              if (parameter === 'eq.low') settingsPatch.eq = { ...track.settings.eq, low: value };
              if (parameter === 'eq.mid') settingsPatch.eq = { ...track.settings.eq, mid: value };
              if (parameter === 'eq.high') settingsPatch.eq = { ...track.settings.eq, high: value };
              if (parameter === 'volume') settingsPatch.volume = value;
              onUpdateTrackSettings(settingsPatch);
            }}
            parameters={[
              { id: 'eq.low', name: 'EQ Low', min: -12, max: 12, value: track.settings.eq.low },
              { id: 'eq.mid', name: 'EQ Mid', min: -12, max: 12, value: track.settings.eq.mid },
              { id: 'eq.high', name: 'EQ High', min: -12, max: 12, value: track.settings.eq.high },
              { id: 'volume', name: 'Volume', min: 0, max: 1, value: track.settings.volume },
            ]}
          />

          {/* Recorded Vocal Takes Section */}
          {track.takes && track.takes.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-bold text-neutral-200 uppercase flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-red-400" />
                  <span>RECORDED TAKE REPOSITORY ({track.takes.length})</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {track.takes.map((take) => (
                  <div
                    key={take.id}
                    className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-neutral-100 block">{take.label}</span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {(take.durationMs / 1000).toFixed(1)}s •{' '}
                        {new Date(take.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {take.blobUrl && (
                      <audio controls src={take.blobUrl} className="h-7 w-28 accent-amber-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="h-[600px] lg:h-auto space-y-4">
          <AssetBrowser projectId={track.id} />
          <AIGenerators projectId={track.id} />
        </div>
      </div>
    </div>
  );
};
