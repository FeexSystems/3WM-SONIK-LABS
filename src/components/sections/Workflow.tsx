import { motion } from 'framer-motion';
const steps = [
  ['💡', 'IDEA', 'Describe the track. Emar locks in key, tempo, scale.'],
  ['🥁', 'BEAT', 'Ricky builds the drum pattern and 808 architecture.'],
  ['🎹', 'ARRANGE', 'MIDI layers, chords, and melodics in the piano roll.'],
  ['🎙️', 'RECORD', 'Kingpin coaches the session, catches takes, tunes vocals.'],
  ['🎚️', 'MIX', 'Emar & Ricky balance levels, space, and dynamics.'],
  ['💿', 'MASTER', 'Reference-matched, platform-ready. Export and release.'],
];
export function Workflow() {
  return (
    <section id="workflow" className="mx-auto max-w-[1328px] px-5 py-28 md:px-14">
      <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#ff3c00]">
        The pipeline
      </p>
      <h2 className="font-display mt-3 text-6xl leading-none text-[var(--foreground-bright)] md:text-8xl">
        IDEA TO MASTER.
        <br />
        IN ONE SESSION.
      </h2>
      <p className="mt-5 max-w-none text-sm font-light leading-7 text-[var(--muted)]">
        Every stage is informed by agents who actually understand what came before.
      </p>
      <div className="relative mt-16 grid gap-8 md:grid-cols-6 md:gap-0" role="list">
        <div
          className="absolute left-[8%] right-[8%] top-7 hidden h-px bg-gradient-to-r from-[#2affa3] via-[#f5a800] via-60% to-[#ff3c00] md:block"
          aria-hidden="true"
        />
        {steps.map(([icon, title, body], i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="relative text-center"
            role="listitem"
            tabIndex={0}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#f5a800] bg-[#181410] text-xl shadow-[0_0_22px_rgba(245,168,0,.12)]"
              aria-hidden="true"
            >
              {icon}
            </motion.div>
            <h3 className="font-display mt-5 text-base tracking-widest text-[var(--foreground-bright)]">
              {title}
            </h3>
            <p className="mx-auto mt-1 max-w-40 text-xs font-light leading-5 text-[var(--muted)]">
              {body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
