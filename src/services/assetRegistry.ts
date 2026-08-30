/**
 * 3WM SONIK — Authoritative 3D Semantic Asset Registry
 *
 * Defines canonical runtime asset mappings (GLB 4K/2K/1K & USDZ for Apple AR),
 * capabilities (audioReactive, beatSync, agentControllable), and semantic controls.
 */

export interface AssetRuntimeDelivery {
  web: {
    glb: string;
    glb4k?: string;
    glb2k?: string;
    glb1k?: string;
  };
  ar?: {
    usdz: string;
  };
}

export interface AssetCapabilities {
  animation: boolean;
  audioReactive: boolean;
  beatSync: boolean;
  agentControllable: boolean;
  interactive: boolean;
}

export interface AssetControls {
  position: boolean;
  rotation: boolean;
  scale: boolean;
  visibility: boolean;
  emission: boolean;
  intensity: boolean;
  animations: string[];
}

export interface Semantic3DAsset {
  assetId: string;
  version: string;
  type: 'character' | 'instrument' | 'environment' | 'effect' | 'camera' | 'light';
  category: string;
  name: string;
  color: string;
  runtime: AssetRuntimeDelivery;
  capabilities: AssetCapabilities;
  controls: AssetControls;
  metadata: {
    artist?: string;
    description: string;
    polyBudget: number;
    recommendedLOD: string;
  };
}

