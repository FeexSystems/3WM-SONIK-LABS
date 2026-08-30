import React, { useState } from 'react';
import { Mic2, Volume2, Check, Sparkles, Layers, Sliders } from 'lucide-react';
import { landingAudioEngine } from '../../../audio/landingAudioEngine';

export interface VocalVoice {
  id: string;
  label: string;
  interval: string;
  volume: number; // 0 to 100
  pan: number; // -100 to +100
  enabled: boolean;
}

interface KingpinVocalWidgetProps {
  scaleKey?: string;
  initialSpeed?: number;
  onApplyToDaw?: (config: { scaleKey: string; retuneSpeed: number; voices: VocalVoice[] }) => void;
}

const DEFAULT_VOICES: VocalVoice[] = [
  { id: 'v1', label: 'Lead Voice', interval: 'Unison (0 st)', volume: 100, pan: 0, enabled: true },
  {
    id: 'v2',
    label: 'High Harmony',
    interval: '+3rd / +4 Semitones',
    volume: 75,
    pan: -40,
    enabled: true,
  },
  {
    id: 'v3',
    label: 'Low Soul Bass',
    interval: '-5th / -7 Semitones',
    volume: 65,
    pan: 40,
    enabled: true,
  },
  {
    id: 'v4',
    label: 'Air Choir Stack',
    interval: '+1 Octave (+12 st)',
    volume: 50,
    pan: 0,
    enabled: false,
  },
];

export const KingpinVocalWidget: React.FC<KingpinVocalWidgetProps> = ({
  scaleKey = 'F# Minor',
  initialSpeed = 12,
  onApplyToDaw,
}) => {
  const [key, setKey] = useState<string>(scaleKey);
  const [retuneSpeed, setRetuneSpeed] = useState<number>(initialSpeed);
  const [formant, setFormant] = useState<number>(0);
  const [voices, setVoices] = useState<VocalVoice[]>(DEFAULT_VOICES);
  const [isAuditioning, setIsAuditioning] = useState<boolean>(false);
  const [isApplied, setIsApplied] = useState<boolean>(false);

  const toggleVoice = (id: string) => {
    setVoices((prev) => prev.map((v) => (v.id === id ? { ...v, enabled: !v.enabled } : v)));
    setIsApplied(false);
  };

  const updateVoice = (id: string, updates: Partial<VocalVoice>) => {
    setVoices((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
    setIsApplied(false);
  };

  const handleAudition = () => {
    setIsAuditioning(true);
    landingAudioEngine.playVocalChant(0);
    setTimeout(() => setIsAuditioning(false), 1400);
  };

  const handleCommit = () => {
    setIsApplied(true);
    if (onApplyToDaw) {
      onApplyToDaw({ scaleKey: key, retuneSpeed, voices });
    }
  };

  return (
    <div className="rounded-xl border border-red-500/30 bg-[#160a08] p-4 text-red-100 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
            <Mic2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-red-400">
              Kingpin Vocal Architecture
            </h4>
            <p className="text-[11px] text-zinc-400">3-Part Modal Harmony & Pitch Retune Matrix</p>
          </div>
        </div>
        <span className="rounded-full border border-red-500/30 bg-red-950/60 px-2.5 py-0.5 font-mono text-[10px] text-red-300">
          Vocal Oracle
        </span>
      </div>

      {/* Harmony Stacks */}
      <div className="mb-3 space-y-2 rounded-lg border border-red-950/70 bg-black/50 p-2.5">
        {voices.map((voice) => (
          <div
            key={voice.id}
            className={`flex items-center justify-between rounded-lg p-2 transition-colors ${
              voice.enabled ? 'bg-red-950/30 border border-red-900/40' : 'bg-zinc-900/40 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={voice.enabled}
                onChange={() => toggleVoice(voice.id)}
                className="h-4 w-4 rounded border-red-900 bg-red-950 accent-red-500"
              />
              <div>
                <span className="block font-mono text-xs font-bold text-zinc-200">
                  {voice.label}
                </span>
                <span className="font-mono text-[10px] text-red-400">{voice.interval}</span>
              </div>
            </div>

            {voice.enabled && (
              <div className="flex items-center gap-3">
                <div className="w-20">
                  <label className="block font-mono text-[9px] text-zinc-400">
                    Level: {voice.volume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={voice.volume}
                    onChange={(e) => updateVoice(voice.id, { volume: Number(e.target.value) })}
                    className="h-1 w-full cursor-pointer appearance-none rounded bg-red-950 accent-red-400"
                  />
                </div>
                <div className="w-16 text-right font-mono text-[10px] text-zinc-400">
                  {voice.pan === 0
                    ? 'C'
                    : voice.pan < 0
                      ? `L${Math.abs(voice.pan)}`
                      : `R${voice.pan}`}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tuning Controls */}
      <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg border border-red-950 bg-black/40 p-2.5">
        <div>
          <label className="block font-mono text-[10px] text-zinc-400">Scale Key</label>
          <select
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full rounded border border-red-900/60 bg-red-950/60 p-1 font-mono text-xs text-red-200"
          >
            <option value="F# Minor">F# Minor (Afrobeat)</option>
            <option value="C Major">C Major (Highlife)</option>
            <option value="G Minor">G Minor (Amapiano)</option>
            <option value="D Minor">D Minor (Drill/Soul)</option>
            <option value="B Minor">B Minor (Afro-Fusion)</option>
          </select>
        </div>

        <div>
          <label className="block font-mono text-[10px] text-zinc-400">
            Retune Speed: <span className="text-red-300 font-bold">{retuneSpeed}ms</span>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={retuneSpeed}
            onChange={(e) => setRetuneSpeed(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-red-950 accent-red-400"
          />
        </div>

        <div>
          <label className="block font-mono text-[10px] text-zinc-400">
            Formant Shift:{' '}
            <span className="text-red-300 font-bold">
              {formant > 0 ? `+${formant}` : formant} st
            </span>
          </label>
          <input
            type="range"
            min="-12"
            max="12"
            value={formant}
            onChange={(e) => setFormant(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-red-950 accent-red-400"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={handleAudition}
          disabled={isAuditioning}
          className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-900/60"
        >
          <Volume2
            className={`h-3.5 w-3.5 ${isAuditioning ? 'animate-bounce text-red-200' : ''}`}
          />
          {isAuditioning ? 'Auditioning Voice...' : 'Audition Harmonies'}
        </button>

        <button
          onClick={handleCommit}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
            isApplied
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-gradient-to-r from-red-600 to-amber-500 text-white hover:opacity-95'
          }`}
        >
          {isApplied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Stack Applied to Vocal Bus
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Inject Harmony Stack
            </>
          )}
        </button>
      </div>
    </div>
  );
};
