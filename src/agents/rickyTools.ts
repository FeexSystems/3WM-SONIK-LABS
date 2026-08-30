// 3WM SONIK - Sound Generation Tools for Kappachino Ricky (The Sound God)
// Professional sound design and beat generation tools for the sound intelligence of 3WM SONIK

import { ToolDefinition, ToolExecutionContext, ToolResult } from './agentTools';
import { AgentId } from './types';
import { validators } from './agentTools';

/**
 * Generate drum pattern based on genre and groove
 */
export const generateDrumPattern: ToolDefinition = {
  name: 'generate_drum_pattern',
  description: 'Generate a drum pattern based on genre, groove template, and complexity',
  inputSchema: {
    type: 'object',
    properties: {
      genre: {
        type: 'string',
        description: 'Musical genre (afrofusion, amapiano, trap, drill, etc.)',
      },
      groove: { type: 'string', description: 'Groove template name' },
      complexity: { type: 'number', description: 'Pattern complexity (1-10)' },
      bpm: { type: 'number', description: 'Tempo in BPM' },
      bars: { type: 'number', description: 'Number of bars (default: 1)' },
    },
    required: ['genre', 'bpm'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      kickPattern: { type: 'array' },
      snarePattern: { type: 'array' },
      hihatPattern: { type: 'array' },
      percussionPattern: { type: 'array' },
      swing: { type: 'number' },
      grooveTemplate: { type: 'string' },
    },
  },
  authorizedAgents: ['kappachino_ricky'],
  destructive: false,
  validate: (params) => {
    const errors: string[] = [];
    if (!params.genre) errors.push('genre is required');
    if (!params.bpm) errors.push('bpm is required');

    const bpmCheck = validators.number(params.bpm, 40, 240);
    if (!bpmCheck.valid) errors.push(...bpmCheck.errors);

    if (params.complexity !== undefined) {
      const compCheck = validators.number(params.complexity, 1, 10);
      if (!compCheck.valid) errors.push(...compCheck.errors);
    }

    return { valid: errors.length === 0, errors };
  },
  execute: async (context: ToolExecutionContext, params: any): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      const { genre, groove, complexity = 5, bpm, bars = 1 } = params;

      // Generate pattern based on genre
      const pattern = generateGenrePattern(genre, groove, complexity, bpm, bars);

      return {
        success: true,
        data: pattern,
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in drum pattern generation',
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    }
  },
};

/**
 * Generate 808 bass line with slide and glide
 */
export const generate808Bass: ToolDefinition = {
  name: 'generate_808_bass',
  description: 'Generate 808 bass line with pitch slides, glide, and sub-bass characteristics',
  inputSchema: {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'Musical key (e.g., Cm, F#)' },
      scale: { type: 'string', description: 'Musical scale' },
      complexity: { type: 'number', description: 'Bass line complexity (1-10)' },
      slideIntensity: { type: 'number', description: 'Slide intensity (0-1)' },
      glideEnabled: { type: 'boolean', description: 'Enable glide between notes' },
      bars: { type: 'number', description: 'Number of bars (default: 1)' },
    },
    required: ['key', 'scale'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      notes: { type: 'array' },
      slides: { type: 'array' },
      glideSettings: { type: 'object' },
      envelope: { type: 'object' },
    },
  },
  authorizedAgents: ['kappachino_ricky'],
  destructive: false,
  validate: (params) => {
    const errors: string[] = [];
    if (!params.key) errors.push('key is required');
    if (!params.scale) errors.push('scale is required');

    if (params.complexity !== undefined) {
      const compCheck = validators.number(params.complexity, 1, 10);
      if (!compCheck.valid) errors.push(...compCheck.errors);
    }

    if (params.slideIntensity !== undefined) {
      const slideCheck = validators.number(params.slideIntensity, 0, 1);
      if (!slideCheck.valid) errors.push(...slideCheck.errors);
    }

    return { valid: errors.length === 0, errors };
  },
  execute: async (context: ToolExecutionContext, params: any): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      const {
        key,
        scale,
        complexity = 5,
        slideIntensity = 0.5,
        glideEnabled = true,
        bars = 1,
      } = params;

      // Generate 808 bass line
      const bassLine = generate808Line(key, scale, complexity, slideIntensity, glideEnabled, bars);

      return {
        success: true,
        data: bassLine,
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in 808 bass generation',
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    }
  },
};

