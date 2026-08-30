import React, { useState } from 'react';
import { Eight08Parameters, PluginPreset } from '../../types';
import { PLUGIN_REGISTRY, sonik808Engine } from '../../audio/pluginEngine';
import { soundEngine } from '../../audio/engine';
import {
  Zap,
  Flame,
  Volume2,
  Sliders,
  Sparkles,
  Music,
  Power,
  RotateCcw,
  Check,
  ChevronDown,
} from 'lucide-react';

interface Eight08LabPluginProps {
  parameters?: Partial<Eight08Parameters>;
  onUpdateParameters?: (params: Partial<Eight08Parameters>) => void;
  bypassed?: boolean;
  onToggleBypass?: () => void;
}

export const Eight08LabPlugin: React.FC<Eight08LabPluginProps> = ({
  parameters = {},
  onUpdateParameters,
  bypassed = false,
  onToggleBypass,
}) => {
  const pluginDef = PLUGIN_REGISTRY['808-lab'];
  const defaultPreset = pluginDef.presets[0];

  const [params, setParams] = useState<Eight08Parameters>({
    mode: 'DEEP',
    waveform: 'sine',
    glideTime: 85,
    glideCurve: 'exponential',
    legato: true,
    punchAttack: 0.75,
    decay: 1.8,
    sustain: 0.45,
    release: 0.25,
    saturationMode: 'Tape',
    drive: 0.42,
    subBoost: 3.5,
    harmonicLevel: 0.35,
    filterCutoff: 4500,
    filterResonance: 1.5,
    monoRetrigger: true,
    scaleLock: true,
    rootKey: 'F',
    scale: 'Natural Minor',
    ...defaultPreset.parameters,
    ...parameters,
  });

  const [activePresetId, setActivePresetId] = useState<string>(defaultPreset.id);
  const [lastAuditionedNote, setLastAuditionedNote] = useState<string | null>(null);

  const updateParam = <K extends keyof Eight08Parameters>(key: K, value: Eight08Parameters[K]) => {
    const next = { ...params, [key]: value };
    setParams(next);
    if (onUpdateParameters) {
      onUpdateParameters(next);
    }
  };

  const handleSelectPreset = (preset: PluginPreset) => {
    setActivePresetId(preset.id);
    const next = { ...params, ...preset.parameters };
    setParams(next);
    if (onUpdateParameters) {
      onUpdateParameters(next);
    }
  };

  const testTrigger = async (pitch: number, noteName: string) => {
    await soundEngine.init();
    sonik808Engine.trigger808Note(pitch, 120, params.decay, params);
    setLastAuditionedNote(noteName);
    setTimeout(() => setLastAuditionedNote(null), 300);
  };

  return (
    <div
      className={`bg-neutral-950 border rounded-2xl p-5 shadow-2xl transition-all ${bypassed ? 'opacity-50 border-neutral-800' : 'border-amber-500/30'}`}
    >
      {/* Plugin Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-850 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wider uppercase font-mono">
                SONIK 808 LAB
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                PRO DSP v1.0
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Trap, Drill & Afrofusion 808 synthesizer with True Pitch Glide
            </p>
          </div>
        </div>

        {/* Preset Selector & Bypass */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-1">
            <span className="text-[10px] font-mono text-neutral-400 mr-2 uppercase font-bold">
              PRESET:
            </span>
            <select
              value={activePresetId}
              onChange={(e) => {
                const found = pluginDef.presets.find((p) => p.id === e.target.value);
                if (found) handleSelectPreset(found);
              }}
              className="bg-transparent text-xs font-bold text-amber-400 outline-none cursor-pointer"
            >
              {pluginDef.presets.map((p) => (
                <option key={p.id} value={p.id} className="bg-neutral-900 text-white">
                  {p.name} ({p.category})
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
                  : 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
              }`}
              title={bypassed ? 'Enable 808 Plugin' : 'Bypass 808 Plugin'}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Column 1: Mode & Pitch Glide Engine */}
        <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              <span>PITCH & GLIDE</span>
            </span>
            <button
              onClick={() => updateParam('legato', !params.legato)}
              className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold transition ${
                params.legato ? 'bg-amber-400 text-black' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {params.legato ? 'LEGATO ON' : 'LEGATO OFF'}
            </button>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Glide Portamento</span>
              <span className="text-amber-400 font-bold">{params.glideTime} ms</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={params.glideTime}
              onChange={(e) => updateParam('glideTime', Number(e.target.value))}
              aria-label="808 pitch glide time"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={params.glideTime}
              aria-valuetext={`${params.glideTime} milliseconds`}
              className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Punch Transient</span>
              <span className="text-amber-400 font-bold">
                {Math.round(params.punchAttack * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={params.punchAttack}
              onChange={(e) => updateParam('punchAttack', Number(e.target.value))}
              aria-label="808 punch transient attack"
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={params.punchAttack}
              aria-valuetext={`${Math.round(params.punchAttack * 100)} percent`}
              className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-neutral-400 block mb-1">WAVEFORM</label>
            <div className="grid grid-cols-3 gap-1">
              {(['sine', 'triangle', 'sawtooth'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => updateParam('waveform', w)}
                  className={`py-1 text-[10px] font-mono rounded capitalize font-bold transition ${
                    params.waveform === w
                      ? 'bg-amber-400 text-black'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: ADSR Envelope */}
        <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-xl p-3.5 space-y-3">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
            <Sliders className="w-3 h-3" />
            <span>ADSR ENVELOPE</span>
          </span>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Decay Time</span>
              <span className="text-amber-400 font-bold">{params.decay.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.5"
              step="0.1"
              value={params.decay}
              onChange={(e) => updateParam('decay', Number(e.target.value))}
              aria-label="808 decay time"
              aria-valuemin={0.2}
              aria-valuemax={3.5}
              aria-valuenow={params.decay}
              aria-valuetext={`${params.decay.toFixed(1)} seconds`}
              className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Sustain Level</span>
              <span className="text-amber-400 font-bold">{Math.round(params.sustain * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={params.sustain}
              onChange={(e) => updateParam('sustain', Number(e.target.value))}
              aria-label="808 sustain level"
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={params.sustain}
              aria-valuetext={`${Math.round(params.sustain * 100)} percent`}
              className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Release</span>
              <span className="text-amber-400 font-bold">{params.release.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.5"
              step="0.05"
              value={params.release}
              onChange={(e) => updateParam('release', Number(e.target.value))}
              aria-label="808 release time"
              aria-valuemin={0.05}
              aria-valuemax={1.5}
              aria-valuenow={params.release}
              aria-valuetext={`${params.release.toFixed(2)} seconds`}
              className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Column 3: Saturation & Dirt Stage */}
        <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-xl p-3.5 space-y-3">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-orange-400" />
            <span>SATURATION / DIRT</span>
          </span>

          <div>
            <label className="text-[10px] font-mono text-neutral-400 block mb-1">
              CIRCUIT TYPE
            </label>
            <div className="grid grid-cols-4 gap-1">
              {(['Soft', 'Tape', 'Tube', 'Fold'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => updateParam('saturationMode', m)}
                  className={`py-1 text-[9px] font-mono rounded font-bold transition ${
                    params.saturationMode === m
                      ? 'bg-orange-500 text-black'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Drive Intensity</span>
              <span className="text-orange-400 font-bold">{Math.round(params.drive * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={params.drive}
              onChange={(e) => updateParam('drive', Number(e.target.value))}
              aria-label="808 drive intensity"
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={params.drive}
              aria-valuetext={`${Math.round(params.drive * 100)} percent`}
              className="w-full accent-orange-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Harmonic Mid Boost</span>
              <span className="text-orange-400 font-bold">
                {Math.round(params.harmonicLevel * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={params.harmonicLevel}
              onChange={(e) => updateParam('harmonicLevel', Number(e.target.value))}
              aria-label="808 harmonic mid boost"
              aria-valuemin={0}
              aria-valuemax={1}
              aria-valuenow={params.harmonicLevel}
              aria-valuetext={`${Math.round(params.harmonicLevel * 100)} percent`}
              className="w-full accent-orange-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Column 4: Sub-Boost & Filter */}
        <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-xl p-3.5 space-y-3">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
            <Volume2 className="w-3 h-3 text-cyan-400" />
            <span>SUB-BOOST & FILTER</span>
          </span>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>45Hz Sub Weight</span>
              <span className="text-cyan-400 font-bold">+{params.subBoost.toFixed(1)} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={params.subBoost}
              onChange={(e) => updateParam('subBoost', Number(e.target.value))}
              aria-label="808 sub bass weight at 45 hertz"
              aria-valuemin={0}
              aria-valuemax={12}
              aria-valuenow={params.subBoost}
              aria-valuetext={`+${params.subBoost.toFixed(1)} decibels`}
              className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Lowpass Cutoff</span>
              <span className="text-cyan-400 font-bold">{Math.round(params.filterCutoff)} Hz</span>
            </div>
            <input
              type="range"
              min="500"
              max="10000"
              step="100"
              value={params.filterCutoff}
              onChange={(e) => updateParam('filterCutoff', Number(e.target.value))}
              aria-label="808 lowpass filter cutoff frequency"
              aria-valuemin={500}
              aria-valuemax={10000}
              aria-valuenow={params.filterCutoff}
              aria-valuetext={`${Math.round(params.filterCutoff)} hertz`}
              className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span>Mono Retrigger:</span>
            <span className="text-emerald-400 font-bold">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* 808 Pitch Key Audition Bar */}
      <div className="mt-4 pt-3 border-t border-neutral-850 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
          <Music className="w-3 h-3 text-amber-400" />
          <span>AUDITION 808 PITCH:</span>
        </span>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { name: 'C1', pitch: 36 },
            { name: 'D1', pitch: 38 },
            { name: 'E1', pitch: 40 },
            { name: 'F1', pitch: 41 },
            { name: 'G1', pitch: 43 },
            { name: 'A1', pitch: 45 },
            { name: 'B1', pitch: 47 },
            { name: 'C2', pitch: 48 },
          ].map((k) => (
            <button
              key={k.name}
              onClick={async () => await testTrigger(k.pitch, k.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shadow ${
                lastAuditionedNote === k.name
                  ? 'bg-amber-400 text-black scale-105'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800'
              }`}
            >
              {k.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
