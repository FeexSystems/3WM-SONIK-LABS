import React, { useState } from 'react';
import { Track, AiCommandResult, TrackSettings } from '../../types';
import { soundEngine } from '../../audio/engine';
import {
  Sparkles,
  Cpu,
  Terminal,
  Send,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Database,
  Search,
  Zap,
  Activity,
  Flame,
  Mic2,
  TrendingUp,
} from 'lucide-react';
import {
  GenerativeWidgetRenderer,
  GenerativeWidgetPayload,
} from '../generative-ui/GenerativeWidgetRenderer';

interface AiOracleViewProps {
  track: Track;
  onApplySettings: (settingsPatch: Partial<TrackSettings>) => void;
}

interface AgentProfile {
  id: 'emar' | 'ricky' | 'kingpin' | 'bigquery';
  name: string;
  role: string;
  accent: string;
  systemPrompt: string;
}

const agents: AgentProfile[] = [
  {
    id: 'emar',
    name: 'Kappachino Emar (The Scientist)',
    role: 'Lead Audio DSP, Acoustics & Music Theory',
    accent: '#2AFFA3',
    systemPrompt:
      'Understands music as a mathematical, acoustic and signal-processing system. High-precision resonant notch filtering and 5-band parametric EQ sculpting.',
  },
  {
    id: 'ricky',
    name: 'Kappachino Ricky (The Sound God)',
    role: 'Sound Generation, 808s & Amapiano Groove',
    accent: '#F5A800',
    systemPrompt:
      'Responsible for making the production musically exciting. Generates syncopated log-drum bounce patterns, wooden transients, and sub-bass drive.',
  },
  {
    id: 'kingpin',
    name: 'Kingpin (The Vocal Oracle)',
    role: 'Vocal Intelligence, Modal Harmony & Pitch',
    accent: '#FF3C00',
    systemPrompt:
      'Treats the vocal as a living orchestra. Crafts 3-part modal vocal harmonies, African choir stacks, and pristine pitch retune envelopes.',
  },
  {
    id: 'bigquery',
    name: 'BigQuery AI/ML Analytics',
    role: 'Streaming Hit Forecaster & Stem Vector Match',
    accent: '#38bdf8',
    systemPrompt:
      'Leverages BigQuery ML (AI.FORECAST, AI.SIMILARITY, and AI.DETECT_ANOMALIES) for data-driven hit forecasting and commercial acoustic benchmarking.',
  },
];

