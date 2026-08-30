import React, { useState } from 'react';
import { Track } from '../types';
import { Sparkles, Sliders, Shield, Zap, Check, Gauge } from 'lucide-react';

interface Props {
  track: Track;
  onApplyMasterPreset: (
    preset: 'Afrofusion Warmth' | 'Radio Ready' | 'Lagos Bounce' | 'Shrine Gold'
  ) => Promise<void>;
  isLoading: boolean;
}

const masteringPresets = [
  {
    name: 'Lagos Bounce',
    desc: 'Deep punchy low-end at 55Hz, tight transient control, energetic high-hat crispness, -13.6 LUFS.',
    tag: 'CLUB / STREAMING POPULAR',
    color: 'border-amber-500/60 bg-amber-500/5',
  },
  {
    name: 'Afrofusion Warmth',
    desc: 'Analog tape saturation, harmonic overtone richness for brass and percussion, -14.2 LUFS.',
    tag: 'SIGNATURE SOUND',
    color: 'border-orange-500/60 bg-orange-500/5',
  },
  {
    name: 'Radio Ready',
    desc: 'High dynamic compression, forward vocal presence, ultra-clean stereo width, -13.0 LUFS.',
    tag: 'BROADCAST HIT',
    color: 'border-cyan-500/60 bg-cyan-500/5',
  },
  {
    name: 'Shrine Gold',
    desc: 'Vintage Kalakuta tube saturation, spacious ambient room reflection, and silky high-end.',
    tag: 'VINTAGE LEGACY',
    color: 'border-purple-500/60 bg-purple-500/5',
  },
];

export const OzoneMasteringTab: React.FC<Props> = ({ track, onApplyMasterPreset, isLoading }) => {
  const currentPreset = track.settings.mastering.preset;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-neutral-100 uppercase tracking-tight">
              Ozone 11 & T-RackS Automated Mastering Suite
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Automated multi-band dynamics, analog tape warmth modeling, and streaming loudness
            compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-neutral-950 px-3 py-2 rounded-lg border border-neutral-800 text-center">
            <span className="text-[10px] text-neutral-500 font-mono block">ACTIVE PRESET</span>
            <span className="text-xs font-bold text-amber-400">{currentPreset}</span>
          </div>
          <div className="bg-neutral-950 px-3 py-2 rounded-lg border border-neutral-800 text-center">
            <span className="text-[10px] text-neutral-500 font-mono block">TARGET LOUDNESS</span>
            <span className="text-xs font-bold text-cyan-400">
              {track.settings.mastering.targetLufs} LUFS
            </span>
          </div>
        </div>
      </div>

      {/* Preset Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
          Select Afrofusion Mastering Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {masteringPresets.map((p) => {
            const isSelected = currentPreset === p.name;
            return (
              <div
                key={p.name}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? `${p.color} ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/10`
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {p.tag}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <h4 className="font-bold text-sm text-neutral-100 mt-1 mb-1.5">{p.name}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">{p.desc}</p>
                </div>

                <button
                  onClick={() => onApplyMasterPreset(p.name as any)}
                  disabled={isLoading}
                  className={`mt-4 w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'ACTIVE ON MASTER' : 'ENGAGE PRESET'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hardware Emulation Rack Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Module 1: Ozone Dynamic Maximizer */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-xs font-bold text-neutral-200 uppercase">Ozone 11 Maximizer</span>
            <span className="text-[10px] font-mono text-emerald-400">ONLINE</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>Limiter Ceiling</span>
              <span className="text-amber-400">{track.settings.mastering.limiterCeiling} dB</span>
            </div>
            <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
              <div className="bg-amber-500 h-full w-[90%]" />
            </div>

            <div className="flex justify-between text-xs font-mono text-neutral-400 pt-1">
              <span>Transient Recovery</span>
              <span className="text-cyan-400">Fast (Afrobeats Mode)</span>
            </div>
          </div>
        </div>

        {/* Module 2: T-RackS Vintage Tube Saturation */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-xs font-bold text-neutral-200 uppercase">
              T-RackS Analog Warmth
            </span>
            <span className="text-[10px] font-mono text-amber-400">TUBE DRIVEN</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>Harmonic Drive</span>
              <span className="text-orange-400">{track.settings.mastering.warmthSaturation}%</span>
            </div>
            <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="bg-orange-500 h-full transition-all duration-300"
                style={{ width: `${track.settings.mastering.warmthSaturation}%` }}
              />
            </div>

            <div className="flex justify-between text-xs font-mono text-neutral-400 pt-1">
              <span>Tape Bias</span>
              <span className="text-neutral-300">+3.0 dB High-Headroom</span>
            </div>
          </div>
        </div>

        {/* Module 3: Stereo Imager & Mono Bass Focus */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-xs font-bold text-neutral-200 uppercase">
              Stereo Imager & Focus
            </span>
            <span className="text-[10px] font-mono text-purple-400">PHASE ALIGNED</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>Stereo Width</span>
              <span className="text-purple-400">{track.settings.mastering.stereoWidth}%</span>
            </div>
            <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="bg-purple-500 h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (track.settings.mastering.stereoWidth / 150) * 100)}%`,
                }}
              />
            </div>

            <div className="flex justify-between text-xs font-mono text-neutral-400 pt-1">
              <span>Mono Bass Below</span>
              <span className="text-neutral-300">120 Hz (Clean Log Drum)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
