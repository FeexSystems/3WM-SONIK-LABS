import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { Track, AvatarState } from '../../types';
import { ErrorBoundary } from '../ErrorBoundary';
import { artistProfiles, StudioRoomId, STUDIO_ROOMS } from '../three/artistProfiles';
import {
  Sparkles,
  Info,
  X,
  Mic,
  MicOff,
  Send,
  Radio,
  Sliders,
  Volume2,
  Maximize2,
  RotateCcw,
  Zap,
  Activity,
} from 'lucide-react';
import { voiceAgentEngine, AgentId, VoiceState } from '../../audio/voiceAgentEngine';
import { Button } from '../ui/button';

const Studio3DCanvas = lazy(() => import('../three/Studio3DCanvas'));

interface ArtistWorld3DViewProps {
  track?: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const ArtistWorld3DView: React.FC<ArtistWorld3DViewProps> = ({
  track,
  isPlaying,
  onTogglePlay,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(artistProfiles[0]?.id ?? 'emar');
  const [activeRoom, setActiveRoom] = useState<StudioRoomId>('control_room');
  const [avatarState, setAvatarState] = useState<AvatarState>('SINGING');
  const [canvasEpoch, setCanvasEpoch] = useState(0);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; timestamp: number } | null>(
    null
  );

  // Gemini Interactions 3D HUD Console
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [promptInput, setPromptInput] = useState('');
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  const [chatLog, setChatLog] = useState<
    Array<{ sender: string; text: string; timestamp: number; color?: string }>
  >([
    {
      sender: 'THREEWM ORCHESTRATOR',
      text: 'Artist World 3D spatial field initialized. Welcome to the Lagos Kalakuta control room.',
      timestamp: Date.now(),
      color: '#F5A800',
    },
  ]);

  // Voice Mode Integration
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');

  const showFeedback = useCallback((message: string) => {
    setFeedbackToast({ message, timestamp: Date.now() });
  }, []);

  useEffect(() => {
    const unsub = voiceAgentEngine.subscribe({
      onStateChange: (st) => setVoiceState(st),
      onAgentResponse: (msg) => {
        setChatLog((prev) => [
          ...prev,
          {
            sender: msg.sender.toUpperCase(),
            text: msg.text,
            timestamp: msg.timestamp,
            color:
              msg.sender === 'emar'
                ? '#2AFFA3'
                : msg.sender === 'ricky'
                  ? '#F5A800'
                  : msg.sender === 'kingpin'
                    ? '#FF3C00'
                    : '#FFFFFF',
          },
        ]);
      },
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!feedbackToast) return;
    const timer = setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [feedbackToast]);

  // Global Keyboard Shortcuts for Pro Studio Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key === '1') {
        setActiveRoom('control_room');
        showFeedback('Navigated to Lagos Kalakuta Control Room');
      } else if (e.key === '2') {
        setActiveRoom('vocal_booth');
        showFeedback('Navigated to Vocal Isolation Booth');
      } else if (e.key === '3') {
        setActiveRoom('mastering_chamber');
        showFeedback('Navigated to Gold Bus Mastering Suite');
      } else if (e.key === '4') {
        setActiveRoom('oracle_sphere');
        showFeedback('Entered the Oracle Sphere Council Field');
      } else if (e.key.toLowerCase() === 'q') {
        setSelectedAvatar('emar');
        showFeedback('Focused on Kappachino Emar (The Scientist)');
      } else if (e.key.toLowerCase() === 'w') {
        setSelectedAvatar('ricky');
        showFeedback('Focused on Kappachino Ricky (The Sound God)');
      } else if (e.key.toLowerCase() === 'e') {
        setSelectedAvatar('kingpin');
        showFeedback('Focused on Kingpin (The Vocal Oracle)');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, showFeedback]);

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isProcessingPrompt) return;

    const userText = promptInput.trim();
    setPromptInput('');
    setIsProcessingPrompt(true);

    const userMsg = {
      sender: 'YOU',
      text: userText,
      timestamp: Date.now(),
      color: '#FFFFFF',
    };
    setChatLog((prev) => [...prev, userMsg]);

    const targetAgentId = (selectedAvatar as AgentId) || 'orchestrator';

    try {
      const res = await fetch('/api/demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: targetAgentId, text: userText }),
      });
      const data = await res.json();
      const reply = data.text || 'Council aligned. 3D spatial field parameters updated.';

