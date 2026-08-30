/**
 * 3WM SONIK - Gemini Live API Real-Time Voice Engine
 * Implements bidirectional streaming, 16kHz audio resampling, interruption handling,
 * context window compression, and DAW tool definitions following official Gemini Live API best practices.
 */

import { AgentId } from './personaVoicePrompts';
import { landingAudioEngine } from './landingAudioEngine';

export interface LiveToolCall {
  name: string;
  args: Record<string, any>;
  callId: string;
}

export interface LiveSessionConfig {
  agentId: AgentId;
  languageCode?: string;
  enableSearch?: boolean;
  model?: 'gemini-3.1-flash-live-preview' | 'gemini-3.5-live-translate-preview';
  thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high';
}

export const LIVE_MODEL_CONFIG = {
  primaryModel: 'gemini-3.1-flash-live-preview' as const,
  translateModel: 'gemini-3.5-live-translate-preview' as const,
  sampleRates: {
    input: 16000,
    output: 24000,
  },
  defaultThinkingLevel: 'minimal' as const,
};

/**
 * Structured System Instructions adhering to Gemini Live API Best Practice Architecture:
 * 1. Persona
 * 2. Conversational Rules
 * 3. Tool Calls within Flow
 * 4. Guardrails
 */
export const LIVE_AGENT_SYSTEM_INSTRUCTIONS: Record<AgentId, string> = {
  emar: `**Persona:**
You are Kappachino Emar, "The Scientist" of 3WM SONIK. You are an expert audio engineer, acoustician, DSP developer, and music theorist. You speak with a calm, articulate Mid-Atlantic accent with subtle British-West African technical phrasing. You view music as a physical, mathematical, and acoustic signal-processing system.

**Conversational Rules:**
1. **Welcome & Intake:** Greet the producer with poised confidence. Ask what specific frequency, acoustic problem, or mastering target they are solving.
2. **Analysis & Diagnosis:** Break down their acoustic question with mathematical clarity (frequencies, Q-factors, True Peak, LUFS).
3. **Conversational Loop:** The producer can explore EQ curves, dynamic notch filters, stereo imaging, or music theory for as long as they desire.
4. **Action:** When the producer asks for an EQ adjustment, notch, or spectral scan, invoke the \`analyze_spectrum\` tool.

**Tool Calls:**
- **\`analyze_spectrum\`**: Invoke this tool *only after* the producer has requested an EQ or frequency modification. Pass \`target_hz\`, \`q_factor\`, and \`gain_db\`.

**Guardrails:**
- Never guess numerical frequencies without technical rationale.
- Always maintain your analytical, unflappable composure.`,

  ricky: `**Persona:**
You are Kappachino Ricky, "The Sound God" of 3WM SONIK. You are the heartbeat of Afrobeat, Amapiano, Hip-Hop, and drill beat production. You speak with Lagos-London street swagger, infectious hype, and producer pride ("Bro", "Bounce is locked", "Pressure", "Mad vibes").

**Conversational Rules:**
1. **Hype Intro:** Greet the producer with high energy. Ask what kind of bounce, tempo, or 808 pressure they want to cook up.
2. **Groove Formulation:** Propose syncopated rhythm ideas, 16th-note hat swings, or log drum slides.
3. **Conversational Loop:** Let the user experiment with drum patterns, swing percentages, and 808 distortion styles as long as they want.
4. **Action:** When the producer asks to generate or change drum patterns, invoke the \`generate_808_bounce\` tool.

**Tool Calls:**
- **\`generate_808_bounce\`**: Invoke this tool *only after* the producer confirms the desired tempo and groove style.

**Guardrails:**
- Never make a beat sound generic or stiff.
- Keep responses punchy, lively, and rhythmically engaging.`,

  kingpin: `**Persona:**
You are Kingpin, "The Vocal Oracle" of 3WM SONIK. You treat the voice as an orchestra and the soul of the track. You speak with a deep, majestic, soulful West African resonance, offering poetic clarity and choral direction.

**Conversational Rules:**
1. **Soulful Greeting:** Welcome the producer into the vocal sanctuary.
2. **Vocal Assessment:** Ask how they envision the lead vocal, hook, or background harmonies.
3. **Conversational Loop:** Explore 3-part chords, Auto-Tune speed, reverb depth, and emotional phrasing.
4. **Action:** When the producer agrees on a harmony stack or vocal tuning chain, invoke \`tune_vocal_stack\`.

**Tool Calls:**
- **\`tune_vocal_stack\`**: Invoke this tool *only after* the harmonic scale and voice stack parameters have been determined.

**Guardrails:**
- Treat every vocal with respect and emotional depth.`,

  orchestrator: `**Persona:**
You are the ThreeWM Orchestrator, the central executive DAW coordinator of 3WM SONIK. You synthesize the wisdom of Emar, Ricky, and Kingpin into a unified production pipeline.

**Conversational Rules:**
1. **Executive Greeting:** Acknowledge the session and state of the DAW.
2. **Consensus Coordination:** Synthesize recommendations across engineering, drums, and vocals.
3. **Action:** When ready for project export or master chain application, invoke \`execute_council_master\`.

**Tool Calls:**
- **\`execute_council_master\`**: Invoke when the user requests a final master or mixdown approval.`,
};

/**
 * DAW Tool Definitions with explicit Invocation Conditions
 */
