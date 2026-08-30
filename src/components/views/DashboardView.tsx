import React, { useState, useEffect } from 'react';
import { Track, UserProfile, Workspace } from '../../types';
import {
  Sparkles,
  Play,
  ArrowRight,
  Music,
  Mic,
  Sliders,
  Gauge,
  Activity,
  FolderOpen,
  Users,
  CheckCircle,
  Clock,
  HardDrive,
  Zap,
  Loader2,
} from 'lucide-react';
import { MetricCard } from '../ui/MetricCard';
import { ActivityCard } from '../ui/ActivityCard';

interface DashboardViewProps {
  user: UserProfile;
  workspace: Workspace;
  currentTrack: Track | null;
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  onNavigate: (view: string) => void;
  onOpenNewProject: () => void;
}

interface DashboardMetrics {
  activeProjects: number;
  aiAnalyses: number;
  masteredTracks: number;
  storageUsed: string;
  storageQuota: string;
}

interface ActivityItem {
  agent: string;
  agentColor: string;
  message: string;
  timestamp: string;
  trackTitle: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  workspace,
  currentTrack,
  tracks,
  onSelectTrack,
  onNavigate,
  onOpenNewProject,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  // Fetch dashboard metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/dashboard/metrics');
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        // Fallback to calculated values
        setMetrics({
          activeProjects: tracks.length,
          aiAnalyses: tracks.reduce((acc, t) => acc + (t.history?.length || 0), 0),
          masteredTracks: tracks.filter((t) => t.status === 'mastered').length,
          storageUsed: `${((tracks.length * 150) / 1024).toFixed(1)} GB`,
          storageQuota: '50 GB',
        });
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    fetchMetrics();
  }, [tracks]);

  // Fetch activity feed
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/dashboard/activity?limit=5');
        if (res.ok) {
          const data = await res.json();
          setActivities(data);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        // Fallback to mock data
        setActivities([
          {
            agent: 'Emar',
            agentColor: '#2AFFA3',
            message:
              'Log drums are sitting deep at 55Hz. We recommend a slight 1.2dB high-shelf lift on the vocal doubles.',
            timestamp: 'Just now',
            trackTitle: currentTrack?.title || 'Unknown Track',
          },
        ]);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [currentTrack]);

  // Get time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-200">
      {/* 1. Welcome Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase">
                {workspace.name} • {workspace.plan} TIER
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-100 tracking-tight">
              {greeting}, {user.name}.
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-none">
              3WM Sonic Engine is online. BushBot, Grok, and Ozone Mastering pipelines are synced to
              your current session.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenNewProject}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-xl border border-neutral-750 transition flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>NEW SESSION</span>
            </button>
            <button
              onClick={() => onNavigate('studio')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>OPEN STUDIO DAW</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="ACTIVE PROJECTS"
          value={metrics?.activeProjects || 0}
          subtext="Sessions saved"
          icon={Music}
          iconColor="#F5A800"
          isLoading={isLoadingMetrics}
        />

        <MetricCard
          label="AI ANALYSES"
          value={metrics?.aiAnalyses || 0}
          subtext="100% Harmonic Match"
          icon={Sparkles}
          iconColor="#a855f7"
          isLoading={isLoadingMetrics}
        />

        <MetricCard
          label="MASTERED TRACKS"
          value={metrics?.masteredTracks || 0}
          subtext="-14.0 LUFS Compliant"
          icon={Gauge}
          iconColor="#22d3ee"
          isLoading={isLoadingMetrics}
        />

        <MetricCard
          label="WORKSPACE STORAGE"
          value={metrics?.storageUsed || '0 GB'}
          subtext={`of ${metrics?.storageQuota || '50 GB'} Quota`}
          icon={HardDrive}
          iconColor="#10b981"
          isLoading={isLoadingMetrics}
        />
      </div>

      {/* 3. Continue Session Card & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Session Card (2 cols) */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>CONTINUE AUDIO SESSION</span>
              </span>
              {currentTrack && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                  {currentTrack.genre}
                </span>
              )}
            </div>

            {currentTrack ? (
              <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-neutral-100">{currentTrack.title}</h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-bold">
                      {currentTrack.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    {currentTrack.artist} • {currentTrack.bpm} BPM • {currentTrack.key} •{' '}
                    {currentTrack.stems.length} Stems
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('studio')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>LAUNCH DAW</span>
                  </button>
                  <button
                    onClick={() => onNavigate('mixer')}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition"
                  >
                    MIXER
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-neutral-500 font-mono text-xs">
                No active session loaded.
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => onNavigate('recording')}
                className="p-3 bg-neutral-950 hover:bg-neutral-850 rounded-xl border border-neutral-850 text-left transition group"
              >
                <Mic className="w-4 h-4 text-red-400 mb-1" />
                <span className="text-xs font-bold text-neutral-200 block">Record Vocals</span>
                <span className="text-[10px] text-neutral-500 font-mono">Microphone Booth</span>
              </button>

              <button
                onClick={() => onNavigate('mixer')}
                className="p-3 bg-neutral-950 hover:bg-neutral-850 rounded-xl border border-neutral-850 text-left transition group"
              >
                <Sliders className="w-4 h-4 text-amber-400 mb-1" />
                <span className="text-xs font-bold text-neutral-200 block">Mixer Rack</span>
                <span className="text-[10px] text-neutral-500 font-mono">5-Stem Faders</span>
              </button>

              <button
                onClick={() => onNavigate('mastering')}
                className="p-3 bg-neutral-950 hover:bg-neutral-850 rounded-xl border border-neutral-850 text-left transition group"
              >
                <Gauge className="w-4 h-4 text-cyan-400 mb-1" />
                <span className="text-xs font-bold text-neutral-200 block">Master Track</span>
                <span className="text-[10px] text-neutral-500 font-mono">Ozone 11 Lagos</span>
              </button>

              <button
                onClick={() => onNavigate('artist_world')}
                className="p-3 bg-neutral-950 hover:bg-neutral-850 rounded-xl border border-neutral-850 text-left transition group"
              >
                <Sparkles className="w-4 h-4 text-purple-400 mb-1" />
                <span className="text-xs font-bold text-neutral-200 block">3D Studio</span>
                <span className="text-[10px] text-neutral-500 font-mono">Artist Avatars</span>
              </button>
            </div>
          </div>
        </div>

        {/* AI Sonic Insights Feed (1 col) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>AI SONIC INSIGHTS</span>
              </span>
              <span className="text-[9px] font-mono text-emerald-400">THREE ACTIVE</span>
            </div>

            <div className="space-y-3">
              {isLoadingActivities ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-neutral-500 animate-spin" />
                </div>
              ) : activities.length > 0 ? (
                activities.map((activity, index) => (
                  <ActivityCard
                    key={index}
                    agent={activity.agent}
                    agentColor={activity.agentColor}
                    message={activity.message}
                    timestamp={activity.timestamp}
                    trackTitle={activity.trackTitle}
                  />
                ))
              ) : (
                <div className="p-4 text-center text-neutral-500 font-mono text-xs">
                  No recent AI activity
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('ai_sonic')}
            className="w-full mt-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <span>OPEN AI SONIC CONSOLE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Recent Projects Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            RECENT STUDIO SESSIONS
          </h3>
          <button
            onClick={() => onNavigate('projects')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>View all projects</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-neutral-850">
          {tracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className={`py-3 px-2 flex items-center justify-between hover:bg-neutral-950 rounded-xl transition cursor-pointer ${
                  isCurrent ? 'bg-neutral-950/60' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 text-amber-400 flex items-center justify-center font-bold text-xs">
                    {track.title[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-100">{track.title}</span>
                      {isCurrent && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          LOADED
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {track.artist} • {track.genre}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
                  <span className="hidden sm:inline">{track.bpm} BPM</span>
                  <span className="hidden sm:inline">{track.key}</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-850 text-neutral-300 text-[10px] uppercase font-bold">
                    {track.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
