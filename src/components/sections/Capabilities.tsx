import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Play, Pause, RefreshCw, Volume2 } from 'lucide-react';
import { useLandingAudio } from '../../context/LandingAudioContext';
import { landingAudioEngine } from '../../audio/landingAudioEngine';

const caps = [
  [
    '🎹',
    'Piano Roll',
    'Full MIDI editor with quantization, velocity painting, chord suggestions, and scale-aware note validation from Emar in real time.',
    'Emar',
    '#2affa3',
  ],
  [
    '🎙️',
    'Recording',
    "Multi-track vocal and instrument recording with take management, punch-in/out, and Kingpin's real-time vocal coaching overlay.",
    'Kingpin',
    '#ff3c00',
  ],
  [
    '🎚️',
    'Mixer & FX',
    'Full mixing console with per-track EQ, compression, sends, and AI-assisted gain staging.',
    'Emar',
    '#2affa3',
  ],
  [
    '💿',
    'Mastering',
    'Reference-based mastering engine with LUFS targeting, multi-band limiting, and streaming platform presets.',
    'Ricky',
    '#f5a800',
  ],
  [
    '⚡',
    'Lightning Sync',
    'Instant state persistence across sessions. Your track configurations are saved flawlessly using our newly integrated Supabase Postgres backend.',
    'System',
    '#2affa3',
  ],
  [
    '☁️',
    'Infinite Storage',
    'Direct-to-cloud S3 audio streaming. Safely upload unlimited vocal takes, stems, and heavy instrumental files without slowing down your browser.',
    'System',
    '#f5a800',
  ],
  [
    '🤝',
    'Multiplayer',
    'Live, real-time collaboration with other producers anywhere in the world, synchronized flawlessly over WebSockets via Y.js.',
    'System',
    '#ff3c00',
  ],
  [
    '🧠',
    'Agent Memory',
    'Each agent maintains a project memory — preferred key, tempo tendencies, sound palette, and decision history.',
    'All Three',
    '#f5a800',
  ],
  [
    '🌐',
    'AI Console',
    'Talk to the Three directly. Each responds in their own voice and executes tools on real project state.',
    'Kingpin',
    '#ff3c00',
  ],
];

