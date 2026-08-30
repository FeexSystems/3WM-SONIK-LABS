import React, { useState, useEffect } from 'react';
import { midiMappingEngine, MidiMapping, MidiDevice } from '../../audio/midiMappingEngine';
import { soundEngine } from '../../audio/engine';
import {
  Sliders,
  Radio,
  X,
  Zap,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  Activity,
  Cpu,
} from 'lucide-react';

interface MidiControllerMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateTrackSettings?: (settingsPatch: any) => void;
}

export const MidiControllerMappingModal: React.FC<MidiControllerMappingModalProps> = ({
  isOpen,
  onClose,
  onUpdateTrackSettings,
}) => {
  const [status, setStatus] = useState(midiMappingEngine.getStatus());
  const [learningTarget, setLearningTarget] = useState<MidiMapping['target'] | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<
    'default' | 'mpk_mini' | 'launchkey' | 'arturia'
  >('default');
  const [simulatedCcVal, setSimulatedCcVal] = useState<number>(64);

  useEffect(() => {
    if (isOpen) {
      midiMappingEngine.init().then(() => {
        setStatus(midiMappingEngine.getStatus());
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = midiMappingEngine.subscribe((mapping, rawVal, mappedVal) => {
      setStatus(midiMappingEngine.getStatus());
      // Apply live DSP parameter update
      soundEngine.applyAutomation(mapping.target, mappedVal);
      if (onUpdateTrackSettings) {
        if (
          mapping.target === 'eq_low' ||
          mapping.target === 'eq_mid' ||
          mapping.target === 'eq_high'
        ) {
          const key =
            mapping.target === 'eq_low' ? 'low' : mapping.target === 'eq_mid' ? 'mid' : 'high';
          onUpdateTrackSettings({ eq: { [key]: mappedVal } });
        }
      }
    });

    const interval = setInterval(() => {
      setStatus(midiMappingEngine.getStatus());
    }, 400);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [onUpdateTrackSettings]);

  if (!isOpen) return null;

  const handleToggleLearn = (target: MidiMapping['target']) => {
    if (learningTarget === target) {
      midiMappingEngine.cancelMidiLearn();
      setLearningTarget(null);
    } else {
      midiMappingEngine.startMidiLearn(target);
      setLearningTarget(target);
    }
    setStatus(midiMappingEngine.getStatus());
  };

  const handleSelectPreset = (preset: 'default' | 'mpk_mini' | 'launchkey' | 'arturia') => {
    setSelectedPreset(preset);
    midiMappingEngine.loadPreset(preset);
    setStatus(midiMappingEngine.getStatus());
  };

  const TARGET_OPTIONS: { id: MidiMapping['target']; label: string; unit: string }[] = [
    { id: 'volume', label: 'Master Output Volume', unit: '0 - 100%' },
    { id: 'bpm', label: 'Studio Master BPM', unit: '80 - 160 BPM' },
    { id: 'eq_low', label: 'Log Drum / Low Bass EQ', unit: '±12 dB' },
    { id: 'eq_mid', label: 'Vocal Mid EQ', unit: '±12 dB' },
    { id: 'eq_high', label: 'Shekere / Shaker Air EQ', unit: '±12 dB' },
    { id: 'filter_cutoff', label: 'Master Filter Cutoff', unit: '200Hz - 20kHz' },
    { id: 'eight_oh_eight_drive', label: '808 Saturation Drive', unit: '0 - 100%' },
    { id: 'reverb', label: 'Kalakuta Shrine Reverb', unit: '0 - 100%' },
    { id: 'ducking_threshold', label: 'Vocal Ducking Threshold', unit: '-40 to -6 dB' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Hardware MIDI Controller Mapping</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  WEB MIDI API
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Bind USB/Bluetooth knobs & faders to 3WM BeatLab, Studio EQs, 808 Drive, and Vocal
                Ducking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Hardware Connection Banner & Activity CC Monitor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-xl flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span>MIDI Hardware Status</span>
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    status.isConnected
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {status.isConnected
                    ? `${status.devices.length || 1} PORT(S) READY`
                    : 'CONNECTING...'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {status.devices.length > 0
                  ? `Active Controller: ${status.devices[0].name}`
                  : 'Plug in any USB MIDI keyboard or knob box (Akai, Novation, Arturia, Korg).'}
              </p>
            </div>

            {/* Live CC Ingestion Monitor */}
            <div className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>Live CC Activity Ingestion</span>
                </span>
                <span className="font-mono text-[10px] text-neutral-400">
                  {status.lastCcReceived ? `CC #${status.lastCcReceived.cc}` : 'IDLE'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-neutral-950 p-2 rounded-lg border border-neutral-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">VAL: {status.lastCcReceived?.value ?? 0}</span>
                  <span className="text-amber-300 font-bold">
                    CH: {status.lastCcReceived?.channel ?? 1}
                  </span>
                </div>
                {/* Virtual CC knob test slider */}
                <input
                  type="range"
                  min="0"
                  max="127"
                  value={simulatedCcVal}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSimulatedCcVal(val);
                    midiMappingEngine.simulateCc(status.lastCcReceived?.cc || 7, val, 1);
                  }}
                  className="w-28 h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-cyan-400"
                  title="Virtual CC Knob Tester"
                />
              </div>
            </div>
          </div>

          {/* Quick Hardware Presets Bar */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-neutral-300">
              Load Hardware Controller Preset:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'default', label: '3WM Studio Console' },
                { id: 'mpk_mini', label: 'Akai MPK Mini MK3' },
                { id: 'launchkey', label: 'Novation Launchkey' },
                { id: 'arturia', label: 'Arturia MiniLab' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id as any)}
                  className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition ${
                    selectedPreset === preset.id
                      ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/30'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Parameter Mappings Table */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden space-y-1">
            <div className="p-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs font-bold text-neutral-200">
              <span>ACTIVE PARAMETER BINDINGS ({status.mappings.length})</span>
              <span className="text-[10px] font-mono text-neutral-400">
                CLICK LEARN & TURN HARDWARE KNOB
              </span>
            </div>

            <div className="divide-y divide-neutral-850 max-h-72 overflow-y-auto">
              {status.mappings.map((mapping) => {
                const isThisLearning = learningTarget === mapping.target;
                return (
                  <div
                    key={mapping.id}
                    className={`p-3 flex items-center justify-between gap-3 text-xs transition ${
                      isThisLearning
                        ? 'bg-amber-400/10 border-l-2 border-amber-400'
                        : 'hover:bg-neutral-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center font-mono font-bold text-[11px] text-cyan-300">
                        {mapping.ccNumber}
                      </div>
                      <div>
                        <span className="font-bold text-neutral-200 block">{mapping.name}</span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          Target: {mapping.target} • Ch:{' '}
                          {mapping.channel === 0 ? 'Omni' : mapping.channel}
                        </span>
                      </div>
                    </div>

                    {/* Value Visual Progress Bar */}
                    <div className="flex-1 max-w-xs space-y-1 hidden sm:block">
                      <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                        <span>{mapping.minValue}</span>
                        <span className="text-cyan-300 font-bold">
                          {(
                            mapping.minValue +
                            mapping.currentNormalizedValue * (mapping.maxValue - mapping.minValue)
                          ).toFixed(1)}
                        </span>
                        <span>{mapping.maxValue}</span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className="h-full bg-cyan-400 transition-all duration-75"
                          style={{ width: `${mapping.currentNormalizedValue * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions: Learn & CC Selector */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleLearn(mapping.target)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold font-mono transition border ${
                          isThisLearning
                            ? 'bg-amber-400 border-amber-400 text-black animate-pulse'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                        }`}
                      >
                        {isThisLearning ? 'WAITING CC...' : 'MIDI LEARN'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          midiMappingEngine.removeMapping(mapping.id);
                          setStatus(midiMappingEngine.getStatus());
                        }}
                        className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg transition"
                        title="Remove Mapping"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Hardware MIDI CC mapped in real time to audio graph</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition"
          >
            Done & Save Mappings
          </button>
        </div>
      </div>
    </div>
  );
};
