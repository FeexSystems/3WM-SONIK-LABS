import React, { useState } from 'react';
import { Sliders, Check, Volume2, Sparkles, Activity } from 'lucide-react';
import { landingAudioEngine } from '../../../audio/landingAudioEngine';

export interface EQBand {
  id: string;
  name: string;
  frequency: number; // Hz
  gain: number; // dB (-12 to +12)
  q: number; // 0.1 to 10
  type: 'bell' | 'lowshelf' | 'highshelf' | 'notch';
}

interface EmarSpectrumWidgetProps {
  initialBands?: EQBand[];
  targetHz?: number;
  gainDb?: number;
  onApplyToDaw?: (bands: EQBand[]) => void;
}

const DEFAULT_BANDS: EQBand[] = [
  { id: 'b1', name: 'Sub Tighten', frequency: 32, gain: -2.5, q: 1.2, type: 'lowshelf' },
  { id: 'b2', name: 'Log Drum Clarity', frequency: 220, gain: -3.0, q: 2.8, type: 'notch' },
  { id: 'b3', name: 'Vocal Body', frequency: 1200, gain: 1.8, q: 1.0, type: 'bell' },
  { id: 'b4', name: 'Transient Snap', frequency: 4500, gain: 2.2, q: 1.4, type: 'bell' },
  { id: 'b5', name: 'Air Shimmer', frequency: 12000, gain: 3.5, q: 0.8, type: 'highshelf' },
];

