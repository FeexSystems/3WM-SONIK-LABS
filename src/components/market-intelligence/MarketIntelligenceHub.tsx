/**
 * 3WM SONIK — Market Intelligence Hub
 * Unified interface for trend dashboard, influencer discovery, and preset recommendations
 */

import { useState } from 'react';
import { TrendDashboard } from './TrendDashboard';
import { InfluencerDiscovery } from './InfluencerDiscovery';
import { PresetRecommendations } from './PresetRecommendations';

type Tab = 'trends' | 'influencers' | 'presets';

export function MarketIntelligenceHub() {
  const [activeTab, setActiveTab] = useState<Tab>('trends');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  return (
    <div className="market-intelligence-hub">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Market Intelligence</h1>
        <p className="text-zinc-400 text-sm">
          Real-time trends from TikTok and Spotify, influencer discovery, and preset recommendations
        </p>
      </div>

      {/* Genre Filter */}
      <div className="mb-6">
        <label className="block text-sm text-zinc-500 mb-2">Filter by Genre</label>
        <div className="flex gap-2">
          {['all', 'afrobeats', 'amapiano', 'afrodrill', 'highlife', 'afrofusion'].map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                selectedGenre === genre
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {genre === 'all' ? 'All Genres' : genre.charAt(0).toUpperCase() + genre.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 mb-6">
        <nav className="flex gap-6">
          {[
            { id: 'trends' as Tab, label: 'Trends' },
            { id: 'influencers' as Tab, label: 'Influencers' },
            { id: 'presets' as Tab, label: 'Presets' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-zinc-400'
                  : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'trends' && (
          <TrendDashboard genre={selectedGenre === 'all' ? undefined : selectedGenre} />
        )}
        {activeTab === 'influencers' && (
          <InfluencerDiscovery genre={selectedGenre === 'all' ? undefined : selectedGenre} />
        )}
        {activeTab === 'presets' && <PresetRecommendations />}
      </div>
    </div>
  );
}
