/**
 * 3WM SONIK — Market Intelligence & Sound Trends Engine (Pillar 7: Market Intelligence & Growth)
 * Tracks trending BPMs, scale modes, chord progressions, viral drum patterns, and sound styles
 * across African, Hip-Hop, and Global Diaspora genres.
 */

import {
  scrapeTikTokTrends,
  scrapeSpotifyCharts,
  scrapeAllTrends,
  TrendData,
} from './apify/actors/trendScraper';
import {
  scrapeTikTokInfluencers,
  scrapeInstagramInfluencers,
  InfluencerData,
} from './apify/actors/influencerScraper';

export interface GenreTrendData {
  genre: 'Afrobeats' | 'Amapiano' | 'Afrodrill' | 'Highlife' | 'Afrofusion' | 'R&B/Soul';
  trendingBpms: number[];
  optimalBpm: number;
  popularKeys: string[];
  signatureDrumElements: string[];
  vocalArrangementStyles: string[];
  trendingPresetTags: string[];
  viralFactor: number; // 0-100
}

export const GENRE_MARKET_TRENDS: Record<string, GenreTrendData> = {
  amapiano: {
    genre: 'Amapiano',
    trendingBpms: [110, 112, 113, 115],
    optimalBpm: 112,
    popularKeys: ['F# Minor', 'C# Minor', 'E Minor', 'A Minor'],
    signatureDrumElements: [
      'Pitched Log Drum',
      'Syncopated Shaker Loops',
      'Rimshot Rolls',
      'Sub Glide',
    ],
    vocalArrangementStyles: ['Chanted Hook', 'Zulu Choral Calls', 'Whisper Ad-libs'],
    trendingPresetTags: ['DeepLogBass', 'PrivateSchoolPiano', 'PercussiveGroove'],
    viralFactor: 96,
  },
  afrobeats: {
    genre: 'Afrobeats',
    trendingBpms: [98, 102, 105, 108],
    optimalBpm: 105,
    popularKeys: ['G Minor', 'D Minor', 'B Minor', 'C Major'],
    signatureDrumElements: [
      'Afro Kick-Clap Bounce',
      'Talking Drum',
      'Conga Accents',
      'Hi-hat Syncopation',
    ],
    vocalArrangementStyles: [
      '3-Part Call-and-Response',
      'Lush Falsetto Doubles',
      'Harmonized Hooks',
    ],
    trendingPresetTags: ['LagosBounce', 'GoldenBrass', 'WavyKeys'],
    viralFactor: 94,
  },
  afrodrill: {
    genre: 'Afrodrill',
    trendingBpms: [140, 142, 144],
    optimalBpm: 142,
    popularKeys: ['C Minor', 'F Minor', 'G# Minor'],
    signatureDrumElements: ['Sliding 808', 'Counter-snare Snaps', 'Triplet Hi-hat Stutters'],
    vocalArrangementStyles: [
      'Aggressive Center Lead',
      'Pitch-Shifted Harmonies',
      'Low-octave Ad-libs',
    ],
    trendingPresetTags: ['Distorted808Sub', 'DarkStrings', 'DrillBells'],
    viralFactor: 89,
  },
  highlife: {
    genre: 'Highlife',
    trendingBpms: [118, 120, 124],
    optimalBpm: 120,
    popularKeys: ['C Major', 'F Major', 'G Major'],
    signatureDrumElements: ['Live Percussion Ensemble', 'Cowbell Timekeeper', 'Shekere Shakes'],
    vocalArrangementStyles: [
      'Polyphonic African Choir',
      'Storytelling Lead',
      'Antiphonal Refrains',
    ],
    trendingPresetTags: ['CleanHighlifeGuitar', 'WarmBrassSection', 'VintageKeys'],
    viralFactor: 85,
  },
  afrofusion: {
    genre: 'Afrofusion',
    trendingBpms: [100, 104, 108, 114],
    optimalBpm: 106,
    popularKeys: ['D Minor', 'A Minor', 'F# Minor'],
    signatureDrumElements: ['Hybrid Log-Kick', 'Trap Snare', 'Afro Shaker', 'Sub Harmonics'],
    vocalArrangementStyles: ['Silky Melodic Soul', 'Layered Octaves', 'Stereo Ambient Spreads'],
    trendingPresetTags: ['ModernFusionSub', 'EtherealPad', 'VocalSynthLead'],
    viralFactor: 98,
  },
};

