import React, { useEffect, useRef } from 'react';
import { Track, StemTrack, TrackSettings } from '../types';
import { soundEngine } from '../audio/engine';
import { Volume2, VolumeX, Activity, Radio, Sliders, Waves, Layers } from 'lucide-react';

interface Props {
  track: Track;
  onUpdateSettings: (settings: Partial<TrackSettings>, stems?: StemTrack[]) => void;
  isPlaying: boolean;
}

export const MixerRack: React.FC<Props> = ({ track, onUpdateSettings, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time Canvas Spectrum Analyzer
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const data = soundEngine.getAnalyserData();

      // Background grid lines
      ctx.strokeStyle = '#1e1e1e';
      ctx.lineWidth = 1;
      for (let y = 10; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      if (data && isPlaying) {
        const barWidth = canvas.width / 48 - 2;
        for (let i = 0; i < 48; i++) {
          const val = data[i * 2] || 0;
          const barHeight = (val / 255) * (canvas.height - 10);
          const x = i * (barWidth + 2);
          const y = canvas.height - barHeight;

          // Gradient from amber to deep orange
          const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
          grad.addColorStop(0, '#f59e0b');
          grad.addColorStop(0.5, '#ea580c');
          grad.addColorStop(1, '#7c2d12');

          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      } else {
        // Idle ambient subtle waveform
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const midY = canvas.height / 2;
        ctx.moveTo(0, midY);
        for (let x = 0; x < canvas.width; x += 10) {
          const y = midY + Math.sin(x * 0.05 + Date.now() * 0.002) * (isPlaying ? 15 : 4);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const handleStemVolumeChange = (stemId: string, newVol: number) => {
    if (!track.stems) return;
    const updatedStems = track.stems.map((s) => (s.id === stemId ? { ...s, volume: newVol } : s));
    onUpdateSettings({}, updatedStems);
  };

  const handleStemPanChange = (stemId: string, newPan: number) => {
    if (!track.stems) return;
    const updatedStems = track.stems.map((s) => (s.id === stemId ? { ...s, pan: newPan } : s));
    onUpdateSettings({}, updatedStems);
  };

  const handleToggleMute = (stemId: string) => {
    if (!track.stems) return;
    const updatedStems = track.stems.map((s) => (s.id === stemId ? { ...s, muted: !s.muted } : s));
    onUpdateSettings({}, updatedStems);
  };

  const handleToggleSolo = (stemId: string) => {
    if (!track.stems) return;
    const isCurrentlySolo = track.stems.find((s) => s.id === stemId)?.solo;
    const updatedStems = track.stems.map((s) =>
      s.id === stemId ? { ...s, solo: !isCurrentlySolo } : { ...s, solo: false }
    );
    onUpdateSettings({}, updatedStems);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Top Banner: Master Frequency Visualizer & Session Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Live Master Spectrum Analyzer & Dynamic Headroom
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-neutral-400">
                LUFS:{' '}
                <strong className="text-amber-400">
                  {track.analysis?.dynamics?.lufs ?? -14.0}
                </strong>
              </span>
              <span className="text-neutral-400">
                Peak:{' '}
                <strong className="text-emerald-400">
                  {track.analysis?.dynamics?.peak ?? -0.3} dB
                </strong>
              </span>
            </div>
          </div>

          <div className="relative w-full h-32 bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800">
            <canvas
              ref={canvasRef}
              width={800}
              height={128}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-1 left-2 text-[10px] font-mono text-neutral-500 flex gap-6">
              <span>30Hz</span>
              <span>100Hz</span>
              <span>500Hz</span>
              <span>2kHz</span>
              <span>8kHz</span>
              <span>18kHz</span>
            </div>
          </div>
        </div>

        {/* Master Output & Channel DSP Controls */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Master Bus EQ
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
              DSP ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center my-auto">
            {/* Low EQ */}
            <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">Low (80Hz)</div>
              <div className="text-sm font-bold text-amber-400 font-mono my-1">
                {track.settings.eq.low > 0
                  ? `+${track.settings.eq.low.toFixed(1)}`
                  : track.settings.eq.low.toFixed(1)}{' '}
                dB
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={track.settings.eq.low}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ eq: { ...track.settings.eq, low: val } });
                  soundEngine.updateDsp({
                    ...track.settings,
                    eq: { ...track.settings.eq, low: val },
                  });
                }}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded"
              />
            </div>

            {/* Mid EQ */}
            <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                Mid (1.2kHz)
              </div>
              <div className="text-sm font-bold text-cyan-400 font-mono my-1">
                {track.settings.eq.mid > 0
                  ? `+${track.settings.eq.mid.toFixed(1)}`
                  : track.settings.eq.mid.toFixed(1)}{' '}
                dB
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={track.settings.eq.mid}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ eq: { ...track.settings.eq, mid: val } });
                  soundEngine.updateDsp({
                    ...track.settings,
                    eq: { ...track.settings.eq, mid: val },
                  });
                }}
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-neutral-800 rounded"
              />
            </div>

            {/* High EQ */}
            <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                High (10kHz)
              </div>
              <div className="text-sm font-bold text-purple-400 font-mono my-1">
                {track.settings.eq.high > 0
                  ? `+${track.settings.eq.high.toFixed(1)}`
                  : track.settings.eq.high.toFixed(1)}{' '}
                dB
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={track.settings.eq.high}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ eq: { ...track.settings.eq, high: val } });
                  soundEngine.updateDsp({
                    ...track.settings,
                    eq: { ...track.settings.eq, high: val },
                  });
                }}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-neutral-800 rounded"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-mono text-neutral-400 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
            <span>
              Reverb:{' '}
              <strong className="text-neutral-200 capitalize">{track.settings.reverb.type}</strong>{' '}
              ({track.settings.reverb.amount}%)
            </span>
            <span>
              Ratio:{' '}
              <strong className="text-neutral-200">{track.settings.compression.ratio}:1</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 5-Stem Multi-Channel DAW Strips */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
              Afrofusion Multi-Stem Channel Console (5 Tracks)
            </h2>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            Session: <span className="text-amber-400 font-bold">{track.title}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {(track.stems || []).map((stem, idx) => {
            const isMuted = stem.muted;
            const isSolo = stem.solo;

            return (
              <div
                key={stem.id}
                className={`bg-neutral-950 rounded-xl border p-3 flex flex-col justify-between transition-all ${
                  isSolo
                    ? 'border-amber-500 ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/10'
                    : isMuted
                      ? 'border-neutral-850 opacity-60'
                      : 'border-neutral-800'
                }`}
              >
                {/* Header & Stem Name */}
                <div className="border-b border-neutral-850 pb-2 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-neutral-500">CH 0{idx + 1}</span>
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stem.color }}
                    />
                  </div>
                  <div className="font-bold text-xs text-neutral-200 truncate" title={stem.name}>
                    {stem.name}
                  </div>
                </div>

                {/* Simulated Waveform / Activity Meter */}
                <div className="h-16 bg-neutral-900/90 rounded-lg p-1.5 flex items-center justify-center gap-0.5 border border-neutral-800 mb-3 overflow-hidden">
                  {Array.from({ length: 14 }).map((_, barIdx) => {
                    const baseHeight = ((stem.waveformSeed * (barIdx + 1) * 7) % 50) + 10;
                    const animatedHeight =
                      isPlaying && !isMuted
                        ? Math.min(56, baseHeight * (0.8 + Math.random() * 0.4) * stem.volume)
                        : baseHeight * 0.3;

                    return (
                      <div
                        key={barIdx}
                        className="w-1 rounded-full transition-all duration-75"
                        style={{
                          height: `${animatedHeight}px`,
                          backgroundColor: isMuted ? '#404040' : stem.color,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Solo / Mute Buttons */}
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  <button
                    onClick={() => handleToggleMute(stem.id)}
                    className={`py-1 rounded text-[11px] font-bold uppercase transition ${
                      isMuted
                        ? 'bg-red-500 text-white shadow-sm shadow-red-500/30'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {isMuted ? 'MUTED' : 'MUTE'}
                  </button>
                  <button
                    onClick={() => handleToggleSolo(stem.id)}
                    className={`py-1 rounded text-[11px] font-bold uppercase transition ${
                      isSolo
                        ? 'bg-amber-500 text-neutral-950 shadow-sm shadow-amber-500/30'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    SOLO
                  </button>
                </div>

                {/* Pan Knob Slider */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                    <span>PAN</span>
                    <span>
                      {stem.pan === 0
                        ? 'C'
                        : stem.pan < 0
                          ? `L${Math.abs(Math.round(stem.pan * 100))}`
                          : `R${Math.round(stem.pan * 100)}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={stem.pan}
                    onChange={(e) => handleStemPanChange(stem.id, parseFloat(e.target.value))}
                    className="w-full accent-neutral-300 cursor-pointer h-1 bg-neutral-800 rounded"
                  />
                </div>

                {/* Vertical Volume Fader */}
                <div className="bg-neutral-900/60 p-2 rounded-lg border border-neutral-850">
                  <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                    <span>LEVEL</span>
                    <span className="text-amber-400 font-bold">
                      {Math.round(stem.volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={stem.volume}
                    onChange={(e) => handleStemVolumeChange(stem.id, parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-800 rounded"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
