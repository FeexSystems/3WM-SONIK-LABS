import { LiveAudioAgent } from './LiveAudioAgent';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  X,
  Radio,
  Send,
  Zap,
  Activity,
  ChevronDown,
} from 'lucide-react';
import {
  voiceAgentEngine,
  AgentId,
  VoiceState,
  VoiceAgentMessage,
} from '../../audio/voiceAgentEngine';
import { AGENT_VOICE_CONFIGS } from '../../audio/personaVoicePrompts';
import { Button } from '../ui/button';

interface VoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAgent?: AgentId;
  onEnterStudio?: () => void;
}

const AGENT_CONFIGS: Record<
  AgentId,
  {
    name: string;
    role: string;
    color: string;
    glow: string;
    avatar: string;
    desc: string;
  }
> = {
  emar: {
    name: 'KAPPACHINO EMAR',
    role: 'The Scientist',
    color: '#2AFFA3',
    glow: 'rgba(42, 255, 163, 0.4)',
    avatar: '🧬',
    desc: 'Audio Engineering, DSP, Acoustic Frequency Surgery',
  },
  ricky: {
    name: 'KAPPACHINO RICKY',
    role: 'The Sound God',
    color: '#F5A800',
    glow: 'rgba(245, 168, 0, 0.4)',
    avatar: '🔊',
    desc: 'Drums, 808s, Afrofusion Swing, Beat Production',
  },
  kingpin: {
    name: 'KINGPIN',
    role: 'The Vocal Oracle',
    color: '#FF3C00',
    glow: 'rgba(255, 60, 0, 0.4)',
    avatar: '🎙️',
    desc: 'Vocal Stacks, Auto-Tune Harmonies, Arrangement',
  },
  orchestrator: {
    name: 'THREEWM COUNCIL',
    role: 'The Orchestrator',
    color: '#F5A800',
    glow: 'rgba(245, 168, 0, 0.5)',
    avatar: '🔱',
    desc: 'Multi-Agent Consensus & Unified Project Direction',
  },
};