export class MarketIntelligenceService {
  private cachedTrends: TrendData[] = [];
  private cachedInfluencers: InfluencerData[] = [];
  private lastTrendUpdate: Date | null = null;
  private lastInfluencerUpdate: Date | null = null;
  private readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Retrieves trending recommendations based on requested genre
   */
  public getGenreTrends(genreKey: string): GenreTrendData {
    const key = genreKey.toLowerCase();
    return GENRE_MARKET_TRENDS[key] || GENRE_MARKET_TRENDS.afrofusion;
  }

  /**
   * Fetches live trend data from Apify (TikTok and Spotify)
   */
  public async fetchLiveTrends(
    options: {
      tiktokLimit?: number;
      spotifyLimit?: number;
      forceRefresh?: boolean;
    } = {}
  ): Promise<TrendData[]> {
    const { tiktokLimit = 50, spotifyLimit = 50, forceRefresh = false } = options;

    // Check cache
    if (!forceRefresh && this.cachedTrends.length > 0 && this.lastTrendUpdate) {
      const cacheAge = Date.now() - this.lastTrendUpdate.getTime();
      if (cacheAge < this.CACHE_DURATION_MS) {
        console.log('Using cached trend data');
        return this.cachedTrends;
      }
    }

    try {
      const trends = await scrapeAllTrends({ tiktokLimit, spotifyLimit });
      this.cachedTrends = trends;
      this.lastTrendUpdate = new Date();
      console.log(`Fetched ${trends.length} live trends from Apify`);
      return trends;
    } catch (error) {
      console.error('Failed to fetch live trends:', error);
      return this.cachedTrends.length > 0 ? this.cachedTrends : [];
    }
  }

  /**
   * Fetches influencer data from Apify (TikTok and Instagram)
   */
  public async fetchInfluencers(
    options: {
      tiktokLimit?: number;
      instagramLimit?: number;
      minFollowers?: number;
      minEngagementRate?: number;
      forceRefresh?: boolean;
    } = {}
  ): Promise<InfluencerData[]> {
    const {
      tiktokLimit = 50,
      instagramLimit = 50,
      minFollowers = 10000,
      minEngagementRate = 2,
      forceRefresh = false,
    } = options;

    // Check cache
    if (!forceRefresh && this.cachedInfluencers.length > 0 && this.lastInfluencerUpdate) {
      const cacheAge = Date.now() - this.lastInfluencerUpdate.getTime();
      if (cacheAge < this.CACHE_DURATION_MS) {
        console.log('Using cached influencer data');
        return this.cachedInfluencers;
      }
    }

    try {
      const [tiktokInfluencers, instagramInfluencers] = await Promise.all([
        scrapeTikTokInfluencers({ limit: tiktokLimit, minFollowers, minEngagementRate }),
        scrapeInstagramInfluencers({ limit: instagramLimit, minFollowers, minEngagementRate }),
      ]);

      this.cachedInfluencers = [
        ...tiktokInfluencers.influencers,
        ...instagramInfluencers.influencers,
      ];
      this.lastInfluencerUpdate = new Date();
      console.log(`Fetched ${this.cachedInfluencers.length} influencers from Apify`);
      return this.cachedInfluencers;
    } catch (error) {
      console.error('Failed to fetch influencers:', error);
      return this.cachedInfluencers.length > 0 ? this.cachedInfluencers : [];
    }
  }

