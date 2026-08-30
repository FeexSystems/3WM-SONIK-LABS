// 3WM SONIK - Council Mode for Real-Time Agent Collaboration
// Enables the Three Wise Men to debate, reach consensus, and collaborate on production decisions

import { vectorStore, VectorMetadata } from '../services/vectorStore';

export interface CouncilMessage {
  id: string;
  agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator';
  content: string;
  timestamp: number;
  type: 'proposal' | 'agreement' | 'disagreement' | 'question' | 'answer' | 'consensus';
  confidence: number; // 0-1
  relatedTo?: string; // Reference to another message or action
}

export interface CouncilSession {
  id: string;
  topic: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  messages: CouncilMessage[];
  participants: ('emar' | 'ricky' | 'kingpin' | 'orchestrator')[];
  consensus?: {
    decision: string;
    confidence: number;
    voting: Record<string, boolean>;
    reasoning?: string;
  };
}

export interface CouncilDecision {
  sessionId: string;
  decision: string;
  confidence: number;
  voting: Record<string, boolean>;
  reasoning: string;
  timestamp: number;
}

export class CouncilMode {
  private sessions: Map<string, CouncilSession> = new Map();
  private activeSession: CouncilSession | null = null;
  private decisionHistory: CouncilDecision[] = [];

  // Transaction-based lock for preventing race conditions
  private isProcessing = false;
  private processQueue: Array<() => Promise<void>> = [];

