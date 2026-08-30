import React, { useEffect, useRef } from 'react';
import { TrackSettings } from '../../types';
import { soundEngine } from '../../audio/engine';

interface Props {
  settings: TrackSettings;
  isPlaying: boolean;
}

export const DSPVisualizer: React.FC<Props> = ({ settings, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }

      // Draw EQ Curve (Parametric representation)
      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      const low = settings.eq.low;
      const mid = settings.eq.mid;
      const high = settings.eq.high;

      const fftData = soundEngine.getAnalyserData();

      for (let x = 0; x < width; x++) {
        let y = height / 2;

        // Base EQ curve simulation
        const normalizedX = x / width;
        if (normalizedX < 0.3) {
          y -= low * Math.sin((normalizedX * Math.PI) / 0.3) * 5;
        } else if (normalizedX < 0.7) {
          y -= mid * Math.sin(((normalizedX - 0.3) * Math.PI) / 0.4) * 5;
        } else {
          y -= high * Math.sin(((normalizedX - 0.7) * Math.PI) / 0.3) * 5;
        }

        // Overlay True FFT data
        if (isPlaying && fftData && fftData.length > 0) {
          // Map x to FFT bin index
          const binIndex = Math.floor((x / width) * (fftData.length / 2));
          const magnitude = fftData ? (fftData[binIndex] / 255) * 100 - 100 : -100; // Converted from Uint8 to dB
          // Convert to positive offset
          const amplitude = Math.max(0, (magnitude + 100) * 0.8);
          y -= amplitude;
        }

        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#2affa3'; // Emar Mint
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw gain reduction meter (Compressor)
      const gr = isPlaying ? Math.abs(soundEngine.getSidechainGainReduction()) * 10 : 0;
      ctx.fillStyle = '#ff3c00'; // Ricky Fire
      ctx.fillRect(width - 20, 10, 10, Math.min(height - 20, gr));

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [settings, isPlaying]);

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-mono text-neutral-400">DSP CHAIN (EQ - COMP - LIMITER)</span>
        <span className="text-[10px] font-mono text-[#2affa3] animate-pulse">
          {isPlaying ? 'ANALYZING' : 'IDLE'}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={120}
        className="w-full bg-[#111] rounded border border-neutral-800"
      />
      <div className="flex justify-between mt-2 text-[10px] font-mono text-neutral-500">
        <span>20Hz</span>
        <span>1kHz</span>
        <span>20kHz</span>
      </div>
    </div>
  );
};
