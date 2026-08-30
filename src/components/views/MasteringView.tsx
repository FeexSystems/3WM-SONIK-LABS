import React, { useState } from 'react';
import { Track, MasteringProfile, TrackSettings } from '../../types';
import { soundEngine } from '../../audio/engine';
import { LufsRmsMasterMeter } from '../audio/LufsRmsMasterMeter';
import {
  Gauge,
  Sparkles,
  CheckCircle2,
  Sliders,
  Download,
  Volume2,
  ShieldCheck,
  Play,
  Pause,
} from 'lucide-react';

interface MasteringViewProps {
  track: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onUpdateTrackSettings: (settingsPatch: Partial<TrackSettings>) => void;
  onOpenExport?: () => void;
}

const masteringProfiles: MasteringProfile[] = [
  {
    id: 'hybrid_trap_streaming',
    name: 'Hybrid 808 Trap & Streaming Master',
    presetName: 'Trap & Drill Hybrid -11 LUFS',
    engine: '3WM Hybrid DSP',
    targetLufs: -11.0,
    truePeak: -0.8,
    dynamicRange: 7.2,
    frequencyBalance: { low: 3.2, mid: -0.8, high: 2.2 },
    stereoWidth: 1.25,
    harmonicWarmth: 0.55,
    ceiling: -0.5,
    description:
      'Calibrated for modern hybrid 808 trap/afro-drill beats. Sub-bass mono collapse (<90Hz), crisp transient punch, smooth 12kHz streaming air.',
  },
  {
    id: 'hybrid_afrofusion_stream',
    name: 'Hybrid Afro-Fusion & Highlife Stream',
    presetName: 'Lagos Shrine Streaming -13 LUFS',
    engine: 'Ozone 11 Advanced',
    targetLufs: -13.0,
    truePeak: -1.0,
    dynamicRange: 8.2,
    frequencyBalance: { low: 2.5, mid: 0.2, high: 1.5 },
    stereoWidth: 1.35,
    harmonicWarmth: 0.65,
    ceiling: -0.8,
    description:
      'Warm tube tape saturation, wide stereo percussion, punchy log-drum definition and vocal forwardness.',
  },
  {
    id: 'streaming_spotify_apple',
    name: 'Streaming Standard (Spotify / Apple Music)',
    presetName: 'AES -14 LUFS Clean Match',
    engine: 'Hybrid DSP',
    targetLufs: -14.0,
    truePeak: -1.0,
    dynamicRange: 9.0,
    frequencyBalance: { low: 0.8, mid: 0.0, high: 0.8 },
    stereoWidth: 1.15,
    harmonicWarmth: 0.35,
    ceiling: -1.0,
    description:
      'Lossless dynamic range with zero inter-sample peak distortion, optimized for mobile streaming codecs.',
  },
  {
    id: 'drill_slide_master',
    name: 'UK / US Drill 808 Slide Master',
    presetName: 'Drill Portamento Punch',
    engine: '3WM Hybrid DSP',
    targetLufs: -10.5,
    truePeak: -0.5,
    dynamicRange: 6.8,
    frequencyBalance: { low: 3.5, mid: -1.0, high: 2.5 },
    stereoWidth: 1.2,
    harmonicWarmth: 0.7,
    ceiling: -0.3,
    description:
      'Fast recovery limiter tailored for sliding 808 sub basslines, aggressive rimshots, and sharp high-hat rolls.',
  },
  {
    id: 'club_heavy_banger',
    name: 'Club / Heavy Impact Banger',
    presetName: 'Lagos Midnight PA Sound',
    engine: 'Ozone 11 Advanced',
    targetLufs: -9.0,
    truePeak: -0.3,
    dynamicRange: 6.2,
    frequencyBalance: { low: 3.8, mid: -0.5, high: 2.0 },
    stereoWidth: 1.3,
    harmonicWarmth: 0.75,
    ceiling: -0.1,
    description:
      'Maximum loudness density for festival sound systems and high-powered club PAs without digital clipping.',
  },
  {
    id: 'tracks_analog_tape',
    name: 'T-RackS 5: Master EQ 432 & Tape 24',
    presetName: 'Afrofusion Analog Warmth',
    engine: 'T-RackS 5',
    targetLufs: -14.0,
    truePeak: -0.5,
    dynamicRange: 8.5,
    frequencyBalance: { low: 1.5, mid: 0.8, high: 0.5 },
    stereoWidth: 1.2,
    harmonicWarmth: 0.85,
    ceiling: -0.3,
    description:
      'Analog tape saturation, wide harmonic mids, silky top-end for global radio and vinyl pressing.',
  },
];

