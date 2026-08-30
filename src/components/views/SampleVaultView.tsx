import React, { useState } from 'react';
import {
  Upload,
  Wand2,
  Scissors,
  Play,
  Plus,
  Search,
  Activity,
  Sparkles,
  Server,
} from 'lucide-react';
import { orchestrator } from '../../agents/Orchestrator';

export const SampleVaultView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [samples, setSamples] = useState([
    { id: '1', name: 'Dark Trap 808 - Generated', type: '808', duration: '0:04', ready: true },
    { id: '2', name: 'Lagos Percussion Break', type: 'Drum Break', duration: '0:08', ready: true },
  ]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    // Simulate generation dispatch
    await orchestrator.dispatchUserIntent(
      `Generate a sample based on this prompt: ${prompt}`,
      { trackId: 'current', trackTitle: 'Current' },
      prompt,
      'text/plain'
    );

    setTimeout(() => {
      setSamples([
        ...samples,
        {
          id: Date.now().toString(),
          name: `Gen: ${prompt.substring(0, 15)}...`,
          type: 'Generated',
          duration: '0:05',
          ready: true,
        },
      ]);
      setIsGenerating(false);
      setPrompt('');
    }, 2000);
  };

  return (
    <div className="flex-1 p-6 flex flex-col overflow-y-auto bg-neutral-950 text-neutral-200">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bebas tracking-wider text-white">
            SAMPLE VAULT & SOURCE SEPARATION
          </h2>
          <p className="text-neutral-500 font-mono text-xs mt-1">
            Epic 1 & Epic 5: Generative Audio Pipeline
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generative AI Module */}
        <div className="bg-[#1a1208]/30 border border-[#f5a800]/20 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-[#f5a800]" />
            <h3 className="font-bebas tracking-wide text-lg text-[#f5a800]">
              TEXT-TO-SAMPLE (RICKY)
            </h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A dusty boom bap drum break with a shaker..."
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#f5a800]/50 font-mono"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="bg-[#f5a800] hover:bg-[#e09900] text-black px-4 py-2 rounded font-bold text-sm tracking-wider disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {isGenerating ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              GENERATE
            </button>
          </div>
        </div>

        {/* Source Separation Module */}
        <div className="bg-[#0a1a14]/30 border border-[#2affa3]/20 rounded-xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-5 h-5 text-[#2affa3]" />
            <h3 className="font-bebas tracking-wide text-lg text-[#2affa3]">
              STEM SEPARATION ENGINE (EMAR)
            </h3>
          </div>
          <div className="border-2 border-dashed border-[#2affa3]/20 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#2affa3]/5 transition-colors">
            <Upload className="w-8 h-8 text-neutral-500 mb-2" />
            <p className="text-sm font-medium">
              Drop a full mix (.wav or .mp3) here to separate stems
            </p>
            <p className="text-xs text-neutral-500 mt-1 font-mono">
              Uses Demucs/Spleeter architecture
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex-1 flex flex-col">
        <h3 className="font-bebas tracking-wide text-lg text-white mb-4">VAULT INVENTORY</h3>
        <div className="flex-1 border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900/50">
          <div className="grid grid-cols-12 gap-4 p-3 border-b border-neutral-800 font-mono text-xs text-neutral-500">
            <div className="col-span-1">PLAY</div>
            <div className="col-span-5">NAME</div>
            <div className="col-span-3">TYPE</div>
            <div className="col-span-2">DURATION</div>
            <div className="col-span-1 text-right">ACTION</div>
          </div>

          <div className="overflow-y-auto">
            {samples.map((sample) => (
              <div
                key={sample.id}
                className="grid grid-cols-12 gap-4 p-3 border-b border-neutral-800/50 hover:bg-neutral-800/50 items-center transition-colors group"
              >
                <div className="col-span-1">
                  <button className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:text-[#f5a800] transition-colors">
                    <Play className="w-4 h-4 ml-1" />
                  </button>
                </div>
                <div className="col-span-5 font-medium text-sm">{sample.name}</div>
                <div className="col-span-3 text-xs font-mono text-neutral-400">
                  <span className="px-2 py-1 rounded bg-neutral-800">{sample.type}</span>
                </div>
                <div className="col-span-2 text-xs font-mono">{sample.duration}</div>
                <div className="col-span-1 flex justify-end">
                  <button
                    className="w-8 h-8 rounded bg-[#f5a800]/10 text-[#f5a800] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#f5a800]/20"
                    title="Add to Timeline"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
