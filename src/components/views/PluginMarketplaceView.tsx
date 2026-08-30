import React, { useState } from 'react';
import {
  Package,
  Download,
  Check,
  Star,
  Sparkles,
  Filter,
  Music,
  Cpu,
  Flame,
  Search,
  Play,
  Pause,
} from 'lucide-react';

export interface PluginItem {
  id: string;
  name: string;
  creator: 'Kappachino Ricky' | 'Kappachino Emar' | 'Kingpin' | '3WM Studios';
  creatorColor: string;
  category: 'Drums & 808' | 'Vocal & Harmony' | 'DSP & Mastering' | 'Groove & FX';
  version: string;
  description: string;
  rating: number;
  downloads: string;
  installed: boolean;
  featured: boolean;
  tags: string[];
  specs: string[];
}

const PLUGINS: PluginItem[] = [
  {
    id: 'lagos-808-shaper',
    name: 'Lagos 808 & Log-Drum Shaper',
    creator: 'Kappachino Ricky',
    creatorColor: '#F5A800',
    category: 'Drums & 808',
    version: 'v2.4',
    description:
      'Dual-oscillator sub-bass designer with authentic Amapiano log-drum pitch envelope shaping and analog tape saturation.',
    rating: 4.9,
    downloads: '14.2k',
    installed: true,
    featured: true,
    tags: ['Amapiano', '808', 'Sub-Bass', 'Log Drum'],
    specs: ['55Hz Precision Sub Tuner', 'Transient Snap Driver', 'Harmonic Valve Drive'],
  },
  {
    id: 'oracle-vocal-stack',
    name: 'Oracle Multi-Part Vocal Harmonizer',
    creator: 'Kingpin',
    creatorColor: '#FF3C00',
    category: 'Vocal & Harmony',
    version: 'v3.1',
    description:
      '4-part intelligent Afro-Gospel & Afrofusion choir generator with pitch-tracked formant widening and analog plate reverb.',
    rating: 5.0,
    downloads: '18.9k',
    installed: false,
    featured: true,
    tags: ['Choir', 'Formant', 'Harmonizer', 'Vocals'],
    specs: ['4-Voice Intelligent Shifter', 'Formant Stereo Spread', 'Analog Optical Warmth'],
  },
  {
    id: 'scientist-linear-dsp',
    name: 'Scientist Linear-Phase Studio EQ',
    creator: 'Kappachino Emar',
    creatorColor: '#2AFFA3',
    category: 'DSP & Mastering',
    version: 'v1.8',
    description:
      'Surgical zero-latency linear-phase master bus equalizer with real-time WebGPU spectral masking detection.',
    rating: 4.8,
    downloads: '9.6k',
    installed: true,
    featured: false,
    tags: ['Mastering', 'Linear Phase', 'WebGPU', 'DSP'],
    specs: ['32-Band Surgical Q', 'Dynamic Mid/Side Carving', 'WebGPU Accelerated FFT'],
  },
  {
    id: 'kalakuta-vintage-pre',
    name: 'Kalakuta Vintage Console Preamp',
    creator: 'Kingpin',
    creatorColor: '#FF3C00',
    category: 'Groove & FX',
    version: 'v2.0',
    description:
      'Warm discrete transformer emulation modeled after legendary Lagos 1970s Kalakuta recording consoles.',
    rating: 4.9,
    downloads: '11.5k',
    installed: false,
    featured: false,
    tags: ['Vintage', 'Tape Saturation', 'Warmth', 'Preamp'],
    specs: ['Discrete Transformer Saturation', 'Harmonic Color Bias', 'Tape Flutter DSP'],
  },
  {
    id: 'afrobeats-pocket-quantizer',
    name: 'Afrobeats Pocket Swing Quantizer',
    creator: 'Kappachino Ricky',
    creatorColor: '#F5A800',
    category: 'Groove & FX',
    version: 'v1.5',
    description:
      'Intelligent non-linear micro-timing engine injecting signature Lagos, Accra, and Johannesburg percussive pocket swings.',
    rating: 4.7,
    downloads: '16.1k',
    installed: false,
    featured: true,
    tags: ['Groove', 'Swing', 'Afrobeats', 'Quantize'],
    specs: ['58% Afrofusion Micro-Swing', 'Humanize Randomizer', 'MIDI Drag & Drop'],
  },
];

