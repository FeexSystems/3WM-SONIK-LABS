import React, { useState } from 'react';
import { ProjectVersion, Track } from '../../types';
import { projectStore } from '../../services/projectStore';
import {
  History,
  RotateCcw,
  Plus,
  Check,
  Clock,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Layers,
  X,
} from 'lucide-react';

interface VersionHistoryDrawerProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
  onVersionRestored: (version: ProjectVersion) => void;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  track,
  isOpen,
  onClose,
  onVersionRestored,
}) => {
  const [versions, setVersions] = useState<ProjectVersion[]>(() =>
    projectStore.getVersions(track.id)
  );
  const [newVersionLabel, setNewVersionLabel] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<ProjectVersion | null>(
    versions[0] || null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateVersion = () => {
    if (!newVersionLabel.trim()) return;
    const created = projectStore.createVersion(newVersionLabel.trim(), 'BEAT');
    if (created) {
      const updated = projectStore.getVersions(track.id);
      setVersions(updated);
      setSelectedVersion(created);
      setNewVersionLabel('');
      setIsCreating(false);
    }
  };

  const handleRestoreVersion = (ver: ProjectVersion) => {
    const restored = projectStore.restoreVersion(ver);
    if (restored) {
      const updated = projectStore.getVersions(track.id);
      setVersions(updated);
      setSelectedVersion(restored);
      setRestoredNotice(`Restored as new version v${restored.versionNumber}`);
      setTimeout(() => setRestoredNotice(null), 4000);
      onVersionRestored(restored);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-neutral-950 border-l border-neutral-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 bg-neutral-900/90 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-bold text-sm text-white">Version History</h2>
              <p className="text-[11px] text-neutral-400">Non-destructive snapshot timeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Restore Notification */}
        {restoredNotice && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{restoredNotice}</span>
          </div>
        )}

        {/* Snapshot Creation Box */}
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-950">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-neutral-900 hover:bg-neutral-800 text-amber-300 font-semibold text-xs rounded-xl border border-amber-500/30 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project Snapshot</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2 bg-neutral-900 p-3 rounded-xl border border-neutral-700">
              <span className="text-xs font-semibold text-neutral-200">New Snapshot Name</span>
              <input
                type="text"
                value={newVersionLabel}
                onChange={(e) => setNewVersionLabel(e.target.value)}
                placeholder="e.g., Vocal Take 3 + Log Drum Rebalance"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVersion}
                  className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-lg"
                >
                  Save Snapshot
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Versions Timeline List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {versions.map((ver) => {
            const isSelected = selectedVersion?.id === ver.id;
            return (
              <div
                key={ver.id}
                onClick={() => setSelectedVersion(ver)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-neutral-900 border-amber-500/60 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-neutral-950/70 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      v{ver.versionNumber}
                    </span>
                    <span className="text-xs font-semibold text-white truncate max-w-[180px]">
                      {ver.label}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase bg-neutral-800 text-neutral-300">
                    {ver.stage}
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">{ver.description}</p>

                <div className="flex items-center justify-between mt-2.5 text-[10px] text-neutral-500 font-mono">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(ver.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span>by {ver.createdBy}</span>
                </div>

                {isSelected && (
                  <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Master LUFS: {ver.lufs}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreVersion(ver);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black rounded font-bold text-[11px] transition-colors shadow-xs"
                      title="Non-destructively roll back to this snapshot"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore As New Version</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-neutral-900 border-t border-neutral-800 text-[11px] text-neutral-400 text-center">
          Restoring creates a new chronological version preserving full history.
        </div>
      </div>
    </div>
  );
};
