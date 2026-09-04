/**
 * 3ONIK MULTI-AGENT INTELLIGENCE ENGINE
 * Core Agent Engine for 3WM SONIK
 * 
 * "ONE VISION. THREE MINDS. INFINITE SOUND."
 * 
 * 3ONIK is the foundational neural and multi-agent operating engine
 * powering the Three Wise Men (Emar, Ricky, Kingpin) and the Orchestrator
 * inside 3WM SONIK.
 */

import { worldState } from './WorldState';
import { orchestrator } from './Orchestrator';
import { emar } from './Emar';
import { ricky } from './Ricky';
import { kingpin } from './Kingpin';
import { SonikWorldState } from './types';

export interface ThreeOnikEngineSpecs {
  name: string;
  codename: string;
  version: string;
  architecture: string;
  model: string;
  audioDspLatency: string;
  triad: {
    emar: { role: string; domain: string; accent: string };
    ricky: { role: string; domain: string; accent: string };
    kingpin: { role: string; domain: string; accent: string };
  };
}

export const THREE_ONIK_SPECS: ThreeOnikEngineSpecs = {
  name: '3ONIK Agent Engine',
  codename: 'TRIDENT-NEURAL-DAW',
  version: '2.5.0-PROD',
  architecture: 'Distributed Triad Multi-Agent Consensus & DSP Bridge',
  model: 'Gemini 3.7 Flash & Gemini Live Bidirectional Stream',
  audioDspLatency: '< 5ms (AudioWorklet DSP)',
  triad: {
    emar: {
      role: 'The Scientist',
      domain: 'DSP, Acoustic Physics, Mixing & Mastering',
      accent: '#2AFFA3',
    },
    ricky: {
      role: 'The Sound God',
      domain: 'Instruments, Drums, 808s, Afrobeat/Amapiano Bounce',
      accent: '#F5A800',
    },
    kingpin: {
      role: 'The Vocal Oracle',
      domain: 'Vocals, Harmonies, Vocal Processing & Performance',
      accent: '#FF3C00',
    },
  },
};

export class ThreeOnikEngine {
  private static instance: ThreeOnikEngine;
  public readonly specs = THREE_ONIK_SPECS;

  private constructor() {
    console.log(`[3ONIK Engine] Initialized ${this.specs.name} ${this.specs.version}`);
  }

  public static getInstance(): ThreeOnikEngine {
    if (!ThreeOnikEngine.instance) {
      ThreeOnikEngine.instance = new ThreeOnikEngine();
    }
    return ThreeOnikEngine.instance;
  }

  public getOrchestrator() {
    return orchestrator;
  }

  public getAgents() {
    return { emar, ricky, kingpin };
  }

  public getWorldState(): SonikWorldState {
    return worldState.getState();
  }

  public getEngineStatus() {
    const state = worldState.getState();
    return {
      engine: this.specs.name,
      version: this.specs.version,
      status: 'ONLINE' as const,
      activeAgents: state.agentState,
      tempo: state.tempo,
      key: state.key,
      trackCount: state.tracks.length,
      activityCount: worldState.getActivities().length,
    };
  }

  public logTelemetry(action: string) {
    worldState.logActivity('ThreeWMOrchestrator', `[3ONIK] ${action}`);
  }
}

export const threeOnikEngine = ThreeOnikEngine.getInstance();