/**
 * Design synth sound with oscillator configuration
 */
export const designSynthSound: ToolDefinition = {
  name: 'design_synth_sound',
  description: 'Design synthesizer sound with oscillator configuration, filters, and envelopes',
  inputSchema: {
    type: 'object',
    properties: {
      soundType: { type: 'string', description: 'Type of sound (lead, pad, bass, pluck)' },
      character: {
        type: 'string',
        description: 'Sound character (warm, bright, dark, aggressive)',
      },
      oscillatorType: {
        type: 'string',
        description: 'Oscillator type (sawtooth, square, triangle, sine)',
      },
      detune: { type: 'number', description: 'Detune amount in cents' },
      unisonVoices: { type: 'number', description: 'Number of unison voices' },
    },
    required: ['soundType', 'character'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      oscillators: { type: 'array' },
      filter: { type: 'object' },
      envelope: { type: 'object' },
      effects: { type: 'array' },
    },
  },
  authorizedAgents: ['kappachino_ricky'],
  destructive: false,
  validate: (params) => {
    const errors: string[] = [];
    if (!params.soundType) errors.push('soundType is required');
    if (!params.character) errors.push('character is required');

    if (params.detune !== undefined) {
      const detuneCheck = validators.number(params.detune, -1200, 1200);
      if (!detuneCheck.valid) errors.push(...detuneCheck.errors);
    }

    if (params.unisonVoices !== undefined) {
      const unisonCheck = validators.number(params.unisonVoices, 1, 16);
      if (!unisonCheck.valid) errors.push(...unisonCheck.errors);
    }

    return { valid: errors.length === 0, errors };
  },
  execute: async (context: ToolExecutionContext, params: any): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      const { soundType, character, oscillatorType, detune, unisonVoices } = params;

      // Design synth sound
      const synthDesign = designSynth(soundType, character, oscillatorType, detune, unisonVoices);

      return {
        success: true,
        data: synthDesign,
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in synth sound design',
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    }
  },
};

/**
 * Analyze groove and suggest rhythm patterns
 */
export const analyzeGroove: ToolDefinition = {
  name: 'analyze_groove',
  description: 'Analyze existing groove pattern and suggest rhythm improvements',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: { type: 'array', description: 'Existing drum pattern to analyze' },
      targetGenre: { type: 'string', description: 'Target genre for groove adaptation' },
      swingAmount: { type: 'number', description: 'Desired swing amount (0-1)' },
    },
    required: ['pattern'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      grooveAnalysis: { type: 'object' },
      suggestions: { type: 'array' },
      adaptedPattern: { type: 'array' },
      swingSettings: { type: 'object' },
    },
  },
  authorizedAgents: ['kappachino_ricky'],
  destructive: false,
  validate: (params) => {
    const errors: string[] = [];
    if (!params.pattern || !Array.isArray(params.pattern)) {
      errors.push('pattern is required and must be an array');
    }

    if (params.swingAmount !== undefined) {
      const swingCheck = validators.number(params.swingAmount, 0, 1);
      if (!swingCheck.valid) errors.push(...swingCheck.errors);
    }

    return { valid: errors.length === 0, errors };
  },
  execute: async (context: ToolExecutionContext, params: any): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      const { pattern, targetGenre, swingAmount = 0.5 } = params;

      // Analyze groove
      const grooveAnalysis = analyzePatternGroove(pattern, targetGenre, swingAmount);

      return {
        success: true,
        data: grooveAnalysis,
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in groove analysis',
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    }
  },
};

/**
 * Generate percussion layers
 */