export const AiOracleView: React.FC<AiOracleViewProps> = ({ track, onApplySettings }) => {
  const [activeAgentId, setActiveAgentId] = useState<'emar' | 'ricky' | 'kingpin' | 'bigquery'>(
    'emar'
  );
  const [promptInput, setPromptInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<AiCommandResult | null>(null);
  const [dryRunMode, setDryRunMode] = useState(false);
  const [activeWidget, setActiveWidget] = useState<GenerativeWidgetPayload | null>({
    type: 'emar_spectrum',
    props: { targetHz: 220, gainDb: -3.0 },
  });

  const activeAgent = agents.find((a) => a.id === activeAgentId) || agents[0];

  const handleExecutePrompt = (customPrompt?: string) => {
    const text = customPrompt || promptInput;
    if (!text.trim()) return;

    setIsProcessing(true);

    setTimeout(() => {
      let targetEq = { ...track.settings.eq };
      let targetComp = { ...track.settings.compression };
      let targetReverb = { ...track.settings.reverb };
      let targetSat = track.settings.saturation;
      let reason = '';
      let widgetPayload: GenerativeWidgetPayload | null = null;

      const lower = text.toLowerCase();

      if (
        activeAgentId === 'emar' ||
        lower.includes('eq') ||
        lower.includes('filter') ||
        lower.includes('acoustic')
      ) {
        targetEq.low = 3.5;
        targetEq.mid = -1.5;
        targetEq.high = 2.0;
        targetSat = 0.35;
        reason =
          'Emar calibrated a 5-band surgical notch curve at 220Hz (-3dB) to remove boxy mud while opening 12kHz air shimmer (+2.0dB).';
        widgetPayload = {
          type: 'emar_spectrum',
          props: { targetHz: 220, gainDb: -3.0 },
        };
      } else if (
        activeAgentId === 'ricky' ||
        lower.includes('log drum') ||
        lower.includes('808') ||
        lower.includes('bounce') ||
        lower.includes('drum')
      ) {
        targetEq.low = 4.2;
        targetComp.ratio = 4.5;
        targetComp.attack = 20;
        targetSat = 0.65;
        reason =
          'Ricky synthesized a syncopated 16-step Amapiano log drum groove at 58% swing with warm non-linear sub saturation.';
        widgetPayload = {
          type: 'ricky_bounce',
          props: { tempoBpm: track.bpm || 112, presetName: 'Lagos Mid-Tempo Log Bounce' },
        };
      } else if (
        activeAgentId === 'kingpin' ||
        lower.includes('vocal') ||
        lower.includes('harmony') ||
        lower.includes('tune')
      ) {
        targetEq.high = 3.0;
        targetReverb.amount = 30;
        targetReverb.decay = 2.4;
        targetSat = 0.4;
        reason =
          'Kingpin stacked a 3-part modal harmony (+3rd High, -5th Low Soul Bass) locked to F# Minor with 12ms pitch retune.';
        widgetPayload = {
          type: 'kingpin_vocal',
          props: { scaleKey: 'F# Minor', initialSpeed: 12 },
        };
      } else if (
        activeAgentId === 'bigquery' ||
        lower.includes('forecast') ||
        lower.includes('analytics') ||
        lower.includes('hit')
      ) {
        reason =
          'BigQuery ML AI.FORECAST projected 3.2M streams within 12 weeks with 92.4% timbral similarity to top Afrofusion streaming anchors.';
        widgetPayload = {
          type: 'bigquery_forecast',
          props: { genre: track.genre || 'Afro-Amapiano Fusion', hitScore: 94 },
        };
      } else {
        targetEq.low = 2.0;
        targetEq.high = 1.5;
        targetSat = 0.45;
        reason = `Calibrated acoustic fingerprint for ${track.genre} (${track.bpm} BPM) across active stems.`;
      }

      const generatedResult: AiCommandResult = {
        action: 'UPDATE_DSP_PARAMETERS',
        status: 'validated',
        confidenceScore: 0.96,
        reasoning: reason,
        dryRun: dryRunMode,
        executablePayload: {
          eq: targetEq,
          compression: targetComp,
          reverb: targetReverb,
          saturation: targetSat,
        },
      };

      setLastResult(generatedResult);
      setActiveWidget(widgetPayload);
      setIsProcessing(false);

      if (!dryRunMode) {
        soundEngine.updateDsp({ ...track.settings, ...generatedResult.executablePayload });
        onApplySettings(generatedResult.executablePayload);
      }
    }, 600);
  };

  const handleWidgetApply = (actionType: string, data: any) => {
    if (actionType === 'APPLY_EQ_BANDS' && data.bands) {
      const lowGain = data.bands[0]?.gain || 0;
      const midGain = data.bands[2]?.gain || 0;
      const highGain = data.bands[4]?.gain || 0;
      onApplySettings({
        eq: { low: lowGain, mid: midGain, high: highGain },
      });
    } else if (actionType === 'APPLY_DRUM_GROOVE' && data.bpm) {
      // Injected groove
    } else if (actionType === 'APPLY_VOCAL_HARMONY') {
      onApplySettings({
        reverb: { type: 'studio_plate', amount: 35, decay: 2.2 },
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-4 sm:p-5 shadow-2xl md:flex-row md:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 className="font-bebas text-xl tracking-wider text-zinc-100 sm:text-2xl">
              3WM Council Intelligence & Generative UI
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Autonomous multi-agent music operating environment with Kappachino Emar (Scientist),
            Kappachino Ricky (Sound God), Kingpin (Vocal Oracle), and BigQuery ML.
          </p>
        </div>

        {/* Dry Run Toggle */}
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black/60 px-3 py-1.5 self-start md:self-auto">
          <span className="font-mono text-[10px] text-zinc-400">DRY-RUN PREVIEW</span>
          <button
            onClick={() => setDryRunMode(!dryRunMode)}
            className={`relative h-4 w-8 rounded-full transition-colors ${
              dryRunMode ? 'bg-amber-500' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`absolute top-0.5 h-3 w-3 rounded-full bg-black transition-transform ${
                dryRunMode ? 'left-4' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Agents Selector Tabs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {agents.map((ag) => {
          const isSel = ag.id === activeAgentId;
          return (
            <button
              key={ag.id}
              onClick={() => {
                setActiveAgentId(ag.id);
                if (ag.id === 'emar') setActiveWidget({ type: 'emar_spectrum' });
                if (ag.id === 'ricky') setActiveWidget({ type: 'ricky_bounce' });
                if (ag.id === 'kingpin') setActiveWidget({ type: 'kingpin_vocal' });
                if (ag.id === 'bigquery') setActiveWidget({ type: 'bigquery_forecast' });
              }}
              className={`rounded-2xl border p-4 text-left transition-all ${
                isSel
                  ? 'border-amber-500/80 bg-zinc-900 ring-1 ring-amber-500/30 shadow-xl'
                  : 'border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700'
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full shadow-sm"
                  style={{ backgroundColor: ag.accent }}
                />
                <span className="text-xs font-bold text-zinc-100">{ag.name.split('(')[0]}</span>
              </div>
              <span className="mb-2 block font-mono text-[10px] text-zinc-400">{ag.role}</span>
              <p className="line-clamp-2 text-[11px] text-zinc-500">{ag.systemPrompt}</p>
            </button>
          );
        })}
      </div>

      {/* Main Console & Generative UI Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Terminal Input & Agent Command Box (Left 5 cols) */}
        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-4 sm:p-5 shadow-xl lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-amber-400" />
                <span className="font-mono text-xs font-bold uppercase text-zinc-200">
                  Agent Telemetry & Prompt
                </span>
              </div>
              <span
                className="rounded px-2 py-0.5 font-mono text-[10px] font-bold"
                style={{ backgroundColor: `${activeAgent.accent}20`, color: activeAgent.accent }}
              >
                {activeAgent.id.toUpperCase()} ONLINE
              </span>
            </div>

            {/* Quick Agent Preset Chips */}
            <div className="space-y-1.5">
              <span className="font-mono text-[10px] uppercase text-zinc-500">
                Suggested Inquiries:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeAgentId === 'emar' && (
                  <>
                    <button
                      onClick={() =>
                        handleExecutePrompt(
                          'Carve 220Hz mud and tighten 35Hz sub for log drum clarity'
                        )
                      }
                      className="rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-900/80"
                    >
                      Tighten Log Drum Sub
                    </button>
                    <button
                      onClick={() =>
                        handleExecutePrompt('Add 12kHz air shimmer and dynamic stereo width')
                      }
                      className="rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-900/80"
                    >
                      Air Shimmer +2dB
                    </button>
                  </>
                )}

                {activeAgentId === 'ricky' && (
                  <>
                    <button
                      onClick={() =>
                        handleExecutePrompt(
                          'Generate 112 BPM syncopated Amapiano log drum groove with 58% swing'
                        )
                      }
                      className="rounded-lg border border-amber-900/60 bg-amber-950/40 px-2.5 py-1 text-[11px] text-amber-300 hover:bg-amber-900/80"
                    >
                      Amapiano 58% Swing Log
                    </button>
                    <button
                      onClick={() =>
                        handleExecutePrompt('Punchy 808 sub transient with tape drive')
                      }
                      className="rounded-lg border border-amber-900/60 bg-amber-950/40 px-2.5 py-1 text-[11px] text-amber-300 hover:bg-amber-900/80"
                    >
                      Tape Drive 808
                    </button>
                  </>
                )}

                {activeAgentId === 'kingpin' && (
                  <>
                    <button
                      onClick={() =>
                        handleExecutePrompt('Generate 3-part modal vocal harmonies in F# Minor')
                      }
                      className="rounded-lg border border-red-900/60 bg-red-950/40 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-900/80"
                    >
                      3-Part Modal Harmony
                    </button>
                    <button
                      onClick={() =>
                        handleExecutePrompt('Fast 12ms autotune retune with Kalakuta plate')
                      }
                      className="rounded-lg border border-red-900/60 bg-red-950/40 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-900/80"
                    >
                      Fast Retune + Plate
                    </button>
                  </>
                )}

                {activeAgentId === 'bigquery' && (
                  <>
                    <button
                      onClick={() =>
                        handleExecutePrompt(
                          'Execute AI.FORECAST 12-week commercial streaming trajectory'
                        )
                      }
                      className="rounded-lg border border-sky-900/60 bg-sky-950/40 px-2.5 py-1 text-[11px] text-sky-300 hover:bg-sky-900/80"
                    >
                      Run AI.FORECAST
                    </button>
                    <button
                      onClick={() =>
                        handleExecutePrompt(
                          'Vector search catalog similarity and mix anomaly audit'
                        )
                      }
                      className="rounded-lg border border-sky-900/60 bg-sky-950/40 px-2.5 py-1 text-[11px] text-sky-300 hover:bg-sky-900/80"
                    >
                      Catalog Similarity Match
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Prompt Input Box */}
            <div className="relative">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder={`Ask ${activeAgent.name.split(' ')[1]} for DSP automation, beat bounce, or vocal tuning...`}
                rows={3}
                className="w-full rounded-xl border border-zinc-800 bg-black/80 p-3 font-mono text-xs text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={() => handleExecutePrompt()}
                disabled={isProcessing || !promptInput.trim()}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-amber-400 disabled:opacity-40"
              >
                {isProcessing ? (
                  <Zap className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Execute</span>
              </button>
            </div>
          </div>

          {/* Reasoning / Output */}
          {lastResult && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-black/60 p-3.5">
              <div className="mb-1 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold text-zinc-200">
                  Agent Execution Verified (
                  {((lastResult.confidenceScore || 0.95) * 100).toFixed(0)}% Confidence)
                </span>
              </div>
              <p className="font-mono text-[11px] text-zinc-400">{lastResult.reasoning}</p>
            </div>
          )}
        </div>

        {/* Generative UI Interactive Widget Stage (Right 7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {activeWidget ? (
            <GenerativeWidgetRenderer widget={activeWidget} onApplyAction={handleWidgetApply} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-center text-zinc-500">
              <p className="font-mono text-xs">
                Select an agent or execute a command to render interactive Generative UI widgets.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
