import React, { useEffect, useState, useRef } from 'react';
import { worldState, AgentActivityLog } from '../../agents/WorldState';
import { SonikWorldState, AgentState, AgentId } from '../../agents/types';
import { orchestrator } from '../../agents/Orchestrator';
import { Activity, BrainCircuit, Users, Mic2, Mic, Sparkles, X, Upload, Music } from 'lucide-react';
// removed socket.io
import { Track } from '../../types';
import { AgentDebate } from './AgentDebate';

const AGENT_CONFIGS = [
  {
    id: 'kappachino_emar' as AgentId,
    name: 'Kappachino Emar',
    title: 'THE SCIENTIST',
    domain: 'Audio Engineering',
    icon: <Activity className="w-5 h-5 text-emar" />,
    color: 'emar',
  },
  {
    id: 'kappachino_ricky' as AgentId,
    name: 'Kappachino Ricky',
    title: 'THE SOUND GOD',
    domain: 'Instruments / Drums',
    icon: <Sparkles className="w-5 h-5 text-ricky" />,
    color: 'ricky',
  },
  {
    id: 'kingpin' as AgentId,
    name: 'Kingpin',
    title: 'THE VOCAL ORACLE',
    domain: 'Vocal Orchestra',
    icon: <Mic2 className="w-5 h-5 text-kingpin" />,
    color: 'kingpin',
  },
];

