import React, { useRef, useEffect, useState } from 'react';
import { soundEngine } from '../../audio/engine';
import { Activity, Play, Pause, Disc3, Sparkles } from 'lucide-react';

interface SpectrumVisualizerViewProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const SpectrumVisualizerView: React.FC<SpectrumVisualizerViewProps> = ({
  isPlaying,
  onTogglePlay,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualMode, setVisualMode] = useState<'BARS' | 'WAVE' | 'CIRCULAR'>('BARS');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      // Dark fade clearing for trailing aesthetic
      ctx.fillStyle = 'rgba(10, 11, 13, 0.25)';
      ctx.fillRect(0, 0, width, height);

      const data = soundEngine.getAnalyserData();
      if (!data) return;

      const bufferLength = data.length;

      if (visualMode === 'BARS') {
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (data[i] / 255) * height * 0.85;

          // Gradient from Amber to Emerald to Purple
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, '#f59e0b');
          gradient.addColorStop(0.5, '#10b981');
          gradient.addColorStop(1, '#8b5cf6');

          ctx.fillStyle = isPlaying ? gradient : '#262626';
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

          x += barWidth + 1;
        }
      } else if (visualMode === 'WAVE') {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = isPlaying ? '#f59e0b' : '#404040';
        ctx.beginPath();

        const sliceWidth = (width * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = data[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      } else if (visualMode === 'CIRCULAR') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.45;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#262626';
        ctx.stroke();

        for (let i = 0; i < bufferLength; i += 2) {
          const rad = (i / bufferLength) * 2 * Math.PI;
          const val = (data[i] / 255) * (radius * 0.9);

          const x1 = centerX + Math.cos(rad) * radius;
          const y1 = centerY + Math.sin(rad) * radius;
          const x2 = centerX + Math.cos(rad) * (radius + val);
          const y2 = centerY + Math.sin(rad) * (radius + val);

          ctx.strokeStyle = isPlaying ? '#10b981' : '#404040';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, visualMode]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-neutral-900/80 glass border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className={`w-5 h-5 text-gold ${isPlaying ? 'pulse-gold' : ''}`} />
            <h2 className="text-base font-bold text-transparent bg-clip-text text-gradient-gold uppercase tracking-tight">
              Real-Time FFT Spectrum & Phase Visualizer
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            64-band fast fourier transform with harmonic frequency detection and dynamic phase
            correlation.
          </p>
        </div>

        {/* Visual Mode Selector */}
        <div className="flex items-center gap-2">
          <div className="bg-neutral-950 p-1 rounded-xl border border-neutral-800 flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => setVisualMode('BARS')}
              className={`px-3 py-1.5 rounded-lg transition ${
                visualMode === 'BARS'
                  ? 'bg-emerald-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              FFT BARS
            </button>
            <button
              onClick={() => setVisualMode('WAVE')}
              className={`px-3 py-1.5 rounded-lg transition ${
                visualMode === 'WAVE'
                  ? 'bg-emerald-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              OSCILLOSCOPE
            </button>
            <button
              onClick={() => setVisualMode('CIRCULAR')}
              className={`px-3 py-1.5 rounded-lg transition ${
                visualMode === 'CIRCULAR'
                  ? 'bg-emerald-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              ORBITAL
            </button>
          </div>
        </div>
      </div>

      {/* Visualizer Canvas Container */}
      <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-4 shadow-2xl relative">
        <canvas
          ref={canvasRef}
          width={1000}
          height={400}
          className="w-full h-[400px] rounded-xl bg-neutral-950"
        />

        {/* Frequency Markers */}
        <div className="flex justify-between text-[10px] font-mono text-neutral-500 px-4 pt-3 border-t border-neutral-850">
          <span>20 Hz (SUB)</span>
          <span>60 Hz (LOG DRUM)</span>
          <span>250 Hz (WARMTH)</span>
          <span>1 kHz (MIDS)</span>
          <span>4 kHz (PRESENCE)</span>
          <span>10 kHz (BRIGHT)</span>
          <span>20 kHz (AIR)</span>
        </div>
      </div>
    </div>
  );
};