export const generatePercussion: ToolDefinition = {
  name: 'generate_percussion',
  description: 'Generate percussion layers for Afrobeat, Amapiano, and other African genres',
  inputSchema: {
    type: 'object',
    properties: {
      genre: { type: 'string', description: 'Musical genre' },
      instrument: {
        type: 'string',
        description: 'Percussion instrument (shaker, conga, log drum, talking drum)',
      },
      complexity: { type: 'number', description: 'Pattern complexity (1-10)' },
      polyrhythm: { type: 'boolean', description: 'Enable polyrhythmic patterns' },
    },
    required: ['genre', 'instrument'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      pattern: { type: 'array' },
      velocityMap: { type: 'array' },
      timingOffset: { type: 'array' },
      articulation: { type: 'object' },
    },
  },
  authorizedAgents: ['kappachino_ricky'],
  destructive: false,
  validate: (params) => {
    const errors: string[] = [];
    if (!params.genre) errors.push('genre is required');
    if (!params.instrument) errors.push('instrument is required');

    if (params.complexity !== undefined) {
      const compCheck = validators.number(params.complexity, 1, 10);
      if (!compCheck.valid) errors.push(...compCheck.errors);
    }

    return { valid: errors.length === 0, errors };
  },
  execute: async (context: ToolExecutionContext, params: any): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      const { genre, instrument, complexity = 5, polyrhythm = false } = params;

      // Generate percussion pattern
      const percussion = generatePercussionPattern(genre, instrument, complexity, polyrhythm);

      return {
        success: true,
        data: percussion,
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in percussion generation',
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    }
  },
};

/**
 * Suggest instrument combinations
 */
export const suggestInstrumentation: ToolDefinition = {
  name: 'suggest_instrumentation',
  description: 'Suggest instrument combinations based on genre, mood, and arrangement needs',
  inputSchema: {
    type: 'object',
    properties: {
      genre: { type: 'string', description: 'Musical genre' },
      mood: { type: 'string', description: 'Desired mood (energetic, relaxed, dark, bright)' },
      existingInstruments: { type: 'array', description: 'Already used instruments' },
      arrangementRole: {
        type: 'string',
        description: 'Role in arrangement (lead, rhythm, texture, bass)',
      },
    },
    required: ['genre', 'mood'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      primarySuggestions: { type: 'array' },
      secondarySuggestions: { type: 'array' },
      textureLayers: { type: 'array' },
      frequencyBalance: { type: 'object' },
    },
  },
  authorizedAgents: ['kappachino_ricky'],
  destructive: false,
  validate: (params) => {
    const errors: string[] = [];
    if (!params.genre) errors.push('genre is required');
    if (!params.mood) errors.push('mood is required');

    if (params.existingInstruments && !Array.isArray(params.existingInstruments)) {
      errors.push('existingInstruments must be an array');
    }

    return { valid: errors.length === 0, errors };
  },
  execute: async (context: ToolExecutionContext, params: any): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      const { genre, mood, existingInstruments = [], arrangementRole } = params;

      // Generate instrument suggestions
      const suggestions = generateInstrumentSuggestions(
        genre,
        mood,
        existingInstruments,
        arrangementRole
      );

      return {
        success: true,
        data: suggestions,
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error in instrumentation suggestion',
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    }
  },
};

// Helper functions for sound generation

