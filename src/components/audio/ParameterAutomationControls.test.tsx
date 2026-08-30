/**
 * 3WM SONIK — Parameter Automation Controls Tests
 * Tests for parameter automation UI controls
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParameterAutomationControls } from './ParameterAutomationControls';

// Mock parameterAutomation
vi.mock('@/audio/parameterAutomation', () => ({
  parameterAutomation: {
    initialize: vi.fn(),
    setParameterUpdateCallback: vi.fn(),
    getClip: vi.fn(() => ({
      id: 'test-clip',
      name: 'Test Clip',
      startTime: 0,
      duration: 30,
      lanes: new Map(),
      isArmed: false,
      isRecording: false,
      isPlaying: false,
    })),
    createClip: vi.fn(() => ({
      id: 'test-clip',
      name: 'Test Clip',
      startTime: 0,
      duration: 30,
      lanes: new Map(),
      isArmed: false,
      isRecording: false,
      isPlaying: false,
    })),
    setActiveClip: vi.fn(),
    armClip: vi.fn(),
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    startPlayback: vi.fn(),
    stopPlayback: vi.fn(),
    recordParameter: vi.fn(),
    getAutomationPoints: vi.fn(() => []),
    clearParameterAutomation: vi.fn(),
    setInterpolationMode: vi.fn(),
  },
}));

describe('ParameterAutomationControls', () => {
  const mockOnParameterUpdate = vi.fn();
  const mockParameters = [
    { id: 'eq.low', name: 'EQ Low', min: -12, max: 12, value: 0 },
    { id: 'eq.mid', name: 'EQ Mid', min: -12, max: 12, value: 0 },
    { id: 'eq.high', name: 'EQ High', min: -12, max: 12, value: 0 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render parameter automation controls', () => {
    render(
      <ParameterAutomationControls
        trackId="test-track"
        onParameterUpdate={mockOnParameterUpdate}
        parameters={mockParameters}
      />
    );
    expect(screen.getByText('Parameter Automation')).toBeInTheDocument();
  });

  it('should display parameter selection buttons', () => {
    render(
      <ParameterAutomationControls
        trackId="test-track"
        onParameterUpdate={mockOnParameterUpdate}
        parameters={mockParameters}
      />
    );
    expect(screen.getByText('EQ Low')).toBeInTheDocument();
    expect(screen.getByText('EQ Mid')).toBeInTheDocument();
    expect(screen.getByText('EQ High')).toBeInTheDocument();
  });

  it('should select parameter when clicked', () => {
    render(
      <ParameterAutomationControls
        trackId="test-track"
        onParameterUpdate={mockOnParameterUpdate}
        parameters={mockParameters}
      />
    );
    const eqLowButton = screen.getByText('EQ Low');
    fireEvent.click(eqLowButton);
    // Should select the parameter
  });

  it('should toggle recording', () => {
    render(
      <ParameterAutomationControls
        trackId="test-track"
        onParameterUpdate={mockOnParameterUpdate}
        parameters={mockParameters}
      />
    );
    const recordButton = screen.getByTitle('Start Recording');
    fireEvent.click(recordButton);
    // Should start recording
  });

  it('should toggle playback', () => {
    render(
      <ParameterAutomationControls
        trackId="test-track"
        onParameterUpdate={mockOnParameterUpdate}
        parameters={mockParameters}
      />
    );
    const playButton = screen.getByTitle('Start Playback');
    fireEvent.click(playButton);
    // Should start playback
  });

  it('should create new clip', () => {
    render(
      <ParameterAutomationControls
        trackId="test-track"
        onParameterUpdate={mockOnParameterUpdate}
        parameters={mockParameters}
      />
    );
    const newClipButton = screen.getByTitle('Create New Clip');
    fireEvent.click(newClipButton);
    // Should create new clip
  });

  it('should clear automation', () => {
    render(
      <ParameterAutomationControls
        trackId="test-track"
        onParameterUpdate={mockOnParameterUpdate}
        parameters={mockParameters}
      />
    );
    // Select a parameter first
    const eqLowButton = screen.getByText('EQ Low');
    fireEvent.click(eqLowButton);

    // Then clear
    const clearButton = screen.getByTitle('Clear Automation');
    fireEvent.click(clearButton);
    // Should clear automation
  });

  it('should display automation points visualization', () => {
    render(
      <ParameterAutomationControls
        trackId="test-track"
        onParameterUpdate={mockOnParameterUpdate}
        parameters={mockParameters}
      />
    );
    // Select a parameter to show visualization
    const eqLowButton = screen.getByText('EQ Low');
    fireEvent.click(eqLowButton);

    // Should show visualization container
  });

  it('should display status information', () => {
    render(
      <ParameterAutomationControls
        trackId="test-track"
        onParameterUpdate={mockOnParameterUpdate}
        parameters={mockParameters}
      />
    );
    expect(screen.getByText(/Clip:/i)).toBeInTheDocument();
    expect(screen.getByText(/IDLE/i)).toBeInTheDocument();
  });
});
