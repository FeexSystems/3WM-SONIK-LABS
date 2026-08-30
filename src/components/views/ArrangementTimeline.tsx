import React, { useRef, useEffect, useState } from 'react';
import { StemTrack } from '../../types';

interface Props {
  onAssetDrop?: (payload: any) => void;
  stems: StemTrack[];
  duration: number;
  isPlaying: boolean;
  currentStep: number;
}

export const ArrangementTimeline: React.FC<Props> = ({
  stems,
  duration,
  isPlaying,
  currentStep,
  onAssetDrop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollX, setScrollX] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      const stepWidth = (width / duration) * zoom;
      for (let i = 0; i < duration; i += 4) {
        const x = i * stepWidth - scrollX;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw clips (fake blocks representing stems)
      const trackHeight = 60;
      stems.forEach((stem, index) => {
        const y = index * trackHeight + 10;

        ctx.fillStyle = stem.color || '#3b82f6';
        ctx.globalAlpha = 0.5;
        // Mocking a clip from 0 to full duration for now
        ctx.fillRect(-scrollX, y, width * zoom, trackHeight - 10);
        ctx.globalAlpha = 1.0;

        // Draw some waveform-like lines
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-scrollX, y + 25);
        for (let j = 0; j < width * zoom; j += 5) {
          ctx.lineTo(j - scrollX, y + 25 + (Math.random() * 20 - 10));
        }
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(stem.name, 10, y + 15);
      });

      // Draw Playhead
      const playheadX = currentStep * stepWidth - scrollX;
      ctx.strokeStyle = '#ff3c00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead triangle
      ctx.fillStyle = '#ff3c00';
      ctx.beginPath();
      ctx.moveTo(playheadX - 5, 0);
      ctx.lineTo(playheadX + 5, 0);
      ctx.lineTo(playheadX, 10);
      ctx.fill();
    };

    render();
  }, [stems, duration, isPlaying, currentStep, zoom, scrollX]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = Math.max(
          containerRef.current.clientHeight,
          stems.length * 60 + 20
        );
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [stems]);

  return (
    <div className="w-full h-[400px] bg-[#0d0d0d] border border-neutral-800 rounded-lg overflow-hidden flex flex-col">
      <div className="p-2 border-b border-neutral-800 bg-[#151208] flex justify-between items-center text-xs font-mono text-neutral-400">
        <div className="flex gap-4">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
            className="hover:text-white transition-colors"
          >
            ZOOM OUT
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            className="hover:text-white transition-colors"
          >
            ZOOM IN
          </button>
        </div>
        <span className="text-[#f5a800]">3WM MULTI-TRACK ARRANGEMENT TIMELINE</span>
      </div>
      <div
        ref={containerRef}
        className="flex-1 relative overflow-x-auto overflow-y-auto"
        onScroll={(e) => setScrollX(e.currentTarget.scrollLeft)}
      >
        <div style={{ width: `${Math.max(100, zoom * 100)}%`, minHeight: '100%' }}>
          <canvas ref={canvasRef} className="block cursor-crosshair" />
        </div>
      </div>
    </div>
  );
};