function generateGenrePattern(
  genre: string,
  groove: string | undefined,
  complexity: number,
  bpm: number,
  bars: number
): any {
  const stepsPerBar = 16;
  const totalSteps = stepsPerBar * bars;

  let kickPattern = new Array(totalSteps).fill(false);
  let snarePattern = new Array(totalSteps).fill(false);
  let hihatPattern = new Array(totalSteps).fill(false);
  let percussionPattern = new Array(totalSteps).fill(false);

  // Genre-specific patterns
  switch (genre.toLowerCase()) {
    case 'afrofusion':
    case 'afrobeats':
      // Afrobeat pattern: 4-on-floor kick with syncopated snares
      for (let i = 0; i < totalSteps; i += 4) {
        kickPattern[i] = true;
      }
      // Syncopated snares
      const afroSnarePositions = [4, 10, 12];
      afroSnarePositions.forEach((pos) => {
        if (pos < totalSteps) snarePattern[pos] = true;
      });
      // Continuous hi-hats with accents
      for (let i = 0; i < totalSteps; i += 2) {
        hihatPattern[i] = true;
      }
      // Shaker on off-beats
      for (let i = 1; i < totalSteps; i += 2) {
        percussionPattern[i] = true;
      }
      break;

    case 'amapiano':
      // Amapiano: log drum emphasis, kick on 1 and 3
      for (let i = 0; i < totalSteps; i += 8) {
        kickPattern[i] = true;
        kickPattern[i + 4] = true;
      }
      // Clap/snare on 2 and 4
      for (let i = 4; i < totalSteps; i += 8) {
        snarePattern[i] = true;
      }
      // Log drum pattern (syncopated)
      const amapianoLog = [2, 6, 10, 14];
      amapianoLog.forEach((pos) => {
        if (pos < totalSteps) percussionPattern[pos] = true;
      });
      // Hi-hats with swing
      for (let i = 0; i < totalSteps; i++) {
        hihatPattern[i] = i % 2 === 0 || Math.random() > 0.3;
      }
      break;

    case 'trap':
      // Trap: fast hi-hats, 808-style kick
      const trapKickPositions = [0, 8, 10];
      trapKickPositions.forEach((pos) => {
        if (pos < totalSteps) kickPattern[pos] = true;
      });
      // Snare on 5 and 13
      for (let i = 4; i < totalSteps; i += 8) {
        snarePattern[i] = true;
      }
      // Fast hi-hats
      for (let i = 0; i < totalSteps; i++) {
        hihatPattern[i] = true;
      }
      break;

    case 'drill':
      // Drill: sliding 808s, dark snares
      const drillKickPositions = [0, 3, 8, 11];
      drillKickPositions.forEach((pos) => {
        if (pos < totalSteps) kickPattern[pos] = true;
      });
      // Snare with bounce
      for (let i = 4; i < totalSteps; i += 8) {
        snarePattern[i] = true;
        if (i + 1 < totalSteps) snarePattern[i + 1] = Math.random() > 0.5;
      }
      // Hi-hat rolls
      for (let i = 0; i < totalSteps; i++) {
        hihatPattern[i] = i % 4 === 0 || Math.random() > 0.4;
      }
      break;

    default:
      // Default basic pattern
      for (let i = 0; i < totalSteps; i += 4) {
        kickPattern[i] = true;
      }
      for (let i = 4; i < totalSteps; i += 8) {
        snarePattern[i] = true;
      }
      for (let i = 0; i < totalSteps; i += 2) {
        hihatPattern[i] = true;
      }
  }

  // Apply complexity variations
  if (complexity > 5) {
    // Add variations based on complexity
    for (let i = 0; i < totalSteps; i++) {
      if (Math.random() < (complexity - 5) / 20) {
        kickPattern[i] = !kickPattern[i];
      }
    }
  }

  // Calculate swing based on groove template
  let swing = 0.5;
  if (groove === 'heavy') swing = 0.7;
  else if (groove === 'light') swing = 0.3;
  else if (groove === 'straight') swing = 0.0;

  return {
    kickPattern,
    snarePattern,
    hihatPattern,
    percussionPattern,
    swing,
    grooveTemplate: groove || 'standard',
  };
}

