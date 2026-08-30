import React from 'react';
import { ScrollRevealImage } from '../ui/scroll-reveal-image';
import { Sparkles, Layers, Sliders, Waves } from 'lucide-react';

const SHOWCASE_ITEMS = [
  {
    title: 'THE THREE WISE MEN ORCHESTRA',
    category: 'AI-Native Council',
    desc: 'Emar (The Scientist), Ricky (The Sound God), and Kingpin (The Vocal Oracle) collaborate in real time with shared project memory.',
    image:
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop',
    icon: Sparkles,
    color: '#F5A800',
  },
  {
    title: 'BEAT LAB & LOG DRUM SCULPTOR',
    category: 'African Groove Engine',
    desc: '16-step polyrhythmic step sequencers tuned for Amapiano log drums, Highlife percussions, and syncopated Afrobeats swing.',
    image:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop',
    icon: Waves,
    color: '#2AFFA3',
  },
  {
    title: 'VOCAL ORACLE SUITE',
    category: 'Harmonic Stacks & Preamp Tube Chains',
    desc: 'Multitrack vocal booth with automatic 3-part micro-tonal harmonies, spatial reverb, and ElevenLabs vocal synthesis.',
    image:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=2070&auto=format&fit=crop',
    icon: Sliders,
    color: '#FF3C00',
  },
];

export const VisualShowcase: React.FC = () => {
  return (
    <section className="relative bg-[#0A0806] py-24 text-[var(--foreground-bright)] overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 md:px-14">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F5A800]/30 bg-[#F5A800]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-[#F5A800]">
            <Layers className="h-3.5 w-3.5" />
            <span>Visual Production Canvas</span>
          </div>
          <h2 className="mt-4 font-display text-5xl tracking-tight text-[var(--foreground-bright)] md:text-7xl">
            BUILT FOR THE <span className="text-[#F5A800]">NEXT GENERATION</span> OF SOUND
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-[#C9C9D4]/70 md:text-base">
            Scroll to experience 3WM SONIK’s state-of-the-art visual and acoustic operating space.
          </p>
        </div>

        {/* Scroll Reveal Stack */}
        <div className="space-y-24">
          {SHOWCASE_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="relative flex flex-col items-center">
                {/* Visual Image with Scroll Reveal Effect */}
                <div className="w-full">
                  <ScrollRevealImage
                    src={item.image}
                    alt={item.title}
                    height="70vh"
                    fromWidth="65%"
                    toWidth="100%"
                    fromRadius="12px"
                    toRadius="32px"
                    fromScale={1.3}
                    toScale={1}
                    stiffness={100}
                    damping={60}
                  />
                </div>

                {/* Overlaid / Accompanying Info Card */}
                <div className="mt-6 flex w-full max-w-4xl items-center justify-between rounded-2xl border border-white/10 bg-[#16120E]/90 p-6 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border shadow-lg"
                      style={{
                        borderColor: item.color,
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                      }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <span
                        className="font-mono text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: item.color }}
                      >
                        {item.category}
                      </span>
                      <h3 className="font-display text-2xl tracking-wider text-[var(--foreground-bright)]">
                        {item.title}
                      </h3>
                      <p className="mt-1 max-w-xl text-xs text-[#C9C9D4]/70">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
