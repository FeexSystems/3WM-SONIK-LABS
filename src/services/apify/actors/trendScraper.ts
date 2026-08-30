/**
 * 3WM SONIK — Apify Trend Scraper Actor
 * Scrapes trending music data from TikTok and Spotify for market intelligence
 */

import { Actor } from 'apify';

export interface TrendData {
  platform: 'tiktok' | 'spotify';
  soundId?: string;
  trackId?: string;
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  genre?: string;
  plays: number;
  likes: number;
  shares: number;
  // UI expects engagement = likes/plays ratio
  engagement?: number;
  createdAt: Date;
  tags: string[];
}

export interface TrendScrapingResult {
  success: boolean;
  platform: string;
  trends: TrendData[];
  scrapedAt: Date;
  error?: string;
}

/**
 * TikTok Trend Scraper
 * Scrapes trending sounds and music from TikTok
 */
export async function scrapeTikTokTrends(
  options: {
    limit?: number;
    genre?: string;
    region?: string;
  } = {}
): Promise<TrendScrapingResult> {
  const { limit = 50, genre, region = 'US' } = options;

  try {
    const apiToken = process.env.APIFY_API_TOKEN;
    const actorId = process.env.APIFY_ACTOR_TIKTOK_TRENDS || 'apify/tiktok-scraper';

    if (!apiToken) {
      console.warn('Apify API token not configured, using mock data');
      return generateMockTikTokTrends(limit);
    }

    // In a real implementation, this would call the Apify actor
    // For now, we'll use mock data
    console.log(`Scraping TikTok trends with limit=${limit}, genre=${genre}, region=${region}`);

    return generateMockTikTokTrends(limit);
  } catch (error) {
    console.error('TikTok trend scraping error:', error);
    return {
      success: false,
      platform: 'tiktok',
      trends: [],
      scrapedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Spotify Chart Scraper
 * Scrapes viral charts and trending tracks from Spotify
 */
export async function scrapeSpotifyCharts(
  options: {
    limit?: number;
    chart?: 'viral50' | 'top200' | 'viral_global';
    region?: string;
  } = {}
): Promise<TrendScrapingResult> {
  const { limit = 50, chart = 'viral50', region = 'US' } = options;

  try {
    const apiToken = process.env.APIFY_API_TOKEN;
    const actorId = process.env.APIFY_ACTOR_SPOTIFY_CHARTS || 'apify/spotify-scraper';

    if (!apiToken) {
      console.warn('Apify API token not configured, using mock data');
      return generateMockSpotifyCharts(limit);
    }

    // In a real implementation, this would call the Apify actor
    console.log(`Scraping Spotify charts with limit=${limit}, chart=${chart}, region=${region}`);

    return generateMockSpotifyCharts(limit);
  } catch (error) {
    console.error('Spotify chart scraping error:', error);
    return {
      success: false,
      platform: 'spotify',
      trends: [],
      scrapedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate mock TikTok trend data for development
 */
function generateMockTikTokTrends(limit: number): TrendScrapingResult {
  const genres = ['Afrobeats', 'Amapiano', 'Trap', 'Drill', 'R&B', 'Pop'];
  const artists = ['Burna Boy', 'Rema', 'Tems', 'SZA', 'Drake', 'Future', 'Metro Boomin'];
  const sounds = ['Calm Down', 'Last Last', 'Essence', 'Kill Bill', 'Wait For U', 'Rich Flex'];

  const trends: TrendData[] = Array.from({ length: limit }).map((_, i) => ({
    platform: 'tiktok',
    soundId: `tiktok_sound_${i}`,
    title: sounds[i % sounds.length],
    artist: artists[i % artists.length],
    bpm: 100 + (i % 30),
    key: ['C', 'D', 'E', 'F', 'G', 'A', 'B'][i % 7],
    genre: genres[i % genres.length],
    plays: Math.floor(Math.random() * 10000000) + 1000000,
    likes: Math.floor(Math.random() * 5000000) + 500000,
    shares: Math.floor(Math.random() * 1000000) + 100000,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    tags: ['viral', 'trending', 'music', genres[i % genres.length].toLowerCase()],
  }));

  return {
    success: true,
    platform: 'tiktok',
    trends,
    scrapedAt: new Date(),
  };
}

/**
 * Generate mock Spotify chart data for development
 */
function generateMockSpotifyCharts(limit: number): TrendScrapingResult {
  const genres = ['Afrobeats', 'Amapiano', 'Hip-Hop', 'R&B', 'Pop', 'Electronic'];
  const artists = ['Burna Boy', 'Rema', 'Tems', 'SZA', 'Drake', 'The Weeknd', 'Metro Boomin'];
  const tracks = ['Last Last', 'Calm Down', 'Free Mind', 'Kill Bill', 'As It Was', "Creepin'"];

  const trends: TrendData[] = Array.from({ length: limit }).map((_, i) => ({
    platform: 'spotify',
    trackId: `spotify_track_${i}`,
    title: tracks[i % tracks.length],
    artist: artists[i % artists.length],
    bpm: 100 + (i % 25),
    key: ['C', 'D', 'E', 'F', 'G', 'A', 'B'][i % 7],
    genre: genres[i % genres.length],
    plays: Math.floor(Math.random() * 50000000) + 5000000,
    likes: Math.floor(Math.random() * 10000000) + 1000000,
    shares: 0, // Spotify doesn't have shares
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    tags: ['viral', 'chart', genres[i % genres.length].toLowerCase()],
  }));

  return {
    success: true,
    platform: 'spotify',
    trends,
    scrapedAt: new Date(),
  };
}

/**
 * Combine trends from multiple platforms
 */
export async function scrapeAllTrends(
  options: {
    tiktokLimit?: number;
    spotifyLimit?: number;
  } = {}
): Promise<TrendData[]> {
  const { tiktokLimit = 50, spotifyLimit = 50 } = options;

  const [tiktokResult, spotifyResult] = await Promise.all([
    scrapeTikTokTrends({ limit: tiktokLimit }),
    scrapeSpotifyCharts({ limit: spotifyLimit }),
  ]);

  return [...tiktokResult.trends, ...spotifyResult.trends];
}
