export function Footer() {
  const columns: Array<[string, string[]]> = [
    ['Studio', ['Beat Lab', 'Piano Roll', 'Recording', 'Mixer', 'Mastering', 'AI Console']],
    [
      'The Three',
      [
        'Emar — The Scientist',
        'Ricky — The Sound God',
        'Kingpin — Vocal Oracle',
        'Orchestrator',
        'Agent Architecture',
      ],
    ],
    ['Product', ['Pricing', 'Testimonials', 'FAQ', 'Roadmap', 'Changelog']],
    ['Company', ['About', 'Docs', 'Community', 'Contact', 'Careers']],
  ];
  return (
    <footer id="access" className="border-t border-[#f5a800]/10 px-5 py-16 md:px-14">
      <div className="mx-auto max-w-[1328px]">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <p className="font-mono text-xs tracking-widest text-[var(--muted)]">THREE WISE MEN</p>
            <p className="font-display mt-2 text-3xl tracking-widest text-[#f5a800]">
              🔱 3WM SONIK
            </p>
            <p className="font-mono mt-1 text-[10px] tracking-widest text-[var(--muted)]">
              ONE VISION. THREE MINDS. INFINITE SOUND.
            </p>
            <p className="mt-5 max-w-sm text-sm font-light leading-6 text-[var(--muted)]">
              The AI-native music production studio built for producers who demand more than an AI
              assistant inside a legacy DAW.
            </p>
          </div>
          {columns.map(([title, items]) => (
            <div key={title}>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#f5a800]">
                {title}
              </p>
              <ul className="mt-5 space-y-3">
                {items.map((x) => (
                  <li key={x}>
                    <a
                      href="#"
                      className="text-sm text-[var(--muted)] transition hover:text-[var(--foreground-bright)]"
                    >
                      {x}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap justify-between gap-4 border-t border-[#f5a800]/10 pt-7 font-mono text-[10px] tracking-wider text-[var(--muted)]">
          <span>© 2026 Three Wise Men Productions. All rights reserved.</span>
          <span>🔱 EMAR · RICKY · KINGPIN</span>
        </div>
      </div>
    </footer>
  );
}
