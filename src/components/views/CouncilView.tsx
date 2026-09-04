import { LiveAudioAgent } from '../agents/LiveAudioAgent';
import React, { useState, useEffect } from 'react';
import { AgentOrb, AgentState } from '../ui/AgentOrb';
import { CouncilMode, CouncilMessage, CouncilSession } from '../../agents/councilMode';
import { Activity, Play, Square, MessagesSquare, CheckCircle, BrainCircuit } from 'lucide-react';

interface CouncilViewProps {
  council: CouncilMode;
  onDecision?: (decision: string) => void;
}

export const CouncilView: React.FC<CouncilViewProps> = ({ council, onDecision }) => {
  const [session, setSession] = useState<CouncilSession | null>(council.getActiveSession());
  const [messages, setMessages] = useState<CouncilMessage[]>(council.getMessages());
  const [topic, setTopic] = useState('Determine optimal 808 sub-bass distortion levels');

  // Local state for Agent animations
  const [emarState, setEmarState] = useState<AgentState>('idle');
  const [rickyState, setRickyState] = useState<AgentState>('idle');
  const [kingpinState, setKingpinState] = useState<AgentState>('idle');
  const [orchState, setOrchState] = useState<AgentState>('idle');

  // Sync with council state
  useEffect(() => {
    const interval = setInterval(() => {
      const active = council.getActiveSession();
      setSession(active);
      setMessages(council.getMessages());
    }, 1000);
    return () => clearInterval(interval);
  }, [council]);

  const handleStartDebate = async () => {
    if (session) return;

    // Reset states
    setEmarState('idle');
    setRickyState('idle');
    setKingpinState('idle');
    setOrchState('idle');

    // We run the debate in the background, but simulate the UI states here for effect
    const debatePromise = council.facilitateDebate(topic, 2);

    // Simulate UI animation progression
    setEmarState('thinking');
    setTimeout(() => {
      setEmarState('speaking');
      setRickyState('thinking');
    }, 2000);

    setTimeout(() => {
      setEmarState('idle');
      setRickyState('speaking');
      setKingpinState('thinking');
    }, 4500);

    setTimeout(() => {
      setRickyState('idle');
      setKingpinState('speaking');
      setOrchState('thinking');
    }, 7000);

    setTimeout(() => {
      setKingpinState('idle');
      setOrchState('speaking');
    }, 9500);

    setTimeout(() => {
      setOrchState('idle');
    }, 12000);

    const decision = await debatePromise;
    if (decision && onDecision) {
      onDecision(decision.decision);
    }
  };

  const handleStopDebate = () => {
    council.abandonSession();
    setSession(null);
    setEmarState('idle');
    setRickyState('idle');
    setKingpinState('idle');
    setOrchState('idle');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-neutral-100 uppercase tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-amber-500" />
            <span>Three Wise Men Council</span>
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time multi-agent debate and consensus engine.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={!!session}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-neutral-200 focus:border-amber-500 outline-none w-full md:w-80"
            placeholder="Topic to debate..."
          />
          {!session ? (
            <button
              onClick={handleStartDebate}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Play className="w-4 h-4" />
              <span>CONVENE</span>
            </button>
          ) : (
            <button
              onClick={handleStopDebate}
              className="px-5 py-2 bg-red-500 hover:bg-red-400 text-white font-black text-sm rounded-xl transition flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              <span>HALT</span>
            </button>
          )}
        </div>
      </div>

      {/* Agents Stage */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
        {/* Background Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at center, #f59e0b 0%, transparent 70%), linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          }}
        />

        <div className="flex flex-col md:flex-row items-center justify-around gap-10 relative z-10">
          <AgentOrb id="emar" name="Kappachino Emar" color="#10b981" state={emarState} size="lg" />
          <AgentOrb
            id="orch"
            name="ThreeWM Orchestrator"
            color="#8b5cf6"
            state={orchState}
            size="md"
          />
          <AgentOrb
            id="ricky"
            name="Kappachino Ricky"
            color="#f59e0b"
            state={rickyState}
            size="lg"
          />
          <AgentOrb id="kingpin" name="Kingpin" color="#ec4899" state={kingpinState} size="lg" />
        </div>
      </div>

      {/* Live Voice Uplink (Gemini Live Bidirectional Agent) */}
      <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs font-mono font-bold tracking-widest text-neutral-300 uppercase">
              Bidirectional Voice Uplink (Gemini Live Stream)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-neutral-500 uppercase">
            3ONIK Acoustic Node v2.2
          </span>
        </div>
        <LiveAudioAgent />
      </div>

      {/* Live Transcript Log */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl h-96 flex flex-col">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-4">
            <MessagesSquare className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-bold text-neutral-200 uppercase">
              Live Council Transcript
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-3">
                <Activity className="w-8 h-8 opacity-20" />
                <p className="text-xs uppercase tracking-widest font-mono">
                  No active debate session
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-neutral-950 border border-neutral-850 p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-black uppercase tracking-wider ${
                        msg.agent === 'emar'
                          ? 'text-emerald-400'
                          : msg.agent === 'ricky'
                            ? 'text-amber-400'
                            : msg.agent === 'kingpin'
                              ? 'text-pink-400'
                              : 'text-purple-400'
                      }`}
                    >
                      {msg.agent}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 border border-neutral-800 px-2 py-0.5 rounded">
                      {msg.type}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-300 font-mono leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Consensus Result Panel */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-neutral-200 uppercase">Consensus Reached</h3>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
            {session && session.consensus ? (
              <div className="space-y-4">
                <p className="text-sm font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 p-4 rounded-xl">
                  "{session.consensus.decision}"
                </p>
                <div className="text-[10px] font-mono text-neutral-400 space-y-1">
                  <p>CONFIDENCE: {(session.consensus.confidence * 100).toFixed(0)}%</p>
                  <p className="line-clamp-3 text-neutral-500 mt-2">
                    {session.consensus.reasoning}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-600 uppercase tracking-widest font-mono">
                Awaiting consensus...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
