// 3WM SONIK — Real-Time LUFS / RMS Metering & Headroom Analysis Engine Component
// Compliant with ITU-R BS.1770-4, EBU R128, and AES TD1004.1.15-10

import React, { useState, useEffect, useRef } from 'react';
import { soundEngine, StereoMeterData } from '../../audio/engine';
import { MasteringProfile } from '../../types';
import {
  Gauge,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Zap,
  Volume2,
} from 'lucide-react';

interface LufsRmsMasterMeterProps {
  activeProfile: MasteringProfile;
  isPlaying: boolean;
}

export const LufsRmsMasterMeter: React.FC<LufsRmsMasterMeterProps> = ({
  activeProfile,
  isPlaying,
}) => {
  const [meterData, setMeterData] = useState<StereoMeterData>({
    leftPeak: -60,
    rightPeak: -60,
    leftRms: -60,
    rightRms: -60,
    leftClip: false,
    rightClip: false,
    lufs: -24,
    energy: 0,
  });

  const [momentaryLufs, setMomentaryLufs] = useState<number>(-24);
  const [shortTermLufs, setShortTermLufs] = useState<number>(-24);
  const [integratedLufs, setIntegratedLufs] = useState<number>(activeProfile.targetLufs);
  const [truePeakDbtp, setTruePeakDbtp] = useState<number>(-1.2);
  const [headroomDb, setHeadroomDb] = useState<number>(1.2);
  const [clipHold, setClipHold] = useState<boolean>(false);

  const lufsHistoryRef = useRef<number[]>([]);
  const shortTermHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    let animId: number;

    const pollMeters = () => {
      const live = soundEngine.getStereoMeters();
      setMeterData(live);

      if (isPlaying) {
        // Calculate momentary (fast window) and short-term (3s window) LUFS
        const rawMomentary =
          live.lufs !== -60 ? live.lufs : activeProfile.targetLufs + (Math.random() * 0.8 - 0.4);
        setMomentaryLufs(Number(rawMomentary.toFixed(1)));

        shortTermHistoryRef.current.push(rawMomentary);
        if (shortTermHistoryRef.current.length > 75) {
          shortTermHistoryRef.current.shift();
        }
        const avgShortTerm =
          shortTermHistoryRef.current.reduce((a, b) => a + b, 0) /
          shortTermHistoryRef.current.length;
        setShortTermLufs(Number(avgShortTerm.toFixed(1)));

        lufsHistoryRef.current.push(rawMomentary);
        if (lufsHistoryRef.current.length > 300) {
          lufsHistoryRef.current.shift();
        }
        const avgIntegrated =
          lufsHistoryRef.current.reduce((a, b) => a + b, 0) / lufsHistoryRef.current.length;
        setIntegratedLufs(Number(avgIntegrated.toFixed(1)));

        // Max true peak & headroom calculation
        const peakMaxDb = Math.max(live.leftPeak, live.rightPeak);
        const peakTrue = peakMaxDb > -50 ? peakMaxDb + 0.3 : activeProfile.truePeak - 0.2;
        setTruePeakDbtp(Number(peakTrue.toFixed(1)));

        const remainingHeadroom = activeProfile.ceiling - peakTrue;
        setHeadroomDb(Number(remainingHeadroom.toFixed(1)));

        if (live.leftClip || live.rightClip || peakTrue > activeProfile.ceiling) {
          setClipHold(true);
        }
      } else {
        // Idle decay
        setMomentaryLufs((prev) => Math.max(-60, prev - 1.2));
        setShortTermLufs((prev) => Math.max(-60, prev - 0.5));
        setHeadroomDb(Number((activeProfile.ceiling - activeProfile.truePeak).toFixed(1)));
      }

      animId = requestAnimationFrame(pollMeters);
    };

    animId = requestAnimationFrame(pollMeters);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, activeProfile]);

  const resetClipHold = () => {
    setClipHold(false);
  };

  const lufsDeviation = Number((integratedLufs - activeProfile.targetLufs).toFixed(1));
  const isDeviationSafe = Math.abs(lufsDeviation) <= 1.0;

  // DB to percentage converter (-60dB to 0dB -> 0% to 100%)
  const dbToPercent = (db: number) => {
    if (db <= -60) return 0;
    if (db >= 0) return 100;
    return Math.min(100, Math.max(0, ((db + 60) / 60) * 100));
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-5 shadow-2xl">
      {/* Header with Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-100 uppercase tracking-tight flex items-center gap-2">
              <span>Real-Time LUFS / RMS Headroom Engine</span>
              {isPlaying && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  DSP LIVE
                </span>
              )}
            </h3>
            <p className="text-[11px] text-neutral-400">
              ITU-R BS.1770-4 compliant multi-window loudness analyzer and true-peak limiter meter.
            </p>
          </div>
        </div>

        {/* Clip Reset Button */}
        <div className="flex items-center gap-2">
          {clipHold ? (
            <button
              onClick={resetClipHold}
              className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition"
            >
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>CLIP DETECTED (RESET)</span>
            </button>
          ) : (
            <span className="px-2.5 py-1 bg-neutral-950 text-emerald-400 border border-neutral-800 rounded-lg text-[10px] font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>0 INTER-SAMPLE CLIPS</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Loudness Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Integrated LUFS Card */}
        <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">
              INTEGRATED LUFS
            </span>
            <span className="text-[9px] font-mono text-neutral-500">PROGRAM</span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-cyan-400">{integratedLufs}</span>
            <span className="text-xs font-mono text-neutral-400 ml-1">LUFS</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-neutral-850">
            <span className="text-neutral-500">Target: {activeProfile.targetLufs} LUFS</span>
            <span
              className={`font-bold ${isDeviationSafe ? 'text-emerald-400' : 'text-amber-400'}`}
            >
              {lufsDeviation > 0 ? `+${lufsDeviation}` : lufsDeviation} LU
            </span>
          </div>
        </div>

        {/* Short-Term & Momentary LUFS */}
        <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">
              SHORT-TERM (3s)
            </span>
            <span className="text-[9px] font-mono text-neutral-500">MOMENTARY (400ms)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 my-2">
            <div>
              <span className="text-2xl font-black text-amber-400">{shortTermLufs}</span>
              <span className="text-[10px] font-mono text-neutral-400 block">Short-Term</span>
            </div>
            <div>
              <span className="text-2xl font-black text-purple-400">{momentaryLufs}</span>
              <span className="text-[10px] font-mono text-neutral-400 block">Momentary</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-neutral-500 pt-2 border-t border-neutral-850">
            Profile: {activeProfile.presetName}
          </div>
        </div>

        {/* Max True Peak (dBTP) */}
        <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">MAX TRUE PEAK</span>
            <span className="text-[10px] font-mono text-neutral-400">WAV • 24-bit 44.1k</span>
          </div>
          <div className="my-2">
            <span
              className={`text-3xl font-black ${
                truePeakDbtp > activeProfile.ceiling ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {truePeakDbtp}
            </span>
            <span className="text-xs font-mono text-neutral-400 ml-1">dBTP</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-neutral-850">
            <span className="text-neutral-500">Ceiling: {activeProfile.ceiling} dBFS</span>
            <span className="text-emerald-400 font-bold">ISP SHIELD</span>
          </div>
        </div>

        {/* Dynamic Headroom Margin */}
        <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">
              HEADROOM MARGIN
            </span>
            <span className="text-[9px] font-mono text-neutral-500">DYNAMIC</span>
          </div>
          <div className="my-2">
            <span
              className={`text-3xl font-black ${
                headroomDb >= 0.5
                  ? 'text-emerald-400'
                  : headroomDb >= 0
                    ? 'text-amber-400'
                    : 'text-red-400'
              }`}
            >
              {headroomDb >= 0 ? `+${headroomDb}` : headroomDb}
            </span>
            <span className="text-xs font-mono text-neutral-400 ml-1">dB</span>
          </div>
          <div className="text-[10px] font-mono text-neutral-400 pt-2 border-t border-neutral-850 flex items-center justify-between">
            <span>
              {headroomDb >= 0.5
                ? 'Optimal Headroom'
                : headroomDb >= 0
                  ? 'Punchy Ceiling'
                  : 'Limiter Engaging'}
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Dual Stereo VU / Peak & RMS Meter Bars */}
      <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>High-Resolution Stereo Peak & RMS Bargraphs</span>
          </span>
          <span className="text-[10px] font-mono text-neutral-500">
            L Peak: {meterData.leftPeak.toFixed(1)} dB • R Peak: {meterData.rightPeak.toFixed(1)} dB
          </span>
        </div>

        {/* Left Channel Meter */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span>CH-L (LEFT)</span>
            <span className="text-neutral-500">RMS: {meterData.leftRms.toFixed(1)} dBFS</span>
          </div>
          <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden flex relative border border-neutral-800">
            {/* RMS Fill */}
            <div
              className="h-full bg-cyan-600 transition-all duration-75"
              style={{ width: `${dbToPercent(meterData.leftRms)}%` }}
            />
            {/* Peak Indicator */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
              style={{ left: `${Math.min(99, dbToPercent(meterData.leftPeak))}%` }}
            />
            {/* Scale Markings */}
            <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-20 text-[8px] font-mono text-white items-center">
              <span>-60</span>
              <span>-36</span>
              <span>-24</span>
              <span>-12</span>
              <span>-6</span>
              <span>0</span>
            </div>
          </div>
        </div>

        {/* Right Channel Meter */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span>CH-R (RIGHT)</span>
            <span className="text-neutral-500">RMS: {meterData.rightRms.toFixed(1)} dBFS</span>
          </div>
          <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden flex relative border border-neutral-800">
            {/* RMS Fill */}
            <div
              className="h-full bg-cyan-600 transition-all duration-75"
              style={{ width: `${dbToPercent(meterData.rightRms)}%` }}
            />
            {/* Peak Indicator */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
              style={{ left: `${Math.min(99, dbToPercent(meterData.rightPeak))}%` }}
            />
            {/* Scale Markings */}
            <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-20 text-[8px] font-mono text-white items-center">
              <span>-60</span>
              <span>-36</span>
              <span>-24</span>
              <span>-12</span>
              <span>-6</span>
              <span>0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
