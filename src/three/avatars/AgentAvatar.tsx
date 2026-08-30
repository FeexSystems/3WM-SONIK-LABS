// @ts-nocheck
/**
 * 3WM SONIK — Agent Avatar 3D Component
 * Renders 3D avatars for The Three Wise Men
 */

import { useRef, useEffect, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { createAgentGeometry, getAgentColor, getAgentEmissiveColor } from './AgentGeometry';
import { LipSyncSystem } from '@/audio/lipSync';
import { GestureSystem } from '@/audio/gestureSystem';
import { DataVisualizationSystem } from '@/audio/dataVisualization';

export type AgentType = 'emar' | 'ricky' | 'kingpin';
export type AgentState = 'idle' | 'analyzing' | 'processing' | 'success' | 'error';

interface AgentAvatarProps {
  agent: AgentType;
  state?: AgentState;
  bassEnergy?: number;
  trebleFlux?: number;
  bpmPhase?: number;
  position?: [number, number, number];
  scale?: number;
  onLoad?: () => void;
  analyser?: AnalyserNode | null; // For lip-sync and audio reactivity
}

const AVATAR_MODELS: Record<AgentType, string> = {
  emar: '/models/avatars/emar.glb',
  ricky: '/models/avatars/ricky.glb',
  kingpin: '/models/avatars/kingpin.glb',
};

// Using procedural geometry colors for consistency
const AVATAR_COLORS: Record<AgentType, THREE.ColorRepresentation> = {
  emar: 0x2affa3, // Scientist Mint
  ricky: 0xf5a800, // Sound God Gold
  kingpin: 0xff3c00, // Vocal Oracle Fire
};

export function AgentAvatar({
  agent,
  state = 'idle',
  bassEnergy = 0,
  trebleFlux = 0,
  bpmPhase = 0,
  position = [0, 0, 0],
  scale = 1,
  onLoad,
  analyser,
}: AgentAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Lip-sync system for Kingpin
  const lipSyncRef = useRef<LipSyncSystem | null>(null);
  const [mouthOpen, setMouthOpen] = useState(0);

  // Gesture system for Ricky
  const gestureRef = useRef<GestureSystem | null>(null);
  const [gestureTransforms, setGestureTransforms] = useState({
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
  });

  // Data visualization system for Emar
  const dataVizRef = useRef<DataVisualizationSystem | null>(null);
  const [dataVizElements, setDataVizElements] = useState({
    cubes: [] as Array<{
      position: [number, number, number];
      scale: number;
      color: string;
      rotationSpeed: number;
    }>,
    rings: [] as Array<{ radius: number; rotation: number; intensity: number }>,
  });

  // Try to load GLTF model
  const { scene, animations } = useGLTF(
    useFallback ? '' : AVATAR_MODELS[agent],
    undefined,
    (error) => {
      console.warn(`Failed to load ${agent} avatar, using fallback:`, error);
      setUseFallback(true);
    }
  );

  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    if (scene) {
      setModelLoaded(true);
      onLoad?.();
    }
  }, [scene, onLoad]);

  // Initialize lip-sync for Kingpin
  useEffect(() => {
    if (agent === 'kingpin' && analyser && !lipSyncRef.current) {
      lipSyncRef.current = new LipSyncSystem();
      lipSyncRef.current.initialize(analyser);
    }
  }, [agent, analyser]);

  // Initialize gesture system for Ricky
  useEffect(() => {
    if (agent === 'ricky' && analyser && !gestureRef.current) {
      gestureRef.current = new GestureSystem();
      gestureRef.current.initialize(analyser);
      gestureRef.current.setBPM(120); // Default BPM
    }
  }, [agent, analyser]);

  // Initialize data visualization system for Emar
  useEffect(() => {
    if (agent === 'emar' && analyser && !dataVizRef.current) {
      dataVizRef.current = new DataVisualizationSystem({
        color: '#2AFFA3',
        updateRate: 30,
      });
      dataVizRef.current.initialize(analyser);
    }
  }, [agent, analyser]);

  // Update lip-sync on each frame
  useEffect(() => {
    if (agent === 'kingpin' && lipSyncRef.current) {
      const updateLipSync = () => {
        const mouthOpenAmount = lipSyncRef.current!.update();
        setMouthOpen(mouthOpenAmount);
        requestAnimationFrame(updateLipSync);
      };
      updateLipSync();

      return () => {
        // Cleanup would happen on unmount
      };
    }
  }, [agent]);

  // Update gesture system on each frame
  useEffect(() => {
    if (agent === 'ricky' && gestureRef.current) {
      const updateGestures = () => {
        gestureRef.current!.update();
        const transforms = gestureRef.current!.getGestureTransforms();
        setGestureTransforms(transforms);
        requestAnimationFrame(updateGestures);
      };
      updateGestures();

      return () => {
        // Cleanup would happen on unmount
      };
    }
  }, [agent]);

  // Update data visualization system on each frame
  useEffect(() => {
    if (agent === 'emar' && dataVizRef.current) {
      const updateDataViz = () => {
        const elements = dataVizRef.current!.get3DVisualizationData();
        setDataVizElements(elements);
        requestAnimationFrame(updateDataViz);
      };
      updateDataViz();

      return () => {
        // Cleanup would happen on unmount
      };
    }
  }, [agent]);

  // Handle state-based animations with enhanced mapping
  useEffect(() => {
    if (!actions || useFallback) return;

    // Stop all animations
    Object.values(actions).forEach((action) => action.stop());

    // Play state-specific animation with transitions
    const transitionTime = 0.3;

    switch (state) {
      case 'analyzing':
        // Emar: Data visualization animation
        // Ricky: Beat analysis animation
        // Kingpin: Vocal analysis animation
        if (actions['analyzing']) {
          actions['analyzing'].reset().fadeIn(transitionTime).play();
        } else if (actions['idle']) {
          actions['idle'].reset().fadeIn(transitionTime).play();
        }
        break;
      case 'processing':
        // All agents: Processing/work animation
        if (actions['processing']) {
          actions['processing'].reset().fadeIn(transitionTime).play();
        } else if (actions['analyzing']) {
          actions['analyzing'].reset().fadeIn(transitionTime).play();
        }
        break;
      case 'success':
        // All agents: Success/celebration animation
        if (actions['success']) {
          actions['success'].reset().fadeIn(transitionTime).play();
        } else if (actions['idle']) {
          actions['idle'].reset().fadeIn(transitionTime).play();
        }
        break;
      case 'error':
        // All agents: Error/shake animation
        if (actions['error']) {
          actions['error'].reset().fadeIn(transitionTime).play();
        } else if (actions['idle']) {
          actions['idle'].reset().fadeIn(transitionTime).play();
        }
        break;
      default:
        // Idle state
        if (actions['idle']) {
          actions['idle'].reset().fadeIn(transitionTime).play();
        }
    }
  }, [state, actions, useFallback]);

  // Agent-specific animation variations based on state
  useEffect(() => {
    if (!groupRef.current || useFallback) return;

    const group = groupRef.current;

    // Base audio-reactive effects
    const scaleMultiplier = 1 + bassEnergy * 0.3;
    group.scale.setScalar(scale * scaleMultiplier);

    // Rotation based on treble flux
    group.rotation.y = trebleFlux * Math.PI * 2;

    // Position bob based on BPM phase
    group.position.y = position[1] + Math.sin(bpmPhase * Math.PI * 2) * 0.1;

    // Agent-specific state-based modifications
    switch (agent) {
      case 'emar':
        // Emar: More analytical, subtle movements
        if (state === 'analyzing') {
          group.rotation.x = Math.sin(Date.now() / 1000) * 0.1;
        }
        // Data visualization elements are rendered separately
        break;
      case 'ricky':
        // Ricky: More energetic, larger movements
        if (state === 'processing') {
          group.position.x = position[0] + Math.sin(Date.now() / 500) * 0.05;
        }
        // Apply gesture transforms
        group.position.x = position[0] + gestureTransforms.position[0];
        group.position.y = position[1] + gestureTransforms.position[1];
        group.position.z = position[2] + gestureTransforms.position[2];
        group.rotation.x = gestureTransforms.rotation[0];
        group.rotation.y = gestureTransforms.rotation[1];
        group.rotation.z = gestureTransforms.rotation[2];
        group.scale.x = scale * gestureTransforms.scale[0];
        group.scale.y = scale * gestureTransforms.scale[1];
        group.scale.z = scale * gestureTransforms.scale[2];
        break;
      case 'kingpin':
        // Kingpin: More expressive, vocal-focused movements
        if (state === 'success') {
          group.rotation.z = Math.sin(Date.now() / 300) * 0.15;
        }
        // Apply lip-sync to mouth geometry if available
        if (mouthOpen > 0.1 && group.children.length > 0) {
          // Find and animate mouth geometry
          group.children.forEach((child) => {
            if (child instanceof THREE.Mesh && child.name?.toLowerCase().includes('mouth')) {
              // Scale mouth geometry based on lip-sync
              child.scale.y = 1 + mouthOpen * 0.5;
              child.position.y = child.position.y + mouthOpen * 0.05;
            }
          });
        }
        break;
    }
  }, [bassEnergy, trebleFlux, bpmPhase, position, scale, useFallback, state, agent, mouthOpen]);

  // Fallback geometry when model fails to load
  if (useFallback || !modelLoaded) {
    const proceduralGeometry = createAgentGeometry(agent);

    return (
      <group ref={groupRef} position={position} scale={scale}>
        <primitive object={proceduralGeometry} />

        {/* Render data visualization elements for Emar */}
        {agent === 'emar' && (
          <>
            {/* Floating data cubes */}
            {dataVizElements.cubes.map((cube, index) => (
              <mesh key={`cube-${index}`} position={cube.position} scale={cube.scale}>
                <boxGeometry />
                <meshStandardMaterial
                  color={cube.color}
                  emissive={cube.color}
                  emissiveIntensity={0.5}
                />
              </mesh>
            ))}

            {/* Data rings */}
            {dataVizElements.rings.map((ring, index) => (
              <mesh key={`ring-${index}`} rotation={[Math.PI / 2, 0, ring.rotation]}>
                <torusGeometry args={[ring.radius, 0.02, 16, 100]} />
                <meshStandardMaterial
                  color="#2AFFA3"
                  emissive="#2AFFA3"
                  emissiveIntensity={ring.intensity * 0.8}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            ))}
          </>
        )}
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

// Preload models
useGLTF.preload(AVATAR_MODELS.emar);
useGLTF.preload(AVATAR_MODELS.ricky);
useGLTF.preload(AVATAR_MODELS.kingpin);
