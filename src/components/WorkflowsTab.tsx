import React, { useState, useEffect } from 'react';
import { N8nWorkflow, VectorEmbeddingItem } from '../types';
import {
  RefreshCw,
  Play,
  CheckCircle,
  Database,
  Radio,
  Disc,
  ArrowRight,
  Activity,
} from 'lucide-react';

export const WorkflowsTab: React.FC = () => {
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [vectors, setVectors] = useState<VectorEmbeddingItem[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [activeVector, setActiveVector] = useState<string>('vec-2');

  useEffect(() => {
    fetch('/api/n8n/workflows')
      .then((res) => res.json())
      .then((data) => setWorkflows(data))
      .catch(console.error);

    fetch('/api/vector-memory')
      .then((res) => res.json())
      .then((data) => setVectors(data))
      .catch(console.error);
  }, []);

  const handleTriggerWorkflow = async (id: string) => {
    setRunningId(id);
    try {
      const res = await fetch(`/api/n8n/workflows/${id}/trigger`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setWorkflows((prev) =>
          prev.map((w) =>
            w.id === id ? { ...w, status: 'success', lastRun: new Date().toISOString() } : w
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-neutral-100 uppercase tracking-tight">
              n8n Autonomous Audio Pipelines & Distribution Hub
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Trigger background rendering workflows, Boomplay & Audiomack exports, and explore
            Afrofusion vector memory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            n8n Daemon Active
          </span>
        </div>
      </div>

      {/* n8n Workflows Section */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
          Automated Production & Sync Flows
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workflows.map((wf) => {
            const isExecuting = runningId === wf.id;
            return (
              <div
                key={wf.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                      ID: {wf.id}
                    </span>
                    {wf.status === 'success' && (
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> SUCCESS
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-neutral-100 mb-1">{wf.name}</h4>
                  <p className="text-xs text-neutral-400 mb-4 leading-relaxed">{wf.description}</p>

                  <div className="space-y-1.5 border-t border-neutral-850 pt-3">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                      Pipeline Stages:
                    </span>
                    {wf.steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-neutral-300">
                        <span className="w-4 h-4 rounded-full bg-neutral-950 border border-neutral-800 text-[10px] font-mono flex items-center justify-center text-amber-400">
                          {idx + 1}
                        </span>
                        <span className="truncate">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800">
                  <button
                    onClick={() => handleTriggerWorkflow(wf.id)}
                    disabled={isExecuting}
                    className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>RUNNING STAGES...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-amber-400" />
                        <span>TRIGGER WORKFLOW</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vector Memory Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
              Afrofusion Vector Memory & Acoustic Fingerprints
            </h3>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            Dimensional Space: 8D Acoustic Latent Vectors
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {vectors.map((vec) => {
            const isSelected = activeVector === vec.id;
            return (
              <div
                key={vec.id}
                onClick={() => setActiveVector(vec.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-neutral-950 border-amber-500 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-neutral-100">{vec.style}</span>
                  <span className="text-[10px] font-mono text-amber-400">{vec.era}</span>
                </div>

                {/* 8D Vector Visualizer Bar */}
                <div className="my-3 flex items-end gap-1.5 h-12 bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                  {vec.acousticVector.map((val, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-amber-500 rounded-t transition-all duration-300"
                      style={{ height: `${val * 100}%` }}
                      title={`Dim ${idx + 1}: ${val}`}
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-neutral-500 font-mono block">
                      SIGNATURE TRAITS:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {vec.signatureTraits.map((trait, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-neutral-900 text-neutral-300 px-2 py-0.5 rounded border border-neutral-800"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-500 font-mono block">
                      REFERENCE CANON:
                    </span>
                    <span className="text-xs text-neutral-400 italic">
                      {vec.referenceTracks.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
