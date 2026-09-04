export const councilTools = [
  {
    functionDeclarations: [
      {
        name: 'adjustDspParameters',
        description:
          'Adjust audio engineering parameters (lowCut, highCut, compressionThreshold, saturation, reverb, stereoWidth). Used by Kappachino Emar.',
        parameters: {
          type: 'OBJECT',
          properties: {
            lowCut: { type: 'NUMBER', description: 'Low cut frequency in Hz (20 - 500)' },
            highCut: { type: 'NUMBER', description: 'High cut frequency in Hz (2000 - 20000)' },
            compressionThreshold: { type: 'NUMBER', description: 'Threshold in dB (-60 to 0)' },
            saturation: { type: 'NUMBER', description: 'Tape/tube saturation (0.0 to 1.0)' },
            reverb: { type: 'NUMBER', description: 'Reverb wet amount (0.0 to 1.0)' },
          },
          required: [],
        },
      },
      {
        name: 'generateDrumGroove',
        description:
          'Generate Afrobeat / Amapiano / Drill drum patterns, log drums, and 808s. Used by Kappachino Ricky.',
        parameters: {
          type: 'OBJECT',
          properties: {
            genre: {
              type: 'STRING',
              enum: ['Afrobeats', 'Amapiano', 'Afro-Drill', 'Highlife', 'Afro-House'],
            },
            bpm: { type: 'NUMBER', description: 'Tempo BPM (80 - 140)' },
            swing: { type: 'NUMBER', description: 'Groove swing percentage (0 - 100)' },
            patternDensity: { type: 'STRING', enum: ['sparse', 'medium', 'heavy', 'syncopated'] },
          },
          required: ['genre', 'bpm'],
        },
      },
      {
        name: 'arrangeVocalHarmonies',
        description:
          'Generate vocal stack harmonies, formants, pitch corrections, and vocal chops. Used by Kingpin.',
        parameters: {
          type: 'OBJECT',
          properties: {
            key: { type: 'STRING', description: 'Musical key (e.g. A minor, C major)' },
            harmonyStyle: {
              type: 'STRING',
              enum: ['call_and_response', '3_part_gospel', 'ambient_choral', 'lead_doubler'],
            },
            formantShift: { type: 'NUMBER', description: 'Formant semitone shift (-12 to +12)' },
          },
          required: ['key', 'harmonyStyle'],
        },
      },
    ],
  },
];
