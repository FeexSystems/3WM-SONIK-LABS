import { Zap, Shield, Crown } from 'lucide-react';

export function WhyUs() {
  return (
    <section className="relative bg-[#0D0D0D] py-16">
      <div className="mx-auto max-w-7xl px-5 md:px-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              color: '#F5A800',
              title: 'Faster',
              desc: '30 min from idea to radio-ready. Council debates while you create.',
              metric: '10× faster',
            },
            {
              icon: Shield,
              color: '#2AFFA3',
              title: 'Easier',
              desc: 'No engineering school. Speak to Emar, Ricky, Kingpin — they translate.',
              metric: 'No manual',
            },
            {
              icon: Crown,
              color: '#FF3C00',
              title: 'African DNA',
              desc: 'Log drum, Amapiano, Afrobeats, Highlife — not Berlin Techno.',
              metric: 'Built for Africa',
            },
          ].map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center"
              >
                <div
                  className="mx-auto w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${b.color}15`, border: `1px solid ${b.color}30` }}
                >
                  <Icon className="w-5 h-5" style={{ color: b.color }} />
                </div>
                <div
                  className="mt-3 font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: b.color }}
                >
                  {b.metric}
                </div>
                <h3 className="mt-2 font-display text-xl text-white">{b.title}</h3>
                <p className="mt-2 font-mono text-xs leading-relaxed text-neutral-400">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
