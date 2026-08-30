/**
 * 3WM SONIK — Apify Influencer Discovery Actor
 * Discovers music influencers and creators for marketing campaigns
 */

export interface InfluencerData {
  platform: 'tiktok' | 'instagram' | 'youtube';
  username: string;
  displayName: string;
  // Aliases for UI compatibility (name = displayName)
  name?: string;
  recentActivity?: number;
  followers: number;
  engagementRate: number;
  avgViews: number;
  genre: string;
  verified: boolean;
  bio: string;
  contactEmail?: string;
  recentVideos: number;
  totalLikes: number;
  profileUrl: string;
}

export interface InfluencerScrapingResult {
  success: boolean;
  platform: string;
  influencers: InfluencerData[];
  scrapedAt: Date;
  error?: string;
}

/**
 * TikTok Influencer Scraper
 * Discovers TikTok music creators and influencers
 */
export async function scrapeTikTokInfluencers(
  options: {
    limit?: number;
    genre?: string;
    minFollowers?: number;
    minEngagementRate?: number;
  } = {}
): Promise<InfluencerScrapingResult> {
  const { limit = 50, genre, minFollowers = 10000, minEngagementRate = 2 } = options;

  try {
    const apiToken = process.env.APIFY_API_TOKEN;
    const actorId = process.env.APIFY_ACTOR_INFLUENCER_DISCOVERY || 'apify/tiktok-scraper';

    if (!apiToken) {
      console.warn('Apify API token not configured, using mock data');
      return generateMockTikTokInfluencers(limit, minFollowers, minEngagementRate);
    }

    // In a real implementation, this would call the Apify actor
    console.log(
      `Scraping TikTok influencers with limit=${limit}, genre=${genre}, minFollowers=${minFollowers}`
    );

    return generateMockTikTokInfluencers(limit, minFollowers, minEngagementRate);
  } catch (error) {
    console.error('TikTok influencer scraping error:', error);
    return {
      success: false,
      platform: 'tiktok',
      influencers: [],
      scrapedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Instagram Influencer Scraper
 * Discovers Instagram music creators and influencers
 */
export async function scrapeInstagramInfluencers(
  options: {
    limit?: number;
    genre?: string;
    minFollowers?: number;
    minEngagementRate?: number;
  } = {}
): Promise<InfluencerScrapingResult> {
  const { limit = 50, genre, minFollowers = 10000, minEngagementRate = 2 } = options;

  try {
    const apiToken = process.env.APIFY_API_TOKEN;

    if (!apiToken) {
      console.warn('Apify API token not configured, using mock data');
      return generateMockInstagramInfluencers(limit, minFollowers, minEngagementRate);
    }

    console.log(
      `Scraping Instagram influencers with limit=${limit}, genre=${genre}, minFollowers=${minFollowers}`
    );

    return generateMockInstagramInfluencers(limit, minFollowers, minEngagementRate);
  } catch (error) {
    console.error('Instagram influencer scraping error:', error);
    return {
      success: false,
      platform: 'instagram',
      influencers: [],
      scrapedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate mock TikTok influencer data for development
 */
function generateMockTikTokInfluencers(
  limit: number,
  minFollowers: number,
  minEngagementRate: number
): InfluencerScrapingResult {
  const genres = ['Afrobeats', 'Amapiano', 'Trap', 'Drill', 'R&B', 'Pop'];
  const usernames = [
    'afrobeatsking',
    'amapianoqueen',
    'traplord',
    'drillmaster',
    'rnbvibes',
    'popstar',
    'musicproducer',
    'beatmaker',
  ];
  const displayNames = [
    'Afrobeats King',
    'Amapiano Queen',
    'Trap Lord',
    'Drill Master',
    'R&B Vibes',
    'Pop Star',
    'Music Producer',
    'Beat Maker',
  ];

  const influencers: InfluencerData[] = Array.from({ length: limit }).map((_, i) => {
    const followers = Math.floor(Math.random() * 5000000) + minFollowers;
    const engagementRate = minEngagementRate + Math.random() * 8;
    const avgViews = Math.floor(followers * (engagementRate / 100));
    const genre = genres[i % genres.length];

    return {
      platform: 'tiktok',
      username: usernames[i % usernames.length] + i,
      displayName: displayNames[i % displayNames.length],
      followers,
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      avgViews,
      genre,
      verified: followers > 1000000,
      bio: `Creating ${genre} content | Music Producer | DM for collabs`,
      contactEmail: followers > 500000 ? `influencer${i}@music.com` : undefined,
      recentVideos: Math.floor(Math.random() * 100) + 10,
      totalLikes: Math.floor(avgViews * 0.1 * (Math.random() * 50 + 10)),
      profileUrl: `https://tiktok.com/@${usernames[i % usernames.length]}${i}`,
    };
  });

  return {
    success: true,
    platform: 'tiktok',
    influencers,
    scrapedAt: new Date(),
  };
}

/**
 * Generate mock Instagram influencer data for development
 */
function generateMockInstagramInfluencers(
  limit: number,
  minFollowers: number,
  minEngagementRate: number
): InfluencerScrapingResult {
  const genres = ['Afrobeats', 'Amapiano', 'Hip-Hop', 'R&B', 'Pop', 'Electronic'];
  const usernames = [
    'afrobeats_vibes',
    'amapiano_beats',
    'hip_hop_daily',
    'rnb_soul',
    'pop_hits',
    'edm_energy',
    'music_life',
    'studio_sessions',
  ];
  const displayNames = [
    'Afrobeats Vibes',
    'Amapiano Beats',
    'Hip-Hop Daily',
    'R&B Soul',
    'Pop Hits',
    'EDM Energy',
    'Music Life',
    'Studio Sessions',
  ];

  const influencers: InfluencerData[] = Array.from({ length: limit }).map((_, i) => {
    const followers = Math.floor(Math.random() * 3000000) + minFollowers;
    const engagementRate = minEngagementRate + Math.random() * 6;
    const avgViews = Math.floor(followers * (engagementRate / 100));
    const genre = genres[i % genres.length];

    return {
      platform: 'instagram',
      username: usernames[i % usernames.length] + i,
      displayName: displayNames[i % displayNames.length],
      followers,
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      avgViews,
      genre,
      verified: followers > 500000,
      bio: `${genre} Creator | Music Producer | Link in bio`,
      contactEmail: followers > 100000 ? `creator${i}@music.com` : undefined,
      recentVideos: Math.floor(Math.random() * 50) + 5,
      totalLikes: Math.floor(avgViews * 0.05 * (Math.random() * 30 + 5)),
      profileUrl: `https://instagram.com/${usernames[i % usernames.length]}${i}`,
    };
  });

  return {
    success: true,
    platform: 'instagram',
    influencers,
    scrapedAt: new Date(),
  };
}

/**
 * Combine influencers from multiple platforms
 */
export async function scrapeAllInfluencers(
  options: {
    tiktokLimit?: number;
    instagramLimit?: number;
    minFollowers?: number;
    minEngagementRate?: number;
  } = {}
): Promise<InfluencerData[]> {
  const {
    tiktokLimit = 50,
    instagramLimit = 50,
    minFollowers = 10000,
    minEngagementRate = 2,
  } = options;

  const [tiktokResult, instagramResult] = await Promise.all([
    scrapeTikTokInfluencers({ limit: tiktokLimit, minFollowers, minEngagementRate }),
    scrapeInstagramInfluencers({ limit: instagramLimit, minFollowers, minEngagementRate }),
  ]);

  return [...tiktokResult.influencers, ...instagramResult.influencers];
}

/**
 * Filter influencers by criteria
 */
export function filterInfluencers(
  influencers: InfluencerData[],
  criteria: {
    platforms?: ('tiktok' | 'instagram' | 'youtube')[];
    genres?: string[];
    minFollowers?: number;
    maxFollowers?: number;
    minEngagementRate?: number;
    verifiedOnly?: boolean;
  }
): InfluencerData[] {
  return influencers.filter((influencer) => {
    if (criteria.platforms && !criteria.platforms.includes(influencer.platform)) {
      return false;
    }
    if (criteria.genres && !criteria.genres.includes(influencer.genre)) {
      return false;
    }
    if (criteria.minFollowers && influencer.followers < criteria.minFollowers) {
      return false;
    }
    if (criteria.maxFollowers && influencer.followers > criteria.maxFollowers) {
      return false;
    }
    if (criteria.minEngagementRate && influencer.engagementRate < criteria.minEngagementRate) {
      return false;
    }
    if (criteria.verifiedOnly && !influencer.verified) {
      return false;
    }
    return true;
  });
}

/**
 * Sort influencers by engagement rate
 */
export function sortInfluencersByEngagement(influencers: InfluencerData[]): InfluencerData[] {
  return [...influencers].sort((a, b) => b.engagementRate - a.engagementRate);
}

/**
 * Sort influencers by followers
 */
export function sortInfluencersByFollowers(influencers: InfluencerData[]): InfluencerData[] {
  return [...influencers].sort((a, b) => b.followers - a.followers);
}
