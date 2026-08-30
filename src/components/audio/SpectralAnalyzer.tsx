// @ts-nocheck
/**
 * 3WM SONIK — Spectral Analyzer
 * Real-time frequency spectrum visualization
 */

import { useEffect, useRef, useState } from 'react';

interface SpectralAnalyzerProps {
  analyser: AnalyserNode | null;
  width?: number;
  height?: number;
  fftSize?: number;
  smoothing?: number;
  color?: string;
  backgroundColor?: string;
  showGrid?: boolean;
  showLabels?: boolean;
  minDecibels?: number;
  maxDecibels?: number;
}

export function SpectralAnalyzer({
  analyser,
  width = 800,
  height = 300,
  fftSize = 2048,
  smoothing = 0.8,
  color = '#2AFFA3',
  backgroundColor = '#0D0D0D',
  showGrid = true,
  showLabels = true,
  minDecibels = -90,
  maxDecibels = -10,
}: SpectralAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Configure analyser
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothing;
    analyser.minDecibels = minDecibels;
    analyser.maxDecibels = maxDecibels;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    setIsInitialized(true);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      // Get frequency data
      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      if (showGrid) {
        drawGrid(ctx, width, height);
      }

      // Draw frequency bars
      drawFrequencyBars(ctx, dataArray, width, height, color);

      // Draw labels
      if (showLabels) {
        drawLabels(ctx, width, height, minDecibels, maxDecibels);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    analyser,
    width,
    height,
    fftSize,
    smoothing,
    color,
    backgroundColor,
    showGrid,
    showLabels,
    minDecibels,
    maxDecibels,
  ]);

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Horizontal lines (frequency bands)
    for (let i = 0; i <= 10; i++) {
      const y = (h / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Vertical lines (time)
    for (let i = 0; i <= 20; i++) {
      const x = (w / 20) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  };

  const drawFrequencyBars = (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    w: number,
    h: number,
    barColor: string
  ) => {
    const barWidth = w / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * h;

      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(x, h, x, h - barHeight);
      gradient.addColorStop(0, barColor);
      gradient.addColorStop(1, adjustColor(barColor, 30));

      ctx.fillStyle = gradient;
      ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);

      x += barWidth;
    }
  };

  const drawLabels = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    minDb: number,
    maxDb: number
  ) => {
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';

    // Frequency labels (Hz)
    const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    frequencies.forEach((freq) => {
      const x = (Math.log10(freq) / Math.log10(20000)) * w;
      if (x > 0 && x < w) {
        ctx.fillText(`${freq}Hz`, x - 5, h - 5);
      }
    });

    // Decibel labels
    ctx.textAlign = 'left';
    for (let i = 0; i <= 10; i++) {
      const y = (h / 10) * i;
      const db = maxDb - (maxDb - minDb) * (i / 10);
      ctx.fillText(`${db.toFixed(0)}dB`, 5, y + 10);
    }
  };

  const adjustColor = (color: string, amount: number): string => {
    // Simple color brightness adjustment
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full h-auto" />
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <span className="text-neutral-400">Initializing analyzer...</span>
        </div>
      )}
    </div>
  );
}

/**
 * Spectrogram visualization (waterfall plot)
 */
export function Spectrogram({
  analyser,
  width = 800,
  height = 300,
  fftSize = 2048,
  color = '#2AFFA3',
  backgroundColor = '#0D0D0D',
}: {
  analyser: AnalyserNode | null;
  width?: number;
  height?: number;
  fftSize?: number;
  color?: string;
  backgroundColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const historyRef = useRef<Uint8Array[]>([]);
  const maxHistory = height;

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    analyser.fftSize = fftSize;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      // Add to history
      historyRef.current.push(new Uint8Array(dataArray));
      if (historyRef.current.length > maxHistory) {
        historyRef.current.shift();
      }

      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Draw spectrogram
      const barWidth = width / bufferLength;

      historyRef.current.forEach((frame, frameIndex) => {
        const y = height - (frameIndex + 1);

        for (let i = 0; i < bufferLength; i++) {
          const intensity = frame[i] / 255;
          if (intensity > 0.1) {
            ctx.fillStyle = adjustColorOpacity(color, intensity);
            ctx.fillRect(i * barWidth, y, barWidth, 1);
          }
        }
      });
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, width, height, fftSize, color, backgroundColor, maxHistory]);

  const adjustColorOpacity = (color: string, opacity: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return <canvas ref={canvasRef} className="w-full h-auto" />;
}

/**
 * Waveform visualization
 */
export function Waveform({
  analyser,
  width = 800,
  height = 300,
  color = '#F5A800',
  backgroundColor = '#0D0D0D',
}: {
  analyser: AnalyserNode | null;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
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
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, width, height, color, backgroundColor]);

  return <canvas ref={canvasRef} className="w-full h-auto" />;
}
