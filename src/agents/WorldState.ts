import { projectStore } from '../services/projectStore';
import { SonikWorldState, AgentState, AgentId } from './types';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';

export interface AgentActivityLog {
  timestamp: string;
  agent: string;
  message: string;
}

class WorldStateManager {
  private agentStates: Record<AgentId, AgentState> = {
    kappachino_emar: 'IDLE',
    kappachino_ricky: 'IDLE',
    kingpin: 'IDLE',
    three_wm_orchestrator: 'IDLE',
  };

  private activities: AgentActivityLog[] = [];
  private listeners: Set<(state: SonikWorldState & { activities: AgentActivityLog[] }) => void> =
    new Set();
  private unsubscribeFirestore: (() => void) | null = null;
  private currentProjectId: string | null = null;

  constructor() {
    // Listen to local project changes to subscribe to the correct Firestore doc
    projectStore.subscribeProject((project) => {
      if (project && project.id !== this.currentProjectId) {
        this.currentProjectId = project.id;
        this.subscribeToFirestore(project.id);
      }
    });
  }

  private async subscribeToFirestore(projectId: string) {
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }

    if (!db) return;

    try {
      const docRef = doc(db, 'world_states', projectId);

      // Initial creation if not exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(
          docRef,
          {
            agentStates: this.agentStates,
            activities: this.activities,
          },
          { merge: true }
        );
      }

      // Listen for changes
      this.unsubscribeFirestore = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.agentStates) this.agentStates = data.agentStates;
          if (data.activities) this.activities = data.activities;
          this.notify();
        }
      });
    } catch (err) {
      console.error('Failed to subscribe to WorldState in Firestore', err);
    }
  }

  private async persistToFirestore() {
    if (!db || !this.currentProjectId) return;
    try {
      const docRef = doc(db, 'world_states', this.currentProjectId);
      await updateDoc(docRef, {
        agentStates: this.agentStates,
        activities: this.activities,
      });
    } catch (err) {
      console.error('Failed to persist WorldState to Firestore', err);
    }
  }

  public getState(): SonikWorldState & { activities: AgentActivityLog[] } {
    const project = projectStore.getCurrentProject();
    if (!project) {
      return this.getEmptyState();
    }

    return {
      projectId: project.id,
      tempo: project.bpm,
      timeSignature: '4/4',
      key: project.key || 'C',
      scale: 'Minor',
      tracks: project.stems || [],
      midi: {},
      instruments: [],
      plugins: [],
      pluginChains: [],
      automation: [],
      vocals: {},
      arrangement: {},
      mix: {},
      master: {},
      audioAnalysis: {},
      versions: [],
      agentState: { ...this.agentStates },
      activities: [...this.activities],
    };
  }

  public setAgentState(agentId: AgentId, state: AgentState) {
    this.agentStates[agentId] = state;
    this.notify();
    this.persistToFirestore();
  }

  public logActivity(agentId: string, message: string) {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    const log = { timestamp: time, agent: agentId, message };
    this.activities = [log, ...this.activities].slice(0, 50); // Keep last 50
    this.notify();
    this.persistToFirestore();
  }

  public subscribe(
    listener: (state: SonikWorldState & { activities: AgentActivityLog[] }) => void
  ) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  private getEmptyState(): SonikWorldState & { activities: AgentActivityLog[] } {
    return {
      projectId: '',
      tempo: 120,
      timeSignature: '4/4',
      key: 'C',
      scale: 'Major',
      tracks: [],
      midi: {},
      instruments: [],
      plugins: [],
      pluginChains: [],
      automation: [],
      vocals: {},
      arrangement: {},
      mix: {},
      master: {},
      audioAnalysis: {},
      versions: [],
      agentState: { ...this.agentStates },
      activities: [...this.activities],
    };
  }
}

export const worldState = new WorldStateManager();
