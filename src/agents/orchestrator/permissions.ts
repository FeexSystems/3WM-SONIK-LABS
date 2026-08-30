export type AgentRole = 'EMAR' | 'RICKY' | 'KINGPIN';

export interface ToolDefinition {
  name: string;
  allowedRoles: AgentRole[];
  requiresApproval: boolean;
}

export const TOOL_PERMISSIONS: Record<string, ToolDefinition> = {
  analyzeVocalMasking: {
    name: 'analyzeVocalMasking',
    allowedRoles: ['EMAR', 'RICKY', 'KINGPIN'],
    requiresApproval: false,
  },
  stageEQAdjustment: {
    name: 'stageEQAdjustment',
    allowedRoles: ['EMAR', 'RICKY', 'KINGPIN'], // Anyone can suggest
    requiresApproval: true, // Orchestrator stages it
  },
  generateBeatVariation: {
    name: 'generateBeatVariation',
    allowedRoles: ['RICKY'],
    requiresApproval: false, // Generates a job, doesn't touch timeline directly
  },
  generateSoundEffect: {
    name: 'generateSoundEffect',
    allowedRoles: ['RICKY'],
    requiresApproval: false,
  },
  isolateVoice: {
    name: 'isolateVoice',
    allowedRoles: ['KINGPIN'],
    requiresApproval: false,
  },
  transformVoice: {
    name: 'transformVoice',
    allowedRoles: ['KINGPIN'],
    requiresApproval: false,
  },
};

export class Orchestrator {
  public validateToolCall(agent: AgentRole, toolName: string): boolean {
    const tool = TOOL_PERMISSIONS[toolName];
    if (!tool) {
      console.warn(`[Orchestrator] Unknown tool: ${toolName}`);
      return false;
    }

    if (!tool.allowedRoles.includes(agent)) {
      console.warn(`[Orchestrator] ${agent} attempted to use restricted tool: ${toolName}`);
      return false;
    }

    return true;
  }
}

export const orchestrator = new Orchestrator();
