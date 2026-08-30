import React, { useMemo, useRef, useState } from 'react';
import { Check, GitFork, Heart, Pause, Play, Repeat2, Share2 } from 'lucide-react';
import type { FeedPost } from '../../types/feed';
import type { Track } from '../../types';

interface HomefeedScreenProps {
  currentTrack?: Track;
  onForkToStudio: (post: FeedPost) => void;
}

const AGENT_STYLES = {
  emar: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  ricky: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  kingpin: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  orchestrator: 'border-slate-300/30 bg-slate-300/10 text-slate-200',
} as const;

const DEMO_POSTS: FeedPost[] = [
  {
    id: 'council-blueprint-001',
    authorName: '3WM Council Session',
    authorHandle: '@threewm_sonik',
    createdAt: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
    content:
      'A restrained Amapiano arrangement blueprint: leave the vocal pocket open through the first eight bars, then let the log-drum glide establish the lift.',
    media: {
      type: 'image',
      url: '/images/retro_drum_machine_1787742239739.jpg',
      alt: 'Amber-lit drum machine in the 3WM studio',
    },
    source: { projectId: 'council-demo', versionId: 'v1', visibility: 'public' },
    metadata: {
      bpm: 112,
      key: 'F# minor',
      genre: 'Amapiano',
      agents: [
        { agent: 'ricky', role: 'Groove architecture' },
        { agent: 'emar', role: 'Low-end headroom' },
      ],
    },
    metrics: { likes: 1240, reposts: 342, shares: 156, viralityScore: 98 },
  },
  {
    id: 'vocal-space-002',
    authorName: 'Kingpin Sessions',
    authorHandle: '@kingpin_oracle',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    content:
      'Harmony reference: double the final phrase only after the lead has earned the space. The center stays clear; the emotion expands at the edge.',
    media: {
      type: 'image',
      url: '/images/vintage_vocal_mic_1787742262381.jpg',
      alt: 'Vintage vocal microphone in a warm recording chamber',
    },
    source: { projectId: 'kingpin-demo', versionId: 'v2', visibility: 'public' },
    metadata: {
      bpm: 104,
      key: 'A minor',
      genre: 'Afrofusion',
      agents: [{ agent: 'kingpin', role: 'Vocal arrangement' }],
    },
    metrics: { likes: 864, reposts: 128, shares: 71, viralityScore: 84 },
  },
];

function relativeTime(createdAt: string): string {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  return minutes < 60
    ? `${minutes}m ago`
    : minutes < 1440
      ? `${Math.floor(minutes / 60)}h ago`
      : `${Math.floor(minutes / 1440)}d ago`;
}

const AudioPreview: React.FC<{ media: FeedPost['media'] }> = ({ media }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const toggle = async () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      try {
        await audioRef.current.play();
        setPlaying(true);
      } catch {
        setFailed(true);
      }
    } else {
      audioRef.current.pause();
      setPlaying(false);
    }
  };
  return (
    <div className="rounded-xl border border-amber-500/20 bg-[#181410] p-4">
      <audio
        ref={audioRef}
        src={media.url}
        preload="metadata"
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void toggle()}
          aria-label={playing ? 'Pause audio preview' : 'Play audio preview'}
          disabled={failed}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-500 text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>
        <div className="flex h-9 flex-1 items-center gap-1 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 36 }, (_, index) => (
            <span
              key={index}
              className="w-1 rounded-full bg-amber-400/70"
              style={{ height: `${18 + ((index * 19) % 72)}%` }}
            />
          ))}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
          {media.durationSeconds ? `${Math.round(media.durationSeconds)} sec` : 'Preview'}
        </span>
      </div>
      {failed && (
        <p className="mt-2 text-xs text-orange-300">
          Preview unavailable. The original asset remains unchanged.
        </p>
      )}
    </div>
  );
};

