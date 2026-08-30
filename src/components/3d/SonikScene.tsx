import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, OrbitControls, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { assetQualityManager, DeviceProfile } from '../../services/assetQualityManager';
import { visualCommandEngine, SceneGraphState } from '../../3d/visualCommandEngine';
import { dspVisualBridge } from '../../3d/dspVisualBridge';

interface SonikSceneProps {
  activeAgent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator' | null;
  onAgentClick?: (agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator') => void;
}

// 1. Emar Node — The Scientist (Mint #2AFFA3, Octahedral Lattice & Mathematical DSP Waves)
const EmarNode = ({ active, onClick }: { active: boolean; onClick: () => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const dsp = dspVisualBridge.getCurrentFrame();
    const time = state.clock.elapsedTime;

    if (meshRef.current) {
      meshRef.current.rotation.x = time * (active ? 1.5 : 0.4);
      meshRef.current.rotation.y = time * (active ? 1.8 : 0.6);

      const scaleBoost = active
        ? 1 + dsp.treble * 0.4 + Math.sin(time * 6) * 0.08
        : 1 + dsp.treble * 0.15;
      meshRef.current.scale.set(scaleBoost * 0.9, scaleBoost * 0.9, scaleBoost * 0.9);
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = -time * 1.2;
      ringRef.current.rotation.x = Math.PI / 3 + Math.sin(time) * 0.2;
    }
  });

  return (
    <Float
      speed={active ? 3.5 : 1.5}
      rotationIntensity={active ? 1.5 : 0.4}
      floatIntensity={active ? 2 : 0.6}
    >
      <group position={[-2.6, 0, 0]} onClick={onClick}>
        {/* Core Mathematical Octahedron */}
        <mesh ref={meshRef}>
          <octahedronGeometry args={[0.9, 0]} />
          <meshPhysicalMaterial
            color="#2AFFA3"
            emissive="#2AFFA3"
            emissiveIntensity={active ? 2.5 : 0.6}
            roughness={0.1}
            metalness={0.9}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            wireframe={false}
          />
        </mesh>

        {/* Outer Telemetry Wireframe Shell */}
        <mesh>
          <octahedronGeometry args={[1.2, 1]} />
          <meshStandardMaterial
            color="#2AFFA3"
            emissive="#2AFFA3"
            emissiveIntensity={active ? 1.2 : 0.3}
            wireframe
            transparent
            opacity={active ? 0.6 : 0.25}
          />
        </mesh>

        {/* Orbiting Frequency Calibration Ring */}
        <mesh ref={ringRef}>
          <torusGeometry args={[1.4, 0.015, 16, 64]} />
          <meshBasicMaterial color="#2AFFA3" transparent opacity={active ? 0.8 : 0.35} />
        </mesh>

        {active && <pointLight color="#2AFFA3" intensity={4} distance={8} />}
      </group>
    </Float>
  );
};

// 2. Ricky Node — The Sound God (Gold #F5A800, Liquid Gold & 808 Sub-bass Resonator)
const RickyNode = ({ active, onClick }: { active: boolean; onClick: () => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const dsp = dspVisualBridge.getCurrentFrame();
    const time = state.clock.elapsedTime;

    if (meshRef.current) {
      meshRef.current.rotation.y = time * (active ? 2.0 : 0.5);
      meshRef.current.rotation.z = Math.sin(time * 2) * 0.2;

      const scaleBoost = active ? 1.1 + dsp.bass * 0.6 + (dsp.beat ? 0.15 : 0) : 1 + dsp.bass * 0.2;
      meshRef.current.scale.set(scaleBoost, scaleBoost, scaleBoost);
    }

    if (ringRef.current) {
      ringRef.current.rotation.y = time * 0.8;
      ringRef.current.rotation.x = -Math.PI / 4 + Math.cos(time * 1.5) * 0.3;
    }
  });

  return (
    <Float
      speed={active ? 4.0 : 1.8}
      rotationIntensity={active ? 2.0 : 0.5}
      floatIntensity={active ? 2.5 : 0.8}
    >
      <group position={[0, 0.2, 0]} onClick={onClick}>
        {/* Core Liquid Gold Sphere with Dynamic Distortion */}
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[1.0, 3]} />
          <MeshDistortMaterial
            color="#F5A800"
            emissive="#7A4E00"
            emissiveIntensity={active ? 2.2 : 0.5}
            roughness={0.15}
            metalness={0.95}
            clearcoat={1.0}
            distort={active ? 0.45 : 0.2}
            speed={active ? 4.0 : 1.5}
          />
        </mesh>

        {/* Resonant 808 Outer Ring */}
        <mesh ref={ringRef}>
          <torusGeometry args={[1.6, 0.02, 16, 64]} />
          <meshStandardMaterial
            color="#F5A800"
            emissive="#F5A800"
            emissiveIntensity={active ? 1.5 : 0.4}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {active && <pointLight color="#F5A800" intensity={5} distance={10} />}
      </group>
    </Float>
  );
};

