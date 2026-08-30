import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Track,
  MidiPattern,
  StepSequencerChannel,
  GrooveTemplate,
  AiProducerRequest,
  AIAgentId,
} from '../../types';
import { PianoRoll } from '../audio/PianoRoll';
import { StepSequencer } from '../audio/StepSequencer';
import { Eight08LabPlugin } from '../plugins/Eight08LabPlugin';
import { TrapDrumMachinePlugin } from '../plugins/TrapDrumMachinePlugin';
import {
  GROOVE_TEMPLATES,
  MidiQuantizer,
  SCALES,
  ROOT_NOTES,
  midiSynth,
} from '../../audio/midiEngine';
import { soundEngine } from '../../audio/engine';
import { transportBridge } from '../../audio/transportBridge';
import {
  Sparkles,
  Music,
  Zap,
  Sliders,
  Play,
  Square,
  Wand2,
  RefreshCw,
  Plus,
  Layers,
  Flame,
  Volume2,
  Bot,
  Shuffle,
  Radio,
  Disc,
  Activity,
  Lightbulb,
} from 'lucide-react';

interface BeatLabViewProps {
  track: Track;
  onUpdateTrack: (updated: Track) => void;
  onTriggerAiProducer?: (request: AiProducerRequest) => Promise<void>;
}

// Initial Default Patterns and Drum Channels for 3WM Afrofusion