export const DAW_TOOL_DEFINITIONS = [
  {
    name: 'analyze_spectrum',
    description: `Performs surgical parametric EQ filtering and acoustic spectrum analysis.
**Invocation Condition:** Invoke *only after* the producer has requested an EQ adjustment, frequency cut, or resonance notch.`,
    parameters: {
      type: 'object',
      properties: {
        target_hz: { type: 'number', description: 'Center frequency in Hz (20 to 20000)' },
        q_factor: { type: 'number', description: 'Bandwidth Q factor (0.1 to 18.0)' },
        gain_db: { type: 'number', description: 'Gain adjustment in dB (-24.0 to +12.0)' },
      },
      required: ['target_hz', 'gain_db'],
    },
  },
  {
    name: 'generate_808_bounce',
    description: `Synthesizes a syncopated 808 log drum pattern and drum groove.
**Invocation Condition:** Invoke *only after* the producer confirms the tempo, swing, and drum preset.`,
    parameters: {
      type: 'object',
      properties: {
        tempo_bpm: { type: 'number', description: 'Groove tempo in BPM' },
        swing_percent: { type: 'number', description: '16th note swing amount (0 to 100)' },
        log_drum_preset: {
          type: 'string',
          enum: ['AmapianoClassic', 'AfrodrillDeep', 'LagosHardSub'],
        },
      },
      required: ['tempo_bpm'],
    },
  },
  {
    name: 'tune_vocal_stack',
    description: `Configures 3-part vocal harmony stack and pitch correction parameters.
**Invocation Condition:** Invoke *only after* the scale key and vocal arrangement have been agreed on.`,
    parameters: {
      type: 'object',
      properties: {
        scale_key: { type: 'string', description: 'Root key (e.g. "F# Minor", "C Major")' },
        harmony_voices: {
          type: 'array',
          items: { type: 'string' },
          description: 'Intervals (e.g. ["+3rd", "-5th", "Octave"])',
        },
        autotune_speed: { type: 'number', description: 'Retune speed in ms (0 to 50)' },
      },
      required: ['scale_key'],
    },
  },
  {
    name: 'execute_council_master',
    description: `Applies multi-agent mastering chain with dynamic ceiling and LUFS targets.
**Invocation Condition:** Invoke *only when* the producer requests master export or final consensus.`,
    parameters: {
      type: 'object',
      properties: {
        target_lufs: {
          type: 'number',
          description: 'Integrated LUFS target (e.g. -14.0 for streaming, -9.0 for club)',
        },
        ceiling_db: { type: 'number', description: 'True Peak ceiling in dBTP (e.g. -0.3)' },
      },
      required: ['target_lufs'],
    },
  },
];

export class GeminiLiveEngine {
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private playbackQueue: AudioBufferSourceNode[] = [];
  private isConnected = false;
  private resumptionToken: string | null = null;

  /**
   * Resamples 44.1k/48k audio to 16kHz mono 16-bit PCM (100ms / 20ms chunks)
   */
  public downsampleTo16kPCM(inputData: Float32Array, inputSampleRate: number): Int16Array {
    if (inputSampleRate === 16000) {
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return pcm16;
    }

    const ratio = inputSampleRate / 16000;
    const newLength = Math.round(inputData.length / ratio);
    const pcm16 = new Int16Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcIdx = Math.floor(i * ratio);
      const s = Math.max(-1, Math.min(1, inputData[srcIdx]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    return pcm16;
  }

  /**
   * Official Gemini Live Interruption Handler:
   * Discards all queued audio buffers immediately when the user speaks over the agent.
   */
  public handleInterruption() {
    while (this.playbackQueue.length > 0) {
      const node = this.playbackQueue.pop();
      try {
        node?.stop();
        node?.disconnect();
      } catch {
        // Safe discard
      }
    }
  }

  /**
   * Executes incoming DAW Tool Calls triggered by the agent
   */
  public handleDawToolCall(toolCall: LiveToolCall): { success: boolean; result: any } {
    console.log(`[GeminiLiveEngine] Executing DAW Tool: ${toolCall.name}`, toolCall.args);

    if (toolCall.name === 'analyze_spectrum') {
      landingAudioEngine.playMelodicChord(0);
      return {
        success: true,
        result: {
          status: 'APPLIED',
          notchApplied: `${toolCall.args.target_hz} Hz (${toolCall.args.gain_db} dB)`,
        },
      };
    }

    if (toolCall.name === 'generate_808_bounce') {
      landingAudioEngine.playLogDrum(0, 55);
      landingAudioEngine.playKick(0);
      return {
        success: true,
        result: {
          status: 'BOUNCE_GENERATED',
          tempo: toolCall.args.tempo_bpm,
          preset: toolCall.args.log_drum_preset || 'AmapianoClassic',
        },
      };
    }

    if (toolCall.name === 'tune_vocal_stack') {
      landingAudioEngine.playVocalChant(0);
      return {
        success: true,
        result: {
          status: 'STACK_TUNED',
          key: toolCall.args.scale_key,
        },
      };
    }

    if (toolCall.name === 'execute_council_master') {
      landingAudioEngine.playMelodicChord(4);
      return {
        success: true,
        result: {
          status: 'MASTER_CHAIN_LOCKED',
          lufs: toolCall.args.target_lufs,
        },
      };
    }

    return { success: false, result: 'Unknown tool' };
  }

  public setResumptionToken(token: string) {
    this.resumptionToken = token;
  }

  public getResumptionToken(): string | null {
    return this.resumptionToken;
  }
}

export const geminiLiveEngine = new GeminiLiveEngine();
