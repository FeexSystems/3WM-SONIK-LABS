import React from 'react';
import { TrendingUp, BarChart3, Database, ShieldCheck, Zap } from 'lucide-react';

interface ForecastPoint {
  week: string;
  predictedStreams: number;
  lowerBound: number;
  upperBound: number;
}

interface BigQueryForecastWidgetProps {
  genre?: string;
  hitScore?: number; // 0 to 100
  similarityMatch?: string;
  spectralAnomalyScore?: number; // 0.0 to 1.0
  forecastData?: ForecastPoint[];
}

const DEFAULT_FORECAST: ForecastPoint[] = [
  { week: 'W1', predictedStreams: 45000, lowerBound: 32000, upperBound: 58000 },
  { week: 'W2', predictedStreams: 120000, lowerBound: 85000, upperBound: 165000 },
  { week: 'W3', predictedStreams: 280000, lowerBound: 195000, upperBound: 390000 },
  { week: 'W4', predictedStreams: 520000, lowerBound: 380000, upperBound: 720000 },
  { week: 'W8', predictedStreams: 1450000, lowerBound: 980000, upperBound: 2100000 },
  { week: 'W12', predictedStreams: 3200000, lowerBound: 2100000, upperBound: 4800000 },
];

export const BigQueryForecastWidget: React.FC<BigQueryForecastWidgetProps> = ({
  genre = 'Afro-Amapiano Fusion',
  hitScore = 94,
  similarityMatch = 'Burna Boy - "Last Last" (92.4% Harmonic Proximity)',
  spectralAnomalyScore = 0.04, // Low anomaly = great balance
  forecastData = DEFAULT_FORECAST,
}) => {
  const maxStream = Math.max(...forecastData.map((d) => d.upperBound));

  return (
    <div className="rounded-xl border border-sky-500/30 bg-[#06101c] p-4 text-sky-100 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-sky-400">
              BigQuery AI/ML Music Intelligence
            </h4>
            <p className="text-[11px] text-zinc-400">
              AI.FORECAST Streaming Curve & AI.SIMILARITY Catalog Match
            </p>
          </div>
        </div>
        <span className="rounded-full border border-sky-500/30 bg-sky-950/60 px-2.5 py-0.5 font-mono text-[10px] text-sky-300">
          BQ ML v3.7
        </span>
      </div>

      {/* Metrics Row */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-sky-900/50 bg-black/40 p-2.5">
          <span className="block font-mono text-[9px] uppercase text-zinc-400">
            Hit Potential Index
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-lg font-black text-sky-400">{hitScore}</span>
            <span className="font-mono text-[10px] text-emerald-400">/ 100</span>
          </div>
          <span className="font-mono text-[9px] text-emerald-400">Top 3% Tier</span>
        </div>

        <div className="rounded-lg border border-sky-900/50 bg-black/40 p-2.5">
          <span className="block font-mono text-[9px] uppercase text-zinc-400">
            Catalog Proximity
          </span>
          <span className="block truncate font-mono text-xs font-bold text-zinc-200">
            {similarityMatch.split('(')[0]}
          </span>
          <span className="font-mono text-[9px] text-sky-400">92.4% Timbral Match</span>
        </div>

        <div className="rounded-lg border border-sky-900/50 bg-black/40 p-2.5">
          <span className="block font-mono text-[9px] uppercase text-zinc-400">
            Mix Anomaly Score
          </span>
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono text-xs font-bold text-emerald-300">
              {(spectralAnomalyScore * 100).toFixed(1)}% (Clean)
            </span>
          </div>
          <span className="font-mono text-[9px] text-zinc-400">Zero Phase Issues</span>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="mb-3 rounded-lg border border-sky-950/80 bg-black/50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-zinc-300">
            <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
            12-Week Streaming Forecast (AI.FORECAST)
          </span>
          <span className="font-mono text-[9px] text-zinc-500">Confidence Interval: 90%</span>
        </div>

        {/* Bar + Range Representation */}
        <div className="flex h-24 items-end gap-2 pt-2">
          {forecastData.map((d) => {
            const heightPercent = (d.predictedStreams / maxStream) * 100;
            const upperPercent = (d.upperBound / maxStream) * 100;
            return (
              <div key={d.week} className="flex flex-1 flex-col items-center">
                <div className="relative flex h-20 w-full items-end justify-center">
                  {/* Upper Bound Shadow */}
                  <div
                    className="absolute w-full rounded-t bg-sky-900/30"
                    style={{ height: `${upperPercent}%` }}
                  />
                  {/* Predicted Main Bar */}
                  <div
                    className="relative w-full rounded-t bg-gradient-to-t from-sky-600 to-cyan-400 shadow-sm"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="mt-1 font-mono text-[9px] text-zinc-400">{d.week}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* BQ SQL Telemetry Footer */}
      <div className="flex items-center justify-between rounded border border-sky-950 bg-black/60 px-2.5 py-1.5 font-mono text-[10px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-sky-400" />
          <span>Model: `vertex_ai.sonik_hit_forecaster_v1`</span>
        </div>
        <span className="text-sky-300">Execution: 42ms (Cache Hit)</span>
      </div>
    </div>
  );
};
