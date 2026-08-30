/**
 * 3WM SONIK — Job Queue Monitor Component
 * Displays real-time status of background jobs processed by QStash
 */

import React, { useState, useEffect } from 'react';
import { qstashService, JobStatus, JobType } from '../../services/qstashService';
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Trash2,
  Filter,
} from 'lucide-react';

export const JobQueueMonitor: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshData = () => {
    const allJobs = Array.from((qstashService as any).jobCache?.values() || []);
    setJobs(allJobs);
    setStats(qstashService.getStatistics());
  };

  useEffect(() => {
    refreshData();

    if (autoRefresh) {
      const interval = setInterval(refreshData, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const filteredJobs = jobs.filter((job) => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PENDING:
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case JobStatus.PROCESSING:
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case JobStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case JobStatus.FAILED:
        return <XCircle className="w-4 h-4 text-red-400" />;
      case JobStatus.RETRYING:
        return <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" />;
      default:
        return <Activity className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PENDING:
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300';
      case JobStatus.PROCESSING:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
      case JobStatus.COMPLETED:
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
      case JobStatus.FAILED:
        return 'bg-red-500/10 border-red-500/30 text-red-300';
      case JobStatus.RETRYING:
        return 'bg-orange-500/10 border-orange-500/30 text-orange-300';
      default:
        return 'bg-neutral-500/10 border-neutral-500/30 text-neutral-300';
    }
  };

  const getJobTypeLabel = (type: JobType) => {
    switch (type) {
      case JobType.STEM_SEPARATION:
        return 'Stem Separation';
      case JobType.NEURAL_DSP_RENDER:
        return 'Neural DSP';
      case JobType.AI_VIDEO_GENERATION:
        return 'AI Video';
      case JobType.BATCH_AUDIO_EXPORT:
        return 'Batch Export';
      default:
        return 'Unknown';
    }
  };

  const handleCancelJob = async (jobId: string) => {
    const success = await qstashService.cancelJob(jobId);
    if (success) {
      refreshData();
    }
  };

  const handleClearOldJobs = () => {
    qstashService.clearOldJobs(24);
    refreshData();
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Job Queue Monitor</h3>
            <p className="text-xs text-neutral-400">Background processing status</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              autoRefresh
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
            }`}
          >
            Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={refreshData}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-[10px] text-neutral-400 font-mono">TOTAL</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-yellow-300">{stats.pending}</div>
            <div className="text-[10px] text-neutral-400 font-mono">PENDING</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-300">{stats.processing}</div>
            <div className="text-[10px] text-neutral-400 font-mono">PROCESSING</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-300">{stats.completed}</div>
            <div className="text-[10px] text-neutral-400 font-mono">COMPLETED</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-300">{stats.failed}</div>
            <div className="text-[10px] text-neutral-400 font-mono">FAILED</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-neutral-400" />
        <div className="flex gap-1">
          {(
            [
              'all',
              JobStatus.PENDING,
              JobStatus.PROCESSING,
              JobStatus.COMPLETED,
              JobStatus.FAILED,
            ] as const
          ).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                filter === status
                  ? 'bg-amber-400 text-black'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <button
          onClick={handleClearOldJobs}
          className="ml-auto p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Clear jobs older than 24 hours"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Job List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-sm">No jobs found</div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.jobId} className={`p-3 rounded-xl border ${getStatusColor(job.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="text-xs font-bold">{getJobTypeLabel(job.result?.type)}</div>
                    <div className="text-[10px] font-mono opacity-70">{job.jobId}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono">
                    {job.completedAt
                      ? new Date(job.completedAt).toLocaleTimeString()
                      : job.startedAt
                        ? `${Math.round((Date.now() - job.startedAt) / 1000)}s`
                        : '-'}
                  </div>
                  {job.status === JobStatus.PENDING && (
                    <button
                      onClick={() => handleCancelJob(job.jobId)}
                      className="text-[10px] text-red-300 hover:text-red-200 mt-1"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              {job.error && (
                <div className="mt-2 text-[10px] text-red-300 font-mono bg-red-950/30 rounded p-1">
                  {job.error}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
