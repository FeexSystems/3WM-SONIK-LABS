import React, { useState } from 'react';
import { TrapDrumPadParameters, PluginPreset } from '../../types';
import { PLUGIN_REGISTRY } from '../../audio/pluginEngine';
import { soundEngine } from '../../audio/engine';
import { midiSynth } from '../../audio/midiEngine';
import { Layers, Volume2, Sliders, Sparkles, Power, RotateCcw, Zap, Repeat } from 'lucide-react';

interface TrapDrumMachinePluginProps {
  bypassed?: boolean;
  onToggleBypass?: () => void;
}

const DEFAULT_CHANNELS = [
  {
    id: 'kick',
    name: '808 Kick',
    sampleKey: 'kick',
    pitch: 0,
    decay: 0.35,
    pan: 0,
    vol: 0.95,
    roll: '1x',
  },
  {
    id: 'sub808',
    name: 'Sub 808',
    sampleKey: 'sub_808',
    pitch: 0,
    decay: 1.2,
    pan: 0,
    vol: 0.9,
    roll: '1x',
  },
  {
    id: 'snare',
    name: 'Trap Snare',
    sampleKey: 'snare',
    pitch: 0,
    decay: 0.25,
    pan: 0,
    vol: 0.85,
    roll: '1x',
  },
  {
    id: 'clap',
    name: 'Lagos Clap',
    sampleKey: 'clap',
    pitch: 0,
    decay: 0.2,
    pan: 0.1,
    vol: 0.82,
    roll: '1x',
  },
  {
    id: 'rim',
    name: 'Wood Rimshot',
    sampleKey: 'rim',
    pitch: 0,
    decay: 0.15,
    pan: -0.15,
    vol: 0.75,
    roll: '1x',
  },
  {
    id: 'hat_closed',
    name: 'Closed Hat',
    sampleKey: 'closed_hat',
    pitch: 0,
    decay: 0.08,
    pan: -0.2,
    vol: 0.8,
    roll: '4x',
  },
  {
    id: 'hat_open',
    name: 'Open Hat',
    sampleKey: 'open_hat',
    pitch: 0,
    decay: 0.3,
    pan: 0.25,
    vol: 0.7,
    roll: '1x',
  },
  {
    id: 'perc',
    name: 'Conga / Perc',
    sampleKey: 'conga',
    pitch: 0,
    decay: 0.22,
    pan: 0.3,
    vol: 0.65,
    roll: '1x',
  },
  {
    id: 'shaker',
    name: 'Afro Shaker',
    sampleKey: 'shaker',
    pitch: 0,
    decay: 0.08,
    pan: -0.3,
    vol: 0.6,
    roll: '2x',
  },
  {
    id: 'cowbell',
    name: 'Memphis Cowbell',
    sampleKey: 'cowbell',
    pitch: 0,
    decay: 0.35,
    pan: 0.1,
    vol: 0.7,
    roll: '1x',
  },
  {
    id: 'tom',
    name: 'Low Tom',
    sampleKey: 'tom',
    pitch: 0,
    decay: 0.3,
    pan: -0.25,
    vol: 0.75,
    roll: '1x',
  },
  {
    id: 'crash',
    name: 'Crash Cymbal',
    sampleKey: 'crash',
    pitch: 0,
    decay: 0.8,
    pan: 0.4,
    vol: 0.65,
    roll: '1x',
  },
  {
    id: 'ride',
    name: 'Ride Cymbal',
    sampleKey: 'ride',
    pitch: 0,
    decay: 0.7,
    pan: -0.4,
    vol: 0.6,
    roll: '1x',
  },
];

