import { AlertTriangle, Zap, Clock } from 'lucide-react';

const PAINS = [
  {
    icon: AlertTriangle,
    color: '#FF3C00',
    title: 'Muddy low-end',
    pain: 'Kick and 808 fight at 50Hz. Mix never translates.',
    fix: 'Emar cuts 240Hz, sidechains 45Hz, Council votes on LUFS.',
    subheading: 'We hear your struggle — low-end is 70% of Afrobeats failures.',
  },
  {
    icon: Zap,
    color: '#F5A800',
    title: 'Lifeless 808s',
    pain: '808s sound flat, no glide, no bounce.',
    fix: 'Ricky sculpts log drum + Spinz 808 with glide 70ms & tube drive.',
    subheading: 'You need bounce, not just bass — we built the bounce engine.',
  },
  {
    icon: Clock,
    color: '#2AFFA3',
    title: 'Hours to master',
    pain: 'Mastering takes 4 hours, still not radio-ready.',
    fix: 'Council masters in 30 sec: Lagos Bounce, -14 LUFS, true-peak safe.',
    subheading: 'You want speed without sacrifice — Council delivers both.',
  },
];

export function PainPoints() {
  return (
    <section className="relative bg-[#0D0D0D] py-16 border-y border-white/5">
      <div className="mx-auto max-w-7xl px-5 md:px-14">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl tracking-tight text-white">
            We built <span className="text-[#FF3C00]">3WM</span> because we lived these.
          </h2>
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-neutral-500">
            Pain points — and how each Wise Man solves them
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {PAINS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="rounded-2xl border border-white/10 bg-[#181410] p-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${p.color}15`, border: `1px solid ${p.color}30` }}
                >
                  <Icon className="w-5 h-5" style={{ color: p.color }} />
                </div>
                <h3 className="mt-4 font-display text-lg text-white">{p.title}</h3>
                <p className="mt-2 font-mono text-xs text-neutral-500">{p.subheading}</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-red-950/30 border border-red-900/30 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-red-400">
                      Pain
                    </div>
                    <div className="mt-1 font-mono text-xs text-red-200/80">{p.pain}</div>
                  </div>
                  <div className="rounded-xl bg-emerald-950/30 border border-emerald-900/30 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                      3WM Solution
                    </div>
                    <div className="mt-1 font-mono text-xs text-emerald-200/80">{p.fix}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
