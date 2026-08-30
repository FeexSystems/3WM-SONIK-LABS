const rules = [
  [
    '01',
    'MUSIC FIRST',
    'Audio and MIDI are the primary state of the system. Everything else serves them.',
    'var(--agent-emar)',
  ],
  [
    '02',
    'REAL EXECUTION',
    'AI responses correspond to actual tool execution on real project state — not suggestions.',
    'var(--agent-ricky)',
  ],
  [
    '03',
    'REVERSIBILITY',
    'Every action — producer or AI — is undoable. You never lose what you had.',
    'var(--agent-kingpin)',
  ],
  [
    '04',
    'HUMAN CONTROL',
    'The producer is the final authority. AI proposes; you decide what ships.',
    'var(--agent-emar)',
  ],
  [
    '05',
    'SPECIALIZATION',
    "Each agent stays in their lane. No one pretends to know what they don't.",
    'var(--agent-ricky)',
  ],
  [
    '06',
    'SHARED CONTEXT',
    'All three agents read the same project world model. No agent works blind.',
    'var(--agent-kingpin)',
  ],
  [
    '07',
    'PROFESSIONAL AUDIO',
    'Processing is deterministic, measurable, inspectable. No black-box outputs.',
    'var(--agent-emar)',
  ],
  [
    '08',
    'AFRICAN DNA',
    'Afrobeats, Amapiano, Highlife — first-class, not optional.',
    'var(--agent-ricky)',
  ],
];
export function Principles() {
  return (
    <section className="mx-auto max-w-[1328px] px-5 py-24 md:px-14">
      <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#2affa3]">
        Product Philosophy
      </p>
      <h2 className="font-display mt-3 text-6xl leading-none text-[var(--foreground-bright)] md:text-8xl">
        BUILT ON
        <br />
        EIGHT RULES
      </h2>
      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {rules.map(([n, t, b, c]) => (
          <div key={n} className="border-t-2 pt-5" style={{ borderColor: c }}>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--muted)]">
              Rule {n}
            </p>
            <h3 className="font-display mt-2 text-xl text-[var(--foreground-bright)]">{t}</h3>
            <p className="mt-2 text-xs font-light leading-6 text-[var(--muted)]">{b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
