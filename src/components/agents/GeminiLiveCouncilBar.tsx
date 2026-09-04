import React, { useState } from 'react';
import { Mic, MicOff, Radio, Sparkles } from 'lucide-react';
import { GeminiLiveSession, COUNCIL_AGENTS } from '../../services/geminiLiveClient';

export const GeminiLiveCouncilBar: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState<'emar' | 'ricky' | 'kingpin'>('emar');
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [session, setSession] = useState<GeminiLiveSession | null>(null);

  const toggleSession = async () => {
    if (isConnected && session) {
      session.disconnect();
      setSession(null);
      setIsConnected(false);
    } else {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      const newSession = new GeminiLiveSession(activeAgent);
      await newSession.connect(apiKey, (text) => setTranscript((prev) => `${prev} ${text}`));
      setSession(newSession);
      setIsConnected(true);
    }
  };

  const currentConfig = COUNCIL_AGENTS[activeAgent];

  return (
    <div className="bg-[#181410] border border-[#F5A800]/30 rounded-xl p-4 text-white shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isConnected
                ? 'bg-[#FF3C00]/20 text-[#FF3C00] animate-pulse'
                : 'bg-stone-800 text-stone-400'
            }`}
          >
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#F5A800]">{currentConfig.name}</h3>
            <p className="text-xs text-stone-400 font-mono">
              {currentConfig.role} • Voice: {currentConfig.voice}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['emar', 'ricky', 'kingpin'] as const).map((agent) => (
            <button
              key={agent}
              onClick={() => setActiveAgent(agent)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeAgent === agent
                  ? 'bg-[#F5A800] text-black shadow-lg shadow-[#F5A800]/20'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              {COUNCIL_AGENTS[agent].name.split(' ')[1] || COUNCIL_AGENTS[agent].name}
            </button>
          ))}
        </div>
      </div>

      {/* Control Action Bar */}
      <div className="flex items-center justify-between bg-[#0D0D0D] p-3 rounded-lg border border-stone-800">
        <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
          <Sparkles className="w-4 h-4 text-[#2AFFA3]" />
          <span>
            {isConnected
              ? 'Gemini 2.0 Live Bidirectional Streaming Active'
              : 'Council Idle — Click to Connect Live Voice'}
          </span>
        </div>

        <button
          onClick={() => void toggleSession()}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition ${
            isConnected
              ? 'bg-[#FF3C00] text-white hover:bg-red-600 shadow-lg shadow-[#FF3C00]/30'
              : 'bg-[#2AFFA3] text-black hover:bg-emerald-400 shadow-lg shadow-[#2AFFA3]/20'
          }`}
        >
          {isConnected ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          <span>{isConnected ? 'End Live Session' : 'Start Live Session'}</span>
        </button>
      </div>

      {transcript && (
        <div className="mt-3 p-3 bg-stone-900/80 rounded-lg border border-stone-800 text-xs font-mono text-stone-300 max-h-24 overflow-y-auto">
          <span className="text-[#F5A800] font-bold">Transcript:</span> {transcript}
        </div>
      )}
    </div>
  );
};
