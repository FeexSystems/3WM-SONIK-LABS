import React, { useState } from 'react';
import {
  ConversationProvider,
  useConversationControls,
  useConversationStatus,
} from '@elevenlabs/react';
import { AGENT_IDS } from '../../integrations/elevenlabs/agents';
import { Mic, Square } from 'lucide-react';

interface VoiceCouncilProps {
  onStageChange: (description: string, callback: () => void) => void;
}

const ConsoleControls: React.FC<{ onStageChange: VoiceCouncilProps['onStageChange'] }> = ({
  onStageChange,
}) => {
  const { startSession, endSession } = useConversationControls();
  const { status } = useConversationStatus();

  const handleStart = async () => {
    try {
      await startSession({
        clientTools: {
          generateBeatVariation: async (params: any) => {
            console.log('Generating beat variation...', params);
            // Needs Orchestrator validation
            return 'Variation queued.';
          },
          analyzeVocalMasking: async ({ trackId }: any) => {
            console.log('Analyzing vocal masking for', trackId);
            return 'Analysis complete. Suggested -2dB dip at 500Hz on instruments.';
          },
          stageEQAdjustment: async ({ band, gain }: any) => {
            // Destructive change must be staged
            onStageChange(`Apply ${gain}dB to ${band} band?`, () => {
              console.log(`Applied ${gain}dB to ${band}`);
            });
            return 'Change staged. Waiting for user approval.';
          },
        },
      });
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-300 uppercase">Voice Council</span>
        <span className="text-[10px] text-neutral-500 font-mono">{status}</span>
      </div>
      <div className="flex gap-2 mt-2">
        {status === 'disconnected' ? (
          <button
            onClick={handleStart}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition"
          >
            <Mic className="w-3.5 h-3.5" />
            Consult Emar
          </button>
        ) : (
          <button
            onClick={() => endSession()}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition"
          >
            <Square className="w-3.5 h-3.5" />
            End Consultation
          </button>
        )}
      </div>
    </div>
  );
};

export const StudioConsole: React.FC<VoiceCouncilProps> = ({ onStageChange }) => {
  // Using Emar's agent ID by default for the console.
  const agentId = AGENT_IDS.EMAR;

  if (!agentId) {
    return (
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-500">
        Voice Council offline. Missing Agent ID.
      </div>
    );
  }

  return (
    <ConversationProvider agentId={agentId}>
      <ConsoleControls onStageChange={onStageChange} />
    </ConversationProvider>
  );
};
