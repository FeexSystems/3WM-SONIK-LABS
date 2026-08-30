import React, { useState } from 'react';
import { Track, ProjectStage } from '../../types';
import { projectStore } from '../../services/projectStore';
import {
  FolderKanban,
  Plus,
  Play,
  Archive,
  ArchiveRestore,
  Music,
  Clock,
  Layers,
  Sparkles,
  Sliders,
  Gauge,
  Download,
  FolderOpen,
} from 'lucide-react';

interface ProjectsViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  onSelectTrack: (track: Track) => void;
  onOpenNewProject: () => void;
  onNavigate: (view: string) => void;
  onOpenExport?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  tracks,
  currentTrack,
  onSelectTrack,
  onOpenNewProject,
  onNavigate,
  onOpenExport,
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');
  const [filterStage, setFilterStage] = useState<string>('ALL');

  const stages: ProjectStage[] = [
    'DRAFT',
    'RECORDING',
    'PRODUCTION',
    'MIXING',
    'MASTERING',
    'COMPLETE',
  ];

  // Separate Active and Archived Tracks canonically
  const activeTracks = tracks.filter((t) => !t.archived);
  const archivedTracks = tracks.filter((t) => t.archived);

  const baseList = activeTab === 'ACTIVE' ? activeTracks : archivedTracks;
  const filteredTracks =
    filterStage === 'ALL'
      ? baseList
      : baseList.filter((t) => t.status.toUpperCase() === filterStage || t.stage === filterStage);

  const handleToggleArchive = async (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    const newArchived = !track.archived;
    projectStore.archiveProject(newArchived);

    try {
      await fetch(`/api/projects/${track.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: newArchived }),
      });
    } catch (err) {
      console.warn('Archiving project on server failed:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-neutral-100 uppercase tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-amber-400" />
            <span>Studio Projects & Audio Sessions</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage multi-track projects, active sessions, and archived stem libraries across your
            workspace.
          </p>
        </div>

        <button
          onClick={onOpenNewProject}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-amber-400/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>NEW AUDIO SESSION</span>
        </button>
      </div>

      {/* Main Canonical Tabs: ACTIVE vs ARCHIVE */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => {
              setActiveTab('ACTIVE');
              setFilterStage('ALL');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'ACTIVE'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>ACTIVE SESSIONS ({activeTracks.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ARCHIVE');
              setFilterStage('ALL');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'ARCHIVE'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>ARCHIVE ({archivedTracks.length})</span>
          </button>
        </div>

        {/* Stage Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterStage('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
              filterStage === 'ALL'
                ? 'bg-neutral-800 text-amber-400 border border-neutral-700 font-bold'
                : 'bg-neutral-950 text-neutral-500 hover:text-neutral-300 border border-neutral-850'
            }`}
          >
            ALL ({baseList.length})
          </button>
          {stages.map((st) => (
            <button
              key={st}
              onClick={() => setFilterStage(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                filterStage === st
                  ? 'bg-neutral-800 text-amber-400 border border-neutral-700 font-bold'
                  : 'bg-neutral-950 text-neutral-500 hover:text-neutral-300 border border-neutral-850'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredTracks.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <FolderKanban className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-200">
            {activeTab === 'ACTIVE' ? 'No active sessions found' : 'Archive is empty'}
          </h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
            {activeTab === 'ACTIVE'
              ? 'Start a new Afrofusion session or restore an archived project.'
              : 'Archived projects and dormant stem recordings will appear here for long-term storage.'}
          </p>
          {activeTab === 'ACTIVE' && (
            <button
              onClick={onOpenNewProject}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl"
            >
              Create First Track
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTracks.map((tr) => {
            const isSelected = currentTrack?.id === tr.id;
            return (
              <div
                key={tr.id}
                onClick={() => {
                  onSelectTrack(tr);
                  onNavigate('beatlab');
                }}
                className={`bg-neutral-900 border rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer group hover:-translate-y-0.5 shadow-xl ${
                  isSelected
                    ? 'border-amber-400/80 ring-1 ring-amber-400/30'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-amber-400 border border-amber-400/20 uppercase font-bold">
                      {tr.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-500">{tr.genre}</span>
                      <button
                        onClick={(e) => handleToggleArchive(e, tr)}
                        className="p-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 border border-neutral-800 transition"
                        title={tr.archived ? 'Restore from Archive' : 'Archive Project'}
                      >
                        {tr.archived ? (
                          <ArchiveRestore className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-neutral-100 group-hover:text-amber-400 transition mb-1">
                    {tr.title}
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono mb-4">
                    {tr.artist} • {tr.bpm} BPM • {tr.key}
                  </p>

                  {/* Stems Mini Badges */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tr.stems.map((s) => (
                      <span
                        key={s.id}
                        className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-neutral-950 text-neutral-400 border border-neutral-850"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>v{tr.version || 1} • 24-bit 48kHz</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrack(tr);
                        onNavigate('beatlab');
                      }}
                      className="px-2.5 py-1.5 bg-neutral-800 group-hover:bg-amber-400 group-hover:text-neutral-950 text-neutral-200 text-xs font-bold rounded-lg transition flex items-center gap-1"
                      title="Open in Beat Lab & Piano Roll"
                    >
                      <Layers className="w-3 h-3" />
                      <span>BEAT LAB</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrack(tr);
                        onNavigate('mastering');
                      }}
                      className="px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 text-xs font-bold rounded-lg border border-neutral-800 transition flex items-center gap-1"
                      title="Open in Mastering Suite"
                    >
                      <Gauge className="w-3 h-3 text-cyan-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
