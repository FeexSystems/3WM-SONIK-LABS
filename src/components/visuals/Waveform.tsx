import { useEffect, useRef } from 'react';
import { landingAudioEngine } from '../../audio/landingAudioEngine';

export function Waveform() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    let w = canvas.clientWidth;
    let h = canvas.clientHeight;
    let dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Get real-time audio spectrum data
      const freqData = landingAudioEngine.getFrequencyData();

      // Calculate band energies (normalized 0..1)
      let lowEnergy = 0;
      let midEnergy = 0;
      let highEnergy = 0;

      if (freqData && freqData.length > 0) {
        for (let i = 0; i < 6; i++) lowEnergy += freqData[i] || 0;
        for (let i = 6; i < 20; i++) midEnergy += freqData[i] || 0;
        for (let i = 20; i < 40; i++) highEnergy += freqData[i] || 0;

        lowEnergy = lowEnergy / (6 * 255);
        midEnergy = midEnergy / (14 * 255);
        highEnergy = highEnergy / (20 * 255);
      }

      // 1. Subtle Background Spectrum Equalizer Bars
      const numBars = 32;
      const barWidth = w / numBars;
      for (let i = 0; i < numBars; i++) {
        const val = freqData
          ? (freqData[i * 2] || 0) / 255
          : Math.sin(i + frame * 0.05) * 0.15 + 0.15;
        const barHeight = val * h * 0.75;
        const x = i * barWidth;
        const y = h - barHeight;

        const grad = ctx.createLinearGradient(0, y, 0, h);
        grad.addColorStop(
          0,
          i < 10 ? 'rgba(245,168,0,0.25)' : i < 22 ? 'rgba(42,255,163,0.2)' : 'rgba(255,60,0,0.2)'
        );
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
      }

      // 2. Harmonic Fluid Waves (Mint, Gold, Fire)
      const channels = [
        {
          y: 0.3,
          color: '#2AFFA3',
          freq: 9 + highEnergy * 8,
          speed: 1.0 + highEnergy * 1.5,
          amp: 0.16 + highEnergy * 0.22,
          boost: highEnergy,
        },
        {
          y: 0.5,
          color: '#F5A800',
          freq: 6 + lowEnergy * 6,
          speed: 0.85 + lowEnergy * 1.3,
          amp: 0.22 + lowEnergy * 0.35,
          boost: lowEnergy,
        },
        {
          y: 0.7,
          color: '#FF3C00',
          freq: 4 + midEnergy * 7,
          speed: 1.15 + midEnergy * 1.4,
          amp: 0.15 + midEnergy * 0.25,
          boost: midEnergy,
        },
      ];

      channels.forEach((c, idx) => {
        ctx.beginPath();
        ctx.strokeStyle = c.color;
        ctx.lineWidth = (idx === 1 ? 2.8 : 1.8) + c.boost * 2.5;
        ctx.shadowBlur = 14 + c.boost * 22;
        ctx.shadowColor = c.color;

        for (let x = 0; x <= w; x += 2) {
          const nx = x / w;
          const y =
            h * c.y +
            Math.sin(nx * Math.PI * c.freq + frame * 0.035 * c.speed) * h * c.amp +
            Math.sin(nx * Math.PI * (c.freq * 2.2) + frame * 0.045) * h * (0.05 + c.boost * 0.08);

          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      ctx.shadowBlur = 0;
      frame++;
      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="h-full w-full block" />;
}

export default Waveform;
