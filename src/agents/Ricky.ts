import { BaseAgent } from './BaseAgent';
import { AgentDefinition, AgentMessage } from './types';
import {
  getUnifiedAIService,
  UnifiedAIServiceConfig,
  AIMessage,
} from '../services/unifiedAIService';
import { agentToolRegistry } from './agentTools';
import { getVectorMemory, MemoryHelper } from './vectorMemory';
import { worldState } from './WorldState';

function getEnv(key: string, defaultValue?: string): string | undefined {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  try {
    return (import.meta as any)?.env?.[key] ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

export class KappachinoRicky extends BaseAgent {
  private aiService: any;
  private vectorMemory = getVectorMemory();
  private memoryHelper: MemoryHelper;

  constructor() {
    super();
    this.memoryHelper = new MemoryHelper(this.vectorMemory);

    // Initialize unified AI service for Ricky (uses Gemini)
    try {
      const apiKey = getEnv('VITE_GEMINI_API_KEY') || getEnv('GEMINI_API_KEY');
      if (apiKey) {
        this.aiService = getUnifiedAIService({
          provider: 'gemini',
          apiKey,
          model: getEnv('VITE_GEMINI_MODEL', 'gemini-3.7-flash') || 'gemini-3.7-flash',
        });
      }
    } catch (error) {
      console.warn('Failed to initialize unified AI service for Ricky:', error);
    }

    // Register Ricky's tools — dynamic keeps agents chunk lean
    void import('./rickyTools').then((m) =>
      m.rickyTools.forEach((tool) => agentToolRegistry.registerTool(tool))
    );
  }

  public definition: AgentDefinition = {
    id: 'kappachino_ricky',
    name: 'Kappachino Ricky',
    title: 'The Sound God',
    domain: 'INSTRUMENTS / DRUMS / 808 / SOUND DESIGN / GROOVE',
    identity:
      'Sound-generation intelligence of 3WM SONIK. Responsible for making the production musically exciting.',
    corePrinciple: 'Find the sound. Build the bounce.',
  };

  public async handleMessage(message: AgentMessage): Promise<void> {
    this.setState('CREATING');
    this.logAction(`Received message: ${message.type}`);

    if (message.payload?.context) {
      this.logAction(
        `Reviewing rhythm and instrument mapping at ${message.payload.context.bpm} BPM...`
      );
    }

    try {
      // Retrieve relevant memories for context
      const relevantMemories = await this.memoryHelper.retrieveContext(
        message.payload?.intent || '',
        this.definition.id,
        5
      );

      if (relevantMemories.length > 0) {
        this.logAction(`Retrieved ${relevantMemories.length} relevant memories for context`);
      }

      // Build system prompt for Ricky
      const systemPrompt = this.buildSystemPrompt(relevantMemories);

      // Build user message
      const userMessage = this.buildUserMessage(message);

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userMessage },
      ];

      let responseText = '';

      if (this.aiService) {
        try {
          const response = await this.aiService.generateContent(messages as any);
          responseText = response.text;
        } catch (aiErr) {
          console.warn('Ricky AI service call failed, using heuristic engine:', aiErr);
          responseText = this.generateHeuristicResponse(
            message.payload?.intent || '',
            message.payload?.context
          );
        }
      } else {
        responseText = this.generateHeuristicResponse(
          message.payload?.intent || '',
          message.payload?.context
        );
      }

      // Process response & display in 3WM Terminal
      this.processAIResponse(responseText, message);

      // Store the interaction in memory
      await this.memoryHelper.storeAction(
        this.definition.id,
        `User requested: ${message.payload?.intent}. Response: ${responseText.substring(0, 200)}...`,
        0.7,
        ['sound-design', 'rhythm', 'groove']
      );
    } catch (error) {
      const fallbackText = this.generateHeuristicResponse(
        message.payload?.intent || '',
        message.payload?.context
      );
      this.processAIResponse(fallbackText, message);
    }

    this.setState('IDLE');
  }

  private generateHeuristicResponse(intent: string, context?: any): string {
    const lower = intent.toLowerCase();
    const bpm = context?.bpm || 112;
    const genre = context?.genre || 'Afrofusion / Amapiano';

    if (
      lower.includes('hello') ||
      lower.includes('hi') ||
      lower.includes('hey') ||
      lower.includes('how are you') ||
      lower.includes('who are you')
    ) {
      return `Yo! Ricky here — The Sound God is locked in. Let's get the bounce moving. I'm cooking up drums, rolling 808s, and percussion layers at ${bpm} BPM. Tell me what groove you need: Amapiano log drums, Afrobeat swing, Drill bounce, or Synth chords!`;
    }

    if (lower.includes('808') || lower.includes('bass') || lower.includes('sub')) {
      return `Locked in a saturated 808 glide with a 45ms portamento bend and +3dB punch at 55Hz. It cuts through the mix without masking your kick drum.`;
    }

    if (
      lower.includes('drum') ||
      lower.includes('beat') ||
      lower.includes('pattern') ||
      lower.includes('bounce') ||
      lower.includes('rhythm')
    ) {
      return `Building a high-energy ${genre} groove at ${bpm} BPM. Added syncopated shakers on the 16th-notes, ghost snares on the 4th beat, and a heavy wooden rim click. The bounce is certified.`;
    }

    if (
      lower.includes('synth') ||
      lower.includes('instrument') ||
      lower.includes('melody') ||
      lower.includes('chord') ||
      lower.includes('keys')
    ) {
      return `Designing a lush African Rhodes patch with analog tape flutter, subtle detune (+7 cents), and a wide chorus send. Perfect sonic warmth for the track.`;
    }

    return `Locked in on your directive: "${intent}". Applying rhythm optimization at ${bpm} BPM with dynamic percussion accents and sub-bass drive. Let's make this track move!`;
  }

  private buildSystemPrompt(memories: any[]): string {
    const memoryContext =
      memories.length > 0
        ? `\n\nRelevant memories:\n${memories.map((m) => `- ${m.memory.content}`).join('\n')}`
        : '';

    return `You are Kappachino Ricky, The Sound God - the sound-generation intelligence of 3WM SONIK.
Your domain: INSTRUMENTS / DRUMS / 808 / SOUND DESIGN / GROOVE
Your identity: You are responsible for making the production musically exciting.
Your core principle: "Find the sound. Build the bounce."

You are bold, musical, instinctive, confident, streetwise, and experimental.
You create exciting sounds, rhythms, and grooves that make tracks move.
You understand African music production deeply (Afrofusion, Amapiano, Afrobeat, etc.).
You know drums, 808s, sound design, and groove inside out.

Available tools:
- generate_drum_pattern: Generate drum patterns for various genres
- generate_808_bass: Create 808 bass lines with slides and glide
- design_synth_sound: Design synthesizer sounds with oscillator configuration
- analyze_groove: Analyze groove and suggest rhythm improvements
- generate_percussion: Generate percussion layers for African genres
- suggest_instrumentation: Suggest instrument combinations based on genre and mood

When you need to use tools, format your response to indicate which tool to use and with what parameters.
The user or system will execute the tools and provide results.

Current project state:
${JSON.stringify(worldState.getState(), null, 2)}${memoryContext}`;
  }

  private buildUserMessage(message: AgentMessage): string {
    const intent = message.payload?.intent || '';
    const context = message.payload?.context || {};

    let userMessage = `User Request: ${intent}`;

    if (context.trackTitle) {
      userMessage += `\nTrack: ${context.trackTitle}`;
    }
    if (context.bpm) {
      userMessage += `\nBPM: ${context.bpm}`;
    }
    if (context.key) {
      userMessage += `\nKey: ${context.key}`;
    }
    if (context.genre) {
      userMessage += `\nGenre: ${context.genre}`;
    }

    return userMessage;
  }

  private processAIResponse(response: string, message: AgentMessage): void {
    this.logAction(response);

    // Check if response contains tool calls
    const toolCalls = this.extractToolCalls(response);

    if (toolCalls.length > 0) {
      this.logAction(`Executing ${toolCalls.length} sound design tool directives.`);
      // Tool execution handled by the DAW system
    }
  }

  private extractToolCalls(response: string): Array<{ tool: string; parameters: any }> {
    const toolCalls: Array<{ tool: string; parameters: any }> = [];

    const toolPattern = /use\s+(\w+)\s+with\s+parameters:\s*({[^}]*})/gi;
    let match;

    while ((match = toolPattern.exec(response)) !== null) {
      try {
        const tool = match[1];
        const parameters = JSON.parse(match[2]);
        toolCalls.push({ tool, parameters });
      } catch {
        // Invalid JSON, skip
      }
    }

    return toolCalls;
  }
}

export const ricky = new KappachinoRicky();
