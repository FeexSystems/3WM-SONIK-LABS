/**
 * 3WM SONIK — Influencer Discovery Interface
 * Displays TikTok and Instagram influencers with filtering and sorting
 */

import { useState, useEffect } from 'react';
import { marketIntelligenceService } from '@/services/marketIntelligenceService';
import { InfluencerData } from '@/services/apify/actors/influencerScraper';

interface InfluencerDiscoveryProps {
  genre?: string;
}

export function InfluencerDiscovery({ genre }: InfluencerDiscoveryProps) {
  const [influencers, setInfluencers] = useState<InfluencerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState(genre || 'all');
  const [minFollowers, setMinFollowers] = useState(10000);
  const [minEngagement, setMinEngagement] = useState(2);
  const [sortBy, setSortBy] = useState<'followers' | 'engagement' | 'recent'>('followers');
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerData | null>(null);

  useEffect(() => {
    loadInfluencers();
  }, [selectedGenre, minFollowers, minEngagement, sortBy]);

  const loadInfluencers = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: InfluencerData[];

      if (selectedGenre === 'all') {
        data = await marketIntelligenceService.fetchInfluencers({
          minFollowers,
          minEngagementRate: minEngagement,
        });
      } else {
        data = await marketIntelligenceService.getTopInfluencersByGenre(selectedGenre, {
          minFollowers,
          minEngagementRate: minEngagement,
          limit: 100,
        });
      }

      // Sort data
      const sorted = [...data].sort((a, b) => {
        switch (sortBy) {
          case 'followers':
            return b.followers - a.followers;
          case 'engagement':
            return b.engagementRate - a.engagementRate;
          case 'recent':
            return (b.recentActivity || 0) - (a.recentActivity || 0);
          default:
            return 0;
        }
      });

      setInfluencers(sorted);
    } catch (err) {
      setError('Failed to load influencers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (influencer: InfluencerData) => {
    // Implement contact functionality
    console.log('Contact:', influencer);
  };

  const handleExport = () => {
    // Implement export functionality
    const csv = [
      ['Name', 'Platform', 'Followers', 'Engagement Rate', 'Genre'].join(','),
      ...influencers.map((i) =>
        [i.name, i.platform, i.followers, i.engagementRate.toFixed(2), i.genre].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'influencers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading influencers...</div>
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
    <div className="influencer-discovery">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Influencer Discovery</h2>
        <button
          onClick={handleExport}
          className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Genre</label>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
          >
            <option value="all">All Genres</option>
            <option value="afrobeats">Afrobeats</option>
            <option value="amapiano">Amapiano</option>
            <option value="afrodrill">Afrodrill</option>
            <option value="highlife">Highlife</option>
            <option value="afrofusion">Afrofusion</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Min Followers</label>
          <input
            type="number"
            value={minFollowers}
            onChange={(e) => setMinFollowers(Number(e.target.value))}
            className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Min Engagement %</label>
          <input
            type="number"
            step="0.1"
            value={minEngagement}
            onChange={(e) => setMinEngagement(Number(e.target.value))}
            className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
          >
            <option value="followers">Followers</option>
            <option value="engagement">Engagement Rate</option>
            <option value="recent">Recent Activity</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Influencers" value={influencers.length} color="text-zinc-400" />
        <KPICard
          label="Avg Followers"
          value={formatNumber(
            influencers.reduce((sum, i) => sum + i.followers, 0) / influencers.length
          )}
          color="text-zinc-400"
        />
        <KPICard
          label="Avg Engagement"
          value={`${(influencers.reduce((sum, i) => sum + i.engagementRate, 0) / influencers.length).toFixed(1)}%`}
          color="text-zinc-400"
        />
        <KPICard label="Top Platform" value={getTopPlatform(influencers)} color="text-zinc-400" />
      </div>

      {/* Influencer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {influencers.map((influencer, index) => (
          <InfluencerCard
            key={index}
            influencer={influencer}
            onSelect={() => setSelectedInfluencer(influencer)}
            onContact={() => handleContact(influencer)}
          />
        ))}
      </div>

      {/* Detail Modal */}
      {selectedInfluencer && (
        <InfluencerDetailModal
          influencer={selectedInfluencer}
          onClose={() => setSelectedInfluencer(null)}
          onContact={() => handleContact(selectedInfluencer)}
        />
      )}
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

function InfluencerCard({
  influencer,
  onSelect,
  onContact,
}: {
  influencer: InfluencerData;
  onSelect: () => void;
  onContact: () => void;
}) {
  return (
    <div
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-medium">{influencer.name}</h3>
          <div className="text-xs text-zinc-500">{influencer.platform}</div>
        </div>
        <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">
          {influencer.genre}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-zinc-500">Followers</div>
          <div className="text-white">{formatNumber(influencer.followers)}</div>
        </div>
        <div>
          <div className="text-zinc-500">Engagement</div>
          <div className="text-white">{influencer.engagementRate.toFixed(1)}%</div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onContact();
        }}
        className="mt-3 w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700 transition-colors"
      >
        Contact
      </button>
    </div>
  );
}

function InfluencerDetailModal({
  influencer,
  onClose,
  onContact,
}: {
  influencer: InfluencerData;
  onClose: () => void;
  onContact: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">{influencer.name}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-zinc-500">Platform</div>
            <div className="text-white">{influencer.platform}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">Genre</div>
            <div className="text-white">{influencer.genre}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">Followers</div>
            <div className="text-white">{formatNumber(influencer.followers)}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">Engagement Rate</div>
            <div className="text-white">{influencer.engagementRate.toFixed(2)}%</div>
          </div>
          {influencer.bio && (
            <div>
              <div className="text-sm text-zinc-500">Bio</div>
              <div className="text-white text-sm">{influencer.bio}</div>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onContact}
            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white hover:bg-zinc-700 transition-colors"
          >
            Contact
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getTopPlatform(influencers: InfluencerData[]): string {
  const counts = new Map<string, number>();
  influencers.forEach((i) => counts.set(i.platform, (counts.get(i.platform) || 0) + 1));
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : 'N/A';
}
