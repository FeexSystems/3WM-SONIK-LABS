import { useEffect, useRef, useState } from 'react';
import { Track } from '../types';

export function useAgentAudit(isPlaying: boolean, track: Track | null) {
  const [auditMessage, setAuditMessage] = useState<string | null>(null);
  const auditTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying && track) {
      // Simulate proactive background polling of audio graph
      auditTimer.current = setInterval(() => {
        // Randomly simulate discovering a clipping issue or muddy bass
        const r = Math.random();
        if (r > 0.95) {
          setAuditMessage(
            "Kappachino Emar: I'm detecting phase cancellation in the sub-bass frequencies. Recommending a high-pass filter on the vocal stem to create headroom."
          );
        } else if (r > 0.9 && r <= 0.95) {
          setAuditMessage(
            'Kappachino Ricky: The 808 is clipping on the master bus by 1.2dB. Should I pull back the threshold on the drum bus compressor?'
          );
        }
      }, 5000);
    } else {
      if (auditTimer.current) clearInterval(auditTimer.current);
    }

    return () => {
      if (auditTimer.current) clearInterval(auditTimer.current);
    };
  }, [isPlaying, track]);

  return { auditMessage, clearAudit: () => setAuditMessage(null) };
}
