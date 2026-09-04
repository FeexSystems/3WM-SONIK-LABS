// 3WM SONIK — Modern Urban Plugin System & DSP Engine (v1.0)
// Instruments: 808 Lab, Trap Drum Machine, Kick Lab, Snare Lab, Hat Lab, Cowbell X, Synth Lab, Dark Piano
// Effects: Sonik EQ, Sonik Comp, Sonik Color, Sonik Grit, Sonik Clip, Sonik Limit, Sonik Delay, Sonik Space, Sonik Ducker, Vocal Doubler, De-Esser
// Analysis: Sonik Analyzer, Sub Check (20-200Hz), Stereo Check

import {
  PluginDefinition,
  PluginInstance,
  PluginPreset,
  Eight08Parameters,
  TrapDrumPadParameters,
  SynthLabParameters,
} from '../types';

// ============================================================================
// 1. BUILT-IN PLUGIN DEFINITIONS & PRESET REGISTRY
// ============================================================================

export const PLUGIN_REGISTRY: Record<string, PluginDefinition> = {
  // --------------------------------------------------------------------------
  // 1. 808 LAB
  // --------------------------------------------------------------------------
  '808-lab': {
    id: '808-lab',
    name: 'SONIK 808 LAB',
    version: '1.0.0',
    manufacturer: '3WM SONIK',
    category: 'INSTRUMENT',
    description:
      'Modern Trap, Drill & Afrofusion 808 synthesizer with pitch glide, custom saturation, and sub-boost.',
    iconName: 'Zap',
    parameters: [
      {
        id: 'mode',
        name: '808 Mode',
        type: 'enum',
        min: 0,
        max: 9,
        default: 'DEEP',
        options: [
          'DEEP',
          'PUNCH',
          'DIRTY',
          'DISTORTED',
          'SUB',
          'METALLIC',
          'GROWL',
          'BELL',
          'LONG',
          'SHORT',
        ],
      },
      {
        id: 'waveform',
        name: 'Waveform',
        type: 'enum',
        min: 0,
        max: 4,
        default: 'sine',
        options: ['sine', 'triangle', 'sawtooth', 'fm_sine', 'sub_distort'],
      },
      {
        id: 'glideTime',
        name: 'Glide Time (ms)',
        type: 'float',
        min: 0,
        max: 500,
        default: 85,
        unit: 'ms',
        automatable: true,
      },
      {
        id: 'glideCurve',
        name: 'Glide Curve',
        type: 'enum',
        min: 0,
        max: 1,
        default: 'exponential',
        options: ['exponential', 'linear'],
      },
      { id: 'legato', name: 'Legato Mode', type: 'bool', min: 0, max: 1, default: true },
      {
        id: 'punchAttack',
        name: 'Punch Attack',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.75,
        unit: '%',
        automatable: true,
      },
      {
        id: 'decay',
        name: 'Decay',
        type: 'float',
        min: 0.1,
        max: 4.0,
        default: 1.8,
        unit: 's',
        automatable: true,
      },
      {
        id: 'sustain',
        name: 'Sustain',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.45,
        unit: '%',
        automatable: true,
      },
      {
        id: 'release',
        name: 'Release',
        type: 'float',
        min: 0.01,
        max: 2.0,
        default: 0.25,
        unit: 's',
        automatable: true,
      },
      {
        id: 'saturationMode',
        name: 'Saturation',
        type: 'enum',
        min: 0,
        max: 7,
        default: 'Tape',
        options: ['Soft', 'Warm', 'Tape', 'Tube', 'Hard', 'Fold', 'Bitcrush', 'Destroy'],
      },
      {
        id: 'drive',
        name: 'Drive / Dirt',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.42,
        unit: '%',
        automatable: true,
      },
      {
        id: 'subBoost',
        name: 'Sub Boost (45Hz)',
        type: 'float',
        min: 0,
        max: 12,
        default: 3.5,
        unit: 'dB',
        automatable: true,
      },
      {
        id: 'harmonicLevel',
        name: 'Harmonics',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.35,
        unit: '%',
        automatable: true,
      },
      {
        id: 'filterCutoff',
        name: 'Cutoff',
        type: 'float',
        min: 40,
        max: 12000,
        default: 4500,
        unit: 'Hz',
        automatable: true,
      },
      {
        id: 'filterResonance',
        name: 'Resonance',
        type: 'float',
        min: 0,
        max: 10,
        default: 1.5,
        unit: 'Q',
        automatable: true,
      },
      { id: 'monoRetrigger', name: 'Mono Retrigger', type: 'bool', min: 0, max: 1, default: true },
      { id: 'scaleLock', name: 'Scale / Key Lock', type: 'bool', min: 0, max: 1, default: true },
    ],
    presets: [
      {
        id: '808-sub-king',
        pluginId: '808-lab',
        name: 'SUB KING (Atlanta Trap)',
        category: 'TRAP',
        version: 1,
        description:
          'Deep, clean sine sub with punchy attack for modern Atlanta trap (Metro & Future style).',
        parameters: {
          mode: 'DEEP',
          waveform: 'sine',
          glideTime: 65,
          punchAttack: 0.85,
          decay: 1.6,
          sustain: 0.5,
          release: 0.2,
          saturationMode: 'Warm',
          drive: 0.28,
          subBoost: 4.5,
          harmonicLevel: 0.2,
          filterCutoff: 5000,
          filterResonance: 1.2,
          legato: true,
          monoRetrigger: true,
          scaleLock: true,
        },
      },
      {
        id: '808-dark-memphis',
        pluginId: '808-lab',
        name: 'DARK MEMPHIS GRIT (Drill)',
        category: 'DRILL',
        version: 1,
        description: 'Hard distorted 808 with gritty mid harmonics and long portamento slides.',
        parameters: {
          mode: 'DISTORTED',
          waveform: 'fm_sine',
          glideTime: 120,
          punchAttack: 0.95,
          decay: 2.2,
          sustain: 0.65,
          release: 0.35,
          saturationMode: 'Tube',
          drive: 0.78,
          subBoost: 6.0,
          harmonicLevel: 0.65,
          filterCutoff: 6500,
          filterResonance: 3.5,
          legato: true,
          monoRetrigger: true,
          scaleLock: true,
        },
      },
      {
        id: '808-uk-drill-slide',
        pluginId: '808-lab',
        name: 'UK DRILL SLIDE BEAST',
        category: 'DRILL',
        version: 1,
        description:
          'Instant aggressive attack with fast octave slide response and punchy tape compression.',
        parameters: {
          mode: 'DISTORTED',
          waveform: 'sawtooth',
          glideTime: 140,
          punchAttack: 0.92,
          decay: 2.0,
          sustain: 0.6,
          release: 0.3,
          saturationMode: 'Tape',
          drive: 0.72,
          subBoost: 5.5,
          harmonicLevel: 0.7,
          filterCutoff: 7200,
          filterResonance: 3.0,
          legato: true,
          monoRetrigger: true,
          scaleLock: true,
        },
      },
      {
        id: '808-lagos-bounce',
        pluginId: '808-lab',
        name: 'LAGOS LOG 808 (Afrofusion)',
        category: 'AFROFUSION',
        version: 1,
        description:
          'Hybrid Amapiano wood click transient blended with deep sub sustain for Afrobeat bounces.',
        parameters: {
          mode: 'PUNCH',
          waveform: 'triangle',
          glideTime: 45,
          punchAttack: 1.0,
          decay: 1.2,
          sustain: 0.3,
          release: 0.15,
          saturationMode: 'Tape',
          drive: 0.35,
          subBoost: 5.0,
          harmonicLevel: 0.45,
          filterCutoff: 3800,
          filterResonance: 2.0,
          legato: false,
          monoRetrigger: true,
          scaleLock: true,
        },
      },
      {
        id: '808-amapiano-rumble',
        pluginId: '808-lab',
        name: 'SOWETO SUB LOG RUMBLE',
        category: 'AMAPIANO',
        version: 1,
        description:
          'Heavy pitch-swept wood transient dropping into an ultra-low 38Hz resonant bass.',
        parameters: {
          mode: 'SUB',
          waveform: 'sine',
          glideTime: 55,
          punchAttack: 0.9,
          decay: 1.8,
          sustain: 0.55,
          release: 0.25,
          saturationMode: 'Warm',
          drive: 0.4,
          subBoost: 7.5,
          harmonicLevel: 0.3,
          filterCutoff: 3200,
          filterResonance: 2.8,
          legato: true,
          monoRetrigger: true,
          scaleLock: true,
        },
      },
      {
        id: '808-tokyo-phonk',
        pluginId: '808-lab',
        name: 'TOKYO PHONK DRIFT',
        category: 'PHONK',
        version: 1,
        description:
          'Gritty distorted 808 tailored for cowbell phonk grooves and low octave drift.',
        parameters: {
          mode: 'DIRTY',
          waveform: 'sub_distort',
          glideTime: 80,
          punchAttack: 0.88,
          decay: 2.4,
          sustain: 0.75,
          release: 0.3,
          saturationMode: 'Bitcrush',
          drive: 0.82,
          subBoost: 6.5,
          harmonicLevel: 0.8,
          filterCutoff: 8000,
          filterResonance: 4.0,
          legato: true,
          monoRetrigger: true,
          scaleLock: true,
        },
      },
      {
        id: '808-rage-growl',
        pluginId: '808-lab',
        name: 'RAGE GROWLER (Hyperpop)',
        category: 'RAGE',
        version: 1,
        description:
          'Aggressive wavefolded 808 with searing high-end presence (Carti & Yeat style).',
        parameters: {
          mode: 'GROWL',
          waveform: 'sub_distort',
          glideTime: 90,
          punchAttack: 0.8,
          decay: 2.5,
          sustain: 0.7,
          release: 0.4,
          saturationMode: 'Fold',
          drive: 0.88,
          subBoost: 7.0,
          harmonicLevel: 0.85,
          filterCutoff: 9000,
          filterResonance: 4.5,
          legato: true,
          monoRetrigger: true,
          scaleLock: true,
        },
      },
      {
        id: '808-miami-rumble',
        pluginId: '808-lab',
        name: 'MIAMI 808 RUMBLE',
        category: 'TRAP',
        version: 1,
        description: 'Massive club-shaking 35Hz sub frequency focus with warm harmonic ceiling.',
        parameters: {
          mode: 'SUB',
          waveform: 'sine',
          glideTime: 50,
          punchAttack: 0.7,
          decay: 2.8,
          sustain: 0.8,
          release: 0.4,
          saturationMode: 'Warm',
          drive: 0.35,
          subBoost: 8.5,
          harmonicLevel: 0.25,
          filterCutoff: 3600,
          filterResonance: 1.5,
          legato: true,
          monoRetrigger: true,
          scaleLock: true,
        },
      },
      {
        id: '808-short-punch',
        pluginId: '808-lab',
        name: 'TIGHT PUNCH 808 (Boom Bap)',
        category: 'BOOM BAP',
        version: 1,
        description: 'Short, controlled decay for fast tempo hip-hop and chopping classic samples.',
        parameters: {
          mode: 'SHORT',
          waveform: 'sine',
          glideTime: 25,
          punchAttack: 0.95,
          decay: 0.8,
          sustain: 0.2,
          release: 0.1,
          saturationMode: 'Soft',
          drive: 0.3,
          subBoost: 3.5,
          harmonicLevel: 0.25,
          filterCutoff: 3000,
          filterResonance: 1.0,
          legato: false,
          monoRetrigger: true,
          scaleLock: true,
        },
      },
      {
        id: '808-smooth-rnb',
        pluginId: '808-lab',
        name: 'SMOOTH R&B 808 SUB',
        category: 'RNB',
        version: 1,
        description: 'Velvety round sub with soft transient and lush sustained low-end bed.',
        parameters: {
          mode: 'DEEP',
          waveform: 'sine',
          glideTime: 110,
          punchAttack: 0.5,
          decay: 2.2,
          sustain: 0.6,
          release: 0.45,
          saturationMode: 'Soft',
          drive: 0.18,
          subBoost: 4.0,
          harmonicLevel: 0.15,
          filterCutoff: 2800,
          filterResonance: 0.8,
          legato: true,
          monoRetrigger: true,
          scaleLock: true,
        },
      },
      {
        id: '808-pluggnb-dream',
        pluginId: '808-lab',
        name: 'PLUGGNB DREAM 808',
        category: 'TRAP',
        version: 1,
        description:
          'Airy, melodic 808 with rounded top-end and extended decay for floating chords.',
        parameters: {
          mode: 'LONG',
          waveform: 'triangle',
          glideTime: 75,
          punchAttack: 0.65,
          decay: 3.0,
          sustain: 0.65,
          release: 0.5,
          saturationMode: 'Warm',
          drive: 0.28,
          subBoost: 5.0,
          harmonicLevel: 0.35,
          filterCutoff: 4200,
          filterResonance: 1.8,
          legato: true,
          monoRetrigger: true,
          scaleLock: true,
        },
      },
      {
        id: '808-detroit-knock',
        pluginId: '808-lab',
        name: 'DETROIT KNOCK 808',
        category: 'TRAP',
        version: 1,
        description: 'Knocking top punch with short release for rapid rolling 16th-note baselines.',
        parameters: {
          mode: 'PUNCH',
          waveform: 'fm_sine',
          glideTime: 35,
          punchAttack: 1.0,
          decay: 1.1,
          sustain: 0.25,
          release: 0.12,
          saturationMode: 'Hard',
          drive: 0.65,
          subBoost: 4.5,
          harmonicLevel: 0.55,
          filterCutoff: 5800,
          filterResonance: 2.2,
          legato: false,
          monoRetrigger: true,
          scaleLock: true,
        },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 2. TRAP DRUM MACHINE
  // --------------------------------------------------------------------------
  'trap-drum-machine': {
    id: 'trap-drum-machine',
    name: 'SONIK TRAP DRUM MACHINE',
    version: '1.0.0',
    manufacturer: '3WM SONIK',
    category: 'INSTRUMENT',
    description:
      '13-Channel urban drum machine with ratchet rolls (2x-8x), micro-timing humanization, and individual choke groups.',
    iconName: 'Layers',
    parameters: [
      {
        id: 'masterVolume',
        name: 'Master Volume',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.9,
        unit: '%',
      },
      {
        id: 'swing',
        name: 'Trap Swing',
        type: 'float',
        min: 0,
        max: 0.5,
        default: 0.15,
        unit: '%',
      },
      {
        id: 'globalPitch',
        name: 'Global Tuning',
        type: 'int',
        min: -12,
        max: 12,
        default: 0,
        unit: 'st',
      },
      {
        id: 'hatRollRate',
        name: 'Hi-Hat Roll Rate',
        type: 'enum',
        min: 0,
        max: 5,
        default: '4x',
        options: ['1x', '2x', '3x', '4x', '6x', '8x'],
      },
      {
        id: 'snareSnap',
        name: 'Snare Snap / Transient',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.75,
        unit: '%',
      },
      {
        id: 'kickSubPunch',
        name: 'Kick Sub Punch',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.8,
        unit: '%',
      },
    ],
    presets: [
      {
        id: 'trap-kit-atlanta',
        pluginId: 'trap-drum-machine',
        name: 'ATLANTA NIGHT TRAP',
        category: 'TRAP',
        version: 1,
        description: 'Crisp 808 kick, tight clap, sizzling rolling hats and hollow rim.',
        parameters: {
          masterVolume: 0.92,
          swing: 0.16,
          globalPitch: 0,
          hatRollRate: '4x',
          snareSnap: 0.85,
          kickSubPunch: 0.9,
        },
      },
      {
        id: 'trap-kit-drill',
        pluginId: 'trap-drum-machine',
        name: 'UK / NY DRILL PUNCH',
        category: 'DRILL',
        version: 1,
        description: 'Stuttering triplet hats, heavy punch kick, and metallic rimshot.',
        parameters: {
          masterVolume: 0.95,
          swing: 0.22,
          globalPitch: -1,
          hatRollRate: '6x',
          snareSnap: 0.9,
          kickSubPunch: 0.95,
        },
      },
      {
        id: 'trap-kit-afrotrap',
        pluginId: 'trap-drum-machine',
        name: 'LAGOS AFROTRAP BOUNCE',
        category: 'AFROFUSION',
        version: 1,
        description: 'Shekere hi-hat textures with syncopated conga and punchy Afrobeat claps.',
        parameters: {
          masterVolume: 0.9,
          swing: 0.2,
          globalPitch: 0,
          hatRollRate: '3x',
          snareSnap: 0.78,
          kickSubPunch: 0.85,
        },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 3. DARK PIANO & RAP KEYS
  // --------------------------------------------------------------------------
  'dark-piano': {
    id: 'dark-piano',
    name: 'SONIK DARK PIANO',
    version: '1.0.0',
    manufacturer: '3WM SONIK',
    category: 'INSTRUMENT',
    description:
      'Cinematic felt piano with tape degradation, dark room resonance, and vintage Rhodes soul modeling.',
    iconName: 'Music',
    parameters: [
      {
        id: 'tone',
        name: 'Tone / Darkness',
        type: 'float',
        min: 200,
        max: 10000,
        default: 2200,
        unit: 'Hz',
        automatable: true,
      },
      {
        id: 'feltDamping',
        name: 'Felt Damping',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.65,
        unit: '%',
      },
      {
        id: 'tapeWarmth',
        name: 'Tape Saturation',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.45,
        unit: '%',
      },
      {
        id: 'mechanicalNoise',
        name: 'Hammer Noise',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.3,
        unit: '%',
      },
      {
        id: 'roomReverb',
        name: 'Dark Room Reverb',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.38,
        unit: '%',
      },
      {
        id: 'stereoSpread',
        name: 'Stereo Width',
        type: 'float',
        min: 0,
        max: 2,
        default: 1.2,
        unit: 'x',
      },
    ],
    presets: [
      {
        id: 'piano-dark-room',
        pluginId: 'dark-piano',
        name: 'MIDNIGHT TRAP NOIR',
        category: 'TRAP',
        version: 1,
        description: 'Muffled, atmospheric low-passed piano for emotional trap melodies.',
        parameters: {
          tone: 1800,
          feltDamping: 0.75,
          tapeWarmth: 0.5,
          mechanicalNoise: 0.35,
          roomReverb: 0.45,
          stereoSpread: 1.3,
        },
      },
      {
        id: 'piano-vintage-rhodes',
        pluginId: 'dark-piano',
        name: 'LAGOS SOUL RHODES',
        category: 'AFRO-R&B',
        version: 1,
        description: 'Warm electric piano with lush bell harmonics and gentle tremolo.',
        parameters: {
          tone: 4200,
          feltDamping: 0.3,
          tapeWarmth: 0.35,
          mechanicalNoise: 0.2,
          roomReverb: 0.3,
          stereoSpread: 1.4,
        },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 4. COWBELL X (Memphis / 808 Synth)
  // --------------------------------------------------------------------------
  'cowbell-x': {
    id: 'cowbell-x',
    name: 'SONIK COWBELL X',
    version: '1.0.0',
    manufacturer: '3WM SONIK',
    category: 'INSTRUMENT',
    description:
      'Iconic dual-oscillator 808 and Memphis phonk cowbell synthesizer with bandpass drive.',
    iconName: 'Flame',
    parameters: [
      { id: 'pitch', name: 'Root Pitch', type: 'int', min: 36, max: 84, default: 68, unit: 'MIDI' },
      {
        id: 'decay',
        name: 'Decay Time',
        type: 'float',
        min: 0.05,
        max: 1.5,
        default: 0.35,
        unit: 's',
      },
      {
        id: 'metallic',
        name: 'Metallic Ring',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.7,
        unit: '%',
      },
      { id: 'drive', name: 'Overdrive', type: 'float', min: 0, max: 1, default: 0.55, unit: '%' },
      {
        id: 'bandpassFreq',
        name: 'Bandpass Filter',
        type: 'float',
        min: 400,
        max: 6000,
        default: 1600,
        unit: 'Hz',
      },
    ],
    presets: [
      {
        id: 'cowbell-808-classic',
        pluginId: 'cowbell-x',
        name: 'CLASSIC TRAP 808 BELL',
        category: 'TRAP',
        version: 1,
        description: 'Authentic 808 analog cowbell tone.',
        parameters: { pitch: 68, decay: 0.32, metallic: 0.65, drive: 0.4, bandpassFreq: 1550 },
      },
      {
        id: 'cowbell-phonk-drift',
        pluginId: 'cowbell-x',
        name: 'MEMPHIS DRIFT PHONK',
        category: 'PHONK',
        version: 1,
        description: 'Heavily driven metallic cowbell lead for dark phonk melodies.',
        parameters: { pitch: 72, decay: 0.45, metallic: 0.85, drive: 0.85, bandpassFreq: 2200 },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 5. SONIK EQ (5-Band Studio Equalizer)
  // --------------------------------------------------------------------------
  'sonik-eq': {
    id: 'sonik-eq',
    name: 'SONIK 5-BAND STUDIO EQ',
    version: '1.0.0',
    manufacturer: '3WM SONIK',
    category: 'EFFECT',
    description:
      'Precision parametric equalizer with high-pass, low-shelf, dual mid bells, high-shelf, and real-time spectrum curves.',
    iconName: 'Sliders',
    parameters: [
      {
        id: 'hpf',
        name: 'High-Pass Filter',
        type: 'float',
        min: 20,
        max: 500,
        default: 30,
        unit: 'Hz',
        automatable: true,
      },
      {
        id: 'lowGain',
        name: 'Low Shelf Gain',
        type: 'float',
        min: -15,
        max: 15,
        default: 1.5,
        unit: 'dB',
        automatable: true,
      },
      {
        id: 'lowFreq',
        name: 'Low Shelf Freq',
        type: 'float',
        min: 40,
        max: 350,
        default: 100,
        unit: 'Hz',
      },
      {
        id: 'midGain',
        name: 'Mid Bell Gain',
        type: 'float',
        min: -15,
        max: 15,
        default: -1.0,
        unit: 'dB',
        automatable: true,
      },
      {
        id: 'midFreq',
        name: 'Mid Bell Freq',
        type: 'float',
        min: 250,
        max: 4000,
        default: 1200,
        unit: 'Hz',
      },
      { id: 'midQ', name: 'Mid Q', type: 'float', min: 0.2, max: 8.0, default: 1.2, unit: 'Q' },
      {
        id: 'highGain',
        name: 'High Shelf Gain',
        type: 'float',
        min: -15,
        max: 15,
        default: 2.0,
        unit: 'dB',
        automatable: true,
      },
      {
        id: 'highFreq',
        name: 'High Shelf Freq',
        type: 'float',
        min: 4000,
        max: 18000,
        default: 9500,
        unit: 'Hz',
      },
    ],
    presets: [
      {
        id: 'eq-clean-808',
        pluginId: 'sonik-eq',
        name: '808 LOW END CARVER',
        category: '808',
        version: 1,
        description: 'Rolls off sub-rumble below 28Hz and clears muddy boxy frequencies at 300Hz.',
        parameters: {
          hpf: 28,
          lowGain: 3.5,
          lowFreq: 60,
          midGain: -3.5,
          midFreq: 320,
          midQ: 1.8,
          highGain: -6.0,
          highFreq: 7000,
        },
      },
      {
        id: 'eq-air-vocal',
        pluginId: 'sonik-eq',
        name: 'MODERN RAP VOCAL AIR',
        category: 'VOCAL',
        version: 1,
        description: 'Cuts low plosives and injects 10kHz silk sheen for radio presence.',
        parameters: {
          hpf: 110,
          lowGain: -2.0,
          lowFreq: 220,
          midGain: 1.5,
          midFreq: 3400,
          midQ: 1.0,
          highGain: 4.5,
          highFreq: 10500,
        },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 6. SONIK COMP (Studio Dynamics Compressor)
  // --------------------------------------------------------------------------
  'sonik-comp': {
    id: 'sonik-comp',
    name: 'SONIK DYNAMICS COMP',
    version: '1.0.0',
    manufacturer: '3WM SONIK',
    category: 'EFFECT',
    description:
      'VCA, FET, and Punch studio compressor with gain reduction metering and dry/wet parallel blend.',
    iconName: 'Sliders',
    parameters: [
      {
        id: 'mode',
        name: 'Comp Mode',
        type: 'enum',
        min: 0,
        max: 3,
        default: 'PUNCH',
        options: ['VCA', 'FET', 'BUS', 'PUNCH'],
      },
      {
        id: 'threshold',
        name: 'Threshold',
        type: 'float',
        min: -40,
        max: 0,
        default: -18,
        unit: 'dB',
        automatable: true,
      },
      {
        id: 'ratio',
        name: 'Ratio',
        type: 'float',
        min: 1.5,
        max: 20,
        default: 4.0,
        unit: ':1',
        automatable: true,
      },
      {
        id: 'attack',
        name: 'Attack',
        type: 'float',
        min: 0.001,
        max: 0.1,
        default: 0.02,
        unit: 's',
        automatable: true,
      },
      {
        id: 'release',
        name: 'Release',
        type: 'float',
        min: 0.01,
        max: 1.0,
        default: 0.12,
        unit: 's',
        automatable: true,
      },
      {
        id: 'makeup',
        name: 'Makeup Gain',
        type: 'float',
        min: 0,
        max: 18,
        default: 3.5,
        unit: 'dB',
        automatable: true,
      },
      { id: 'mix', name: 'Dry / Wet Mix', type: 'float', min: 0, max: 1, default: 1.0, unit: '%' },
    ],
    presets: [
      {
        id: 'comp-drum-glue',
        pluginId: 'sonik-comp',
        name: 'TRAP DRUM BUS GLUE',
        category: 'DRUMS',
        version: 1,
        description: 'Binds kicks, snares and hats with 4:1 ratio and snappy attack.',
        parameters: {
          mode: 'BUS',
          threshold: -16,
          ratio: 4.0,
          attack: 0.03,
          release: 0.15,
          makeup: 2.5,
          mix: 0.85,
        },
      },
      {
        id: 'comp-hard-punch',
        pluginId: 'sonik-comp',
        name: 'HARD SLAP FET',
        category: 'PUNCH',
        version: 1,
        description: 'Aggressive 8:1 compression with ultra-fast recovery for hard snares.',
        parameters: {
          mode: 'FET',
          threshold: -20,
          ratio: 8.0,
          attack: 0.005,
          release: 0.08,
          makeup: 5.0,
          mix: 1.0,
        },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 7. SONIK COLOR (Analog Tape & Tube Saturator)
  // --------------------------------------------------------------------------
  'sonik-color': {
    id: 'sonik-color',
    name: 'SONIK COLOR & SATURATION',
    version: '1.0.0',
    manufacturer: '3WM SONIK',
    category: 'EFFECT',
    description: 'Warm analog tape, tube preamp, and transformer saturation modeling.',
    iconName: 'Flame',
    parameters: [
      {
        id: 'type',
        name: 'Color Type',
        type: 'enum',
        min: 0,
        max: 3,
        default: 'Tape',
        options: ['Tape', 'Tube', 'Console', 'Transformer'],
      },
      {
        id: 'drive',
        name: 'Drive Amount',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.45,
        unit: '%',
        automatable: true,
      },
      {
        id: 'warmthTone',
        name: 'Tone / Warmth',
        type: 'float',
        min: -5,
        max: 5,
        default: 1.5,
        unit: 'dB',
      },
      { id: 'mix', name: 'Mix', type: 'float', min: 0, max: 1, default: 0.8, unit: '%' },
    ],
    presets: [
      {
        id: 'color-tape-glue',
        pluginId: 'sonik-color',
        name: '1/2 INCH TAPE WARMTH',
        category: 'TAPE',
        version: 1,
        description: 'Adds rich even harmonics and natural tape compression.',
        parameters: { type: 'Tape', drive: 0.4, warmthTone: 2.0, mix: 0.85 },
      },
      {
        id: 'color-tube-dirt',
        pluginId: 'sonik-color',
        name: 'HOT TUBE PREAMP',
        category: 'TUBE',
        version: 1,
        description: 'Aggressive tube saturation for cutting through dense mixes.',
        parameters: { type: 'Tube', drive: 0.72, warmthTone: 1.0, mix: 0.7 },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 8. SONIK CLIP & LIMIT (Mastering Clipper / Limiter)
  // --------------------------------------------------------------------------
  'sonik-clip': {
    id: 'sonik-clip',
    name: 'SONIK MASTER CLIPPER',
    version: '1.0.0',
    manufacturer: '3WM SONIK',
    category: 'MASTERING',
    description:
      'Ultra-transparent soft and hard peak clipper for achieving modern competitive loudness without pumping.',
    iconName: 'Zap',
    parameters: [
      {
        id: 'mode',
        name: 'Clipper Mode',
        type: 'enum',
        min: 0,
        max: 1,
        default: 'Soft',
        options: ['Soft', 'Hard'],
      },
      {
        id: 'ceiling',
        name: 'Ceiling (dBFS)',
        type: 'float',
        min: -3.0,
        max: 0.0,
        default: -0.2,
        unit: 'dB',
      },
      {
        id: 'gain',
        name: 'Input Gain / Push',
        type: 'float',
        min: 0,
        max: 12,
        default: 3.5,
        unit: 'dB',
        automatable: true,
      },
      { id: 'knee', name: 'Soft Knee', type: 'float', min: 0, max: 1, default: 0.4, unit: '%' },
    ],
    presets: [
      {
        id: 'clip-trap-loud',
        pluginId: 'sonik-clip',
        name: 'TRAP LOUDNESS CEILING (-0.2 dB)',
        category: 'MASTER',
        version: 1,
        description: 'Pushes loudness up to -8 LUFS with clean harmonic clipping.',
        parameters: { mode: 'Soft', ceiling: -0.2, gain: 4.2, knee: 0.35 },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 9. SONIK DUCKER (Kick -> 808 Sidechain Engine)
  // --------------------------------------------------------------------------
  'sonik-ducker': {
    id: 'sonik-ducker',
    name: 'SONIK 808 SIDECHAIN DUCKER',
    version: '1.0.0',
    manufacturer: '3WM SONIK',
    category: 'EFFECT',
    description:
      'Fast optical sidechain ducker that automatically attenuates 808 bass during kick transients to eliminate low-end clash.',
    iconName: 'Zap',
    parameters: [
      {
        id: 'duckAmount',
        name: 'Duck Depth',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.75,
        unit: '%',
        automatable: true,
      },
      {
        id: 'attack',
        name: 'Attack Time',
        type: 'float',
        min: 0.001,
        max: 0.05,
        default: 0.005,
        unit: 's',
      },
      {
        id: 'release',
        name: 'Release Time',
        type: 'float',
        min: 0.02,
        max: 0.4,
        default: 0.12,
        unit: 's',
      },
      {
        id: 'hpf',
        name: 'Sidechain HPF',
        type: 'float',
        min: 20,
        max: 300,
        default: 80,
        unit: 'Hz',
      },
    ],
    presets: [
      {
        id: 'duck-trap-fast',
        pluginId: 'sonik-ducker',
        name: 'TIGHT TRAP POCKET',
        category: 'SIDECHAIN',
        version: 1,
        description: 'Instant duck on kick hit, fast 100ms recovery.',
        parameters: { duckAmount: 0.8, attack: 0.003, release: 0.1, hpf: 90 },
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 10. SUB CHECK (20Hz - 200Hz Low-End Analyzer)
  // --------------------------------------------------------------------------
  'sub-check': {
    id: 'sub-check',
    name: 'SONIK SUB CHECK (20Hz - 200Hz)',
    version: '1.0.0',
    manufacturer: '3WM SONIK',
    category: 'ANALYZER',
    description:
      'Dedicated low-frequency spectrum & phase analyzer to detect Kick/808 phase cancellation and sub-resonance build-up.',
    iconName: 'Activity',
    parameters: [
      {
        id: 'zoomRange',
        name: 'Range',
        type: 'enum',
        min: 0,
        max: 1,
        default: '20-200Hz',
        options: ['20-200Hz', '20-500Hz'],
      },
      { id: 'peakHold', name: 'Peak Hold', type: 'bool', min: 0, max: 1, default: true },
      {
        id: 'phaseDetection',
        name: 'Phase Inversion Warn',
        type: 'bool',
        min: 0,
        max: 1,
        default: true,
      },
    ],
    presets: [
      {
        id: 'subcheck-default',
        pluginId: 'sub-check',
        name: 'LOW END AUDIT',
        category: 'ANALYSIS',
        version: 1,
        parameters: { zoomRange: '20-200Hz', peakHold: true, phaseDetection: true },
      },
    ],
  },
};

// ============================================================================
// 2. REAL-TIME DSP PLUGIN ENGINE & ROUTABLE AUDIO NODES
// ============================================================================

export interface DSPNodeConnection {
  source: AudioNode;
  destination: AudioNode;
  gain?: number;
}

export interface DSPGraphState {
  nodes: Array<{
    id: string;
    type: string;
    parameters: Record<string, any>;
  }>;
  connections: DSPNodeConnection[];
}

export class PluginInstanceNode {
  public instanceId: string;
  public pluginDef: PluginDefinition;
  public inputNode: GainNode;
  public outputNode: GainNode;
  public dryGain: GainNode;
  public wetGain: GainNode;
  public parameters: Record<string, any>;
  public bypassed: boolean = false;
  private ctx: BaseAudioContext;

  // Specific DSP nodes depending on plugin
  private filterNodes: BiquadFilterNode[] = [];
  private shaperNode: WaveShaperNode | null = null;
  private dynamicsNode: DynamicsCompressorNode | null = null;
  private delayNode: DelayNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Parameter smoothing for glitch-free automation
  private parameterSmoothingTime: number = 0.02; // 20ms smoothing
  private dspGraph: DSPGraphState | null = null;

  constructor(
    ctx: BaseAudioContext,
    pluginDef: PluginDefinition,
    initialParams: Record<string, any> = {}
  ) {
    this.ctx = ctx;
    this.pluginDef = pluginDef;
    this.instanceId = `inst-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    this.parameters = { ...initialParams };

    // Set default parameters
    pluginDef.parameters.forEach((param) => {
      if (this.parameters[param.id] === undefined) {
        this.parameters[param.id] = param.default;
      }
    });

    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    this.dryGain.gain.value = 0.0;
    this.wetGain.gain.value = 1.0;

    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);

    this.buildDspGraph();
    this.serializeDspGraph();
  }

  /**
   * Serialize current DSP graph state for persistence
   */
  private serializeDspGraph(): void {
    const nodes: Array<{ id: string; type: string; parameters: Record<string, any> }> = [];

    // Serialize filter nodes
    this.filterNodes.forEach((filter, index) => {
      nodes.push({
        id: `filter-${index}`,
        type: filter.type,
        parameters: {
          frequency: filter.frequency.value,
          gain: filter.gain.value,
          Q: filter.Q.value,
        },
      });
    });

    // Serialize other nodes
    if (this.shaperNode) {
      nodes.push({
        id: 'shaper',
        type: 'waveshaper',
        parameters: { oversample: this.shaperNode.oversample },
      });
    }

    if (this.dynamicsNode) {
      nodes.push({
        id: 'dynamics',
        type: 'dynamics-compressor',
        parameters: {
          threshold: this.dynamicsNode.threshold.value,
          ratio: this.dynamicsNode.ratio.value,
          attack: this.dynamicsNode.attack.value,
          release: this.dynamicsNode.release.value,
        },
      });
    }

    this.dspGraph = {
      nodes,
      connections: [], // Could track connections if needed
    };
  }

  /**
   * Deserialize DSP graph state
   */
  public deserializeDspGraph(state: DSPGraphState): void {
    if (!state) return;

    this.dspGraph = state;

    // Restore node parameters
    state.nodes.forEach((node) => {
      if (
        node.type.startsWith('biquad') ||
        ['highpass', 'lowpass', 'lowshelf', 'highshelf', 'peaking'].includes(node.type)
      ) {
        const filter = this.filterNodes.find((f) => f.type === node.type);
        if (filter) {
          if (node.parameters.frequency !== undefined) {
            filter.frequency.value = node.parameters.frequency;
          }
          if (node.parameters.gain !== undefined) {
            filter.gain.value = node.parameters.gain;
          }
          if (node.parameters.Q !== undefined) {
            filter.Q.value = node.parameters.Q;
          }
        }
      }
    });
  }

  /**
   * Get current DSP graph state
   */
  public getDspGraph(): DSPGraphState | null {
    this.serializeDspGraph();
    return this.dspGraph;
  }

  /**
   * Set parameter smoothing time for glitch-free automation
   */
  public setParameterSmoothingTime(time: number): void {
    this.parameterSmoothingTime = Math.max(0.001, Math.min(0.5, time));
  }

  /**
   * Add real-time analyzer node for visualization
   */
  public addAnalyser(fftSize: number = 2048): AnalyserNode {
    if (!this.analyserNode) {
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = fftSize;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Insert analyzer before output
      this.wetGain.disconnect();
      this.wetGain.connect(this.analyserNode);
      this.analyserNode.connect(this.outputNode);
    }
    return this.analyserNode;
  }

  /**
   * Get analyzer data for visualization
   */
  public getAnalyserData(): Uint8Array | null {
    if (!this.analyserNode) return null;
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  /**
   * Add reverb effect using impulse response
   */
  public async addReverb(impulseResponse: AudioBuffer): Promise<void> {
    if (!this.reverbNode) {
      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = impulseResponse;

      // Create wet/dry mix for reverb
      const reverbGain = this.ctx.createGain();
      reverbGain.gain.value = 0.3; // 30% wet

      // Insert reverb into the chain
      this.wetGain.disconnect();
      this.wetGain.connect(this.reverbNode);
      this.reverbNode.connect(reverbGain);
      reverbGain.connect(this.outputNode);

      // Also maintain dry path
      this.wetGain.connect(this.outputNode);
    }
  }

  /**
   * Add delay effect
   */
  public addDelay(delayTime: number = 0.3, feedback: number = 0.4, mix: number = 0.3): void {
    if (!this.delayNode) {
      this.delayNode = this.ctx.createDelay(2.0); // Max 2 seconds delay
      this.delayNode.delayTime.value = delayTime;

      const feedbackGain = this.ctx.createGain();
      feedbackGain.gain.value = feedback;

      const delayMix = this.ctx.createGain();
      delayMix.gain.value = mix;

      // Create delay loop
      this.wetGain.disconnect();
      this.wetGain.connect(this.delayNode);
      this.delayNode.connect(feedbackGain);
      feedbackGain.connect(this.delayNode); // Feedback loop
      this.delayNode.connect(delayMix);
      delayMix.connect(this.outputNode);

      // Also maintain dry path
      this.wetGain.connect(this.outputNode);
    }
  }

  /**
   * Process audio in real-time with parameter automation
   */
  public async processAudio(
    audioBuffer: AudioBuffer,
    parameterAutomation?: Record<string, Array<{ time: number; value: number }>>
  ): Promise<AudioBuffer> {
    if (!this.ctx) {
      throw new Error('Audio context not initialized');
    }

    // Create offline context for processing
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    // Create source from buffer
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    // Create temporary plugin instance for processing
    const tempPlugin = new PluginInstanceNode(offlineCtx, this.pluginDef, this.parameters);

    // Apply parameter automation if provided
    if (parameterAutomation) {
      Object.entries(parameterAutomation).forEach(([paramId, automation]) => {
        automation.forEach(({ time, value }) => {
          tempPlugin.setParameter(paramId, value, time);
        });
      });
    }

    // Connect and process
    source.connect(tempPlugin.inputNode);
    tempPlugin.outputNode.connect(offlineCtx.destination);
    source.start();

    // Render the processed audio
    return offlineCtx.startRendering();
  }

  private buildDspGraph() {
    const pluginId = this.pluginDef.id;

    if (pluginId === 'sonik-eq') {
      // 5-band filter chain
      const hpf = this.ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = Number(this.parameters.hpf || 30);

      const low = this.ctx.createBiquadFilter();
      low.type = 'lowshelf';
      low.frequency.value = Number(this.parameters.lowFreq || 100);
      low.gain.value = Number(this.parameters.lowGain || 0);

      const mid = this.ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = Number(this.parameters.midFreq || 1200);
      mid.gain.value = Number(this.parameters.midGain || 0);
      mid.Q.value = Number(this.parameters.midQ || 1.2);

      const high = this.ctx.createBiquadFilter();
      high.type = 'highshelf';
      high.frequency.value = Number(this.parameters.highFreq || 9500);
      high.gain.value = Number(this.parameters.highGain || 0);

      this.filterNodes = [hpf, low, mid, high];
      this.inputNode.connect(hpf);
      hpf.connect(low);
      low.connect(mid);
      mid.connect(high);
      high.connect(this.wetGain);
      this.wetGain.connect(this.outputNode);
    } else if (pluginId === 'sonik-comp' || pluginId === 'sonik-ducker') {
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(Number(this.parameters.threshold || -18), this.ctx.currentTime);
      comp.ratio.setValueAtTime(Number(this.parameters.ratio || 4), this.ctx.currentTime);
      comp.attack.setValueAtTime(Number(this.parameters.attack || 0.02), this.ctx.currentTime);
      comp.release.setValueAtTime(Number(this.parameters.release || 0.12), this.ctx.currentTime);

      const makeup = this.ctx.createGain();
      const gainVal = Math.pow(10, Number(this.parameters.makeup || 0) / 20);
      makeup.gain.setValueAtTime(gainVal, this.ctx.currentTime);

      this.dynamicsNode = comp;
      this.inputNode.connect(comp);
      comp.connect(makeup);
      makeup.connect(this.wetGain);
      this.wetGain.connect(this.outputNode);
    } else if (pluginId === 'sonik-color' || pluginId === 'sonik-clip' || pluginId === '808-lab') {
      const shaper = this.ctx.createWaveShaper();
      shaper.curve = this.generateDriveCurve(Number(this.parameters.drive || 0.5));
      shaper.oversample = '4x';
      this.shaperNode = shaper;

      this.inputNode.connect(shaper);
      shaper.connect(this.wetGain);
      this.wetGain.connect(this.outputNode);
    } else {
      // Default pass-through
      this.inputNode.connect(this.wetGain);
      this.wetGain.connect(this.outputNode);
    }
  }

  private generateDriveCurve(amount: number): Float32Array<ArrayBuffer> {
    const k = amount * 35 + 1;
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public setParameter(paramId: string, value: any, time?: number) {
    this.parameters[paramId] = value;
    if (!this.ctx) return;
    const now = time !== undefined ? time : this.ctx.currentTime;
    const smoothingTime = this.parameterSmoothingTime;

    if (this.pluginDef.id === 'sonik-eq' && this.filterNodes.length >= 4) {
      if (paramId === 'hpf')
        this.filterNodes[0].frequency.setTargetAtTime(Number(value), now, smoothingTime);
      if (paramId === 'lowGain')
        this.filterNodes[1].gain.setTargetAtTime(Number(value), now, smoothingTime);
      if (paramId === 'lowFreq')
        this.filterNodes[1].frequency.setTargetAtTime(Number(value), now, smoothingTime);
      if (paramId === 'midGain')
        this.filterNodes[2].gain.setTargetAtTime(Number(value), now, smoothingTime);
      if (paramId === 'midFreq')
        this.filterNodes[2].frequency.setTargetAtTime(Number(value), now, smoothingTime);
      if (paramId === 'midQ')
        this.filterNodes[2].Q.setTargetAtTime(Number(value), now, smoothingTime);
      if (paramId === 'highGain')
        this.filterNodes[3].gain.setTargetAtTime(Number(value), now, smoothingTime);
      if (paramId === 'highFreq')
        this.filterNodes[3].frequency.setTargetAtTime(Number(value), now, smoothingTime);
    }

    if (this.dynamicsNode) {
      if (paramId === 'threshold')
        this.dynamicsNode.threshold.setTargetAtTime(Number(value), now, smoothingTime);
      if (paramId === 'ratio')
        this.dynamicsNode.ratio.setTargetAtTime(Number(value), now, smoothingTime);
      if (paramId === 'attack')
        this.dynamicsNode.attack.setTargetAtTime(Number(value), now, smoothingTime);
      if (paramId === 'release')
        this.dynamicsNode.release.setTargetAtTime(Number(value), now, smoothingTime);
    }

    if (this.shaperNode && (paramId === 'drive' || paramId === 'gain')) {
      this.shaperNode.curve = this.generateDriveCurve(Number(value));
    }

    // Update DSP graph state after parameter change
    this.serializeDspGraph();
  }

  public setBypassed(bypassed: boolean, time?: number) {
    this.bypassed = bypassed;
    if (!this.ctx) return;
    const now = time !== undefined ? time : this.ctx.currentTime;
    if (bypassed) {
      this.dryGain.gain.setTargetAtTime(1.0, now, 0.01);
      this.wetGain.gain.setTargetAtTime(0.0, now, 0.01);
    } else {
      this.dryGain.gain.setTargetAtTime(0.0, now, 0.01);
      this.wetGain.gain.setTargetAtTime(1.0, now, 0.01);
    }
  }
}

// ============================================================================
// 3. MASTER 808 GLIDE SYNTHESIS ENGINE (REAL DSP & PITCH PORTAMENTO)
// ============================================================================

class Voice808 {
  osc: OscillatorNode;
  subOsc: OscillatorNode;
  filter: BiquadFilterNode;
  shaper: WaveShaperNode;
  gain: GainNode;
  active: boolean = false;
  lastTrigTime: number = 0;

  constructor(ctx: BaseAudioContext, dest: AudioNode) {
    this.osc = ctx.createOscillator();
    this.subOsc = ctx.createOscillator();
    this.filter = ctx.createBiquadFilter();
    this.shaper = ctx.createWaveShaper();
    this.gain = ctx.createGain();

    this.osc.connect(this.filter);
    this.subOsc.connect(this.filter);
    this.filter.connect(this.shaper);
    this.shaper.connect(this.gain);
    this.gain.connect(dest);

    this.gain.gain.value = 0;
    (this.osc as any).__persistent = true;
    (this.subOsc as any).__persistent = true;
    this.osc.start(0);
    this.subOsc.start(0);
  }
}

export class Sonik808Synthesizer {
  private ctx: BaseAudioContext | null = null;
  private destinationNode: AudioNode | null = null;
  private activeOsc: OscillatorNode | null = null;
  private activeSubOsc: OscillatorNode | null = null;
  private activeGain: GainNode | null = null;
  private activeFilter: BiquadFilterNode | null = null;
  private lastPitch: number | null = null;
  private lastNoteTime: number = 0;
  private masterDrive: number = 0.42;

  // Saturation curve cache
  private static cachedCurve: Float32Array | null = null;
  private static cachedDrive: number | null = null;

  private getSaturationCurve(drive: number): Float32Array {
    if (Sonik808Synthesizer.cachedCurve && Sonik808Synthesizer.cachedDrive === drive) {
      return Sonik808Synthesizer.cachedCurve;
    }
    const k = drive * 30 + 1;
    const n = 4096; // Reduced from 44100 for better performance
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    Sonik808Synthesizer.cachedCurve = curve;
    Sonik808Synthesizer.cachedDrive = drive;
    return curve;
  }

  private voices: Voice808[] = [];

  public init(ctx: BaseAudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destinationNode = destination;
    // Pre-allocate 4 polyphonic voices for 808
    this.voices = [];
    for (let i = 0; i < 4; i++) {
      this.voices.push(new Voice808(ctx, destination));
    }
  }

  public setDrive(driveVal: number) {
    this.masterDrive = Math.max(0, Math.min(1.0, driveVal > 1 ? driveVal / 100 : driveVal));
  }

  public getDrive(): number {
    return this.masterDrive;
  }

  public resetGlide() {
    this.lastPitch = null;
    this.lastNoteTime = 0;
  }

  public trigger808Note(
    targetPitch: number,
    velocity: number = 110,
    durationSec: number = 1.5,
    params: Partial<Eight08Parameters> = {},
    time?: number
  ) {
    if (!this.ctx || !this.destinationNode || this.voices.length === 0) return;
    const now = time !== undefined ? time : this.ctx.currentTime;
    const targetFreq = 440 * Math.pow(2, (targetPitch - 69) / 12);
    const velFactor = Math.max(0.1, velocity / 127);

    const glideTimeSec = (params.glideTime ?? 85) / 1000;
    const punchAttack = params.punchAttack ?? 0.75;
    const decay = params.decay ?? 1.8;
    const sustain = params.sustain ?? 0.45;
    const release = params.release ?? 0.25;
    const drive = params.drive ?? 0.42;
    const subBoost = params.subBoost ?? 3.5;
    const filterCutoff = params.filterCutoff ?? 4500;

    // Check if portamento/glide should take effect
    const isGlide = params.legato && this.lastPitch !== null && now - this.lastNoteTime < 0.6;
    const startFreq = isGlide
      ? 440 * Math.pow(2, (this.lastPitch! - 69) / 12)
      : targetFreq * (1 + punchAttack * 1.5);

    // Voice pooling: find oldest or inactive voice
    let voice = this.voices.find((v) => !v.active);
    if (!voice) {
      voice = this.voices.reduce(
        (oldest, v) => (v.lastTrigTime < oldest.lastTrigTime ? v : oldest),
        this.voices[0]
      );
    }
    voice.active = true;
    voice.lastTrigTime = now;

    // Voice Choking: fade out if we are stealing an active voice
    try {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(0, now);
    } catch (e) {}

    const osc = voice.osc;
    const subOsc = voice.subOsc;
    const filter = voice.filter;
    const shaper = voice.shaper;
    const gain = voice.gain;

    // Apply cached saturation curve
    shaper.curve = this.getSaturationCurve(drive) as any;
    shaper.oversample = 'none';

    // Waveform assignment
    osc.type =
      params.waveform === 'triangle'
        ? 'triangle'
        : params.waveform === 'sawtooth'
          ? 'sawtooth'
          : 'sine';
    subOsc.type = 'sine';

    // Pitch Envelope & Glide execution
    if (isGlide) {
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, now + glideTimeSec);
      subOsc.frequency.setValueAtTime(startFreq * 0.5, now);
      subOsc.frequency.exponentialRampToValueAtTime(targetFreq * 0.5, now + glideTimeSec);
    } else {
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.035);
      subOsc.frequency.setValueAtTime(targetFreq * 0.5, now);
    }

    // Filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterCutoff, now);
    filter.Q.value = params.filterResonance ?? 1.5;

    // ADSR Amplitude Envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.85 * velFactor, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.6 * sustain * velFactor, now + decay * 0.4);
    const stopTime = now + durationSec;
    gain.gain.setValueAtTime(0.6 * sustain * velFactor, stopTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime + release);
    // Explicitly clamp to true 0 to eliminate any background hum, continuous oscillator bleed, or compressor amplification
    gain.gain.setValueAtTime(0, stopTime + release + 0.005);

    // Deactivate voice in future
    setTimeout(
      () => {
        if (voice && this.ctx && this.ctx.currentTime >= stopTime + release) {
          try {
            voice.gain.gain.setValueAtTime(0, this.ctx.currentTime);
          } catch (e) {}
          voice.active = false;
        }
      },
      (durationSec + release) * 1000 + 100
    );

    this.lastPitch = targetPitch;
    this.lastNoteTime = now;
  }

  public stopAll() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.voices.forEach((voice) => {
      try {
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(0, now);
        voice.active = false;
      } catch (e) {}
    });
    this.resetGlide();
  }
}

export const sonik808Engine = new Sonik808Synthesizer();
