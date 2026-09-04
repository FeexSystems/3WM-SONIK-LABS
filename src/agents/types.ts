export type AgentId = 'kappachino_emar' | 'kappachino_ricky' | 'kingpin' | 'three_wm_orchestrator';

export type AgentState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'ANALYZING'
  | 'CREATING'
  | 'EDITING'
  | 'WAITING'
  | 'COLLABORATING'
  | 'REQUESTING_APPROVAL'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'ERROR';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  title: string;
  domain: string;
  identity: string;
  corePrinciple: string;
}

export type MessageType =
  | 'REQUEST'
  | 'RESPONSE'
  | 'PROPOSAL'
  | 'WARNING'
  | 'ANALYSIS'
  | 'ACTION'
  | 'APPROVAL_REQUIRED'
  | 'CONFLICT'
  | 'CONSENSUS'
  | 'COMPLETE';

export interface AgentMessage {
  id: string;
  from: AgentId | 'USER';
  to: AgentId | 'ALL';
  type: MessageType;
  projectId: string;
  payload: any;
  timestamp: string;
  requiresResponse: boolean;
}

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
  authorizedAgents: AgentId[];
  destructive: boolean;
}

export interface AgentAction {
  id: string;
  agent: AgentId;
  action: string;
  plugin?: string;
  parameter?: string;
  oldValue?: any;
  newValue?: any;
  approved: boolean;
  timestamp: string;
}

export interface SonikWorldState {
  projectId: string;
  engine?: '3ONIK';
  tempo: number;
  timeSignature: string;
  key: string;
  scale: string;
  tracks: any[];
  midi: any;
  instruments: any[];
  plugins: any[];
  pluginChains: any[];
  automation: any[];
  vocals: any;
  arrangement: any;
  mix: any;
  master: any;
  audioAnalysis: any;
  versions: any[];
  agentState: Record<AgentId, AgentState>;
}
