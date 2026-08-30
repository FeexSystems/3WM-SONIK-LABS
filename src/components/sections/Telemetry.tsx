import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Cpu, Network, Zap, Radio, Globe } from 'lucide-react';

const metrics = [
  {
    label: 'DSP LATENCY',
    value: '< 8.4ms',
    icon: <Zap size={14} className="text-[#f5a800]" />,
    desc: 'Real-time buffer handling',
  },
  {
    label: 'AUDIO ENGINE',
    value: '32-BIT FLOAT',
    icon: <Cpu size={14} className="text-[#2affa3]" />,
    desc: 'Web Audio isolated processing',
  },
  {
    label: 'AI INFERENCE',
    value: 'STREAMING',
    icon: <Radio size={14} className="text-[#ff3c00]" />,
    desc: 'Sub-100ms multi-agent reasoning',
  },
  {
    label: 'ANALYSIS',
    value: 'FFT 4096',
    icon: <Activity size={14} className="text-[var(--foreground-bright)]" />,
    desc: 'High-resolution spectral vision',
  },
];

const liveEvents = [
  {
    city: 'Lagos, NG',
    agent: 'Emar',
    action: 'Calibrated 42Hz log drum harmonic resonance',
    time: '2s ago',
    color: '#2affa3',
  },
  {
    city: 'London, UK',
    agent: 'Ricky',
    action: 'Synthesized 140 BPM drill 808 sliding bassline',
    time: '5s ago',
    color: '#f5a800',
  },
  {
    city: 'Johannesburg, SA',
    agent: 'Kingpin',
    action: 'Generated 3-part Amapiano vocal harmony stack',
    time: '8s ago',
    color: '#ff3c00',
  },
  {
    city: 'Atlanta, US',
    agent: 'Ricky',
    action: 'Auto-bounced syncopated Afro-Trap drum groove',
    time: '12s ago',
    color: '#f5a800',
  },
  {
    city: 'Accra, GH',
    agent: 'Emar',
    action: 'Resolved 240Hz phase cancellation across 8 stems',
    time: '15s ago',
    color: '#2affa3',
  },
];

export function Telemetry() {
  const [eventIndex, setEventIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setEventIndex((prev) => (prev + 1) % liveEvents.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const currentEvent = liveEvents[eventIndex];

  return (
    <section className="mx-auto max-w-[1328px] px-5 py-24 md:px-14">
      <div className="border border-[#f5a800]/20 bg-[#0a0900] p-8 lg:p-12 shadow-[0_0_80px_rgba(245,168,0,.03)] relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 sonic-grid opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-0 bg-[#f5a800]/10 w-64 h-64 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#2affa3]">
              SYSTEM TELEMETRY
            </p>
            <h2 className="font-display mt-3 text-4xl text-[var(--foreground-bright)] md:text-5xl">
              PROFESSIONAL GRADE
              <br />
              <span className="text-[#f5a800]">ARCHITECTURE.</span>
            </h2>
          </div>

          {/* Live Global Activity Ticker */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 max-w-md w-full backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase text-[#f5a800] tracking-widest flex items-center gap-1.5 font-bold">
                <Globe className="w-3.5 h-3.5 animate-spin" /> Live Global Studio Stream
              </span>
              <span className="font-mono text-[9px] text-[var(--muted)]">{currentEvent.time}</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={eventIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="font-mono text-xs text-[var(--foreground-bright)] flex items-baseline gap-2"
              >
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                  style={{ backgroundColor: `${currentEvent.color}20`, color: currentEvent.color }}
                >
                  {currentEvent.agent}
                </span>
                <span className="truncate text-[var(--muted)]">[{currentEvent.city}]</span>
                <span className="truncate font-light text-[#c9c9d4]">{currentEvent.action}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="relative z-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border border-white/5 bg-black/40 p-5 rounded-2xl backdrop-blur-sm transition-all hover:bg-black/60 hover:border-[#f5a800]/30 hover:scale-[1.02]"
            >
              <div className="flex items-center gap-2 mb-4 font-mono text-[10px] tracking-widest text-[var(--muted)]">
                {m.icon}
                {m.label}
              </div>
              <div className="font-mono text-2xl font-bold text-[var(--foreground-bright)] tracking-wider mb-2">
                {m.value}
              </div>
              <div className="text-xs font-light text-[var(--muted)]/60">{m.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
