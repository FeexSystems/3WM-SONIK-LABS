import React from 'react';
import { Track } from '../types';
import {
  Play,
  Pause,
  Square,
  Music,
  Cpu,
  Sparkles,
  Sliders,
  RefreshCw,
  Upload,
  Disc,
  Radio,
} from 'lucide-react';
import { OrganizationSwitcher } from './workspace/OrganizationSwitcher';

interface Props {
  currentTrack: Track | null;
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  currentTab: 'mixer' | 'ai' | 'mastering' | 'workflows';
  onChangeTab: (tab: 'mixer' | 'ai' | 'mastering' | 'workflows') => void;
  onOpenNewTrack: () => void;
  currentStep: number;
}

export const ConsoleHeader: React.FC<Props> = ({
  currentTrack,
  tracks,
  onSelectTrack,
  isPlaying,
  onTogglePlay,
  onStop,
  currentTab,
  onChangeTab,
  onOpenNewTrack,
  currentStep,
}) => {
  return (
    <header className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-neutral-950 font-black text-xl tracking-tighter">
            3WM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-100 tracking-tight">
                SONIC AI PLATFORM
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
                LAGOS AFROFUSION
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Three Wise Men Engine • Kappachino Emar × Kappachino Ricky × Kingpin
            </p>
          </div>
        </div>

        {/* Transport Controls & Beat Grid */}
        <div className="flex items-center gap-4 bg-neutral-950/80 px-4 py-2 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2">
            <button
              id="btn-play-pause"
              onClick={onTogglePlay}
              className={`p-2.5 rounded-lg font-bold transition flex items-center gap-2 text-xs ${
                isPlaying
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/30'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
              }`}
              title={isPlaying ? 'Pause Audio' : 'Play Live Synth Stream'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>{isPlaying ? 'PLAYING' : 'PREVIEW'}</span>
            </button>
            <button
              id="btn-stop"
              onClick={onStop}
              className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
              title="Stop Playback"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

          {/* 16-step rhythmic indicator */}
          <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-neutral-800">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-6 rounded-full transition-all duration-75 ${
                  isPlaying && currentStep === i
                    ? 'bg-amber-400 scale-y-125 shadow-sm shadow-amber-400'
                    : i % 4 === 0
                      ? 'bg-neutral-700'
                      : 'bg-neutral-850'
                }`}
              />
            ))}
          </div>

          {/* Track Info Badges */}
          {currentTrack && (
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-neutral-400 pl-2 border-l border-neutral-800">
              <span className="bg-neutral-900 px-2 py-1 rounded text-amber-400 font-semibold border border-neutral-800">
                {currentTrack.bpm} BPM
              </span>
              <span className="bg-neutral-900 px-2 py-1 rounded text-cyan-400 font-semibold border border-neutral-800">
                {currentTrack.key}
              </span>
            </div>
          )}
        </div>

        {/* Track Selector & New Track Button */}
        <div className="flex items-center gap-2">
          <OrganizationSwitcher />

          <div className="relative">
            <select
              id="select-track"
              value={currentTrack?.id || ''}
              onChange={(e) => {
                const found = tracks.find((t) => t.id === e.target.value);
                if (found) onSelectTrack(found);
              }}
              className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-amber-500 max-w-[200px] truncate"
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-upload-track"
            onClick={onOpenNewTrack}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition border border-neutral-700/60"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1 border-t border-neutral-800/80 pt-2">
        <button
          id="tab-mixer"
          onClick={() => onChangeTab('mixer')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            currentTab === 'mixer'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>DAW Mixer & Stems</span>
        </button>

        <button
          id="tab-ai-console"
          onClick={() => onChangeTab('ai')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            currentTab === 'ai'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Cpu className="w-4 h-4 text-amber-400" />
          <span>AI Agents (BushBot / Grok / Perplexity)</span>
        </button>

        <button
          id="tab-mastering"
          onClick={() => onChangeTab('mastering')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            currentTab === 'mastering'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Ozone 11 & T-RackS Rack</span>
        </button>

        <button
          id="tab-workflows"
          onClick={() => onChangeTab('workflows')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            currentTab === 'workflows'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <span>n8n Pipelines & Vector Memory</span>
        </button>
      </div>
    </header>
  );
};
