/**
 * 3WM SONIK — Audio-Reactive Shader Material
 * Custom GLSL shader that reacts to audio energy for 3D agent avatars
 * Supports bass, treble, and BPM-based visual effects
 */

import * as THREE from 'three';

export interface AudioReactiveUniforms {
  uBassEnergy: number;
  uTrebleFlux: number;
  uBpmPhase: number;
  uTime: number;
  uColor: THREE.ColorRepresentation;
  uEmissiveIntensity: number;
}

export const audioReactiveVertexShader = `
uniform float uBassEnergy;
uniform float uTrebleFlux;
uniform float uBpmPhase;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vAudioIntensity;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;

  // Calculate audio-reactive displacement
  float displacement = 0.0;
  
  // Bass energy affects scale
  displacement += uBassEnergy * 0.1;
  
  // Treble flux affects position jitter
  displacement += uTrebleFlux * 0.05 * sin(uTime * 10.0);
  
  // BPM phase affects rhythmic pulsing
  displacement += sin(uBpmPhase * 6.28318) * 0.02;

  // Apply displacement along normal
  vec3 newPosition = position + normal * displacement;
  
  // Pass audio intensity to fragment shader
  vAudioIntensity = uBassEnergy + uTrebleFlux * 0.5;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

export const audioReactiveFragmentShader = `
uniform float uBassEnergy;
uniform float uTrebleFlux;
uniform float uBpmPhase;
uniform float uTime;
uniform vec3 uColor;
uniform float uEmissiveIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vAudioIntensity;

void main() {
  // Base color
  vec3 baseColor = uColor;
  
  // Audio-reactive emission
  float emission = uEmissiveIntensity * (0.5 + uBassEnergy * 0.5);
  
  // Treble flux creates shimmering effect
  float shimmer = sin(uTime * 20.0 + vPosition.x * 10.0) * uTrebleFlux * 0.3;
  
  // Bass energy creates pulsing glow
  float pulse = sin(uBpmPhase * 6.28318) * uBassEnergy * 0.5;
  
  // Combine effects
  vec3 finalColor = baseColor + baseColor * (emission + shimmer + pulse);
  
  // Add rim lighting
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
  rim = pow(rim, 3.0);
  finalColor += rim * uColor * 0.5 * (1.0 + uBassEnergy);
  
  // Audio-reactive alpha for transparency effects
  float alpha = 0.8 + uTrebleFlux * 0.2;
  
  gl_FragColor = vec4(finalColor, alpha);
}
`;

export class AudioReactiveMaterial extends THREE.ShaderMaterial {
  constructor(color: THREE.ColorRepresentation = 0xffffff) {
    super({
      uniforms: {
        uBassEnergy: { value: 0 },
        uTrebleFlux: { value: 0 },
        uBpmPhase: { value: 0 },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uEmissiveIntensity: { value: 0.5 },
      },
      vertexShader: audioReactiveVertexShader,
      fragmentShader: audioReactiveFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Update audio-reactive uniforms
   */
  updateAudioData(uniforms: Partial<AudioReactiveUniforms>): void {
    if (uniforms.uBassEnergy !== undefined) {
      this.uniforms.uBassEnergy.value = uniforms.uBassEnergy;
    }
    if (uniforms.uTrebleFlux !== undefined) {
      this.uniforms.uTrebleFlux.value = uniforms.uTrebleFlux;
    }
    if (uniforms.uBpmPhase !== undefined) {
      this.uniforms.uBpmPhase.value = uniforms.uBpmPhase;
    }
    if (uniforms.uTime !== undefined) {
      this.uniforms.uTime.value = uniforms.uTime;
    }
    if (uniforms.uColor !== undefined) {
      this.uniforms.uColor.value = new THREE.Color(uniforms.uColor);
    }
    if (uniforms.uEmissiveIntensity !== undefined) {
      this.uniforms.uEmissiveIntensity.value = uniforms.uEmissiveIntensity;
    }
  }

  /**
   * Get current uniform values
   */
  getUniforms(): AudioReactiveUniforms {
    return {
      uBassEnergy: this.uniforms.uBassEnergy.value,
      uTrebleFlux: this.uniforms.uTrebleFlux.value,
      uBpmPhase: this.uniforms.uBpmPhase.value,
      uTime: this.uniforms.uTime.value,
      uColor: this.uniforms.uColor.value,
      uEmissiveIntensity: this.uniforms.uEmissiveIntensity.value,
    };
  }
}

/**
 * Agent-specific shader configurations
 */
export const AGENT_SHADER_CONFIGS: Record<
  'emar' | 'ricky' | 'kingpin',
  { color: THREE.ColorRepresentation; emissiveIntensity: number }
> = {
  emar: {
    color: 0x2affa3, // Scientist Mint
    emissiveIntensity: 0.7,
  },
  ricky: {
    color: 0xf5a800, // Sound God Gold
    emissiveIntensity: 0.9,
  },
  kingpin: {
    color: 0xff3c00, // Vocal Oracle Fire
    emissiveIntensity: 1.0,
  },
};

/**
 * Create an audio-reactive material for a specific agent
 */
export function createAgentMaterial(agent: 'emar' | 'ricky' | 'kingpin'): AudioReactiveMaterial {
  const config = AGENT_SHADER_CONFIGS[agent];
  return new AudioReactiveMaterial(config.color);
}