export const PluginMarketplaceView: React.FC = () => {
  const [plugins, setPlugins] = useState<PluginItem[]>(PLUGINS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewingPluginId, setPreviewingPluginId] = useState<string | null>(null);

  const categories = ['All', 'Drums & 808', 'Vocal & Harmony', 'DSP & Mastering', 'Groove & FX'];

  const toggleInstall = (id: string) => {
    setPlugins((prev) => prev.map((p) => (p.id === id ? { ...p, installed: !p.installed } : p)));
  };

  const filteredPlugins = plugins.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-[#0D0D0D] p-6 text-white animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#F5A800]/20 bg-gradient-to-r from-[#181410] via-[#0D0D0D] to-[#1a1208] p-6 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#F5A800]/20 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-[#F5A800]">
              DSP Extension Vault
            </span>
            <span className="font-mono text-[10px] text-[#C9C9D4]/60">3WM Ecosystem v2.4</span>
          </div>
          <h2 className="mt-1 font-display text-3xl tracking-wide text-white">
            3WM PLUGIN MARKETPLACE
          </h2>
          <p className="max-w-none font-mono text-xs text-[#C9C9D4]/70">
            Expand your production operating environment with Afrofusion VST-grade audio processors,
            808 synthesizers, and agent algorithms.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9C9D4]/40" />
          <input
            type="text"
            placeholder="Search DSP plugins, 808s, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0D0D0D]/90 py-2.5 pl-9 pr-4 font-mono text-xs text-white placeholder-[#C9C9D4]/40 transition focus:border-[#F5A800] focus:outline-none focus:ring-1 focus:ring-[#F5A800]"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-xl px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider transition ${
              selectedCategory === cat
                ? 'bg-[#F5A800] text-[#0D0D0D] shadow-lg shadow-[#F5A800]/20'
                : 'border border-white/10 bg-[#16120e]/60 text-[#C9C9D4] hover:border-[#F5A800]/40 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredPlugins.map((plugin) => (
          <div
            key={plugin.id}
            className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#14110e]/70 p-5 backdrop-blur-md transition-all hover:border-[#F5A800]/50 hover:shadow-[0_0_30px_rgba(245,168,0,0.12)]"
          >
            <div>
              {/* Plugin Card Top */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${plugin.creatorColor}20`,
                        color: plugin.creatorColor,
                      }}
                    >
                      {plugin.creator}
                    </span>
                    <span className="font-mono text-[9px] text-[#C9C9D4]/40">{plugin.version}</span>
                  </div>
                  <h3 className="mt-1.5 font-display text-xl leading-tight text-white group-hover:text-[#F5A800]">
                    {plugin.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 font-mono text-[10px] text-[#F5A800]">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{plugin.rating}</span>
                </div>
              </div>

              {/* Description */}
              <p className="mt-2.5 font-mono text-xs leading-relaxed text-[#C9C9D4]/70">
                {plugin.description}
              </p>

              {/* Spec Highlights */}
              <div className="mt-3.5 space-y-1 rounded-xl bg-black/30 p-2.5 font-mono text-[10px] text-[#C9C9D4]/60">
                {plugin.specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[#F5A800]">›</span>
                    <span>{spec}</span>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {plugin.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-white/5 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-[#C9C9D4]/50"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Card Actions */}
            <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-3.5">
              <button
                type="button"
                onClick={() =>
                  setPreviewingPluginId((prev) => (prev === plugin.id ? null : plugin.id))
                }
                className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-[#C9C9D4]/70 transition hover:text-[#F5A800]"
              >
                {previewingPluginId === plugin.id ? (
                  <>
                    <Pause className="h-3.5 w-3.5 text-[#F5A800]" />
                    <span className="text-[#F5A800]">Auditioning DSP</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Audition Sound</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => toggleInstall(plugin.id)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition ${
                  plugin.installed
                    ? 'border border-[#2AFFA3]/40 bg-[#2AFFA3]/15 text-[#2AFFA3]'
                    : 'bg-[#F5A800] text-[#0D0D0D] hover:bg-[#F5A800]/90 shadow-md shadow-[#F5A800]/20'
                }`}
              >
                {plugin.installed ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Installed</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Install VST</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PluginMarketplaceView;
