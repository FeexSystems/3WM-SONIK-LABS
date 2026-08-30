// 3WM SONIK - AI Action Classification System
// Categorizes AI actions into READ, SUGGEST, PREVIEW, WRITE, DESTRUCTIVE
// with appropriate approval workflows and safety measures

export type ActionType = 'READ' | 'SUGGEST' | 'PREVIEW' | 'WRITE' | 'DESTRUCTIVE';

export interface AIAction {
  id: string;
  type: ActionType;
  agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator';
  description: string;
  parameters: Record<string, any>;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'executed' | 'failed';
  result?: any;
  error?: string;
}

export interface ActionApproval {
  actionId: string;
  approved: boolean;
  approvedBy: 'user' | 'auto';
  timestamp: number;
  reason?: string;
}

export interface ActionContext {
  projectId: string;
  sessionId: string;
  currentState: Record<string, unknown>;
  userPreferences: Record<string, unknown>;
  agentMemory: Record<string, unknown>;
}

export class ActionClassifier {
  private actions = new Map<string, AIAction>();
  private approvals = new Map<string, ActionApproval>();
  private actionHistory: AIAction[] = [];
  private maxHistoryLength = 1000;

  /**
   * Classify an action based on its parameters and potential impact
   */
  public classifyAction(
    agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator',
    description: string,
    parameters: Record<string, unknown>
  ): ActionType {
    // Analyze the action to determine its type
    const actionType = this.analyzeActionType(parameters);

    return actionType;
  }

  /**
   * Analyze action parameters to determine type
   */
  private analyzeActionType(parameters: Record<string, unknown>): ActionType {
    const { operation, destructive } = parameters;

    // DESTRUCTIVE actions - irreversible changes
    if (
      destructive === true ||
      operation === 'delete' ||
      operation === 'overwrite' ||
      operation === 'clear' ||
      operation === 'reset'
    ) {
      return 'DESTRUCTIVE';
    }

    // WRITE actions - non-destructive changes with undo
    if (
      operation === 'create' ||
      operation === 'update' ||
      operation === 'modify' ||
      operation === 'add' ||
      operation === 'insert'
    ) {
      return 'WRITE';
    }

    // PREVIEW actions - audition changes before committing
    if (
      operation === 'preview' ||
      operation === 'audition' ||
      operation === 'solo' ||
      parameters.preview === true
    ) {
      return 'PREVIEW';
    }

    // SUGGEST actions - recommendations requiring approval
    if (
      operation === 'suggest' ||
      operation === 'recommend' ||
      operation === 'propose' ||
      parameters.suggestion === true
    ) {
      return 'SUGGEST';
    }

    // READ actions - analysis and observation without changes
    if (
      operation === 'analyze' ||
      operation === 'measure' ||
      operation === 'detect' ||
      operation === 'calculate' ||
      operation === 'inspect'
    ) {
      return 'READ';
    }

    // Default to READ for unknown operations
    return 'READ';
  }

  /**
   * Create an AI action
   */
  public createAction(
    agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator',
    description: string,
    parameters: Record<string, unknown>,
    _context: ActionContext
  ): AIAction {
    const actionType = this.classifyAction(agent, description, parameters);

    const action: AIAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: actionType,
      agent,
      description,
      parameters,
      timestamp: Date.now(),
      status: 'pending',
    };

    this.actions.set(action.id, action);
    this.addToHistory(action);

