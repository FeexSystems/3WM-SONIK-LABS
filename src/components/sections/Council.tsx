import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Sparkles, MessageSquare, Play, Pause, Disc3 } from 'lucide-react';
import { landingAudioEngine } from '../../audio/landingAudioEngine';

const people = [
  {
    id: 'emar',
    code: 'Kappachino Emar',
    title: 'THE SCIENTIST',
    icon: '🧬',
    color: '#2AFFA3',
    tagline: 'Understand the sound. Control the system.',
    body: "The analytical core. Emar understands tempo, key, scale, spectral balance, audio analysis, and the technical architecture of your project. When something isn't right, Emar knows why.",
    voiceQuote:
      'Phase cancellation detected in the low-mids at 240Hz. Calibrating dynamic harmonic resonance now.',
    tools: [
      'Audio spectral analysis',
      'Harmonic & scale detection',
      'MIDI structure validation',
      'Frequency conflict resolution',
      'Project state inspection',
    ],
  },
  {
    id: 'ricky',
    code: 'Kappachino Ricky',
    title: 'THE SOUND GOD',
    icon: '🔊',
    color: '#F5A800',
    tagline: 'Find the sound. Build the bounce.',
    body: 'The creative force behind the beat. Ricky owns synthesis, drum programming, 808 design, sampling, instrument layering, and sound design. He builds the sound world your track lives in.',
    voiceQuote:
      'That Amapiano log drum needs that West African syncopation. Watch me lay down the syncopated bounce.',
    tools: [
      'Beat Lab & drum programming',
      '808 synthesis & pitch',
      'Sampler & instrument design',
      'Arrangement & layering',
      'Mixing & FX chain',
    ],
  },
  {
    id: 'kingpin',
    code: 'Kingpin',
    title: 'THE VOCAL ORACLE',
    icon: '🎙️',
    color: '#FF3C00',
    tagline: 'Give the voice a body. Give the body a soul.',
    body: 'The voice of the track. Kingpin handles vocal recording, pitch orchestration, harmony generation, vocal FX, and the emotional performance layer that transforms a beat into a record.',
    voiceQuote:
      'Stack the third harmony in the chorus and bring in that lush Yoruba vocal chant texture.',
    tools: [
      'Vocal recording & comping',
      'Pitch correction & tuning',
      'Harmony & vocal stack',
      'Vocal FX & texture',
      'Emotional performance analysis',
    ],
  },
];