export const AgentPanel: React.FC<{
  isCollapsed?: boolean;
  onClose?: () => void;
  currentTrack?: Track | null;
}> = ({ isCollapsed = false, onClose, currentTrack }) => {
  const [state, setState] = useState<SonikWorldState & { activities: AgentActivityLog[] }>(
    worldState.getState()
  );
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBase64, setAudioBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isCouncilMode, setIsCouncilMode] = useState(false);

  const currentTrackRef = useRef<Track | null | undefined>(currentTrack);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    return worldState.subscribe((newState) => {
      setState(newState);
    });
  }, []);

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
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.activities]);

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

  const handleGenerateStem = async () => {
    worldState.logActivity('ThreeWMOrchestrator', 'Initiating AI Server-Side Audio Generation...');
    try {
      const trackId = currentTrack?.id || 'demo';
      const res = await fetch(`/api/tracks/${trackId}/generate-stem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Generate an Amapiano log drum groove', type: 'beat' }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedAudioUrl(data.audioUrl);
        worldState.logActivity(
          'Kingpin',
          'TrueFoundry Stem generated successfully. Streaming output...'
        );
      } else {
        worldState.logActivity('ThreeWMOrchestrator', `AI Generation Failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      worldState.logActivity('ThreeWMOrchestrator', 'Network error during stem generation.');
    }
  };

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

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    const text = prompt;
    setPrompt('');

    const context = currentTrack
      ? {
          trackId: currentTrack.id,
          trackTitle: currentTrack.title,
          bpm: currentTrack.bpm,
          key: currentTrack.key,
          dspSettings: currentTrack.settings,
          hasVocals:
            currentTrack.stems?.some((s) => s.name.toLowerCase().includes('vocal')) || false,
        }
      : undefined;

    await orchestrator.dispatchUserIntent(
      text,
      context,
      audioBase64 || undefined,
      audioFile?.type || undefined,
      isCouncilMode
    );

    // Reset file upload state
    setAudioFile(null);
    setAudioBase64('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusColor = (agentState: AgentState, colorTheme: string) => {
    if (agentState === 'IDLE') return 'text-neutral-500';
    if (agentState === 'ERROR') return 'text-red-400';
    return `text-${colorTheme} animate-pulse`;
  };

  return (
    <div
      className={`absolute right-0 top-0 bottom-0 z-50 flex flex-col h-full bg-neutral-950/80 glass border-l border-neutral-800 shrink-0 transition-all duration-300 ease-in-out overflow-hidden shadow-2xl ${
        isCollapsed
          ? 'translate-x-full opacity-0 pointer-events-none'
          : 'translate-x-0 opacity-100 w-80'
      }`}
    >
      <div className="w-80 h-full flex flex-col">
        <div className="p-4 border-b border-neutral-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-ricky pulse-gold" />
            <h2 className="text-sm font-bold text-transparent bg-clip-text text-gradient-gold">
              3WM AGENTS
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
              title="Close Agent Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {AGENT_CONFIGS.map((agent, index) => {
            const currentState = state.agentState[agent.id];
            return (
              <div
                key={agent.id}
                style={{ animationDelay: `${index * 100}ms` }}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden animate-slide-up hover:border-neutral-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 shadow-sm ${currentState !== 'IDLE' ? 'shadow-glow-' + agent.color : ''}`}
                    >
                      {agent.icon}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-neutral-100">{agent.name}</h3>
                      <div className="text-[10px] font-mono text-neutral-500">{agent.title}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${currentState !== 'IDLE' ? 'bg-current animate-pulse' : 'bg-neutral-600'} ${getStatusColor(currentState, agent.color)}`}
                  />
                  <span className={getStatusColor(currentState, agent.color)}>{currentState}</span>
                </div>
                <div className="text-xs text-neutral-400">
                  {currentState === 'IDLE'
                    ? 'Standing by...'
                    : `Processing ${agent.domain.toLowerCase()}...`}
                </div>
              </div>
            );
          })}

          <div
            className="mt-4 flex-1 flex flex-col min-h-0 bg-[#0a0a0a] border border-neutral-800 rounded-xl overflow-hidden shadow-inner animate-fade-in"
            style={{ animationDelay: '300ms' }}
          >
            <div className="bg-neutral-900 px-3 py-1.5 border-b border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/80"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500/80"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500/80"></div>
              </div>
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                3WM Terminal
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] flex flex-col gap-1 text-neutral-300">
              {[...state.activities].reverse().map((log, idx) => {
                let agentColor = 'text-ricky';
                if (log.agent === 'Kappachino Emar') agentColor = 'text-emar';
                if (log.agent === 'Kingpin') agentColor = 'text-kingpin';
                if (log.agent === 'ThreeWMOrchestrator') agentColor = 'text-orchestrator';

                return (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-neutral-600 shrink-0">[{log.timestamp}]</span>
                    <span className="break-words">
                      <span className={`${agentColor} font-bold mr-1`}>{log.agent}:</span>
                      {log.message}
                    </span>
                  </div>
                );
              })}
              {state.activities.length === 0 && (
                <div className="text-neutral-600 italic">3WM SONIK SYS_READY...</div>
              )}
              <div ref={terminalEndRef} />
            </div>

            <div className="p-2 border-t border-neutral-800 bg-[#050505] shrink-0">
              {generatedAudioUrl && (
                <div className="bg-[#111] p-2 border-b border-neutral-800">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#f5a800] mb-1">
                    Generated Audio Stem
                  </p>
                  <audio controls src={generatedAudioUrl} className="w-full h-6" />
                </div>
              )}
              <form
                onSubmit={handleSendPrompt}
                className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${isListening ? 'bg-red-500/10 border border-red-500/30' : 'border border-transparent'}`}
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${audioFile ? 'bg-[#2affa3]/20 text-[#2affa3]' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'}`}
                  title="Upload Audio Stem for AI Analysis"
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

                <span
                  className={`${isListening ? 'text-red-500' : 'text-emar'} font-mono text-xs font-bold ${isListening ? 'animate-pulse' : ''}`}
                >
                  ❯
                </span>
                <button
                  type="button"
                  onClick={() => setIsCouncilMode(!isCouncilMode)}
                  className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${isCouncilMode ? 'bg-amber-500/20 text-amber-500' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'}`}
                  title="Council Debate Mode"
                >
                  <Users className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Listening for command...'
                      : isCouncilMode
                        ? 'Ask the Council...'
                        : audioFile
                          ? 'Add prompt to audio file...'
                          : 'Enter command...'
                  }
                  className={`flex-1 min-w-0 bg-transparent border-none text-xs font-mono focus:outline-none transition-colors ${isListening ? 'text-red-400 placeholder-red-400/50' : 'text-neutral-200 placeholder-neutral-700'}`}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 text-xs font-bold ${
                    isListening
                      ? 'text-red-400 bg-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.3)]'
                      : 'text-neutral-400 bg-neutral-800 hover:text-neutral-200 hover:bg-neutral-700'
                  }`}
                  title="Voice Commander"
                >
                  <Mic className={`w-3.5 h-3.5 ${isListening ? 'animate-pulse' : ''}`} />
                  {isListening ? 'LISTENING...' : 'LISTEN'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => orchestrator.dispatchUserIntent('Review this project')}
              className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-gold rounded-xl text-xs font-bold text-neutral-200 transition-all shadow-sm hover:shadow-glow-gold flex items-center justify-center gap-2"
            >
              <Activity className="w-3 h-3 text-gold" />
              <span>REVIEW</span>
            </button>
            <button
              onClick={handleGenerateStem}
              className="flex-1 py-2 bg-[#ff3c00]/20 hover:bg-[#ff3c00]/30 border border-[#ff3c00]/30 hover:border-[#ff3c00] rounded-xl text-xs font-bold text-[#ff3c00] transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-glow-fire"
            >
              <Music className="w-3 h-3" />
              <span>GEN AUDIO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