const AiSuggestionBanner: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const getAiSuggestion = () => {
    switch (activeTab) {
      case 'step_seq':
        return {
          agent: 'Ricky',
          color: 'text-amber-400',
          bgColor: 'bg-amber-400/10',
          borderColor: 'border-amber-500/30',
          message:
            'Ricky suggests: "Try shifting the shakers slightly off the grid for that authentic Lagos bounce. Or hit Mutate to generate a rhythmic variation."',
          icon: <Zap className="w-4 h-4" />,
        };
      case 'piano_roll':
        return {
          agent: 'Kingpin',
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10',
          borderColor: 'border-orange-500/30',
          message:
            'Kingpin suggests: "Your melody is solid, but the chord voicings could use some tension. Add a 7th or 9th for more Afrofusion flavor."',
          icon: <Wand2 className="w-4 h-4" />,
        };
      case '808_lab':
        return {
          agent: 'Emar',
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-400/10',
          borderColor: 'border-emerald-500/30',
          message:
            'Emar suggests: "The 808 decay is a bit long for this BPM. I can tighten the envelope and add soft-clip saturation for extra punch."',
          icon: <Activity className="w-4 h-4" />,
        };
      case 'drum_machine':
        return {
          agent: 'Ricky',
          color: 'text-rose-400',
          bgColor: 'bg-rose-400/10',
          borderColor: 'border-rose-500/30',
          message:
            'Ricky suggests: "This drum pack goes hard. Remember to route the kick and 808 to a bus with sidechain compression to keep the low-end clean."',
          icon: <Layers className="w-4 h-4" />,
        };
      default:
        return null;
    }
  };

  const suggestion = getAiSuggestion();
  if (!suggestion) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.3 }}
        className={`flex items-center gap-3 p-3 rounded-xl border bg-neutral-900/60 ${suggestion.borderColor}`}
      >
        <div className={`p-2 rounded-lg ${suggestion.bgColor} ${suggestion.color}`}>
          {suggestion.icon}
        </div>
        <div className="flex flex-col">
          <span
            className={`text-[10px] font-mono font-bold uppercase tracking-wider ${suggestion.color}`}
          >
            {suggestion.agent} • AI Copilot
          </span>
          <span className="text-xs text-neutral-300">{suggestion.message}</span>
        </div>
        <div className="ml-auto">
          <button
            className={`p-1.5 rounded-md hover:bg-neutral-800 transition-colors ${suggestion.color}`}
            title="Apply Suggestion"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const TRAP_SOUND_PACKS = [
  {
    id: 'atlanta-808-dark',
    name: 'Atlanta 808 Dark Trap Kit',
    category: 'Atlanta Trap',
    color: 'from-purple-950 to-neutral-900',
    borderColor: 'border-purple-500/30',
    badgeColor: 'bg-purple-500/20 text-purple-300',
    description:
      'Metro Boomin style hard saturated 808 sub, Spinz punch kick, crisp clap, and rapid rolling hats.',
    previewSample: 'sonik_808',
    channels: [
      {
        id: 'ch-trap-808-sub',
        name: 'Hard Atlanta 808 (F1)',
        sampleKey: 'sonik_808',
        pitch: 41,
        volume: 0.95,
        pan: 0,
        muted: false,
        solo: false,
        is808Channel: true,
        eight08Params: {
          mode: 'DISTORTED',
          waveform: 'sine',
          glideTime: 70,
          punchAttack: 0.9,
          decay: 2.0,
          drive: 0.45,
          subBoost: 5.5,
          legato: true,
        },
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: [0, 3, 6, 8, 12, 14].includes(i),
          pitch: [0, 3, 8, 12].includes(i) ? 41 : 46,
          noteName: [0, 3, 8, 12].includes(i) ? 'F1' : 'A#1',
          velocity: [0, 8].includes(i) ? 125 : 105,
          probability: 1,
          offset: 0,
          accent: [0, 8].includes(i),
          slide: [6, 14].includes(i),
        })),
      },
      {
        id: 'ch-trap-kick',
        name: 'Spinz Hard Kick',
        sampleKey: 'kick',
        pitch: 36,
        volume: 0.95,
        pan: 0,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: [0, 3, 8, 11].includes(i),
          velocity: i === 0 ? 127 : 110,
          probability: 1,
          offset: 0,
          accent: i === 0,
        })),
      },
      {
        id: 'ch-trap-clap',
        name: 'Atlanta Crisp Clap',
        sampleKey: 'clap',
        pitch: 39,
        volume: 0.9,
        pan: 0,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: [4, 12].includes(i),
          velocity: 120,
          probability: 1,
          offset: 0,
          accent: true,
        })),
      },
      {
        id: 'ch-trap-hat-rolls',
        name: 'Trap Rolling Hats (4x)',
        sampleKey: 'trap_hat_ratchet',
        pitch: 42,
        volume: 0.85,
        pan: 0.15,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: true,
          velocity: [7, 15].includes(i) ? 120 : [2, 6, 10, 14].includes(i) ? 95 : 75,
          probability: 1,
          offset: 0,
          accent: [7, 15].includes(i),
          ratchet: [7, 15].includes(i) ? 4 : 1,
        })),
      },
      {
        id: 'ch-trap-open-hat',
        name: 'Sizzle Open Hat',
        sampleKey: 'open_hat',
        pitch: 46,
        volume: 0.75,
        pan: -0.2,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: [2, 10].includes(i),
          velocity: 100,
          probability: 1,
          offset: 0,
          accent: false,
        })),
      },
      {
        id: 'ch-trap-street-fx',
        name: 'Street Police Siren & Shots',
        sampleKey: 'street_siren',
        pitch: 60,
        volume: 0.8,
        pan: 0.25,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: [0, 8].includes(i),
          velocity: 105,
          probability: 0.9,
          offset: 0,
          accent: true,
        })),
      },
    ],
  },
  {
    id: 'uk-drill-hybrid',
    name: 'UK / Drill 808 Portamento Pack',
    category: 'UK/US Drill',
    color: 'from-cyan-950 to-neutral-900',
    borderColor: 'border-cyan-500/30',
    badgeColor: 'bg-cyan-500/20 text-cyan-300',
    description:
      'Sliding high-register 808 slides, ghost rimshots, triplet hi-hat ratchets, and pitched drill woo vox.',
    previewSample: 'drill_woo_vox',
    channels: [
      {
        id: 'ch-drill-808',
        name: 'Sliding Drill 808',
        sampleKey: 'sonik_808',
        pitch: 48,
        volume: 0.95,
        pan: 0,
        muted: false,
        solo: false,
        is808Channel: true,
        eight08Params: {
          mode: 'SLIDE',
          waveform: 'sine',
          glideTime: 95,
          punchAttack: 0.8,
          decay: 2.2,
          drive: 0.5,
          subBoost: 6.0,
          legato: true,
        },
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: [0, 3, 5, 8, 11, 13].includes(i),
          pitch: [5, 13].includes(i) ? 60 : 48,
          noteName: [5, 13].includes(i) ? 'C3' : 'C2',
          velocity: 115,
          probability: 1,
          offset: 0,
          accent: [0, 8].includes(i),
          slide: [5, 13].includes(i),
        })),
      },
      {
        id: 'ch-drill-snare',
        name: 'Ghost Rimshot & Drill Snare',
        sampleKey: 'rim',
        pitch: 40,
        volume: 0.9,
        pan: -0.1,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: [5, 11, 14].includes(i),
          velocity: 110,
          probability: 1,
          offset: 0,
          accent: true,
        })),
      },
      {
        id: 'ch-drill-hats',
        name: 'Triplet Hat Ratchets',
        sampleKey: 'trap_hat_triplet',
        pitch: 44,
        volume: 0.8,
        pan: 0.2,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: [2, 4, 7, 10, 12, 15].includes(i),
          velocity: 105,
          probability: 1,
          offset: 0,
          accent: [7, 15].includes(i),
        })),
      },
      {
        id: 'ch-drill-vox',
        name: 'Drill Woo Vox & Chants',
        sampleKey: 'drill_woo_vox',
        pitch: 55,
        volume: 0.88,
        pan: 0,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: [4, 12].includes(i),
          velocity: 115,
          probability: 1,
          offset: 0,
          accent: true,
        })),
      },
    ],
  },
  {
    id: 'lagos-afrotrap',
    name: 'Lagos Afro-Trap Fusion',
    category: 'Afro-Trap',
    color: 'from-amber-950 to-neutral-900',
    borderColor: 'border-amber-500/30',
    badgeColor: 'bg-amber-500/20 text-amber-300',
    description:
      'Amapiano pitched log-drum sub combined with Atlanta trap snares, Shekere shuffle, and Oya formant vocal stabs.',
    previewSample: 'afro_chant_oya',
    channels: [
      {
        id: 'ch-afro-log',
        name: 'Amapiano Sub Log Drum',
        sampleKey: 'log_drum',
        pitch: 48,
        volume: 0.95,
        pan: 0,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: [0, 3, 6, 8, 12, 14].includes(i),
          velocity: 120,
          probability: 1,
          offset: 0,
          accent: [0, 8].includes(i),
        })),
      },
      {
        id: 'ch-afro-kick',
        name: 'Lagos Punch Kick',
        sampleKey: 'kick',
        pitch: 36,
        volume: 0.95,
        pan: 0,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: [0, 4, 8, 11, 14].includes(i),
          velocity: 115,
          probability: 1,
          offset: 0,
          accent: i === 0,
        })),
      },
      {
        id: 'ch-afro-shekere',
        name: 'Shekere Shuffle Shaker',
        sampleKey: 'shaker',
        pitch: 42,
        volume: 0.75,
        pan: 0.25,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: i % 2 === 0,
          velocity: i % 4 === 2 ? 75 : 95,
          probability: 1,
          offset: 0.1,
          accent: false,
        })),
      },
      {
        id: 'ch-afro-oya',
        name: 'Oya! Vocal Formant Chant',
        sampleKey: 'afro_chant_oya',
        pitch: 52,
        volume: 0.9,
        pan: 0,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: [4, 12].includes(i),
          velocity: 115,
          probability: 1,
          offset: 0,
          accent: true,
        })),
      },
    ],
  },
  {
    id: 'street-hustle',
    name: 'Street Hustle Essentials',
    category: 'Street FX & Stabs',
    color: 'from-rose-950 to-neutral-900',
    borderColor: 'border-rose-500/30',
    badgeColor: 'bg-rose-500/20 text-rose-300',
    description:
      'Sub drop sweeps, vinyl crackle textures, laser sweeps, gun cock FX, and trap cowbells for high impact.',
    previewSample: 'trap_gun_cock',
    channels: [
      {
        id: 'ch-sub-drop',
        name: 'Deep Sub Drop',
        sampleKey: 'sub_drop',
        pitch: 36,
        volume: 0.95,
        pan: 0,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: i === 0,
          velocity: 125,
          probability: 1,
          offset: 0,
          accent: true,
        })),
      },
      {
        id: 'ch-gun-cock',
        name: 'Gun Cock FX & Clack',
        sampleKey: 'trap_gun_cock',
        pitch: 60,
        volume: 0.85,
        pan: -0.15,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: [7, 15].includes(i),
          velocity: 110,
          probability: 1,
          offset: 0,
          accent: true,
        })),
      },
      {
        id: 'ch-laser-sweep',
        name: 'Laser Riser / Sweep',
        sampleKey: 'laser_sweep',
        pitch: 65,
        volume: 0.8,
        pan: 0.25,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: i === 12,
          velocity: 110,
          probability: 1,
          offset: 0,
          accent: true,
        })),
      },
      {
        id: 'ch-trap-cowbell',
        name: 'Phonk / Trap Cowbell',
        sampleKey: 'cowbell',
        pitch: 68,
        volume: 0.88,
        pan: 0.1,
        muted: false,
        solo: false,
        steps: Array.from({ length: 16 }, (_, i) => ({
          enabled: [3, 7, 11, 15].includes(i),
          velocity: 105,
          probability: 1,
          offset: 0,
          accent: false,
        })),
      },
    ],
  },
];

