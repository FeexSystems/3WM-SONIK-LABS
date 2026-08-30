// 3WM SONIK - Agent Tool Execution Framework
// Provides a structured system for agent tool execution with validation and safety

import { AgentId, AgentTool } from './types';

export interface ToolExecutionContext {
  agentId: AgentId;
  projectId: string;
  worldState: any;
  audioContext?: AudioContext;
  permissions: string[];
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  destructive: boolean;
  requiresApproval: boolean;
  executionTime: number;
}

export interface ToolDefinition extends AgentTool {
  execute: (context: ToolExecutionContext, parameters: any) => Promise<ToolResult>;
  validate?: (parameters: any) => { valid: boolean; errors: string[] };
}

export class AgentToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private toolExecutionHistory: Array<{
    toolName: string;
    agentId: AgentId;
    timestamp: number;
    success: boolean;
    executionTime: number;
  }> = [];

  /**
   * Register a tool
   */
  public registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   */
  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools
   */
  public getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools authorized for a specific agent
   */
  public getToolsForAgent(agentId: AgentId): ToolDefinition[] {
    return Array.from(this.tools.values()).filter((tool) =>
      tool.authorizedAgents.includes(agentId)
    );
  }

  /**
   * Execute a tool with validation and safety checks
   */
  public async executeTool(
    toolName: string,
    context: ToolExecutionContext,
    parameters: any
  ): Promise<ToolResult> {
    const startTime = Date.now();
    const tool = this.tools.get(toolName);

    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolName}' not found`,
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    }

    // Check authorization
    if (!tool.authorizedAgents.includes(context.agentId)) {
      return {
        success: false,
        error: `Agent '${context.agentId}' is not authorized to use tool '${toolName}'`,
        destructive: tool.destructive,
        requiresApproval: tool.destructive,
        executionTime: Date.now() - startTime,
      };
    }

    // Validate parameters
    if (tool.validate) {
      const validation = tool.validate(parameters);
      if (!validation.valid) {
        return {
          success: false,
          error: `Parameter validation failed: ${validation.errors.join(', ')}`,
          destructive: tool.destructive,
          requiresApproval: tool.destructive,
          executionTime: Date.now() - startTime,
        };
      }
    }

    // Check permissions
    const requiredPermissions = this.extractRequiredPermissions(tool);
    const hasPermissions = requiredPermissions.every((perm) => context.permissions.includes(perm));

    if (!hasPermissions) {
      return {
        success: false,
        error: `Missing required permissions: ${requiredPermissions.join(', ')}`,
        destructive: tool.destructive,
        requiresApproval: tool.destructive,
        executionTime: Date.now() - startTime,
      };
    }

    // Execute tool
    try {
      const result = await tool.execute(context, parameters);

      // Log execution
      this.toolExecutionHistory.push({
        toolName,
        agentId: context.agentId,
        timestamp: Date.now(),
        success: result.success,
        executionTime: result.executionTime,
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        destructive: tool.destructive,
        requiresApproval: tool.destructive,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Extract required permissions from tool definition
   */
  private extractRequiredPermissions(tool: ToolDefinition): string[] {
    // This would analyze the tool to determine required permissions
    // For now, return a default set
    if (tool.destructive) {
      return ['write', 'destructive'];
    }
    return ['read'];
  }

  /**
   * Get tool execution history
   */
  public getExecutionHistory(): typeof this.toolExecutionHistory {
    return [...this.toolExecutionHistory];
  }

  /**
   * Clear execution history
   */
  public clearExecutionHistory(): void {
    this.toolExecutionHistory = [];
  }

  /**
   * Get tool usage statistics
   */
  public getToolStatistics(): {
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    toolUsage: Record<string, number>;
  } {
    if (this.toolExecutionHistory.length === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        toolUsage: {},
      };
    }

    const successful = this.toolExecutionHistory.filter((h) => h.success).length;
    const totalTime = this.toolExecutionHistory.reduce((sum, h) => sum + h.executionTime, 0);

    const toolUsage: Record<string, number> = {};
    for (const history of this.toolExecutionHistory) {
      toolUsage[history.toolName] = (toolUsage[history.toolName] || 0) + 1;
    }

    return {
      totalExecutions: this.toolExecutionHistory.length,
      successRate: successful / this.toolExecutionHistory.length,
      averageExecutionTime: totalTime / this.toolExecutionHistory.length,
      toolUsage,
    };
  }
}

// Global tool registry instance
export const agentToolRegistry = new AgentToolRegistry();

// Tool validation helpers
export const validators = {
  number: (value: any, min?: number, max?: number) => {
    if (typeof value !== 'number') {
      return { valid: false, errors: ['Value must be a number'] };
    }
    if (min !== undefined && value < min) {
      return { valid: false, errors: [`Value must be at least ${min}`] };
    }
    if (max !== undefined && value > max) {
      return { valid: false, errors: [`Value must be at most ${max}`] };
    }
    return { valid: true, errors: [] };
  },

  string: (value: any, minLength?: number, maxLength?: number) => {
    if (typeof value !== 'string') {
      return { valid: false, errors: ['Value must be a string'] };
    }
    if (minLength !== undefined && value.length < minLength) {
      return { valid: false, errors: [`String must be at least ${minLength} characters`] };
    }
    if (maxLength !== undefined && value.length > maxLength) {
      return { valid: false, errors: [`String must be at most ${maxLength} characters`] };
    }
    return { valid: true, errors: [] };
  },

  enum: (value: any, allowedValues: any[]) => {
    if (!allowedValues.includes(value)) {
      return { valid: false, errors: [`Value must be one of: ${allowedValues.join(', ')}`] };
    }
    return { valid: true, errors: [] };
  },

  array: (value: any, itemValidator?: (item: any) => { valid: boolean; errors: string[] }) => {
    if (!Array.isArray(value)) {
      return { valid: false, errors: ['Value must be an array'] };
    }
    if (itemValidator) {
      const errors: string[] = [];
      value.forEach((item, index) => {
        const result = itemValidator(item);
        if (!result.valid) {
          errors.push(`Item ${index}: ${result.errors.join(', ')}`);
        }
      });
      if (errors.length > 0) {
        return { valid: false, errors };
      }
    }
    return { valid: true, errors: [] };
  },

  object: (value: any, requiredFields: string[] = []) => {
    if (typeof value !== 'object' || value === null) {
      return { valid: false, errors: ['Value must be an object'] };
    }
    const missingFields = requiredFields.filter((field) => !(field in value));
    if (missingFields.length > 0) {
      return { valid: false, errors: [`Missing required fields: ${missingFields.join(', ')}`] };
    }
    return { valid: true, errors: [] };
  },
};
