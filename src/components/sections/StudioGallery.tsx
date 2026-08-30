import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Maximize2, X, Play, Zap } from 'lucide-react';
import { landingAudioEngine } from '../../audio/landingAudioEngine';
import { Button } from '../ui/button';

export interface StudioGearItem {
  id: string;
  category: 'console' | 'drum_machine' | 'vocal_mic' | 'monitors_subs';
  title: string;
  subtitle: string;
  description: string;
  image: string;
  specs: string[];
  tag: string;
  color: string;
  glow: string;
}

const STUDIO_GEAR: StudioGearItem[] = [
  {
    id: 'console-1',
    category: 'console',
    title: 'KAPPACHINO 32-BUS ANALOG MASTER CONSOLE',
    subtitle: 'Class-A Discrete Saturation & Summing Matrix',
    description:
      'Engineered for Kappachino Emar’s surgical dynamic EQ curves and harmonic saturation chains. Features motorized high-throw faders, precision gold summing busses, and analog VU meters.',
    image: '/images/analog_mixing_console_1787742219421.jpg',
    specs: [
      '32-Channel Discrete Class-A Topology',
      'Dual High-Voltage Tube Saturation Busses',
      'Continuous Dynamic Notch Surgery (<0.002% THD)',
      'Direct DAW Motorized Parameter Synchronization',
    ],
    tag: 'ANALOG DSP MATRIX',
    color: '#2AFFA3',
    glow: 'rgba(42, 255, 163, 0.4)',
  },
  {
    id: 'drum-1',
    category: 'drum_machine',
    title: 'RICKY KOSMOS SYNTH-808 & GROOVE SAMPLER',
    subtitle: 'Afrofusion & Amapiano Log Drum Engine',
    description:
      'The rhythmic core of Kappachino Ricky. Vintage mahogany side-panels paired with high-velocity silicone step pads, real-time CRT waveform scope, and sub-harmonic bass shapers.',
    image: '/images/retro_drum_machine_1787742239739.jpg',
    specs: [
      '16 Poly-Phonic Velocity Step Pads',
      'Dedicated Amapiano Log Drum Resonance Shaper',
      'Analog Oscilloscope CRT Real-Time Monitor',
      'Sub-Bass Pitch & Envelope Decay Automation',
    ],
    tag: '808 BOUNCE ENGINE',
    color: '#F5A800',
    glow: 'rgba(245, 168, 0, 0.4)',
  },
  {
    id: 'mic-1',
    category: 'vocal_mic',
    title: 'KINGPIN ORACLE TUBE CONDENSER',
    subtitle: 'Gold-Sputtered Dual Diaphragm & Preamp',
    description:
      'The sacred instrument of Kingpin. Built with custom dual gold capsules, low-noise vacuum tube circuitry, and a vintage shockmount designed to capture the soul of African vocalists.',
    image: '/images/vintage_vocal_mic_1787742262381.jpg',
    specs: [
      'Gold-Sputtered 1.1-inch Dual Diaphragm',
      'Hand-Selected 6072A Triode Vacuum Tube',
      'Micro-Tonal 3-Part Harmony Capture',
      'Ultra-Low Equivalent Noise Floor (<7 dBA)',
    ],
    tag: 'VOCAL ORACLE SUITE',
    color: '#FF3C00',
    glow: 'rgba(255, 60, 0, 0.4)',
  },
  {
    id: 'monitors-1',
    category: 'monitors_subs',
    title: 'GOLD BUS 18-INCH SUBWOOFERS & MIDFIELDS',
    subtitle: 'Acoustic Chamber Reference Monitoring',
    description:
      'Dual 18-inch carbon fiber subwoofers tuned to 22Hz paired with coaxial midfield studio monitors. Delivers gut-punching low end without distortion in our calibrated mastering chambers.',
    image: '/images/studio_monitors_subs_1787742282733.jpg',
    specs: [
      'Dual 18-inch High-Excursion Carbon Cones',
      'Sub-Bass Frequency Extension down to 22Hz',
      'Coaxial Time-Aligned Midfield Dispersion',
      'Acoustic Waveguide Calibration Array',
    ],
    tag: 'MASTERING MONITORING',
    color: '#F5A800',
    glow: 'rgba(245, 168, 0, 0.4)',
  },
];