      setChatLog((prev) => [
        ...prev,
        {
          sender: targetAgentId.toUpperCase(),
          text: reply,
          timestamp: Date.now(),
          color:
            targetAgentId === 'emar'
              ? '#2AFFA3'
              : targetAgentId === 'ricky'
                ? '#F5A800'
                : targetAgentId === 'kingpin'
                  ? '#FF3C00'
                  : '#F5A800',
        },
      ]);
      showFeedback(`${targetAgentId.toUpperCase()} responded in 3D space`);
    } catch {
      setChatLog((prev) => [
        ...prev,
        {
          sender: targetAgentId.toUpperCase(),
          text: '3D acoustic resonance adjusted. Low-frequency standing waves damped.',
          timestamp: Date.now(),
          color: targetAgentId === 'emar' ? '#2AFFA3' : '#F5A800',
        },
      ]);
    } finally {
      setIsProcessingPrompt(false);
    }
  };

  const handleToggleVoice = async () => {
    if (voiceState === 'IDLE') {
      voiceAgentEngine.setActiveAgent((selectedAvatar as AgentId) || 'orchestrator');
      await voiceAgentEngine.startListening();
      showFeedback('Live Voice Mode Active');
    } else {
      voiceAgentEngine.stopListening();
      showFeedback('Voice Mode Paused');
    }
  };

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-[#0D0D0D] animate-in fade-in duration-200">
      {/* Dynamic Action Feedback Banner */}
      {feedbackToast && (
        <div className="pointer-events-auto absolute left-1/2 top-6 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5 rounded-full border border-[#F5A800]/40 bg-[#0D0D0D]/95 px-4 py-2 shadow-[0_0_25px_rgba(245,168,0,0.25)] backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-[#F5A800]" />
            <span className="font-mono text-[11px] font-medium tracking-wide text-white">
              {feedbackToast.message}
            </span>
            <button
              type="button"
              onClick={() => setFeedbackToast(null)}
              className="ml-1 text-white/40 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top 3D Control Bar */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#120F0C]/80 p-1.5 backdrop-blur-xl shadow-2xl">
        <button
          onClick={onTogglePlay}
          className="flex items-center gap-2 rounded-xl bg-[#F5A800] px-3.5 py-1.5 font-mono text-xs font-bold text-black shadow-lg hover:bg-[#F5A800]/90 transition"
        >
          <span>{isPlaying ? 'PAUSE' : 'PLAY 3D'}</span>
        </button>

        <button
          onClick={handleToggleVoice}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs transition ${
            voiceState !== 'IDLE'
              ? 'border-red-500/50 bg-red-500/20 text-red-400 animate-pulse'
              : 'border-white/10 bg-white/5 text-[#C9C9D4] hover:text-white'
          }`}
        >
          {voiceState !== 'IDLE' ? (
            <MicOff className="h-3.5 w-3.5" />
          ) : (
            <Mic className="h-3.5 w-3.5" />
          )}
          <span>{voiceState !== 'IDLE' ? 'VOICE ON' : 'VOICE'}</span>
        </button>

        <button
          onClick={() => setIsConsoleOpen(!isConsoleOpen)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs transition ${
            isConsoleOpen
              ? 'border-[#F5A800]/40 bg-[#F5A800]/10 text-[#F5A800]'
              : 'border-white/10 bg-white/5 text-[#C9C9D4] hover:text-white'
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          <span>ORACLE HUD</span>
        </button>
      </div>

      {/* Interactive Gemini Interactions 3D HUD Console (Floating Right) */}
      {isConsoleOpen && (
        <div className="absolute bottom-6 right-6 z-40 flex h-[380px] w-80 md:w-96 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#120F0C]/95 p-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#F5A800]" />
              <span className="font-display text-sm tracking-wider text-white">
                GEMINI 3D ORACLE
              </span>
            </div>
            <button
              onClick={() => setIsConsoleOpen(false)}
              className="text-white/40 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 font-sans text-xs scrollbar-thin scrollbar-thumb-white/10">
            {chatLog.map((m, i) => (
              <div key={i} className="flex flex-col">
                <span
                  className="font-mono text-[9px] uppercase tracking-wider font-bold"
                  style={{ color: m.color || '#C9C9D4' }}
                >
                  {m.sender}
                </span>
                <p className="mt-0.5 leading-relaxed text-[#E0E0E6]/90">{m.text}</p>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={handleSendPrompt}
            className="mt-2 flex gap-1.5 pt-2 border-t border-white/10"
          >
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Prompt 3D spatial field..."
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#F5A800] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isProcessingPrompt}
              className="flex items-center justify-center rounded-xl bg-[#F5A800] px-3 text-black font-bold hover:bg-[#F5A800]/90 transition"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Keyboard Shortcut Hints (Floating Bottom Right Indicator) */}
      <div className="pointer-events-none absolute left-4 bottom-6 z-40 hidden xl:flex flex-col gap-1 rounded-xl border border-white/5 bg-[#0D0D0D]/80 p-2 font-mono text-[9px] text-[#C9C9D4]/50 backdrop-blur-md">
        <span className="font-bold text-[#F5A800]/70 uppercase tracking-widest">
          3D Studio Hotkeys
        </span>
        <span>
          <kbd className="text-white/80 font-bold">Space</kbd> Play / Pause
        </span>
        <span>
          <kbd className="text-white/80 font-bold">1–4</kbd> Switch Rooms
        </span>
        <span>
          <kbd className="text-white/80 font-bold">Q/W/E</kbd> Select Wise Men
        </span>
      </div>

      <ErrorBoundary
        key={canvasEpoch}
        fallback={(error) => (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 bg-[#0D0D0D] px-6 text-center">
            <p className="font-display text-4xl tracking-wide text-[#F5A800]">WORLD OFFLINE</p>
            <p className="max-w-md font-mono text-[11px] uppercase tracking-widest text-[#C9C9D4]/70">
              {error?.message ||
                'The 3D studio failed to load. Retry to restore the WebGL context.'}
            </p>
            <button
              type="button"
              onClick={() => setCanvasEpoch((n) => n + 1)}
              className="rounded-xl border border-[#F5A800] bg-[#F5A800] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#0D0D0D]"
            >
              Retry World
            </button>
          </div>
        )}
      >
        <Suspense
          fallback={
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 bg-[#0D0D0D]">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5A800]/20 border-t-[#F5A800]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9C9D4]/60">
                Loading 3WM Artist World
              </span>
            </div>
          }
        >
          <Studio3DCanvas
            isPlaying={isPlaying}
            onTogglePlay={onTogglePlay}
            selectedAvatar={selectedAvatar}
            onSelectAvatar={setSelectedAvatar}
            activeRoom={activeRoom}
            onSelectRoom={setActiveRoom}
            currentArtistState={avatarState}
            onArtistStateChange={setAvatarState}
            sessionLabel={track?.title}
            onTriggerActionFeedback={showFeedback}
          />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default ArtistWorld3DView;
