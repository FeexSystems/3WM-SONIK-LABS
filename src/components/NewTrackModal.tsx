import React, { useState } from 'react';
import { Track } from '../types';
import { X, Upload, Music, Disc, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrack: (trackData: Partial<Track>) => void;
}

const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Session',
    bpm: 112,
    key: 'C Minor',
    genre: 'Afro-Pop / Global Dance',
  },
  {
    id: 'afrofusion',
    name: 'Afrofusion Beat',
    bpm: 105,
    key: 'F# Minor',
    genre: 'Afrofusion / Amapiano Hybrid',
  },
  {
    id: 'amapiano',
    name: 'Amapiano Groove',
    bpm: 113,
    key: 'G# Minor',
    genre: 'Afrofusion / Amapiano Hybrid',
  },
  {
    id: 'vocal',
    name: 'Vocal Mastering Chain',
    bpm: 100,
    key: 'C Major',
    genre: 'Afrobeats / Highlife Fusion',
  },
];

export const NewTrackModal: React.FC<Props> = ({ isOpen, onClose, onCreateTrack }) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('Kappachino Emar × Kappachino Ricky');
  const [genre, setGenre] = useState('Afrofusion / Amapiano Hybrid');
  const [bpm, setBpm] = useState(112);
  const [key, setKey] = useState('F# Minor');
  const [activeTemplate, setActiveTemplate] = useState('blank');

  if (!isOpen) return null;

  const handleTemplateSelect = (t: (typeof TEMPLATES)[0]) => {
    setActiveTemplate(t.id);
    setBpm(t.bpm);
    setKey(t.key);
    setGenre(t.genre);
    if (!title || TEMPLATES.some((temp) => temp.name === title)) {
      setTitle(t.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateTrack({
      title,
      artist,
      genre,
      bpm,
      key,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-200 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-100 text-sm">New 3WM Sonic Session</h3>
            <p className="text-xs text-neutral-400">Initialize stems and acoustic vector memory</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Project Templates
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTemplateSelect(t)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all ${activeTemplate === t.id ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'}`}
                >
                  <div className="font-bold mb-1 text-sm">{t.name}</div>
                  <div className="font-mono text-[9px] opacity-80">
                    {t.bpm} BPM • {t.key}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-neutral-800 w-full" />

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Session / Track Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lagos Mainland Groove"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Artist / Producers
            </label>
            <input
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Tempo (BPM)
              </label>
              <input
                type="number"
                min="60"
                max="180"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value) || 112)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Musical Key
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Afrofusion Sub-Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none"
            >
              <option value="Afrofusion / Amapiano Hybrid">Afrofusion / Amapiano Hybrid</option>
              <option value="Afrobeats / Highlife Fusion">Afrobeats / Highlife Fusion</option>
              <option value="Kalakuta Roots Afrobeat">Kalakuta Roots Afrobeat</option>
              <option value="Afro-Pop / Global Dance">Afro-Pop / Global Dance</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>CREATE SESSION</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