function generate808Line(
  key: string,
  scale: string,
  complexity: number,
  slideIntensity: number,
  glideEnabled: boolean,
  bars: number
): any {
  const notes: Array<{ note: string; timing: number; duration: number; velocity: number }> = [];
  const slides: Array<{ fromNote: string; toNote: string; timing: number; duration: number }> = [];

  // Get scale notes
  const scaleNotes = getScaleNotes(key, scale);

  // Generate bass line based on complexity
  const stepsPerBar = 8;
  const totalSteps = stepsPerBar * bars;

  for (let step = 0; step < totalSteps; step++) {
    const bar = Math.floor(step / stepsPerBar);
    const position = step % stepsPerBar;

    // Root note on beat 1
    if (position === 0) {
      notes.push({
        note: scaleNotes[0],
        timing: step * 0.5,
        duration: 1.5,
        velocity: 127,
      });
    }

    // Add complexity based on parameter
    if (complexity > 3 && position === 4) {
      const noteIndex = Math.floor(Math.random() * Math.min(5, scaleNotes.length));
      notes.push({
        note: scaleNotes[noteIndex],
        timing: step * 0.5,
        duration: 1.0,
        velocity: 100 + Math.floor(Math.random() * 27),
      });
    }

    if (complexity > 6 && position === 6) {
      const noteIndex = Math.floor(Math.random() * Math.min(3, scaleNotes.length));
      notes.push({
        note: scaleNotes[noteIndex],
        timing: step * 0.5,
        duration: 0.5,
        velocity: 90 + Math.floor(Math.random() * 37),
      });
    }
  }

  // Add slides if enabled
  if (glideEnabled && slideIntensity > 0) {
    for (let i = 0; i < notes.length - 1; i++) {
      if (Math.random() < slideIntensity) {
        slides.push({
          fromNote: notes[i].note,
          toNote: notes[i + 1].note,
          timing: notes[i].timing + notes[i].duration,
          duration: 0.1,
        });
      }
    }
  }

  return {
    notes,
    slides,
    glideSettings: {
      enabled: glideEnabled,
      intensity: slideIntensity,
      portamentoTime: 50 + slideIntensity * 100,
    },
    envelope: {
      attack: 0.01,
      decay: 0.3,
      attackLevel: 1.0,
      sustainLevel: 0.8,
      release: 0.5,
    },
  };
}

function designSynth(
  soundType: string,
  character: string,
  oscillatorType?: string,
  detune?: number,
  unisonVoices?: number
): any {
  const oscType = oscillatorType || 'sawtooth';
  const det = detune || 0;
  const voices = unisonVoices || 1;

  const oscillators = [
    {
      type: oscType,
      detune: det,
      mix: 1.0,
    },
  ];

  // Add second oscillator for richness
  if (voices > 1) {
    oscillators.push({
      type: oscType === 'sawtooth' ? 'square' : 'sawtooth',
      detune: det + 10,
      mix: 0.5,
    });
  }

  let filter: any = {
    type: 'lowpass',
    frequency: 2000,
    resonance: 2,
  };

  let envelope: any = {
    attack: 0.01,
    decay: 0.3,
    sustain: 0.7,
    release: 0.3,
  };

  // Adjust based on sound type
  switch (soundType.toLowerCase()) {
    case 'lead':
      filter.frequency = 3000;
      filter.resonance = 3;
      envelope.attack = 0.01;
      envelope.decay = 0.2;
      envelope.sustain = 0.8;
      break;
    case 'pad':
      filter.frequency = 1500;
      filter.resonance = 1;
      envelope.attack = 0.5;
      envelope.decay = 0.5;
      envelope.sustain = 0.9;
      envelope.release = 1.0;
      break;
    case 'bass':
      filter.frequency = 800;
      filter.resonance = 4;
      envelope.attack = 0.01;
      envelope.decay = 0.4;
      envelope.sustain = 0.6;
      envelope.release = 0.2;
      break;
    case 'pluck':
      filter.frequency = 4000;
      filter.resonance = 5;
      envelope.attack = 0.001;
      envelope.decay = 0.3;
      envelope.sustain = 0.1;
      envelope.release = 0.3;
      break;
  }

  // Adjust based on character
  switch (character.toLowerCase()) {
    case 'warm':
      filter.frequency *= 0.8;
      filter.resonance *= 0.7;
      break;
    case 'bright':
      filter.frequency *= 1.3;
      filter.resonance *= 1.2;
      break;
    case 'dark':
      filter.frequency *= 0.6;
      filter.resonance *= 0.5;
      break;
    case 'aggressive':
      filter.resonance *= 1.5;
      envelope.attack = 0.001;
      break;
  }

  const effects = [
    {
      type: 'reverb',
      mix: soundType === 'pad' ? 0.4 : 0.1,
      roomSize: soundType === 'pad' ? 0.8 : 0.3,
    },
    {
      type: 'delay',
      mix: soundType === 'lead' ? 0.3 : 0.1,
      time: 0.3,
      feedback: 0.4,
    },
  ];

  return {
    oscillators,
    filter,
    envelope,
    effects,
  };
}

