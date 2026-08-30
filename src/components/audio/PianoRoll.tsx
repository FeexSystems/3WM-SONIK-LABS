import React, { useState, useEffect } from 'react';
import { MidiNote, MidiPattern, ScaleDefinition } from '../../types';
import {
  SCALES,
  ROOT_NOTES,
  AFRO_CHORD_PROGRESSIONS,
  MidiQuantizer,
  GROOVE_TEMPLATES,
  noteNumberToName,
  isPitchInScale,
} from '../../audio/midiEngine';
import { soundEngine } from '../../audio/engine';
import { Wand2, Trash2, Volume2, Plus, ArrowUp, ArrowDown, Sparkles, Zap } from 'lucide-react';

interface PianoRollProps {
  pattern: MidiPattern;
  onUpdatePattern: (updated: MidiPattern) => void;
  currentPlaybackStep?: number;
  keyRoot?: string;
  scaleName?: string;
}

export const PianoRoll: React.FC<PianoRollProps> = ({
  pattern,
  onUpdatePattern,
  currentPlaybackStep = 0,
  keyRoot = 'F#',
  scaleName = 'Natural Minor',
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeOctave, setActiveOctave] = useState<number>(3); // Default around C3 - B4
  const [selectedScale, setSelectedScale] = useState<string>(scaleName);
  const [selectedRoot, setSelectedRoot] = useState<string>(keyRoot);
  const [selectedDuration, setSelectedDuration] = useState<number>(1); // Default 16th note (1 step)
  const [defaultVelocity, setDefaultVelocity] = useState<number>(100);
  const [snapGrid, setSnapGrid] = useState<number>(1); // 1 = 16th, 2 = 8th, 4 = 1/4
  const [keyboardFocus, setKeyboardFocus] = useState<{ pitch: number; step: number } | null>(null);

  const totalSteps = pattern.lengthSteps || 16;
  const startPitch = (activeOctave + 1) * 12; // Base pitch
  const numPitches = 24; // 2 octaves range
  const pitches = Array.from({ length: numPitches }, (_, i) => startPitch + (numPitches - 1 - i));

  // Keyboard navigation for piano roll grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!keyboardFocus) return;

      const { pitch, step } = keyboardFocus;
      const pitchIdx = pitches.indexOf(pitch);

      if (e.key === 'ArrowRight' && step < totalSteps - 1) {
        setKeyboardFocus({ pitch, step: step + 1 });
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' && step > 0) {
        setKeyboardFocus({ pitch, step: step - 1 });
        e.preventDefault();
      } else if (e.key === 'ArrowDown' && pitchIdx < pitches.length - 1) {
        setKeyboardFocus({ pitch: pitches[pitchIdx + 1], step });
        e.preventDefault();
      } else if (e.key === 'ArrowUp' && pitchIdx > 0) {
        setKeyboardFocus({ pitch: pitches[pitchIdx - 1], step });
        e.preventDefault();
      } else if (e.key === ' ' || e.key === 'Enter') {
        handleCellClick(pitch, step);
        e.preventDefault();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const existing = pattern.notes.find(
          (n) => n.pitch === pitch && n.startStep <= step && step < n.startStep + n.durationSteps
        );
        if (existing) {
          handleDeleteNote(existing.id);
        }
        e.preventDefault();
      } else if (e.key === 'Escape') {
        setKeyboardFocus(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardFocus, pitches, totalSteps, pattern.notes]);

  // Handle cell click (add note or select/audition)
  const handleCellClick = (pitch: number, step: number) => {
    // Check if note exists at this step & pitch
    const existing = pattern.notes.find(
      (n) => n.pitch === pitch && n.startStep <= step && step < n.startStep + n.durationSteps
    );

    if (existing) {
      setSelectedNoteId(existing.id);
      soundEngine.auditionNote(existing.pitch, existing.velocity, 0.25, pattern.instrumentType);
    } else {
      const newNote: MidiNote = {
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        pitch,
        startStep: Math.floor(step / snapGrid) * snapGrid,
        durationSteps: selectedDuration,
        velocity: defaultVelocity,
        probability: 1.0,
        channel: 0,
      };
      const updatedNotes = [...pattern.notes, newNote];
      onUpdatePattern({ ...pattern, notes: updatedNotes });
      setSelectedNoteId(newNote.id);
      soundEngine.auditionNote(
        pitch,
        defaultVelocity,
        0.25 * selectedDuration,
        pattern.instrumentType
      );
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = pattern.notes.filter((n) => n.id !== noteId);
    onUpdatePattern({ ...pattern, notes: updatedNotes });
    if (selectedNoteId === noteId) setSelectedNoteId(null);
  };

  const handleClearAll = () => {
    onUpdatePattern({ ...pattern, notes: [] });
    setSelectedNoteId(null);
  };

  const handleQuantize = () => {
    const quantized = MidiQuantizer.quantize(pattern.notes, snapGrid);
    onUpdatePattern({ ...pattern, notes: quantized });
  };

  const handleHumanize = () => {
    const humanized = MidiQuantizer.humanize(pattern.notes, GROOVE_TEMPLATES[0]);
    onUpdatePattern({ ...pattern, notes: humanized });
  };

  const handleTranspose = (semitones: number) => {
    const transposed = MidiQuantizer.transpose(pattern.notes, semitones);
    onUpdatePattern({ ...pattern, notes: transposed });
  };

  // Stamp chord progression into piano roll
  const handleStampChordProgression = (progressionIndex: number) => {
    const prog = AFRO_CHORD_PROGRESSIONS[progressionIndex];
    if (!prog) return;

    const newNotes: MidiNote[] = [];
    const chordDuration = Math.floor(totalSteps / prog.chords.length);

    prog.chords.forEach((chord, idx) => {
      const stepOffset = idx * chordDuration;
      chord.notes.forEach((pitch) => {
        newNotes.push({
          id: `chord-note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          pitch: pitch + (activeOctave - 3) * 12,
          startStep: stepOffset,
          durationSteps: Math.max(2, chordDuration - 1),
          velocity: 95 + Math.floor(Math.random() * 15),
          probability: 1.0,
          channel: 0,
        });
      });
    });

    onUpdatePattern({ ...pattern, notes: newNotes });
    soundEngine.auditionNote(prog.chords[0].notes[0], 100, 0.5, pattern.instrumentType);
  };

  const selectedNote = pattern.notes.find((n) => n.id === selectedNoteId);

  return (
    <div className="flex flex-col bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-900/90 border-b border-neutral-800 text-xs">
        {/* Instrument & Octave selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{pattern.name}</span>
          </div>

          <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-lg">
            <span className="text-neutral-400 px-1 text-[11px]">Octave</span>
            {[2, 3, 4, 5].map((oct) => (
              <button
                key={oct}
                onClick={() => setActiveOctave(oct)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  activeOctave === oct
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                C{oct}
              </button>
            ))}
          </div>

          {/* Scale Assistant */}
          <div className="flex items-center gap-1.5 bg-neutral-800/80 px-2 py-1 rounded-lg border border-neutral-700/50">
            <span className="text-neutral-400 text-[11px]">Scale:</span>
            <select
              value={selectedRoot}
              onChange={(e) => setSelectedRoot(e.target.value)}
              className="bg-neutral-900 text-amber-300 font-bold text-[11px] rounded px-1.5 py-0.5 border border-neutral-700 focus:outline-none"
            >
              {ROOT_NOTES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={selectedScale}
              onChange={(e) => setSelectedScale(e.target.value)}
              className="bg-neutral-900 text-neutral-200 text-[11px] rounded px-1.5 py-0.5 border border-neutral-700 focus:outline-none"
            >
              {Object.keys(SCALES).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons: Quantize, Humanize, Transpose, Chords */}
        <div className="flex items-center gap-2">
          {/* Note Length Selector */}
          <div className="flex items-center gap-1 bg-neutral-800/80 px-2 py-1 rounded-lg text-[11px]">
            <span className="text-neutral-400">Len:</span>
            {[1, 2, 4, 8].map((len) => (
              <button
                key={len}
                onClick={() => setSelectedDuration(len)}
                className={`px-1.5 py-0.5 rounded ${
                  selectedDuration === len
                    ? 'bg-amber-400 text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {len === 1 ? '1/16' : len === 2 ? '1/8' : len === 4 ? '1/4' : '1/2'}
              </button>
            ))}
          </div>

          <button
            onClick={handleQuantize}
            className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md border border-neutral-700 transition-colors"
            title="Snap all notes to active grid"
          >
            <Wand2 className="w-3 h-3 text-amber-400" />
            <span>Quantize</span>
          </button>

          <button
            onClick={handleHumanize}
            className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md border border-neutral-700 transition-colors"
            title="Apply Lagos Afrofusion pocket swing & velocity dynamics"
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Afro Groove</span>
          </button>

          {/* Transpose Buttons */}
          <div className="flex items-center gap-0.5 bg-neutral-800 p-0.5 rounded-md border border-neutral-700">
            <button
              onClick={() => handleTranspose(1)}
              className="p-1 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
              title="Transpose +1 Semitone"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleTranspose(-1)}
              className="p-1 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
              title="Transpose -1 Semitone"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 px-2 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-md border border-red-800/40 transition-colors"
            title="Clear all notes in pattern"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Quick Chord Progression Stamp Presets */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/60 border-b border-neutral-800/80 text-[11px] overflow-x-auto">
        <span className="text-neutral-400 font-mono flex-shrink-0">Afro Chords:</span>
        {AFRO_CHORD_PROGRESSIONS.map((prog, idx) => (
          <button
            key={prog.name}
            onClick={() => handleStampChordProgression(idx)}
            className="flex items-center gap-1 px-2 py-0.5 bg-neutral-800/90 hover:bg-amber-500/20 hover:text-amber-300 text-neutral-300 rounded border border-neutral-700/60 flex-shrink-0 transition-colors"
          >
            <Plus className="w-2.5 h-2.5 text-amber-400" />
            <span>{prog.name.split(' (')[0]}</span>
            <span className="text-[9px] text-neutral-400 font-mono">({prog.numeral})</span>
          </button>
        ))}
      </div>

      {/* Main Piano Roll Grid */}
      <div className="flex overflow-x-auto max-h-[420px] relative select-none">
        {/* Pitch Keys Sidebar (Vertical) */}
        <div className="flex flex-col flex-shrink-0 w-20 sticky left-0 z-20 bg-neutral-950 border-r border-neutral-800 shadow-md">
          {pitches.map((pitch) => {
            const name = noteNumberToName(pitch);
            const isBlackKey = name.includes('#');
            const inScale = isPitchInScale(pitch, selectedRoot, selectedScale);

            return (
              <div
                key={pitch}
                onClick={() => soundEngine.auditionNote(pitch, 100, 0.3, pattern.instrumentType)}
                className={`h-6 flex items-center justify-between px-2 text-[10px] font-mono cursor-pointer border-b border-neutral-800/40 transition-colors ${
                  isBlackKey
                    ? 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                    : 'bg-neutral-950 text-neutral-400 hover:bg-neutral-900'
                } ${inScale ? 'font-semibold text-amber-300' : 'opacity-70'}`}
              >
                <span>{name}</span>
                {inScale && (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" title="In Scale" />
                )}
              </div>
            );
          })}
        </div>

        {/* Steps Grid Canvas */}
        <div className="flex flex-col flex-grow relative bg-neutral-950">
          {/* Header Bar with Step Numbers */}
          <div className="flex h-6 border-b border-neutral-800 bg-neutral-900/80 text-[10px] font-mono text-neutral-400">
            {Array.from({ length: totalSteps }, (_, step) => {
              const isBeatStart = step % 4 === 0;
              const isBarStart = step % 16 === 0;
              const barNum = Math.floor(step / 16) + 1;
              const beatNum = (Math.floor(step / 4) % 4) + 1;

              return (
                <div
                  key={step}
                  className={`flex-1 min-w-[28px] flex items-center justify-center border-r border-neutral-800/40 ${
                    isBarStart
                      ? 'bg-neutral-800/60 font-bold text-amber-400'
                      : isBeatStart
                        ? 'text-neutral-300'
                        : ''
                  }`}
                >
                  {isBeatStart ? `${barNum}.${beatNum}` : ''}
                </div>
              );
            })}
          </div>

          {/* Grid Rows for each pitch */}
          {pitches.map((pitch) => {
            const name = noteNumberToName(pitch);
            const isBlackKey = name.includes('#');
            const inScale = isPitchInScale(pitch, selectedRoot, selectedScale);

            return (
              <div
                key={pitch}
                className={`flex h-6 border-b border-neutral-800/30 ${
                  isBlackKey ? 'bg-neutral-900/30' : 'bg-neutral-950'
                } ${inScale ? 'bg-amber-500/[0.02]' : ''}`}
              >
                {Array.from({ length: totalSteps }, (_, step) => {
                  const isBeat = step % 4 === 0;
                  const isBar = step % 16 === 0;
                  const note = pattern.notes.find(
                    (n) =>
                      n.pitch === pitch &&
                      n.startStep <= step &&
                      step < n.startStep + n.durationSteps
                  );
                  const isStartOfNote = note && note.startStep === step;
                  const isSelected = note && note.id === selectedNoteId;

                  return (
                    <div
                      key={step}
                      onClick={() => handleCellClick(pitch, step)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setKeyboardFocus({ pitch, step });
                        }
                      }}
                      tabIndex={0}
                      role="gridcell"
                      aria-label={`Pitch ${noteNumberToName(pitch)}, step ${step + 1}${note ? ', note present' : ', empty'}`}
                      className={`flex-1 min-w-[28px] border-r relative cursor-pointer transition-all outline-none ${
                        isBar
                          ? 'border-r-neutral-700/60'
                          : isBeat
                            ? 'border-r-neutral-800/60'
                            : 'border-r-neutral-900/40'
                      } ${!note ? 'hover:bg-amber-400/10' : ''} ${
                        keyboardFocus?.pitch === pitch && keyboardFocus?.step === step
                          ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-neutral-950'
                          : ''
                      }`}
                    >
                      {isStartOfNote && note && (
                        <div
                          className={`absolute top-0.5 bottom-0.5 left-0.5 rounded-xs flex items-center justify-between px-1 text-[9px] font-mono z-10 shadow-sm transition-all ${
                            isSelected
                              ? 'bg-amber-400 text-black font-bold ring-2 ring-white'
                              : 'bg-amber-500/90 text-black font-semibold hover:bg-amber-400'
                          }`}
                          style={{
                            width: `calc(${note.durationSteps * 100}% - 2px)`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNoteId(note.id);
                            soundEngine.auditionNote(
                              note.pitch,
                              note.velocity,
                              0.2,
                              pattern.instrumentType
                            );
                          }}
                        >
                          <span className="truncate">{noteNumberToName(note.pitch)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            className="hover:text-red-950 opacity-60 hover:opacity-100"
                            title="Delete note"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Active Playhead indicator bar */}
          {soundEngine.getPlaying() && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-30 shadow-[0_0_8px_#f59e0b] pointer-events-none transition-all duration-75"
              style={{
                left: `calc(${(currentPlaybackStep / totalSteps) * 100}% + 2px)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Bottom Selected Note Detail Editor */}
      {selectedNote && (
        <div className="flex items-center justify-between gap-4 p-2.5 bg-neutral-900 border-t border-neutral-800 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-mono font-bold">
              Selected Note: {noteNumberToName(selectedNote.pitch)}
            </span>
            <span className="text-neutral-400 text-[11px]">
              Step: {selectedNote.startStep + 1} | Len: {selectedNote.durationSteps} steps
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Velocity Slider */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-neutral-400 text-[11px]">Velocity:</span>
              <input
                type="range"
                min="10"
                max="127"
                value={selectedNote.velocity}
                onChange={(e) => {
                  const vel = parseInt(e.target.value, 10);
                  const updated = pattern.notes.map((n) =>
                    n.id === selectedNote.id ? { ...n, velocity: vel } : n
                  );
                  onUpdatePattern({ ...pattern, notes: updated });
                }}
                className="w-24 accent-amber-400"
              />
              <span className="font-mono text-amber-300 w-7 text-right">
                {selectedNote.velocity}
              </span>
            </div>

            <button
              onClick={() => handleDeleteNote(selectedNote.id)}
              className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-300 rounded text-[11px] border border-red-800"
            >
              Delete Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
