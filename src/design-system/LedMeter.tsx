import React from 'react';

interface LedMeterProps {
  level: number; // 0 to 1
  peak?: number; // 0 to 1
  height?: number;
  width?: number;
  label?: string;
  orientation?: 'vertical' | 'horizontal';
  showDbfLabels?: boolean;
}

export const LedMeter: React.FC<LedMeterProps> = ({
  level,
  peak = level,
  height = 140,
  width = 12,
  label,
  orientation = 'vertical',
  showDbfLabels = false,
}) => {
  const segments = 16;
  const activeSegments = Math.round(Math.min(1, Math.max(0, level)) * segments);
  const peakSegment = Math.min(segments - 1, Math.floor(Math.min(1, Math.max(0, peak)) * segments));

  if (orientation === 'horizontal') {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && <span className="text-[9px] font-mono text-neutral-400 uppercase">{label}</span>}
        <div className="flex gap-0.5 h-3 bg-neutral-950 p-0.5 rounded border border-neutral-800">
          {Array.from({ length: segments }).map((_, i) => {
            const isActive = i < activeSegments;
            const isPeak = i === peakSegment;
            let barColor = 'bg-neutral-850';
            if (isActive || isPeak) {
              if (i >= 13) barColor = 'bg-red-500 shadow-sm shadow-red-500/50';
              else if (i >= 10) barColor = 'bg-amber-400 shadow-sm shadow-amber-400/50';
              else barColor = 'bg-emerald-500 shadow-sm shadow-emerald-500/50';
            }
            return (
              <div
                key={i}
                className={`flex-1 rounded-[1px] ${barColor} transition-all duration-75`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 select-none">
      {showDbfLabels && (
        <div className="flex flex-col justify-between text-[8px] font-mono text-neutral-500 h-full py-0.5 leading-none">
          <span>0</span>
          <span>-6</span>
          <span>-12</span>
          <span>-18</span>
          <span>-24</span>
          <span>-36</span>
          <span>-∞</span>
        </div>
      )}

      <div className="flex flex-col items-center">
        <div
          style={{ height, width }}
          className="flex flex-col-reverse justify-between bg-neutral-950 p-0.5 rounded border border-neutral-850 gap-0.5"
        >
          {Array.from({ length: segments }).map((_, i) => {
            const isActive = i < activeSegments;
            const isPeak = i === peakSegment;
            let segColor = 'bg-neutral-900';
            if (isActive || isPeak) {
              if (i >= 13) segColor = 'bg-red-500 shadow-sm shadow-red-500/50';
              else if (i >= 10) segColor = 'bg-amber-400 shadow-sm shadow-amber-400/50';
              else segColor = 'bg-emerald-500 shadow-sm shadow-emerald-500/50';
            }
            return (
              <div
                key={i}
                className={`w-full flex-1 rounded-[1px] ${segColor} transition-all duration-75`}
              />
            );
          })}
        </div>
        {label && (
          <span className="text-[9px] font-mono text-neutral-400 mt-1 uppercase">{label}</span>
        )}
      </div>
    </div>
  );
};
