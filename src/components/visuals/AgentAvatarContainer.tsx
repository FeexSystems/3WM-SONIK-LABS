// @ts-nocheck
/**
 * 3WM SONIK — Agent Avatar Container
 * Integrates 3D agent avatars with audio reactivity
 */

import { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AgentAvatar, AgentType, AgentState } from '@/three/avatars/AgentAvatar';
import { createAgentMaterial, AudioReactiveMaterial } from '@/three/shaders/audioReactiveShader';
import * as THREE from 'three';
import { soundEngine } from '@/audio/engine';
import { ThreeWMOrchestrator } from '@/agents/Orchestrator';

interface AgentAvatarData {
  type: AgentType;
  state: AgentState;
  position: [number, number, number];
}

export function AgentAvatarContainer() {
  const [agentStates, setAgentStates] = useState<Record<AgentType, AgentState>>({
    emar: 'idle',
    ricky: 'idle',
    kingpin: 'idle',
  });

  const [audioData, setAudioData] = useState({
    bassEnergy: 0,
    trebleFlux: 0,
    bpmPhase: 0,
  });

  const animationFrameRef = useRef<number>();

  // Audio analysis loop using soundEngine's master analyser
  useEffect(() => {
    const analyser = soundEngine.getMasterAnalyser();
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const analyzeAudio = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate bass energy (low frequencies)
      const bassRange = dataArray.slice(0, 10);
      const bassEnergy = bassRange.reduce((a, b) => a + b, 0) / bassRange.length / 255;

      // Calculate treble flux (high frequencies)
      const trebleRange = dataArray.slice(50, 128);
      const trebleFlux = trebleRange.reduce((a, b) => a + b, 0) / trebleRange.length / 255;

      // Calculate BPM phase (simplified - would use actual BPM from audio engine)
      const time = Date.now() / 1000;
      const bpmPhase = (time * 2) % 1; // Assuming ~120 BPM

      setAudioData({ bassEnergy, trebleFlux, bpmPhase });

      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    };

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Listen to agent state changes from Orchestrator
  useEffect(() => {
    const orchestrator = new ThreeWMOrchestrator();

    // Subscribe to agent state changes
    // This would connect to the actual state change events from the orchestrator
    // For now, we'll simulate state changes based on audio and agent activity

    const interval = setInterval(() => {
      const { bassEnergy } = audioData;

      // Map agent states based on audio and simulated agent activity
      // In production, this would come from the orchestrator's state management
      setAgentStates((prev) => ({
        emar: bassEnergy > 0.5 ? 'analyzing' : 'idle',
        ricky: bassEnergy > 0.7 ? 'processing' : 'idle',
        kingpin: bassEnergy > 0.6 ? 'success' : 'idle',
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [audioData]);

  const agents: AgentAvatarData[] = [
    { type: 'emar', state: agentStates.emar, position: [-2, 0, 0] },
    { type: 'ricky', state: agentStates.ricky, position: [0, 0, 0] },
    { type: 'kingpin', state: agentStates.kingpin, position: [2, 0, 0] },
  ];

  return (
    <div className="agent-avatar-container">
      <Canvas camera={{ position: [0, 1, 5], fov: 50 }} style={{ width: '100%', height: '100%' }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#F5A800" />

        {agents.map((agent) => (
          <AgentAvatar
            key={agent.type}
            agent={agent.type}
            state={agent.state}
            bassEnergy={audioData.bassEnergy}
            trebleFlux={audioData.trebleFlux}
            bpmPhase={audioData.bpmPhase}
            position={agent.position}
            scale={1}
            onLoad={() => console.log(`${agent.type} avatar loaded`)}
          />
        ))}

        {/* Audio-reactive floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial
            color="#0D0D0D"
            emissive="#181410"
            emissiveIntensity={audioData.bassEnergy * 0.5}
          />
        </mesh>
      </Canvas>

      {/* Agent status indicators */}
      <div className="agent-status-overlay">
        {agents.map((agent) => (
          <div key={agent.type} className={`agent-status ${agent.type} ${agent.state}`}>
            <span className="agent-name">{agent.type.toUpperCase()}</span>
            <span className="agent-state">{agent.state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook to connect agent avatars to the Orchestrator
 */
export function useAgentAvatarIntegration() {
  const [agentStates, setAgentStates] = useState<Record<AgentType, AgentState>>({
    emar: 'idle',
    ricky: 'idle',
    kingpin: 'idle',
  });

  const orchestratorRef = useRef<ThreeWMOrchestrator | null>(null);

  useEffect(() => {
    // Initialize orchestrator connection
    orchestratorRef.current = new ThreeWMOrchestrator();

    // Subscribe to agent state changes from the orchestrator
    // This would connect to the orchestrator's state management system
    // For now, we'll set up the structure for the integration

    return () => {
      orchestratorRef.current = null;
    };
  }, []);

  const updateAgentState = (agent: AgentType, state: AgentState) => {
    setAgentStates((prev) => ({ ...prev, [agent]: state }));

    // Notify orchestrator of state change
    if (orchestratorRef.current) {
      // This would call orchestrator methods to sync state
      console.log(`Agent ${agent} state updated to ${state}`);
    }
  };

  // Map orchestrator agent states to avatar states
  const mapOrchestratorStateToAvatar = (orchestratorState: string): AgentState => {
    const stateMap: Record<string, AgentState> = {
      IDLE: 'idle',
      ANALYZING: 'analyzing',
      PROCESSING: 'processing',
      SUCCESS: 'success',
      ERROR: 'error',
      THINKING: 'analyzing',
    };
    return stateMap[orchestratorState] || 'idle';
  };

  return {
    agentStates,
    updateAgentState,
    mapOrchestratorStateToAvatar,
    orchestrator: orchestratorRef.current,
  };
}
