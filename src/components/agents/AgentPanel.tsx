import React, { useEffect, useState, useRef, useMemo } from 'react';
import { worldState, AgentActivityLog } from '../../agents/WorldState';
import { SonikWorldState, AgentState, AgentId } from '../../agents/types';
import { orchestrator } from '../../agents/Orchestrator';
import {
  Activity,
  BrainCircuit,
  Users,
  Mic2,
  Mic,
  Sparkles,
  X,
  Upload,
  Music,
  Volume2,
  VolumeX,
  Send,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  Wand2,
  Sliders,
  AudioWaveform,
  Radio,
  FileAudio,
  Loader2,
} from 'lucide-react';
import { geminiTtsService } from '../../services/geminiTtsService';
import { Track } from '../../types';

export type ChannelId = 'council' | 'kappachino_emar' | 'kappachino_ricky' | 'kingpin';

interface AgentConfig {
  id: AgentId;
  name: string;
  title: string;
  domain: string;
  motto: string;
  color: string;
  accentHex: string;
  bgHex: string;
  borderHex: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AGENT_CONFIGS: Record<AgentId, AgentConfig> = {
  kappachino_emar: {
    id: 'kappachino_emar',
    name: 'Kappachino Emar',
    title: 'THE SCIENTIST',
    domain: 'Audio Engineering & DSP',
    motto: 'Understand the sound. Control the system.',
    color: 'emar',
    accentHex: '#2AFFA3',
    bgHex: 'rgba(42, 255, 163, 0.08)',
    borderHex: 'rgba(42, 255, 163, 0.3)',
    icon: Activity,
  },
  kappachino_ricky: {
    id: 'kappachino_ricky',
    name: 'Kappachino Ricky',
    title: 'THE SOUND GOD',
    domain: 'Instruments & 808s',
    motto: 'Find the sound. Build the bounce.',
    color: 'ricky',
    accentHex: '#F5A800',
    bgHex: 'rgba(245, 168, 0, 0.08)',
    borderHex: 'rgba(245, 168, 0, 0.3)',
    icon: Sparkles,
  },
  kingpin: {
    id: 'kingpin',
    name: 'Kingpin',
    title: 'THE VOCAL ORACLE',
    domain: 'Vocal Orchestra & Harmony',
    motto: 'Give the voice a body. Give the body a soul.',
    color: 'kingpin',
    accentHex: '#FF3C00',
    bgHex: 'rgba(255, 60, 0, 0.08)',
    borderHex: 'rgba(255, 60, 0, 0.3)',
    icon: Mic2,
  },
  three_wm_orchestrator: {
    id: 'three_wm_orchestrator',
    name: 'ThreeWM Orchestrator',
    title: 'COUNCIL COORDINATOR',
    domain: 'Workflow & Consensus',
    motto: 'Coordinate the minds. Synthesize the sound.',
    color: 'orchestrator',
    accentHex: '#F5A800',
    bgHex: 'rgba(245, 168, 0, 0.06)',
    borderHex: 'rgba(245, 168, 0, 0.25)',
    icon: BrainCircuit,
  },
};

const CHANNEL_PROMPT_SUGGESTIONS: Record<ChannelId, { label: string; prompt: string; icon: any }[]> = {
  council: [
    { label: 'Review Master Mix', prompt: 'Convene the Council: review this track mix, balance, and next creative steps.', icon: Sliders },
    { label: 'Debate Arrangement', prompt: 'Council debate: critique the song structure and transition energy.', icon: Users },
    { label: 'Amapiano Bounce Check', prompt: 'Evaluate the groove and rhythm bounce for modern African club sound.', icon: AudioWaveform },
    { label: 'Recommend Next Move', prompt: 'What is the highest priority enhancement this production needs right now?', icon: Wand2 },
  ],
  kappachino_emar: [
    { label: 'Check Headroom & Phase', prompt: 'Analyze my master bus headroom, dynamic range, and stereo phase correlation.', icon: Activity },
    { label: 'Clean Low-End Mud', prompt: 'Identify conflicting frequencies between kick and bass in the 40Hz–250Hz range.', icon: Sliders },
    { label: 'Mastering Chain Preset', prompt: 'Suggest an optimal DSP mastering chain for high-energy streaming loudness.', icon: Wand2 },
    { label: 'Acoustic Space & Reverb', prompt: 'How should I tune the pre-delay and damping on my vocal reverb send?', icon: AudioWaveform },
  ],
  kappachino_ricky: [
    { label: 'Generate 808 Glide Pattern', prompt: 'Design an 808 glide pattern with pitch bends for Amapiano and Afro-drill.', icon: Sparkles },
    { label: 'Amapiano Log Drum Rhythm', prompt: 'Give me a syncopated log drum pattern and envelope attack/decay settings.', icon: AudioWaveform },
    { label: 'Layer Kick & Snare', prompt: 'What frequencies should I carve so the punchy transient kick cuts through the sub?', icon: Sliders },
    { label: 'Add Shaker Bounce', prompt: 'Suggest a 16th-note swing and humanized velocity map for the shakers.', icon: Music },
  ],
  kingpin: [
    { label: '3-Part Vocal Harmony', prompt: 'Arrange a 3-part vocal harmony stack (thirds and fifths) above the lead melody.', icon: Mic2 },
    { label: 'Vocal Chain Preset', prompt: 'What is the ultimate vocal processing chain for silky, forward Afro-pop leads?', icon: Sliders },
    { label: 'Topline Pitch & Autotune', prompt: 'How fast should my pitch correction retune speed be for natural yet tight delivery?', icon: Wand2 },
    { label: 'Adlibs & Vocal Chants', prompt: 'Suggest atmospheric vocal throws, stereo spreads, and call-and-response adlibs.', icon: AudioWaveform },
  ],
};

export const AgentPanel: React.FC<{
  isCollapsed?: boolean;
  onClose?: () => void;
  currentTrack?: Track | null;
}> = ({ isCollapsed = false, onClose, currentTrack }) => {
  const [state, setState] = useState<SonikWorldState & { activities: AgentActivityLog[] }>(
    worldState.getState()
  );
  const [activeChannel, setActiveChannel] = useState<ChannelId>('council');
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const [isCouncilMode, setIsCouncilMode] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);