export const DEFAULT_DRUM_CHANNELS: StepSequencerChannel[] = [
  {
    id: 'ch-808-sub',
    name: 'SONIK 808 Lab (Sub F#1)',
    sampleKey: 'sonik_808',
    pitch: 42,
    volume: 0.95,
    pan: 0,
    muted: false,
    solo: false,
    is808Channel: true,
    eight08Params: {
      mode: 'DEEP',
      waveform: 'sine',
      glideTime: 65,
      punchAttack: 0.85,
      decay: 1.8,
      drive: 0.35,
      subBoost: 5.0,
      legato: true,
    },
    steps: [
      {
        enabled: true,
        pitch: 42,
        noteName: 'F#1',
        velocity: 120,
        probability: 1,
        offset: 0,
        accent: true,
      },
      { enabled: false, velocity: 100, probability: 1, offset: 0, accent: false },
      { enabled: false, velocity: 100, probability: 1, offset: 0, accent: false },
      {
        enabled: true,
        pitch: 45,
        noteName: 'A1',
        velocity: 105,
        probability: 1,
        offset: 0,
        accent: false,
      },
      { enabled: false, velocity: 100, probability: 1, offset: 0, accent: false },
      { enabled: false, velocity: 100, probability: 1, offset: 0, accent: false },
      {
        enabled: true,
        pitch: 42,
        noteName: 'F#1',
        velocity: 110,
        probability: 1,
        offset: 0,
        accent: false,
      },
      { enabled: false, velocity: 100, probability: 1, offset: 0, accent: false },
      {
        enabled: true,
        pitch: 40,
        noteName: 'E1',
        velocity: 115,
        probability: 1,
        offset: 0,
        accent: true,
      },
      { enabled: false, velocity: 100, probability: 1, offset: 0, accent: false },
      { enabled: false, velocity: 100, probability: 1, offset: 0, accent: false },
      { enabled: false, velocity: 100, probability: 1, offset: 0, accent: false },
      {
        enabled: true,
        pitch: 42,
        noteName: 'F#1',
        velocity: 105,
        probability: 1,
        offset: 0,
        accent: false,
      },
      { enabled: false, velocity: 100, probability: 1, offset: 0, accent: false },
      {
        enabled: true,
        pitch: 49,
        noteName: 'C#2',
        velocity: 112,
        probability: 1,
        offset: 0,
        accent: true,
        slide: true,
      },
      { enabled: false, velocity: 100, probability: 1, offset: 0, accent: false },
    ],
  },
  {
    id: 'ch-kick',
    name: 'Kalakuta Kick',
    sampleKey: 'kick',
    pitch: 36,
    volume: 0.95,
    pan: 0,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      enabled: [0, 4, 8, 11, 14].includes(i),
      velocity: i === 0 ? 120 : 105,
      probability: 1,
      offset: 0,
      accent: i === 0,
    })),
  },
  {
    id: 'ch-snare',
    name: 'Lagos Rim / Snare',
    sampleKey: 'snare',
    pitch: 38,
    volume: 0.88,
    pan: -0.1,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      enabled: [4, 12].includes(i),
      velocity: 100,
      probability: 1,
      offset: 0,
      accent: true,
    })),
  },
  {
    id: 'ch-shaker',
    name: 'Shekere / Shaker',
    sampleKey: 'shaker',
    pitch: 42,
    volume: 0.75,
    pan: 0.25,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      enabled: i % 2 === 0,
      velocity: i % 4 === 2 ? 75 : 95,
      probability: 1,
      offset: 0.1,
      accent: false,
    })),
  },
  {
    id: 'ch-conga',
    name: 'Talking Drum & Conga',
    sampleKey: 'conga',
    pitch: 45,
    volume: 0.85,
    pan: -0.25,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      enabled: [2, 5, 9, 13].includes(i),
      velocity: 90,
      probability: 0.95,
      offset: 0.15,
      accent: false,
    })),
  },
  {
    id: 'ch-logdrum',
    name: 'Amapiano Log Drum',
    sampleKey: 'log_drum',
    pitch: 48,
    volume: 0.95,
    pan: 0,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      enabled: [0, 3, 6, 8, 12, 14].includes(i),
      velocity: 115,
      probability: 1,
      offset: 0,
      accent: [0, 8].includes(i),
    })),
  },
  {
    id: 'ch-trap-hats',
    name: 'Trap Hi-Hat & Ratchets',
    sampleKey: 'trap_hat_ratchet',
    pitch: 42,
    volume: 0.82,
    pan: 0.15,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      enabled: [2, 6, 7, 10, 14, 15].includes(i),
      velocity: [7, 15].includes(i) ? 120 : 90,
      probability: 1,
      offset: 0,
      accent: [7, 15].includes(i),
    })),
  },
  {
    id: 'ch-dark-piano',
    name: 'Dark Trap Piano & Stabs',
    sampleKey: 'dark_piano',
    pitch: 48,
    volume: 0.9,
    pan: -0.15,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      enabled: [0, 6, 12].includes(i),
      velocity: 105,
      probability: 1,
      offset: 0,
      accent: i === 0,
    })),
  },
  {
    id: 'ch-street-fx',
    name: 'Street Siren & Laser FX',
    sampleKey: 'street_siren',
    pitch: 60,
    volume: 0.85,
    pan: 0.2,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      enabled: [0, 8].includes(i),
      velocity: 100,
      probability: 0.9,
      offset: 0,
      accent: false,
    })),
  },
  {
    id: 'ch-vocalization',
    name: 'Vocalizations & Chants',
    sampleKey: 'afro_chant_oya',
    pitch: 52,
    volume: 0.92,
    pan: 0,
    muted: false,
    solo: false,
    steps: Array.from({ length: 16 }, (_, i) => ({
      enabled: [4, 12].includes(i),
      velocity: 110,
      probability: 1,
      offset: 0,
      accent: true,
    })),
  },
];

