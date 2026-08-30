import React, { useRef, useEffect } from 'react';
import { Bot, User } from 'lucide-react';

interface Activity {
  agent: string;
  message: string;
  timestamp: string;
}

interface Props {
  activities: Activity[];
}

export const AgentDebate: React.FC<Props> = ({ activities }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activities]);

  const getAgentStyles = (agentName: string) => {
    switch (agentName) {
      case 'Kappachino Ricky':
        return {
          bg: 'bg-[#1a1208]',
          border: 'border-[#f5a800]',
          text: 'text-[#f5a800]',
          label: 'RICKY',
        };
      case 'Kappachino Emar':
        return {
          bg: 'bg-[#0a1a14]',
          border: 'border-[#2affa3]',
          text: 'text-[#2affa3]',
          label: 'EMAR',
        };
      case 'Kingpin':
        return {
          bg: 'bg-[#1a0808]',
          border: 'border-[#ff3c00]',
          text: 'text-[#ff3c00]',
          label: 'KINGPIN',
        };
      case 'ThreeWMOrchestrator':
        return {
          bg: 'bg-neutral-900',
          border: 'border-neutral-700',
          text: 'text-neutral-300',
          label: 'ORCHESTRATOR',
        };
      case 'USER':
        return {
          bg: 'bg-blue-900/20',
          border: 'border-blue-500/50',
          text: 'text-blue-400',
          label: 'PRODUCER',
        };
      default:
        return {
          bg: 'bg-neutral-900',
          border: 'border-neutral-800',
          text: 'text-neutral-400',
          label: agentName.toUpperCase(),
        };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 font-sans" ref={scrollRef}>
      {activities.length === 0 && (
        <div className="text-neutral-600 italic text-xs font-mono text-center mt-10">
          3WM SONIK SYS_READY...
        </div>
      )}

      {activities.map((log, idx) => {
        const isUser = log.agent === 'USER';
        const styles = getAgentStyles(log.agent);

        return (
          <div key={idx} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${styles.border} ${styles.bg}`}
              >
                {isUser ? (
                  <User className={`w-4 h-4 ${styles.text}`} />
                ) : (
                  <Bot className={`w-4 h-4 ${styles.text}`} />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 px-1">
                  <span className={`text-[10px] font-bold tracking-wider ${styles.text}`}>
                    {styles.label}
                  </span>
                  <span className="text-[9px] font-mono text-neutral-600">{log.timestamp}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-md ${
                    isUser
                      ? 'bg-blue-600/10 border border-blue-500/20 text-blue-100 rounded-tr-sm'
                      : `${styles.bg} border ${styles.border} border-opacity-30 text-neutral-200 rounded-tl-sm`
                  }`}
                >
                  {log.message}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
