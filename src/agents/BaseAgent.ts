import { AgentDefinition, AgentId, AgentState, AgentMessage } from './types';
import { worldState } from './WorldState';

export abstract class BaseAgent {
  public abstract definition: AgentDefinition;
  protected memory: any[] = [];
  protected currentTask: string | null = null;

  public getId(): AgentId {
    return this.definition.id;
  }

  public getState(): AgentState {
    return worldState.getState().agentState[this.getId()];
  }

  protected setState(state: AgentState) {
    worldState.setAgentState(this.getId(), state);
  }

  public abstract handleMessage(message: AgentMessage): Promise<void>;

  protected logAction(action: string) {
    console.log(`[${this.definition.name}] ${action}`);
    worldState.logActivity(this.definition.name, action);
  }
}