export const DEFAULT_MIDI_PATTERNS: MidiPattern[] = [
  {
    id: 'pat-bass',
    name: 'Afrofusion Bassline',
    instrumentType: 'afro_bass',
    lengthSteps: 16,
    color: '#3b82f6',
    notes: [
      {
        id: 'bn-1',
        pitch: 42,
        startStep: 0,
        durationSteps: 2,
        velocity: 110,
        probability: 1,
        channel: 0,
      },
      {
        id: 'bn-2',
        pitch: 42,
        startStep: 3,
        durationSteps: 2,
        velocity: 95,
        probability: 1,
        channel: 0,
      },
      {
        id: 'bn-3',
        pitch: 45,
        startStep: 6,
        durationSteps: 2,
        velocity: 100,
        probability: 1,
        channel: 0,
      },
      {
        id: 'bn-4',
        pitch: 40,
        startStep: 8,
        durationSteps: 3,
        velocity: 115,
        probability: 1,
        channel: 0,
      },
      {
        id: 'bn-5',
        pitch: 42,
        startStep: 12,
        durationSteps: 2,
        velocity: 105,
        probability: 1,
        channel: 0,
      },
      {
        id: 'bn-6',
        pitch: 47,
        startStep: 14,
        durationSteps: 2,
        velocity: 90,
        probability: 1,
        channel: 0,
      },
    ],
  },
  {
    id: 'pat-horns',
    name: 'Kalakuta Brass Stabs',
    instrumentType: 'horns',
    lengthSteps: 16,
    color: '#10b981',
    notes: [
      {
        id: 'hn-1',
        pitch: 54,
        startStep: 2,
        durationSteps: 2,
        velocity: 100,
        probability: 1,
        channel: 0,
      },
      {
        id: 'hn-2',
        pitch: 57,
        startStep: 2,
        durationSteps: 2,
        velocity: 95,
        probability: 1,
        channel: 0,
      },
      {
        id: 'hn-3',
        pitch: 61,
        startStep: 2,
        durationSteps: 2,
        velocity: 105,
        probability: 1,
        channel: 0,
      },
      {
        id: 'hn-4',
        pitch: 52,
        startStep: 7,
        durationSteps: 1,
        velocity: 95,
        probability: 1,
        channel: 0,
      },
      {
        id: 'hn-5',
        pitch: 56,
        startStep: 7,
        durationSteps: 1,
        velocity: 90,
        probability: 1,
        channel: 0,
      },
      {
        id: 'hn-6',
        pitch: 54,
        startStep: 10,
        durationSteps: 2,
        velocity: 110,
        probability: 1,
        channel: 0,
      },
    ],
  },
  {
    id: 'pat-lead',
    name: 'Island Synth Melody',
    instrumentType: 'synth_lead',
    lengthSteps: 16,
    color: '#f59e0b',
    notes: [
      {
        id: 'mn-1',
        pitch: 66,
        startStep: 0,
        durationSteps: 2,
        velocity: 100,
        probability: 1,
        channel: 0,
      },
      {
        id: 'mn-2',
        pitch: 69,
        startStep: 2,
        durationSteps: 2,
        velocity: 105,
        probability: 1,
        channel: 0,
      },
      {
        id: 'mn-3',
        pitch: 71,
        startStep: 4,
        durationSteps: 3,
        velocity: 110,
        probability: 1,
        channel: 0,
      },
      {
        id: 'mn-4',
        pitch: 69,
        startStep: 8,
        durationSteps: 2,
        velocity: 95,
        probability: 1,
        channel: 0,
      },
      {
        id: 'mn-5',
        pitch: 66,
        startStep: 11,
        durationSteps: 3,
        velocity: 100,
        probability: 1,
        channel: 0,
      },
      {
        id: 'mn-6',
        pitch: 64,
        startStep: 14,
        durationSteps: 2,
        velocity: 90,
        probability: 1,
        channel: 0,
      },
    ],
  },
  {
    id: 'pat-chords',
    name: 'Rhodes Soul Chords',
    instrumentType: 'rhodes',
    lengthSteps: 16,
    color: '#8b5cf6',
    notes: [
      {
        id: 'cn-1',
        pitch: 54,
        startStep: 0,
        durationSteps: 4,
        velocity: 95,
        probability: 1,
        channel: 0,
      },
      {
        id: 'cn-2',
        pitch: 57,
        startStep: 0,
        durationSteps: 4,
        velocity: 90,
        probability: 1,
        channel: 0,
      },
      {
        id: 'cn-3',
        pitch: 61,
        startStep: 0,
        durationSteps: 4,
        velocity: 92,
        probability: 1,
        channel: 0,
      },
      {
        id: 'cn-4',
        pitch: 52,
        startStep: 8,
        durationSteps: 4,
        velocity: 95,
        probability: 1,
        channel: 0,
      },
      {
        id: 'cn-5',
        pitch: 56,
        startStep: 8,
        durationSteps: 4,
        velocity: 90,
        probability: 1,
        channel: 0,
      },
      {
        id: 'cn-6',
        pitch: 59,
        startStep: 8,
        durationSteps: 4,
        velocity: 92,
        probability: 1,
        channel: 0,
      },
    ],
  },
];

