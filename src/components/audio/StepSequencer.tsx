import React, { useState, useEffect } from 'react';
import { StepSequencerChannel, StepSequencerStep, Eight08Parameters } from '../../types';
import { soundEngine } from '../../audio/engine';
import { sonik808Engine, PLUGIN_REGISTRY } from '../../audio/pluginEngine';
import { SEQUENCER_LOOP_LIBRARY } from '../../audio/loopLibrary';
import {
  Volume2,
  Zap,
  RotateCcw,
  Plus,
  Trash2,
  Sliders,
  Flame,
  Activity,
  Music,
  FolderOpen,
  Play,
  Square,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Disc,
  Layers,
  Settings2,
  X,
  TrendingUp,
} from 'lucide-react';

interface StepSequencerProps {
  channels: StepSequencerChannel[];
  onUpdateChannels: (channels: StepSequencerChannel[]) => void;
  currentPlaybackStep?: number;
  totalSteps?: number;
  onOpen808Lab?: () => void;
}

const PITCH_OPTIONS = [
  { midi: 24, name: 'C0' },
  { midi: 25, name: 'C#0' },
  { midi: 26, name: 'D0' },
  { midi: 27, name: 'D#0' },
  { midi: 28, name: 'E0' },
  { midi: 29, name: 'F0' },
  { midi: 30, name: 'F#0' },
  { midi: 31, name: 'G0' },
  { midi: 32, name: 'G#0' },
  { midi: 33, name: 'A0' },
  { midi: 34, name: 'A#0' },
  { midi: 35, name: 'B0' },
  { midi: 36, name: 'C1' },
  { midi: 37, name: 'C#1' },
  { midi: 38, name: 'D1' },
  { midi: 39, name: 'D#1' },
  { midi: 40, name: 'E1' },
  { midi: 41, name: 'F1' },
  { midi: 42, name: 'F#1' },
  { midi: 43, name: 'G1' },
  { midi: 44, name: 'G#1' },
  { midi: 45, name: 'A1' },
  { midi: 46, name: 'A#1' },
  { midi: 47, name: 'B1' },
  { midi: 48, name: 'C2' },
  { midi: 49, name: 'C#2' },
  { midi: 50, name: 'D2' },
  { midi: 51, name: 'D#2' },
  { midi: 52, name: 'E2' },
  { midi: 53, name: 'F2' },
  { midi: 54, name: 'F#2' },
  { midi: 55, name: 'G2' },
  { midi: 56, name: 'G#2' },
  { midi: 57, name: 'A2' },
  { midi: 58, name: 'A#2' },
  { midi: 59, name: 'B2' },
  { midi: 60, name: 'C3' },
];

