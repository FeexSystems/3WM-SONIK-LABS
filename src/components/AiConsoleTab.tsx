import React, { useState } from 'react';
import { Track, AIAgent } from '../types';
import {
  Bot,
  Sparkles,
  Send,
  Zap,
  Sliders,
  CheckCircle,
  MessageSquare,
  Terminal,
} from 'lucide-react';

interface Props {
  track: Track;
  onRunAiCommand: (agent: any, command: string) => Promise<void>;
  isLoading: boolean;
}

const agentsList: AIAgent[] = [
  {
    id: 'bushbot',
    name: 'BushBot',
    title: 'Afrofusion Studio Engineer (Lagos HQ)',
    avatar: '🌴',
    persona:
      'Warm, precise, wise — steeped in the Kalakuta Shrine legacy and modern Afrobeats grooves.',
    accentColor: 'from-amber-500 to-orange-600',
    skills: [
      'Shrine Plate Reverb',
      'Afrobeats Compression',
      'Vocal Tightening & Pitch Presence',
      'Log Drum Pocket EQ',
    ],
    examplePrompts: [
      'Tighten vocals and apply Lagos warmth',
      'Apply Afrobeats compression and punch up log drum',
      'Reverb like Kalakuta Shrine with lush brass tail',
      'Balance highlife guitars and polish polyrhythms',
    ],
  },
  {
    id: 'grok',
    name: 'Grok Audio',
    title: 'AI Acoustic Critic & Spectral Radar',
    avatar: '⚡',
    persona:
      'Unfiltered, deep harmonic analysis, frequency spectrum radar, and LUFS headroom scrutiny.',
    accentColor: 'from-cyan-500 to-blue-600',
    skills: [
      'Dynamic Range Monitoring',
      'Harmonic Distortion Radar',
      'Frequency Masking Detection',
      'LUFS Compliance',
    ],
    examplePrompts: [
      'Analyze frequency spectrum and find harmonic masking',
      'Check dynamic range headroom for streaming platforms',
      'Scan bass-to-kick phase correlation',
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity Mixin',
    title: 'Plugin Wizard & Automation Master',
    avatar: '🔮',
    persona:
      'Autonomous parameter calculator for Ozone 11, T-RackS vintage tube compressor, and VST macros.',
    accentColor: 'from-purple-500 to-indigo-600',
    skills: [
      'Ozone 11 Macro Generation',
      'Dynamic EQ Curves',
      'T-RackS Tube Saturation',
      'Automated Sidechain Ducking',
    ],
    examplePrompts: [
      'Automate Ozone Maximizer for maximum Lagos club bounce',
      'Generate T-RackS vintage tube drive curves',
      'Calculate dynamic EQ notches for vocal clarity',
    ],
  },
];

export const AiConsoleTab: React.FC<Props> = ({ track, onRunAiCommand, isLoading }) => {
  const [selectedAgent, setSelectedAgent] = useState<any>('bushbot');
  const [commandInput, setCommandInput] = useState('');

  const currentAgentData = agentsList.find((a) => a.id === selectedAgent)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || isLoading) return;
    const cmd = commandInput;
    setCommandInput('');
    await onRunAiCommand(selectedAgent, cmd);
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isLoading) return;
    await onRunAiCommand(selectedAgent, prompt);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* 3 AI Agent Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agentsList.map((agent) => {
          const isSelected = selectedAgent === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-neutral-900 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{agent.avatar}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {isSelected ? 'ACTIVE ENGINE' : 'STANDBY'}
                  </span>
                </div>
                <h3 className="font-bold text-neutral-100 text-sm">{agent.name}</h3>
                <p className="text-xs text-neutral-400 mb-3">{agent.title}</p>
                <p className="text-xs text-neutral-300 line-clamp-2">{agent.persona}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-wrap gap-1">
                {agent.skills.slice(0, 2).map((skill, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-neutral-950 text-neutral-400 px-2 py-0.5 rounded border border-neutral-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Studio Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Prompt & Execution Console */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                {currentAgentData.name} Audio Command Console
              </span>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Target: <strong className="text-neutral-200">{track.title}</strong>
            </span>
          </div>

          {/* Quick Prompt Chips */}
          <div>
            <span className="text-xs font-semibold text-neutral-400 mb-2 block">
              Quick Lagos Presets & Prompts:
            </span>
            <div className="flex flex-wrap gap-2">
              {currentAgentData.examplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 text-xs rounded-lg border border-neutral-800 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Command Input Form */}
          <form onSubmit={handleSubmit} className="pt-2">
            <div className="relative">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder={`Tell ${currentAgentData.name} what to adjust (e.g. "Add warmth to the brass and tighten log drum kick")...`}
                className="w-full bg-neutral-950 border border-neutral-750 focus:border-amber-500 rounded-xl py-3 pl-4 pr-24 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !commandInput.trim()}
                className="absolute right-2 top-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5 disabled:opacity-40 disabled:hover:bg-amber-500"
              >
                {isLoading ? (
                  <span className="animate-spin text-sm">⚡</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>EXECUTE</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Live Studio Event Logs */}
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                Session Action Log & Agent Responses
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {track.history.length} Events
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {track.history.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-950 p-3 rounded-lg border border-neutral-850 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      {item.agent} • {item.action}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">{item.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Acoustic Scorecard & Live Agent Feedback */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Afrofusion Acoustic Scorecard
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-neutral-400">Afrobeat Groove Index</span>
                  <span className="text-amber-400 font-mono">
                    {track.analysis?.afrobeatGrooveIndex || 90}/100
                  </span>
                </div>
                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${track.analysis?.afrobeatGrooveIndex || 90}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-neutral-400">Harmonic Warmth Score</span>
                  <span className="text-orange-400 font-mono">
                    {track.analysis?.harmonicWarmthScore || 85}/100
                  </span>
                </div>
                <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
                  <div
                    className="bg-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${track.analysis?.harmonicWarmthScore || 85}%` }}
                  />
                </div>
              </div>

              {/* Agent Dedicated Insight Box */}
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-2 mt-4">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Latest {currentAgentData.name} Insight:
                </span>
                <p className="text-xs text-neutral-300 italic leading-relaxed">
                  {selectedAgent === 'bushbot' &&
                    (track.analysis?.agentInsights.bushBot || 'Ready to mix.')}
                  {selectedAgent === 'grok' &&
                    (track.analysis?.agentInsights.grok || 'Ready to analyze.')}
                  {selectedAgent === 'perplexity' &&
                    (track.analysis?.agentInsights.perplexity || 'Ready to automate.')}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
            <span>Powered by 3WM Audio AI</span>
            <span className="text-amber-400 font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
