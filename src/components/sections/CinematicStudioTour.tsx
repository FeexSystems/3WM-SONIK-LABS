import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, Sliders, Volume2, Music, Mic2 } from 'lucide-react';

interface TourItem {
  id: string;
  title: string;
  role: string;
  agentName: string;
  image: string;
  color: string;
  glow: string;
  frequency: number; // Low frequency for procedural hum
  tagline: string;
  stats: string[];
  icon: React.ReactNode;
}

const TOUR_ITEMS: TourItem[] = [
  {
    id: 'master-console',
    title: 'THE CORE CONSOLE',
    role: 'Central Mastering & Gateway',
    agentName: 'ThreeWM Orchestrator',
    image: '/images/cinematic_master_studio_hero.png',
    color: '#C9C9D4',
    glow: 'rgba(201, 201, 212, 0.55)',
    frequency: 48.99, // G1 sub-bass
    tagline: 'Multi-rail checkout consensus and session coordination layer.',
    stats: [
      '48kHz Stereo Summing Busses',
      'Stripe + Live Paystack Rails',
      'Web3 Multi-Chain Vaults',
    ],
    icon: <Flame className="h-5 w-5 text-white" />,
  },
  {
    id: 'scientist-lab',
    title: 'THE SPECTRAL LAB',
    role: 'Audio Engineering & DSP',
    agentName: 'Kappachino Emar',
    image: '/images/emar_spectral_dsp_lab.png',
    color: '#2AFFA3',
    glow: 'rgba(42, 255, 163, 0.55)',
    frequency: 55.0, // A1 sub-bass
    tagline: 'Understand the sound. Control the signal processing system.',
    stats: [
      'Continuous Dynamic Notch Surgery',
      'Tube Saturation Emulation',
      'Linear-Phase Filters',
    ],
    icon: <Sliders className="h-5 w-5 text-[#2AFFA3]" />,
  },
  {
    id: 'beatsmith-console',
    title: 'THE 808 BOILER ROOM',
    role: 'Drums, 808 & Groove Design',
    agentName: 'Kappachino Ricky',
    image: '/images/ricky_808_beat_console.png',
    color: '#F5A800',
    glow: 'rgba(245, 168, 0, 0.55)',
    frequency: 65.41, // C2 sub-bass
    tagline: 'Find the sound. Build the syncopated rhythm bounce.',
    stats: [
      'Amapiano Log Drum Resonator',
      'Dedicated CRT Waveform Scope',
      'Sub-Harmonic 808 Shapers',
    ],
    icon: <Music className="h-5 w-5 text-[#F5A800]" />,
  },
  {
    id: 'vocal-sanctuary',
    title: 'THE VOCAL SANCTUARY',
    role: 'Harmony & Vocal Direction',
    agentName: 'Kingpin',
    image: '/images/kingpin_vocal_sanctuary_mic.png',
    color: '#FF3C00',
    glow: 'rgba(255, 60, 0, 0.55)',
    frequency: 73.42, // D2 sub-bass
    tagline: 'Give the voice a body. Give the body a soul.',
    stats: [
      'Gold-Sputtered Dual Diaphragms',
      'Hand-Selected 6072A Triodes',
      'Micro-Tonal Harmony Arrays',
    ],
    icon: <Mic2 className="h-5 w-5 text-[#FF3C00]" />,
  },
];