export const BeatLabView: React.FC<BeatLabViewProps> = ({
  track,
  onUpdateTrack,
  onTriggerAiProducer,
}) => {
  // Ensure track has midi patterns and step channels
  const patterns: MidiPattern[] =
    track.midiPatterns && track.midiPatterns.length > 0
      ? track.midiPatterns
      : DEFAULT_MIDI_PATTERNS;

  const channels: StepSequencerChannel[] =
    track.stepChannels && track.stepChannels.length > 0
      ? track.stepChannels
      : DEFAULT_DRUM_CHANNELS;

  const [activeTab, setActiveTab] = useState<
    'step_seq' | 'piano_roll' | '808_lab' | 'drum_machine'
  >('step_seq');
  const [selectedPatternId, setSelectedPatternId] = useState<string>(patterns[0]?.id || 'pat-bass');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(soundEngine.getPlaying());
  const [isRecording, setIsRecording] = useState<boolean>(soundEngine.getRecording());
  const [activeGroove, setActiveGroove] = useState<GrooveTemplate>(GROOVE_TEMPLATES[0]);
  const [selectedPackId, setSelectedPackId] = useState<string>(TRAP_SOUND_PACKS[0].id);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>(
    'Lagos midnight club groove with heavy log drum bounce'
  );
  const [packNotification, setPackNotification] = useState<string | null>(null);

  // Synchronize with MasterTransportBridge across RecordingView and BeatLab
  useEffect(() => {
    const unsubPlay = transportBridge.subscribe('PLAY_STATE_CHANGE', (state) => {
      setIsPlaying(state.isPlaying);
      if (!state.isPlaying) {
        setCurrentStep(0);
      }
    });

    const unsubStep = transportBridge.subscribe('STEP_TICK', (state) => {
      setCurrentStep(state.currentStep);
    });

    const unsubRec = transportBridge.subscribe('RECORD_STATE_CHANGE', (state) => {
      setIsRecording(state.isRecording);
    });

    return () => {
      unsubPlay();
      unsubStep();
      unsubRec();
    };
  }, []);

  // Keep soundEngine synced with active patterns
  useEffect(() => {
    soundEngine.setActivePatterns(patterns, channels);
  }, [patterns, channels]);

  const handleUpdateStepChannels = (updatedChannels: StepSequencerChannel[]) => {
    onUpdateTrack({
      ...track,
      stepChannels: updatedChannels,
    });
  };

  // Instant Load Trap Sound Pack
  const handleLoadSoundPack = (pack: (typeof TRAP_SOUND_PACKS)[0]) => {
    setSelectedPackId(pack.id);
    handleUpdateStepChannels(pack.channels as StepSequencerChannel[]);
    setPackNotification(`Loaded "${pack.name}"!`);
    setTimeout(() => setPackNotification(null), 2500);
  };

  const handleAuditionSample = (sampleKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    midiSynth.playDrumSample(sampleKey, 115);
  };

  const handleUpdateMidiPattern = (updatedPattern: MidiPattern) => {
    const updated = patterns.map((p) => (p.id === updatedPattern.id ? updatedPattern : p));
    onUpdateTrack({
      ...track,
      midiPatterns: updated,
    });
  };

  const selectedPattern = patterns.find((p) => p.id === selectedPatternId) || patterns[0];

  // AI Producer Generator Trigger
  const handleGenerateAiPattern = async (target: 'drums' | 'bass' | 'melody' | 'chords') => {
    setIsAiGenerating(true);
    try {
      if (target === 'drums') {
        // Deterministic Afrofusion generation
        const generatedChannels = channels.map((ch) => {
          const newSteps = Array.from({ length: 16 }, (_, i) => ({
            enabled: false,
            velocity: 100,
            probability: 1,
            offset: 0,
            accent: false,
          }));

          if (ch.sampleKey === 'kick') {
            [0, 3, 8, 11, 14].forEach(
              (s) =>
                (newSteps[s] = {
                  enabled: true,
                  velocity: 118,
                  probability: 1,
                  offset: 0,
                  accent: s === 0,
                })
            );
          } else if (ch.sampleKey === 'snare') {
            [4, 12].forEach(
              (s) =>
                (newSteps[s] = {
                  enabled: true,
                  velocity: 105,
                  probability: 1,
                  offset: 0,
                  accent: true,
                })
            );
          } else if (ch.sampleKey === 'shaker') {
            Array.from({ length: 16 }, (_, i) => i).forEach(
              (s) =>
                (newSteps[s] = {
                  enabled: true,
                  velocity: s % 2 === 1 ? 95 : 60,
                  probability: 1,
                  offset: 0.12,
                  accent: false,
                })
            );
          } else if (ch.sampleKey === 'log_drum') {
            [2, 5, 7, 10, 13, 15].forEach(
              (s) =>
                (newSteps[s] = {
                  enabled: true,
                  velocity: 120,
                  probability: 1,
                  offset: 0.05,
                  accent: true,
                })
            );
          } else if (ch.sampleKey === 'conga') {
            [1, 6, 9, 13].forEach(
              (s) =>
                (newSteps[s] = {
                  enabled: true,
                  velocity: 90,
                  probability: 0.9,
                  offset: 0.1,
                  accent: false,
                })
            );
          }

          return { ...ch, steps: newSteps };
        });

        handleUpdateStepChannels(generatedChannels);
      } else if (target === 'bass') {
        const generatedBass: MidiPattern = {
          ...selectedPattern,
          notes: [
            {
              id: `bn-${Date.now()}-1`,
              pitch: 42,
              startStep: 0,
              durationSteps: 2,
              velocity: 115,
              probability: 1,
              channel: 0,
            },
            {
              id: `bn-${Date.now()}-2`,
              pitch: 45,
              startStep: 3,
              durationSteps: 2,
              velocity: 100,
              probability: 1,
              channel: 0,
            },
            {
              id: `bn-${Date.now()}-3`,
              pitch: 47,
              startStep: 6,
              durationSteps: 2,
              velocity: 110,
              probability: 1,
              channel: 0,
            },
            {
              id: `bn-${Date.now()}-4`,
              pitch: 40,
              startStep: 8,
              durationSteps: 3,
              velocity: 120,
              probability: 1,
              channel: 0,
            },
            {
              id: `bn-${Date.now()}-5`,
              pitch: 42,
              startStep: 12,
              durationSteps: 2,
              velocity: 105,
              probability: 1,
              channel: 0,
            },
            {
              id: `bn-${Date.now()}-6`,
              pitch: 49,
              startStep: 14,
              durationSteps: 2,
              velocity: 95,
              probability: 1,
              channel: 0,
            },
          ],
        };
        handleUpdateMidiPattern(generatedBass);
      } else if (target === 'melody') {
        const generatedMelody: MidiPattern = {
          ...selectedPattern,
          notes: [
            {
              id: `mn-${Date.now()}-1`,
              pitch: 66,
              startStep: 0,
              durationSteps: 2,
              velocity: 105,
              probability: 1,
              channel: 0,
            },
            {
              id: `mn-${Date.now()}-2`,
              pitch: 71,
              startStep: 2,
              durationSteps: 2,
              velocity: 110,
              probability: 1,
              channel: 0,
            },
            {
              id: `mn-${Date.now()}-3`,
              pitch: 69,
              startStep: 5,
              durationSteps: 3,
              velocity: 95,
              probability: 1,
              channel: 0,
            },
            {
              id: `mn-${Date.now()}-4`,
              pitch: 74,
              startStep: 8,
              durationSteps: 2,
              velocity: 115,
              probability: 1,
              channel: 0,
            },
            {
              id: `mn-${Date.now()}-5`,
              pitch: 71,
              startStep: 11,
              durationSteps: 3,
              velocity: 100,
              probability: 1,
              channel: 0,
            },
            {
              id: `mn-${Date.now()}-6`,
              pitch: 66,
              startStep: 14,
              durationSteps: 2,
              velocity: 90,
              probability: 1,
              channel: 0,
            },
          ],
        };
        handleUpdateMidiPattern(generatedMelody);
      }

      if (onTriggerAiProducer) {
        await onTriggerAiProducer({
          target,
          prompt: aiPrompt,
          style: 'Afrofusion',
          bpm: track.bpm,
          key: track.key,
          scale: 'Natural Minor',
          energyLevel: 8,
          complexity: 7,
        });
      }
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Mutate active pattern
  const handleMutatePattern = () => {
    if (activeTab === 'step_seq') {
      const mutated = channels.map((ch) => ({
        ...ch,
        steps: ch.steps.map((s, idx) => ({
          ...s,
          enabled: idx % 4 === 0 ? s.enabled : Math.random() > 0.65 ? !s.enabled : s.enabled,
          velocity: Math.max(40, Math.min(127, s.velocity + (Math.floor(Math.random() * 20) - 10))),
        })),
      }));
      handleUpdateStepChannels(mutated);
    } else {
      const humanized = MidiQuantizer.humanize(selectedPattern.notes, activeGroove, Date.now());
      handleUpdateMidiPattern({ ...selectedPattern, notes: humanized });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 sm:p-6 text-neutral-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-950 to-amber-950/40 p-6 rounded-2xl border border-amber-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              3WM Sonik Producer Engine
            </span>
            <span className="text-xs text-neutral-400 font-mono">v2.2 Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Layers className="w-7 h-7 text-amber-400" />
            <span>Afrofusion Beat Lab</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-none">
            Create authentic Lagos rhythms, log drum grooves, and multi-track MIDI patterns with AI
            copilot assistance.
          </p>
        </div>

        {/* Global Beat Lab Stats & Master Play */}
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-mono font-bold animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>RECORDING LINKED</span>
            </div>
          )}

          <div className="flex flex-col items-end pr-3 border-r border-neutral-800">
            <span className="text-[11px] text-neutral-400">Tempo & Key</span>
            <span className="font-mono text-sm font-bold text-amber-400">
              {track.bpm} BPM • {track.key}
            </span>
          </div>

          <button
            onClick={() => {
              if (soundEngine.getPlaying()) {
                soundEngine.stopPlayback();
              } else {
                soundEngine.startPlayback();
              }
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                : 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play Loop</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dedicated Trap & 808 Sound Packs Library Strip */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-neutral-100 uppercase tracking-tight">
              Trap & Urban Sound Library Engine
            </h3>
            <span className="text-[10px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-neutral-800">
              4 Signature Kits • Instant Hot-Swap
            </span>
          </div>

          {packNotification && (
            <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30 animate-in fade-in">
              {packNotification}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TRAP_SOUND_PACKS.map((pack) => {
            const isLoaded = selectedPackId === pack.id;
            return (
              <div
                key={pack.id}
                onClick={() => handleLoadSoundPack(pack)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                  isLoaded
                    ? `bg-gradient-to-b ${pack.color} ${pack.borderColor} ring-1 ring-white/20 shadow-lg`
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${pack.badgeColor}`}
                    >
                      {pack.category}
                    </span>
                    <button
                      onClick={(e) => handleAuditionSample(pack.previewSample, e)}
                      className="p-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                      title="Audition Sample"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-neutral-100 mb-1">{pack.name}</h4>
                  <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2">
                    {pack.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono text-neutral-400">
                    {pack.channels.length} Channels
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadSoundPack(pack);
                    }}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                      isLoaded
                        ? 'bg-amber-400 text-black font-black'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                    }`}
                  >
                    {isLoaded ? 'ACTIVE KIT' : 'LOAD KIT'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SONIK AI Producer Copilot Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 backdrop-blur-md">
        <div className="flex items-center gap-2 flex-grow">
          <Bot className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Instruct SONIK AI Producer (e.g., 'Heavy Amapiano log drum fill with fast hi-hat rolls')..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleGenerateAiPattern('drums')}
            disabled={isAiGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-lg text-xs font-semibold border border-neutral-700 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Drummer</span>
          </button>

          <button
            onClick={() => handleGenerateAiPattern('bass')}
            disabled={isAiGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-blue-300 rounded-lg text-xs font-semibold border border-neutral-700 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Bassist</span>
          </button>

          <button
            onClick={() => handleGenerateAiPattern('melody')}
            disabled={isAiGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 rounded-lg text-xs font-semibold border border-neutral-700 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Melodist</span>
          </button>

          <button
            onClick={handleMutatePattern}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-semibold border border-amber-500/30 transition-colors"
            title="Mutate current groove pattern while preserving core rhythm"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Mutate</span>
          </button>
        </div>
      </div>

      {/* Editor Mode Selector: Step Sequencer vs Piano Roll vs 808 Lab vs Trap Drum Machine */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('step_seq')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'step_seq'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Step Sequencer</span>
          </button>

          <button
            onClick={() => setActiveTab('piano_roll')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'piano_roll'
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Piano Roll</span>
          </button>

          <button
            onClick={() => setActiveTab('808_lab')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === '808_lab'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>SONIK 808 Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('drum_machine')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'drum_machine'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-rose-400" />
            <span>Trap Drum Machine</span>
          </button>
        </div>

        {/* Active Pattern Selector for Piano Roll */}
        {activeTab === 'piano_roll' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Active Pattern:</span>
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
              {patterns.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatternId(p.id)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedPatternId === p.id
                      ? 'bg-amber-400 text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <AiSuggestionBanner activeTab={activeTab} />
      {/* Active Editor Panel */}
      {activeTab === 'step_seq' ? (
        <StepSequencer
          channels={channels}
          onUpdateChannels={handleUpdateStepChannels}
          currentPlaybackStep={currentStep}
          totalSteps={16}
          onOpen808Lab={() => setActiveTab('808_lab')}
        />
      ) : activeTab === 'piano_roll' ? (
        <PianoRoll
          pattern={selectedPattern}
          onUpdatePattern={handleUpdateMidiPattern}
          currentPlaybackStep={currentStep}
          keyRoot={track.key.split(' ')[0] || 'F#'}
          scaleName="Natural Minor"
        />
      ) : activeTab === '808_lab' ? (
        <Eight08LabPlugin />
      ) : (
        <TrapDrumMachinePlugin />
      )}

      {/* Rhythm DNA & Groove Template Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-neutral-950 rounded-xl border border-neutral-800/80">
        {GROOVE_TEMPLATES.map((gt) => {
          const isSelected = activeGroove.id === gt.id;
          return (
            <div
              key={gt.id}
              onClick={() => setActiveGroove(gt)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                  : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-neutral-200">{gt.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-amber-300">
                  {gt.genre}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-snug">{gt.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-neutral-400">
                <span>Swing: {Math.round(gt.swing * 100)}%</span>
                <span>Humanize: {Math.round(gt.humanizeTiming * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
