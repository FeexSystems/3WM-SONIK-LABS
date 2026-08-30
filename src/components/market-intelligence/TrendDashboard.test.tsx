/**
 * 3WM SONIK — Market Intelligence Tests
 * Tests for market intelligence components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TrendDashboard } from './TrendDashboard';

describe('TrendDashboard', () => {
  beforeEach(() => {
    // Mock fetch for market intelligence data
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            trends: [
              { id: 1, name: 'Amapiano', growth: 45, genre: 'House' },
              { id: 2, name: 'Afrobeats', growth: 38, genre: 'Afrofusion' },
              { id: 3, name: 'Gqom', growth: 22, genre: 'House' },
            ],
          }),
      })
    ) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render trend dashboard', () => {
    render(<TrendDashboard />);
    expect(screen.getByText('Market Trends')).toBeInTheDocument();
  });

  it('should display KPI cards', async () => {
    render(<TrendDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Total Trends/i)).toBeInTheDocument();
    });
  });

  it('should filter trends by genre', async () => {
    render(<TrendDashboard />);
    await waitFor(() => {
      const filterButton = screen.getByText('House');
      expect(filterButton).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    render(<TrendDashboard />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));
    render(<TrendDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });
  });
});

describe('InfluencerDiscovery', () => {
  it('should render influencer discovery interface', () => {
    const { InfluencerDiscovery } = require('./InfluencerDiscovery');
    render(<InfluencerDiscovery />);
    expect(screen.getByText('Influencer Discovery')).toBeInTheDocument();
  });

  it('should display influencer list', async () => {
    const { InfluencerDiscovery } = require('./InfluencerDiscovery');
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            influencers: [
              { id: 1, name: 'Artist A', followers: 100000, engagement: 5.2 },
              { id: 2, name: 'Artist B', followers: 50000, engagement: 4.8 },
            ],
          }),
      })
    ) as any;

    render(<InfluencerDiscovery />);
    await waitFor(() => {
      expect(screen.getByText('Artist A')).toBeInTheDocument();
    });
  });
});

describe('PresetRecommendations', () => {
  it('should render preset recommendations', () => {
    const { PresetRecommendations } = require('./PresetRecommendations');
    render(<PresetRecommendations />);
    expect(screen.getByText('Preset Recommendations')).toBeInTheDocument();
  });

  it('should display confidence scores', async () => {
    const { PresetRecommendations } = require('./PresetRecommendations');
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            presets: [
              { id: 1, name: 'Amapiano Warmth', confidence: 0.92 },
              { id: 2, name: 'Afrobeats Punch', confidence: 0.88 },
            ],
          }),
      })
    ) as any;

    render(<PresetRecommendations />);
    await waitFor(() => {
      expect(screen.getByText(/92%/i)).toBeInTheDocument();
    });
  });
});
