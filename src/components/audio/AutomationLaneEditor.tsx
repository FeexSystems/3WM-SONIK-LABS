import React, { useState, useRef, useEffect, useCallback } from 'react';
import { soundEngine } from '../../audio/engine';
import { transportBridge } from '../../audio/transportBridge';
import {
  TrendingUp,
  RotateCcw,
  Sparkles,
  Sliders,
  Play,
  Pause,
  Plus,
  Trash2,
  Layers,
  Activity,
  Zap,
} from 'lucide-react';

export interface AutomationPoint {
  id: string;
  timeNormalized: number; // 0.0 to 1.0 (over 16 or 32 bars)
  value: number; // in target parameter units
}

export interface AutomationLane {
  target:
    | 'volume'
    | 'eq_low'
    | 'eq_mid'
    | 'eq_high'
    | 'filter_cutoff'
    | 'saturation'
    | 'eight_oh_eight_drive'
    | 'reverb';
  name: string;
  min: number;
  max: number;
  unit: string;
  color: string;
  points: AutomationPoint[];
  curveType: 'linear' | 'smooth' | 'stepped';
}

interface AutomationLaneEditorProps {
  isPlaying: boolean;
  bpm: number;
  onApplyParam?: (param: string, value: number) => void;
}

export const AutomationLaneEditor: React.FC<AutomationLaneEditorProps> = ({
  isPlaying,
  bpm,
  onApplyParam,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<AutomationLane['target']>('filter_cutoff');
  const [totalBars, setTotalBars] = useState<16 | 32>(16);
  const [playheadPos, setPlayheadPos] = useState<number>(0); // 0.0 to 1.0
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Automation Lanes State
  const [lanes, setLanes] = useState<Record<AutomationLane['target'], AutomationLane>>({
    filter_cutoff: {
      target: 'filter_cutoff',
      name: 'Analog Lowpass Filter Cutoff',
      min: 200,
      max: 18000,
      unit: ' Hz',
      color: '#06b6d4',
      curveType: 'smooth',
      points: [
        { id: 'p1', timeNormalized: 0.0, value: 1200 },
        { id: 'p2', timeNormalized: 0.25, value: 4500 },
        { id: 'p3', timeNormalized: 0.5, value: 16000 },
        { id: 'p4', timeNormalized: 0.75, value: 3200 },
        { id: 'p5', timeNormalized: 1.0, value: 18000 },
      ],
    },
    volume: {
      target: 'volume',
      name: 'Master Output Volume',
      min: 0,
      max: 1,
      unit: '',
      color: '#f59e0b',
      curveType: 'linear',
      points: [
        { id: 'pv1', timeNormalized: 0.0, value: 0.2 },
        { id: 'pv2', timeNormalized: 0.125, value: 0.85 },
        { id: 'pv3', timeNormalized: 0.875, value: 0.95 },
        { id: 'pv4', timeNormalized: 1.0, value: 0.0 },
      ],
    },
    eq_low: {
      target: 'eq_low',
      name: '808 Log Drum Bass Boost',
      min: -12,
      max: 12,
      unit: ' dB',
      color: '#ec4899',
      curveType: 'smooth',
      points: [
        { id: 'pe1', timeNormalized: 0.0, value: 0 },
        { id: 'pe2', timeNormalized: 0.25, value: 3.5 },
        { id: 'pe3', timeNormalized: 0.5, value: 5.2 },
        { id: 'pe4', timeNormalized: 0.75, value: 1.0 },
        { id: 'pe5', timeNormalized: 1.0, value: 4.0 },
      ],
    },
    eq_mid: {
      target: 'eq_mid',
      name: 'Vocal Presence EQ',
      min: -12,
      max: 12,
      unit: ' dB',
      color: '#10b981',
      curveType: 'linear',
      points: [
        { id: 'pm1', timeNormalized: 0.0, value: 0 },
        { id: 'pm2', timeNormalized: 0.5, value: 2.0 },
        { id: 'pm3', timeNormalized: 1.0, value: 0 },
      ],
    },
    eq_high: {
      target: 'eq_high',
      name: 'Shekere Shaker Highs',
      min: -12,
      max: 12,
      unit: ' dB',
      color: '#8b5cf6',
      curveType: 'linear',
      points: [
        { id: 'ph1', timeNormalized: 0.0, value: 1.5 },
        { id: 'ph2', timeNormalized: 0.5, value: 3.0 },
        { id: 'ph3', timeNormalized: 1.0, value: 1.5 },
      ],
    },
    saturation: {
      target: 'saturation',
      name: 'Warm Tube Saturation Drive',
      min: 0,
      max: 100,
      unit: '%',
      color: '#ef4444',
      curveType: 'smooth',
      points: [
        { id: 'ps1', timeNormalized: 0.0, value: 15 },
        { id: 'ps2', timeNormalized: 0.5, value: 65 },
        { id: 'ps3', timeNormalized: 1.0, value: 30 },
      ],
    },
    eight_oh_eight_drive: {
      target: 'eight_oh_eight_drive',
      name: '808 Sub Saturation',
      min: 0,
      max: 100,
      unit: '%',
      color: '#3b82f6',
      curveType: 'smooth',
      points: [
        { id: 'pd1', timeNormalized: 0.0, value: 20 },
        { id: 'pd2', timeNormalized: 0.5, value: 75 },
        { id: 'pd3', timeNormalized: 1.0, value: 40 },
      ],
    },
    reverb: {
      target: 'reverb',
      name: 'Kalakuta Reverb Send',
      min: 0,
      max: 100,
      unit: '%',
      color: '#a855f7',
      curveType: 'smooth',
      points: [
        { id: 'pr1', timeNormalized: 0.0, value: 25 },
        { id: 'pr2', timeNormalized: 0.5, value: 55 },
        { id: 'pr3', timeNormalized: 1.0, value: 35 },
      ],
    },
  });

  const activeLane = lanes[selectedTarget];

  // Helper to interpolate parameter value at any given normalized time (0.0 to 1.0)
  const getInterpolatedValueAt = useCallback((t: number, lane: AutomationLane): number => {
    const sorted = [...lane.points].sort((a, b) => a.timeNormalized - b.timeNormalized);
    if (sorted.length === 0) return (lane.min + lane.max) / 2;
    if (t <= sorted[0].timeNormalized) return sorted[0].value;
    if (t >= sorted[sorted.length - 1].timeNormalized) return sorted[sorted.length - 1].value;

    let p0 = sorted[0];
    let p1 = sorted[1];
    for (let i = 0; i < sorted.length - 1; i++) {
      if (t >= sorted[i].timeNormalized && t <= sorted[i + 1].timeNormalized) {
        p0 = sorted[i];
        p1 = sorted[i + 1];
        break;
      }
    }

    const duration = p1.timeNormalized - p0.timeNormalized;
    if (duration === 0) return p0.value;
    const progress = (t - p0.timeNormalized) / duration;

    if (lane.curveType === 'stepped') {
      return p0.value;
    }

    if (lane.curveType === 'smooth') {
      // S-curve cosine smoothing
      const smoothT = (1 - Math.cos(progress * Math.PI)) / 2;
      return p0.value + (p1.value - p0.value) * smoothT;
    }

    // Linear
    return p0.value + (p1.value - p0.value) * progress;
  }, []);

  // Sync playhead animation with playback transport
  useEffect(() => {
    let animId: number;
    let startTime = Date.now();
    const barDurationSec = (60 / (bpm || 112)) * 4;
    const totalLoopSec = barDurationSec * totalBars;

    const tick = () => {
      if (isPlaying) {
        const elapsed = (Date.now() - startTime) / 1000;
        const normalizedTime = (elapsed % totalLoopSec) / totalLoopSec;
        setPlayheadPos(normalizedTime);

        // Apply automation in real time to the audio engine!
        Object.values(lanes).forEach((lane) => {
          const val = getInterpolatedValueAt(normalizedTime, lane);
          soundEngine.applyAutomation(lane.target, val);
          if (onApplyParam && lane.target === selectedTarget) {
            onApplyParam(lane.target, val);
          }
        });
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, bpm, totalBars, lanes, selectedTarget, getInterpolatedValueAt, onApplyParam]);

  // Curve SVG Path Generator
  const generatePathD = (lane: AutomationLane, width: number, height: number): string => {
    const sorted = [...lane.points].sort((a, b) => a.timeNormalized - b.timeNormalized);
    if (sorted.length === 0) return '';

    const toSvgCoords = (p: AutomationPoint) => {
      const x = p.timeNormalized * width;
      const normalizedY = 1 - (p.value - lane.min) / (lane.max - lane.min);
      const y = Math.max(10, Math.min(height - 10, normalizedY * (height - 20) + 10));
      return { x, y };
    };

    const first = toSvgCoords(sorted[0]);
    let path = `M 0 ${first.y} L ${first.x} ${first.y}`;

    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = toSvgCoords(sorted[i]);
      const next = toSvgCoords(sorted[i + 1]);

      if (lane.curveType === 'stepped') {
        path += ` L ${next.x} ${curr.y} L ${next.x} ${next.y}`;
      } else if (lane.curveType === 'smooth') {
        const cx1 = curr.x + (next.x - curr.x) / 2;
        const cy1 = curr.y;
        const cx2 = curr.x + (next.x - curr.x) / 2;
        const cy2 = next.y;
        path += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${next.x} ${next.y}`;
      } else {
        path += ` L ${next.x} ${next.y}`;
      }
    }

    const last = toSvgCoords(sorted[sorted.length - 1]);
    path += ` L ${width} ${last.y}`;
    return path;
  };

  // Canvas Click to Add Node
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || isDragging) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const timeNormalized = Math.max(0, Math.min(1, x / rect.width));
    const normalizedY = 1 - (y - 10) / (rect.height - 20);
    const value =
      activeLane.min + Math.max(0, Math.min(1, normalizedY)) * (activeLane.max - activeLane.min);

    const newPoint: AutomationPoint = {
      id: `node-${Date.now()}`,
      timeNormalized,
      value: parseFloat(value.toFixed(1)),
    };

    setLanes((prev) => ({
      ...prev,
      [selectedTarget]: {
        ...prev[selectedTarget],
        points: [...prev[selectedTarget].points, newPoint],
      },
    }));
    setSelectedPointId(newPoint.id);
  };

  // Preset Curve Generators
  const applyPresetCurve = (
    preset: 'sweep_up' | 'lfo_pump' | 'fade_in' | 'breakdown_drop' | 'reset'
  ) => {
    let newPoints: AutomationPoint[] = [];

    switch (preset) {
      case 'sweep_up':
        newPoints = [
          { id: 'p1', timeNormalized: 0.0, value: activeLane.min },
          {
            id: 'p2',
            timeNormalized: 0.75,
            value: activeLane.min + (activeLane.max - activeLane.min) * 0.4,
          },
          { id: 'p3', timeNormalized: 1.0, value: activeLane.max },
        ];
        break;
      case 'lfo_pump':
        newPoints = [];
        for (let b = 0; b < 8; b++) {
          const t0 = b / 8;
          const t1 = (b + 0.5) / 8;
          newPoints.push({
            id: `p-${b}-0`,
            timeNormalized: t0,
            value: activeLane.min + (activeLane.max - activeLane.min) * 0.15,
          });
          newPoints.push({ id: `p-${b}-1`, timeNormalized: t1, value: activeLane.max * 0.9 });
        }
        break;
      case 'fade_in':
        newPoints = [
          { id: 'p1', timeNormalized: 0.0, value: activeLane.min },
          { id: 'p2', timeNormalized: 0.5, value: (activeLane.min + activeLane.max) * 0.5 },
          { id: 'p3', timeNormalized: 1.0, value: activeLane.max },
        ];
        break;
      case 'breakdown_drop':
        newPoints = [
          { id: 'p1', timeNormalized: 0.0, value: activeLane.max },
          { id: 'p2', timeNormalized: 0.48, value: activeLane.max * 0.8 },
          { id: 'p3', timeNormalized: 0.5, value: activeLane.min },
          { id: 'p4', timeNormalized: 0.65, value: activeLane.min },
          { id: 'p5', timeNormalized: 0.66, value: activeLane.max },
          { id: 'p6', timeNormalized: 1.0, value: activeLane.max },
        ];
        break;
      case 'reset':
        newPoints = [
          { id: 'p1', timeNormalized: 0.0, value: (activeLane.min + activeLane.max) / 2 },
          { id: 'p2', timeNormalized: 1.0, value: (activeLane.min + activeLane.max) / 2 },
        ];
        break;
    }

    setLanes((prev) => ({
      ...prev,
      [selectedTarget]: {
        ...prev[selectedTarget],
        points: newPoints,
      },
    }));
  };

  const currentVal = getInterpolatedValueAt(playheadPos, activeLane);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Automation Lane Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Timeline Automation Curve Editor</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                DSP LIVE
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Draw and sculpt continuous parameter curves over 16-bar and 32-bar arrangements
            </p>
          </div>
        </div>

        {/* Current Automated Value Display */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono flex items-center gap-2">
            <span className="text-neutral-500">VAL @ PLAYHEAD:</span>
            <span className="font-bold text-cyan-400">
              {currentVal.toFixed(1)}
              {activeLane.unit}
            </span>
          </div>

          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setTotalBars(16)}
              className={`px-2.5 py-1 rounded-lg transition ${
                totalBars === 16
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              16 Bars
            </button>
            <button
              type="button"
              onClick={() => setTotalBars(32)}
              className={`px-2.5 py-1 rounded-lg transition ${
                totalBars === 32
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              32 Bars
            </button>
          </div>
        </div>
      </div>

      {/* Target Parameter Switcher Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {Object.values(lanes).map((lane) => (
          <button
            key={lane.target}
            type="button"
            onClick={() => setSelectedTarget(lane.target)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              selectedTarget === lane.target
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/30'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {lane.name}
          </button>
        ))}
      </div>

      {/* Interactive SVG Automation Timeline Editor */}
      <div className="relative bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden shadow-inner p-2 select-none">
        {/* Measure Bar Subdivisions Ticks */}
        <div className="absolute top-0 inset-x-0 h-6 border-b border-neutral-850 flex items-center text-[10px] font-mono text-neutral-500 px-2 pointer-events-none">
          {Array.from({ length: totalBars }).map((_, barIdx) => (
            <div key={barIdx} className="flex-1 border-l border-neutral-850/60 pl-1">
              Bar {barIdx + 1}
            </div>
          ))}
        </div>

        {/* SVG Drawing Canvas */}
        <svg
          ref={svgRef}
          onClick={handleSvgClick}
          className="w-full h-56 cursor-crosshair mt-6"
          preserveAspectRatio="none"
          viewBox="0 0 800 200"
        >
          {/* Background Grid Horizontal Lines */}
          <line x1="0" y1="20" x2="800" y2="20" stroke="#262626" strokeDasharray="3 3" />
          <line x1="0" y1="60" x2="800" y2="60" stroke="#262626" strokeDasharray="3 3" />
          <line x1="0" y1="100" x2="800" y2="100" stroke="#262626" strokeDasharray="3 3" />
          <line x1="0" y1="140" x2="800" y2="140" stroke="#262626" strokeDasharray="3 3" />
          <line x1="0" y1="180" x2="800" y2="180" stroke="#262626" strokeDasharray="3 3" />

          {/* Curve Area Fill Gradient */}
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={activeLane.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={activeLane.color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Render Curve Area Fill */}
          <path
            d={`${generatePathD(activeLane, 800, 200)} L 800 200 L 0 200 Z`}
            fill="url(#curveGradient)"
          />

          {/* Render Main Interpolated Curve Path */}
          <path
            d={generatePathD(activeLane, 800, 200)}
            fill="none"
            stroke={activeLane.color}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Interactive Automation Nodes */}
          {activeLane.points.map((p) => {
            const x = p.timeNormalized * 800;
            const normalizedY = 1 - (p.value - activeLane.min) / (activeLane.max - activeLane.min);
            const y = Math.max(10, Math.min(190, normalizedY * 180 + 10));
            const isSelected = selectedPointId === p.id;

            return (
              <g key={p.id} className="cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 7 : 5}
                  fill={isSelected ? '#ffffff' : activeLane.color}
                  stroke="#000000"
                  strokeWidth="2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPointId(p.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    // Delete point
                    setLanes((prev) => ({
                      ...prev,
                      [selectedTarget]: {
                        ...prev[selectedTarget],
                        points: prev[selectedTarget].points.filter((pt) => pt.id !== p.id),
                      },
                    }));
                  }}
                />
              </g>
            );
          })}

          {/* Live Animated Playhead Cursor */}
          <line
            x1={playheadPos * 800}
            y1="0"
            x2={playheadPos * 800}
            y2="200"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        </svg>

        {/* Playhead Time Badge */}
        <div
          className="absolute bottom-2 font-mono text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-bold pointer-events-none transition-all duration-75"
          style={{ left: `${Math.max(2, Math.min(92, playheadPos * 100))}%` }}
        >
          {Math.round(playheadPos * 100)}%
        </div>
      </div>

      {/* Editor Controls & Quick Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Interpolation Shape Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-400">CURVE INTERPOLATION:</span>
          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            {(['smooth', 'linear', 'stepped'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setLanes((prev) => ({
                    ...prev,
                    [selectedTarget]: { ...prev[selectedTarget], curveType: mode },
                  }));
                }}
                className={`px-3 py-1 rounded-lg font-bold capitalize transition ${
                  activeLane.curveType === mode
                    ? 'bg-cyan-500 text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Curve Preset Generators */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-400">PRESETS:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyPresetCurve('sweep_up')}
              className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-xs font-bold transition"
            >
              Filter Sweep Up
            </button>
            <button
              type="button"
              onClick={() => applyPresetCurve('lfo_pump')}
              className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-xs font-bold transition"
            >
              4-on-Floor Pump
            </button>
            <button
              type="button"
              onClick={() => applyPresetCurve('breakdown_drop')}
              className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-xs font-bold transition"
            >
              Drop Mute
            </button>
            <button
              type="button"
              onClick={() => applyPresetCurve('reset')}
              className="p-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg transition"
              title="Reset Flat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