function analyzePatternGroove(
  pattern: any[],
  targetGenre?: string,
  swingAmount: number = 0.5
): any {
  // Analyze pattern characteristics
  const stepCount = pattern.length;
  const activeSteps = pattern.filter((step: any) => step.enabled || step === true).length;
  const density = activeSteps / stepCount;

  // Find pattern repetition
  let repetitionScore = 0;
  for (let i = 0; i < stepCount / 2; i++) {
    if (pattern[i] === pattern[i + stepCount / 2]) {
      repetitionScore++;
    }
  }
  repetitionScore /= stepCount / 2;

  // Generate suggestions
  const suggestions: string[] = [];

  if (density < 0.3) {
    suggestions.push('Consider adding more ghost notes for groove');
  } else if (density > 0.7) {
    suggestions.push('Pattern is dense - consider removing some notes for breathing room');
  }

  if (repetitionScore > 0.8) {
    suggestions.push('Pattern is very repetitive - add variation for interest');
  } else if (repetitionScore < 0.3) {
    suggestions.push('Pattern lacks repetition - add recurring elements for groove');
  }

  // Genre-specific suggestions
  if (targetGenre === 'afrofusion') {
    suggestions.push('Add syncopated off-beat accents for Afrobeat feel');
    suggestions.push('Consider polyrhythmic percussion layers');
  } else if (targetGenre === 'amapiano') {
    suggestions.push('Emphasize log drum on syncopated beats');
    suggestions.push('Add bounce with swing on hi-hats');
  }

  // Adapt pattern with swing
  const adaptedPattern = pattern.map((step: any, index: number) => {
    if (typeof step === 'object') {
      return {
        ...step,
        timingOffset: index % 2 === 1 ? swingAmount * 0.5 : 0,
      };
    }
    return step;
  });

  return {
    grooveAnalysis: {
      density,
      repetitionScore,
      complexity: activeSteps,
    },
    suggestions,
    adaptedPattern,
    swingSettings: {
      amount: swingAmount,
      applyTo: ['hihats', 'percussion'],
    },
  };
}

function generatePercussionPattern(
  genre: string,
  instrument: string,
  complexity: number,
  polyrhythm: boolean
): any {
  const stepsPerBar = 16;
  const pattern = new Array(stepsPerBar).fill(false);
  const velocityMap = new Array(stepsPerBar).fill(80);
  const timingOffset = new Array(stepsPerBar).fill(0);

  switch (instrument.toLowerCase()) {
    case 'shaker':
      // Continuous shaker pattern
      for (let i = 0; i < stepsPerBar; i++) {
        pattern[i] = true;
        velocityMap[i] = 60 + Math.floor(Math.random() * 30);
        timingOffset[i] = (Math.random() - 0.5) * 0.1;
      }
      break;

    case 'conga':
      // Conga pattern with accents
      const congaPattern = [0, 3, 6, 10, 13];
      congaPattern.forEach((pos) => {
        if (pos < stepsPerBar) {
          pattern[pos] = true;
          velocityMap[pos] = pos % 4 === 0 ? 120 : 90;
        }
      });
      break;

    case 'log drum':
      // Log drum with syncopation
      const logPattern = [2, 6, 10, 14];
      logPattern.forEach((pos) => {
        if (pos < stepsPerBar) {
          pattern[pos] = true;
          velocityMap[pos] = 110;
        }
      });
      break;

    case 'talking drum':
      // Talking drum with pitch variation
      const talkPattern = [1, 5, 9, 13];
      talkPattern.forEach((pos) => {
        if (pos < stepsPerBar) {
          pattern[pos] = true;
          velocityMap[pos] = 100 + Math.floor(Math.random() * 20);
          timingOffset[pos] = (Math.random() - 0.5) * 0.15;
        }
      });
      break;
  }

  // Add polyrhythm if enabled
  if (polyrhythm) {
    const polyPattern = [1, 4, 7, 10, 13];
    polyPattern.forEach((pos) => {
      if (pos < stepsPerBar) {
        pattern[pos] = true;
        velocityMap[pos] = Math.max(velocityMap[pos], 70);
      }
    });
  }

  // Add complexity variations
  if (complexity > 5) {
    for (let i = 0; i < stepsPerBar; i++) {
      if (Math.random() < (complexity - 5) / 15) {
        pattern[i] = !pattern[i];
      }
    }
  }

  return {
    pattern,
    velocityMap,
    timingOffset,
    articulation: {
      decay: instrument === 'shaker' ? 0.1 : 0.3,
      sustain: instrument === 'conga' ? 0.2 : 0.1,
    },
  };
}