export function Capabilities() {
  const { isPlaying, togglePlay, currentStep, stepPattern, toggleStep, generateRickyBounce } =
    useLandingAudio();

  const tracks = [
    { id: 'kick', label: 'Kick Drum', color: '#2affa3' },
    { id: 'logdrum', label: 'Log Drum', color: '#f5a800' },
    { id: 'shaker', label: 'Shaker / Hat', color: '#c9c9d4' },
    { id: 'rim', label: 'Afro Rimshot', color: '#ff3c00' },
  ];

  const [activeAudition, setActiveAudition] = useState<string | null>(null);

  const handleAudition = (title: string) => {
    setActiveAudition(title);
    landingAudioEngine.playAuditionTone(title);
    setTimeout(() => setActiveAudition(null), 1200);
  };

  return (
    <section id="capabilities" className="mx-auto max-w-[1328px] px-5 py-28 md:px-14">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#ff3c00]">
            What's inside
          </p>
          <h2 className="font-display mt-3 text-6xl leading-none text-[var(--foreground-bright)] md:text-8xl">
            THE FULL STACK
            <br />
            OF PRODUCTION
          </h2>
          <p className="mt-5 max-w-xl text-sm font-light leading-7 text-[var(--muted)]">
            Every professional workflow in one unified workspace. Test the interactive Beat Lab
            sequencer below or tap any capability card to audition its signature acoustic sound
            profile.
          </p>
        </div>

        {/* Ricky AI Auto-Bounce Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={generateRickyBounce}
            className="px-5 py-3 rounded-xl border border-[#f5a800]/40 bg-[#f5a800]/10 hover:bg-[#f5a800]/20 text-[#f5a800] font-mono text-xs font-bold tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,168,0,0.15)]"
          >
            <Sparkles className="w-4 h-4" />
            RICKY: AI AUTO-BOUNCE
          </button>
          <button
            onClick={togglePlay}
            className={`h-12 px-6 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all ${
              isPlaying
                ? 'bg-[#ff3c00] text-[var(--foreground-bright)]'
                : 'bg-white text-black hover:bg-white/90'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {isPlaying ? 'PAUSE GRID' : 'PLAY GRID'}
          </button>
        </div>
      </div>

      {/* Featured Interactive 16-Step Beat Lab Widget */}
      <div className="mb-14 rounded-2xl border border-[#f5a800]/30 bg-black/60 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2 font-mono text-xs text-[#f5a800] uppercase tracking-widest font-bold">
            <span className="text-xl">🥁</span>
            Interactive Beat Lab Sequencer (16-Step Sandbox)
          </div>
          <span className="font-mono text-[10px] text-[var(--muted)]">
            STEP: <b className="text-[var(--foreground-bright)]">{currentStep + 1}</b> / 16
          </span>
        </div>

        <div className="space-y-3">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="grid grid-cols-[100px_1fr] md:grid-cols-[140px_1fr] items-center gap-3"
            >
              <span className="font-mono text-[11px] text-[var(--muted)] uppercase tracking-wider truncate">
                {track.label}
              </span>
              <div className="grid grid-cols-16 gap-1 sm:gap-1.5">
                {stepPattern[track.id]?.map((active, stepIdx) => {
                  const isCurrent = isPlaying && currentStep === stepIdx;
                  return (
                    <button
                      key={stepIdx}
                      onClick={() => toggleStep(track.id, stepIdx)}
                      className={`h-10 rounded-md transition-all duration-150 relative ${
                        active ? 'shadow-[0_0_10px_currentColor]' : 'bg-white/5 hover:bg-white/10'
                      } ${isCurrent ? 'ring-2 ring-white scale-105 z-10' : ''}`}
                      style={{
                        backgroundColor: active ? track.color : undefined,
                        color: track.color,
                      }}
                      title={`Step ${stepIdx + 1} (${active ? 'Active' : 'Inactive'})`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Capabilities Feature Grid with Interactive Audition Tones */}
      <div
        className="grid overflow-hidden rounded-2xl border border-[#f5a800]/10 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5"
        role="list"
      >
        {caps.map(([icon, title, body, badge, color], i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ delay: (i % 3) * 0.06 }}
            whileHover={{ backgroundColor: '#1c1811' }}
            onClick={() => handleAudition(title)}
            className={`min-h-56 bg-[#181410] p-7 focus-within:ring-2 focus-within:ring-[#f5a800]/30 transition-all cursor-pointer group relative ${
              activeAudition === title ? 'ring-2 ring-[#f5a800] bg-[#221a12]' : ''
            }`}
            role="listitem"
            tabIndex={0}
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{icon}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAudition(title);
                }}
                className={`p-2 rounded-full border transition-all flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider ${
                  activeAudition === title
                    ? 'bg-[#f5a800] text-black border-[#f5a800] scale-105 shadow-[0_0_15px_rgba(245,168,0,0.5)]'
                    : 'bg-white/5 border-white/10 text-[var(--muted)] hover:text-white hover:bg-white/10'
                }`}
                title="Audition Sound Signature"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{activeAudition === title ? 'Playing...' : 'Audition'}</span>
              </button>
            </div>

            <h3 className="font-display mt-4 text-2xl text-[var(--foreground-bright)] group-hover:text-[#f5a800] transition-colors">
              {title}
            </h3>
            <p className="mt-2 text-xs font-light leading-6 text-[var(--muted)]">{body}</p>
            <span
              className="mt-5 inline-block rounded bg-white/5 px-2 py-1 font-mono text-[9px] uppercase tracking-widest"
              style={{ color }}
            >
              {badge}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
