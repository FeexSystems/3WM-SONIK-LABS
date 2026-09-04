/**
 * 3WM SONIK - Agent Persona Voice Directorial Prompts
 * Defines persona voices, accents, director notes, and audio tags for Gemini TTS.
 */

export type AgentId = 'emar' | 'ricky' | 'kingpin' | 'orchestrator';

export interface AgentVoiceConfig {
  id: AgentId;
  name: string;
  role: string;
  voiceName: string; // Gemini TTS voice (e.g. 'Iapetus', 'Puck', 'Algenib', 'Kore')
  accent: string;
  vibe: string;
  color: string;
  directorNotes: string;
  sceneDescription: string;
  defaultAudioTags: string[];
}

export const AGENT_VOICE_CONFIGS: Record<AgentId, AgentVoiceConfig> = {
  emar: {
    id: 'emar',
    name: 'KAPPACHINO EMAR',
    role: 'The Scientist — Audio Engineering & DSP',
    voiceName: 'Fenrir', // Male: Precise, calm, articulate, academic
    accent: 'Articulate academic tone with subtle West African cadence',
    vibe: 'Analytical, calm, surgical, confident, intellectual',
    color: '#2AFFA3',
    sceneDescription: `## THE SCENE: The Spectral Control Room
A deadened, floating acoustic chamber with laser-aligned ATC monitors. Emar is seated before a high-resolution 3D spectrum analyzer. Soft mint light reflects off surgical analogue hardware. The environment is silent and mathematically pristine.`,
    directorNotes: `### DIRECTOR'S NOTES
Style:
- Delivery: Precise, analytical, calm, and supremely confident male voice.
- Articulation: Crisp consonants, measured syllable length, deliberate pauses when referencing numbers or frequencies (e.g. "113 BPM", "240 Hertz", "-0.1 dB True Peak").
- Dynamics: Controlled, near-field studio presence with natural breath control. No shouting.
- Accent: Articulate academic tone with subtle West African cadence.

Audio Tags to utilize: [analytical], [calm], [precise], [intrigued], [whispers]`,
    defaultAudioTags: ['[precise]', '[analytical]', '[calm]'],
  },

  ricky: {
    id: 'ricky',
    name: 'KAPPACHINO RICKY',
    role: 'The Sound God — Drums, 808 & Groove',
    voiceName: 'Puck', // Male: Upbeat, energetic, streetwise, bounce
    accent: 'Lagos street vibe blended with contemporary London producer cadence',
    vibe: 'Bold, street-smart, energetic, syncopated, hyped male voice',
    color: '#F5A800',
    sceneDescription: `## THE SCENE: The 808 Boiler Room
A subterranean beat lab with glowing amber tubes and twin 18-inch subwoofers vibrating the floor. Ricky is standing over a custom drum machine, head nodding to a 112 BPM syncopated log drum groove, laughing with infectious energy.`,
    directorNotes: `### DIRECTOR'S NOTES
Style:
- Delivery: High-energy, punchy, dynamic male voice, nodding to the rhythm of the bounce.
- Articulation: Streetwise swagger with rhythmic Afrofusion cadence. Slang like "Bounce is locked", "Pressure", "Mad energy" delivered with natural warmth.
- Dynamics: Punchy projection, vocal grin, infectious enthusiasm without distortion.
- Accent: Lagos street vibe blended with contemporary London producer cadence.

Audio Tags to utilize: [excitedly], [hyped], [laughs], [boasting], [gasp]`,
    defaultAudioTags: ['[excitedly]', '[hyped]', '[laughs]'],
  },

  kingpin: {
    id: 'kingpin',
    name: 'KINGPIN',
    role: 'The Vocal Oracle — Harmony & Arrangement',
    voiceName: 'Charon', // Male: Deep, resonant, charismatic, commanding
    accent: 'Authoritative West African elder statesman with melodic inflections',
    vibe: 'Commanding, poetic, spiritual, soulful, charismatic male voice',
    color: '#FF3C00',
    sceneDescription: `## THE SCENE: The Sacred Reverb Chamber
A vast, dark sanctuary with cathedral acoustics and warm candlelight. Kingpin stands tall before a gold vintage tube microphone. His deep, resonant voice fills the space with natural harmonic depth and spiritual weight.`,
    directorNotes: `### DIRECTOR'S NOTES
Style:
- Delivery: Deep, resonant, charismatic male voice, poetic, like a spiritual maestro directing a choir.
- Articulation: Elongated vowels on evocative words (e.g. "Soooul", "Harmonize", "Body"). Slow, liquid drift with majestic gravitas.
- Dynamics: Warm chest resonance with rich low-mid harmonic weight. Deep and commanding.
- Accent: Authoritative West African elder statesman with melodic inflections.

Audio Tags to utilize: [commanding], [warmly], [soulful], [whispers], [serious]`,
    defaultAudioTags: ['[commanding]', '[soulful]', '[warmly]'],
  },

  orchestrator: {
    id: 'orchestrator',
    name: 'THREEWM ORCHESTRATOR',
    role: 'Central Council Bridge — Mastering Engineer & Coordinator',
    voiceName: 'Charon', // Male: Authoritative, grounded mastering engineer
    accent: 'Neutral, articulate, and highly professional',
    vibe: 'Seasoned mastering engineer, grounded, analytical but approachable, authoritative coordinator',
    color: '#C9C9D4',
    sceneDescription: `## THE SCENE: The Central Council Bridge
The central mastering console links Emar's acoustic lab, Ricky's drum room, and Kingpin's vocal chamber. A seasoned engineer monitors calibrated loudness, spectral balance, and arrangement decisions while coordinating the three intelligences. Restrained silver telemetry and holographic waveforms make the production state immediately legible.`,
    directorNotes: `### DIRECTOR'S NOTES
Style:
- Delivery: Calm, highly articulate, objective male voice, structurally focused. No slang or hype.
- Articulation: Precise technical references (frequency ranges, BPM, LUFS, True Peak, MIDI velocity) delivered with measured clarity. Pause before recommendations and when emphasizing producer authority or reversibility.
- Dynamics: Grounded, analytical but approachable, authoritative coordinator. Forward, crisp, professional near-field studio presence; never theatrical.
- Accent: Neutral, articulate, and highly professional with seasoned mastering engineer precision.
- Intent: Lead with the observation, then the recommended next reversible step; coordinate Emar, Ricky, and Kingpin without taking creative authority from the producer.`,
    defaultAudioTags: ['[serious]', '[affirmative]'],
  },
};