function generateInstrumentSuggestions(
  genre: string,
  mood: string,
  existingInstruments: string[],
  arrangementRole?: string
): any {
  const genreInstrumentMap: Record<string, string[]> = {
    afrofusion: ['shekere', 'talking drum', 'log drum', 'kalimba', 'horn section', 'rhythm guitar'],
    amapiano: ['log drum', 'bass', 'pads', 'synth leads', 'percussion'],
    trap: ['808 bass', 'hi-hats', 'snare', 'synth leads', 'pads'],
    drill: ['sliding 808', 'dark synth', 'snare', 'melodic elements'],
    rnb: ['electric piano', 'bass', 'guitar', 'strings', 'synth pads'],
  };

  const moodInstrumentMap: Record<string, string[]> = {
    energetic: ['brass', 'percussion', 'synth leads', 'drums'],
    relaxed: ['pads', 'soft piano', 'bass', 'ambient textures'],
    dark: ['sub bass', 'dark synth', 'low percussion', 'atmospheric pads'],
    bright: ['bells', 'plucked strings', 'bright synth', 'percussion'],
  };

  const roleInstrumentMap: Record<string, string[]> = {
    lead: ['synth lead', 'guitar', 'brass', 'vocals'],
    rhythm: ['piano', 'guitar', 'synth chords', 'percussion'],
    texture: ['pads', 'strings', 'ambient textures', 'arpeggios'],
    bass: ['808 bass', 'electric bass', 'sub bass', 'synth bass'],
  };

  // Get base suggestions from genre
  let suggestions = [...(genreInstrumentMap[genre.toLowerCase()] || genreInstrumentMap.afrofusion)];

  // Filter out existing instruments
  suggestions = suggestions.filter((inst) => !existingInstruments.includes(inst));

  // Add mood-based suggestions
  const moodSuggestions = moodInstrumentMap[mood.toLowerCase()] || [];
  moodSuggestions.forEach((inst) => {
    if (!suggestions.includes(inst) && !existingInstruments.includes(inst)) {
      suggestions.push(inst);
    }
  });

  // Add role-based suggestions
  if (arrangementRole) {
    const roleSuggestions = roleInstrumentMap[arrangementRole.toLowerCase()] || [];
    roleSuggestions.forEach((inst) => {
      if (!suggestions.includes(inst) && !existingInstruments.includes(inst)) {
        suggestions.unshift(inst); // Prioritize role-specific
      }
    });
  }

  // Categorize suggestions
  const primarySuggestions = suggestions.slice(0, 3);
  const secondarySuggestions = suggestions.slice(3, 6);
  const textureLayers = suggestions.slice(6);

  // Calculate frequency balance
  const frequencyBalance = {
    low: existingInstruments.filter((i) => ['808 bass', 'bass', 'sub bass'].includes(i)).length,
    mid: existingInstruments.filter((i) => ['piano', 'guitar', 'synth'].includes(i)).length,
    high: existingInstruments.filter((i) => ['hi-hats', 'percussion', 'bells'].includes(i)).length,
  };

  return {
    primarySuggestions,
    secondarySuggestions,
    textureLayers,
    frequencyBalance,
  };
}

function getScaleNotes(key: string, scale: string): string[] {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const keyIndex = notes.indexOf(
    key.charAt(0).toUpperCase() + (key.length > 1 ? key.slice(1) : '')
  );

  const scalePatterns: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10],
  };

  const pattern = scalePatterns[scale.toLowerCase()] || scalePatterns.major;

  return pattern.map((interval) => {
    const noteIndex = (keyIndex + interval) % 12;
    return notes[noteIndex];
  });
}

// Export all Ricky tools
export const rickyTools: ToolDefinition[] = [
  generateDrumPattern,
  generate808Bass,
  designSynthSound,
  analyzeGroove,
  generatePercussion,
  suggestInstrumentation,
];
