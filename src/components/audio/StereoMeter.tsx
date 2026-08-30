import React, { useEffect, useState, useRef } from 'react';
import { soundEngine, StereoMeterData } from '../../audio/engine';

export interface StereoMeterProps {
  className?: string;
  showLabels?: boolean;
  showNumerical?: boolean;
  compact?: boolean;
  isPlaying?: boolean;
}

export const StereoMeter: React.FC<StereoMeterProps> = ({
  className = '',
  showLabels = true,
  showNumerical = true,
  compact = false,
  isPlaying = false,
}) => {
  const [meterData, setMeterData] = useState<StereoMeterData>({
    leftPeak: -60,
    rightPeak: -60,
    leftRms: -60,
    rightRms: -60,
    leftClip: false,
    rightClip: false,
    lufs: -60,
    energy: 0,
  });

  // Smooth peak decay & hold for realistic hardware meter aesthetics
  const leftHoldRef = useRef<number>(-60);
  const rightHoldRef = useRef<number>(-60);
  const holdDecayTimerRef = useRef<{ left: number; right: number }>({ left: 0, right: 0 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const renderLoop = () => {
      if (!isSubscribed) return;

      const current = soundEngine.getStereoMeters();
      const now = performance.now();

      // Peak Hold with 1200ms decay logic
      if (current.leftPeak >= leftHoldRef.current) {
        leftHoldRef.current = current.leftPeak;
        holdDecayTimerRef.current.left = now + 1200;
      } else if (now > holdDecayTimerRef.current.left) {
        leftHoldRef.current = Math.max(-60, leftHoldRef.current - 0.8);
      }

      if (current.rightPeak >= rightHoldRef.current) {
        rightHoldRef.current = current.rightPeak;
        holdDecayTimerRef.current.right = now + 1200;
      } else if (now > holdDecayTimerRef.current.right) {
        rightHoldRef.current = Math.max(-60, rightHoldRef.current - 0.8);
      }

      setMeterData(current);
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Convert dB (-60 to 0) to percentage (0% to 100%)
  const dbToPercent = (db: number) => {
    if (db <= -60) return 0;
    if (db >= 0) return 100;
    // Logarithmic-like scaling for audio metering
    return Math.min(100, Math.max(0, ((db + 60) / 60) * 100));
  };

  const leftPeakPct = dbToPercent(meterData.leftPeak);
  const rightPeakPct = dbToPercent(meterData.rightPeak);
  const leftRmsPct = dbToPercent(meterData.leftRms);
  const rightRmsPct = dbToPercent(meterData.rightRms);
  const leftHoldPct = dbToPercent(leftHoldRef.current);
  const rightHoldPct = dbToPercent(rightHoldRef.current);

  const handleResetClip = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.resetClipHold();
    leftHoldRef.current = -60;
    rightHoldRef.current = -60;
  };

  return (
    <>
      {/* Live region for screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {meterData.leftClip && 'Left channel clipping detected'}
        {meterData.rightClip && 'Right channel clipping detected'}
      </div>

      <div
        id="stereo-meter-transport"
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-950/90 backdrop-blur-md select-none transition-colors hover:border-neutral-700/80 cursor-pointer ${className}`}
        title="Stereo Master Peak & RMS VU Meter — Click to reset clip hold"
        onClick={handleResetClip}
      >
        {/* L/R Channel Typography Labels */}
        {showLabels && (
          <div className="flex flex-col text-[9px] font-mono font-bold leading-none text-neutral-400 gap-1.5 pr-0.5">
            <span>L</span>
            <span>R</span>
          </div>
        )}

        {/* Main Dual-Channel Stereo Level Bar Visualizer */}
        <div className={`flex flex-col gap-1.5 ${compact ? 'w-20' : 'w-24 sm:w-32'}`}>
          {/* Left Channel Bar */}
          <div className="relative h-2 w-full bg-neutral-900 rounded-sm overflow-hidden border border-neutral-800/60">
            {/* RMS Ambient Fill */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-emerald-500/30 transition-all duration-75 ease-out"
              style={{ width: `${leftRmsPct}%` }}
            />

            {/* Instantaneous Peak Bar */}
            <div
              className="h-full transition-all duration-75 ease-out rounded-xs"
              style={{
                width: `${leftPeakPct}%`,
                background:
                  meterData.leftPeak > -0.5
                    ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 70%, #ef4444 95%)'
                    : meterData.leftPeak > -6
                      ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)'
                      : '#10b981',
              }}
            />

            {/* Peak Hold Line Indicator */}
            {leftHoldPct > 0 && (
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-amber-300 shadow-[0_0_4px_#f59e0b] pointer-events-none transition-all duration-100"
                style={{ left: `calc(${leftHoldPct}% - 2px)` }}
              />
            )}

            {/* Tick Markers at -18dB, -6dB, 0dB */}
            <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-20">
              <span className="w-[1px] h-full bg-white ml-[70%]" />
              <span className="w-[1px] h-full bg-white ml-[90%]" />
            </div>
          </div>

          {/* Right Channel Bar */}
          <div className="relative h-2 w-full bg-neutral-900 rounded-sm overflow-hidden border border-neutral-800/60">
            {/* RMS Ambient Fill */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-emerald-500/30 transition-all duration-75 ease-out"
              style={{ width: `${rightRmsPct}%` }}
            />

            {/* Instantaneous Peak Bar */}
            <div
              className="h-full transition-all duration-75 ease-out rounded-xs"
              style={{
                width: `${rightPeakPct}%`,
                background:
                  meterData.rightPeak > -0.5
                    ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 70%, #ef4444 95%)'
                    : meterData.rightPeak > -6
                      ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 100%)'
                      : '#10b981',
              }}
            />

            {/* Peak Hold Line Indicator */}
            {rightHoldPct > 0 && (
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-amber-300 shadow-[0_0_4px_#f59e0b] pointer-events-none transition-all duration-100"
                style={{ left: `calc(${rightHoldPct}% - 2px)` }}
              />
            )}

            {/* Tick Markers */}
            <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-20">
              <span className="w-[1px] h-full bg-white ml-[70%]" />
              <span className="w-[1px] h-full bg-white ml-[90%]" />
            </div>
          </div>
        </div>

        {/* Hardware Clip Warning LEDs */}
        <div
          className="flex flex-col gap-1.5 pl-0.5"
          title="Hardware Clip Warning LEDs (Click to clear)"
        >
          <div
            className={`w-2 h-2 rounded-full border border-neutral-800 transition-all ${
              meterData.leftClip
                ? 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse'
                : 'bg-neutral-800'
            }`}
            title="Left Channel Clip Indicator"
          />
          <div
            className={`w-2 h-2 rounded-full border border-neutral-800 transition-all ${
              meterData.rightClip
                ? 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse'
                : 'bg-neutral-800'
            }`}
            title="Right Channel Clip Indicator"
          />
        </div>

        {/* Real-time Decibel (dB) & LUFS Numerical Readout */}
        {showNumerical && !compact && (
          <div className="hidden sm:flex flex-col text-[10px] font-mono leading-none pl-1 text-right min-w-[48px]">
            <span
              className={`font-bold transition-colors ${
                meterData.leftPeak > -0.5
                  ? 'text-red-400 font-extrabold'
                  : meterData.leftPeak > -6
                    ? 'text-amber-400'
                    : 'text-neutral-400'
              }`}
            >
              {meterData.leftPeak <= -59 ? '-inf' : `${meterData.leftPeak.toFixed(1)} dB`}
            </span>
            <span className="text-[9px] text-neutral-400 mt-1">
              {meterData.lufs <= -59 ? '-inf' : `${meterData.lufs} LUFS`}
            </span>
            <span className="text-[9px] font-mono text-neutral-400">WAV • 24-bit 44.1k</span>
          </div>
        )}
      </div>
    </>
  );
};

// Backwards compatibility alias
export const StereoPeakMeter = StereoMeter;
export default StereoMeter;
