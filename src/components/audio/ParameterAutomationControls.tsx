// @ts-nocheck
/**
 * 3WM SONIK — Parameter Automation Controls
 * UI controls for recording and playing back DSP parameter automation
 */

import React, { useState, useEffect, useRef } from 'react';
import { parameterAutomation, AutomationClip, AutomationPoint } from '@/audio/parameterAutomation';
import { Play, Square, Trash2, Plus, Settings, Circle as RecordIcon } from 'lucide-react';

interface ParameterAutomationControlsProps {
  trackId: string;
  onParameterUpdate: (parameter: string, value: number) => void;
  parameters: Array<{ id: string; name: string; min: number; max: number; value: number }>;
}

export function ParameterAutomationControls({
  trackId,
  onParameterUpdate,
  parameters,
}: ParameterAutomationControlsProps) {
  const [activeClip, setActiveClip] = useState<AutomationClip | undefined>();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);
  const [automationPoints, setAutomationPoints] = useState<AutomationPoint[]>([]);

  const recordingIntervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Set up parameter update callback
    parameterAutomation.setParameterUpdateCallback(onParameterUpdate);

    // Create default clip if none exists
    const defaultClipId = `${trackId}-default`;
    let clip = parameterAutomation.getClip(defaultClipId);
    if (!clip) {
      clip = parameterAutomation.createClip(defaultClipId, 'Default Automation', 0, 30);
      parameterAutomation.setActiveClip(defaultClipId);
    }
    setActiveClip(clip);

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [trackId, onParameterUpdate]);

  useEffect(() => {
    // Update automation points when selected parameter changes
    if (selectedParameter && activeClip) {
      const points = parameterAutomation.getAutomationPoints(activeClip.id, selectedParameter);
      setAutomationPoints(points);
    }
  }, [selectedParameter, activeClip]);

  const handleToggleRecord = () => {
    if (isRecording) {
      parameterAutomation.stopRecording();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    } else {
      if (activeClip) {
        parameterAutomation.armClip(activeClip.id, true);
        parameterAutomation.startRecording();
        setIsRecording(true);

        // Start recording interval for selected parameter
        if (selectedParameter) {
          recordingIntervalRef.current = window.setInterval(() => {
            const param = parameters.find((p) => p.id === selectedParameter);
            if (param) {
              parameterAutomation.recordParameter(selectedParameter, param.value);
              const points = parameterAutomation.getAutomationPoints(
                activeClip.id,
                selectedParameter
              );
              setAutomationPoints(points);
            }
          }, 50); // Record every 50ms
        }
      }
    }
  };

  const handleTogglePlayback = () => {
    if (isPlaying) {
      parameterAutomation.stopPlayback();
      setIsPlaying(false);
    } else {
      parameterAutomation.startPlayback();
      setIsPlaying(true);
    }
  };

  const handleClearAutomation = () => {
    if (activeClip && selectedParameter) {
      parameterAutomation.clearParameterAutomation(activeClip.id, selectedParameter);
      setAutomationPoints([]);
    }
  };

  const handleCreateNewClip = () => {
    const newClipId = `${trackId}-${Date.now()}`;
    const newClip = parameterAutomation.createClip(newClipId, `Automation ${Date.now()}`, 0, 30);
    parameterAutomation.setActiveClip(newClipId);
    setActiveClip(newClip);
  };

  return (
    <div className="parameter-automation-controls bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Parameter Automation</h3>
        <div className="flex gap-2">
          <button
            onClick={handleToggleRecord}
            className={`p-2 rounded transition-colors ${
              isRecording
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            <RecordIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleTogglePlayback}
            className={`p-2 rounded transition-colors ${
              isPlaying
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
            title={isPlaying ? 'Stop Playback' : 'Start Playback'}
          >
            {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={handleCreateNewClip}
            className="p-2 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
            title="Create New Clip"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Parameter Selection */}
      <div className="mb-4">
        <label className="block text-xs text-zinc-500 mb-2">Select Parameter</label>
        <div className="grid grid-cols-2 gap-2">
          {parameters.map((param) => (
            <button
              key={param.id}
              onClick={() => setSelectedParameter(param.id)}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                selectedParameter === param.id
                  ? 'bg-zinc-700 text-white border border-zinc-600'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {param.name}
            </button>
          ))}
        </div>
      </div>

      {/* Automation Points Visualization */}
      {selectedParameter && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs text-zinc-500">Automation Points</label>
            <button
              onClick={handleClearAutomation}
              className="p-1 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
              title="Clear Automation"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded p-2 h-32 relative overflow-hidden">
            <svg width="100%" height="100%" className="w-full h-full">
              {/* Grid lines */}
              <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#27272a" strokeWidth="1" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#27272a" strokeWidth="1" />
              <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#27272a" strokeWidth="1" />

              {/* Automation curve */}
              {automationPoints.length > 0 && (
                <polyline
                  points={automationPoints
                    .map((p) => {
                      const x = (p.time / (activeClip?.duration || 30)) * 100;
                      const param = parameters.find((p) => p.id === selectedParameter);
                      const range = param ? param.max - param.min : 1;
                      const normalizedValue = param ? (p.value - param.min) / range : 0.5;
                      const y = 100 - normalizedValue * 100;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#F5A800"
                  strokeWidth="2"
                />
              )}

              {/* Points */}
              {automationPoints.map((point, index) => {
                const x = (point.time / (activeClip?.duration || 30)) * 100;
                const param = parameters.find((p) => p.id === selectedParameter);
                const range = param ? param.max - param.min : 1;
                const normalizedValue = param ? (point.value - param.min) / range : 0.5;
                const y = 100 - normalizedValue * 100;
                return (
                  <circle
                    key={index}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="#F5A800"
                    stroke="#0D0D0D"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-zinc-500 font-mono">
            <span>0s</span>
            <span>{activeClip?.duration || 30}s</span>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">Clip: {activeClip?.name || 'None'}</span>
        <span
          className={`font-mono ${isRecording ? 'text-red-400' : isPlaying ? 'text-amber-400' : 'text-zinc-500'}`}
        >
          {isRecording ? '● RECORDING' : isPlaying ? '▶ PLAYING' : 'IDLE'}
        </span>
      </div>
    </div>
  );
}
