/**
 * Unit tests for Agent Tool Execution Framework
 * Part of Phase 5.1.3: Test agent tool execution and AI integration
 */

import { AgentToolRegistry, ToolExecutionContext, ToolDefinition, validators } from './agentTools';
import { AgentId } from './types';

describe('AgentToolRegistry', () => {
  let registry: AgentToolRegistry;
  let mockContext: ToolExecutionContext;

  beforeEach(() => {
    registry = new AgentToolRegistry();
    mockContext = {
      agentId: 'EMAR' as AgentId,
      projectId: 'test-project',
      worldState: {},
      permissions: ['read', 'write'],
    };
  });

  describe('tool registration', () => {
    it('should register a tool', () => {
      const tool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'audio',
        authorizedAgents: ['EMAR' as AgentId],
        destructive: false,
        execute: async () =>
          Promise.resolve({
            success: true,
            destructive: false,
            requiresApproval: false,
            executionTime: 0,
          }),
      };

      registry.registerTool(tool as unknown as ToolDefinition);

      expect(registry.getTool('test-tool')).toBeDefined();
    });

    it('should get all tools', () => {
      const tool1 = {
        name: 'tool1',
        description: 'Tool 1',
        category: 'audio',
        authorizedAgents: ['EMAR' as AgentId],
        destructive: false,
        execute: async () =>
          Promise.resolve({
            success: true,
            destructive: false,
            requiresApproval: false,
            executionTime: 0,
          }),
      };
      const tool2 = {
        name: 'tool2',
        description: 'Tool 2',
        category: 'audio',
        authorizedAgents: ['RICKY' as AgentId],
        destructive: false,
        execute: async () =>
          Promise.resolve({
            success: true,
            destructive: false,
            requiresApproval: false,
            executionTime: 0,
          }),
      };

      registry.registerTool(tool1 as unknown as ToolDefinition);
      registry.registerTool(tool2 as unknown as ToolDefinition);

      const allTools = registry.getAllTools();
      expect(allTools).toHaveLength(2);
    });

    it('should get tools for specific agent', () => {
      const tool1 = {
        name: 'tool1',
        description: 'Tool 1',
        category: 'audio',
        authorizedAgents: ['EMAR' as AgentId],
        destructive: false,
        execute: async () =>
          Promise.resolve({
            success: true,
            destructive: false,
            requiresApproval: false,
            executionTime: 0,
          }),
      };
      const tool2 = {
        name: 'tool2',
        description: 'Tool 2',
        category: 'audio',
        authorizedAgents: ['RICKY' as AgentId],
        destructive: false,
        execute: async () =>
          Promise.resolve({
            success: true,
            destructive: false,
            requiresApproval: false,
            executionTime: 0,
          }),
      };

      registry.registerTool(tool1 as unknown as ToolDefinition);
      registry.registerTool(tool2 as unknown as ToolDefinition);

      const emarTools = registry.getToolsForAgent('EMAR' as AgentId);
      expect(emarTools).toHaveLength(1);
      expect(emarTools[0].name).toBe('tool1');
    });
  });

  describe('tool execution', () => {
    it('should execute a tool successfully', async () => {
      const tool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'audio',
        authorizedAgents: ['EMAR' as AgentId],
        destructive: false,
        execute: async () => ({
          success: true,
          data: { result: 'test' },
          destructive: false,
          requiresApproval: false,
          executionTime: 10,
        }),
      };

      registry.registerTool(tool as unknown as ToolDefinition);

      const result = await registry.executeTool('test-tool', mockContext, {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ result: 'test' });
    });

    it('should fail when tool not found', async () => {
      const result = await registry.executeTool('non-existent', mockContext, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail when agent not authorized', async () => {
      const tool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'audio',
        authorizedAgents: ['RICKY' as AgentId],
        destructive: false,
        execute: async () =>
          Promise.resolve({
            success: true,
            destructive: false,
            requiresApproval: false,
            executionTime: 0,
          }),
      };

      registry.registerTool(tool as unknown as ToolDefinition);

      const result = await registry.executeTool('test-tool', mockContext, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('not authorized');
    });

    it('should validate parameters', async () => {
      const tool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'audio',
        authorizedAgents: ['EMAR' as AgentId],
        destructive: false,
        validate: (params: any) => {
          if (params.value < 0) {
            return { valid: false, errors: ['Value must be positive'] };
          }
          return { valid: true, errors: [] };
        },
        execute: async () =>
          Promise.resolve({
            success: true,
            destructive: false,
            requiresApproval: false,
            executionTime: 0,
          }),
      };

      registry.registerTool(tool as unknown as ToolDefinition);

      const result = await registry.executeTool('test-tool', mockContext, { value: -1 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
    });

    it('should check permissions', async () => {
      const tool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'audio',
        authorizedAgents: ['EMAR' as AgentId],
        destructive: true,
        execute: async () => ({
          success: true,
          destructive: true,
          requiresApproval: true,
          executionTime: 0,
        }),
      };

      registry.registerTool(tool as unknown as ToolDefinition);

      const contextWithoutPermission = { ...mockContext, permissions: ['read'] };
      const result = await registry.executeTool('test-tool', contextWithoutPermission, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required permissions');
    });

    it('should handle execution errors', async () => {
      const tool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'audio',
        authorizedAgents: ['EMAR' as AgentId],
        destructive: false,
        execute: async () => {
          throw new Error('Execution failed');
        },
      };

      registry.registerTool(tool as unknown as ToolDefinition);

      const result = await registry.executeTool('test-tool', mockContext, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Execution failed');
    });
  });

  describe('execution history', () => {
    it('should track execution history', async () => {
      const tool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'audio',
        authorizedAgents: ['EMAR' as AgentId],
        destructive: false,
        execute: async () => ({
          success: true,
          destructive: false,
          requiresApproval: false,
          executionTime: 10,
        }),
      };

      registry.registerTool(tool as unknown as ToolDefinition);
      await registry.executeTool('test-tool', mockContext, {});

      const history = registry.getExecutionHistory();
      expect(history).toHaveLength(1);
      expect(history[0].toolName).toBe('test-tool');
      expect(history[0].success).toBe(true);
    });

    it('should clear execution history', async () => {
      const tool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'audio',
        authorizedAgents: ['EMAR' as AgentId],
        destructive: false,
        execute: async () => ({
          success: true,
          destructive: false,
          requiresApproval: false,
          executionTime: 10,
        }),
      };

      registry.registerTool(tool as unknown as ToolDefinition);
      await registry.executeTool('test-tool', mockContext, {});
      registry.clearExecutionHistory();

      const history = registry.getExecutionHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('tool statistics', () => {
    it('should calculate statistics', async () => {
      const tool = {
        name: 'test-tool',
        description: 'Test tool',
        category: 'audio',
        authorizedAgents: ['EMAR' as AgentId],
        destructive: false,
        execute: async () => ({
          success: true,
          destructive: false,
          requiresApproval: false,
          executionTime: 10,
        }),
      };

      registry.registerTool(tool as unknown as ToolDefinition);
      await registry.executeTool('test-tool', mockContext, {});
      await registry.executeTool('test-tool', mockContext, {});

      const stats = registry.getToolStatistics();

      expect(stats.totalExecutions).toBe(2);
      expect(stats.successRate).toBe(1);
      expect(stats.averageExecutionTime).toBe(10);
      expect(stats.toolUsage['test-tool']).toBe(2);
    });

    it('should return empty statistics when no history', () => {
      const stats = registry.getToolStatistics();

      expect(stats.totalExecutions).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.averageExecutionTime).toBe(0);
      expect(Object.keys(stats.toolUsage)).toHaveLength(0);
    });
  });
});

describe('validators', () => {
  describe('number validator', () => {
    it('should validate valid number', () => {
      const result = validators.number(42);
      expect(result.valid).toBe(true);
    });

    it('should reject non-number', () => {
      const result = validators.number('42');
      expect(result.valid).toBe(false);
    });

    it('should enforce minimum', () => {
      const result = validators.number(5, 10);
      expect(result.valid).toBe(false);
    });

    it('should enforce maximum', () => {
      const result = validators.number(15, 0, 10);
      expect(result.valid).toBe(false);
    });
  });

  describe('string validator', () => {
    it('should validate valid string', () => {
      const result = validators.string('test');
      expect(result.valid).toBe(true);
    });

    it('should reject non-string', () => {
      const result = validators.string(42);
      expect(result.valid).toBe(false);
    });

    it('should enforce minimum length', () => {
      const result = validators.string('ab', 3);
      expect(result.valid).toBe(false);
    });

    it('should enforce maximum length', () => {
      const result = validators.string('abcde', 0, 3);
      expect(result.valid).toBe(false);
    });
  });

  describe('enum validator', () => {
    it('should validate valid enum value', () => {
      const result = validators.enum('red', ['red', 'green', 'blue']);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid enum value', () => {
      const result = validators.enum('yellow', ['red', 'green', 'blue']);
      expect(result.valid).toBe(false);
    });
  });

  describe('array validator', () => {
    it('should validate valid array', () => {
      const result = validators.array([1, 2, 3]);
      expect(result.valid).toBe(true);
    });

    it('should reject non-array', () => {
      const result = validators.array('not an array');
      expect(result.valid).toBe(false);
    });

    it('should validate array items', () => {
      const result = validators.array([1, 2, 3], (item) => validators.number(item, 0, 10));
      expect(result.valid).toBe(true);
    });

    it('should reject invalid array items', () => {
      const result = validators.array([1, 15, 3], (item) => validators.number(item, 0, 10));
      expect(result.valid).toBe(false);
    });
  });

  describe('object validator', () => {
    it('should validate valid object', () => {
      const result = validators.object({ name: 'test' });
      expect(result.valid).toBe(true);
    });

    it('should reject non-object', () => {
      const result = validators.object('not an object');
      expect(result.valid).toBe(false);
    });

    it('should enforce required fields', () => {
      const result = validators.object({ name: 'test' }, ['name', 'value']);
      expect(result.valid).toBe(false);
    });

    it('should accept object with required fields', () => {
      const result = validators.object({ name: 'test', value: 42 }, ['name', 'value']);
      expect(result.valid).toBe(true);
    });
  });
});