export const StepSequencer: React.FC<StepSequencerProps> = ({
  channels,
  onUpdateChannels,
  currentPlaybackStep = 0,
  totalSteps = 16,
  onOpen808Lab,
}) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    channels[0]?.id || null
  );
  const [activeStepEditor, setActiveStepEditor] = useState<{
    channelId: string;
    stepIndex: number;
  } | null>(null);
  const [showLoopLibraryModal, setShowLoopLibraryModal] = useState<boolean>(false);
  const [selectedLoopCategory, setSelectedLoopCategory] = useState<string>('ALL');
  const [auditioningLoopId, setAuditioningLoopId] = useState<string | null>(null);
  const [showDspDrawer, setShowDspDrawer] = useState<boolean>(true);
  const [keyboardFocus, setKeyboardFocus] = useState<{
    channelId: string;
    stepIndex: number;
  } | null>(null);

  const eight08Presets = PLUGIN_REGISTRY['808-lab']?.presets || [];

  // Keyboard navigation for step grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!keyboardFocus) return;

      const { channelId, stepIndex } = keyboardFocus;
      const channelIdx = channels.findIndex((c) => c.id === channelId);

      if (e.key === 'ArrowRight' && stepIndex < totalSteps - 1) {
        setKeyboardFocus({ channelId, stepIndex: stepIndex + 1 });
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' && stepIndex > 0) {
        setKeyboardFocus({ channelId, stepIndex: stepIndex - 1 });
        e.preventDefault();
      } else if (e.key === 'ArrowDown' && channelIdx < channels.length - 1) {
        const nextChannel = channels[channelIdx + 1];
        setKeyboardFocus({ channelId: nextChannel.id, stepIndex });
        e.preventDefault();
      } else if (e.key === 'ArrowUp' && channelIdx > 0) {
        const prevChannel = channels[channelIdx - 1];
        setKeyboardFocus({ channelId: prevChannel.id, stepIndex });
        e.preventDefault();
      } else if (e.key === ' ' || e.key === 'Enter') {
        handleToggleStep(channelId, stepIndex);
        e.preventDefault();
      } else if (e.key === 'Escape') {
        setKeyboardFocus(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardFocus, channels, totalSteps]);

  // Toggle step on/off
  const handleToggleStep = (channelId: string, stepIndex: number, e?: React.MouseEvent) => {
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) return;

    // If shift key is pressed or alt key, open step pitch editor directly
    if (e && (e.shiftKey || e.altKey)) {
      setActiveStepEditor({ channelId, stepIndex });
      return;
    }

    const updated = channels.map((ch) => {
      if (ch.id !== channelId) return ch;
      const newSteps = [...ch.steps];
      const current = newSteps[stepIndex] || {
        enabled: false,
        velocity: 100,
        probability: 1,
        offset: 0,
        accent: false,
        pitch: ch.pitch || 36,
      };

      const willBeEnabled = !current.enabled;
      newSteps[stepIndex] = {
        ...current,
        enabled: willBeEnabled,
        pitch: current.pitch || ch.pitch || 36,
      };

      // Audition on activation
      if (willBeEnabled) {
        if (
          ch.is808Channel ||
          ch.sampleKey === 'sonik_808' ||
          ch.sampleKey === '808' ||
          ch.sampleKey === 'sub_808'
        ) {
          soundEngine.auditionDrumSample(
            'sonik_808',
            current.velocity || 110,
            current.pitch || ch.pitch || 36,
            ch.eight08Params
          );
        } else {
          soundEngine.auditionDrumSample(ch.sampleKey, current.velocity || 100);
        }
      }
      return { ...ch, steps: newSteps };
    });

    onUpdateChannels(updated);
  };

  // Update specific step attributes (pitch, velocity, slide, ratchet, accent)
  const handleUpdateStepAttributes = (
    channelId: string,
    stepIndex: number,
    updates: Partial<StepSequencerStep>
  ) => {
    const updated = channels.map((ch) => {
      if (ch.id !== channelId) return ch;
      const newSteps = [...ch.steps];
      const current = newSteps[stepIndex] || {
        enabled: true,
        velocity: 100,
        probability: 1,
        offset: 0,
        accent: false,
      };

      newSteps[stepIndex] = {
        ...current,
        ...updates,
      };

      // Audition preview if pitch changed
      if (updates.pitch !== undefined) {
        soundEngine.auditionDrumSample(
          'sonik_808',
          updates.velocity || current.velocity || 110,
          updates.pitch,
          ch.eight08Params
        );
      }

      return { ...ch, steps: newSteps };
    });

    onUpdateChannels(updated);
  };

  // Toggle Mute / Solo
  const handleToggleMute = (channelId: string) => {
    const updated = channels.map((ch) => (ch.id === channelId ? { ...ch, muted: !ch.muted } : ch));
    onUpdateChannels(updated);
  };

  const handleToggleSolo = (channelId: string) => {
    const updated = channels.map((ch) => (ch.id === channelId ? { ...ch, solo: !ch.solo } : ch));
    onUpdateChannels(updated);
  };

  const handleVolumeChange = (channelId: string, volume: number) => {
    const updated = channels.map((ch) => (ch.id === channelId ? { ...ch, volume } : ch));
    onUpdateChannels(updated);
  };

  const handlePanChange = (channelId: string, pan: number) => {
    const updated = channels.map((ch) => (ch.id === channelId ? { ...ch, pan } : ch));
    onUpdateChannels(updated);
  };

  // Apply 808 preset parameters to 808 channel
  const handleSelect808Preset = (channelId: string, presetId: string) => {
    const preset = eight08Presets.find((p) => p.id === presetId);
    if (!preset) return;

    const updated = channels.map((ch) => {
      if (ch.id !== channelId) return ch;
      return {
        ...ch,
        eight08Params: {
          ...(ch.eight08Params || {}),
          ...preset.parameters,
        },
      };
    });

    onUpdateChannels(updated);
    // Audition sound with new preset
    const targetChannel = channels.find((c) => c.id === channelId);
    soundEngine.auditionDrumSample('sonik_808', 115, targetChannel?.pitch || 36, preset.parameters);
  };

  // Add new 808 Channel
  const handleAdd808Channel = (presetId: string = '808-sub-king') => {
    const preset = eight08Presets.find((p) => p.id === presetId) || eight08Presets[0];
    const newId = `ch-808-${Date.now()}`;
    const newChannel: StepSequencerChannel = {
      id: newId,
      name: `SONIK 808 (${preset.name})`,
      sampleKey: 'sonik_808',
      pitch: 41, // F1
      volume: 0.95,
      pan: 0,
      muted: false,
      solo: false,
      is808Channel: true,
      eight08Params: { ...preset.parameters },
      steps: Array.from({ length: totalSteps }, (_, i) => ({
        enabled: [0, 6, 8, 14].includes(i),
        velocity: i === 0 ? 120 : 105,
        probability: 1,
        offset: 0,
        accent: i === 0,
        pitch: i === 6 ? 53 : i === 14 ? 37 : 41,
        noteName: i === 6 ? 'F2' : i === 14 ? 'C#1' : 'F1',
        slide: i === 6 || i === 14,
      })),
    };

    onUpdateChannels([newChannel, ...channels]);
    setSelectedChannelId(newId);
    soundEngine.auditionDrumSample('sonik_808', 120, 41, preset.parameters);
  };

  // Add standard drum / instrument / street / vocal channel
  const handleAddSoundChannel = (sampleKey: string, name: string) => {
    const newId = `ch-${sampleKey}-${Date.now()}`;
    const newChannel: StepSequencerChannel = {
      id: newId,
      name,
      sampleKey,
      pitch: 42,
      volume: 0.88,
      pan: 0,
      muted: false,
      solo: false,
      steps: Array.from({ length: totalSteps }, (_, i) => ({
        enabled: [0, 4, 8, 12].includes(i) && (sampleKey === 'kick' || sampleKey === 'snare'),
        velocity: 100,
        probability: 1,
        offset: 0,
        accent: i === 0,
      })),
    };

    onUpdateChannels([...channels, newChannel]);
    setSelectedChannelId(newId);
    soundEngine.auditionDrumSample(sampleKey, 100);
  };

  // Load a complete Loop from the Library
  const handleLoadLoop = (loopId: string) => {
    const loop = SEQUENCER_LOOP_LIBRARY.find((l) => l.id === loopId);
    if (!loop) return;

    onUpdateChannels(loop.channels);
    if (loop.channels[0]) {
      setSelectedChannelId(loop.channels[0].id);
    }
    setShowLoopLibraryModal(false);
  };

  // Preview Loop audition in real time
  const handleAuditionLoop = (loopId: string) => {
    const loop = SEQUENCER_LOOP_LIBRARY.find((l) => l.id === loopId);
    if (!loop) return;

    if (auditioningLoopId === loopId) {
      soundEngine.stopPlayback();
      setAuditioningLoopId(null);
      return;
    }

    setAuditioningLoopId(loopId);
    if (loop.bpm) {
      soundEngine.setBpm(loop.bpm);
    }
    soundEngine.setActivePatterns([], loop.channels);
    soundEngine.startPlayback();
  };

  const handleClearAll = () => {
    const cleared = channels.map((ch) => ({
      ...ch,
      steps: Array.from({ length: totalSteps }, () => ({
        enabled: false,
        velocity: 100,
        probability: 1,
        offset: 0,
        accent: false,
        pitch: ch.pitch || 36,
      })),
    }));
    onUpdateChannels(cleared);
  };

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || channels[0];
  const isSelected808 =
    selectedChannel?.is808Channel ||
    selectedChannel?.sampleKey === 'sonik_808' ||
    selectedChannel?.sampleKey === '808' ||
    selectedChannel?.sampleKey === 'sub_808';

  const filteredLoops =
    selectedLoopCategory === 'ALL'
      ? SEQUENCER_LOOP_LIBRARY
      : SEQUENCER_LOOP_LIBRARY.filter((l) => l.category === selectedLoopCategory);

  return (
    <div className="flex flex-col bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-black text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="tracking-wide">SONIK 808 LAB & STEP SEQUENCER</span>
          </div>
          <span className="hidden sm:inline-block text-neutral-400 text-xs font-mono">
            {channels.length} Channels • {totalSteps} Steps
          </span>
        </div>

        {/* Action Controls & Loop Library Launcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Loop Library Button */}
          <button
            onClick={() => setShowLoopLibraryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 font-bold rounded-lg border border-amber-500/40 text-xs shadow-sm transition-all hover:scale-[1.02]"
          >
            <Disc className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>Loops & 808 Patterns ({SEQUENCER_LOOP_LIBRARY.length})</span>
          </button>

          {/* Quick Add 808 Channel */}
          <button
            onClick={() => handleAdd808Channel('808-sub-king')}
            className="flex items-center gap-1 px-2 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/40 text-xs transition-colors font-bold"
            title="Add a new 808 Sub Channel to the grid"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>808 Sub</span>
          </button>

          {/* Quick Add Trap Hats */}
          <button
            onClick={() => handleAddSoundChannel('trap_hat_ratchet', 'Trap Hi-Hat Ratchet')}
            className="flex items-center gap-1 px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 text-xs transition-colors"
            title="Add Trap Hi-Hat Ratchets channel"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Trap Hats</span>
          </button>

          {/* Quick Add Dark Piano */}
          <button
            onClick={() => handleAddSoundChannel('dark_piano', 'Dark Trap Piano')}
            className="flex items-center gap-1 px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 text-xs transition-colors"
            title="Add Dark Piano Stab channel"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Piano</span>
          </button>

          {/* Quick Add Street FX */}
          <button
            onClick={() => handleAddSoundChannel('street_siren', 'Street Siren & Gun Cock')}
            className="flex items-center gap-1 px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 text-xs transition-colors"
            title="Add Street FX channel"
          >
            <Plus className="w-3.5 h-3.5 text-red-400" />
            <span>Street FX</span>
          </button>

          {/* Quick Add Vocalization */}
          <button
            onClick={() => handleAddSoundChannel('afro_chant_oya', 'Afro-Drill Vocalization')}
            className="flex items-center gap-1 px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-700 text-xs transition-colors"
            title="Add Vocalization Chant channel"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vox</span>
          </button>

          {/* Open Dedicated 808 Lab Plugin */}
          {onOpen808Lab && (
            <button
              onClick={onOpen808Lab}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-amber-950/60 text-amber-300 rounded-lg border border-amber-500/30 text-xs transition-colors"
              title="Open full 808 Lab synthesizer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>808 Lab DSP</span>
            </button>
          )}

          {/* Clear Grid */}
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-900 hover:bg-red-950/60 text-neutral-400 hover:text-red-300 rounded-lg border border-neutral-800 text-xs transition-colors"
            title="Clear all steps in the sequencer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Quick 1-Click Rhythms & 808 Loops Strip */}
      <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900/60 border-b border-neutral-800/80 overflow-x-auto text-[11px]">
        <span className="text-neutral-400 font-medium flex-shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Quick Loops:
        </span>
        {SEQUENCER_LOOP_LIBRARY.map((loop) => (
          <button
            key={loop.id}
            onClick={() => handleLoadLoop(loop.id)}
            className="flex-shrink-0 px-2.5 py-1 rounded-md bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700/60 hover:border-amber-500/40 transition-all font-mono text-[11px]"
            title={`${loop.description} • ${loop.bpm} BPM • ${loop.key}`}
          >
            <span className="text-amber-400 font-bold mr-1.5">[{loop.category}]</span>
            {loop.name}
          </button>
        ))}
      </div>

      {/* Main Channels & Step Grid */}
      <div className="flex flex-col overflow-x-auto relative select-none">
        {/* Step Numbers & Bar Markers Header */}
        <div className="flex items-center h-7 bg-neutral-900/80 border-b border-neutral-800 text-[10px] font-mono text-neutral-400">
          <div className="w-56 sm:w-64 flex-shrink-0 px-3 font-bold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
            <span>SOUND / 808 CHANNEL</span>
            <span className="text-[9px] text-neutral-500 font-normal">M / S</span>
          </div>
          <div className="flex flex-grow">
            {Array.from({ length: totalSteps }, (_, step) => {
              const isBeat = step % 4 === 0;
              const isBar = step % 16 === 0;
              const barNum = Math.floor(step / 16) + 1;
              const beatNum = (Math.floor(step / 4) % 4) + 1;
              const isCurrent = soundEngine.getPlaying() && currentPlaybackStep === step;

              return (
                <div
                  key={step}
                  className={`flex-1 min-w-[32px] flex items-center justify-center border-r border-neutral-800/60 transition-colors ${
                    isBar
                      ? 'bg-neutral-800/70 font-black text-amber-400'
                      : isBeat
                        ? 'bg-neutral-900/40 text-neutral-300 font-bold'
                        : 'text-neutral-500'
                  } ${isCurrent ? 'bg-amber-500/30 text-amber-200' : ''}`}
                >
                  {isBeat ? `${barNum}.${beatNum}` : `${step + 1}`}
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Rows */}
        {channels.map((channel) => {
          const isSelected = channel.id === selectedChannelId;
          const is808 =
            channel.is808Channel ||
            channel.sampleKey === 'sonik_808' ||
            channel.sampleKey === '808' ||
            channel.sampleKey === 'sub_808';

          return (
            <div
              key={channel.id}
              onClick={() => setSelectedChannelId(channel.id)}
              className={`flex items-center border-b border-neutral-800/60 transition-colors ${
                isSelected ? 'bg-neutral-900/50' : 'hover:bg-neutral-900/30'
              } ${is808 ? 'bg-amber-950/10' : ''}`}
            >
              {/* Channel Strip Header */}
              <div
                className={`w-56 sm:w-64 flex-shrink-0 flex items-center justify-between px-3 py-2 border-r border-neutral-800 ${
                  is808 ? 'bg-neutral-950/90 border-l-4 border-l-amber-500' : 'bg-neutral-950/90'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (is808) {
                        soundEngine.auditionDrumSample(
                          'sonik_808',
                          115,
                          channel.pitch || 36,
                          channel.eight08Params
                        );
                      } else {
                        soundEngine.auditionDrumSample(channel.sampleKey, 100);
                      }
                    }}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-colors flex-shrink-0 text-[10px] ${
                      is808
                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-400 hover:text-black border border-amber-500/30'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                    }`}
                    title="Audition Note"
                  >
                    ▶
                  </button>

                  <div className="flex flex-col truncate">
                    <div className="flex items-center gap-1.5">
                      {is808 && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-black uppercase tracking-wider">
                          808
                        </span>
                      )}
                      <span
                        className="font-bold text-xs text-neutral-200 truncate"
                        title={channel.name}
                      >
                        {channel.name}
                      </span>
                    </div>

                    {is808 && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-400/80 font-mono">
                        <span>
                          Root:{' '}
                          {PITCH_OPTIONS.find((p) => p.midi === (channel.pitch || 36))?.name ||
                            'C1'}
                        </span>
                        <span>•</span>
                        <span>{channel.eight08Params?.mode || 'SUB'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mute / Solo & 808 Preset Selector */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleMute(channel.id);
                    }}
                    className={`w-5 h-5 rounded text-[10px] font-bold font-mono transition-colors ${
                      channel.muted
                        ? 'bg-red-500 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                    title="Mute Channel"
                  >
                    M
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSolo(channel.id);
                    }}
                    className={`w-5 h-5 rounded text-[10px] font-bold font-mono transition-colors ${
                      channel.solo
                        ? 'bg-amber-400 text-black font-black'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                    title="Solo Channel"
                  >
                    S
                  </button>
                </div>
              </div>

              {/* Step Grid Buttons */}
              <div className="flex flex-grow relative">
                {Array.from({ length: totalSteps }, (_, step) => {
                  const stepData = channel.steps[step] || {
                    enabled: false,
                    velocity: 100,
                    probability: 1,
                    offset: 0,
                    accent: false,
                    pitch: channel.pitch || 36,
                  };
                  const isBeat = step % 4 === 0;
                  const isBar = step % 16 === 0;
                  const isCurrent = soundEngine.getPlaying() && currentPlaybackStep === step;
                  const noteObj = PITCH_OPTIONS.find(
                    (p) => p.midi === (stepData.pitch || channel.pitch || 36)
                  );

                  return (
                    <div
                      key={step}
                      onClick={(e) => handleToggleStep(channel.id, step, e)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setActiveStepEditor({ channelId: channel.id, stepIndex: step });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setKeyboardFocus({ channelId: channel.id, stepIndex: step });
                        }
                      }}
                      tabIndex={0}
                      role="gridcell"
                      aria-label={`Step ${step + 1}, ${stepData.enabled ? 'enabled' : 'disabled'}`}
                      className={`flex-1 min-w-[32px] h-11 p-1 border-r flex items-center justify-center cursor-pointer transition-all outline-none ${
                        isBar
                          ? 'border-r-neutral-700/80 bg-neutral-900/30'
                          : isBeat
                            ? 'border-r-neutral-800/80 bg-neutral-950/20'
                            : 'border-r-neutral-900/50'
                      } ${isCurrent ? 'bg-amber-500/25 ring-1 ring-amber-400/50 inset-0 z-10' : ''} ${
                        keyboardFocus?.channelId === channel.id && keyboardFocus?.stepIndex === step
                          ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-950'
                          : ''
                      }`}
                    >
                      <div
                        className={`w-full h-full rounded-md transition-all flex flex-col items-center justify-center relative overflow-hidden ${
                          stepData.enabled
                            ? is808
                              ? stepData.accent
                                ? 'bg-gradient-to-t from-amber-600 to-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.8)] font-black'
                                : 'bg-gradient-to-t from-amber-700 to-amber-500 text-neutral-950 shadow-[0_0_8px_rgba(245,158,11,0.5)] font-bold'
                              : stepData.accent
                                ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.7)] font-black'
                                : 'bg-gradient-to-t from-emerald-700 to-emerald-500 text-white shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                            : isBeat
                              ? 'bg-neutral-800/70 hover:bg-neutral-700/80 text-transparent'
                              : 'bg-neutral-900/70 hover:bg-neutral-800/80 text-transparent'
                        }`}
                      >
                        {stepData.enabled && is808 && (
                          <>
                            <span className="text-[9px] font-mono leading-none tracking-tight">
                              {stepData.noteName || noteObj?.name || 'C1'}
                            </span>
                            {stepData.slide && (
                              <span className="text-[8px] leading-none font-bold text-amber-950 mt-0.5">
                                ~SLIDE
                              </span>
                            )}
                          </>
                        )}

                        {stepData.enabled && !is808 && stepData.accent && (
                          <div className="w-2 h-2 rounded-full bg-black/80" />
                        )}

                        {stepData.enabled && stepData.ratchet && stepData.ratchet > 1 && (
                          <span className="absolute top-0.5 right-0.5 text-[8px] font-bold bg-black/60 text-white px-1 rounded">
                            {stepData.ratchet}x
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Channel Mini Mixer & 808 DSP Panel */}
      {selectedChannel && (
        <div className="flex flex-col bg-neutral-900/90 border-t border-neutral-800 text-xs">
          {/* Strip 1: Standard Channel Mixer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 border-b border-neutral-800/80">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isSelected808 ? (
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-black text-[10px]">
                    808 LAB ACTIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                    DRUM CHANNEL
                  </span>
                )}
                <span className="font-extrabold text-white text-sm">{selectedChannel.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              {/* Volume Fader */}
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-400">Vol:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={selectedChannel.volume}
                  onChange={(e) =>
                    handleVolumeChange(selectedChannel.id, parseFloat(e.target.value))
                  }
                  className="w-24 accent-amber-400 cursor-pointer"
                />
                <span className="font-mono text-neutral-200 w-9 text-right font-bold">
                  {Math.round(selectedChannel.volume * 100)}%
                </span>
              </div>

              {/* Pan Fader */}
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">Pan:</span>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.05"
                  value={selectedChannel.pan}
                  onChange={(e) => handlePanChange(selectedChannel.id, parseFloat(e.target.value))}
                  className="w-20 accent-amber-400 cursor-pointer"
                />
                <span className="font-mono text-neutral-200 w-10 text-right">
                  {selectedChannel.pan === 0
                    ? 'C'
                    : selectedChannel.pan < 0
                      ? `L${Math.round(Math.abs(selectedChannel.pan) * 100)}`
                      : `R${Math.round(selectedChannel.pan * 100)}`}
                </span>
              </div>

              {/* 808 Preset Selector Dropdown */}
              {isSelected808 && (
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-semibold">808 Preset:</span>
                  <select
                    onChange={(e) => handleSelect808Preset(selectedChannel.id, e.target.value)}
                    className="bg-neutral-800 border border-amber-500/40 text-amber-300 text-xs rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  >
                    {eight08Presets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Strip 2: Specialized 808 Synth Quick Knobs (when 808 is selected) */}
          {isSelected808 && showDspDrawer && (
            <div className="p-3 bg-gradient-to-r from-neutral-950 via-amber-950/20 to-neutral-950 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Flame className="w-4 h-4" />
                <span>808 Real-Time DSP Parameters:</span>
              </div>

              <div className="flex items-center gap-5 flex-wrap">
                {/* Mode */}
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-400 text-[11px]">Mode:</span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded text-[11px] border border-amber-500/30">
                    {selectedChannel.eight08Params?.mode || 'DEEP'}
                  </span>
                </div>

                {/* Drive / Saturation */}
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-[11px]">Drive:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={selectedChannel.eight08Params?.drive ?? 0.35}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      const updated = channels.map((ch) =>
                        ch.id === selectedChannel.id
                          ? { ...ch, eight08Params: { ...(ch.eight08Params || {}), drive: val } }
                          : ch
                      );
                      onUpdateChannels(updated);
                    }}
                    className="w-20 accent-amber-400 cursor-pointer"
                  />
                  <span className="font-mono text-amber-300 text-[11px] w-8">
                    {Math.round((selectedChannel.eight08Params?.drive ?? 0.35) * 100)}%
                  </span>
                </div>

                {/* Sub Boost */}
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-[11px]">Sub Boost:</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={selectedChannel.eight08Params?.subBoost ?? 5}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      const updated = channels.map((ch) =>
                        ch.id === selectedChannel.id
                          ? { ...ch, eight08Params: { ...(ch.eight08Params || {}), subBoost: val } }
                          : ch
                      );
                      onUpdateChannels(updated);
                    }}
                    className="w-20 accent-amber-400 cursor-pointer"
                  />
                  <span className="font-mono text-amber-300 text-[11px] w-8">
                    +{selectedChannel.eight08Params?.subBoost ?? 5}dB
                  </span>
                </div>

                {/* Glide Time */}
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-[11px]">Glide Time:</span>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={selectedChannel.eight08Params?.glideTime ?? 65}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const updated = channels.map((ch) =>
                        ch.id === selectedChannel.id
                          ? {
                              ...ch,
                              eight08Params: { ...(ch.eight08Params || {}), glideTime: val },
                            }
                          : ch
                      );
                      onUpdateChannels(updated);
                    }}
                    className="w-20 accent-amber-400 cursor-pointer"
                  />
                  <span className="font-mono text-amber-300 text-[11px] w-12">
                    {selectedChannel.eight08Params?.glideTime ?? 65}ms
                  </span>
                </div>

                {/* Decay */}
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-[11px]">Decay:</span>
                  <input
                    type="range"
                    min="0.2"
                    max="4.0"
                    step="0.1"
                    value={selectedChannel.eight08Params?.decay ?? 1.8}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      const updated = channels.map((ch) =>
                        ch.id === selectedChannel.id
                          ? { ...ch, eight08Params: { ...(ch.eight08Params || {}), decay: val } }
                          : ch
                      );
                      onUpdateChannels(updated);
                    }}
                    className="w-20 accent-amber-400 cursor-pointer"
                  />
                  <span className="font-mono text-amber-300 text-[11px] w-9">
                    {(selectedChannel.eight08Params?.decay ?? 1.8).toFixed(1)}s
                  </span>
                </div>

                {/* Waveform Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-400 text-[11px]">Wave:</span>
                  <select
                    value={selectedChannel.eight08Params?.waveform || 'sine'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      const updated = channels.map((ch) =>
                        ch.id === selectedChannel.id
                          ? { ...ch, eight08Params: { ...(ch.eight08Params || {}), waveform: val } }
                          : ch
                      );
                      onUpdateChannels(updated);
                    }}
                    className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-[11px] rounded px-2 py-0.5"
                  >
                    <option value="sine">Pure Sine</option>
                    <option value="triangle">Triangle Punch</option>
                    <option value="sawtooth">Sawtooth Gritty</option>
                    <option value="fm_sine">FM Modulated</option>
                    <option value="sub_distort">Wavefolded Distort</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step Pitch & Attribute Editor Modal / Popover */}
      {activeStepEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 text-neutral-100">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base">
                  Step {activeStepEditor.stepIndex + 1} Pitch & Note Settings
                </h3>
              </div>
              <button
                onClick={() => setActiveStepEditor(null)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const ch = channels.find((c) => c.id === activeStepEditor.channelId);
              const step = ch?.steps[activeStepEditor.stepIndex] || {
                enabled: true,
                velocity: 100,
                probability: 1,
                offset: 0,
                accent: false,
                pitch: ch?.pitch || 36,
              };

              return (
                <div className="flex flex-col gap-4">
                  {/* Pitch / Note Picker Grid */}
                  <div>
                    <label className="block text-xs font-bold text-amber-400 mb-2">
                      808 Note Pitch (Current:{' '}
                      {PITCH_OPTIONS.find((p) => p.midi === (step.pitch || ch?.pitch || 36))
                        ?.name || 'C1'}
                      )
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-neutral-950 rounded-xl border border-neutral-800">
                      {PITCH_OPTIONS.map((opt) => {
                        const isCurrentPitch = (step.pitch || ch?.pitch || 36) === opt.midi;
                        return (
                          <button
                            key={opt.midi}
                            onClick={() =>
                              handleUpdateStepAttributes(
                                activeStepEditor.channelId,
                                activeStepEditor.stepIndex,
                                {
                                  pitch: opt.midi,
                                  noteName: opt.name,
                                }
                              )
                            }
                            className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                              isCurrentPitch
                                ? 'bg-amber-400 text-black shadow-[0_0_8px_#f59e0b]'
                                : 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300'
                            }`}
                          >
                            {opt.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slide Portamento Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div>
                      <span className="font-bold text-xs text-white block">
                        Drill Slide / Portamento
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Glide pitch smoothly from previous 808 note
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleUpdateStepAttributes(
                          activeStepEditor.channelId,
                          activeStepEditor.stepIndex,
                          {
                            slide: !step.slide,
                          }
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                        step.slide
                          ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {step.slide ? 'ON (SLIDE ~)' : 'OFF'}
                    </button>
                  </div>

                  {/* Accent Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div>
                      <span className="font-bold text-xs text-white block">Accent Boost</span>
                      <span className="text-[11px] text-neutral-400">
                        +25% Velocity and heavier harmonic saturation
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleUpdateStepAttributes(
                          activeStepEditor.channelId,
                          activeStepEditor.stepIndex,
                          {
                            accent: !step.accent,
                          }
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                        step.accent
                          ? 'bg-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {step.accent ? 'ACCENTED' : 'NORMAL'}
                    </button>
                  </div>

                  {/* Ratchet Roll Multiplier */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                    <div>
                      <span className="font-bold text-xs text-white block">
                        Trap Roll (Ratchet)
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Subdivide step for rapid stutter rolls
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {([1, 2, 3, 4, 6, 8] as const).map((mul) => (
                        <button
                          key={mul}
                          onClick={() =>
                            handleUpdateStepAttributes(
                              activeStepEditor.channelId,
                              activeStepEditor.stepIndex,
                              {
                                ratchet: mul,
                              }
                            )
                          }
                          className={`w-7 h-7 rounded text-xs font-bold font-mono transition-colors ${
                            (step.ratchet || 1) === mul
                              ? 'bg-amber-400 text-black'
                              : 'bg-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {mul}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Velocity Slider */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400 font-medium">Step Velocity</span>
                      <span className="font-mono text-amber-300 font-bold">
                        {step.velocity || 100} / 127
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="127"
                      value={step.velocity || 100}
                      onChange={(e) =>
                        handleUpdateStepAttributes(
                          activeStepEditor.channelId,
                          activeStepEditor.stepIndex,
                          {
                            velocity: parseInt(e.target.value, 10),
                          }
                        )
                      }
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => setActiveStepEditor(null)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-sm transition-all shadow-lg mt-2"
                  >
                    Done Editing Step
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Master Loops & 808 Patterns Modal */}
      {showLoopLibraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-950 border border-amber-500/40 rounded-3xl p-6 max-w-3xl w-full shadow-2xl max-h-[85vh] flex flex-col text-neutral-100 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Disc className="w-6 h-6 text-amber-400 animate-spin-slow" />
                  <h2 className="text-xl font-black text-white tracking-tight">
                    SONIK Master 808 & Groove Loops
                  </h2>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Select, audition, and load complete 808 basslines and drum grooves directly into
                  your sequencer.
                </p>
              </div>
              <button
                onClick={() => {
                  soundEngine.stopPlayback();
                  setAuditioningLoopId(null);
                  setShowLoopLibraryModal(false);
                }}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 border-b border-neutral-800/80">
              {['ALL', 'TRAP', 'DRILL', 'AFROFUSION', 'AMAPIANO', 'PHONK', 'BOOM BAP'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedLoopCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                      selectedLoopCategory === cat
                        ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                        : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            {/* Loop List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto flex-grow pr-1">
              {filteredLoops.map((loop) => {
                const isAuditioning = auditioningLoopId === loop.id;

                return (
                  <div
                    key={loop.id}
                    className={`flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                      isAuditioning
                        ? 'bg-neutral-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {loop.category}
                        </span>
                        <div className="flex items-center gap-2 font-mono text-xs text-neutral-400">
                          <span>{loop.bpm} BPM</span>
                          <span>•</span>
                          <span className="text-amber-400 font-bold">{loop.key}</span>
                        </div>
                      </div>

                      <h4 className="font-extrabold text-white text-base mb-1">{loop.name}</h4>
                      <p className="text-xs text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
                        {loop.description}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-neutral-800">
                      {/* Audition Button */}
                      <button
                        onClick={() => handleAuditionLoop(loop.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          isAuditioning
                            ? 'bg-amber-400 text-black shadow-[0_0_10px_#f59e0b]'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                        }`}
                      >
                        {isAuditioning ? (
                          <Square className="w-3.5 h-3.5 fill-black" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-white" />
                        )}
                        <span>{isAuditioning ? 'Stop Preview' : 'Audition'}</span>
                      </button>

                      {/* Load into Grid */}
                      <button
                        onClick={() => handleLoadLoop(loop.id)}
                        className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black rounded-xl text-xs shadow-md transition-all hover:scale-[1.02]"
                      >
                        Load Into Sequencer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