export const CinematicStudioTour: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [subOsc, setSubOsc] = useState<OscillatorNode | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);

  // Clean up audio oscillator on unmount
  useEffect(() => {
    return () => {
      if (subOsc) {
        try {
          subOsc.stop();
        } catch {}
      }
    };
  }, [subOsc]);

  const handleMouseEnter = (item: TourItem) => {
    setHoveredId(item.id);
    startSubHum(item.frequency);
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
    stopSubHum();
  };

  const startSubHum = (freq: number) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = audioCtx || new AudioContextClass();
      if (!audioCtx) setAudioCtx(ctx);

      // Resume context if suspended
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      // Stop existing oscillator if running
      if (subOsc) {
        try {
          subOsc.stop();
        } catch {}
      }

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      // Configure clean sub-bass oscillator
      osc.type = 'sawtooth'; // Sawtooth provides beautiful rich analog harmonics
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Lowpass filter to block any sharp high harmonics and isolate the deep studio hum
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(90, ctx.currentTime); // strictly filter above 90Hz

      // Prevent pop sounds by using linear gain ramps
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.38, ctx.currentTime + 0.18); // smooth sub swell

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      setSubOsc(osc);
      setGainNode(gain);
    } catch (error) {
      console.warn('Web Audio Context not initialized or interaction missing:', error);
    }
  };

  const stopSubHum = () => {
    if (subOsc && gainNode && audioCtx) {
      try {
        gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.22); // smooth fadeout

        const currentOsc = subOsc;
        setTimeout(() => {
          try {
            currentOsc.stop();
          } catch {}
        }, 250);
      } catch (error) {
        console.warn('Failed to stop sub oscillator gracefully:', error);
      }
      setSubOsc(null);
      setGainNode(null);
    }
  };

  return (
    <section className="relative w-full bg-[#0D0D0D] py-32 overflow-hidden border-b border-white/5">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(26,18,8,0.18),transparent_90%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F5A800]/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-5 md:px-14">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F5A800]/30 bg-[#F5A800]/10 px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#F5A800]">
            <Sparkles className="h-4 w-4" />
            <span>Interactive Studio Pre-Entry</span>
          </div>
          <h2 className="mt-5 font-display text-5xl tracking-tight text-white md:text-7xl">
            COUNCIL <span className="text-[#F5A800]">CHAMBER</span> TOUR
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-xs md:text-sm text-[#C9C9D4]/70 leading-relaxed">
            Hover over the studio sectors below to power up their analogue circuits, trigger
            real-time procedural sub-bass hums, and preview the intelligence layers of 3WM SONIK.
          </p>
        </div>

        {/* Flex-Row Interactive Gallery */}
        <div className="flex flex-col lg:flex-row w-full h-[600px] gap-4">
          {TOUR_ITEMS.map((item) => {
            const isHovered = hoveredId === item.id;
            const isAnyHovered = hoveredId !== null;

            return (
              <motion.div
                key={item.id}
                onMouseEnter={() => handleMouseEnter(item)}
                onMouseLeave={handleMouseLeave}
                animate={{
                  flexGrow: isHovered ? 2.2 : 1,
                  opacity: !isAnyHovered || isHovered ? 1 : 0.45,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 25 }}
                className="relative h-full flex flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-[#14100C]/80 cursor-pointer group"
                style={{
                  boxShadow: isHovered ? `0 0 50px ${item.glow}` : 'none',
                  borderColor: isHovered ? item.color : 'rgba(255,255,255,0.1)',
                }}
              >
                {/* Image Layer with Grayscale-to-Color Transition */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-all duration-700 ease-out"
                    style={{
                      filter: isHovered
                        ? 'grayscale(0%) contrast(1.1) brightness(100%)'
                        : 'grayscale(100%) contrast(0.9) brightness(40%)',
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    }}
                  />
                  {/* Glowing Overlay Gradients */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700"
                    style={{
                      background: `radial-gradient(circle at bottom, ${item.color}, transparent 60%)`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="relative p-8 z-10 w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="p-2 rounded-xl bg-black/40 border backdrop-blur-md"
                      style={{ borderColor: item.color }}
                    >
                      {item.icon}
                    </div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#C9C9D4]/60">
                      {item.role}
                    </span>
                  </div>

                  <h3 className="font-display text-3xl tracking-tight text-white leading-none">
                    {item.title}
                  </h3>

                  <p
                    className="mt-1 font-mono text-[11px] font-semibold tracking-wider"
                    style={{ color: item.color }}
                  >
                    {item.agentName}
                  </p>

                  {/* Expandable Specifications List */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <p className="mt-4 text-xs text-[#C9C9D4]/80 leading-relaxed border-t border-white/5 pt-4">
                          {item.tagline}
                        </p>
                        <ul className="mt-4 space-y-2 border-t border-white/5 pt-4">
                          {item.stats.map((stat, idx) => (
                            <li
                              key={idx}
                              className="flex items-center gap-2 font-mono text-[10px] text-white/90"
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span>{stat}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