export const TrapDrumMachinePlugin: React.FC<TrapDrumMachinePluginProps> = ({
  bypassed = false,
  onToggleBypass,
}) => {
  const pluginDef = PLUGIN_REGISTRY['trap-drum-machine'];
  const [activePresetId, setActivePresetId] = useState<string>(pluginDef.presets[0].id);
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('hat_closed');
  const [activePad, setActivePad] = useState<string | null>(null);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) || channels[0];

  const updateChannel = (channelId: string, updates: Partial<(typeof DEFAULT_CHANNELS)[0]>) => {
    setChannels((prev) => prev.map((c) => (c.id === channelId ? { ...c, ...updates } : c)));
  };

  const triggerPad = async (channel: (typeof DEFAULT_CHANNELS)[0], customRoll?: string) => {
    await soundEngine.init();
    const rollRate = customRoll || channel.roll;
    setActivePad(channel.id);
    setTimeout(() => setActivePad(null), 150);

    if (rollRate === '1x') {
      midiSynth.playDrumSample(channel.sampleKey, channel.vol * 127, channel.pan);
    } else {
      // Execute ratchet roll
      const count =
        rollRate === '2x'
          ? 2
          : rollRate === '3x'
            ? 3
            : rollRate === '4x'
              ? 4
              : rollRate === '6x'
                ? 6
                : 8;
      const intervalMs = 240 / count;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const velocity = channel.vol * 127 * (0.8 + (i / count) * 0.25);
          midiSynth.playDrumSample(channel.sampleKey, velocity, channel.pan);
        }, i * intervalMs);
      }
    }
  };

  return (
    <div
      className={`bg-neutral-950 border rounded-2xl p-5 shadow-2xl transition-all ${bypassed ? 'opacity-50 border-neutral-800' : 'border-rose-500/30'}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-850 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wider uppercase font-mono">
                SONIK TRAP DRUM MACHINE
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                13-CHANNEL URBAN ENGINE
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Trap, Drill & Afrobeats drum engine with ratchet rolls (2x-8x) and choke groups
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-1">
            <span className="text-[10px] font-mono text-neutral-400 mr-2 uppercase font-bold">
              KIT:
            </span>
            <select
              value={activePresetId}
              onChange={(e) => setActivePresetId(e.target.value)}
              className="bg-transparent text-xs font-bold text-rose-400 outline-none cursor-pointer"
            >
              {pluginDef.presets.map((p) => (
                <option key={p.id} value={p.id} className="bg-neutral-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {onToggleBypass && (
            <button
              onClick={onToggleBypass}
              className={`p-2 rounded-xl border transition ${
                bypassed
                  ? 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-white'
                  : 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Pads & Channel Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: 13-Pad Grid */}
        <div className="lg:col-span-8 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {channels.map((ch) => {
            const isSelected = ch.id === selectedChannelId;
            const isHit = activePad === ch.id;

            return (
              <div
                key={ch.id}
                onClick={async () => {
                  setSelectedChannelId(ch.id);
                  await triggerPad(ch);
                }}
                className={`p-3 rounded-xl border cursor-pointer select-none transition flex flex-col justify-between h-24 ${
                  isHit
                    ? 'bg-rose-500 text-white border-rose-300 scale-95 shadow-lg shadow-rose-500/30'
                    : isSelected
                      ? 'bg-neutral-900 border-rose-500/80 text-white ring-1 ring-rose-500/40'
                      : 'bg-neutral-900/60 hover:bg-neutral-850 border-neutral-800 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase font-bold text-neutral-400">
                    CH {ch.id.substring(0, 4)}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-neutral-950/60 text-rose-300 font-bold">
                    {ch.roll}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold font-mono tracking-tight truncate">
                    {ch.name}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                    Vol: {Math.round(ch.vol * 100)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Channel Strip & Ratchet Rolls */}
        <div className="lg:col-span-4 bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <div>
              <span className="text-[9px] font-mono font-bold text-rose-400 uppercase">
                SELECTED PAD
              </span>
              <h4 className="text-sm font-black text-white font-mono">{selectedChannel.name}</h4>
            </div>
            <button
              onClick={async () => await triggerPad(selectedChannel)}
              className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-white text-xs font-mono font-bold rounded-lg shadow"
            >
              TRIGGER
            </button>
          </div>

          {/* Ratchet Roll Selector */}
          <div>
            <label className="text-[10px] font-mono font-bold text-neutral-300 block mb-1.5 flex items-center gap-1">
              <Repeat className="w-3 h-3 text-rose-400" />
              <span>RATCHET ROLL REPEATS:</span>
            </label>
            <div className="grid grid-cols-6 gap-1">
              {(['1x', '2x', '3x', '4x', '6x', '8x'] as const).map((r) => (
                <button
                  key={r}
                  onClick={async () => {
                    updateChannel(selectedChannel.id, { roll: r });
                    await triggerPad(selectedChannel, r);
                  }}
                  className={`py-1.5 text-[10px] font-mono font-bold rounded transition ${
                    selectedChannel.roll === r
                      ? 'bg-rose-500 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Slider */}
          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Volume</span>
              <span className="text-rose-400 font-bold">
                {Math.round(selectedChannel.vol * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedChannel.vol}
              onChange={(e) => updateChannel(selectedChannel.id, { vol: Number(e.target.value) })}
              className="w-full accent-rose-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Pan Slider */}
          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Stereo Pan</span>
              <span className="text-rose-400 font-bold">
                {selectedChannel.pan === 0
                  ? 'Center'
                  : selectedChannel.pan > 0
                    ? `R ${Math.round(selectedChannel.pan * 100)}`
                    : `L ${Math.round(Math.abs(selectedChannel.pan) * 100)}`}
              </span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={selectedChannel.pan}
              onChange={(e) => updateChannel(selectedChannel.id, { pan: Number(e.target.value) })}
              className="w-full accent-rose-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Decay Slider */}
          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Decay Time</span>
              <span className="text-rose-400 font-bold">{selectedChannel.decay.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.5"
              step="0.05"
              value={selectedChannel.decay}
              onChange={(e) => updateChannel(selectedChannel.id, { decay: Number(e.target.value) })}
              className="w-full accent-rose-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
