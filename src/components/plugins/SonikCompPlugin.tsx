import React, { useState } from 'react';
import { PLUGIN_REGISTRY } from '../../audio/pluginEngine';
import { Activity, Power, Sliders, Volume2 } from 'lucide-react';

interface SonikCompPluginProps {
  bypassed?: boolean;
  onToggleBypass?: () => void;
}

export const SonikCompPlugin: React.FC<SonikCompPluginProps> = ({
  bypassed = false,
  onToggleBypass,
}) => {
  const pluginDef = PLUGIN_REGISTRY['sonik-comp'];
  const [activePresetId, setActivePresetId] = useState<string>(pluginDef.presets[0].id);

  const [params, setParams] = useState({
    mode: 'PUNCH',
    threshold: -18,
    ratio: 4.0,
    attack: 0.02,
    release: 0.12,
    makeup: 3.5,
    mix: 1.0,
  });

  const updateParam = (key: string, val: any) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div
      className={`bg-neutral-950 border rounded-2xl p-5 shadow-2xl transition-all ${bypassed ? 'opacity-50 border-neutral-800' : 'border-indigo-500/30'}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-850 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wider uppercase font-mono">
                SONIK DYNAMICS COMP
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold">
                STUDIO COMPRESSOR
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              VCA, FET, Bus Glue, and Punch modes with Gain Reduction metering
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
              className="bg-transparent text-xs font-bold text-indigo-400 outline-none cursor-pointer"
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
                  : 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Selector & Gain Reduction Meter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-5">
        <div className="md:col-span-8 bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="text-[10px] font-mono font-bold text-indigo-400 uppercase mb-2">
            CIRCUIT TOPOLOGY
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['VCA', 'FET', 'BUS', 'PUNCH'] as const).map((m) => (
              <button
                key={m}
                onClick={() => updateParam('mode', m)}
                className={`py-2 text-xs font-mono font-bold rounded-lg transition ${
                  params.mode === m
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Gain Reduction Meter */}
        <div className="md:col-span-4 bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex justify-between text-[10px] font-mono text-neutral-400">
            <span>GAIN REDUCTION (GR)</span>
            <span className="text-rose-400 font-bold">-4.2 dB</span>
          </div>
          <div className="w-full bg-neutral-950 h-3 rounded-full overflow-hidden p-0.5 border border-neutral-800 flex justify-end">
            <div className="h-full bg-gradient-to-l from-rose-500 to-amber-500 rounded-full w-[45%]" />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-neutral-500">
            <span>-20dB</span>
            <span>-12dB</span>
            <span>-6dB</span>
            <span>0dB</span>
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 space-y-2">
          <div className="flex justify-between text-[11px] font-mono text-neutral-300">
            <span>Threshold</span>
            <span className="text-indigo-400 font-bold">{params.threshold} dB</span>
          </div>
          <input
            type="range"
            min="-36"
            max="0"
            step="1"
            value={params.threshold}
            onChange={(e) => updateParam('threshold', Number(e.target.value))}
            className="w-full accent-indigo-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 space-y-2">
          <div className="flex justify-between text-[11px] font-mono text-neutral-300">
            <span>Ratio</span>
            <span className="text-indigo-400 font-bold">{params.ratio}:1</span>
          </div>
          <input
            type="range"
            min="1.5"
            max="12"
            step="0.5"
            value={params.ratio}
            onChange={(e) => updateParam('ratio', Number(e.target.value))}
            className="w-full accent-indigo-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 space-y-2">
          <div className="flex justify-between text-[11px] font-mono text-neutral-300">
            <span>Attack</span>
            <span className="text-indigo-400 font-bold">{Math.round(params.attack * 1000)} ms</span>
          </div>
          <input
            type="range"
            min="0.001"
            max="0.08"
            step="0.002"
            value={params.attack}
            onChange={(e) => updateParam('attack', Number(e.target.value))}
            className="w-full accent-indigo-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 space-y-2">
          <div className="flex justify-between text-[11px] font-mono text-neutral-300">
            <span>Makeup Gain</span>
            <span className="text-indigo-400 font-bold">+{params.makeup} dB</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={params.makeup}
            onChange={(e) => updateParam('makeup', Number(e.target.value))}
            className="w-full accent-indigo-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
