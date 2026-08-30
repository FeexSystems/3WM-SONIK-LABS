import { Music, Mic, Sliders, ArrowRight } from 'lucide-react';

const USE_CASES = [
  {
    id: 'afrobeats-bounce',
    agent: 'RICKY',
    color: '#F5A800',
    icon: Music,
    title: 'Afrobeats 808 Bounce',
    subtitle: 'Drums, 808, groove — Ricky builds the bounce',
    bullets: [
      'Amapiano log drum glide & 808 distortion',
      '16-step bounce with Lagos swing',
      'One prompt → full drum kit',
    ],
    cta: 'Try Ricky →',
  },
  {
    id: 'vocal-stack',
    agent: 'KINGPIN',
    color: '#FF3C00',
    icon: Mic,
    title: 'Vocal Harmony Stack',
    subtitle: '3-part harmony — Kingpin gives the voice a body',
    bullets: [
      'Lead → double → harmony in one take',
      'Formant & Auto-Tune per stack',
      'ElevenLabs oracle preview',
    ],
    cta: 'Try Kingpin →',
  },
  {
    id: 'surgical-mix',
    agent: 'EMAR',
    color: '#2AFFA3',
    icon: Sliders,
    title: 'Surgical Mix → Master',
    subtitle: 'DSP surgery — Emar controls the system',
    bullets: [
      'Spectral notch at 240Hz, LUFS -14',
      'Sidechain & stereo imaging',
      'Brickwall limiter, true-peak safe',
    ],
    cta: 'Try Emar →',
  },
];

export function UseCases() {
  return (
    <section className="relative bg-[#0D0D0D] py-20">
      <div className="mx-auto max-w-7xl px-5 md:px-14">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[#F5A800]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F5A800] animate-pulse" /> Use cases
          </div>
          <h2 className="mt-4 font-display text-4xl md:text-5xl tracking-tight text-white">
            One studio. <span className="text-[#F5A800]">Three specialists.</span>
          </h2>
          <p className="mt-3 text-sm text-neutral-400">
            Pick the problem. The right Wise Man answers — and the other two debate to consensus.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            return (
              <div
                key={uc.id}
                className="group relative rounded-2xl border border-white/10 bg-[#181410]/80 p-6 backdrop-blur-xl hover:border-white/20 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${uc.color}15`, border: `1px solid ${uc.color}30` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: uc.color }} />
                  </div>
                  <div className="font-mono text-[10px] tracking-widest text-neutral-500">
                    {uc.agent} · USE CASE
                  </div>
                </div>
                <h3 className="mt-4 font-display text-xl tracking-wide text-white">{uc.title}</h3>
                <p className="mt-1 font-mono text-xs text-neutral-400">{uc.subtitle}</p>
                <ul className="mt-4 space-y-2">
                  {uc.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2 font-mono text-xs text-neutral-300"
                    >
                      <span
                        className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: uc.color }}
                      />
                      {b}
                    </li>
                  ))}
                </ul>
                <div
                  className="mt-6 flex items-center gap-1.5 font-mono text-xs font-bold"
                  style={{ color: uc.color }}
                >
                  {uc.cta} <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
