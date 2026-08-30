import React, { useEffect, useState } from 'react';
import { AutoSaveState } from '../../types';
import { projectStore } from '../../services/projectStore';
import { Check, Loader2, AlertCircle, CloudOff, RefreshCw } from 'lucide-react';

export const SaveIndicator: React.FC = () => {
  const [state, setState] = useState<AutoSaveState>(() => projectStore.getAutoSaveState());

  useEffect(() => {
    return projectStore.subscribeStatus((newState) => {
      setState(newState);
    });
  }, []);

  const formattedTime = state.lastSavedAt
    ? new Date(state.lastSavedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '';

  if (state.status === 'saving') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono">
        <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
        <span>Saving...</span>
      </div>
    );
  }

  if (state.status === 'dirty') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800 border border-amber-500/30 text-amber-300 text-[11px] font-mono cursor-pointer hover:bg-neutral-700 transition-colors"
        onClick={() => projectStore.performAutoSave()}
        title="Unsaved changes (Click to save now or auto-saves in ~2s)"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>Unsaved changes</span>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-[11px] font-mono cursor-pointer"
        onClick={() => projectStore.performAutoSave()}
        title="Saved to local recovery cache (Click to retry cloud sync)"
      >
        <CloudOff className="w-3 h-3 text-blue-400" />
        <span>Saved locally</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-400 text-[11px] font-mono hover:text-neutral-200 cursor-pointer transition-colors"
      onClick={() => projectStore.performAutoSave()}
      title="All changes saved (Click to force sync)"
    >
      <Check className="w-3 h-3 text-emerald-400" />
      <span>Saved {formattedTime}</span>
    </div>
  );
};
