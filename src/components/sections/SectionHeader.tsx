import React from 'react';

interface SectionHeaderProps {
  label: string;
  labelColor?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export function SectionHeader({
  label,
  labelColor = 'text-[#f5a800]',
  title,
  subtitle,
  centered = true,
}: SectionHeaderProps) {
  return (
    <div className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className={`font-mono text-[11px] uppercase tracking-[.18em] ${labelColor}`}>
        — {label} —
      </p>
      <h2 className="font-display mt-3 text-6xl leading-none text-[var(--foreground-bright)] md:text-8xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-sm font-light leading-7 text-[var(--muted)] max-w-none">
          {subtitle}
        </p>
      )}
    </div>
  );
}
