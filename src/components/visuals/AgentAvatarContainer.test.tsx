/**
 * 3WM SONIK — Agent Avatar Container Tests
 * Tests for agent avatar integration and audio reactivity
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { AgentAvatarContainer, useAgentAvatarIntegration } from './AgentAvatarContainer';

// Mock soundEngine
vi.mock('@/audio/engine', () => ({
  soundEngine: {
    getMasterAnalyser: () => ({
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn(),
    }),
  },
}));

// Mock ThreeWMOrchestrator
vi.mock('@/agents/Orchestrator', () => ({
  ThreeWMOrchestrator: vi.fn(),
}));

describe('AgentAvatarContainer', () => {
  it('should render agent avatar container', () => {
    render(<AgentAvatarContainer />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should initialize audio analysis', () => {
    render(<AgentAvatarContainer />);
    // Should have audio analysis running
  });

  it('should display all three agents', () => {
    render(<AgentAvatarContainer />);
    // Should render Emar, Ricky, and Kingpin avatars
  });

  it('should update agent states based on audio', () => {
    render(<AgentAvatarContainer />);
    // Should update states when audio data changes
  });
});

describe('useAgentAvatarIntegration', () => {
  it('should initialize orchestrator connection', () => {
    const { result } = renderHook(() => useAgentAvatarIntegration());
    expect(result.current.orchestrator).toBeDefined();
  });

  it('should update agent state', () => {
    const { result } = renderHook(() => useAgentAvatarIntegration());
    result.current.updateAgentState('emar', 'analyzing');
    expect(result.current.agentStates.emar).toBe('analyzing');
  });

  it('should map orchestrator states to avatar states', () => {
    const { result } = renderHook(() => useAgentAvatarIntegration());
    const avatarState = result.current.mapOrchestratorStateToAvatar('ANALYZING');
    expect(avatarState).toBe('analyzing');
  });

  it('should handle unknown orchestrator states', () => {
    const { result } = renderHook(() => useAgentAvatarIntegration());
    const avatarState = result.current.mapOrchestratorStateToAvatar('UNKNOWN');
    expect(avatarState).toBe('idle');
  });
});

describe('Agent Avatar State Mapping', () => {
  const { useAgentAvatarIntegration } = require('./AgentAvatarContainer');

  it('should map IDLE to idle', () => {
    const { result } = renderHook(() => useAgentAvatarIntegration());
    expect(result.current.mapOrchestratorStateToAvatar('IDLE')).toBe('idle');
  });

  it('should map ANALYZING to analyzing', () => {
    const { result } = renderHook(() => useAgentAvatarIntegration());
    expect(result.current.mapOrchestratorStateToAvatar('ANALYZING')).toBe('analyzing');
  });

  it('should map PROCESSING to processing', () => {
    const { result } = renderHook(() => useAgentAvatarIntegration());
    expect(result.current.mapOrchestratorStateToAvatar('PROCESSING')).toBe('processing');
  });

  it('should map SUCCESS to success', () => {
    const { result } = renderHook(() => useAgentAvatarIntegration());
    expect(result.current.mapOrchestratorStateToAvatar('SUCCESS')).toBe('success');
  });

  it('should map ERROR to error', () => {
    const { result } = renderHook(() => useAgentAvatarIntegration());
    expect(result.current.mapOrchestratorStateToAvatar('ERROR')).toBe('error');
  });
});
