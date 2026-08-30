import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * AgentSkeleton
 * A fallback mesh shown within a Suspense boundary while the actual .glb agent model loads.
 */
export const AgentSkeleton: React.FC<{ position?: [number, number, number] }> = ({
  position = [0, 0, 0],
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Simple floating/breathing animation for the loading state
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <capsuleGeometry args={[0.5, 1.5, 4, 16]} />
      <meshStandardMaterial
        color="#2AFFA3" // EMAR's mint signature color placeholder
        wireframe={true}
        transparent={true}
        opacity={0.5}
      />
    </mesh>
  );
};