    return action;
  }

  /**
   * Request approval for an action
   */
  public requestApproval(actionId: string): boolean {
    const action = this.actions.get(actionId);
    if (!action) return false;

    // READ and PREVIEW actions don't require approval
    if (action.type === 'READ' || action.type === 'PREVIEW') {
      this.autoApprove(actionId, 'Auto-approved for READ/PREVIEW action');
      return true;
    }

    // SUGGEST actions require user approval
    if (action.type === 'SUGGEST') {
      return true; // Pending user approval
    }

    // WRITE actions require user approval
    if (action.type === 'WRITE') {
      return true; // Pending user approval
    }

    // DESTRUCTIVE actions require explicit user confirmation
    if (action.type === 'DESTRUCTIVE') {
      return true; // Pending explicit user confirmation
    }

    return false;
  }

  /**
   * Auto-approve an action
   */
  public autoApprove(actionId: string, reason = 'Auto-approved'): void {
    const approval: ActionApproval = {
      actionId,
      approved: true,
      approvedBy: 'auto',
      timestamp: Date.now(),
      reason,
    };

    this.approvals.set(actionId, approval);

    const action = this.actions.get(actionId);
    if (action) {
      action.status = 'approved';
    }
  }

  /**
   * Approve an action (user approval)
   */
  public approveAction(actionId: string, reason?: string): void {
    const approval: ActionApproval = {
      actionId,
      approved: true,
      approvedBy: 'user',
      timestamp: Date.now(),
      reason,
    };

    this.approvals.set(actionId, approval);

    const action = this.actions.get(actionId);
    if (action) {
      action.status = 'approved';
    }
  }

  /**
   * Reject an action
   */
  public rejectAction(actionId: string, reason?: string): void {
    const approval: ActionApproval = {
      actionId,
      approved: false,
      approvedBy: 'user',
      timestamp: Date.now(),
      reason,
    };

    this.approvals.set(actionId, approval);

    const action = this.actions.get(actionId);
    if (action) {
      action.status = 'rejected';
    }
  }

  /**
   * Execute an action
   */
  public async executeAction(
    actionId: string,
    executor: (action: AIAction) => Promise<unknown>
  ): Promise<unknown> {
    const action = this.actions.get(actionId);
    if (!action) {
      throw new Error('Action not found');
    }

    // Check if action is approved
    if (action.status !== 'approved' && action.type !== 'READ' && action.type !== 'PREVIEW') {
      throw new Error('Action not approved');
    }

    try {
      action.status = 'executing';
      const result: unknown = await executor(action);

      action.status = 'executed';
      action.result = result;

      return result;
    } catch (error) {
      action.status = 'failed';
      action.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Get action by ID
   */
  public getAction(actionId: string): AIAction | undefined {
    return this.actions.get(actionId);
  }

  /**
   * Get all pending actions
   */
  public getPendingActions(): AIAction[] {
    return Array.from(this.actions.values()).filter((action) => action.status === 'pending');
  }

  /**
   * Get actions by agent
   */
  public getActionsByAgent(agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator'): AIAction[] {
    return Array.from(this.actions.values()).filter((action) => action.agent === agent);
  }

  /**
   * Get actions by type
   */
  public getActionsByType(type: ActionType): AIAction[] {
    return Array.from(this.actions.values()).filter((action) => action.type === type);
  }

  /**
   * Get action history
   */
  public getActionHistory(limit?: number): AIAction[] {
    if (limit) {
      return this.actionHistory.slice(-limit);
    }
    return [...this.actionHistory];
  }

  /**
   * Add action to history
   */
  private addToHistory(action: AIAction): void {
    this.actionHistory.push(action);

    // Limit history length
    if (this.actionHistory.length > this.maxHistoryLength) {
      this.actionHistory.shift();
    }
  }

  /**
   * Get approval status
   */
  public getApproval(actionId: string): ActionApproval | undefined {
    return this.approvals.get(actionId);
  }

  /**
   * Check if action requires approval
   */
  public requiresApproval(actionId: string): boolean {
    const action = this.actions.get(actionId);
    if (!action) return false;

    return action.type === 'SUGGEST' || action.type === 'WRITE' || action.type === 'DESTRUCTIVE';
  }

  /**
   * Get action statistics
   */
  public getActionStats(): {
    total: number;
    byType: Record<ActionType, number>;
    byAgent: Record<string, number>;
    byStatus: Record<string, number>;
  } {
    const actions = Array.from(this.actions.values());

    const byType: Record<ActionType, number> = {
      READ: 0,
      SUGGEST: 0,
      PREVIEW: 0,
      WRITE: 0,
      DESTRUCTIVE: 0,
    };

    const byAgent: Record<string, number> = {
      emar: 0,
      ricky: 0,
      kingpin: 0,
      orchestrator: 0,
    };

    const byStatus: Record<string, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      executed: 0,
      failed: 0,
    };

    for (const action of actions) {
      byType[action.type]++;
      byAgent[action.agent]++;
      byStatus[action.status]++;
    }

    return {
      total: actions.length,
      byType,
      byAgent,
      byStatus,
    };
  }

  /**
   * Clear old actions
   */
  public clearOldActions(olderThanMs = 3600000): void {
    const cutoff = Date.now() - olderThanMs;

    for (const [id, action] of this.actions) {
      if (action.timestamp < cutoff && action.status === 'executed') {
        this.actions.delete(id);
        this.approvals.delete(id);
      }
    }
  }

  /**
   * Clear all actions
   */
  public clearAllActions(): void {
    this.actions.clear();
    this.approvals.clear();
    this.actionHistory = [];
  }

  /**
   * Batch execute actions
   */
  public async batchExecuteActions(
    actionIds: string[],
    executor: (action: AIAction) => Promise<unknown>
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const actionId of actionIds) {
      try {
        await this.executeAction(actionId, executor);
        success.push(actionId);
      } catch (_error) {
        failed.push(actionId);
      }
    }

    return { success, failed };
  }

  /**
   * Create action chain (dependent actions)
   */
  public createActionChain(
    actions: {
      agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator';
      description: string;
      parameters: Record<string, unknown>;
    }[],
    context: ActionContext
  ): string[] {
    const actionIds: string[] = [];

    for (const actionDef of actions) {
      const action = this.createAction(
        actionDef.agent,
        actionDef.description,
        actionDef.parameters,
        context
      );
      actionIds.push(action.id);
    }

    return actionIds;
  }

  /**
   * Get action safety level
   */
  public getActionSafetyLevel(actionId: string): 'safe' | 'caution' | 'danger' {
    const action = this.actions.get(actionId);
    if (!action) return 'safe';

    switch (action.type) {
      case 'READ':
      case 'PREVIEW':
        return 'safe';
      case 'SUGGEST':
        return 'safe';
      case 'WRITE':
        return 'caution';
      case 'DESTRUCTIVE':
        return 'danger';
      default:
        return 'safe';
    }
  }

  /**
   * Validate action parameters
   */
  public validateActionParameters(actionId: string): { valid: boolean; errors: string[] } {
    const action = this.actions.get(actionId);
    if (!action) {
      return { valid: false, errors: ['Action not found'] };
    }

    const errors: string[] = [];

    // Check for required parameters based on operation
    const operation = action.parameters.operation as string | undefined;

    if (!operation) {
      errors.push('Operation is required');
    }

    // Validate target
    if (action.parameters.target && typeof action.parameters.target !== 'string') {
      errors.push('Target must be a string');
    }

    // Validate destructive flag
    if (
      action.parameters.destructive !== undefined &&
      typeof action.parameters.destructive !== 'boolean'
    ) {
      errors.push('Destructive flag must be a boolean');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