export const VoiceAgentModal: React.FC<VoiceAgentModalProps> = ({
  isOpen,
  onClose,
  initialAgent = 'orchestrator',
  onEnterStudio,
}) => {
  const [activeAgent, setActiveAgent] = useState<AgentId>(initialAgent);
  const [mode, setMode] = useState<'standard' | 'live'>('live');
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [transcription, setTranscription] = useState<string>('');
  const [messages, setMessages] = useState<VoiceAgentMessage[]>([]);
  const [textInput, setTextInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialAgent) {
      setActiveAgent(initialAgent);
      voiceAgentEngine.setActiveAgent(initialAgent);
    }
  }, [initialAgent]);

  useEffect(() => {
    const unsubscribe = voiceAgentEngine.subscribe({
      onStateChange: (state) => setVoiceState(state),
      onTranscription: (text, isFinal) => {
        setTranscription(text);
        if (isFinal) {
          setTimeout(() => setTranscription(''), 2000);
        }
      },
      onAgentResponse: (msg) => {
        setMessages((prev) => [...prev, msg]);
      },
      onAudioLevel: (level) => setAudioLevel(level),
      onError: (error) => {
        setErrorMessage(error);
        setTimeout(() => setErrorMessage(''), 5000);
      },
    });

    setMessages(voiceAgentEngine.getHistory());
    setVoiceState(voiceAgentEngine.getState());

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcription]);

  const handleToggleVoice = async () => {
    if (voiceState === 'IDLE') {
      await voiceAgentEngine.startListening();
    } else {
      voiceAgentEngine.stopListening();
    }
  };

  const handleSelectAgent = (agentId: AgentId) => {
    setActiveAgent(agentId);
    voiceAgentEngine.setActiveAgent(agentId);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    voiceAgentEngine.sendPrompt(textInput, activeAgent);
    setTextInput('');
  };

  if (!isOpen) return null;

  const currentConfig = AGENT_CONFIGS[activeAgent];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            voiceAgentEngine.stopListening();
            onClose();
          }}
          className="absolute inset-0 bg-[#0D0D0D]/85 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative flex h-[85vh] max-h-[780px] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#120F0C] shadow-[0_0_80px_rgba(0,0,0,0.8)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#181410] px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Live Audio Mode Switcher */}
              <div className="flex items-center rounded-xl bg-black/60 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setMode('live')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-mono font-bold transition-all ${
                    mode === 'live'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-[#C9C9D4]/50 hover:text-white'
                  }`}
                >
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Gemini Live (Connect Live)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('standard')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-mono font-bold transition-all ${
                    mode === 'standard'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-[#C9C9D4]/50 hover:text-white'
                  }`}
                >
                  <span>Standard Voice</span>
                </button>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl border text-xl shadow-lg transition-colors"
                style={{
                  borderColor: currentConfig.color,
                  backgroundColor: `${currentConfig.color}15`,
                  boxShadow: `0 0 20px ${currentConfig.glow}`,
                }}
              >
                {currentConfig.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg tracking-wider text-white">
                    {currentConfig.name}
                  </h3>
                  <span
                    className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider font-bold"
                    style={{
                      backgroundColor: `${currentConfig.color}20`,
                      color: currentConfig.color,
                    }}
                  >
                    {currentConfig.role}
                  </span>
                </div>
                <p className="font-sans text-xs text-[#C9C9D4]/60">{currentConfig.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Agent Selector Pills */}
              <div className="hidden sm:flex items-center rounded-full bg-black/40 p-1 border border-white/5">
                {(['orchestrator', 'emar', 'ricky', 'kingpin'] as AgentId[]).map((agentId) => {
                  const cfg = AGENT_CONFIGS[agentId];
                  const isSelected = activeAgent === agentId;
                  return (
                    <button
                      key={agentId}
                      onClick={() => handleSelectAgent(agentId)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono transition-all ${
                        isSelected
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-[#C9C9D4]/50 hover:text-white'
                      }`}
                      style={isSelected ? { color: cfg.color } : undefined}
                    >
                      <span>{cfg.avatar}</span>
                      <span className="hidden md:inline">{cfg.role.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  voiceAgentEngine.stopListening();
                  onClose();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
            {/* Left Column: 3D Orb & Voice Controls */}
            <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 bg-[#0F0C0A] p-6 md:w-80">
              {/* Animated Resonator Orb */}
              <div className="relative my-4 flex h-48 w-48 items-center justify-center">
                {/* Outer Glow Halo */}
                <motion.div
                  animate={{
                    scale:
                      voiceState === 'SPEAKING'
                        ? [1, 1.25, 1]
                        : voiceState === 'LISTENING'
                          ? [1, 1 + audioLevel * 0.4, 1]
                          : [1, 1.06, 1],
                    opacity: voiceState !== 'IDLE' ? 0.8 : 0.4,
                  }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full blur-2xl"
                  style={{ backgroundColor: currentConfig.glow }}
                />

                {/* Concentric Audio Rings */}
                {[1, 2, 3].map((ring) => (
                  <motion.div
                    key={ring}
                    animate={{
                      scale:
                        voiceState === 'LISTENING'
                          ? 1 + audioLevel * ring * 0.25
                          : voiceState === 'SPEAKING'
                            ? [1, 1 + ring * 0.15, 1]
                            : 1,
                      opacity: voiceState === 'IDLE' ? 0.1 : 0.4 / ring,
                    }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 rounded-full border"
                    style={{ borderColor: currentConfig.color }}
                  />
                ))}

                {/* Core Metallic Sphere */}
                <div
                  className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full border-2 bg-gradient-to-b from-[#2A231C] to-[#0D0D0D] shadow-2xl transition-all"
                  style={{
                    borderColor: currentConfig.color,
                    boxShadow: `0 0 40px ${currentConfig.glow}`,
                  }}
                >
                  <span className="text-4xl drop-shadow-md">{currentConfig.avatar}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    voiceState === 'SPEAKING'
                      ? 'animate-ping bg-emerald-400'
                      : voiceState === 'LISTENING'
                        ? 'animate-pulse bg-[#F5A800]'
                        : voiceState === 'THINKING'
                          ? 'animate-spin bg-cyan-400'
                          : 'bg-white/20'
                  }`}
                />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#C9C9D4]">
                  {voiceState === 'IDLE'
                    ? 'STANDBY'
                    : voiceState === 'LISTENING'
                      ? 'LISTENING TO MIC'
                      : voiceState === 'THINKING'
                        ? 'PROCESSING DSP'
                        : 'SPEAKING'}
                </span>
              </div>

              {/* Voice Trigger Button */}
              <button
                onClick={handleToggleVoice}
                className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl font-mono text-xs font-bold uppercase tracking-wider text-black transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: currentConfig.color,
                  boxShadow: `0 0 25px ${currentConfig.glow}`,
                }}
              >
                {voiceState === 'IDLE' ? (
                  <>
                    <Mic className="h-5 w-5" />
                    <span>Start Voice Session</span>
                  </>
                ) : (
                  <>
                    <MicOff className="h-5 w-5 text-red-950" />
                    <span>Mute Microphone</span>
                  </>
                )}
              </button>

              {/* Error Message Display */}
              {errorMessage && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-left">
                  <p className="font-mono text-[10px] text-red-400 leading-tight">{errorMessage}</p>
                </div>
              )}

              {/* Persona Voice Profile Telemetry */}
              <div className="mt-4 p-3 rounded-xl bg-black/60 border border-white/10 w-full text-left font-mono text-[10px] space-y-1.5 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-[#C9C9D4]/60 uppercase">Gemini TTS Voice:</span>
                  <span className="font-bold text-xs" style={{ color: currentConfig.color }}>
                    {AGENT_VOICE_CONFIGS[activeAgent]?.voiceName || 'Kore'}
                  </span>
                </div>
                <div className="text-[9px] text-[#C9C9D4]/60 leading-tight">
                  <span className="text-[#F5A800]">Accent:</span>{' '}
                  {AGENT_VOICE_CONFIGS[activeAgent]?.accent}
                </div>
                <div className="text-[9px] text-[#C9C9D4]/60 leading-tight">
                  <span className="text-[#2AFFA3]">Vibe:</span>{' '}
                  {AGENT_VOICE_CONFIGS[activeAgent]?.vibe}
                </div>
              </div>
            </div>

            {/* Right Column: Live Transcript & Interaction Log */}
            <div className="flex flex-1 flex-col overflow-hidden bg-[#120F0C] p-6">
              {/* Message Feed */}
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                {messages.length === 0 && !transcription ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-[#C9C9D4]/40">
                    <Radio className="mb-3 h-8 w-8 animate-pulse text-[#F5A800]/50" />
                    <p className="font-display text-lg text-white">Voice Operating Mode Active</p>
                    <p className="mt-1 max-w-sm text-xs">
                      Tap &quot;Start Voice Session&quot; to speak directly to {currentConfig.name}.
                      Ask for chord progressions, 808 sculpting, or vocal harmonies.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isUser = msg.sender === 'user';
                      const msgAgent = isUser ? null : AGENT_CONFIGS[msg.sender as AgentId];
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                        >
                          <div className="mb-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#C9C9D4]/50">
                            <span>{isUser ? 'You' : msgAgent?.name || msg.sender}</span>
                            <span>•</span>
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                              isUser
                                ? 'bg-white/10 text-white'
                                : 'border border-white/10 bg-[#1A1410] text-[#E0E0E6]'
                            }`}
                            style={
                              !isUser && msgAgent
                                ? { borderLeftColor: msgAgent.color, borderLeftWidth: 3 }
                                : undefined
                            }
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}

                    {transcription && (
                      <div className="flex flex-col items-end opacity-70">
                        <span className="mb-1 font-mono text-[9px] uppercase tracking-wider text-[#F5A800]">
                          Hearing...
                        </span>
                        <div className="max-w-[85%] rounded-2xl border border-[#F5A800]/30 bg-[#F5A800]/10 px-4 py-3 text-sm italic text-white">
                          {transcription}
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Text Input Fallback Bar */}
              <form
                onSubmit={handleSendText}
                className="mt-4 flex gap-2 pt-2 border-t border-white/10"
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={`Ask ${currentConfig.role} anything (e.g. "Sculpt a low-end 808 for Amapiano")...`}
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 font-sans text-xs text-white placeholder-white/30 focus:border-[#F5A800] focus:outline-none"
                />
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  className="rounded-xl px-4 flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
