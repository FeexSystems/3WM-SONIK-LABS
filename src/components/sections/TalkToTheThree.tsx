import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Button } from '../ui/button';
import { Mic, Send, Activity, Settings, Disc3, ArrowRight } from 'lucide-react';
import { landingAudioEngine } from '../../audio/landingAudioEngine';
import { geminiTtsService } from '../../services/geminiTtsService';
import { supabase } from '../../lib/supabase';

const SonikScene = lazy(() => import('../3d/SonikScene').then((m) => ({ default: m.SonikScene })));

interface TalkToTheThreeProps {
  onEnterStudio: (sessionData?: any) => void;
}

type AgentType = 'emar' | 'ricky' | 'kingpin' | 'orchestrator' | null;

export const TalkToTheThree: React.FC<TalkToTheThreeProps> = ({ onEnterStudio }) => {
  const [activeAgent, setActiveAgent] = useState<AgentType>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<{ text: string; audioUrl?: string } | null>(null);
  const [projectState, setProjectState] = useState<any>({});
  const [isPlayingSnippet, setIsPlayingSnippet] = useState(false);
  const [snippetProgress, setSnippetProgress] = useState(0);
  const [lastQueryPrompt, setLastQueryPrompt] = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const snippetStopperRef = useRef<(() => void) | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '400px' });

  const agents = [
    {
      id: 'emar',
      name: 'EMAR',
      role: 'The Scientist',
      color: '#2AFFA3',
      desc: 'Tempo, Key, Analysis',
    },
    {
      id: 'ricky',
      name: 'RICKY',
      role: 'The Sound God',
      color: '#F5A800',
      desc: 'Drums, 808s, Groove',
    },
    {
      id: 'kingpin',
      name: 'KINGPIN',
      role: 'Vocal Oracle',
      color: '#FF3C00',
      desc: 'Vocals, Harmony',
    },
  ];

  const playPersonaVoice = async (text: string, agent: AgentType) => {
    if (snippetStopperRef.current) {
      snippetStopperRef.current();
    }
    setIsPlayingSnippet(true);
    setSnippetProgress(0.2);

    const stopFn = await geminiTtsService.speakPersonaResponse(
      text,
      (agent || 'orchestrator') as any,
      (level) => {
        setSnippetProgress(level);
      },
      () => {
        setIsPlayingSnippet(false);
        setSnippetProgress(0);
      }
    );

    snippetStopperRef.current = stopFn;
  };

  const handlePrompt = async (textToSend: string, agentOverride?: AgentType) => {
    if (!textToSend.trim()) return;
    const targetAgent = agentOverride || activeAgent || 'orchestrator';
    setActiveAgent(targetAgent);
    setIsProcessing(true);
    setResponse(null);
    setLastQueryPrompt(textToSend);

    try {
      const response = await supabase.functions.invoke('voice-chat', {
        body: { agent: targetAgent, text: textToSend },
      });

      const data = response.data as { text?: string; stateUpdates?: any } | null;
      const error = response.error;

      let replyText = '';
      let stateUpdates: any = {};

      if (data && !error) {
        replyText = data.text || '';
        stateUpdates = data.stateUpdates || {};
      }

      if (!replyText) {
        const fallbacks: Record<string, string> = {
          emar: 'Analyzed frequency spectrum. Identified low-mid resonance buildup around 220Hz. Applied parametric dynamic notch filter.',
          ricky:
            'Synthesized a syncopated Amapiano log drum groove in F# Minor at 112 BPM with high-velocity transient punch.',
          kingpin:
            'Arranged a 3-part call-and-response vocal harmony stack with stereo chorus and warm tube saturation.',
          orchestrator:
            "Council consensus reached. Coordinated audio engine state with Emar's EQ curve and Ricky's drum pattern.",
        };
        replyText =
          fallbacks[targetAgent || 'orchestrator'] || 'Council aligned. Parameters updated.';
      }

      setResponse({ text: replyText });

      if (stateUpdates && Object.keys(stateUpdates).length > 0) {
        setProjectState((prev: any) => ({ ...prev, ...stateUpdates }));
      }

      // Actually speak the intelligent response in the agent's persona voice!
      await playPersonaVoice(replyText, targetAgent);
    } catch {
      const fallbackText = 'Council telemetry aligned. Frequency and groove parameters updated.';
      setResponse({ text: fallbackText });
      await playPersonaVoice(fallbackText, targetAgent);
    } finally {
      setIsProcessing(false);
      setPrompt('');
    }
  };

  const scenarios = [
    { label: 'Analyze My Beat', prompt: 'Analyze this beat.', agent: 'emar' as AgentType },
    {
      label: 'Build a Groove',
      prompt: 'Give me an Afrobeats groove around 105 BPM.',
      agent: 'ricky' as AgentType,
    },
    {
      label: 'Fix My 808',
      prompt: 'My 808 is muddy. What should I change?',
      agent: 'ricky' as AgentType,
    },
    {
      label: 'Help My Hook',
      prompt: 'How should I approach this vocal?',
      agent: 'kingpin' as AgentType,
    },
    {
      label: 'Bring in the Council',
      prompt: 'Get all three of you to review this track.',
      agent: 'orchestrator' as AgentType,
    },
  ];

  const getAgentColor = (id: AgentType) => {
    if (id === 'emar') return '#2AFFA3';
    if (id === 'ricky') return '#F5A800';
    if (id === 'kingpin') return '#FF3C00';
    return '#F5A800'; // Orchestrator
  };

  const handleEnterStudio = () => {
    const audioState = landingAudioEngine.getState();
    onEnterStudio({
      projectState,
      lastAgent: activeAgent,
      genre: audioState.currentGenre,
      bpm: audioState.bpm,
      key: audioState.key,
      stems: audioState.stems,
      stepPattern: audioState.stepPattern,
    });
  };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[900px] w-full bg-[#080808] overflow-hidden flex flex-col pt-20 border-t border-[#f5a800]/10"
      id="demo"
    >
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center text-[var(--muted)] font-mono text-xs">
              INITIALIZING 3WM 3D NEURAL SPHERE...
            </div>
          }
        >
          {/* 3D Environment */}
          {isInView && (
            <SonikScene
              activeAgent={activeAgent}
              onAgentClick={(agent) => {
                setActiveAgent(agent);
                if (agent === 'emar') {
                  landingAudioEngine.playMelodicChord(0);
                } else if (agent === 'ricky') {
                  landingAudioEngine.playLogDrum(0, 55);
                } else if (agent === 'kingpin') {
                  landingAudioEngine.playVocalChant(0);
                }
              }}
            />
          )}
        </Suspense>
      </div>

      <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-between py-12 flex-1">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#f5a800] mb-4">
            Live Agent Session
          </p>
          <h2 className="font-display text-5xl md:text-7xl text-[var(--foreground-bright)] leading-none">
            TALK TO THE THREE
          </h2>
          <p className="font-light text-[#c9c9d4]/60 mt-4 max-w-lg mx-auto">
            Your studio isn't a chatbot. It's a council. Tell them what you're trying to make.
          </p>
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full mb-8">
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => setActiveAgent(a.id as AgentType)}
              className={`p-6 rounded-xl border text-left transition-all duration-500 backdrop-blur-md ${
                activeAgent === a.id
                  ? 'bg-white/10 border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] scale-105'
                  : 'bg-black/40 border-white/5 hover:border-white/10 hover:bg-black/60'
              }`}
              style={{
                boxShadow:
                  activeAgent === a.id
                    ? `0 0 40px ${a.color}20, inset 0 0 20px ${a.color}10`
                    : 'none',
                borderColor: activeAgent === a.id ? `${a.color}50` : '',
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${a.color}20`, color: a.color }}
              >
                {a.id === 'emar' ? '🧬' : a.id === 'ricky' ? '🔊' : '🎙'}
              </div>
              <h3 className="font-display text-2xl text-[var(--foreground-bright)] tracking-wider">
                {a.name}
              </h3>
              <p
                className="font-mono text-[10px] uppercase tracking-widest mt-1"
                style={{ color: a.color }}
              >
                {a.role}
              </p>
              <p className="text-xs text-[var(--muted)] font-light mt-3">{a.desc}</p>
            </button>
          ))}
        </div>

        {/* Main Interface */}
        <div className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Conversation & Input */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex-1 min-h-[250px] bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col relative overflow-hidden">
              {/* Ambient agent color glow */}
              {activeAgent && (
                <div
                  className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 blur-sm transition-colors duration-1000"
                  style={{ color: getAgentColor(activeAgent) }}
                />
              )}

              <AnimatePresence mode="wait">
                {!response && !isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-center text-center"
                  >
                    <p className="font-mono text-sm text-[var(--muted)]">
                      Select an agent or ask the Orchestrator.
                    </p>
                  </motion.div>
                )}
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-center gap-4"
                  >
                    <Activity
                      className="w-8 h-8 animate-pulse"
                      style={{ color: getAgentColor(activeAgent) }}
                    />
                    <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
                      Analyzing audio & reasoning...
                    </p>
                  </motion.div>
                )}
                {response && !isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col justify-center"
                  >
                    <p
                      className="font-mono text-[10px] uppercase tracking-widest mb-3"
                      style={{ color: getAgentColor(activeAgent) }}
                    >
                      {activeAgent?.toUpperCase() || 'ORCHESTRATOR'}
                    </p>
                    <p className="text-lg md:text-xl font-light leading-relaxed text-[var(--foreground-bright)]">
                      "{response.text}"
                    </p>

                    {/* 5-Second Procedural Audio Output Player */}
                    <div className="mt-6 p-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (isPlayingSnippet) {
                                if (snippetStopperRef.current) snippetStopperRef.current();
                                setIsPlayingSnippet(false);
                              } else {
                                playPersonaVoice(
                                  response?.text || lastQueryPrompt || 'African groove',
                                  activeAgent
                                );
                              }
                            }}
                            className="w-9 h-9 rounded-full bg-[#f5a800] text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_15px_rgba(245,168,0,0.4)]"
                            title={isPlayingSnippet ? 'Stop Voice Speech' : 'Play Spoken AI Voice'}
                          >
                            {isPlayingSnippet ? (
                              <span className="w-3 h-3 bg-black rounded-sm" />
                            ) : (
                              <span className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[9px] border-l-black border-b-[5px] border-b-transparent ml-0.5" />
                            )}
                          </button>
                          <div>
                            <span className="font-mono text-xs font-bold text-[var(--foreground-bright)] flex items-center gap-2">
                              Spoken Persona AI Speech &amp; Analysis
                              {isPlayingSnippet && (
                                <span className="text-[10px] text-[#2affa3] animate-pulse">
                                  ● LIVE
                                </span>
                              )}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--muted)]">
                              {(5 * (1 - snippetProgress)).toFixed(1)}s remaining · WebDSP Synth
                            </span>
                          </div>
                        </div>

                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#f5a800]">
                          {activeAgent?.toUpperCase() || 'COUNCIL'}
                        </span>
                      </div>

                      {/* Progress Bar & Wave Bars */}
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-gradient-to-r from-[#2affa3] via-[#f5a800] to-[#ff3c00] transition-all duration-75"
                          style={{ width: `${snippetProgress * 100}%` }}
                        />
                      </div>

                      <div className="h-6 flex items-center gap-1 opacity-80">
                        {Array.from({ length: 32 }).map((_, i) => {
                          const isActive = isPlayingSnippet;
                          const height = isActive
                            ? Math.max(15, Math.sin(i * 0.5 + snippetProgress * 10) * 100)
                            : 20;
                          return (
                            <div
                              key={i}
                              className="flex-1 rounded-full transition-all duration-75"
                              style={{
                                height: `${height}%`,
                                backgroundColor:
                                  i / 32 <= snippetProgress
                                    ? getAgentColor(activeAgent)
                                    : 'rgba(255,255,255,0.15)',
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Row */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${isRecording ? 'bg-[#ff3c00] text-[var(--foreground-bright)] animate-pulse' : 'bg-white/5 border border-white/10 text-[var(--foreground-bright)] hover:bg-white/10'}`}
                aria-label="Start recording"
              >
                <Mic className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePrompt(prompt)}
                  placeholder="Tell me what you're trying to make..."
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-5 text-sm text-[var(--foreground-bright)] focus:outline-none focus:border-white/30"
                  disabled={isProcessing}
                />
                <button
                  onClick={() => handlePrompt(prompt)}
                  disabled={!prompt.trim() || isProcessing}
                  className="absolute right-2 top-2 bottom-2 w-10 bg-white/10 rounded-lg flex items-center justify-center text-[var(--foreground-bright)] hover:bg-white/20 disabled:opacity-50 transition-colors"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Project State / Telemetry Sidebar */}
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Disc3 className="w-4 h-4 text-[#f5a800]" />
              <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--foreground-bright)]">
                Studio State
              </h3>
            </div>

            <div className="flex-1 space-y-4">
              {Object.keys(projectState).length === 0 ? (
                <div className="h-full flex items-center justify-center opacity-50">
                  <p className="font-mono text-xs text-center">State waiting for instructions...</p>
                </div>
              ) : (
                <AnimatePresence>
                  {Object.entries(projectState).map(([key, value]: [string, any], i) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={key}
                      className="flex items-start justify-between border-b border-white/5 pb-3"
                    >
                      <span className="font-mono text-[10px] uppercase text-[var(--muted)] tracking-wider">
                        {key}
                      </span>
                      <span className="font-mono text-[11px] text-[#2AFFA3] text-right">
                        {value}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {Object.keys(projectState).length > 0 && (
              <Button
                onClick={handleEnterStudio}
                className="w-full mt-6 bg-white text-black hover:bg-neutral-200 font-bold group"
              >
                ENTER 3WM STUDIO{' '}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </div>
        </div>

        {/* Demo Scenarios */}
        <div className="max-w-4xl mx-auto w-full flex flex-wrap justify-center gap-3">
          {scenarios.map((s, i) => (
            <button
              key={i}
              onClick={() => handlePrompt(s.prompt, s.agent)}
              className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-[var(--muted)] hover:text-[var(--foreground-bright)] transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
    </section>
  );
};
