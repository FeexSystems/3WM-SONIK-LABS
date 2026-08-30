import React, { useState } from 'react';
import { PLUGIN_REGISTRY } from '../../audio/pluginEngine';
import { Sliders, Power, RotateCcw, Activity } from 'lucide-react';

interface SonikEqPluginProps {
  bypassed?: boolean;
  onToggleBypass?: () => void;
}

export const SonikEqPlugin: React.FC<SonikEqPluginProps> = ({
  bypassed = false,
  onToggleBypass,
}) => {
  const pluginDef = PLUGIN_REGISTRY['sonik-eq'];
  const [activePresetId, setActivePresetId] = useState<string>(pluginDef.presets[0].id);

  const [params, setParams] = useState({
    hpf: 30,
    lowGain: 1.5,
    lowFreq: 100,
    midGain: -1.0,
    midFreq: 1200,
    midQ: 1.2,
    highGain: 2.0,
    highFreq: 9500,
  });

  const updateParam = (key: string, val: number) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div
      className={`bg-neutral-950 border rounded-2xl p-5 shadow-2xl transition-all ${bypassed ? 'opacity-50 border-neutral-800' : 'border-emerald-500/30'}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-850 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wider uppercase font-mono">
                SONIK 5-BAND STUDIO EQ
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                PARAMETRIC DSP
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              High-Pass Filter, Low-Shelf, Dual Mid Parametric Bells, High-Shelf
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-1">
            <span className="text-[10px] font-mono text-neutral-400 mr-2 uppercase font-bold">
              PRESET:
            </span>
            <select
              value={activePresetId}
              onChange={(e) => {
                setActivePresetId(e.target.value);
                const p = pluginDef.presets.find((pr) => pr.id === e.target.value);
                if (p) setParams((prev) => ({ ...prev, ...p.parameters }));
              }}
              className="bg-transparent text-xs font-bold text-emerald-400 outline-none cursor-pointer"
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
                  : 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Visual EQ Response Curve */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 mb-5 relative overflow-hidden h-32 flex items-center justify-center">
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 opacity-15 pointer-events-none">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="border border-neutral-700" />
          ))}
        </div>
        {/* Synthetic EQ curve SVG */}
        <svg
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 500 100"
        >
          <path
            d={`M 0 50 Q 80 ${50 - params.lowGain * 2.5} 180 50 T 320 ${50 - params.midGain * 2.5} T 500 ${50 - params.highGain * 2.5}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          />
        </svg>
        <div className="absolute bottom-2 left-4 text-[9px] font-mono text-neutral-500 flex gap-6">
          <span>20Hz (HPF: {params.hpf}Hz)</span>
          <span>100Hz (Low: {params.lowGain > 0 ? `+${params.lowGain}` : params.lowGain}dB)</span>
          <span>1kHz (Mid: {params.midGain > 0 ? `+${params.midGain}` : params.midGain}dB)</span>
          <span>
            10kHz (High: {params.highGain > 0 ? `+${params.highGain}` : params.highGain}dB)
          </span>
        </div>
      </div>

      {/* EQ Knobs / Bands Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Band 1: High Pass */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 space-y-2">
          <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
            1. HIGH PASS FILTER
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Cutoff</span>
              <span className="text-emerald-400 font-bold">{params.hpf} Hz</span>
            </div>
            <input
              type="range"
              min="20"
              max="350"
              step="5"
              value={params.hpf}
              onChange={(e) => updateParam('hpf', Number(e.target.value))}
              aria-label="High pass filter cutoff frequency"
              aria-valuemin={20}
              aria-valuemax={350}
              aria-valuenow={params.hpf}
              aria-valuetext={`${params.hpf} Hertz`}
              className="w-full accent-emerald-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Band 2: Low Shelf */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 space-y-2">
          <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
            2. LOW SHELF
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Gain</span>
              <span className="text-emerald-400 font-bold">
                {params.lowGain > 0 ? `+${params.lowGain}` : params.lowGain} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={params.lowGain}
              onChange={(e) => updateParam('lowGain', Number(e.target.value))}
              aria-label="Low shelf gain"
              aria-valuemin={-12}
              aria-valuemax={12}
              aria-valuenow={params.lowGain}
              aria-valuetext={`${params.lowGain > 0 ? '+' : ''}${params.lowGain} decibels`}
              className="w-full accent-emerald-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Band 3: Mid Bell */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 space-y-2">
          <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
            3. MID BELL
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Gain</span>
              <span className="text-emerald-400 font-bold">
                {params.midGain > 0 ? `+${params.midGain}` : params.midGain} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={params.midGain}
              onChange={(e) => updateParam('midGain', Number(e.target.value))}
              className="w-full accent-emerald-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Band 4: High Shelf */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 space-y-2">
          <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase">
            4. HIGH SHELF
          </div>
          <div>
            <div className="flex justify-between text-[11px] font-mono text-neutral-300 mb-1">
              <span>Gain</span>
              <span className="text-emerald-400 font-bold">
                {params.highGain > 0 ? `+${params.highGain}` : params.highGain} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={params.highGain}
              onChange={(e) => updateParam('highGain', Number(e.target.value))}
              className="w-full accent-emerald-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
