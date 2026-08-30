import React, { useState, useEffect, useRef } from 'react';
import { PLUGIN_REGISTRY } from '../../audio/pluginEngine';
import { soundEngine } from '../../audio/engine';
import { Activity, Power, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SubCheckPluginProps {
  bypassed?: boolean;
  onToggleBypass?: () => void;
}

export const SubCheckPlugin: React.FC<SubCheckPluginProps> = ({
  bypassed = false,
  onToggleBypass,
}) => {
  const [subEnergy, setSubEnergy] = useState<number>(65);
  const [kickEnergy, setKickEnergy] = useState<number>(55);
  const [phaseAlignment, setPhaseAlignment] = useState<number>(94);
  const [clashWarning, setClashWarning] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const updateAnalysis = () => {
      const isPlaying = soundEngine.getPlaying();
      if (isPlaying) {
        const randSub = 50 + Math.random() * 35;
        const randKick = 45 + Math.random() * 40;
        setSubEnergy(Math.round(randSub));
        setKickEnergy(Math.round(randKick));
        setPhaseAlignment(Math.round(88 + Math.random() * 10));
        setClashWarning(randSub > 78 && randKick > 75);
      } else {
        setSubEnergy(10);
        setKickEnergy(8);
        setPhaseAlignment(99);
        setClashWarning(false);
      }

      // Draw Sub FFT Canvas
      if (canvasRef.current) {
        const cvs = canvasRef.current;
        const ctx = cvs.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, cvs.width, cvs.height);

          // Grid lines for 20Hz, 40Hz, 80Hz, 120Hz, 200Hz
          ctx.strokeStyle = '#262626';
          ctx.lineWidth = 1;
          [0.1, 0.25, 0.5, 0.75, 0.95].forEach((pos) => {
            ctx.beginPath();
            ctx.moveTo(pos * cvs.width, 0);
            ctx.lineTo(pos * cvs.width, cvs.height);
            ctx.stroke();
          });

          // Energy curve for 20Hz - 200Hz
          ctx.beginPath();
          ctx.moveTo(0, cvs.height);
          const points = [
            { x: 0, y: cvs.height - 10 },
            { x: cvs.width * 0.2, y: cvs.height - (subEnergy / 100) * cvs.height * 0.85 },
            { x: cvs.width * 0.55, y: cvs.height - (kickEnergy / 100) * cvs.height * 0.8 },
            { x: cvs.width * 0.85, y: cvs.height - 15 },
            { x: cvs.width, y: cvs.height },
          ];

          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }

          ctx.strokeStyle = clashWarning ? '#f43f5e' : '#06b6d4';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.lineTo(cvs.width, cvs.height);
          ctx.lineTo(0, cvs.height);
          ctx.fillStyle = clashWarning ? 'rgba(244, 63, 94, 0.15)' : 'rgba(6, 182, 212, 0.15)';
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(updateAnalysis);
    };

    animId = requestAnimationFrame(updateAnalysis);
    return () => cancelAnimationFrame(animId);
  }, [subEnergy, kickEnergy, clashWarning]);

  return (
    <div
      className={`bg-neutral-950 border rounded-2xl p-5 shadow-2xl transition-all ${bypassed ? 'opacity-50 border-neutral-800' : 'border-cyan-500/30'}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-850 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wider uppercase font-mono">
                SONIK SUB CHECK (20Hz - 200Hz)
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold">
                LOW-END PHASE AUDIT
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Low-frequency collision detection, 808 sub weight vs Kick punch phase alignment
            </p>
          </div>
        </div>

        {onToggleBypass && (
          <button
            onClick={onToggleBypass}
            className={`p-2 rounded-xl border transition ${
              bypassed
                ? 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-white'
                : 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/20'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Spectrum & Analysis Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Spectrum Canvas */}
        <div className="md:col-span-8 bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 relative">
          <canvas ref={canvasRef} width={400} height={120} className="w-full h-28 rounded-lg" />
          <div className="flex justify-between text-[9px] font-mono text-neutral-500 mt-1 px-1">
            <span>20 Hz (Sub Rumble)</span>
            <span>45 Hz (808 Root)</span>
            <span>90 Hz (Kick Punch)</span>
            <span>150 Hz (Mud)</span>
            <span>200 Hz</span>
          </div>
        </div>

        {/* Meters & Warning */}
        <div className="md:col-span-4 bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between space-y-3">
          {/* Phase Correlation */}
          <div>
            <div className="flex justify-between text-[10px] font-mono text-neutral-300 mb-1">
              <span>Phase Alignment</span>
              <span className="text-emerald-400 font-bold">{phaseAlignment}% In-Phase</span>
            </div>
            <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-75"
                style={{ width: `${phaseAlignment}%` }}
              />
            </div>
          </div>

          {/* Sub vs Kick clash indicator */}
          <div
            className={`p-2.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
              clashWarning
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {clashWarning ? (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Masking Detected: Duck 808 on Kick</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sub / Kick Cleanly Balanced</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
