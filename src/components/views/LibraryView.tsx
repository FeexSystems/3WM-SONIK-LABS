import React, { useState } from 'react';
import { Track } from '../../types';
import { useToast } from '../ui/toaster';
import {
  FolderOpen,
  Music,
  Download,
  Trash2,
  FileAudio,
  Sparkles,
  Plus,
  Clock,
} from 'lucide-react';

interface LibraryViewProps {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  onNavigate: (view: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ tracks, onSelectTrack, onNavigate }) => {
  const { toast } = useToast();
  const [tab, setTab] = useState<'STEMS' | 'MASTERS' | 'TAKES' | 'PRESETS'>('STEMS');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-neutral-100 uppercase tracking-tight flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <span>Audio Library & Stems Repository</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Lossless 24-bit PCM multi-track stems, master bounces, vocal takes, and DSP presets.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-850 pb-2">
        {(['STEMS', 'MASTERS', 'TAKES', 'PRESETS'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition ${
              tab === t
                ? 'bg-amber-500 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Stems Tab Content */}
      {tab === 'STEMS' && (
        <div className="space-y-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-neutral-100">{track.title}</h3>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {track.artist} • {track.genre} • {track.bpm} BPM
                  </span>
                </div>
                <button
                  onClick={() => {
                    onSelectTrack(track);
                    onNavigate('studio');
                  }}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-semibold rounded-lg transition"
                >
                  Load in DAW
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {track.stems.map((stem) => (
                  <div
                    key={stem.id}
                    className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-6 rounded-full"
                        style={{ backgroundColor: stem.color }}
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-200 block">
                          {stem.name}
                        </span>
                        <span className="text-[9px] font-mono text-neutral-500">
                          WAV • 24-bit 44.1k
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        toast({
                          type: 'info',
                          title: 'Downloading',
                          description: `Downloading stem: ${stem.name}`,
                        })
                      }
                      className="p-1.5 text-neutral-400 hover:text-amber-400 transition"
                      title="Download Stem"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Masters Tab Content */}
      {tab === 'MASTERS' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 divide-y divide-neutral-850">
          {tracks.map((track) => (
            <div key={track.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs">
                  <FileAudio className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-100 block">
                    {track.title} (Ozone 11 Lagos Club Master)
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    -13.8 LUFS • -0.3 dBTP • 24-bit 48kHz WAV
                  </span>
                </div>
              </div>

              <button
                onClick={() =>
                  toast({
                    type: 'info',
                    title: 'Exporting',
                    description: `Exporting ${track.title} lossless master`,
                  })
                }
                className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD WAV</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Takes Tab Content */}
      {tab === 'TAKES' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <p className="text-xs text-neutral-400">
            All microphone vocal takes captured across recording sessions in your workspace.
          </p>
          <div className="p-8 text-center text-neutral-500 font-mono text-xs border border-dashed border-neutral-800 rounded-xl">
            Recorded takes will automatically index here as you record in the Recording Booth.
          </div>
        </div>
      )}

      {/* Presets Tab Content */}
      {tab === 'PRESETS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { name: 'Shrine Highlife Warmth', role: 'EQ & Reverb', tags: ['Highlife', 'Plate'] },
            { name: 'Afro-Drill Log Drum Crunch', role: 'EQ & Saturation', tags: ['55Hz', 'Tube'] },
            {
              name: 'Lagos Mainstage Vocal Presence',
              role: 'Compressor & Air',
              tags: ['Opto', '10k'],
            },
          ].map((p, idx) => (
            <div
              key={idx}
              className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-2"
            >
              <span className="text-xs font-bold text-neutral-100 block">{p.name}</span>
              <span className="text-[10px] font-mono text-neutral-400 block">{p.role}</span>
              <div className="flex gap-1 pt-1">
                {p.tags.map((t, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-amber-400 border border-amber-500/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
