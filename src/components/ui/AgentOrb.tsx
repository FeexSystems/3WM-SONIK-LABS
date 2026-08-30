import React, { useRef, useEffect } from 'react';

export type AgentState = 'idle' | 'thinking' | 'speaking';

export interface AgentOrbProps {
  id: string;
  name: string;
  color: string; // Primary agent color
  secondaryColor?: string; // Secondary accent
  state: AgentState;
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string; // Role text
  avatarUrl?: string; // High-fidelity 3D avatar image URL
}

/**
 * High-Fidelity 3D Agent Orb
 * Renders the Three Wise Men as cinematic, glowing 3D spheres with
 * multi-layered CSS 3D transforms, depth-of-field effects,
 * and state-driven micro-animations.
 */
export const AgentOrb: React.FC<AgentOrbProps> = ({
  id,
  name,
  color,
  secondaryColor,
  state,
  size = 'md',
  subtitle,
  avatarUrl,
}) => {
  const orbRef = useRef<HTMLDivElement>(null);
  const secondary = secondaryColor || color;

  const sizeMap = {
    sm: { container: 'w-20 h-20', orbSize: 80, label: 'text-[10px]' },
    md: { container: 'w-32 h-32', orbSize: 128, label: 'text-xs' },
    lg: { container: 'w-44 h-44', orbSize: 176, label: 'text-sm' },
  };
  const s = sizeMap[size];

  // Gentle idle float animation via requestAnimationFrame
  useEffect(() => {
    if (!orbRef.current || state !== 'idle') return;
    let frameId: number;
    let t = 0;
    const animate = () => {
      t += 0.015;
      if (orbRef.current) {
        const y = Math.sin(t) * 4;
        const rotY = Math.sin(t * 0.7) * 3;
        orbRef.current.style.transform = `translateY(${y}px) rotateY(${rotY}deg)`;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [state]);

  // Thinking ripple
  useEffect(() => {
    if (!orbRef.current || state !== 'thinking') return;
    let frameId: number;
    let t = 0;
    const animate = () => {
      t += 0.03;
      if (orbRef.current) {
        const scale = 1 + Math.sin(t * 2) * 0.04;
        const rotY = Math.sin(t) * 8;
        const rotX = Math.cos(t * 0.6) * 4;
        orbRef.current.style.transform = `scale(${scale}) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [state]);

  // Speaking pulse
  useEffect(() => {
    if (!orbRef.current || state !== 'speaking') return;
    let frameId: number;
    let t = 0;
    const animate = () => {
      t += 0.04;
      if (orbRef.current) {
        const scale = 1.05 + Math.sin(t * 3) * 0.06;
        const rotY = Math.sin(t * 1.5) * 12;
        orbRef.current.style.transform = `scale(${scale}) rotateY(${rotY}deg)`;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [state]);

  return (
    <div className="flex flex-col items-center gap-4 select-none" style={{ perspective: '600px' }}>
      {/* Orb Assembly */}
      <div className="relative group" style={{ transformStyle: 'preserve-3d' }}>
        {/* Layer 0 — Shadow on ground */}
        <div
          className="absolute rounded-full blur-2xl transition-all duration-700"
          style={{
            width: s.orbSize * 0.7,
            height: s.orbSize * 0.15,
            bottom: -(s.orbSize * 0.12),
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: color,
            opacity: state === 'speaking' ? 0.6 : state === 'thinking' ? 0.4 : 0.2,
          }}
        />

        {/* Layer 1 — Deep outer glow */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-700"
          style={{
            filter: `blur(${state === 'speaking' ? 30 : state === 'thinking' ? 20 : 12}px)`,
            backgroundColor: color,
            opacity: state === 'speaking' ? 0.55 : state === 'thinking' ? 0.35 : 0.15,
            transform: `scale(${state === 'speaking' ? 1.6 : state === 'thinking' ? 1.35 : 1.15})`,
          }}
        />

        {/* Layer 2 — Mid glow ring */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-500"
          style={{
            filter: `blur(${state === 'speaking' ? 14 : 8}px)`,
            background: `radial-gradient(circle at 40% 35%, ${secondary}80, transparent 70%)`,
            opacity: state === 'idle' ? 0.2 : 0.5,
            transform: `scale(${state === 'speaking' ? 1.3 : 1.1})`,
          }}
        />

        {/* Layer 3 — Core 3D Sphere */}
        <div
          ref={orbRef}
          className={`relative rounded-full ${s.container} cursor-pointer transition-shadow duration-500`}
          style={{
            transformStyle: 'preserve-3d',
            background: `
              radial-gradient(circle at 32% 28%, ${color}ee 0%, ${color}88 25%, ${color}44 50%, #0a0a0a 85%),
              radial-gradient(circle at 70% 75%, ${secondary}33 0%, transparent 50%)
            `,
            boxShadow: `
              inset -${s.orbSize * 0.08}px -${s.orbSize * 0.08}px ${s.orbSize * 0.2}px rgba(0,0,0,0.7),
              inset ${s.orbSize * 0.06}px ${s.orbSize * 0.06}px ${s.orbSize * 0.15}px rgba(255,255,255,0.15),
              0 0 ${state === 'speaking' ? 40 : 15}px ${color}${state === 'speaking' ? '88' : '33'}
            `,
            border: `1px solid ${color}30`,
          }}
        >
          {/* Specular highlight (top-left shine) */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: '40%',
              height: '30%',
              top: '12%',
              left: '18%',
              background: `radial-gradient(ellipse at center, rgba(255,255,255,0.35) 0%, transparent 70%)`,
              filter: 'blur(4px)',
            }}
          />

          {/* Secondary specular (bottom-right subtle) */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: '20%',
              height: '15%',
              bottom: '18%',
              right: '20%',
              background: `radial-gradient(ellipse at center, ${secondary}40 0%, transparent 70%)`,
              filter: 'blur(6px)',
            }}
          />

          {/* Avatar image overlay (if provided) */}
          {avatarUrl && (
            <div
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{ mixBlendMode: 'luminosity', opacity: 0.3 }}
            >
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Inner energy core */}
          <div
            className="absolute rounded-full transition-all duration-300 pointer-events-none"
            style={{
              width: '35%',
              height: '35%',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, rgba(255,255,255,${
                state === 'speaking' ? 0.7 : state === 'thinking' ? 0.4 : 0.15
              }) 0%, transparent 70%)`,
              filter: `blur(${state === 'speaking' ? 8 : 4}px)`,
              animation:
                state === 'speaking' ? 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none',
            }}
          />

          {/* Pulse rings for speaking state */}
          {state === 'speaking' && (
            <>
              <div
                className="absolute inset-0 rounded-full animate-ping pointer-events-none"
                style={{ border: `2px solid ${color}40`, animationDuration: '2s' }}
              />
              <div
                className="absolute inset-0 rounded-full animate-ping pointer-events-none"
                style={{
                  border: `1px solid ${color}20`,
                  animationDuration: '3s',
                  animationDelay: '0.5s',
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Name & State Label */}
      <div className="text-center space-y-1.5">
        <h3
          className={`font-black tracking-wider uppercase ${s.label}`}
          style={{ color, textShadow: `0 0 12px ${color}44` }}
        >
          {name}
        </h3>
        {subtitle && (
          <p className="text-[10px] font-mono text-neutral-500 tracking-widest">{subtitle}</p>
        )}
        <span
          className="inline-flex items-center gap-1.5 text-[9px] uppercase font-mono tracking-[0.2em] px-3 py-1 rounded-full border"
          style={{
            color: state === 'speaking' ? '#fff' : state === 'thinking' ? color : '#555',
            borderColor: state === 'idle' ? '#333' : `${color}40`,
            backgroundColor: state === 'idle' ? '#111' : `${color}10`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: state === 'idle' ? '#555' : color,
              animation: state !== 'idle' ? 'pulse 1.5s infinite' : 'none',
            }}
          />
          {state}
        </span>
      </div>
    </div>
  );
};
