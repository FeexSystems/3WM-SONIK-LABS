import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';
import { AgentAuraShaderMaterial } from '../shaders/agentAuraShader';

interface AgentMeshProps {
  agentId: 'emar' | 'ricky' | 'kingpin';
  position?: [number, number, number];
  audioContext?: AudioContext | null;
  audioSource?: AudioNode | null;
}

/**
 * AgentMesh
 * Loads and renders the specific .glb model for a 3WM agent.
 * Applies audio-reactive logic to materials or blend shapes.
 */
export const AgentMesh: React.FC<AgentMeshProps> = ({
  agentId,
  position = [0, 0, 0],
  audioContext = null,
  audioSource = null,
}) => {
  // Construct path based on the directory structure defined in the architectural blueprint
  const glbPath = `/models/agents/${agentId}_v1.glb`;

  // This will suspend the component until the GLTF is loaded
  const { scene } = useGLTF(glbPath);

  const groupRef = useRef<THREE.Group>(null);

  // Hook up the audio analyzer to drive reactive visuals
  const audioMetrics = useAudioAnalyzer(audioContext, audioSource);

  const AGENT_COLORS: Record<string, string> = {
    emar: '#2AFFA3', // Scientist Mint
    ricky: '#F5A800', // Sound God Gold
    kingpin: '#FF3C00', // Vocal Oracle Fire
  };

  const auraMaterialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const { kickIntensity, vocalEnergy, overallRMS } = audioMetrics.current;

    // Direct scale audio reactivity without React state overhead
    const scale = 1 + kickIntensity * 0.12;
    groupRef.current.scale.set(scale, scale, scale);

    // Update shader uniforms
    if (auraMaterialRef.current) {
      auraMaterialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      auraMaterialRef.current.uniforms.uBassIntensity.value = kickIntensity;
      auraMaterialRef.current.uniforms.uVocalEnergy.value = vocalEnergy;
      auraMaterialRef.current.uniforms.uTrebleFlux.value = overallRMS;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive object={scene} />
      {/* Metaphysical Audio-Reactive Aura Sphere */}
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[1, 32, 32]} />
        <shaderMaterial
          ref={auraMaterialRef}
          attach="material"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(AGENT_COLORS[agentId] || '#F5A800') },
            uBassIntensity: { value: 0 },
            uVocalEnergy: { value: 0 },
            uTrebleFlux: { value: 0 },
            uPulseSpeed: { value: 1.0 },
            uNoiseScale: { value: 2.0 },
          }}
          vertexShader={AgentAuraShaderMaterial.vertexShader}
          fragmentShader={AgentAuraShaderMaterial.fragmentShader}
        />
      </mesh>
    </group>
  );
};

// Preload the assets so they are ready in cache before rendering
// useGLTF.preload('/models/agents/emar_v1.glb');
// useGLTF.preload('/models/agents/ricky_v1.glb');
// useGLTF.preload('/models/agents/kingpin_v1.glb');