// 3. Kingpin Node — The Vocal Oracle (Fire #FF3C00, Volcanic Ember & Harmonic Voice Resonance)
const KingpinNode = ({ active, onClick }: { active: boolean; onClick: () => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const dsp = dspVisualBridge.getCurrentFrame();
    const time = state.clock.elapsedTime;

    if (meshRef.current) {
      meshRef.current.rotation.x = time * (active ? 1.8 : 0.4);
      meshRef.current.rotation.z = time * (active ? 1.4 : 0.5);

      const scaleBoost = active
        ? 1 + dsp.mid * 0.5 + Math.sin(time * 8) * 0.09
        : 1 + dsp.mid * 0.15;
      meshRef.current.scale.set(scaleBoost * 0.9, scaleBoost * 0.9, scaleBoost * 0.9);
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = time * 1.5;
      ringRef.current.rotation.y = Math.PI / 4 + Math.sin(time * 2) * 0.25;
    }
  });

  return (
    <Float
      speed={active ? 3.8 : 1.6}
      rotationIntensity={active ? 1.8 : 0.5}
      floatIntensity={active ? 2.2 : 0.7}
    >
      <group position={[2.6, 0, 0]} onClick={onClick}>
        {/* Core Volcanic Dodecahedron */}
        <mesh ref={meshRef}>
          <dodecahedronGeometry args={[0.9, 0]} />
          <meshPhysicalMaterial
            color="#FF3C00"
            emissive="#FF3C00"
            emissiveIntensity={active ? 2.8 : 0.7}
            roughness={0.2}
            metalness={0.85}
            clearcoat={1.0}
            clearcoatRoughness={0.15}
          />
        </mesh>

        {/* Vocal Formant Halo */}
        <mesh ref={ringRef}>
          <torusGeometry args={[1.45, 0.018, 16, 64]} />
          <meshBasicMaterial color="#FF3C00" transparent opacity={active ? 0.85 : 0.4} />
        </mesh>

        {/* Outer Harmonic Cage */}
        <mesh>
          <icosahedronGeometry args={[1.25, 1]} />
          <meshStandardMaterial
            color="#FF3C00"
            emissive="#FF3C00"
            emissiveIntensity={active ? 1.0 : 0.25}
            wireframe
            transparent
            opacity={active ? 0.5 : 0.2}
          />
        </mesh>

        {active && <pointLight color="#FF3C00" intensity={4.5} distance={9} />}
      </group>
    </Float>
  );
};

// 4. Orchestrator Node — Sacred Council Lattice (Translucent Amber Sacred Geometry)
const OrchestratorLattice = ({ active }: { active: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const dsp = dspVisualBridge.getCurrentFrame();
    const time = state.clock.elapsedTime;

    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.15;
      meshRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
      const s = 1.6 + dsp.energy * 0.3;
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -1.5]}>
      <icosahedronGeometry args={[2.2, 2]} />
      <meshStandardMaterial
        color="#F5A800"
        emissive="#1A1208"
        wireframe
        transparent
        opacity={active ? 0.35 : 0.12}
        roughness={0.4}
        metalness={0.8}
      />
    </mesh>
  );
};

