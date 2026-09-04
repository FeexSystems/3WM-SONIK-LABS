import { memoryBank } from './MemoryBank';
import { worldState } from './WorldState';
import { BaseAgent } from './BaseAgent';
import { AgentDefinition, AgentMessage, AgentId } from './types';
import { emar } from './Emar';
import { ricky } from './Ricky';
import { kingpin } from './Kingpin';
import { ActionClassifier } from './actionClassification';
import { CouncilMode } from './councilMode';
import { WorkflowAssistant } from './workflowAssistant';
import { EmarCapabilities } from './emarCapabilities';
import { RickyCapabilities } from './rickyCapabilities';
import { KingpinCapabilities } from './kingpinCapabilities';

export class ThreeWMOrchestrator extends BaseAgent {
  public definition: AgentDefinition = {
    id: 'three_wm_orchestrator',
    name: 'ThreeWMOrchestrator',
    title: 'The Coordinator',
    domain: 'ORCHESTRATION / WORKFLOW / CONSENSUS',
    identity:
      '3ONIK Engine coordinator that interprets user intent, routes tasks across the Three Wise Men, and manages the shared world state.',
    corePrinciple: 'Coordinate the minds. Synthesize the sound.',
  };

  private agents: Record<string, BaseAgent> = {
    kappachino_emar: emar,
    kappachino_ricky: ricky,
    kingpin: kingpin,
  };

  // Phase 5: Enhanced Agent Capabilities
  private actionClassifier: ActionClassifier = new ActionClassifier();
  private councilMode: CouncilMode = new CouncilMode();
  private workflowAssistant: WorkflowAssistant = new WorkflowAssistant();
  private emarCapabilities: EmarCapabilities = new EmarCapabilities();
  private rickyCapabilities: RickyCapabilities = new RickyCapabilities();
  private kingpinCapabilities: KingpinCapabilities = new KingpinCapabilities();

