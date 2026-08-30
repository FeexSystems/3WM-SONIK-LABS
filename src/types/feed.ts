export type FeedMediaType = 'audio' | 'video' | 'image';

export type FeedAgentId = 'emar' | 'ricky' | 'kingpin' | 'orchestrator';

export interface AgentContribution {
  agent: FeedAgentId;
  role: string;
}

export interface FeedMedia {
  type: FeedMediaType;
  /** Resolved public or signed asset URL. Never persist a private storage path here. */
  url: string;
  alt: string;
  durationSeconds?: number;
  waveform?: number[];
}

export interface FeedPost {
  id: string;
  authorName: string;
  authorHandle: string;
  avatarUrl?: string;
  createdAt: string;
  content: string;
  media: FeedMedia;
  source: {
    projectId: string;
    versionId: string;
    visibility: 'public' | 'unlisted';
  };
  metadata?: {
    bpm?: number;
    key?: string;
    genre?: string;
    agents?: AgentContribution[];
  };
  metrics: { likes: number; reposts: number; shares: number; viralityScore: number };
  isRepostedByMe?: boolean;
}