  /**
   * Gets top influencers by genre
   */
  public async getTopInfluencersByGenre(
    genre: string,
    options: {
      limit?: number;
      minFollowers?: number;
      minEngagementRate?: number;
    } = {}
  ): Promise<InfluencerData[]> {
    const { limit = 20, minFollowers = 10000, minEngagementRate = 2 } = options;

    const influencers = await this.fetchInfluencers({ minFollowers, minEngagementRate });

    return influencers
      .filter((inf) => inf.genre.toLowerCase() === genre.toLowerCase())
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, limit);
  }

  /**
   * Gets trending BPMs from live data
   */
  public async getTrendingBpms(genre?: string): Promise<number[]> {
    const trends = await this.fetchLiveTrends();

    const filteredTrends = genre
      ? trends.filter((t) => t.genre?.toLowerCase() === genre.toLowerCase())
      : trends;

    const bpms = filteredTrends.map((t) => t.bpm).filter((bpm): bpm is number => bpm !== undefined);

    // Get unique BPMs and sort by frequency
    const bpmCounts = new Map<number, number>();
    bpms.forEach((bpm) => {
      bpmCounts.set(bpm, (bpmCounts.get(bpm) || 0) + 1);
    });

    return Array.from(bpmCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([bpm]) => bpm)
      .slice(0, 10);
  }

  /**
   * Gets trending keys from live data
   */
  public async getTrendingKeys(genre?: string): Promise<string[]> {
    const trends = await this.fetchLiveTrends();

    const filteredTrends = genre
      ? trends.filter((t) => t.genre?.toLowerCase() === genre.toLowerCase())
      : trends;

    const keys = filteredTrends.map((t) => t.key).filter((key): key is string => key !== undefined);

    // Get unique keys and sort by frequency
    const keyCounts = new Map<string, number>();
    keys.forEach((key) => {
      keyCounts.set(key, (keyCounts.get(key) || 0) + 1);
    });

    return Array.from(keyCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key)
      .slice(0, 10);
  }

  /**
   * Updates genre trends with live Apify data
   */
  public async updateGenreTrendsWithLiveData(): Promise<void> {
    const trends = await this.fetchLiveTrends({ forceRefresh: true });

    // Group trends by genre
    const trendsByGenre = new Map<string, TrendData[]>();
    trends.forEach((trend) => {
      const genre = trend.genre || 'Afrofusion';
      if (!trendsByGenre.has(genre)) {
        trendsByGenre.set(genre, []);
      }
      trendsByGenre.get(genre)!.push(trend);
    });

    // Update each genre with live data
    trendsByGenre.forEach((genreTrends, genre) => {
      const bpms = genreTrends.map((t) => t.bpm).filter((bpm): bpm is number => bpm !== undefined);
      const keys = genreTrends.map((t) => t.key).filter((key): key is string => key !== undefined);

      if (bpms.length > 0) {
        const genreKey = genre.toLowerCase().replace(/\s+/g, '');
        if (GENRE_MARKET_TRENDS[genreKey]) {
          GENRE_MARKET_TRENDS[genreKey].trendingBpms = this.getTopBpms(bpms);
          GENRE_MARKET_TRENDS[genreKey].optimalBpm = this.calculateOptimalBpm(bpms);
          GENRE_MARKET_TRENDS[genreKey].popularKeys = this.getTopKeys(keys);
        }
      }
    });

    console.log('Updated genre trends with live Apify data');
  }

  /**
   * Helper: Get top BPMs from array
   */
  private getTopBpms(bpms: number[]): number[] {
    const counts = new Map<number, number>();
    bpms.forEach((bpm) => counts.set(bpm, (counts.get(bpm) || 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([bpm]) => bpm)
      .slice(0, 5);
  }

  /**
   * Helper: Calculate optimal BPM (median)
   */
  private calculateOptimalBpm(bpms: number[]): number {
    const sorted = [...bpms].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Helper: Get top keys from array
   */
  private getTopKeys(keys: string[]): string[] {
    const counts = new Map<string, number>();
    keys.forEach((key) => counts.set(key, (counts.get(key) || 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key)
      .slice(0, 5);
  }

  /**
   * Generates programmatic SEO metadata for stem packs and presets
   */
  public generateProgrammaticSeo(trackTitle: string, genre: string, bpm: number, key: string) {
    const cleanGenre = genre || 'Afrofusion';
    return {
      title: `${trackTitle} — Free ${cleanGenre} Stems, MIDI & AI Sound Pack (${bpm} BPM in ${key}) | 3WM SONIK`,
      metaDescription: `Download high-fidelity ${cleanGenre} stems, 808 log drum loops, and vocal harmonies for "${trackTitle}" (${bpm} BPM, ${key}). Produced with the 3WM SONIK AI Triad DAW.`,
      keywords: [
        `${cleanGenre} stems`,
        `${bpm} bpm ${cleanGenre} beat`,
        `${key} chord progression`,
        'amapiano log drum preset',
        'three wise men ai music daw',
        'afrobeat producer samples',
        'free wav stem download',
      ],
      canonicalUrl: `https://endless-lamp-461614-k2.web.app/stems/${encodeURIComponent(
        trackTitle.toLowerCase().replace(/\s+/g, '-')
      )}`,
    };
  }
}

export const marketIntelligenceService = new MarketIntelligenceService();