export const StudioGallery: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedGear, setSelectedGear] = useState<StudioGearItem | null>(null);
  const [isAuditioning, setIsAuditioning] = useState<boolean>(false);
  const [auditionGearId, setAuditionGearId] = useState<string | null>(null);

  useEffect(() => {
    return landingAudioEngine.subscribeAudition((active, id) => {
      setIsAuditioning(active);
      setAuditionGearId(id);
    });
  }, []);

  const filteredGear =
    activeCategory === 'all'
      ? STUDIO_GEAR
      : STUDIO_GEAR.filter((g) => g.category === activeCategory);

  const handleAudition = (gear: StudioGearItem) => {
    void landingAudioEngine.auditionSoundSignature(gear.id, gear.category);
  };

  const handleCloseModal = () => {
    landingAudioEngine.stopAudition();
    setSelectedGear(null);
  };

  return (
    <section className="relative bg-[var(--background)] py-28 text-[var(--foreground)] overflow-hidden transition-colors duration-300">
      {/* Background Gradients & Noise */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(245,168,0,0.06),transparent_80%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F5A800]/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-5 md:px-14">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F5A800]/30 bg-[#F5A800]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[#F5A800]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>4K Studio Hardware Vault</span>
            </div>
            <h2 className="mt-4 font-display text-5xl tracking-tight text-[var(--foreground-bright)] md:text-7xl">
              ANALOG SOUL. <span className="text-[#F5A800]">AI POWER.</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm text-[#C9C9D4]/70 md:text-base">
              Immerse yourself in 3WM SONIK’s bespoke production gear, analog mixing consoles,
              retro-futuristic drum samplers, and vocal chambers.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-xl">
            {[
              { id: 'all', label: 'All Equipment' },
              { id: 'console', label: 'Mixers & DSP' },
              { id: 'drum_machine', label: '808 Synths' },
              { id: 'vocal_mic', label: 'Vocal Tubes' },
              { id: 'monitors_subs', label: 'Subs & Monitors' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-xl px-4 py-2 font-mono text-xs uppercase tracking-wider transition ${
                  activeCategory === cat.id
                    ? 'bg-[#F5A800] font-bold text-black shadow-lg'
                    : 'text-[#C9C9D4]/60 hover:text-[var(--foreground-bright)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4K Gear Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredGear.map((gear) => (
            <motion.div
              layout
              key={gear.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#14100C]/90 shadow-2xl backdrop-blur-xl transition hover:border-[#F5A800]/40"
            >
              {/* Image Container with Hover Zoom */}
              <div
                className="relative h-80 w-full overflow-hidden bg-black cursor-pointer"
                onClick={() => setSelectedGear(gear)}
              >
                <picture>
                  <source srcSet={gear.image.replace('.jpg', '.avif')} type="image/avif" />
                  <source srcSet={gear.image.replace('.jpg', '.webp')} type="image/webp" />
                  <img
                    src={gear.image}
                    alt={gear.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-[#14100C] via-transparent to-black/30" />

                {/* Top Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span
                    className="rounded-full px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-black shadow-lg"
                    style={{ backgroundColor: gear.color }}
                  >
                    {gear.tag}
                  </span>
                </div>

                {/* Inspect Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGear(gear);
                  }}
                  className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-[var(--foreground-bright)]/80 backdrop-blur-md transition hover:scale-110 hover:text-[var(--foreground-bright)] focus-visible:ring-2 focus-visible:ring-amber-500"
                  title="View 4K Specs"
                  aria-label={`View specs for ${gear.title}`}
                >
                  <Maximize2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-7">
                <div>
                  <h3 className="font-display text-2xl tracking-wider text-[var(--foreground-bright)] group-hover:text-[#F5A800] transition-colors">
                    {gear.title}
                  </h3>
                  <p className="mt-1 font-mono text-xs" style={{ color: gear.color }}>
                    {gear.subtitle}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-[#C9C9D4]/70">
                    {gear.description}
                  </p>

                  {/* Feature Specs */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-white/5 pt-4">
                    {gear.specs.slice(0, 2).map((spec, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 font-mono text-[11px] text-[#C9C9D4]/80"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: gear.color }}
                        />
                        <span className="truncate">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleAudition(gear)}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--foreground-bright)] transition hover:bg-white/10 active:scale-95"
                  >
                    <Play className="h-3.5 w-3.5 fill-current text-[#F5A800]" />
                    <span>Audition Tone</span>
                  </button>

                  <button
                    onClick={() => setSelectedGear(gear)}
                    className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#F5A800] hover:underline"
                  >
                    <span>Full Spec Sheet</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedGear && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGear(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#120F0C] shadow-[0_0_100px_rgba(0,0,0,0.9)] md:flex-row"
            >
              {/* Image Left */}
              <div className="relative h-72 md:h-auto md:w-1/2 bg-black overflow-hidden">
                <picture>
                  <source srcSet={selectedGear.image.replace('.jpg', '.avif')} type="image/avif" />
                  <source srcSet={selectedGear.image.replace('.jpg', '.webp')} type="image/webp" />
                  <img
                    src={selectedGear.image}
                    alt={selectedGear.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-[#120F0C] via-transparent to-black/20" />
              </div>

              {/* Info Right */}
              <div className="flex flex-1 flex-col justify-between p-8 overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-full px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-black"
                      style={{ backgroundColor: selectedGear.color }}
                    >
                      {selectedGear.tag}
                    </span>
                    <button
                      onClick={handleCloseModal}
                      className="rounded-full border border-white/10 bg-white/5 p-2 text-[var(--foreground-bright)]/60 hover:text-[var(--foreground-bright)] focus-visible:ring-2 focus-visible:ring-amber-500"
                      aria-label="Close specs modal"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <h3 className="mt-4 font-display text-3xl tracking-wider text-[var(--foreground-bright)]">
                    {selectedGear.title}
                  </h3>
                  <p className="mt-1 font-mono text-xs" style={{ color: selectedGear.color }}>
                    {selectedGear.subtitle}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-[#C9C9D4]/80">
                    {selectedGear.description}
                  </p>

                  {/* Full Specifications */}
                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
                    <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-[#F5A800] mb-3">
                      Acoustic & Hardware Architecture
                    </h4>
                    <ul className="space-y-2.5">
                      {selectedGear.specs.map((s, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2.5 font-mono text-xs text-[var(--foreground-bright)]/90"
                        >
                          <Zap className="h-3.5 w-3.5 text-[#F5A800]" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 pt-4 border-t border-white/10">
                  <Button
                    variant={isAuditioning && auditionGearId === selectedGear.id ? 'fire' : 'gold'}
                    onClick={() => handleAudition(selectedGear)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-mono font-bold tracking-wider transition-all duration-300"
                  >
                    {isAuditioning && auditionGearId === selectedGear.id ? (
                      <>
                        <span className="flex gap-1 items-center mr-1">
                          <span
                            className="w-1 h-3 bg-white animate-bounce"
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className="w-1 h-4 bg-white animate-bounce"
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className="w-1 h-2 bg-white animate-bounce"
                            style={{ animationDelay: '300ms' }}
                          />
                        </span>
                        <span>STOP AUDITION [LIVE DSP PLAYING]</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-current" />
                        <span>AUDITION SOUND SIGNATURE</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default StudioGallery;
