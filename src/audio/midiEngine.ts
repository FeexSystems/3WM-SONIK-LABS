// 3WM SONIK — MIDI Engine, Synthesizers, Scale Assistant & Rhythm DNA (v2.2)
import {
  MidiNote,
  MidiPattern,
  StepSequencerChannel,
  ScaleDefinition,
  ChordProgressionSuggestion,
  GrooveTemplate,
  AiProducerRequest,
} from '../types';

// ============================================================================
// 1. SCALE ASSISTANT & MUSIC THEORY ENGINE
// ============================================================================

export const SCALES: Record<string, ScaleDefinition> = {
  'Natural Minor': { name: 'Natural Minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  'Harmonic Minor': { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  Dorian: { name: 'Dorian (Afrobeat/Funk)', intervals: [0, 2, 3, 5, 7, 9, 10] },
  Major: { name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  'Pentatonic Minor': { name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10] },
  'Pentatonic Major': { name: 'Major Pentatonic (Highlife)', intervals: [0, 2, 4, 7, 9] },
  Blues: { name: 'Blues Scale', intervals: [0, 3, 5, 6, 7, 10] },
  Mixolydian: { name: 'Mixolydian (Highlife/Jùjú)', intervals: [0, 2, 4, 5, 7, 9, 10] },
  Phrygian: { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
};

export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function noteNumberToName(midiPitch: number): string {
  const octave = Math.floor(midiPitch / 12) - 1;
  const noteName = ROOT_NOTES[midiPitch % 12];
  return `${noteName}${octave}`;
}

export function nameToMidiPitch(name: string): number {
  const match = name.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60;
  const note = match[1];
  const octave = parseInt(match[2], 10);
  const noteIndex = ROOT_NOTES.indexOf(note);
  if (noteIndex === -1) return 60;
  return (octave + 1) * 12 + noteIndex;
}

export function getScalePitches(
  rootName: string,
  scaleName: string,
  octaveRange: [number, number] = [2, 6]
): number[] {
  const rootIndex = ROOT_NOTES.indexOf(rootName.replace(/[0-9]/g, ''));
  const scale = SCALES[scaleName] || SCALES['Natural Minor'];
  const pitches: number[] = [];

  for (let oct = octaveRange[0]; oct <= octaveRange[1]; oct++) {
    for (const interval of scale.intervals) {
      const pitch = (oct + 1) * 12 + ((rootIndex + interval) % 12);
      if (pitch >= 0 && pitch <= 127) {
        pitches.push(pitch);
      }
    }
  }
  return Array.from(new Set(pitches)).sort((a, b) => a - b);
}

export function isPitchInScale(pitch: number, rootName: string, scaleName: string): boolean {
  const rootIndex = ROOT_NOTES.indexOf(rootName.replace(/[0-9]/g, ''));
  const scale = SCALES[scaleName] || SCALES['Natural Minor'];
  const pitchClass = pitch % 12;
  return scale.intervals.some((int) => (rootIndex + int) % 12 === pitchClass);
}

// ============================================================================
// 2. CHORD ENGINE (Afrofusion, Amapiano, Highlife Progressions)
// ============================================================================

export const AFRO_CHORD_PROGRESSIONS: ChordProgressionSuggestion[] = [
  {
    name: 'Lagos Night Club Vibe (i - VII - VI - VII)',
    numeral: 'i - VII - VI - VII',
    style: 'Afrofusion',
    chords: [
      { root: 'F#', type: 'min7', notes: [54, 57, 61, 64] },
      { root: 'E', type: 'maj7', notes: [52, 56, 59, 63] },
      { root: 'D', type: 'maj7', notes: [50, 54, 57, 61] },
      { root: 'E', type: 'dom7', notes: [52, 56, 59, 62] },
    ],
  },
  {
    name: 'Kalakuta Shrine Highlife (I - IV - V - IV)',
    numeral: 'I - IV - V - IV',
    style: 'Highlife',
    chords: [
      { root: 'C', type: 'maj9', notes: [48, 52, 55, 59, 62] },
      { root: 'F', type: 'maj7', notes: [53, 57, 60, 64] },
      { root: 'G', type: 'dom7', notes: [55, 59, 62, 65] },
      { root: 'F', type: 'maj7', notes: [53, 57, 60, 64] },
    ],
  },
  {
    name: 'Johannesburg To Lagos Log Groove (ii - v - i - iv)',
    numeral: 'ii - v - i - iv',
    style: 'Amapiano',
    chords: [
      { root: 'G#', type: 'min9', notes: [56, 59, 63, 66, 70] },
      { root: 'C#', type: 'min7', notes: [49, 52, 56, 59] },
      { root: 'F#', type: 'min7', notes: [54, 57, 61, 64] },
      { root: 'B', type: 'dom9', notes: [47, 51, 54, 57, 61] },
    ],
  },
  {
    name: 'Afrobeats Anthem (VI - VII - i - v)',
    numeral: 'VI - VII - i - v',
    style: 'Afrobeats',
    chords: [
      { root: 'D', type: 'maj7', notes: [50, 54, 57, 61] },
      { root: 'E', type: 'dom7', notes: [52, 56, 59, 62] },
      { root: 'F#', type: 'min7', notes: [54, 57, 61, 64] },
      { root: 'C#', type: 'min7', notes: [49, 52, 56, 59] },
    ],
  },
];

// ============================================================================
// 3. RHYTHM DNA & GROOVE TEMPLATES
// ============================================================================

export const GROOVE_TEMPLATES: GrooveTemplate[] = [
  {
    id: 'afrofusion-lagos',
    name: 'Lagos Mainland Afrofusion Pocket',
    genre: 'Afrofusion',
    swing: 0.18,
    humanizeTiming: 0.14,
    humanizeVelocity: 0.22,
    polyrhythmFactor: 0.75,
    description: 'Crisp syncopated 16th-note swing with ghost-note conga pushes.',
  },
  {
    id: 'amapiano-log',
    name: 'Soweto-Lagos Log Drum Bounce',
    genre: 'Amapiano',
    swing: 0.25,
    humanizeTiming: 0.18,
    humanizeVelocity: 0.28,
    polyrhythmFactor: 0.85,
    description: 'Deep swung shaker shuffle, heavy sub pitch-bend envelope, offbeat accents.',
  },
  {
    id: 'kalakuta-shrine',
    name: 'Kalakuta Shrine Polyrhythmic Drive',
    genre: 'Highlife',
    swing: 0.12,
    humanizeTiming: 0.22,
    humanizeVelocity: 0.35,
    polyrhythmFactor: 0.95,
    description: 'Organic live human feel with talking drum velocity micro-dynamics.',
  },
  {
    id: 'straight-digital',
    name: 'Quantized Digital Grid',
    genre: 'Straight',
    swing: 0.0,
    humanizeTiming: 0.0,
    humanizeVelocity: 0.05,
    polyrhythmFactor: 0.1,
    description: 'Precision quantized club snap.',
  },
];

// ============================================================================
// 4. MIDI QUANTIZER & HUMANIZER
// ============================================================================

export class MidiQuantizer {
  public static quantize(notes: MidiNote[], gridResolution: number = 1): MidiNote[] {
    // gridResolution: 1 = 16th, 2 = 8th, 4 = quarter, 0.5 = 32nd
    return notes.map((note) => {
      const quantizedStart = Math.round(note.startStep / gridResolution) * gridResolution;
      const quantizedDuration = Math.max(
        gridResolution,
        Math.round(note.durationSteps / gridResolution) * gridResolution
      );
      return {
        ...note,
        startStep: quantizedStart,
        durationSteps: quantizedDuration,
        microTimingOffset: 0,
      };
    });
  }

  public static humanize(
    notes: MidiNote[],
    template: GrooveTemplate = GROOVE_TEMPLATES[0],
    seed: number = 42
  ): MidiNote[] {
    let rng = seed;
    const random = () => {
      rng = (rng * 9301 + 49297) % 233280;
      return rng / 233280;
    };

    return notes.map((note) => {
      // 1. Swing offset on odd 16th steps (1, 3, 5, 7...)
      let swingOffset = 0;
      if (note.startStep % 2 === 1) {
        swingOffset = template.swing * 0.35;
      }

      // 2. Microtiming jitter (-0.1 to +0.1 of a step)
      const timingJitter = (random() - 0.5) * 0.2 * template.humanizeTiming;
      const totalOffset = Math.max(-0.4, Math.min(0.4, swingOffset + timingJitter));

      // 3. Velocity humanization (±15 velocity units)
      const velocityJitter = (random() - 0.5) * 30 * template.humanizeVelocity;
      const newVelocity = Math.max(20, Math.min(127, Math.round(note.velocity + velocityJitter)));

      return {
        ...note,
        velocity: newVelocity,
        microTimingOffset: totalOffset,
      };
    });
  }

  public static transpose(notes: MidiNote[], semitones: number): MidiNote[] {
    return notes.map((n) => ({
      ...n,
      pitch: Math.max(0, Math.min(127, n.pitch + semitones)),
    }));
  }
}

// ============================================================================
// 5. SYNTHESIZER & INSTRUMENT SOUND ENGINE
// ============================================================================

export class MidiSynthesizer {
  private ctx: BaseAudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Global Noise Bank
  private static noiseBuffers: Map<string, AudioBuffer> = new Map();

  private getNoiseBuffer(sizeSeconds: number, type: 'white' | 'crackle' = 'white'): AudioBuffer {
    if (!this.ctx) throw new Error('No ctx');
    const key = `${sizeSeconds}_${type}`;
    if (MidiSynthesizer.noiseBuffers.has(key)) {
      return MidiSynthesizer.noiseBuffers.get(key)!;
    }
    const bufferSize = Math.floor(this.ctx.sampleRate * sizeSeconds);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else {
      for (let i = 0; i < bufferSize; i++)
        data[i] = Math.random() > 0.96 ? Math.random() * 2 - 1 : 0;
    }
    MidiSynthesizer.noiseBuffers.set(key, buffer);
    return buffer;
  }

  public init(ctx: BaseAudioContext, destinationNode: AudioNode) {
    this.ctx = ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(destinationNode);
  }

  public playNote(
    pitch: number,
    velocity: number = 100,
    durationSec: number = 0.25,
    instrumentType: string = 'synth_lead',
    pan: number = 0,
    time?: number
  ) {
    if (!this.ctx || !this.masterGain) return;
    const now = time !== undefined ? time : this.ctx.currentTime;
    const freq = 440 * Math.pow(2, (pitch - 69) / 12);
    const velFactor = Math.max(0.1, velocity / 127);

    // Pan node
    let panNode: StereoPannerNode | null = null;
    if (typeof this.ctx.createStereoPanner === 'function') {
      panNode = this.ctx.createStereoPanner();
      panNode.pan.setValueAtTime(pan, now);
      panNode.connect(this.masterGain);
    }
    const outputTarget: AudioNode = panNode || this.masterGain;

    if (instrumentType === 'synth_lead') {
      this.playSynthLead(freq, velFactor, durationSec, now, outputTarget);
    } else if (instrumentType === 'afro_bass') {
      this.playAfroBass(freq, velFactor, durationSec, now, outputTarget);
    } else if (
      instrumentType === 'sub_808' ||
      instrumentType === '808' ||
      instrumentType === '808-lab'
    ) {
      this.play808Bass(freq, velFactor, durationSec, now, outputTarget);
    } else if (instrumentType === 'log_drum') {
      this.playLogDrum(freq, velFactor, durationSec, now, outputTarget);
    } else if (instrumentType === 'rhodes' || instrumentType === 'synth_pad') {
      this.playRhodesChord(freq, velFactor, durationSec, now, outputTarget);
    } else if (instrumentType === 'dark_piano' || instrumentType === 'piano') {
      this.playDarkPiano(freq, velFactor, durationSec, now, outputTarget);
    } else if (instrumentType === 'cowbell' || instrumentType === 'cowbell-x') {
      this.playCowbell(freq, velFactor, durationSec, now, outputTarget);
    } else if (instrumentType === 'horns') {
      this.playHorns(freq, velFactor, durationSec, now, outputTarget);
    } else if (instrumentType === 'marimba' || instrumentType === 'kora') {
      this.playMarimba(freq, velFactor, durationSec, now, outputTarget);
    } else {
      this.playSynthLead(freq, velFactor, durationSec, now, outputTarget);
    }
  }

  private play808Bass(freq: number, vel: number, dur: number, time: number, target: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const shaper = this.ctx.createWaveShaper();
    const gain = this.ctx.createGain();

    // Pitch drop punch
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.8, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.04);

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(freq * 0.5, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, time);
    filter.Q.value = 2.0;

    // Saturation wave shaper
    const k = 15;
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    shaper.curve = curve;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.85 * vel, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.55 * vel, time + dur * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.15);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(shaper);
    shaper.connect(gain);
    gain.connect(target);

    osc.start(time);
    subOsc.start(time);
    osc.stop(time + dur + 0.2);
    subOsc.stop(time + dur + 0.2);
  }

  private playDarkPiano(freq: number, vel: number, dur: number, time: number, target: AudioNode) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.frequency.exponentialRampToValueAtTime(600, time + dur);
    filter.Q.value = 1.0;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.45 * vel, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.15 * vel, time + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(target);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + dur + 0.05);
    osc2.stop(time + dur + 0.05);
  }

  private playCowbell(freq: number, vel: number, dur: number, time: number, target: AudioNode) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 1.505, time); // Memphis cowbell interval

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1650, time);
    filter.Q.value = 3.5;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.4 * vel, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(dur, 0.4));

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(target);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + Math.min(dur, 0.4) + 0.02);
    osc2.stop(time + Math.min(dur, 0.4) + 0.02);
  }

  private playSynthLead(freq: number, vel: number, dur: number, time: number, target: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3.5, time);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.2, time + dur);
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.35 * vel, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.2 * vel, time + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(target);

    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  private playAfroBass(freq: number, vel: number, dur: number, time: number, target: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq * 0.5, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.55 * vel, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.35 * vel, time + dur * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(target);

    osc.start(time);
    subOsc.start(time);
    osc.stop(time + dur + 0.02);
    subOsc.stop(time + dur + 0.02);
  }

  private playLogDrum(freq: number, vel: number, dur: number, time: number, target: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Amapiano Log Drum pitch dive
    osc.frequency.setValueAtTime(freq * 2.2, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.9, time + 0.045);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.75, time + dur);

    gain.gain.setValueAtTime(0.7 * vel, time);
    gain.gain.exponentialRampToValueAtTime(0.4 * vel, time + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(gain);
    gain.connect(target);

    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  private playRhodesChord(freq: number, vel: number, dur: number, time: number, target: AudioNode) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.25 * vel, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.12 * vel, time + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(target);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + dur + 0.05);
    osc2.stop(time + dur + 0.05);
  }

  private playHorns(freq: number, vel: number, dur: number, time: number, target: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.Q.value = 2.0;

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.25 * vel, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(target);

    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  private playMarimba(freq: number, vel: number, dur: number, time: number, target: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.98, time + 0.03);

    gain.gain.setValueAtTime(0.4 * vel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + Math.min(dur, 0.35));

    osc.connect(gain);
    gain.connect(target);

    osc.start(time);
    osc.stop(time + Math.min(dur, 0.35) + 0.02);
  }

  // Drum sample synth triggers for Step Sequencer channels
  public playDrumSample(sampleKey: string, velocity: number = 100, pan: number = 0, time?: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = time !== undefined ? time : this.ctx.currentTime;
    const vel = Math.max(0.1, velocity / 127);

    let panNode: StereoPannerNode | null = null;
    if (typeof this.ctx.createStereoPanner === 'function') {
      panNode = this.ctx.createStereoPanner();
      panNode.pan.setValueAtTime(pan, now);
      panNode.connect(this.masterGain);
    }
    const target: AudioNode = panNode || this.masterGain;

    switch (sampleKey) {
      case 'kick':
      case 'sub_808': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
        gain.gain.setValueAtTime(0.85 * vel, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 0.3);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        break;
      }
      case 'snare':
      case 'clap': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.05);
        gain.gain.setValueAtTime(0.55 * vel, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 0.13);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        break;
      }
      case 'closed_hat': {
        const buffer = this.getNoiseBuffer(0.04, 'white');
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7500;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25 * vel, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(target);
        source.start(now);
        source.stop(now + 0.04);
        source.onended = () => {
          source.disconnect();
          // @ts-ignore
          if (typeof filter !== 'undefined') filter.disconnect();
          gain.disconnect();
        };
        break;
      }
      case 'open_hat': {
        const buffer = this.getNoiseBuffer(0.2, 'white');
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3 * vel, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(target);
        source.start(now);
        source.stop(now + 0.2);
        source.onended = () => {
          source.disconnect();
          // @ts-ignore
          if (typeof filter !== 'undefined') filter.disconnect();
          gain.disconnect();
        };
        break;
      }
      case 'conga':
      case 'percussion':
      case 'talking_drum': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const startFreq = sampleKey === 'talking_drum' ? 220 : 310;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.7, now + 0.14);
        gain.gain.setValueAtTime(0.45 * vel, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 0.17);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        break;
      }
      case 'shaker': {
        const buffer = this.getNoiseBuffer(0.04, 'white');
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 5500;
        filter.Q.value = 2.5;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18 * vel, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(target);
        source.start(now);
        source.stop(now + 0.04);
        source.onended = () => {
          source.disconnect();
          // @ts-ignore
          if (typeof filter !== 'undefined') filter.disconnect();
          gain.disconnect();
        };
        break;
      }
      case 'log_drum': {
        this.playLogDrum(55, vel * 127, 0.35, now, target);
        break;
      }
      case 'cowbell': {
        this.playCowbell(68, vel * 127, 0.35, now, target);
        break;
      }
      case 'rim': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(210, now + 0.04);
        gain.gain.setValueAtTime(0.6 * vel, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 0.08);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        break;
      }
      case 'tom': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.18);
        gain.gain.setValueAtTime(0.7 * vel, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 0.23);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        break;
      }
      case 'crash':
      case 'ride':
      case 'trap_splash': {
        const buffer = this.getNoiseBuffer(0.45, 'white');
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35 * vel, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(target);
        source.start(now);
        source.stop(now + 0.42);
        source.onended = () => {
          source.disconnect();
          // @ts-ignore
          if (typeof filter !== 'undefined') filter.disconnect();
          gain.disconnect();
        };
        break;
      }
      // TRAP HI-HAT ROLLS & RATCHETS
      case 'trap_hat_ratchet':
      case 'hat_roll_2x': {
        // Fast 2-hit ratchet roll
        [0, 0.045].forEach((offset) => {
          if (!this.ctx) return;
          const buffer = this.getNoiseBuffer(0.025, 'white');
          const source = this.ctx.createBufferSource();
          source.buffer = buffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 8500;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.24 * vel, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.022);
          source.connect(filter);
          filter.connect(gain);
          gain.connect(target);
          source.start(now + offset);
          source.stop(now + offset + 0.025);
        });
        break;
      }
      case 'trap_hat_triplet':
      case 'hat_roll_3x': {
        // Fast 3-hit triplet roll
        [0, 0.03, 0.06].forEach((offset, idx) => {
          if (!this.ctx) return;
          const buffer = this.getNoiseBuffer(0.022, 'white');
          const source = this.ctx.createBufferSource();
          source.buffer = buffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 9000;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime((0.18 + idx * 0.04) * vel, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.02);
          source.connect(filter);
          filter.connect(gain);
          gain.connect(target);
          source.start(now + offset);
          source.stop(now + offset + 0.022);
        });
        break;
      }
      // DARK PIANO & KEYS HITS
      case 'dark_piano':
      case 'piano_stab': {
        this.playDarkPiano(220, vel, 0.4, now, target);
        break;
      }
      case 'rhodes_chord':
      case 'rhodes_stab': {
        this.playRhodesChord(261.6, vel, 0.5, now, target);
        break;
      }
      case 'trap_bell': {
        this.playCowbell(72, vel * 127, 0.35, now, target);
        break;
      }
      // STREET & TRAP FX
      case 'street_siren':
      case 'siren_fx': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.linearRampToValueAtTime(1100, now + 0.15);
        osc.frequency.linearRampToValueAtTime(600, now + 0.3);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.3 * vel, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 0.36);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        break;
      }
      case 'gun_cock_fx':
      case 'trap_gun_cock': {
        [0, 0.06].forEach((offset) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1800, now + offset);
          osc.frequency.exponentialRampToValueAtTime(350, now + offset + 0.03);
          gain.gain.setValueAtTime(0.35 * vel, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.035);
          osc.connect(gain);
          gain.connect(target);
          osc.start(now + offset);
          osc.stop(now + offset + 0.04);
        });
        break;
      }
      case 'laser_sweep': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2200, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);
        gain.gain.setValueAtTime(0.35 * vel, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        osc.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 0.25);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        break;
      }
      case 'vinyl_crackle': {
        const buffer = this.getNoiseBuffer(0.15, 'crackle');
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4 * vel, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        source.connect(gain);
        gain.connect(target);
        source.start(now);
        source.stop(now + 0.16);
        source.onended = () => {
          source.disconnect();
          // @ts-ignore
          if (typeof filter !== 'undefined') filter.disconnect();
          gain.disconnect();
        };
        break;
      }
      case 'sub_drop': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.5);
        gain.gain.setValueAtTime(0.7 * vel, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
        osc.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 0.58);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        break;
      }
      // VOCALIZATIONS & CHANTS
      case 'afro_chant_oya':
      case 'vocal_chant': {
        // "Oya!" punchy formant chant
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.18);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(950, now);
        filter.Q.value = 4.0;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.48 * vel, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 0.26);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        break;
      }
      case 'drill_woo_vox': {
        // "Woo!" pitched sliding vox
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.42 * vel, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 0.29);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        break;
      }
      case 'trap_aye_chant': {
        // "Aye!" / "Yeah!" high energy trap stab
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.value = 3.5;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.45 * vel, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 0.22);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        break;
      }
      case 'shrine_vox_choir': {
        // Kalakuta Shrine Afrobeat chorus stab
        [330, 392, 493.8].forEach((f) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(0.18 * vel, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
          osc.connect(gain);
          gain.connect(target);
          osc.start(now);
          osc.stop(now + 0.36);
          osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
          };
        });
        break;
      }
      case 'adlib_female': {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.linearRampToValueAtTime(660, now + 0.12);
        osc.frequency.linearRampToValueAtTime(490, now + 0.3);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.35 * vel, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 0.36);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
        break;
      }
      default: {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(200, now);
        gain.gain.setValueAtTime(0.3 * vel, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 0.11);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      }
    }
  }
}

export const midiSynth = new MidiSynthesizer();