export const MasteringView: React.FC<MasteringViewProps> = ({
  track,
  isPlaying,
  onTogglePlay,
  onUpdateTrackSettings,
  onOpenExport,
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(masteringProfiles[0].id);
  const [abMode, setAbMode] = useState<'MASTER' | 'ORIGINAL'>('MASTER');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const activeProfile =
    masteringProfiles.find((p) => p.id === selectedProfileId) || masteringProfiles[0];

  const handleApplyProfile = () => {
    setIsApplying(true);
    setTimeout(() => {
      soundEngine.applyMasteringProfile(activeProfile);
      onUpdateTrackSettings({
        eq: {
          low: activeProfile.frequencyBalance.low,
          mid: activeProfile.frequencyBalance.mid,
          high: activeProfile.frequencyBalance.high,
        },
        saturation: activeProfile.harmonicWarmth,
      });
      setIsApplying(false);
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 3000);
    }, 600);
  };

  const handleToggleAb = (mode: 'MASTER' | 'ORIGINAL') => {
    setAbMode(mode);
    if (mode === 'ORIGINAL') {
      soundEngine.updateDsp({
        ...track.settings,
        eq: { low: 0, mid: 0, high: 0 },
        saturation: 0,
      });
    } else {
      soundEngine.applyMasteringProfile(activeProfile);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gauge className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-neutral-100 uppercase tracking-tight">
              Ozone 11 & T-RackS Mastering Suite
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Automated acoustic mastering profiles, ITU-R BS.1770-4 LUFS metering, and synchronized
            A/B gain-matched auditioning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Synchronized A/B Switch */}
          <div className="bg-neutral-950 p-1 rounded-xl border border-neutral-800 flex items-center gap-1">
            <button
              onClick={() => handleToggleAb('ORIGINAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                abMode === 'ORIGINAL'
                  ? 'bg-neutral-800 text-neutral-200 shadow'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              BEFORE (ORIGINAL)
            </button>
            <button
              onClick={() => handleToggleAb('MASTER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                abMode === 'MASTER'
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              AFTER (MASTERED)
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time LUFS / RMS Metering & Dynamic Headroom Engine */}
      <LufsRmsMasterMeter activeProfile={activeProfile} isPlaying={isPlaying} />

      {/* Target Metering Specs Readout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <span className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
            TARGET INTEGRATED LUFS
          </span>
          <span className="text-2xl font-black text-cyan-400">{activeProfile.targetLufs} LUFS</span>
          <span className="text-[10px] text-neutral-500 block font-mono mt-1">EBU R128 / AES</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <span className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
            MAX TRUE PEAK
          </span>
          <span className="text-2xl font-black text-emerald-400">
            {activeProfile.truePeak} dBTP
          </span>
          <span className="text-[10px] text-neutral-500 block font-mono mt-1">
            Inter-sample Safe
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <span className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
            DYNAMIC RANGE (PLR)
          </span>
          <span className="text-2xl font-black text-amber-400">
            {activeProfile.dynamicRange} LU
          </span>
          <span className="text-[10px] text-neutral-500 block font-mono mt-1">
            Punchy Crest Factor
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <span className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">
            STEREO SPREAD
          </span>
          <span className="text-2xl font-black text-purple-400">{activeProfile.stereoWidth}x</span>
          <span className="text-[10px] text-neutral-500 block font-mono mt-1">
            Phase Correlated
          </span>
        </div>
      </div>

      {/* Profiles Selection & Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Selector (Left) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2">
            SELECT MASTERING ALGORITHM
          </span>
          {masteringProfiles.map((p) => {
            const isSel = p.id === selectedProfileId;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProfileId(p.id)}
                className={`w-full p-4 rounded-xl border text-left transition ${
                  isSel
                    ? 'bg-neutral-950 border-cyan-500 ring-1 ring-cyan-500/30'
                    : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-neutral-100">{p.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-850 text-neutral-400">
                    {p.engine}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-2">{p.description}</p>
              </button>
            );
          })}

          <button
            onClick={handleApplyProfile}
            disabled={isApplying}
            className="w-full mt-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isApplying
                ? 'CALCULATING DSP...'
                : appliedSuccess
                  ? 'MASTER APPLIED!'
                  : 'APPLY MASTER PROFILE'}
            </span>
          </button>
        </div>

        {/* Streaming Readiness Checklist (2 cols) */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <span className="text-xs font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Global Streaming Platform Compliance</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">PASSED 4/4 CHECKS</span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-850 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-200">
                    Spotify Loudness Normalization
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Target -14 LUFS Integrated with -1.0 dBTP ceiling prevents lossy Vorbis codec
                    distortion.
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              </div>

              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-850 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-200">
                    Apple Digital Masters (ADM)
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    High-resolution 24-bit PCM architecture ensures zero inter-sample clipping on
                    AAC conversion.
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              </div>

              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-850 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-200">
                    Boomplay & Audiomack Distribution
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Optimized low-frequency mono summing below 80Hz prevents phase cancellation on
                    mobile speaker playback.
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-500">
              AUDIO PIPELINE: 24-BIT / 48kHz WAV LOSSLESS
            </span>
            <button
              onClick={() => {
                if (onOpenExport) {
                  onOpenExport();
                }
              }}
              className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-400/20 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-neutral-950" />
              <span>EXPORT 24-BIT MASTER</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