  // File Upload
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBase64, setAudioBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isGeneratingStem, setIsGeneratingStem] = useState(false);

  // Message scroll & speech
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to WorldState
  useEffect(() => {
    return worldState.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  // Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setPrompt(currentTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Chronological messages: worldState stores newest first in activities, so reverse for top-to-bottom chat
  const chronologicalMessages = useMemo(() => {
    return [...state.activities].reverse();
  }, [state.activities]);

  // Filter messages by active channel if requested
  const filteredMessages = useMemo(() => {
    if (activeChannel === 'council') return chronologicalMessages;
    return chronologicalMessages.filter((msg) => {
      const isUser = msg.agent.toUpperCase() === 'USER';
      if (isUser) return true;
      const lower = msg.agent.toLowerCase();
      if (activeChannel === 'kappachino_emar') return lower.includes('emar') || lower.includes('scientist');
      if (activeChannel === 'kappachino_ricky') return lower.includes('ricky') || lower.includes('sound god');
      if (activeChannel === 'kingpin') return lower.includes('kingpin') || lower.includes('vocal');
      return true;
    });
  }, [chronologicalMessages, activeChannel]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages.length, showScrollBottom]);

  // Track scroll position for "jump to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  // TTS Speech Handler
  const handleSpeakLog = async (agentName: string, text: string, idx: number) => {
    if (speakingIndex === idx) {
      geminiTtsService.stopPlayback();
      setSpeakingIndex(null);
      return;
    }

    setSpeakingIndex(idx);
    let agentId: 'emar' | 'ricky' | 'kingpin' | 'orchestrator' = 'orchestrator';
    const lower = agentName.toLowerCase();
    if (lower.includes('emar')) agentId = 'emar';
    else if (lower.includes('ricky')) agentId = 'ricky';
    else if (lower.includes('kingpin')) agentId = 'kingpin';

    await geminiTtsService.speakPersonaResponse(text, agentId, undefined, () => {
      setSpeakingIndex(null);
    });
  };

  // Copy message to clipboard
  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Audio File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setAudioBase64(base64String);
        worldState.logActivity('USER', `Attached audio stem for multimodal analysis: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearAttachedAudio = () => {
    setAudioFile(null);
    setAudioBase64('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Voice Recognition Toggle
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        setPrompt('');
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start speech recognition', e);
      }
    }
  };

  // Send Prompt
  const handleSendPrompt = async (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (directText || prompt).trim();
    if (!textToSend || isSending) return;

    setIsSending(true);
    setPrompt('');

    const context = currentTrack
      ? {
          trackId: currentTrack.id,
          trackTitle: currentTrack.title,
          bpm: currentTrack.bpm,
          key: currentTrack.key,
          dspSettings: currentTrack.settings,
          hasVocals: currentTrack.stems?.some((s) => s.name.toLowerCase().includes('vocal')) || false,
        }
      : undefined;

    // Direct routing if a specific agent tab is open
    const targetAgentId: AgentId | undefined =
      activeChannel === 'council' ? undefined : (activeChannel as AgentId);

    try {
      await orchestrator.dispatchUserIntent(
        textToSend,
        context,
        audioBase64 || undefined,
        audioFile?.type || undefined,
        isCouncilMode || activeChannel === 'council',
        targetAgentId
      );
    } catch (err) {
      console.error('Error dispatching intent:', err);
    } finally {
      setIsSending(false);
      clearAttachedAudio();
      setTimeout(scrollToBottom, 150);
    }
  };

  // Server-side AI Stem Generation
  const handleGenerateStem = async () => {
    setIsGeneratingStem(true);
    worldState.logActivity('ThreeWMOrchestrator', 'Initiating AI Audio Stem Synthesis...');
    try {
      const trackId = currentTrack?.id || 'demo';
      const promptDescription =
        activeChannel === 'kappachino_ricky'
          ? 'Deep syncopated Amapiano log drum groove'
          : activeChannel === 'kingpin'
            ? 'Soulful Afro-fusion vocal harmonies and topline'
            : 'Polished studio Amapiano stem';

      const res = await fetch(`/api/tracks/${trackId}/generate-stem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptDescription, type: 'beat' }),
      });
      const data = await res.json();
      if (res.ok && data.audioUrl) {
        setGeneratedAudioUrl(data.audioUrl);
        worldState.logActivity(
          'ThreeWMOrchestrator',
          `AI Stem generated successfully: ${data.audioUrl.split('/').pop() || 'stem.mp3'}`
        );
      } else {
        worldState.logActivity('ThreeWMOrchestrator', `AI Generation Error: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      worldState.logActivity('ThreeWMOrchestrator', 'Network error during stem generation.');
    } finally {
      setIsGeneratingStem(false);
      setTimeout(scrollToBottom, 150);
    }
  };

  // Clear Session History
  const handleClearHistory = () => {
    geminiTtsService.stopPlayback();
    setSpeakingIndex(null);
    worldState.clearActivities();
  };

  // Agent State Styling Helper
  const getAgentStatusInfo = (agentId: AgentId) => {
    const currentState = state.agentState[agentId] || 'IDLE';
    const cfg = AGENT_CONFIGS[agentId];
    const isBusy = currentState !== 'IDLE' && currentState !== 'COMPLETED';
    return {
      state: currentState,
      isBusy,
      accentHex: cfg?.accentHex || '#f5a800',
    };
  };

  // Active channel details
  const activeAgentConfig = activeChannel !== 'council' ? AGENT_CONFIGS[activeChannel] : null;

  return (
    <div
      className={`fixed lg:absolute right-0 top-0 bottom-0 z-50 flex flex-col h-full bg-[#0D0D0D]/95 backdrop-blur-2xl border-l border-neutral-800/80 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] transition-all duration-300 ease-in-out overflow-hidden ${
        isCollapsed
          ? 'translate-x-full opacity-0 pointer-events-none'
          : isWide
            ? 'translate-x-0 opacity-100 w-full sm:w-[460px]'
            : 'translate-x-0 opacity-100 w-full sm:w-[384px]'
      }`}
    >
      {/* 1. STUDIO HEADER */}
      <div className="p-3.5 border-b border-neutral-800/70 bg-[#120F0D]/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold/20 via-neutral-900 to-black border border-gold/40 flex items-center justify-center shadow-glow-gold">
            <BrainCircuit className="w-4 h-4 text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-black tracking-wider uppercase text-neutral-100 font-display">
                3ONIK AGENT ENGINE
              </h2>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/30 font-bold">
                3WM SONIK
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono mt-0.5">
              <span className="flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    getAgentStatusInfo('kappachino_emar').isBusy
                      ? 'bg-[#2affa3] animate-pulse'
                      : 'bg-[#2affa3]/60'
                  }`}
                />
                Emar
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    getAgentStatusInfo('kappachino_ricky').isBusy
                      ? 'bg-[#f5a800] animate-pulse'
                      : 'bg-[#f5a800]/60'
                  }`}
                />
                Ricky
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    getAgentStatusInfo('kingpin').isBusy
                      ? 'bg-[#ff3c00] animate-pulse'
                      : 'bg-[#ff3c00]/60'
                  }`}
                />
                Kingpin
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800/80 transition-colors"
            title="Clear Session History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsWide(!isWide)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/80 transition-colors hidden sm:block"
            title={isWide ? 'Standard Width' : 'Expand Width'}
          >
            {isWide ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/80 transition-colors"
              title="Close Console"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. PERSONA CHANNEL TABS */}
      <div className="grid grid-cols-4 gap-1 p-2 border-b border-neutral-800/60 bg-[#0B0908] shrink-0 text-[11px] font-bold">
        {/* Council */}
        <button
          onClick={() => setActiveChannel('council')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
            activeChannel === 'council'
              ? 'bg-neutral-800 text-gold border border-gold/40 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
          }`}
          title="Full Council Chamber"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Council</span>
        </button>

        {/* Emar */}
        <button
          onClick={() => setActiveChannel('kappachino_emar')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
            activeChannel === 'kappachino_emar'
              ? 'bg-[#2affa3]/10 text-[#2affa3] border border-[#2affa3]/40 shadow-sm'
              : 'text-neutral-400 hover:text-[#2affa3] hover:bg-neutral-900/60'
          }`}
          title="Kappachino Emar (The Scientist)"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Emar</span>
          {getAgentStatusInfo('kappachino_emar').isBusy && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#2affa3] animate-ping" />
          )}
        </button>

        {/* Ricky */}
        <button
          onClick={() => setActiveChannel('kappachino_ricky')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
            activeChannel === 'kappachino_ricky'
              ? 'bg-[#f5a800]/10 text-[#f5a800] border border-[#f5a800]/40 shadow-sm'
              : 'text-neutral-400 hover:text-[#f5a800] hover:bg-neutral-900/60'
          }`}
          title="Kappachino Ricky (The Sound God)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ricky</span>
          {getAgentStatusInfo('kappachino_ricky').isBusy && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#f5a800] animate-ping" />
          )}
        </button>

        {/* Kingpin */}
        <button
          onClick={() => setActiveChannel('kingpin')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
            activeChannel === 'kingpin'
              ? 'bg-[#ff3c00]/10 text-[#ff3c00] border border-[#ff3c00]/40 shadow-sm'
              : 'text-neutral-400 hover:text-[#ff3c00] hover:bg-neutral-900/60'
          }`}
          title="Kingpin (The Vocal Oracle)"
        >
          <Mic2 className="w-3.5 h-3.5" />
          <span>Kingpin</span>
          {getAgentStatusInfo('kingpin').isBusy && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff3c00] animate-ping" />
          )}
        </button>
      </div>

      {/* 3. ACTIVE PERSONA SPOTLIGHT BANNER */}
      {activeAgentConfig ? (
        <div
          className="px-3.5 py-2.5 border-b border-neutral-800/50 flex items-center justify-between shrink-0"
          style={{ backgroundColor: activeAgentConfig.bgHex }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="p-1.5 rounded-lg border shrink-0"
              style={{
                borderColor: activeAgentConfig.borderHex,
                backgroundColor: 'rgba(0,0,0,0.5)',
              }}
            >
              {React.createElement(activeAgentConfig.icon as any, {
                className: "w-4 h-4",
                style: { color: activeAgentConfig.accentHex },
              })}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-100 truncate">
                  {activeAgentConfig.name}
                </span>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase"
                  style={{
                    backgroundColor: activeAgentConfig.bgHex,
                    color: activeAgentConfig.accentHex,
                    border: `1px solid ${activeAgentConfig.borderHex}`,
                  }}
                >
                  {state.agentState[activeAgentConfig.id] || 'IDLE'}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 italic truncate font-sans">
                "{activeAgentConfig.motto}"
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider shrink-0 pl-2">
            {activeAgentConfig.domain.split('&')[0]}
          </span>
        </div>
      ) : (
        <div className="px-3.5 py-2 border-b border-neutral-800/50 bg-[#16120B]/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-gold animate-pulse" />
            <span className="text-xs font-bold text-neutral-200">
              Unified Council Session
            </span>
          </div>
          <span className="text-[10px] font-mono text-gold/80 font-bold uppercase tracking-wider">
            All 3 Intelligences Active
          </span>
        </div>
      )}

      {/* 4. CONTEXTUAL QUICK PROMPT CHIPS */}
      <div className="px-3 py-2 border-b border-neutral-800/50 bg-neutral-950/70 shrink-0 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500 shrink-0 mr-1 flex items-center gap-1">
          <Wand2 className="w-2.5 h-2.5 text-gold" />
          Quick:
        </span>
        {CHANNEL_PROMPT_SUGGESTIONS[activeChannel].map((chip, idx) => {
          const ChipIcon = chip.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendPrompt(undefined, chip.prompt)}
              className="text-[10px] py-1 px-2 rounded-full whitespace-nowrap bg-neutral-900 border border-neutral-800 hover:border-gold/60 hover:bg-neutral-800 text-neutral-300 hover:text-gold transition-all shrink-0 flex items-center gap-1"
            >
              <ChipIcon className="w-2.5 h-2.5 opacity-70" />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. MESSAGE STREAM (CHRONOLOGICAL) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans relative"
      >
        {filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-center mb-3 shadow-inner">
              <BrainCircuit className="w-6 h-6 text-gold/60" />
            </div>
            <h3 className="text-sm font-bold text-neutral-200">
              3WM Intelligence Ready
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-[260px] leading-relaxed">
              Consult <span className="text-[#2affa3]">Emar</span> for mixing & DSP,{' '}
              <span className="text-[#f5a800]">Ricky</span> for 808s & groove, or{' '}
              <span className="text-[#ff3c00]">Kingpin</span> for vocal orchestra.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-xs">
              <button
                onClick={() =>
                  handleSendPrompt(
                    undefined,
                    'Council review: give me an audit of the overall track arrangement and groove.'
                  )
                }
                className="text-[11px] px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 font-bold transition-all"
              >
                Convene Full Council
              </button>
            </div>
          </div>
        )}

        {filteredMessages.map((log, idx) => {
          const isUser = log.agent.toUpperCase() === 'USER';
          const lowerAgent = log.agent.toLowerCase();

          let agentColor = 'text-gold';
          let agentBg = 'bg-[#18130a]';
          let agentBorder = 'border-gold/30';
          let personaBadge = 'ORCHESTRATOR';
          let IconComponent = BrainCircuit;

          if (lowerAgent.includes('emar')) {
            agentColor = 'text-[#2affa3]';
            agentBg = 'bg-[#091a13]';
            agentBorder = 'border-[#2affa3]/30';
            personaBadge = 'THE SCIENTIST · DSP';
            IconComponent = Activity;
          } else if (lowerAgent.includes('ricky')) {
            agentColor = 'text-[#f5a800]';
            agentBg = 'bg-[#1a1306]';
            agentBorder = 'border-[#f5a800]/30';
            personaBadge = 'THE SOUND GOD · 808';
            IconComponent = Sparkles;
          } else if (lowerAgent.includes('kingpin')) {
            agentColor = 'text-[#ff3c00]';
            agentBg = 'bg-[#1a0b06]';
            agentBorder = 'border-[#ff3c00]/30';
            personaBadge = 'THE VOCAL ORACLE';
            IconComponent = Mic2;
          }

          if (isUser) {
            return (
              <div key={idx} className="flex justify-end w-full group animate-fade-in">
                <div className="max-w-[85%] bg-neutral-900 border border-neutral-700/80 rounded-2xl rounded-tr-xs p-3 shadow-md relative">
                  <div className="text-[10px] text-neutral-500 mb-1 flex justify-between items-center gap-3">
                    <span className="font-bold text-neutral-300 flex items-center gap-1 font-mono">
                      <span>PRODUCER</span>
                    </span>
                    <span className="font-mono text-[9px]">{log.timestamp}</span>
                  </div>
                  <div className="text-xs text-neutral-100 font-sans leading-relaxed whitespace-pre-wrap">
                    {log.message}
                  </div>
                </div>
              </div>
            );
          }

          const isSpeaking = speakingIndex === idx;

          return (
            <div key={idx} className="flex justify-start w-full group animate-fade-in">
              <div
                className={`max-w-[92%] ${agentBg} border ${agentBorder} rounded-2xl rounded-tl-xs p-3 shadow-lg relative transition-all hover:border-opacity-60`}
              >
                {/* Agent Header */}
                <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <IconComponent className={`w-3.5 h-3.5 ${agentColor} shrink-0`} />
                    <span className={`text-[11px] font-bold ${agentColor} truncate font-sans`}>
                      {log.agent}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-500 truncate hidden sm:inline">
                      [{personaBadge}]
                    </span>
                  </div>

                  {/* Message Action Tools */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono text-[9px] text-neutral-500 mr-1">
                      {log.timestamp}
                    </span>
                    {/* TTS Voice Button */}
                    <button
                      type="button"
                      onClick={() => handleSpeakLog(log.agent, log.message, idx)}
                      className={`p-1 rounded-md transition-all ${
                        isSpeaking
                          ? 'bg-gold/20 text-gold border border-gold/40 animate-pulse'
                          : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800'
                      }`}
                      title={isSpeaking ? 'Stop Voice' : `Listen to ${log.agent}`}
                    >
                      {isSpeaking ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(log.message, idx)}
                      className="p-1 rounded-md text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div className="text-xs text-neutral-200 font-sans leading-relaxed whitespace-pre-wrap break-words">
                  {log.message}
                </div>
              </div>
            </div>
          );
        })}

        {/* Floating Scroll to Bottom Indicator */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-neutral-900/90 border border-gold/40 text-gold rounded-full text-[10px] font-mono font-bold shadow-lg flex items-center gap-1 hover:bg-neutral-800 transition-all z-20"
          >
            <span>Jump to latest</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        )}

        {/* Thinking / Agent Processing Indicator */}
        {isSending && (
          <div className="flex justify-start w-full animate-fade-in">
            <div
              className={`max-w-[88%] rounded-2xl rounded-tl-xs p-3 shadow-lg border flex items-center gap-3 ${
                activeChannel === 'kappachino_emar'
                  ? 'bg-[#091a13] border-[#2affa3]/40 text-[#2affa3]'
                  : activeChannel === 'kappachino_ricky'
                    ? 'bg-[#1a1306] border-[#f5a800]/40 text-[#f5a800]'
                    : activeChannel === 'kingpin'
                      ? 'bg-[#1a0b06] border-[#ff3c00]/40 text-[#ff3c00]'
                      : 'bg-[#18130a] border-gold/40 text-gold'
              }`}
            >
              <div className="relative flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold tracking-wide font-sans">
                  {activeChannel === 'kappachino_emar'
                    ? 'Kappachino Emar is analyzing DSP acoustics...'
                    : activeChannel === 'kappachino_ricky'
                      ? 'Kappachino Ricky is constructing rhythm bounce...'
                      : activeChannel === 'kingpin'
                        ? 'Kingpin is channeling vocal resonance...'
                        : '3ONIK Council is deliberating consensus...'}
                </span>
                <span className="text-[9px] font-mono opacity-60">
                  3ONIK Engine · Reasoning & Audio Synthesis
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 6. GENERATED AUDIO STEM AUDITION PLAYER */}
      {generatedAudioUrl && (
        <div className="p-2.5 bg-[#140F0A] border-t border-gold/30 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-gold font-bold flex items-center gap-1">
              <AudioWaveform className="w-3 h-3 text-gold animate-pulse" />
              AI Generated Stem Preview
            </span>
            <button
              onClick={() => setGeneratedAudioUrl(null)}
              className="text-neutral-500 hover:text-neutral-300"
              title="Close preview"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <audio controls src={generatedAudioUrl} className="w-full h-7 rounded filter invert contrast-125" />
        </div>
      )}

      {/* 7. MULTIMODAL ATTACHMENT BADGE */}
      {audioFile && (
        <div className="px-3 py-1.5 bg-[#121B15] border-t border-[#2affa3]/30 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileAudio className="w-3.5 h-3.5 text-[#2affa3] shrink-0" />
            <span className="text-[#2affa3] font-mono text-[11px] truncate">
              {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
          <button
            type="button"
            onClick={clearAttachedAudio}
            className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
            title="Remove attachment"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 8. MULTIMODAL INPUT CONSOLE */}
      <div className="p-3 border-t border-neutral-800/80 bg-[#0A0A0A] shrink-0">
        <form onSubmit={handleSendPrompt} className="flex flex-col gap-2">
          <div
            className={`flex items-center gap-1.5 p-1.5 rounded-xl bg-neutral-900 border transition-all ${
              isListening
                ? 'border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                : 'border-neutral-800 focus-within:border-gold/60 focus-within:shadow-[0_0_10px_rgba(245,168,0,0.15)]'
            }`}
          >
            {/* Audio Stem Upload Trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-1.5 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
                audioFile
                  ? 'bg-[#2affa3]/20 text-[#2affa3] border border-[#2affa3]/40'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
              }`}
              title="Attach Audio Stem for Multimodal Analysis"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*"
              className="hidden"
            />

            {/* Council Mode Debate Pill Toggle */}
            <button
              type="button"
              onClick={() => setIsCouncilMode(!isCouncilMode)}
              className={`p-1.5 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
                isCouncilMode
                  ? 'bg-gold/20 text-gold border border-gold/40'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
              }`}
              title={isCouncilMode ? 'Council Debate Mode: ON' : 'Toggle Council Debate Mode'}
            >
              <Users className="w-3.5 h-3.5" />
            </button>

            {/* Prompt Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening for voice directive...'
                  : activeChannel === 'kappachino_emar'
                    ? 'Ask Emar for mix & DSP...'
                    : activeChannel === 'kappachino_ricky'
                      ? 'Ask Ricky for 808s & drums...'
                      : activeChannel === 'kingpin'
                        ? 'Ask Kingpin for vocal harmony...'
                        : 'Command the 3WM Council...'
              }
              className="flex-1 min-w-0 bg-transparent border-none text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none font-sans"
              autoComplete="off"
              disabled={isSending}
            />

            {/* Voice Recognition Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-1.5 rounded-lg transition-all shrink-0 flex items-center justify-center ${
                isListening
                  ? 'text-red-400 bg-red-500/20 border border-red-500/40 animate-pulse'
                  : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
              title={isListening ? 'Stop Listening' : 'Voice Command'}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!prompt.trim() || isSending}
              className={`p-1.5 rounded-lg transition-all shrink-0 flex items-center justify-center ${
                prompt.trim() && !isSending
                  ? 'bg-gold text-neutral-950 hover:bg-amber-400 font-bold shadow-glow-gold'
                  : 'text-neutral-600 bg-neutral-800/40 cursor-not-allowed'
              }`}
              title="Send to Agents"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* 9. STUDIO QUICK ACTION LAUNCHERS */}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={() =>
              handleSendPrompt(
                undefined,
                'Full session review: analyze track balance, frequency allocation, and arrangement.'
              )
            }
            className="flex-1 py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-gold/40 rounded-lg text-[10px] font-bold text-neutral-300 hover:text-gold transition-all flex items-center justify-center gap-1.5"
          >
            <Activity className="w-3 h-3 text-gold" />
            <span>REVIEW TRACK</span>
          </button>

          <button
            onClick={handleGenerateStem}
            disabled={isGeneratingStem}
            className="flex-1 py-1.5 px-2 bg-[#ff3c00]/15 hover:bg-[#ff3c00]/25 border border-[#ff3c00]/30 hover:border-[#ff3c00]/60 rounded-lg text-[10px] font-bold text-[#ff3c00] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Music className="w-3 h-3" />
            <span>{isGeneratingStem ? 'GENERATING...' : 'GEN STEM'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