export const ASSET_REGISTRY: Record<string, Semantic3DAsset> = {
  'character.emar.v1': {
    assetId: 'character.emar.v1',
    version: '1.0.0',
    type: 'character',
    category: 'agent-avatar',
    name: 'Kappachino Emar',
    color: '#2AFFA3',
    runtime: {
      web: {
        glb: '/assets/characters/emar/emar.glb',
        glb4k: '/assets/characters/emar/emar-4k.glb',
        glb2k: '/assets/characters/emar/emar-2k.glb',
        glb1k: '/assets/characters/emar/emar-1k.glb',
      },
      ar: {
        usdz: '/assets/characters/emar/emar.usdz',
      },
    },
    capabilities: {
      animation: true,
      audioReactive: true,
      beatSync: true,
      agentControllable: true,
      interactive: true,
    },
    controls: {
      position: true,
      rotation: true,
      scale: true,
      visibility: true,
      emission: true,
      intensity: true,
      animations: ['idle', 'analyze', 'dsp-calculate', 'wave-tune', 'celebrate'],
    },
    metadata: {
      artist: 'The Scientist',
      description:
        'Technical Intelligence & Audio DSP Engineer. Sacred Octahedral Lattice geometry.',
      polyBudget: 45000,
      recommendedLOD: '2k',
    },
  },

  'character.ricky.v1': {
    assetId: 'character.ricky.v1',
    version: '1.0.0',
    type: 'character',
    category: 'agent-avatar',
    name: 'Kappachino Ricky',
    color: '#F5A800',
    runtime: {
      web: {
        glb: '/assets/characters/ricky/ricky.glb',
        glb4k: '/assets/characters/ricky/ricky-4k.glb',
        glb2k: '/assets/characters/ricky/ricky-2k.glb',
        glb1k: '/assets/characters/ricky/ricky-1k.glb',
      },
      ar: {
        usdz: '/assets/characters/ricky/ricky.usdz',
      },
    },
    capabilities: {
      animation: true,
      audioReactive: true,
      beatSync: true,
      agentControllable: true,
      interactive: true,
    },
    controls: {
      position: true,
      rotation: true,
      scale: true,
      visibility: true,
      emission: true,
      intensity: true,
      animations: ['idle', 'groove-bounce', 'drum-strike', '808-drop', 'celebrate'],
    },
    metadata: {
      artist: 'The Sound God',
      description: 'Sound-generation Intelligence & Beatmaster. Liquid Gold Resonator geometry.',
      polyBudget: 52000,
      recommendedLOD: '2k',
    },
  },

  'character.kingpin.v1': {
    assetId: 'character.kingpin.v1',
    version: '1.0.0',
    type: 'character',
    category: 'agent-avatar',
    name: 'Kingpin',
    color: '#FF3C00',
    runtime: {
      web: {
        glb: '/assets/characters/kingpin/kingpin.glb',
        glb4k: '/assets/characters/kingpin/kingpin-4k.glb',
        glb2k: '/assets/characters/kingpin/kingpin-2k.glb',
        glb1k: '/assets/characters/kingpin/kingpin-1k.glb',
      },
      ar: {
        usdz: '/assets/characters/kingpin/kingpin.usdz',
      },
    },
    capabilities: {
      animation: true,
      audioReactive: true,
      beatSync: true,
      agentControllable: true,
      interactive: true,
    },
    controls: {
      position: true,
      rotation: true,
      scale: true,
      visibility: true,
      emission: true,
      intensity: true,
      animations: ['idle', 'vocal-chant', 'choir-stack', 'soul-cry', 'celebrate'],
    },
    metadata: {
      artist: 'The Vocal Oracle',
      description: 'Vocal Intelligence & Harmonics Architect. Volcanic Ember Core geometry.',
      polyBudget: 48000,
      recommendedLOD: '2k',
    },
  },

  'character.orchestrator.v1': {
    assetId: 'character.orchestrator.v1',
    version: '1.0.0',
    type: 'character',
    category: 'agent-avatar',
    name: 'ThreeWM Orchestrator',
    color: '#F5A800',
    runtime: {
      web: {
        glb: '/assets/characters/orchestrator/orchestrator.glb',
        glb4k: '/assets/characters/orchestrator/orchestrator-4k.glb',
        glb2k: '/assets/characters/orchestrator/orchestrator-2k.glb',
        glb1k: '/assets/characters/orchestrator/orchestrator-1k.glb',
      },
      ar: {
        usdz: '/assets/characters/orchestrator/orchestrator.usdz',
      },
    },
    capabilities: {
      animation: true,
      audioReactive: true,
      beatSync: true,
      agentControllable: true,
      interactive: true,
    },
    controls: {
      position: true,
      rotation: true,
      scale: true,
      visibility: true,
      emission: true,
      intensity: true,
      animations: ['idle', 'consensus-align', 'neural-sweep', 'pulse'],
    },
    metadata: {
      artist: 'The Council Orchestrator',
      description: 'Coordination Intelligence. Sacred Icosahedron Dynamic Tessellation.',
      polyBudget: 35000,
      recommendedLOD: '2k',
    },
  },

  'environment.beat-lab.v1': {
    assetId: 'environment.beat-lab.v1',
    version: '1.0.0',
    type: 'environment',
    category: 'studio-stage',
    name: 'Beat Lab Lagos Kalakuta',
    color: '#181410',
    runtime: {
      web: {
        glb: '/assets/environments/beat-lab/beat-lab.glb',
        glb4k: '/assets/environments/beat-lab/beat-lab-4k.glb',
        glb2k: '/assets/environments/beat-lab/beat-lab-2k.glb',
        glb1k: '/assets/environments/beat-lab/beat-lab-1k.glb',
      },
      ar: {
        usdz: '/assets/environments/beat-lab/beat-lab.usdz',
      },
    },
    capabilities: {
      animation: false,
      audioReactive: true,
      beatSync: true,
      agentControllable: true,
      interactive: true,
    },
    controls: {
      position: false,
      rotation: true,
      scale: false,
      visibility: true,
      emission: true,
      intensity: true,
      animations: ['ambient-fog', 'strobe-sweep'],
    },
    metadata: {
      description:
        'Lagos Kalakuta studio room with acoustic diffusers, warm tube reflections, and floating VU meters.',
      polyBudget: 120000,
      recommendedLOD: '4k',
    },
  },

  'effect.energy-field.v1': {
    assetId: 'effect.energy-field.v1',
    version: '1.0.0',
    type: 'effect',
    category: 'holographic-fx',
    name: 'Sonic Energy Field',
    color: '#2AFFA3',
    runtime: {
      web: {
        glb: '/assets/effects/energy-field.glb',
      },
    },
    capabilities: {
      animation: true,
      audioReactive: true,
      beatSync: true,
      agentControllable: true,
      interactive: false,
    },
    controls: {
      position: true,
      rotation: true,
      scale: true,
      visibility: true,
      emission: true,
      intensity: true,
      animations: ['pulse', 'hyper-drive', 'resonance-ring'],
    },
    metadata: {
      description: 'Volumetric particle turbulence and holographic frequency prism.',
      polyBudget: 15000,
      recommendedLOD: '1k',
    },
  },
};

export class AssetRegistryService {
  public getAsset(assetId: string): Semantic3DAsset | undefined {
    return ASSET_REGISTRY[assetId];
  }

  public getAllAssets(): Semantic3DAsset[] {
    return Object.values(ASSET_REGISTRY);
  }

  public getAssetsByType(type: Semantic3DAsset['type']): Semantic3DAsset[] {
    return Object.values(ASSET_REGISTRY).filter((a) => a.type === type);
  }

  public getAgentAsset(
    agentId: 'emar' | 'ricky' | 'kingpin' | 'orchestrator'
  ): Semantic3DAsset | undefined {
    return ASSET_REGISTRY[`character.${agentId}.v1`];
  }
}

export const assetRegistry = new AssetRegistryService();