// 5. Audio-Reactive Particle Galaxy
const ParticleGalaxy = ({
  activeAgent,
  particleLimit,
}: {
  activeAgent: string | null;
  particleLimit: number;
}) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < particleLimit; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 2.5 + Math.random() * 4.5;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const speed = 0.005 + Math.random() * 0.015;
      temp.push({
        x,
        y,
        z,
        originalX: x,
        originalY: y,
        originalZ: z,
        speed,
        phase: Math.random() * Math.PI,
      });
    }
    return temp;
  }, [particleLimit]);

  useFrame((state) => {
    const dsp = dspVisualBridge.sampleFrame();
    const time = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      let x = p.originalX;
      let y = p.originalY;
      let z = p.originalZ;

      // Reactivity per agent
      if (activeAgent === 'emar') {
        // Grid quantification
        x += Math.sin(time * 3 + p.phase) * (0.2 + dsp.treble * 0.5);
        y = Math.round(y * 2) / 2;
      } else if (activeAgent === 'ricky') {
        // Bass shockwave pulse
        const pulse = 1 + dsp.bass * 0.8 + (dsp.beat ? 0.3 : 0);
        x *= pulse;
        y *= pulse;
        z *= pulse;
      } else if (activeAgent === 'kingpin') {
        // Vocal harmonic wave ripple
        const dist = Math.sqrt(x * x + z * z);
        y += Math.sin(dist * 2 - time * 4) * (0.3 + dsp.mid * 0.6);
      } else {
        // Ambient orbit
        const angle = time * p.speed;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const newX = x * cosA - z * sinA;
        const newZ = x * sinA + z * cosA;
        x = newX;
        z = newZ;
      }

      dummy.position.set(x, y, z);
      const scale = (0.03 + dsp.energy * 0.04) * (activeAgent ? 1.3 : 1.0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      if (mesh.current) {
        mesh.current.setMatrixAt(i, dummy.matrix);
      }
    });

    if (mesh.current) {
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, particleLimit]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        color={
          activeAgent === 'emar'
            ? '#2AFFA3'
            : activeAgent === 'ricky'
              ? '#F5A800'
              : activeAgent === 'kingpin'
                ? '#FF3C00'
                : '#E2A336'
        }
        transparent
        opacity={0.65}
      />
    </instancedMesh>
  );
};

// 6. Camera Controller & Focus Smooth Lerp
const CameraRig = ({ focusAgent }: { focusAgent: string | null }) => {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 5.5));
  const lookAtPos = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    if (focusAgent === 'emar') {
      targetPos.current.set(-2.2, 0.2, 3.8);
      lookAtPos.current.set(-2.6, 0, 0);
    } else if (focusAgent === 'ricky') {
      targetPos.current.set(0, 0.3, 3.6);
      lookAtPos.current.set(0, 0.2, 0);
    } else if (focusAgent === 'kingpin') {
      targetPos.current.set(2.2, 0.2, 3.8);
      lookAtPos.current.set(2.6, 0, 0);
    } else {
      targetPos.current.set(0, 0, 5.5);
      lookAtPos.current.set(0, 0, 0);
    }

    camera.position.lerp(targetPos.current, 0.05);
    camera.lookAt(lookAtPos.current);
  });

  return null;
};

export const SonikScene: React.FC<SonikSceneProps> = ({ activeAgent, onAgentClick }) => {
  const [profile, setProfile] = useState<DeviceProfile>(() => assetQualityManager.getProfile());
  const [sceneState, setSceneState] = useState<SceneGraphState>(() =>
    visualCommandEngine.getState()
  );

  useEffect(() => {
    const unsubProfile = assetQualityManager.subscribe((p) => setProfile(p));
    const unsubScene = visualCommandEngine.subscribe((s) => setSceneState(s));
    return () => {
      unsubProfile();
      unsubScene();
    };
  }, []);

  const handleSelect = (agent: 'emar' | 'ricky' | 'kingpin' | 'orchestrator') => {
    visualCommandEngine.focusAgent(agent);
    if (onAgentClick) onAgentClick(agent);
  };

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        dpr={profile.pixelRatio}
        gl={{
          antialias: profile.antialias,
          powerPreference: 'high-performance',
          alpha: true,
        }}
      >
        {/* Dynamic Studio Lighting Rig */}
        <ambientLight intensity={sceneState.lighting.ambientIntensity} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} color="#FFFFFF" />
        <pointLight position={[-10, -10, -5]} intensity={0.6} color="#F5A800" />
        <spotLight
          position={[0, 8, 4]}
          intensity={sceneState.lighting.spotlightIntensity}
          angle={0.6}
          penumbra={0.8}
          color="#FFF8E7"
        />

        {/* 3WM Entities */}
        <EmarNode active={activeAgent === 'emar'} onClick={() => handleSelect('emar')} />
        <RickyNode active={activeAgent === 'ricky'} onClick={() => handleSelect('ricky')} />
        <KingpinNode active={activeAgent === 'kingpin'} onClick={() => handleSelect('kingpin')} />
        <OrchestratorLattice active={activeAgent === 'orchestrator'} />

        {/* Particle Galaxy */}
        <ParticleGalaxy activeAgent={activeAgent} particleLimit={profile.particleLimit} />

        {/* Camera Smoothing & Orbit */}
        <CameraRig focusAgent={activeAgent} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 2.5}
          rotateSpeed={0.6}
        />
      </Canvas>
    </div>
  );
};
