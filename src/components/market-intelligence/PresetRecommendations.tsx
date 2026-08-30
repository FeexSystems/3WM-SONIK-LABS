/**
 * 3WM SONIK — Trend-Based Preset Recommendations
 * Suggests audio presets based on current market trends
 */

import { useState, useEffect } from 'react';
import { marketIntelligenceService } from '@/services/marketIntelligenceService';

interface PresetRecommendation {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  key: string;
  confidence: number;
  trendMatch: string[];
  description: string;
}

export function PresetRecommendations() {
  const [recommendations, setRecommendations] = useState<PresetRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('all');

  useEffect(() => {
    loadRecommendations();
  }, [selectedGenre]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const trends = await marketIntelligenceService.fetchLiveTrends();
      const filtered =
        selectedGenre === 'all'
          ? trends
          : trends.filter((t) => t.genre?.toLowerCase() === selectedGenre.toLowerCase());

      const presets = generateRecommendations(filtered);
      setRecommendations(presets);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: PresetRecommendation) => {
    // Implement preset application to audio engine
    console.log('Applying preset:', preset);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading recommendations...</div>
      </div>
    );
  }

  return (
    <div className="preset-recommendations">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Preset Recommendations</h2>
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
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((preset) => (
          <PresetCard key={preset.id} preset={preset} onApply={() => applyPreset(preset)} />
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No recommendations available for the selected genre
        </div>
      )}
    </div>
  );
}

function PresetCard({ preset, onApply }: { preset: PresetRecommendation; onApply: () => void }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-medium">{preset.name}</h3>
          <div className="text-xs text-zinc-500">{preset.genre}</div>
        </div>
        <ConfidenceBadge confidence={preset.confidence} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <div className="text-zinc-500">BPM</div>
          <div className="text-white">{preset.bpm}</div>
        </div>
        <div>
          <div className="text-zinc-500">Key</div>
          <div className="text-white">{preset.key}</div>
        </div>
      </div>

      <div className="text-sm text-zinc-400 mb-3">{preset.description}</div>

      <div className="flex flex-wrap gap-1 mb-3">
        {preset.trendMatch.map((match, index) => (
          <span key={index} className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
            {match}
          </span>
        ))}
      </div>

      <button
        onClick={onApply}
        className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700 transition-colors"
      >
        Apply Preset
      </button>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const getColor = () => {
    if (confidence >= 80) return 'bg-green-900 text-green-400';
    if (confidence >= 60) return 'bg-yellow-900 text-yellow-400';
    return 'bg-zinc-800 text-zinc-400';
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${getColor()}`}>
      {confidence}% match
    </span>
  );
}

// Helper function to generate recommendations from trends
function generateRecommendations(trends: any[]): PresetRecommendation[] {
  if (trends.length === 0) return [];

  const genreGroups = new Map<string, any[]>();
  trends.forEach((trend) => {
    const genre = trend.genre || 'Afrofusion';
    if (!genreGroups.has(genre)) {
      genreGroups.set(genre, []);
    }
    genreGroups.get(genre)!.push(trend);
  });

  const recommendations: PresetRecommendation[] = [];

  genreGroups.forEach((genreTrends, genre) => {
    const bpms = genreTrends.map((t) => t.bpm).filter((b): b is number => b !== undefined);
    const keys = genreTrends.map((t) => t.key).filter((k): k is string => k !== undefined);

    if (bpms.length === 0 || keys.length === 0) return;

    const avgBpm = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);
    const topKey = getMostFrequent(keys);
    const confidence = Math.min(95, 70 + genreTrends.length * 2);

    const preset: PresetRecommendation = {
      id: `${genre.toLowerCase()}-${avgBpm}-${topKey}`,
      name: `${genre} Trend ${avgBpm} BPM`,
      genre,
      bpm: avgBpm,
      key: topKey,
      confidence,
      trendMatch: [`${avgBpm} BPM`, topKey, genreTrends.length > 5 ? 'High volume' : 'Rising'],
      description: `Based on ${genreTrends.length} trending tracks with ${avgBpm} BPM in ${topKey}`,
    };

    recommendations.push(preset);
  });

  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

function getMostFrequent(arr: string[]): string {
  const counts = new Map<string, number>();
  arr.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
}
