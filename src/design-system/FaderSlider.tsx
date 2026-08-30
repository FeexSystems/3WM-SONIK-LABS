import React, { useRef, useState, useEffect } from 'react';

interface FaderSliderProps {
  value: number; // 0 to 1 (or -1 to 1)
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  height?: number;
  color?: string;
  onChange: (val: number) => void;
}

export const FaderSlider: React.FC<FaderSliderProps> = ({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  label = 'LEVEL',
  unit = '',
  height = 160,
  color = '#f59e0b',
  onChange,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const percentage = Math.min(1, Math.max(0, (value - min) / (max - min)));

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateFromPointer(e);
  };

  const updateFromPointer = (e: PointerEvent | React.PointerEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const norm = 1 - Math.min(1, Math.max(0, clickY / rect.height));
    let nextVal = min + norm * (max - min);
    if (step) {
      nextVal = Math.round(nextVal / step) * step;
    }
    onChange(Number(nextVal.toFixed(3)));
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => updateFromPointer(e);
    const handlePointerUp = () => setIsDragging(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, min, max, step]);

  // Convert normalized level to display dB
  const dbDisplay = value <= 0 ? '-∞' : `${(20 * Math.log10(value)).toFixed(1)} dB`;

  return (
    <div className="flex flex-col items-center select-none group w-12">
      <div className="flex items-center gap-1.5 h-full">
        {/* dB scale markings */}
        <div
          style={{ height }}
          className="flex flex-col justify-between text-[8px] font-mono text-neutral-500 py-1"
        >
          <span>+6</span>
          <span>0</span>
          <span>-6</span>
          <span>-12</span>
          <span>-24</span>
          <span>-∞</span>
        </div>

        {/* Fader Track & Cap */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          style={{ height }}
          className="w-4 bg-neutral-950 rounded border border-neutral-800 relative cursor-ns-resize flex items-center justify-center shadow-inner"
        >
          {/* Center Groove */}
          <div className="w-1 h-[90%] bg-neutral-900 rounded-full border-r border-neutral-850" />

          {/* Fader Cap */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-8 h-6 bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900 rounded-sm border border-neutral-600 shadow-xl flex items-center justify-center transition-transform duration-75 cursor-grab active:cursor-grabbing hover:border-amber-500/80"
            style={{
              bottom: `calc(${percentage * 100}% - 12px)`,
            }}
          >
            {/* Center Line Stripe on Cap */}
            <div className="w-full h-0.5" style={{ backgroundColor: color }} />
          </div>
        </div>
      </div>

      <div className="text-center mt-2">
        <span className="text-[9px] font-mono text-neutral-400 block uppercase font-semibold">
          {label}
        </span>
        <span className="text-[10px] font-mono text-amber-400 font-bold block">
          {unit ? `${value}${unit}` : dbDisplay}
        </span>
      </div>
    </div>
  );
};