export const HomefeedScreen: React.FC<HomefeedScreenProps> = ({ currentTrack, onForkToStudio }) => {
  const [posts, setPosts] = useState(DEMO_POSTS);
  const [notice, setNotice] = useState<string | null>(null);
  const [forkCandidate, setForkCandidate] = useState<FeedPost | null>(null);
  const feed = useMemo(() => {
    if (!currentTrack) return posts;
    const firstStem = currentTrack.stems.find((stem) => stem.audioBlobUrl);
    const localPost: FeedPost = {
      id: `current-${currentTrack.id}`,
      authorName: currentTrack.artist,
      authorHandle: '@your_session',
      createdAt: currentTrack.updatedAt ?? currentTrack.createdAt,
      content: `${currentTrack.title} is open in your studio. Share a reference or fork a council blueprint without changing the original session.`,
      media: firstStem?.audioBlobUrl
        ? {
            type: 'audio',
            url: firstStem.audioBlobUrl,
            alt: `${currentTrack.title} stem preview`,
            durationSeconds: currentTrack.duration,
          }
        : {
            type: 'image',
            url: currentTrack.coverArt || '/images/analog_mixing_console_1787742219421.jpg',
            alt: `${currentTrack.title} cover art`,
          },
      source: {
        projectId: currentTrack.id,
        versionId: String(currentTrack.version ?? 1),
        visibility: 'unlisted',
      },
      metadata: {
        bpm: currentTrack.bpm,
        key: currentTrack.key,
        genre: currentTrack.genre,
        agents: [{ agent: 'orchestrator', role: 'Project coordination' }],
      },
      metrics: { likes: 0, reposts: 0, shares: 0, viralityScore: 0 },
    };
    return [localPost, ...posts];
  }, [currentTrack, posts]);

  const share = async (post: FeedPost) => {
    const url = new URL(`/feed/${post.id}`, window.location.origin).toString();
    const data = { title: `3WM SONIK · ${post.authorName}`, text: post.content, url };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        setNotice('Share link copied to your clipboard.');
      }
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError')
        setNotice('Sharing is unavailable in this browser.');
    }
  };

  const repost = (postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id !== postId
          ? post
          : {
              ...post,
              isRepostedByMe: !post.isRepostedByMe,
              metrics: {
                ...post.metrics,
                reposts: post.metrics.reposts + (post.isRepostedByMe ? -1 : 1),
              },
            }
      )
    );
    setNotice('Repost saved locally. Network sync will be enabled with the feed service.');
  };

  return (
    <section className="mx-auto h-full w-full max-w-3xl overflow-y-auto bg-[#0D0D0D] px-4 pb-10 text-neutral-100 sm:px-6">
      <header className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-amber-500/15 bg-[#0D0D0D]/95 px-4 py-5 backdrop-blur sm:-mx-6 sm:px-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400">
            Central Council Network
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-wide text-neutral-100">
            Creator Feed
          </h1>
        </div>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
          Live references
        </span>
      </header>
      {notice && (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
        >
          <Check className="h-4 w-4" />
          {notice}
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="ml-auto text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="divide-y divide-neutral-800/90">
        {feed.map((post) => (
          <article key={post.id} className="py-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-amber-500/25 bg-[#1A1208] font-display text-lg text-amber-400">
                {post.authorName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2">
                  <strong>{post.authorName}</strong>
                  <span className="text-sm text-neutral-500">{post.authorHandle}</span>
                  <span className="text-sm text-neutral-600">· {relativeTime(post.createdAt)}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-300">{post.content}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.metadata?.agents?.map((contribution) => (
                    <span
                      key={`${contribution.agent}-${contribution.role}`}
                      className={`rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${AGENT_STYLES[contribution.agent]}`}
                    >
                      {contribution.agent} · {contribution.role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              {post.media.type === 'audio' ? (
                <AudioPreview media={post.media} />
              ) : post.media.type === 'video' ? (
                <video
                  controls
                  className="aspect-video w-full rounded-xl border border-neutral-800 bg-black object-cover"
                  src={post.media.url}
                  aria-label={post.media.alt}
                />
              ) : (
                <img
                  className="max-h-[26rem] w-full rounded-xl border border-neutral-800 object-cover"
                  src={post.media.url}
                  alt={post.media.alt}
                />
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs text-neutral-500">
              {post.metadata?.bpm && <span>{post.metadata.bpm} BPM</span>}
              {post.metadata?.key && <span>· {post.metadata.key}</span>}
              {post.metadata?.genre && <span>· {post.metadata.genre}</span>}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-label="Like post"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-neutral-400 transition hover:bg-neutral-900 hover:text-rose-300"
              >
                <Heart className="h-4 w-4" />
                {post.metrics.likes}
              </button>
              <button
                type="button"
                aria-pressed={post.isRepostedByMe}
                onClick={() => repost(post.id)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 transition hover:bg-neutral-900 ${post.isRepostedByMe ? 'text-emerald-300' : 'text-neutral-400'}`}
              >
                <Repeat2 className="h-4 w-4" />
                {post.metrics.reposts}
              </button>
              <button
                type="button"
                onClick={() => void share(post)}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-neutral-400 transition hover:bg-neutral-900 hover:text-sky-300"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button
                type="button"
                onClick={() => setForkCandidate(post)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-300 transition hover:bg-amber-500/20"
              >
                <GitFork className="h-4 w-4" />
                Fork to Studio
              </button>
            </div>
          </article>
        ))}
      </div>
      {forkCandidate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="fork-title"
          className="fixed inset-0 z-30 grid place-items-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-amber-500/25 bg-[#181410] p-6 shadow-2xl">
            <h2 id="fork-title" className="font-display text-2xl text-amber-300">
              Fork reference to Studio?
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-300">
              This creates a version snapshot in your current project and opens the Studio. The
              source post and its media are never modified.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setForkCandidate(null)}
                className="rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onForkToStudio(forkCandidate);
                  setForkCandidate(null);
                }}
                className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-black hover:bg-amber-400"
              >
                Create snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
