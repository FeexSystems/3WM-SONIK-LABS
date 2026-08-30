import React, { useEffect, useState, useRef } from 'react';
import { soundEngine, StereoMeterData } from '../../audio/engine';

interface StereoPeakMeterProps {
  className?: string;
  showLabels?: boolean;
  isPlaying?: boolean;
}

export const StereoPeakMeter: React.FC<StereoPeakMeterProps> = ({
  className = '',
  showLabels = true,
  isPlaying,
}) => {
  const [meter, setMeter] = useState<StereoMeterData>({
    leftPeak: -60,
    rightPeak: -60,
    leftRms: -60,
    rightRms: -60,
    leftClip: false,
    rightClip: false,
    lufs: -60,
    energy: 0,
  });

  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const loop = () => {
      if (!active) return;
      const data = soundEngine.getStereoMeters();
      setMeter(data);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Convert dB (-60 to 0) to percentage (0% to 100%)
  const dbToPercent = (db: number) => {
    if (db <= -60) return 0;
    if (db >= 0) return 100;
    return Math.min(100, Math.max(0, ((db + 60) / 60) * 100));
  };

  const leftPct = dbToPercent(meter.leftPeak);
  const rightPct = dbToPercent(meter.rightPeak);

  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md select-none ${className}`}
      title="Stereo Master Peak & LUFS Output Meter (Click to reset clip flags)"
      onClick={() => soundEngine.resetClipHold()}
    >
      {showLabels && (
        <div className="flex flex-col text-[9px] font-mono font-bold leading-none text-neutral-500 gap-1 pr-1">
          <span>L</span>
          <span>R</span>
        </div>
      )}

      {/* Meter Bars Stack */}
      <div className="flex flex-col gap-1 w-24 sm:w-28">
        {/* Left Channel */}
        <div className="relative h-2 w-full bg-neutral-900 rounded-xs overflow-hidden border border-neutral-800/40">
          <div
            className="h-full transition-all duration-75 ease-out rounded-xs"
            style={{
              width: `${leftPct}%`,
              background:
                meter.leftPeak > -0.5
                  ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 70%, #ef4444 95%)'
                  : meter.leftPeak > -6
                    ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)'
                    : '#10b981',
            }}
          />
        </div>

        {/* Right Channel */}
        <div className="relative h-2 w-full bg-neutral-900 rounded-xs overflow-hidden border border-neutral-800/40">
          <div
            className="h-full transition-all duration-75 ease-out rounded-xs"
            style={{
              width: `${rightPct}%`,
              background:
                meter.rightPeak > -0.5
                  ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 70%, #ef4444 95%)'
                  : meter.rightPeak > -6
                    ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)'
                    : '#10b981',
            }}
          />
        </div>
      </div>

      {/* Clip Indicators */}
      <div className="flex flex-col gap-1 pl-1">
        <div
          className={`w-2 h-2 rounded-full border border-neutral-800 transition-colors ${
            meter.leftClip ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-neutral-800'
          }`}
          title="Left Channel Clip Indicator"
        />
        <div
          className={`w-2 h-2 rounded-full border border-neutral-800 transition-colors ${
            meter.rightClip ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-neutral-800'
          }`}
          title="Right Channel Clip Indicator"
        />
      </div>

      {/* Readout Numbers */}
      <div className="hidden md:flex flex-col text-[10px] font-mono leading-none pl-1 text-right">
        <span className={meter.leftPeak > -1 ? 'text-amber-400 font-semibold' : 'text-neutral-400'}>
          {meter.leftPeak <= -59 ? '-inf' : `${meter.leftPeak.toFixed(1)}`}
        </span>
        <span className="text-[9px] text-neutral-400 mt-0.5">
          {meter.lufs <= -59 ? '-inf' : `${meter.lufs} LUFS`}
        </span>
      </div>
    </div>
  );
};
