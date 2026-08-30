import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  isLoading?: boolean;
}

export const MetricCard = React.memo(function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconColor = '#F5A800',
  isLoading = false,
}: MetricCardProps) {
  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4">
      <div className="flex items-center justify-between text-neutral-400 mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-neutral-600 border-t-neutral-400 rounded-full animate-spin" />
      ) : (
        <>
          <span className="text-2xl font-black text-neutral-100">{value}</span>
          {subtext && (
            <span className="text-[10px] text-neutral-500 block mt-1 font-mono">{subtext}</span>
          )}
        </>
      )}
    </div>
  );
});
