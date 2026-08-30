/**
 * 3WM SONIK — Market Intelligence Trend Dashboard
 * Displays real-time trend data from TikTok and Spotify
 * Follows building-data-apps skill guidelines for React + Vite
 */

import { useState, useEffect } from 'react';
import { marketIntelligenceService } from '@/services/marketIntelligenceService';
import { TrendData } from '@/services/apify/actors/trendScraper';

interface TrendDashboardProps {
  genre?: string;
}

export function TrendDashboard({ genre }: TrendDashboardProps) {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState(genre || 'all');

  useEffect(() => {
    loadTrends();
  }, [selectedGenre]);

  const loadTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketIntelligenceService.fetchLiveTrends({ forceRefresh: false });
      const filtered =
        selectedGenre === 'all'
          ? data
          : data.filter((t) => t.genre?.toLowerCase() === selectedGenre.toLowerCase());
      setTrends(filtered);
    } catch (err) {
      setError('Failed to load trends');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadTrends();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading trends...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="trend-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Market Trends</h2>
        <div className="flex gap-2">
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
          >
            <option value="all">All Genres</option>
            <option value="afrobeats">Afrobeats</option>
            <option value="amapiano">Amapiano</option>
            <option value="afrodrill">Afrodrill</option>
            <option value="highlife">Highlife</option>
            <option value="afrofusion">Afrofusion</option>
          </select>
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Trends" value={trends.length} color="text-zinc-400" />
        <KPICard label="Avg BPM" value={calculateAverageBPM(trends)} color="text-zinc-400" />
        <KPICard label="Top Key" value={getTopKey(trends)} color="text-zinc-400" />
        <KPICard label="Viral Score" value={calculateViralScore(trends)} color="text-zinc-400" />
      </div>

      {/* Trends Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <TableHeader label="Track" />
              <TableHeader label="Genre" />
              <TableHeader label="BPM" />
              <TableHeader label="Key" />
              <TableHeader label="Platform" />
              <TableHeader label="Engagement" />
            </tr>
          </thead>
          <tbody>
            {trends.map((trend, index) => (
              <tr
                key={index}
                className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
              >
                <TableCell value={trend.title || 'Unknown'} />
                <TableCell value={trend.genre || 'Unknown'} />
                <TableCell value={trend.bpm ? `${trend.bpm} BPM` : 'N/A'} />
                <TableCell value={trend.key || 'N/A'} />
                <TableCell value={trend.platform || 'Unknown'} />
                <TableCell value={trend.engagement ? `${trend.engagement.toFixed(1)}%` : 'N/A'} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="text-sm text-zinc-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function TableHeader({ label }: { label: string }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
      {label}
    </th>
  );
}

function TableCell({ value }: { value: string }) {
  return <td className="px-4 py-3 text-sm text-white">{value}</td>;
}

// Helper functions
function calculateAverageBPM(trends: TrendData[]): string {
  const bpms = trends.map((t) => t.bpm).filter((b): b is number => b !== undefined);
  if (bpms.length === 0) return 'N/A';
  const avg = bpms.reduce((a, b) => a + b, 0) / bpms.length;
  return `${Math.round(avg)} BPM`;
}

function getTopKey(trends: TrendData[]): string {
  const keys = trends.map((t) => t.key).filter((k): k is string => k !== undefined);
  if (keys.length === 0) return 'N/A';
  const counts = new Map<string, number>();
  keys.forEach((k) => counts.set(k, (counts.get(k) || 0) + 1));
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : 'N/A';
}

function calculateViralScore(trends: TrendData[]): string {
  if (trends.length === 0) return 'N/A';
  const avgEngagement = trends.reduce((sum, t) => sum + (t.engagement || 0), 0) / trends.length;
  return `${avgEngagement.toFixed(1)}%`;
}
