import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { AgentSkeleton } from '../components/AgentSkeleton';
import { AgentMesh } from '../components/AgentMesh';

/**
 * ThreeCanvas Provider
 * The root WebGL entry point for 3WM 3D Asset rendering.
 * Should be mounted independently of heavy React DOM updates.
 */
export const ThreeCanvas: React.FC = () => {
  return (
    <div className="w-full h-full absolute inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        dpr={[1, 2]} // Cap DPR to 2 for performance on high-density displays
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

        <Environment preset="studio" />

        <Suspense fallback={<AgentSkeleton />}>
          {/* Example Placeholder: EMAR Agent */}
          {/* <AgentMesh agentId="emar" position={[0, 0, 0]} /> */}
        </Suspense>

        {/* OrbitControls generally disabled for production unless in debug/studio mode */}
        {/* <OrbitControls enableZoom={false} /> */}
      </Canvas>
    </div>
  );
};
