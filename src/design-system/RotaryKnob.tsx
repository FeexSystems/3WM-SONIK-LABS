import React, { useRef, useState, useEffect } from 'react';

interface RotaryKnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
  color?: string;
  size?: number;
  onChange: (val: number) => void;
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  value,
  min,
  max,
  step = 0.1,
  label,
  unit = '',
  color = '#f59e0b',
  size = 48,
  onChange,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValRef = useRef(0);

  const percentage = Math.min(1, Math.max(0, (value - min) / (max - min)));
  // Map 0 -> 1 to -135deg -> +135deg (270 degrees arc)
  const angle = -135 + percentage * 270;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    startValRef.current = value;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startYRef.current - e.clientY;
      const range = max - min;
      const change = (deltaY / 150) * range;
      let nextVal = Math.min(max, Math.max(min, startValRef.current + change));
      if (step) {
        nextVal = Math.round(nextVal / step) * step;
      }
      onChange(Number(nextVal.toFixed(2)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = startYRef.current - e.touches[0].clientY;
      const range = max - min;
      const change = (deltaY / 150) * range;
      let nextVal = Math.min(max, Math.max(min, startValRef.current + change));
      if (step) {
        nextVal = Math.round(nextVal / step) * step;
      }
      onChange(Number(nextVal.toFixed(2)));
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, min, max, step, onChange]);

  return (
    <div className="flex flex-col items-center select-none group cursor-ns-resize">
      <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-1">
        {label}
      </span>

      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ width: size, height: size }}
        className="relative rounded-full bg-neutral-900 border border-neutral-750 p-1 flex items-center justify-center shadow-inner hover:border-neutral-600 transition-colors"
      >
        {/* Arc Track */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          viewBox="0 0 48 48"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="#262626"
            strokeWidth="3"
            strokeDasharray="94 130"
            strokeDashoffset="0"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${percentage * 94} 130`}
            strokeDashoffset="0"
            className="transition-all duration-75"
          />
        </svg>

        {/* Knob Body */}
        <div
          className="w-3/4 h-3/4 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shadow-md relative"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {/* Indicator Dot/Line */}
          <div className="absolute top-1 w-1 h-2 rounded-full" style={{ backgroundColor: color }} />
        </div>
      </div>

      <span className="text-[10px] font-mono text-neutral-300 mt-1 font-semibold">
        {value > 0 && unit.includes('dB') ? `+${value}` : value}
        {unit}
      </span>
    </div>
  );
};