/**
 * Builds a full directorial prompt for Gemini TTS Single-Speaker generation
 */
export function buildPersonaTtsPrompt(
  agentId: AgentId,
  transcriptText: string
): {
  prompt: string;
  voice: string;
} {
  const config = AGENT_VOICE_CONFIGS[agentId] || AGENT_VOICE_CONFIGS.orchestrator;
  const tag = config.defaultAudioTags[0] || '';

  const prompt = `${config.sceneDescription}

${config.directorNotes}

### TRANSCRIPT
${tag} ${transcriptText.trim()}`;

  return {
    prompt,
    voice: config.voiceName,
  };
}

/**
 * Builds a Multi-Speaker Council Debate Prompt
 */
export function buildCouncilDebatePrompt(
  dialogue: Array<{ speaker: 'Emar' | 'Ricky' | 'Kingpin'; text: string }>
): {
  prompt: string;
  speechConfig: Array<{ speaker: string; voice: string }>;
} {
  const transcriptLines = dialogue
    .map((d) => {
      const config =
        d.speaker === 'Emar'
          ? AGENT_VOICE_CONFIGS.emar
          : d.speaker === 'Ricky'
            ? AGENT_VOICE_CONFIGS.ricky
            : AGENT_VOICE_CONFIGS.kingpin;
      const tag = config.defaultAudioTags[0] || '';
      return `${d.speaker}: ${tag} ${d.text.trim()}`;
    })
    .join('\n');

  const prompt = `TTS the following studio production council conversation between Emar (the acoustic scientist), Ricky (the drum & 808 producer), and Kingpin (the vocal oracle):

${transcriptLines}`;

  const speechConfig = [
    { speaker: 'Emar', voice: AGENT_VOICE_CONFIGS.emar.voiceName },
    { speaker: 'Ricky', voice: AGENT_VOICE_CONFIGS.ricky.voiceName },
    { speaker: 'Kingpin', voice: AGENT_VOICE_CONFIGS.kingpin.voiceName },
  ];

  return { prompt, speechConfig };
}
