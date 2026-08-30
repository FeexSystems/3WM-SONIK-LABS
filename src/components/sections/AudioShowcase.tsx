import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, Sliders } from 'lucide-react';
import { useLandingAudio } from '../../context/LandingAudioContext';

export function AudioShowcase() {
  const {
    isPlaying,
    togglePlay,
    stems,
    toggleStemMute,
    toggleStemSolo,
    setStemVolume,
    fx,
    toggleFx,
    currentGenre,
    bpm,
    key,
  } = useLandingAudio();

  return (
    <section id="audio-showcase" className="relative mx-auto max-w-[1328px] px-5 py-28 md:px-14">
      {/* Background radial glow */}
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5a800]/[0.04] blur-[120px] pointer-events-none" />

      <div className="relative mx-auto mb-16 max-w-3xl text-center">
        <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#f5a800]">
          — Live WebDSP Audio Engine —
        </p>
        <h2 className="font-display mt-3 text-6xl leading-none text-[var(--foreground-bright)] md:text-8xl">
          REAL-TIME STEM &amp; FX LAB
        </h2>
        <p className="mt-5 text-sm font-light leading-7 text-[var(--muted)]">
          Listen to the Three Wise Men process musical audio in real time. Toggle stems, mute/solo
          layers, and engage specialized AI mastering and distortion modules right in your browser.
        </p>
      </div>

      <div className="relative mx-auto max-w-5xl rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl p-6 md:p-10 shadow-2xl overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className={`h-14 px-8 rounded-2xl font-mono text-sm font-bold flex items-center gap-3 transition-all duration-300 ${
                isPlaying
                  ? 'bg-[#ff3c00] text-[var(--foreground-bright)] shadow-[0_0_30px_rgba(255,60,0,0.5)] scale-105'
                  : 'bg-[#f5a800] text-black hover:bg-[#ffb71a] shadow-[0_0_25px_rgba(245,168,0,0.4)]'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
              {isPlaying ? 'STOP MULTI-STEM ENGINE' : 'PLAY 4-STEM MASTER'}
            </button>

            <div className="hidden sm:flex flex-col">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
                Master Output
              </span>
              <span className="font-mono text-xs font-bold text-[var(--foreground-bright)] flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[#2affa3] animate-pulse' : 'bg-muted'}`}
                />
                {isPlaying ? '44.1kHz · 24-Bit WebDSP' : 'Engine Standby'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            <span className="text-[var(--muted)]">GENRE:</span>
            <span className="text-[#f5a800] font-bold">{currentGenre}</span>
            <span className="text-[var(--foreground-bright)]/20">|</span>
            <span className="text-[var(--muted)]">BPM:</span>
            <span className="text-[var(--foreground-bright)] font-bold">{bpm}</span>
            <span className="text-[var(--foreground-bright)]/20">|</span>
            <span className="text-[var(--muted)]">KEY:</span>
            <span className="text-[#2affa3] font-bold">{key}</span>
          </div>
        </div>

        {/* 4-Stem Mixer Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stems.map((stem) => (
            <div
              key={stem.id}
              className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                stem.muted
                  ? 'bg-black/20 border-white/5 opacity-50'
                  : stem.solo
                    ? 'bg-white/10 border-[#f5a800] shadow-[0_0_20px_rgba(245,168,0,0.2)]'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    {stem.id}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => toggleStemMute(stem.id)}
                      className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-colors ${
                        stem.muted
                          ? 'bg-[#ff3c00] text-[var(--foreground-bright)]'
                          : 'bg-white/10 text-[var(--muted)] hover:text-[var(--foreground-bright)]'
                      }`}
                      title="Mute stem"
                    >
                      M
                    </button>
                    <button
                      onClick={() => toggleStemSolo(stem.id)}
                      className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-colors ${
                        stem.solo
                          ? 'bg-[#f5a800] text-black'
                          : 'bg-white/10 text-[var(--muted)] hover:text-[var(--foreground-bright)]'
                      }`}
                      title="Solo stem"
                    >
                      S
                    </button>
                  </div>
                </div>

                <h4 className="font-display text-xl text-[var(--foreground-bright)] tracking-wide">
                  {stem.name}
                </h4>

                {/* Animated Level Bar */}
                <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden flex items-center">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor:
                        stem.id === 'bass'
                          ? '#f5a800'
                          : stem.id === 'drums'
                            ? '#2affa3'
                            : stem.id === 'vocals'
                              ? '#ff3c00'
                              : '#c9c9d4',
                    }}
                    animate={{
                      width:
                        isPlaying && !stem.muted
                          ? `${stem.volume * 85 + Math.random() * 15}%`
                          : '5%',
                    }}
                    transition={{ duration: 0.15, repeat: isPlaying ? Infinity : 0 }}
                  />
                </div>
              </div>

              {/* Volume Slider */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-[var(--muted)]" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={stem.volume}
                  onChange={(e) => setStemVolume(stem.id, parseFloat(e.target.value))}
                  className="w-full accent-[#f5a800] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                  disabled={stem.muted}
                />
                <span className="font-mono text-[9px] text-[var(--muted)] w-6 text-right">
                  {Math.round(stem.volume * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Live Agent WebDSP FX Processing Strip */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-4 h-4 text-[#f5a800]" />
            <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--foreground-bright)]">
              Agent WebDSP Modules (Click to Engage)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Emar Air EQ */}
            <button
              onClick={() => toggleFx('emarAirEq')}
              className={`p-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between ${
                fx.emarAirEq
                  ? 'bg-[#2affa3]/10 border-[#2affa3]/50 shadow-[0_0_20px_rgba(42,255,163,0.15)]'
                  : 'bg-black/40 border-white/10 opacity-60'
              }`}
            >
              <div>
                <p className="font-mono text-[10px] uppercase text-[#2affa3] font-bold">
                  EMAR // SPECTRAL AIR
                </p>
                <p className="text-xs text-[var(--foreground-bright)] mt-1">
                  10kHz Dynamic High Shelf (+6dB)
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded font-mono text-[9px] font-bold ${fx.emarAirEq ? 'bg-[#2affa3] text-black' : 'bg-white/10 text-[var(--muted)]'}`}
              >
                {fx.emarAirEq ? 'ACTIVE' : 'BYPASS'}
              </span>
            </button>

            {/* Ricky Sub Punch */}
            <button
              onClick={() => toggleFx('rickySubPunch')}
              className={`p-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between ${
                fx.rickySubPunch
                  ? 'bg-[#f5a800]/10 border-[#f5a800]/50 shadow-[0_0_20px_rgba(245,168,0,0.15)]'
                  : 'bg-black/40 border-white/10 opacity-60'
              }`}
            >
              <div>
                <p className="font-mono text-[10px] uppercase text-[#f5a800] font-bold">
                  RICKY // 808 SUB PUNCH
                </p>
                <p className="text-xs text-[var(--foreground-bright)] mt-1">
                  Sub-Harmonic WaveShaper Saturation
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded font-mono text-[9px] font-bold ${fx.rickySubPunch ? 'bg-[#f5a800] text-black' : 'bg-white/10 text-[var(--muted)]'}`}
              >
                {fx.rickySubPunch ? 'ACTIVE' : 'BYPASS'}
              </span>
            </button>

            {/* Kingpin Vocal Doubler */}
            <button
              onClick={() => toggleFx('kingpinDoubler')}
              className={`p-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between ${
                fx.kingpinDoubler
                  ? 'bg-[#ff3c00]/10 border-[#ff3c00]/50 shadow-[0_0_20px_rgba(255,60,0,0.15)]'
                  : 'bg-black/40 border-white/10 opacity-60'
              }`}
            >
              <div>
                <p className="font-mono text-[10px] uppercase text-[#ff3c00] font-bold">
                  KINGPIN // VOCAL DOUBLER
                </p>
                <p className="text-xs text-[var(--foreground-bright)] mt-1">
                  25ms Stereo Micro-Pitch Chorus
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded font-mono text-[9px] font-bold ${fx.kingpinDoubler ? 'bg-[#ff3c00] text-[var(--foreground-bright)]' : 'bg-white/10 text-[var(--muted)]'}`}
              >
                {fx.kingpinDoubler ? 'ACTIVE' : 'BYPASS'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