export function Council() {
  const [activeVoice, setActiveVoice] = useState<string | null>(null);
  const [simulatingDebate, setSimulatingDebate] = useState(false);
  const [debateStep, setDebateStep] = useState(0);

  const handleVoicePreview = (person: (typeof people)[0]) => {
    if (activeVoice === person.id) {
      setActiveVoice(null);
      return;
    }
    setActiveVoice(person.id);

    // Audio synthesis feedback + Speech output
    if (person.id === 'emar') {
      landingAudioEngine.playMelodicChord(0);
      landingAudioEngine.speakAgentVoice('emar', person.voiceQuote);
    } else if (person.id === 'ricky') {
      landingAudioEngine.playLogDrum(0, 55);
      landingAudioEngine.playKick(0);
      landingAudioEngine.speakAgentVoice('ricky', person.voiceQuote);
    } else if (person.id === 'kingpin') {
      landingAudioEngine.playVocalChant(0);
      landingAudioEngine.speakAgentVoice('kingpin', person.voiceQuote);
    }

    // Auto clear after 4 seconds
    setTimeout(() => {
      setActiveVoice((prev) => (prev === person.id ? null : prev));
    }, 4500);
  };

  const debateDialogues = [
    {
      id: 'emar' as const,
      agent: 'EMAR',
      color: '#2AFFA3',
      text: 'Phase cancellation detected in the low-mids at 42Hz. Recommend 2dB dynamic notch.',
    },
    {
      id: 'ricky' as const,
      agent: 'RICKY',
      color: '#F5A800',
      text: "Don't cut the weight! I'll re-tune the log drum to F# Minor and shift the attack transient.",
    },
    {
      id: 'kingpin' as const,
      agent: 'KINGPIN',
      color: '#FF3C00',
      text: 'Perfect. That leaves space for the low-mid vocal chant to ride right on top of the groove.',
    },
    {
      id: 'orchestrator' as const,
      agent: 'ORCHESTRATOR',
      color: '#F5A800',
      text: 'ThreeWM Orchestrator: Consensus achieved. Project snapshot saved.',
    },
  ];

  const handleStartDebate = () => {
    if (simulatingDebate) return;
    setSimulatingDebate(true);
    setDebateStep(0);

    const runSteps = (step: number) => {
      if (step >= debateDialogues.length) {
        setTimeout(() => setSimulatingDebate(false), 3000);
        return;
      }
      setDebateStep(step);
      const dialogue = debateDialogues[step];

      if (dialogue.id === 'emar') landingAudioEngine.playMelodicChord(0);
      if (dialogue.id === 'ricky') landingAudioEngine.playLogDrum(0, 55);
      if (dialogue.id === 'kingpin') landingAudioEngine.playVocalChant(0);

      landingAudioEngine.speakAgentVoice(dialogue.id, dialogue.text);

      setTimeout(() => runSteps(step + 1), 3200);
    };

    runSteps(0);
  };

  return (
    <section id="council" className="mx-auto max-w-[1328px] px-5 py-28 md:px-14">
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#f5a800]">
          — The Three Wise Men —
        </p>
        <h2 className="font-display mt-3 text-6xl leading-none text-[var(--foreground-bright)] md:text-8xl">
          THE COUNCIL OF SOUND
        </h2>
        <p className="mt-5 text-sm font-light leading-7 text-[var(--muted)]">
          Three specialized AI agents, each with their own domain, memory, and toolset — coordinated
          by a fourth system intelligence that keeps them aligned to your vision.
        </p>

        {/* Live Council Debate Trigger */}
        <div className="mt-7 flex justify-center">
          <button
            onClick={handleStartDebate}
            disabled={simulatingDebate}
            className="px-5 py-2.5 rounded-full border border-[#f5a800]/40 bg-[#f5a800]/10 hover:bg-[#f5a800]/20 text-[var(--foreground-bright)] font-mono text-xs tracking-wider flex items-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(245,168,0,0.2)] disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#f5a800] animate-spin" />
            {simulatingDebate ? 'COUNCIL DEBATING IN REAL-TIME...' : 'SIMULATE LIVE COUNCIL DEBATE'}
          </button>
        </div>

        {/* Real-Time Debate Live Box */}
        <AnimatePresence>
          {simulatingDebate && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-4 rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl text-left max-w-xl mx-auto"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#f5a800] animate-ping" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#f5a800]">
                  Session Telemetry Stream
                </span>
              </div>
              <p
                className="font-mono text-xs leading-relaxed"
                style={{ color: debateDialogues[debateStep]?.color || '#ffffff' }}
              >
                {debateDialogues[debateStep]?.text}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid overflow-hidden rounded-2xl border border-[var(--gold)]/10 md:grid-cols-3 gap-px bg-white/5">
        {people.map((p, i) => (
          <motion.article
            key={p.code}
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="group relative overflow-hidden bg-[var(--surface)] p-8 md:p-11 transition-all duration-500 hover:shadow-2xl flex flex-col justify-between"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
              style={{ boxShadow: `inset 0 0 100px ${p.color}15, 0 0 40px ${p.color}30` }}
            />
            <div
              className="absolute -top-32 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full opacity-0 blur-[80px] transition-all duration-700 group-hover:opacity-[0.15] group-hover:scale-110"
              style={{ background: p.color }}
            />

            <div>
              <div className="flex justify-between items-start">
                <span className="relative text-5xl drop-shadow-md group-hover:animate-pulse transition-all">
                  {p.icon}
                </span>

                {/* Voice Preview Button */}
                <button
                  onClick={() => handleVoicePreview(p)}
                  className={`px-3 py-1.5 rounded-full border text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    activeVoice === p.id
                      ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                      : 'bg-black/40 border-white/10 text-[var(--muted)] hover:border-white/30 hover:text-[var(--foreground-bright)]'
                  }`}
                >
                  <Volume2
                    className={`w-3 h-3 ${activeVoice === p.id ? 'animate-bounce' : ''}`}
                    style={{ color: activeVoice === p.id ? '#000' : p.color }}
                  />
                  {activeVoice === p.id ? 'Speaking...' : 'Listen to Voice'}
                </button>
              </div>

              <p
                className="relative mt-5 font-mono text-[10px] uppercase tracking-[.16em]"
                style={{ color: p.color }}
              >
                {p.code}
              </p>
              <h3 className="relative mt-1 font-display text-4xl text-[var(--foreground-bright)]">
                {p.title}
              </h3>
              <p className="relative font-mono text-[11px] mt-1 text-[#c9c9d4]/60 italic font-light">
                "{p.tagline}"
              </p>

              <div
                className="relative my-4 h-0.5 w-10 transition-all duration-500 group-hover:w-full group-hover:opacity-80"
                style={{ background: p.color }}
              />

              <p className="relative text-sm font-light leading-7 text-[var(--muted)] group-hover:text-[var(--foreground-bright)]/90 transition-colors">
                {p.body}
              </p>

              {/* Voice Quote Bubble when active */}
              {activeVoice === p.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-3 rounded-lg border bg-black/70 font-mono text-[11px] leading-relaxed"
                  style={{ borderColor: `${p.color}40`, color: p.color }}
                >
                  🔊 "{p.voiceQuote}"
                </motion.div>
              )}

              <ul className="relative mt-6 space-y-2">
                {p.tools.map((t) => (
                  <li
                    key={t}
                    className="rounded bg-black/30 px-3 py-2 font-mono text-[10px] tracking-wide text-[var(--muted)] group-hover:bg-black/50 transition-colors"
                  >
                    <span style={{ color: p.color }}>▸</span> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <div className="h-1 overflow-hidden rounded bg-white/5">
                <motion.div
                  className="h-full opacity-80"
                  style={{ background: p.color }}
                  initial={{ width: '25%' }}
                  whileInView={{ width: `${72 + i * 10}%` }}
                  transition={{ duration: 1.2, delay: 0.15 }}
                />
              </div>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-[var(--muted)]">
                Domain confidence · {72 + i * 10}%
              </p>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-5 border border-t-0 border-[var(--gold)]/10 bg-[var(--dark-amber)] px-7 py-7 rounded-b-2xl">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
            System Intelligence
          </p>
          <h3 className="font-display text-2xl tracking-widest text-[var(--gold)]">
            🔱 THREEWM ORCHESTRATOR
          </h3>
        </div>
        <p className="max-w-2xl text-sm font-light leading-6 text-[var(--muted)]">
          A fourth coordination layer that routes tasks between the Three, manages agent consensus,
          resolves conflicts, and ensures the producer's intent is preserved across every automated
          action. No agent oversteps.
        </p>
        <div className="flex gap-2">
          {['#2AFFA3', '#F5A800', '#FF3C00', '#F5A800'].map((c, i) => (
            <motion.i
              key={i}
              animate={{ scale: [0.8, 1, 0.8], opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.35 }}
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
