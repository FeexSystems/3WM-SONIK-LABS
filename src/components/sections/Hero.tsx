import { motion, useScroll, useTransform } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Sparkles, Play, Pause, Disc3 } from 'lucide-react';
import { Button } from '../ui/button';
import { WaitlistForm } from './WaitlistForm';
import { useLandingAudio } from '../../context/LandingAudioContext';
import { landingAudioEngine } from '../../audio/landingAudioEngine';

const SonicOrb = lazy(() => import('../visuals/SonicOrb').then((m) => ({ default: m.SonicOrb })));

export function Hero({
  onEnterStudio,
  onExploreSonic,
}: {
  onEnterStudio: (sessionData?: ReturnType<typeof landingAudioEngine.exportSessionState>) => void;
  onExploreSonic?: () => void;
}) {
  const { isPlaying, bpm, key, currentGenre, togglePlay, setGenrePill } = useLandingAudio();
  const { scrollY } = useScroll();
  const orbScale = useTransform(scrollY, [0, 800], [1, 1.4]);
  const orbRotate = useTransform(scrollY, [0, 800], [0, 45]);
  const orbOpacity = useTransform(scrollY, [0, 600], [1, 0]);

  const [load3D, setLoad3D] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoad3D(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const genrePills = [
    { label: 'Amapiano Log Drum', genre: 'Amapiano', bpm: 112, key: 'F# Min', color: '#f5a800' },
    { label: 'Afrobeats Bounce', genre: 'Afrobeats', bpm: 104, key: 'C Major', color: '#ff3c00' },
    { label: 'UK Drill 808', genre: 'UK Drill', bpm: 140, key: 'D Min', color: '#2affa3' },
  ];

  const handlePillClick = (p: (typeof genrePills)[0]) => {
    setGenrePill(p.genre, p.bpm, p.key);
    if (!isPlaying) {
      togglePlay();
    }
  };

  const handleOrbClick = () => {
    landingAudioEngine.playLogDrum(0, 55);
    landingAudioEngine.playKick(0);
  };

  return (
    <section className="relative min-h-screen overflow-hidden px-5 pb-20 pt-24 md:px-14 md:pt-36 lg:pt-32 bg-[var(--background)] transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none z-50"></div>
      <div className="absolute inset-0 sonic-grid opacity-30" />
      <div className="absolute left-1/2 top-1/2 h-[800px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--hero-glow)] blur-[100px] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f5a800]/70 to-transparent animate-pulse" />

      <div className="relative z-10 mx-auto grid max-w-[1328px] items-center gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[.2em] text-[#f5a800]"
          >
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#f5a800]" /> AI-Native
            Music Production Studio{' '}
            <span className="h-px w-10 bg-gradient-to-r from-[#f5a800] to-transparent" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.8 }}
            className="font-display text-[clamp(56px,9vw,92px)] leading-[0.9] tracking-tight text-[var(--foreground-bright)]"
          >
            Produce radio-ready
            <br />
            <span className="text-[#f5a800]">Afrofusion</span> in 30 minutes
            <br />
            <span className="text-[#ff3c00] text-[clamp(42px,7vw,72px)]">
              — without engineering school.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-display mt-4 text-lg tracking-[.12em] text-[#c9c9d4] md:text-xl"
          >
            THREE WISE MEN — ONE VISION. THREE MINDS. INFINITE SOUND.
          </motion.p>
          <p className="mt-5 max-w-xl text-base font-light leading-7 text-[#a3a3a3]">
            The first production environment built around{' '}
            <strong className="text-[#f5a800]">musical intelligence</strong> — not AI bolted onto a
            DAW. Emar (Scientist), Ricky (Sound God), Kingpin (Vocal Oracle) collaborate inside your
            real project, manipulate validated DSP, and debate to consensus.
          </p>

          {/* Interactive Genre & Beat Playground Pills */}
          <div className="mt-8 flex flex-wrap gap-2 items-center">
            <span className="font-mono text-xs text-[#f5a800] mr-2 uppercase tracking-widest flex items-center gap-1.5">
              <Disc3 className="w-3.5 h-3.5 animate-spin" /> Preview Beats:
            </span>
            {genrePills.map((p) => (
              <button
                key={p.genre}
                onClick={() => handlePillClick(p)}
                className={`px-3 py-1.5 rounded-full font-mono text-xs border transition-all duration-300 flex items-center gap-2 ${
                  currentGenre === p.genre && isPlaying
                    ? 'bg-white/20 border-white text-[var(--foreground-bright)] shadow-[0_0_15px_rgba(245,168,0,0.4)] scale-105'
                    : 'bg-black/40 border-white/10 text-[var(--muted)] hover:border-white/30 hover:text-[var(--foreground-bright)]'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.label}
              </button>
            ))}
          </div>

          {/* Visual Mockup — DAW in action */}
          <div
            className="mt-8 relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl group cursor-pointer"
            onClick={togglePlay}
          >
            <div className="aspect-video bg-gradient-to-br from-[#1A1208] via-[#0D0D0D] to-[#181410] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(245,168,0,0.15),transparent_60%)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#F5A800] flex items-center justify-center shadow-[0_0_30px_rgba(245,168,0,0.5)] group-hover:scale-110 transition-transform">
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-black fill-black" />
                  ) : (
                    <Play className="w-6 h-6 text-black fill-black ml-1" />
                  )}
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-mono text-[10px] text-white/70">
                    LIVE DAW PREVIEW — 0:24
                  </span>
                </div>
                <span className="font-mono text-[9px] px-2 py-1 rounded bg-white/10 text-white/60">
                  ▶ 12.4k views
                </span>
              </div>
              {/* Fake waveform */}
              <div className="absolute bottom-10 inset-x-4 h-12 flex items-end gap-[2px] opacity-40">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[#F5A800] rounded-full"
                    style={{ height: `${20 + Math.random() * 80}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="p-3 flex items-center justify-between border-t border-white/5">
              <span className="font-mono text-xs text-[#F5A800]">
                See 3WM in action — 24 sec demo
              </span>
              <span className="font-mono text-[10px] text-neutral-500">
                Click to {isPlaying ? 'pause' : 'play'}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <Button
              variant="fire"
              className="h-12 px-8 text-lg"
              onClick={() => onEnterStudio(landingAudioEngine.exportSessionState())}
            >
              Enter the Studio
            </Button>
            <button
              onClick={togglePlay}
              className={`h-12 px-6 rounded-xl font-mono text-sm font-semibold border flex items-center gap-3 transition-all duration-300 ${
                isPlaying
                  ? 'bg-[#ff3c00] border-[#ff3c00] text-[var(--foreground-bright)] shadow-[0_0_25px_rgba(255,60,0,0.5)] animate-pulse'
                  : 'bg-white/5 border-[#f5a800]/30 text-[#f5a800] hover:bg-[#f5a800]/10 hover:text-[var(--foreground-bright)]'
              }`}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? 'PAUSE AI BEAT ENGINE' : 'TEST LIVE AI ENGINE'}
            </button>
          </div>
          <div className="mt-8 max-w-md opacity-70">
            <WaitlistForm />
          </div>
        </div>

        <motion.div
          style={{ scale: orbScale, rotate: orbRotate, opacity: orbOpacity }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 1 }}
          className="relative cursor-pointer group"
          onClick={handleOrbClick}
          title="Click to trigger 808 log drum pulse!"
        >
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5a800]/10 blur-3xl group-hover:bg-[#f5a800]/20 transition-colors" />
          <Suspense
            fallback={
              <div className="h-[420px] w-full flex items-center justify-center text-[var(--muted)]">
                Loading 3D...
              </div>
            }
          >
            {load3D && <SonicOrb />}
          </Suspense>
          <div className="absolute left-6 top-10 glass rounded-full px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-[#2affa3] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2affa3] animate-ping" />● 3 AGENTS ONLINE
          </div>
          <div className="absolute bottom-12 right-3 glass rounded-md px-4 py-3 font-mono text-[9px] leading-5 text-[var(--muted)]">
            GENRE <b className="text-[var(--foreground-bright)]">{currentGenre}</b> · BPM{' '}
            <b className="text-[var(--foreground-bright)]">{bpm}</b>
            <br />
            KEY <b className="text-[#f5a800]">{key}</b> · ENGINE{' '}
            <b className="text-[#2affa3]">{isPlaying ? 'LIVE' : 'READY'}</b>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[.18em] text-[var(--muted)]">
            <Sparkles size={11} className="mr-1 inline" /> Click 3D Orb to Trigger 808 Sub-Bass
          </div>
        </motion.div>
      </div>
    </section>
  );
}
