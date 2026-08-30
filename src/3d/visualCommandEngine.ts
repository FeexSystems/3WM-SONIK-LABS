/**
 * 3WM SONIK — Visual Command Engine & Semantic Scene Graph
 *
 * Secure validation and dispatching layer for AI Agent visual tool calls.
 * Ensures agents reason about semantic entities without direct access to Three.js internals.
 */

import { assetRegistry } from '../services/assetRegistry';

export type VisualCommandType =
  | 'visual.action'
  | 'visual.transform'
  | 'visual.animation'
  | 'visual.effect'
  | 'visual.camera'
  | 'visual.light';

export interface VisualActionCommand {
  type: 'visual.action';
  target: string;
  action: string;
  parameters?: {
    intensity?: number;
    beatSync?: boolean;
    emission?: number;
    color?: string;
  };
}

export interface VisualTransformCommand {
  type: 'visual.transform';
  target: string;
  parameters: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number | [number, number, number];
  };
}

export interface VisualAnimationCommand {
  type: 'visual.animation';
  target: string;
  animation: string;
  parameters?: {
    loop?: boolean;
    speed?: number;
    crossFadeDuration?: number;
  };
}

export interface VisualEffectCommand {
  type: 'visual.effect';
  target: string;
  effect: string;
  parameters?: {
    intensity?: number;
    audioReactive?: boolean;
    duration?: number;
  };
}

export type VisualCommand =
  VisualActionCommand | VisualTransformCommand | VisualAnimationCommand | VisualEffectCommand;

export interface SemanticEntityState {
  target: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  activeAnimation: string;
  emission: number;
  intensity: number;
  color: string;
  visible: boolean;
  audioReactive: boolean;
  beatSync: boolean;
}

export interface SceneGraphState {
  entities: Record<string, SemanticEntityState>;
  camera: {
    target: [number, number, number];
    position: [number, number, number];
    fov: number;
    focusAgent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator' | null;
  };
  lighting: {
    ambientIntensity: number;
    spotlightIntensity: number;
    strobeActive: boolean;
  };
}

class VisualCommandEngine {
  private state: SceneGraphState;
  private listeners: Set<(state: SceneGraphState) => void> = new Set<
    (state: SceneGraphState) => void
  >();

  constructor() {
    this.state = this.getInitialSceneState();
  }

  public getState(): SceneGraphState {
    return this.state;
  }

  public subscribe(callback: (state: SceneGraphState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Validates and executes an agent visual command
   */
  public executeCommand(command: VisualCommand): { success: boolean; error?: string } {
    // 1. Tool Schema & Target Validation
    if (!command || !command.type || !command.target) {
      return { success: false, error: 'Invalid command schema: missing type or target' };
    }

    const entityState = this.state.entities[command.target];
    if (
      !entityState &&
      !command.target.startsWith('camera') &&
      !command.target.startsWith('light')
    ) {
      return {
        success: false,
        error: `Semantic entity "${command.target}" not found in scene graph`,
      };
    }

    // 2. Action Execution & State Mutation
    switch (command.type) {
      case 'visual.action': {
        if (entityState) {
          if (command.parameters?.intensity !== undefined) {
            entityState.intensity = Math.max(0, Math.min(2, command.parameters.intensity));
          }
          if (command.parameters?.emission !== undefined) {
            entityState.emission = Math.max(0, Math.min(5, command.parameters.emission));
          }
          if (command.parameters?.beatSync !== undefined) {
            entityState.beatSync = command.parameters.beatSync;
          }
          if (command.parameters?.color) {
            entityState.color = command.parameters.color;
          }
          entityState.activeAnimation = command.action;
        }
        break;
      }

      case 'visual.transform': {
        if (entityState && command.parameters) {
          if (command.parameters.position) {
            entityState.position = [...command.parameters.position];
          }
          if (command.parameters.rotation) {
            entityState.rotation = [...command.parameters.rotation];
          }
          if (command.parameters.scale !== undefined) {
            if (typeof command.parameters.scale === 'number') {
              const s = command.parameters.scale;
              entityState.scale = [s, s, s];
            } else {
              entityState.scale = [...command.parameters.scale];
            }
          }
        }
        break;
      }

      case 'visual.animation': {
        if (entityState) {
          entityState.activeAnimation = command.animation;
        }
        break;
      }

      case 'visual.effect': {
        if (entityState && command.parameters) {
          if (command.parameters.intensity !== undefined) {
            entityState.intensity = command.parameters.intensity;
          }
          if (command.parameters.audioReactive !== undefined) {
            entityState.audioReactive = command.parameters.audioReactive;
          }
        }
        break;
      }

      default:
        return { success: false, error: `Unsupported visual command type` };
    }

    this.notify();
    return { success: true };
  }

  /**
   * Helper to focus camera on a specific Wise Man agent
   */
  public focusAgent(agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator' | null): void {
    this.state.camera.focusAgent = agent;
    if (agent === 'emar') {
      this.state.camera.position = [-2.8, 0.4, 4.2];
    } else if (agent === 'ricky') {
      this.state.camera.position = [0, 0.5, 4.0];
    } else if (agent === 'kingpin') {
      this.state.camera.position = [2.8, 0.4, 4.2];
    } else {
      this.state.camera.position = [0, 0, 5.5];
    }
    this.notify();
  }

  private getInitialSceneState(): SceneGraphState {
    return {
      entities: {
        'character.emar': {
          target: 'character.emar',
          position: [-2.6, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          activeAnimation: 'idle',
          emission: 0.8,
          intensity: 1.0,
          color: '#2AFFA3',
          visible: true,
          audioReactive: true,
          beatSync: true,
        },
        'character.ricky': {
          target: 'character.ricky',
          position: [0, 0.2, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          activeAnimation: 'idle',
          emission: 1.2,
          intensity: 1.0,
          color: '#F5A800',
          visible: true,
          audioReactive: true,
          beatSync: true,
        },
        'character.kingpin': {
          target: 'character.kingpin',
          position: [2.6, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          activeAnimation: 'idle',
          emission: 1.0,
          intensity: 1.0,
          color: '#FF3C00',
          visible: true,
          audioReactive: true,
          beatSync: true,
        },
        'character.orchestrator': {
          target: 'character.orchestrator',
          position: [0, 0, -1.2],
          rotation: [0, 0, 0],
          scale: [1.4, 1.4, 1.4],
          activeAnimation: 'idle',
          emission: 0.5,
          intensity: 1.0,
          color: '#F5A800',
          visible: true,
          audioReactive: true,
          beatSync: true,
        },
      },
      camera: {
        target: [0, 0, 0],
        position: [0, 0, 5.5],
        fov: 45,
        focusAgent: null,
      },
      lighting: {
        ambientIntensity: 0.4,
        spotlightIntensity: 2.5,
        strobeActive: false,
      },
    };
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.state));
  }
}

export const visualCommandEngine = new VisualCommandEngine();
