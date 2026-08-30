import React from 'react';
import { Volume2 } from 'lucide-react';
import { StemTrack } from '../../types';

interface StemLaneProps {
  stem: StemTrack;
  idx: number;
  isSelected: boolean;
  isPlaying: boolean;
  currentStep: number;
  onSelect: (id: string) => void;
  onToggleMute: (id: string) => void;
  onToggleSolo: (id: string) => void;
  onVolumeChange: (id: string, vol: number) => void;
}

export const StemLane = React.memo(function StemLane({
  stem,
  idx,
  isSelected,
  isPlaying,
  currentStep,
  onSelect,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
}: StemLaneProps) {
  return (
    <div
      onClick={() => onSelect(stem.id)}
      className={`bg-neutral-900 border rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all cursor-pointer ${
        isSelected
          ? 'border-amber-500/60 ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/5'
          : 'border-neutral-800 hover:border-neutral-700'
      }`}
    >
      {/* Stem Info & Controls (Left) */}
      <div className="w-full md:w-64 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-8 rounded-full" style={{ backgroundColor: stem.color }} />
          <div>
            <h4 className="text-xs font-bold text-neutral-100">{stem.name}</h4>
            <span className="text-[10px] font-mono text-neutral-500">
              STEM 0{idx + 1} • {Math.round(stem.volume * 100)}%
            </span>
          </div>
        </div>

        {/* Mute / Solo Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute(stem.id);
            }}
            className={`w-6 h-6 rounded text-[10px] font-mono font-bold transition flex items-center justify-center ${
              stem.muted
                ? 'bg-red-500 text-neutral-950'
                : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
            title="Mute Stem"
            aria-label={`Mute ${stem.name}`}
            aria-pressed={stem.muted}
          >
            M
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSolo(stem.id);
            }}
            className={`w-6 h-6 rounded text-[10px] font-mono font-bold transition flex items-center justify-center ${
              stem.solo
                ? 'bg-amber-500 text-neutral-950'
                : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
            title="Solo Stem"
            aria-label={`Solo ${stem.name}`}
            aria-pressed={stem.solo}
          >
            S
          </button>
        </div>
      </div>

      {/* Procedural Waveform Lane (Center) */}
      <div className="flex-1 bg-neutral-950 h-16 rounded-lg border border-neutral-850 p-2 relative overflow-hidden flex items-center">
        {/* 16-Step Playhead Cursor Line */}
        {isPlaying && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 shadow-lg shadow-amber-400"
            style={{ left: `${(currentStep / 16) * 100}%` }}
            aria-hidden="true"
          />
        )}

        {/* Simulated Audio Waveform Bars */}
        <div
          className="w-full h-full flex items-center justify-between gap-1"
          role="img"
          aria-label={`Waveform for ${stem.name}`}
        >
          {Array.from({ length: 48 }).map((_, barIdx) => {
            const seed = (stem.waveformSeed + barIdx * 7) % 100;
            const heightPct = Math.max(15, (seed / 100) * 90);
            const isActive = isPlaying && Math.floor((currentStep / 16) * 48) === barIdx;
            return (
              <div
                key={barIdx}
                className="flex-1 rounded-full transition-all duration-75"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: isActive ? '#f59e0b' : `${stem.color}90`,
                }}
                aria-hidden="true"
              />
            );
          })}
        </div>
      </div>

      {/* Stem Volume Slider (Right) */}
      <div
        className="w-full md:w-32 shrink-0 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Volume2 className="w-3.5 h-3.5 text-neutral-500" aria-hidden="true" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={stem.volume}
          onChange={(e) => onVolumeChange(stem.id, parseFloat(e.target.value))}
          className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
          aria-label={`${stem.name} volume`}
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={stem.volume}
        />
      </div>
    </div>
  );
});
