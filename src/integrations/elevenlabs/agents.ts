// Client-safe entry point for ElevenLabs Conversational Agents
// Does not expose secret keys.

export const AGENT_IDS = {
  EMAR: process.env.VITE_ELEVENLABS_AGENT_EMAR || '',
  RICKY: process.env.VITE_ELEVENLABS_AGENT_RICKY || '',
  KINGPIN: process.env.VITE_ELEVENLABS_AGENT_KINGPIN || '',
};
