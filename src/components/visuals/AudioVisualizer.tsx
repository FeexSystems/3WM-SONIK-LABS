import React, { useRef, useEffect, useState } from 'react';
import { useAnalyser } from '../../hooks/useAudioContext';

interface AudioVisualizerProps {
  audioContext: AudioContext | null;
  type?: 'waveform' | 'frequency' | 'circular';
  color?: string;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioContext,
  type = 'frequency',
  color = '#F5A800',
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyser = useAnalyser(audioContext);
  const animationRef = useRef<number | undefined>(undefined);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      if (!dataArrayRef.current) return;

      if (type === 'frequency') {
        analyser.getByteFrequencyData(dataArrayRef.current as unknown as Uint8Array<ArrayBuffer>);
      } else {
        analyser.getByteTimeDomainData(dataArrayRef.current as unknown as Uint8Array<ArrayBuffer>);
      }

      ctx.fillStyle = 'rgba(13, 13, 13, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (type === 'waveform') {
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArrayRef.current[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      } else if (type === 'frequency') {
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArrayRef.current[i] / 255) * canvas.height;

          const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, 'rgba(245, 168, 0, 0.1)');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

          x += barWidth + 1;
        }
      } else if (type === 'circular') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();

        for (let i = 0; i < bufferLength; i++) {
          const amplitude = dataArrayRef.current[i] / 255;
          const angle = (i / bufferLength) * 2 * Math.PI;
          const x = centerX + Math.cos(angle) * (radius + amplitude * 50);
          const y = centerY + Math.sin(angle) * (radius + amplitude * 50);

          ctx.beginPath();
          ctx.arc(x, y, 2, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, type, color]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={height}
      className="w-full rounded-lg border border-neutral-800 bg-neutral-950"
    />
  );
};
