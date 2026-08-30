import { BaseAgent } from './BaseAgent';
import { AgentDefinition, AgentMessage } from './types';
import { getUnifiedAIService, AIMessage } from '../services/unifiedAIService';
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

export class KappachinoEmar extends BaseAgent {
  private aiService: ReturnType<typeof getUnifiedAIService> | null = null;
  private vectorMemory = getVectorMemory();
  private memoryHelper: MemoryHelper;

  constructor() {
    super();
    this.memoryHelper = new MemoryHelper(this.vectorMemory);

    // Initialize unified AI service for Emar (uses Gemini)
    try {
      const apiKey = getEnv('VITE_GEMINI_API_KEY') || getEnv('GEMINI_API_KEY');
      if (apiKey) {
        this.aiService = getUnifiedAIService({
          provider: 'gemini',
          apiKey,
          model: getEnv('VITE_GEMINI_MODEL', 'gemini-3.7-flash') ?? 'gemini-3.7-flash',
        });
      }
    } catch (error) {
      console.warn('Failed to initialize unified AI service for Emar:', error);
    }

    // Register Emar's tools — dynamic import keeps agents chunk lean (was 1.73M eager)
    void import('./emarTools').then((m) =>
      m.emarTools.forEach((tool) => agentToolRegistry.registerTool(tool))
    );
  }

  public definition: AgentDefinition = {
    id: 'kappachino_emar',
    name: 'Kappachino Emar',
    title: 'The Scientist',
    domain: 'AUDIO ENGINEERING / DSP / MIXING / MASTERING / ACOUSTICS',
    identity:
      'Technical intelligence of 3WM SONIK. Understands music as a physical, mathematical, acoustic and signal-processing system.',
    corePrinciple: 'Understand the sound. Control the system.',
  };

  public async handleMessage(message: AgentMessage): Promise<void> {
    this.setState('ANALYZING');
    this.logAction(`Received message: ${message.type}`);

    const context = message.payload?.context as Record<string, string | number> | undefined;
    if (context) {
      this.logAction(`Analyzing DSP chain and mix settings for: ${context.trackTitle}`);
    }

    try {
      // Retrieve relevant memories for context
      const intent = (message.payload?.intent as string) ?? '';
      const relevantMemories = await this.memoryHelper.retrieveContext(
        intent,
        this.definition.id,
        5
      );

      if (relevantMemories.length > 0) {
        this.logAction(`Retrieved ${relevantMemories.length} relevant memories for context`);
      }

      // Build system prompt for Emar
      const systemPrompt = this.buildSystemPrompt(relevantMemories);

      // Build user message
      const userMessage = this.buildUserMessage(message);

      // Call AI API using unified service
      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ];

      if (!this.aiService) return;
      const response = await this.aiService.generateContent(messages);

      // Process response
      this.processAIResponse(response.text, message);

      // Store the interaction in memory
      const requestedIntent = (message.payload?.intent as string) ?? '';
      await this.memoryHelper.storeObservation(
        this.definition.id,
        `User requested: ${requestedIntent}. Response: ${response.text.substring(0, 200)}...`,
        0.7,
        ['dsp', 'mixing', 'analysis']
      );
    } catch (error) {
      this.logAction(
        `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      this.setState('ERROR');
    }

    this.setState('IDLE');
  }

  private buildSystemPrompt(memories: { memory: { content: string } }[]): string {
    const memoryContext =
      memories.length > 0
        ? `\n\nRelevant memories:\n${memories.map((m) => `- ${m.memory.content}`).join('\n')}`
        : '';

    return `You are Kappachino Emar, The Scientist - the technical intelligence of 3WM SONIK.
Your domain: AUDIO ENGINEERING / DSP / MIXING / MASTERING / ACOUSTICS
Your identity: You understand music as a physical, mathematical, acoustic and signal-processing system.
Your core principle: "Understand the sound. Control the system."

You are precise, analytical, technical, calm, confident, and experimental.
You provide detailed technical analysis and solutions for audio engineering challenges.
You understand DSP, mixing, mastering, acoustics, and music theory at a professional level.
You are focused on African music production (Afrofusion, Amapiano, etc.) but understand all genres.

Available tools:
- analyze_frequency_spectrum: Analyze frequency content and balance
- analyze_dynamics: Analyze dynamic range and compression
- analyze_stereo_imaging: Analyze stereo width and phase
- analyze_harmonics: Analyze harmonic content and distortion
- suggest_eq_settings: Suggest EQ based on analysis

When you need to use tools, format your response to indicate which tool to use and with what parameters.
The user or system will execute the tools and provide results.

Current project state:
${JSON.stringify(worldState.getState(), null, 2)}${memoryContext}`;
  }

  private buildUserMessage(message: AgentMessage): string {
    const intent = (message.payload?.intent as string) ?? '';
    const context = (message.payload?.context as Record<string, string | number>) ?? {};

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
    if (message.payload?.audioBase64 as string | undefined) {
      userMessage += `\n[Audio data provided for analysis]`;
    }

    return userMessage;
  }

  private processAIResponse(response: string, _message: AgentMessage): void {
    this.logAction(`AI Response: ${response.substring(0, 200)}...`);

    // Check if response contains tool calls
    const toolCalls = this.extractToolCalls(response);

    if (toolCalls.length > 0) {
      this.logAction(`Detected ${toolCalls.length} tool calls in response`);
      // Tool execution would be handled by the orchestrator or system
    }
  }

  private extractToolCalls(
    response: string
  ): { tool: string; parameters: Record<string, unknown> }[] {
    // Simple extraction - in production would use more Sophisticated parsing
    const toolCalls: { tool: string; parameters: Record<string, unknown> }[] = [];

    // Look for patterns like "use tool_name with parameters: {...}"
    const toolPattern = /use\s+(\w+)\s+with\s+parameters:\s*({[^}]*})/gi;
    let match;

    while ((match = toolPattern.exec(response)) !== null) {
      try {
        const tool = match[1] as string;
        const parameters = JSON.parse(match[2]) as Record<string, unknown>;
        toolCalls.push({ tool, parameters });
      } catch {
        // Invalid JSON, skip
      }
    }

    return toolCalls;
  }
}

export const emar = new KappachinoEmar();
