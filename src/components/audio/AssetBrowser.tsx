import React, { useState, useEffect } from 'react';
import { FileAudio, Loader2, AlertCircle, Play, Plus } from 'lucide-react';
import { getAuth } from 'firebase/auth';

interface AssetBrowserProps {
  projectId: string;
}

export const AssetBrowser: React.FC<AssetBrowserProps> = ({ projectId }) => {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;

    const fetchJobs = async () => {
      try {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const res = await fetch(`/api/projects/${projectId}/elevenlabs/jobs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok && isMounted) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (e) {
        // silently ignore fetch errors on poll
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [projectId]);

  const handleDragStart = (e: React.DragEvent, assetId: string, name: string) => {
    if (!assetId) return;
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'elevenlabs_asset',
        assetUrl: `/api/assets/${assetId}`,
        name,
      })
    );
  };

  return (
    <div className="flex flex-col h-[280px] bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden mt-4">
      <div className="p-3 border-b border-neutral-800 bg-neutral-950">
        <h3 className="text-xs font-bold text-neutral-300 uppercase">Generated Assets</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {jobs.length === 0 && (
          <div className="p-4 text-center text-xs text-neutral-500">No generated assets yet.</div>
        )}
        {jobs.map((job) => (
          <div
            key={job.id}
            draggable={job.status === 'ready'}
            onDragStart={(e) =>
              handleDragStart(
                e,
                job.asset_id,
                `${job.generation_type} - ${new Date(job.created_at).toLocaleTimeString()}`
              )
            }
            className={`p-3 rounded-lg border flex flex-col gap-2 transition ${job.status === 'ready' ? 'border-neutral-700 bg-neutral-800 cursor-grab hover:border-amber-500' : 'border-neutral-800 bg-neutral-900 opacity-70'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                {job.generation_type.replace('_', ' ')}
              </span>
              {job.status === 'ready' && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                  READY
                </span>
              )}
              {job.status === 'processing' ||
              job.status === 'queued' ||
              job.status === 'generating' ? (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> {job.status.toUpperCase()}
                </span>
              ) : null}
              {job.status === 'failed' && (
                <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono">
                  FAILED
                </span>
              )}
            </div>

            {job.prompt && (
              <p className="text-xs text-neutral-300 line-clamp-2 leading-snug">"{job.prompt}"</p>
            )}

            {job.status === 'ready' && (
              <div className="text-[10px] text-neutral-500 font-mono mt-1 flex items-center gap-1">
                <FileAudio className="w-3 h-3" />
                Drag to timeline
              </div>
            )}

            {job.error && (
              <div className="text-[10px] text-red-400 mt-1 flex items-start gap-1 bg-red-950/30 p-1.5 rounded">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span className="leading-tight">{job.error}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
