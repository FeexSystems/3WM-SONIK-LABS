/**
 * 3WM SONIK — Agent Procedural Geometry
 * Enhanced fallback geometry representing each agent's visual identity
 * Serves as placeholder until actual GLTF models are created
 */

import * as THREE from 'three';

export type AgentType = 'emar' | 'ricky' | 'kingpin';

interface AgentGeometryConfig {
  baseColor: number;
  emissiveColor: number;
  shapes: Array<{
    type: 'sphere' | 'box' | 'cone' | 'torus' | 'cylinder' | 'icosahedron';
    position: [number, number, number];
    scale: [number, number, number];
    rotation?: [number, number, number];
  }>;
}

const AGENT_GEOMETRY: Record<AgentType, AgentGeometryConfig> = {
  emar: {
    baseColor: 0x2affa3, // Scientist Mint
    emissiveColor: 0x2affa3,
    shapes: [
      // Base sphere (analytical core)
      { type: 'sphere', position: [0, 0, 0], scale: [0.5, 0.5, 0.5] },
      // Floating data cubes (data visualization)
      { type: 'box', position: [0.6, 0.3, 0], scale: [0.15, 0.15, 0.15], rotation: [0.5, 0.5, 0] },
      {
        type: 'box',
        position: [-0.6, 0.2, 0.2],
        scale: [0.12, 0.12, 0.12],
        rotation: [-0.3, 0.7, 0.2],
      },
      { type: 'box', position: [0, 0.7, -0.3], scale: [0.1, 0.1, 0.1], rotation: [0.8, 0.2, -0.5] },
      // Hexagonal rings (scientific precision)
      { type: 'icosahedron', position: [0, -0.4, 0], scale: [0.3, 0.3, 0.3] },
    ],
  },
  ricky: {
    baseColor: 0xf5a800, // Sound God Gold
    emissiveColor: 0xf5a800,
    shapes: [
      // Base cone (drum/808 shape)
      { type: 'cone', position: [0, -0.2, 0], scale: [0.4, 0.6, 0.4] },
      // Floating drum elements
      { type: 'cylinder', position: [0.5, 0.4, 0], scale: [0.1, 0.2, 0.1] },
      { type: 'cylinder', position: [-0.5, 0.3, 0.2], scale: [0.08, 0.15, 0.08] },
      // Dynamic torus rings (rhythm)
      {
        type: 'torus',
        position: [0, 0.5, 0],
        scale: [0.3, 0.3, 0.3],
        rotation: [Math.PI / 2, 0, 0],
      },
      // Energetic spikes
      { type: 'cone', position: [0, 0.8, 0], scale: [0.15, 0.3, 0.15] },
    ],
  },
  kingpin: {
    baseColor: 0xff3c00, // Vocal Oracle Fire
    emissiveColor: 0xff3c00,
    shapes: [
      // Base sphere (vocal core)
      { type: 'sphere', position: [0, 0, 0], scale: [0.45, 0.45, 0.45] },
      // Crown elements (regal identity)
      { type: 'cone', position: [0, 0.6, 0], scale: [0.2, 0.3, 0.2] },
      { type: 'cone', position: [0.15, 0.55, 0], scale: [0.1, 0.25, 0.1] },
      { type: 'cone', position: [-0.15, 0.55, 0], scale: [0.1, 0.25, 0.1] },
      // Vocal rings (expression)
      {
        type: 'torus',
        position: [0, 0.1, 0],
        scale: [0.35, 0.35, 0.35],
        rotation: [Math.PI / 2, 0, 0],
      },
      {
        type: 'torus',
        position: [0, 0.25, 0],
        scale: [0.25, 0.25, 0.25],
        rotation: [Math.PI / 2, 0, 0],
      },
    ],
  },
};

export function createAgentGeometry(agent: AgentType): THREE.Group {
  const config = AGENT_GEOMETRY[agent];
  const group = new THREE.Group();

  config.shapes.forEach((shapeConfig) => {
    let geometry: THREE.BufferGeometry;

    switch (shapeConfig.type) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(1, 32, 32);
        break;
      case 'box':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(1, 1, 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(1, 0.3, 16, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(1, 1, 1, 32);
        break;
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(1, 0);
        break;
      default:
        geometry = new THREE.SphereGeometry(1, 32, 32);
    }

    const material = new THREE.MeshStandardMaterial({
      color: config.baseColor,
      emissive: config.emissiveColor,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...shapeConfig.position);
    mesh.scale.set(...shapeConfig.scale);

    if (shapeConfig.rotation) {
      mesh.rotation.set(...shapeConfig.rotation);
    }

    group.add(mesh);
  });

  return group;
}

export function getAgentColor(agent: AgentType): number {
  return AGENT_GEOMETRY[agent].baseColor;
}

export function getAgentEmissiveColor(agent: AgentType): number {
  return AGENT_GEOMETRY[agent].emissiveColor;
}