  public async handleMessage(message: AgentMessage): Promise<void> {
    this.setState('ANALYZING');
    this.logAction(`Interpreting intent for message: ${message.type}`);

    if (message.payload?.context) {
      this.logAction(`Analyzing track context for: ${message.payload.context.trackTitle}`);
    }

    // Removed artificial orchestration delay in favor of real AI latency

    const intentStr = message.payload?.intent?.toLowerCase() || '';
    const isCouncilMode =
      message.payload?.isCouncilMode ||
      /\b(council|debate|all agents|all three|everyone|together|full team|full council)\b/i.test(intentStr);

    let targetAgents: AgentId[] = [];

    if (message.payload?.targetAgentId && !isCouncilMode) {
      // Direct persona routing requested by active channel tab
      targetAgents = [message.payload.targetAgentId];
      this.logAction(`Direct channel routing to ${message.payload.targetAgentId}...`);
    } else if (isCouncilMode || /\b(review track|review all|full review)\b/i.test(intentStr)) {
      // Council Mode logic: sequential debate with server-side interaction chaining
      targetAgents = ['kappachino_ricky', 'kappachino_emar', 'kingpin'];
      this.logAction(`Initiating Council Debate via Gemini Interactions API...`);

      let discussionContext = '';

      for (const targetAgent of targetAgents) {
        const augmentedMessage = { ...message };
        if (discussionContext) {
          augmentedMessage.payload = {
            ...augmentedMessage.payload,
            intent: `${augmentedMessage.payload.intent}\n\n[DEBATE CONTEXT - What other agents have proposed so far]:\n${discussionContext}\n\nPlease critique their suggestions and propose your own approach.`,
          };
        }

        const res = await this.dispatchToAgent(targetAgent, augmentedMessage);
        if (res?.responseText) {
          const agentName = targetAgent.replace('kappachino_', '').toUpperCase();
          discussionContext += `${agentName} PROPOSED: ${res.responseText}\n\n`;
        }
      }
    } else {
      // Single Agent Routing or Conversational Greetings
      if (
        intentStr.includes('hello') ||
        intentStr.includes('hi') ||
        intentStr.includes('how are you') ||
        intentStr.includes("what's up") ||
        intentStr.includes('greetings')
      ) {
        // For general greetings, let the council respond sequentially
        targetAgents = ['kingpin', 'kappachino_ricky', 'kappachino_emar'];
        this.logAction(`Formalities detected. Activating Council...`);
      } else if (
        /\b(all right|alright|ok|okay|cool|sounds good|let's go|lets go|ready)\b/i.test(intentStr)
      ) {
        // Affirmative acknowledgment: route to Ricky (musical drive) or Emar
        targetAgents = ['kappachino_ricky'];
        this.logAction(`Affirmative received. Advancing session with Ricky...`);
      } else if (
        intentStr.includes('mix') ||
        intentStr.includes('master') ||
        intentStr.includes('low end') ||
        intentStr.includes('emar') ||
        intentStr.includes('eq') ||
        intentStr.includes('compress')
      ) {
        targetAgents = ['kappachino_emar'];
      } else if (
        intentStr.includes('vocal') ||
        intentStr.includes('kingpin') ||
        intentStr.includes('harmony') ||
        intentStr.includes('stack') ||
        intentStr.includes('sing') ||
        intentStr.includes('tune')
      ) {
        targetAgents = ['kingpin'];
      } else if (
        intentStr.includes('beat') ||
        intentStr.includes('808') ||
        intentStr.includes('drum') ||
        intentStr.includes('ricky') ||
        intentStr.includes('groove') ||
        intentStr.includes('bounce') ||
        intentStr.includes('synth')
      ) {
        targetAgents = ['kappachino_ricky'];
      } else {
        // If unspecified but musical, default to Ricky.
        targetAgents = ['kappachino_ricky'];
      }

      this.logAction(`Routing to agent: ${targetAgents.join(', ')}`);

      for (const targetAgent of targetAgents) {
        await this.dispatchToAgent(targetAgent, message);
      }
    }

    this.setState('IDLE');
  }

  private async dispatchToAgent(
    agentId: AgentId,
    message: AgentMessage,
    previousInteractionId?: string
  ): Promise<{ responseText?: string; interactionId?: string } | undefined> {
    const agent = this.agents[agentId];
    if (agent) {
      (agent as any).setState('ANALYZING');

      // 1. Invoke local agent intelligence engine, memory bank, and tools
      try {
        await agent.handleMessage(message);
      } catch (err) {
        console.warn(`Agent ${agentId} handleMessage warning:`, err);
      }

      // 2. Optionally attempt backend synchronisation if available
      try {
        const trackId = message.payload?.context?.trackId || 'demo';
        const backendAgentId =
          agentId === 'kappachino_emar'
            ? 'emar'
            : agentId === 'kappachino_ricky'
              ? 'ricky'
              : agentId === 'kingpin'
                ? 'kingpin'
                : 'orchestrator';

        const res = await fetch(`/api/tracks/${trackId}/ai-command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: backendAgentId,
            command: message.payload?.intent || 'Analyze',
            audioBase64: message.payload?.audioBase64,
            audioMimeType: message.payload?.audioMimeType,
            previousInteractionId,
          }),
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            if (data.responseText) {
              (agent as any).logAction(data.responseText);
            }
            if (data.track?.settings) {
              (agent as any).logAction(`Applied DSP Settings Update.`);
            }
            return { responseText: data.responseText, interactionId: data.interactionId };
          }
        }
      } catch (_e) {
        // Silently handled by local intelligence layer
      }

      (agent as any).setState('IDLE');
    }
  }

  public async dispatchUserIntent(
    intent: string,
    context?: any,
    audioBase64?: string,
    audioMimeType?: string,
    isCouncilMode?: boolean,
    targetAgentId?: AgentId
  ) {
    const relevantMemories = await memoryBank.querySemanticMemory(intent);
    if (relevantMemories.length > 0) {
      worldState.logActivity(
        'ThreeWMOrchestrator',
        `[Memory Context Retrieved]: ${relevantMemories[0].content}`
      );
    }

    this.logAction(
      `User Directive Received: "${intent}"${targetAgentId ? ` [Target: ${targetAgentId}]` : ''}${audioBase64 ? ' [Audio Embedded]' : ''}`
    );
    const message: AgentMessage = {
      id: `msg_${Date.now()}`,
      from: 'USER',
      to: targetAgentId || 'ALL',
      type: 'REQUEST',
      projectId: 'current',
      payload: { intent, context, audioBase64, audioMimeType, isCouncilMode, targetAgentId },
      timestamp: new Date().toISOString(),
      requiresResponse: true,
    };
    await this.handleMessage(message);
  }

  // ==================== PHASE 5: ENHANCED AGENT CAPABILITIES API ====================

  /**
   * Get action classifier instance
   */
  public getActionClassifier(): ActionClassifier {
    return this.actionClassifier;
  }

  /**
   * Get council mode instance
   */
  public getCouncilMode(): CouncilMode {
    return this.councilMode;
  }

  /**
   * Get workflow assistant instance
   */
  public getWorkflowAssistant(): WorkflowAssistant {
    return this.workflowAssistant;
  }

  /**
   * Get Emar capabilities instance
   */
  public getEmarCapabilities(): EmarCapabilities {
    return this.emarCapabilities;
  }

  /**
   * Get Ricky capabilities instance
   */
  public getRickyCapabilities(): RickyCapabilities {
    return this.rickyCapabilities;
  }

  /**
   * Get Kingpin capabilities instance
   */
  public getKingpinCapabilities(): KingpinCapabilities {
    return this.kingpinCapabilities;
  }

  /**
   * Start a council session for agent collaboration
   */
  public startCouncilSession(topic: string): any {
    return this.councilMode.startSession(topic);
  }

  /**
   * Get current council session
   */
  public getCurrentCouncilSession(): any {
    return this.councilMode.getActiveSession();
  }

  /**
   * Add message to council session
   */
  public addCouncilMessage(
    agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator',
    content: string
  ): any {
    return this.councilMode.addMessage(agent, content, 'proposal', 0.7);
  }

  /**
   * End council session and get decision
   */
  public endCouncilSession(): any {
    return this.councilMode.endSession();
  }

  /**
   * Analyze project for workflow suggestions
   */
  public analyzeProjectForSuggestions(projectState: any): any[] {
    return this.workflowAssistant.analyzeProject(projectState);
  }

  /**
   * Record user action for pattern detection
   */
  public recordUserAction(action: string, context: any = {}): void {
    this.workflowAssistant.recordAction(action, context);
  }

  /**
   * Get workflow suggestions
   */
  public getWorkflowSuggestions(): any[] {
    return this.workflowAssistant.getSuggestions();
  }

  /**
   * Accept a workflow suggestion
   */
  public acceptWorkflowSuggestion(suggestionId: string): void {
    this.workflowAssistant.acceptSuggestion(suggestionId);
  }

  /**
   * Classify and create an AI action
   */
  public createAIAction(
    agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator',
    description: string,
    parameters: any,
    context: any
  ): any {
    return this.actionClassifier.createAction(agent, description, parameters, context);
  }

  /**
   * Request approval for an action
   */
  public requestActionApproval(actionId: string): boolean {
    return this.actionClassifier.requestApproval(actionId);
  }

  /**
   * Approve an action
   */
  public approveAction(actionId: string, reason?: string): void {
    this.actionClassifier.approveAction(actionId, reason);
  }

  /**
   * Reject an action
   */
  public rejectAction(actionId: string, reason?: string): void {
    this.actionClassifier.rejectAction(actionId, reason);
  }

  /**
   * Execute an action
   */
  public async executeAction(
    actionId: string,
    executor: (action: any) => Promise<any>
  ): Promise<any> {
    return await this.actionClassifier.executeAction(actionId, executor);
  }

  /**
   * Get pending actions
   */
  public getPendingActions(): any[] {
    return this.actionClassifier.getPendingActions();
  }

  /**
   * Get action statistics
   */
  public getActionStats(): any {
    return this.actionClassifier.getActionStats();
  }
}

export const orchestrator = new ThreeWMOrchestrator();
