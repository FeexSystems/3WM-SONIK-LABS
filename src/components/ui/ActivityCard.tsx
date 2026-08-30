import React from 'react';

interface ActivityCardProps {
  agent: string;
  agentColor: string;
  message: string;
  timestamp: string;
  trackTitle?: string;
}

export const ActivityCard = React.memo(function ActivityCard({
  agent,
  agentColor,
  message,
  timestamp,
  trackTitle,
}: ActivityCardProps) {
  return (
    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold" style={{ color: agentColor }}>
          {agent}
        </span>
        <span className="text-[9px] font-mono text-neutral-500">{timestamp}</span>
      </div>
      <p className="text-[11px] text-neutral-300 leading-relaxed">"{message}"</p>
      {trackTitle && (
        <span className="text-[9px] text-neutral-500 font-mono mt-2 block">
          Track: {trackTitle}
        </span>
      )}
    </div>
  );
});
