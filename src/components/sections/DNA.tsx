import { motion } from 'framer-motion';
const genres = [
  'Afrobeats',
  'Amapiano',
  'Afrofusion',
  'Afrotrap',
  'Highlife',
  'Hip-Hop',
  'Trap',
  'R&B',
  'Neo-Soul',
];
export function DNA() {
  return (
    <section className="mx-auto grid max-w-[1328px] items-center gap-12 px-5 py-28 md:px-14 lg:grid-cols-2">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[var(--gold)]">
          Cultural Architecture
        </p>
        <h2 className="font-display mt-3 text-6xl leading-none text-[var(--foreground-bright)] md:text-8xl">
          AFRICAN
          <br />
          MUSICAL DNA
        </h2>
        <p className="mt-5 max-w-none text-sm font-light leading-7 text-[var(--muted)]">
          3WM SONIK is built with first-class support for the rhythmic traditions that move the
          world. Not as an afterthought — as a foundation.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {genres.map((g, i) => (
            <motion.span
              whileHover={{ scale: 1.05 }}
              key={g}
              className="rounded-full border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wider"
              style={{
                borderColor: i % 2 ? 'var(--fire)/.3' : 'var(--gold)/.3',
                color: i % 2 ? 'var(--fire)' : 'var(--gold)',
              }}
            >
              {g}
            </motion.span>
          ))}
        </div>
      </div>
      <div className="relative flex min-h-[440px] items-center justify-center">
        <div className="absolute h-72 w-72 rounded-full bg-[var(--gold)]/5 blur-3xl" />
        {[80, 55, 30].map((s, i) => (
          <motion.div
            key={s}
            animate={{ rotate: i % 2 ? -360 : 360 }}
            transition={{ duration: 18 - i * 5, repeat: Infinity, ease: 'linear' }}
            className="absolute rounded-full border"
            style={{
              width: `${s}%`,
              height: `${s}%`,
              borderColor:
                i === 0 ? 'var(--gold)/.2' : i === 1 ? 'var(--fire)/.3' : 'var(--agent-emar)/.4',
            }}
          />
        ))}
        <div className="relative text-center font-display text-xl tracking-widest text-[var(--gold)]">
          3WM
          <br />
          SONIK
        </div>
      </div>
    </section>
  );
}