  private async runWithLock<T>(task: () => Promise<T> | T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.processQueue.push(async () => {
        try {
          const result = await Promise.resolve(task());
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.pumpQueue();
    });
  }

  private async pumpQueue() {
    if (this.isProcessing || this.processQueue.length === 0) return;
    this.isProcessing = true;
    while (this.processQueue.length > 0) {
      const task = this.processQueue.shift();
      if (task) {
        await task();
      }
    }
    this.isProcessing = false;
  }

  /**
   * Start a new council session
   */
  public startSession(
    topic: string,
    participants: ('emar' | 'ricky' | 'kingpin' | 'orchestrator')[] = [
      'emar',
      'ricky',
      'kingpin',
      'orchestrator',
    ]
  ): CouncilSession {
    const session: CouncilSession = {
      id: `council_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic,
      startTime: Date.now(),
      status: 'active',
      messages: [],
      participants,
    };

    this.sessions.set(session.id, session);
    this.activeSession = session;

    return session;
  }

  /**
   * Get active session
   */
  public getActiveSession(): CouncilSession | null {
    return this.activeSession;
  }

  /**
   * End the current council session
   */
  public endSession(): CouncilDecision | null {
    if (!this.activeSession) return null;

    this.activeSession.endTime = Date.now();
    this.activeSession.status = 'completed';

    // Generate final decision if consensus exists
    const decision = this.generateConsensus(this.activeSession);
    if (decision) {
      this.activeSession.consensus = decision;
      this.decisionHistory.push(decision);
    }

    this.activeSession = null;
    return decision;
  }

  /**
   * Add a message to the council session
   */
  public async addMessage(
    agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator',
    content: string,
    type: CouncilMessage['type'] = 'proposal',
    confidence: number = 0.5,
    relatedTo?: string,
    embedding?: number[]
  ): Promise<CouncilMessage> {
    if (!this.activeSession) {
      throw new Error('No active council session');
    }

    const message: CouncilMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent,
      content,
      timestamp: Date.now(),
      type,
      confidence,
      relatedTo,
    };

    this.activeSession.messages.push(message);

    // Store in vector store if embedding is provided
    if (embedding && embedding.length > 0) {
      const metadata: VectorMetadata = {
        type: 'agent_memory',
        agent,
        sessionId: this.activeSession.id,
        messageType: type,
        confidence,
        timestamp: Date.now(),
      };

      await vectorStore.storeAgentMemory(message.id, embedding, metadata);
    }

    return message;
  }

  /**
   * Get messages from the active session
   */
  public getMessages(): CouncilMessage[] {
    if (!this.activeSession) return [];
    return [...this.activeSession.messages];
  }

  /**
   * Get messages by agent
   */
  public getMessagesByAgent(
    agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator'
  ): CouncilMessage[] {
    if (!this.activeSession) return [];
    return this.activeSession.messages.filter((msg) => msg.agent === agent);
  }

  /**
   * Get messages by type
   */
  public getMessagesByType(type: CouncilMessage['type']): CouncilMessage[] {
    if (!this.activeSession) return [];
    return this.activeSession.messages.filter((msg) => msg.type === type);
  }

  /**
   * Generate consensus from council messages
   */
  private generateConsensus(session: CouncilSession): CouncilDecision | null {
    const proposals = session.messages.filter((msg) => msg.type === 'proposal');
    const agreements = session.messages.filter((msg) => msg.type === 'agreement');
    const disagreements = session.messages.filter((msg) => msg.type === 'disagreement');

    if (proposals.length === 0) return null;

    // Count votes for each proposal
    const proposalVotes: Map<string, { votes: number; agents: string[] }> = new Map();

    for (const proposal of proposals) {
      const votes = proposalVotes.get(proposal.content) || { votes: 0, agents: [] };
      votes.votes++;
      votes.agents.push(proposal.agent);
      proposalVotes.set(proposal.content, votes);
    }

    // Find the proposal with most votes
    let bestProposal = '';
    let bestVotes = 0;
    let bestAgents: string[] = [];

    for (const [content, votes] of proposalVotes) {
      if (votes.votes > bestVotes) {
        bestProposal = content;
        bestVotes = votes.votes;
        bestAgents = votes.agents;
      }
    }

    if (bestVotes === 0) return null;

    // Calculate confidence based on agreement ratio
    const totalParticipants = session.participants.length;
    const agreementRatio = agreements.length / (agreements.length + disagreements.length);
    const confidence = (bestVotes / totalParticipants) * agreementRatio;

    // Create voting record
    const voting: Record<string, boolean> = {};
    for (const participant of session.participants) {
      voting[participant] = bestAgents.includes(participant);
    }

    // Generate reasoning
    const reasoning = this.generateReasoning(session, bestProposal, bestAgents);

    const decision: CouncilDecision = {
      sessionId: session.id,
      decision: bestProposal,
      confidence,
      voting,
      reasoning,
      timestamp: Date.now(),
    };

    return decision;
  }

  /**
   * Generate reasoning for council decision
   */
  private generateReasoning(
    session: CouncilSession,
    decision: string,
    supporters: string[]
  ): string {
    const agentNames: Record<string, string> = {
      emar: 'Kappachino Emar (The Scientist)',
      ricky: 'Kappachino Ricky (The Sound God)',
      kingpin: 'Kingpin (The Vocal Oracle)',
      orchestrator: 'ThreeWM Orchestrator',
    };

    const supporterNames = supporters.map((a) => agentNames[a]).join(', ');
    const dissenterNames = session.participants
      .filter((p) => !supporters.includes(p))
      .map((a) => agentNames[a])
      .join(', ');

    let reasoning = `Decision reached with support from ${supporterNames}.`;

    if (dissenterNames) {
      reasoning += ` Dissent from ${dissenterNames}.`;
    }

    reasoning += ` Based on ${session.messages.length} messages exchanged during the session.`;

    return reasoning;
  }

  /**
   * Request agent opinion on a topic
   */
  public async requestAgentOpinion(
    agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator',
    topic: string,
    context: Record<string, any>
  ): Promise<CouncilMessage> {
    return this.runWithLock(async () => {
      // This would integrate with the actual agent systems
      // For now, return a placeholder message
      const opinion = await this.generateAgentOpinion(agent, topic, context);

      return this.addMessage(agent, opinion, 'proposal', 0.7);
    });
  }

  /**
   * Generate agent opinion (placeholder - would integrate with actual AI)
   */
  private async generateAgentOpinion(
    agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator',
    topic: string,
    context: Record<string, any>
  ): Promise<string> {
    // This would call the actual agent's AI system
    // For now, return a placeholder based on agent personality
    const agentPersonalities: Record<string, string> = {
      emar: 'Based on technical analysis, I recommend...',
      ricky: 'From a creative sound design perspective, I suggest...',
      kingpin: 'Considering the vocal arrangement, I propose...',
      orchestrator: 'Coordinating the agents perspectives, I advise...',
    };

    return `${agentPersonalities[agent]} ${topic}`;
  }

  /**
   * Facilitate debate between agents
   */
  public async facilitateDebate(
    topic: string,
    rounds: number = 3
  ): Promise<CouncilDecision | null> {
    const session = this.startSession(topic);

    // Conduct debate rounds
    for (let round = 0; round < rounds; round++) {
      for (const agent of session.participants) {
        if (agent === 'orchestrator' && round < rounds - 1) continue; // Orchestrator speaks last

        await this.requestAgentOpinion(agent, topic, { round, sessionContext: session.messages });
      }
    }

    return this.endSession();
  }

  /**
   * Vote on a proposal
   */
  public vote(
    agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator',
    proposalId: string,
    vote: boolean,
    reason?: string
  ): void {
    if (!this.activeSession) return;

    const proposal = this.activeSession.messages.find((msg) => msg.id === proposalId);
    if (!proposal) return;

    const messageType = vote ? 'agreement' : 'disagreement';

    this.addMessage(
      agent,
      reason || (vote ? 'I agree with this proposal' : 'I disagree with this proposal'),
      messageType,
      0.8,
      proposalId
    );
  }

  /**
   * Get decision history
   */
  public getDecisionHistory(): CouncilDecision[] {
    return [...this.decisionHistory];
  }

  /**
   * Get session by ID
   */
  public getSession(sessionId: string): CouncilSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  public getAllSessions(): CouncilSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Pause the current session
   */
  public pauseSession(): void {
    if (this.activeSession) {
      this.activeSession.status = 'paused';
    }
  }

  /**
   * Resume the current session
   */
  public resumeSession(): void {
    if (this.activeSession && this.activeSession.status === 'paused') {
      this.activeSession.status = 'active';
    }
  }

  /**
   * Abandon the current session
   */
  public abandonSession(): void {
    if (this.activeSession) {
      this.activeSession.endTime = Date.now();
      this.activeSession.status = 'abandoned';
      this.activeSession = null;
    }
  }

  /**
   * Get session statistics
   */
  public getSessionStats(sessionId: string): {
    messageCount: number;
    messageByType: Record<string, number>;
    messageByAgent: Record<string, number>;
    duration: number;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const messageByType: Record<string, number> = {};
    const messageByAgent: Record<string, number> = {};

    for (const msg of session.messages) {
      messageByType[msg.type] = (messageByType[msg.type] || 0) + 1;
      messageByAgent[msg.agent] = (messageByAgent[msg.agent] || 0) + 1;
    }

    const duration = (session.endTime || Date.now()) - session.startTime;

    return {
      messageCount: session.messages.length,
      messageByType,
      messageByAgent,
      duration,
    };
  }

  /**
   * Get conflict level in session
   */
  public getConflictLevel(sessionId: string): 'low' | 'medium' | 'high' | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const disagreements = session.messages.filter((msg) => msg.type === 'disagreement').length;
    const agreements = session.messages.filter((msg) => msg.type === 'agreement').length;
    const total = disagreements + agreements;

    if (total === 0) return 'low';

    const disagreementRatio = disagreements / total;

    if (disagreementRatio < 0.3) return 'low';
    if (disagreementRatio < 0.6) return 'medium';
    return 'high';
  }

  /**
   * Resolve conflict by seeking consensus
   */
  public async resolveConflict(sessionId: string): Promise<CouncilDecision | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Add a consensus-seeking message from orchestrator
    this.addMessage(
      'orchestrator',
      'Let us seek common ground and find a solution that addresses all concerns.',
      'proposal',
      0.9
    );

    // Request each agent to provide a compromise
    for (const agent of session.participants) {
      if (agent !== 'orchestrator') {
        await this.requestAgentOpinion(agent, 'compromise', {
          conflictResolution: true,
          sessionContext: session.messages,
        });
      }
    }

    // Generate new consensus
    const decision = this.generateConsensus(session);
    if (decision) {
      session.consensus = decision;
      this.decisionHistory.push(decision);
    }

    return decision;
  }

  /**
   * Export session to JSON
   */
  public exportSession(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return JSON.stringify(session, null, 2);
  }

  /**
   * Import session from JSON
   */
  public importSession(json: string): CouncilSession | null {
    try {
      const session = JSON.parse(json) as CouncilSession;
      this.sessions.set(session.id, session);
      return session;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear old sessions
   */
  public clearOldSessions(olderThanMs: number = 86400000): void {
    const cutoff = Date.now() - olderThanMs;

    for (const [id, session] of this.sessions) {
      if (session.endTime && session.endTime < cutoff) {
        this.sessions.delete(id);
      }
    }
  }

  /**
   * Clear all sessions
   */
  public clearAllSessions(): void {
    this.sessions.clear();
    this.activeSession = null;
    this.decisionHistory = [];
  }
}