export const EmarSpectrumWidget: React.FC<EmarSpectrumWidgetProps> = ({
  initialBands = DEFAULT_BANDS,
  targetHz,
  gainDb,
  onApplyToDaw,
}) => {
  const [bands, setBands] = useState<EQBand[]>(() => {
    if (targetHz !== undefined && gainDb !== undefined) {
      return initialBands.map((b) =>
        Math.abs(b.frequency - targetHz) < 100 ? { ...b, frequency: targetHz, gain: gainDb } : b
      );
    }
    return initialBands;
  });

  const [activeBandId, setActiveBandId] = useState<string>('b2');
  const [isApplied, setIsApplied] = useState<boolean>(false);
  const [isPlayingTest, setIsPlayingTest] = useState<boolean>(false);

  const activeBand = bands.find((b) => b.id === activeBandId) || bands[1];

  const updateActiveBand = (updates: Partial<EQBand>) => {
    setBands((prev) => prev.map((b) => (b.id === activeBandId ? { ...b, ...updates } : b)));
    setIsApplied(false);
  };

  const handleAudition = () => {
    setIsPlayingTest(true);
    landingAudioEngine.playMelodicChord(0);
    setTimeout(() => setIsPlayingTest(false), 1200);
  };

  const handleCommit = () => {
    setIsApplied(true);
    if (onApplyToDaw) {
      onApplyToDaw(bands);
    }
  };

  // Generate SVG path for the EQ curve approximation
  const width = 460;
  const height = 140;
  const points = bands.map((b) => {
    // Map log freq (20Hz to 20kHz) to x (0 to width)
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    const x = ((Math.log10(b.frequency) - minLog) / (maxLog - minLog)) * (width - 40) + 20;
    // Map gain (-12dB to +12dB) to y (height to 0)
    const y = height / 2 - (b.gain / 12) * (height / 2 - 16);
    return { x, y, band: b };
  });

  // Construct smooth SVG Bezier path
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (pt.x - prev.x) / 2;
    const cpx2 = prev.x + (pt.x - prev.x) / 2;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-[#0d1410] p-4 text-emerald-100 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Activity className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
              Emar Acoustic DSP Filter
            </h4>
            <p className="text-[11px] text-zinc-400">
              Parametric Spectral Reshaping & Resonant Notch
            </p>
          </div>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2.5 py-0.5 font-mono text-[10px] text-emerald-300">
          Scientist DSP
        </span>
      </div>

      {/* SVG Interactive Curve */}
      <div className="relative mb-3 overflow-hidden rounded-lg border border-emerald-900/50 bg-[#090e0b]">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full select-none">
          {/* Grid lines */}
          <line
            x1="0"
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="#1e2f24"
            strokeDasharray="3 3"
          />
          <line
            x1={width * 0.25}
            y1="0"
            x2={width * 0.25}
            y2={height}
            stroke="#1e2f24"
            strokeDasharray="2 4"
          />
          <line
            x1={width * 0.5}
            y1="0"
            x2={width * 0.5}
            y2={height}
            stroke="#1e2f24"
            strokeDasharray="2 4"
          />
          <line
            x1={width * 0.75}
            y1="0"
            x2={width * 0.75}
            y2={height}
            stroke="#1e2f24"
            strokeDasharray="2 4"
          />

          {/* Area under curve */}
          <path
            d={`${pathD} L ${width - 20} ${height} L 20 ${height} Z`}
            fill="url(#emarGlowGrad)"
            opacity="0.25"
          />

          {/* Curve stroke */}
          <path d={pathD} fill="none" stroke="#2AFFA3" strokeWidth="2.5" strokeLinecap="round" />

          {/* Linear Gradient definition */}
          <defs>
            <linearGradient id="emarGlowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2AFFA3" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2AFFA3" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Interactive Band Nodes */}
          {points.map((pt) => {
            const isSelected = pt.band.id === activeBandId;
            return (
              <g
                key={pt.band.id}
                className="cursor-pointer transition-transform hover:scale-110"
                onClick={() => setActiveBandId(pt.band.id)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 7 : 5}
                  className={
                    isSelected
                      ? 'fill-emerald-400 stroke-white'
                      : 'fill-emerald-800 stroke-emerald-500'
                  }
                  strokeWidth={isSelected ? '2' : '1'}
                />
                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  className="fill-emerald-300 font-mono text-[9px] font-bold"
                >
                  {pt.band.frequency >= 1000
                    ? `${(pt.band.frequency / 1000).toFixed(1)}k`
                    : `${pt.band.frequency}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Band Controls */}
      <div className="mb-3 rounded-lg border border-emerald-950 bg-black/40 p-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-emerald-300">
            Selected: <span className="text-white">{activeBand.name}</span>
          </span>
          <span className="font-mono text-[11px] text-zinc-400">
            {activeBand.frequency} Hz |{' '}
            {activeBand.gain > 0 ? `+${activeBand.gain}` : activeBand.gain} dB | Q:{' '}
            {activeBand.q.toFixed(1)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Frequency Slider */}
          <div>
            <label className="block font-mono text-[10px] text-zinc-400">Frequency</label>
            <input
              type="range"
              min="20"
              max="20000"
              value={activeBand.frequency}
              onChange={(e) => updateActiveBand({ frequency: Number(e.target.value) })}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-emerald-950 accent-emerald-400"
            />
          </div>

          {/* Gain Slider */}
          <div>
            <label className="block font-mono text-[10px] text-zinc-400">Gain (dB)</label>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={activeBand.gain}
              onChange={(e) => updateActiveBand({ gain: Number(e.target.value) })}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-emerald-950 accent-emerald-400"
            />
          </div>

          {/* Q Factor */}
          <div>
            <label className="block font-mono text-[10px] text-zinc-400">Q-Factor</label>
            <input
              type="range"
              min="0.2"
              max="8.0"
              step="0.1"
              value={activeBand.q}
              onChange={(e) => updateActiveBand({ q: Number(e.target.value) })}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-emerald-950 accent-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={handleAudition}
          disabled={isPlayingTest}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-900/60"
        >
          <Volume2
            className={`h-3.5 w-3.5 ${isPlayingTest ? 'animate-bounce text-emerald-200' : ''}`}
          />
          {isPlayingTest ? 'Auditioning...' : 'Audition DSP'}
        </button>

        <button
          onClick={handleCommit}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
            isApplied
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
              : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black hover:opacity-95'
          }`}
        >
          {isApplied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Applied to DAW Track
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Commit Curve to Track
            </>
          )}
        </button>
      </div>
    </div>
  );
};
