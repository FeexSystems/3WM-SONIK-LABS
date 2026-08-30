import React, { useState, useEffect, useRef } from 'react';
import { Workspace, TimelineComment, CollaboratorPresence } from '../../types';
import { useToast } from '../ui/toaster';
import {
  Users,
  MessageSquare,
  Clock,
  Plus,
  Shield,
  Check,
  Send,
  Sparkles,
  MousePointer,
  Radio,
  Eye,
  Sliders,
  Music,
  Activity,
  Layers,
  Zap,
} from 'lucide-react';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  isOnline: boolean;
  lastActive: string;
  color: string;
  currentAction: string;
  currentSection: string;
}

interface CollaborationViewProps {
  workspace: Workspace;
}

const initialTeam: TeamMember[] = [
  {
    id: 'u-1',
    name: 'Kappachino Emar',
    email: 'emar@3wm.audio',
    role: 'Lead Artist',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    isOnline: true,
    lastActive: 'Active now',
    color: '#10b981', // emerald
    currentAction: 'Recording Lead Vocal Take 3',
    currentSection: 'Vocal Recording Booth',
  },
  {
    id: 'u-2',
    name: 'Kappachino Ricky',
    email: 'ricky@3wm.audio',
    role: 'Producer',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    isOnline: true,
    lastActive: 'Active now',
    color: '#f59e0b', // amber
    currentAction: 'Sculpting 808 Log Drum Decay & Sub Boost',
    currentSection: 'Stem Arrangement Timeline',
  },
  {
    id: 'u-3',
    name: 'BushBot AI (Engine)',
    email: 'bushbot@3wm.audio',
    role: 'AI Mastering Agent',
    avatar:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
    isOnline: true,
    lastActive: 'Active now',
    color: '#06b6d4', // cyan
    currentAction: 'Analyzing True-Peak Ceiling (-13.8 LUFS target)',
    currentSection: 'Ozone Mastering Chain',
  },
  {
    id: 'u-4',
    name: 'Kingpin',
    email: 'kingpin@3wm.audio',
    role: 'Featured Artist',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    isOnline: false,
    lastActive: '45m ago',
    color: '#ec4899', // pink
    currentAction: 'Reviewing Chorus Stem Mix',
    currentSection: 'Offline',
  },
];

const mockComments: TimelineComment[] = [
  {
    id: 'c-1',
    author: 'Kappachino Ricky',
    authorAvatar: '',
    role: 'Producer',
    timestampSeconds: 14.5,
    text: 'Let us bring the talking drum fader up +1.5dB right before the chorus drop at 0:14.',
    resolved: false,
    createdAt: '15m ago',
  },
  {
    id: 'c-2',
    author: 'BushBot (AI)',
    authorAvatar: '',
    role: 'Engineer',
    timestampSeconds: 32.0,
    text: 'Harmonic saturation at 3.2kHz on the vocal double matches the Kalakuta Shrine reference.',
    resolved: true,
    createdAt: '1h ago',
  },
  {
    id: 'c-3',
    author: 'Kappachino Emar',
    authorAvatar: '',
    role: 'Lead Artist',
    timestampSeconds: 48.0,
    text: 'Can we add subtle tape flange to the bridge backing vocals at bar 24?',
    resolved: false,
    createdAt: '3m ago',
  },
];

export const CollaborationView: React.FC<CollaborationViewProps> = ({ workspace }) => {
  const { toast } = useToast();
  const [team] = useState<TeamMember[]>(initialTeam);
  const [comments, setComments] = useState<TimelineComment[]>(mockComments);
  const [newComment, setNewComment] = useState('');
  const [timestamp, setTimestamp] = useState('00:15');
  const [isBroadcastingCursor, setIsBroadcastingCursor] = useState<boolean>(true);
  const [followedUser, setFollowedUser] = useState<string | null>(null);

  // Local user cursor position on the DAW canvas
  const [myCursor, setMyCursor] = useState<{ x: number; y: number }>({ x: 45, y: 52 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Simulated live moving cursors for remote team members in the DAW session
  const [collaborators, setCollaborators] = useState<any[]>([]);

  useEffect(() => {
    import('../../collaboration/collaborationService').then(({ collaborationService }) => {
      // Connect to session using mock user for now
      const mockUserId = `user-${Math.floor(Math.random() * 1000)}`;
      collaborationService.init(mockUserId, 'Active Producer', workspace.id || 'default-session');

      const unsubPresence = collaborationService.subscribePresence((presenceMap) => {
        // Merge presence with existing cursors or create
        setCollaborators((prev) => {
          const next = [...prev];
          Object.values(presenceMap).forEach((p) => {
            if (p.userId === mockUserId) return; // Skip self
            if (p.status === 'offline') {
              const idx = next.findIndex((c) => c.id === p.userId);
              if (idx > -1) next.splice(idx, 1);
            } else {
              const existing = next.find((c) => c.id === p.userId);
              if (existing) {
                existing.lastActive = p.lastActive;
              } else {
                next.push({
                  id: p.userId,
                  name: p.userName,
                  avatar:
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                  role: 'Producer',
                  color: '#10b981',
                  x: 50,
                  y: 50,
                  activeView: 'Studio',
                  activeTrackName: 'Unknown',
                  currentTool: 'Pointer',
                  lastAction: 'Joined session',
                  lastActive: p.lastActive,
                });
              }
            }
          });
          return next;
        });
      });

      const unsubCursors = collaborationService.subscribeCursors((cursorMap) => {
        setCollaborators((prev) => {
          const next = [...prev];
          Object.values(cursorMap).forEach((cur) => {
            if (cur.userId === mockUserId) return; // Skip self
            const existing = next.find((c) => c.id === cur.userId);
            if (existing) {
              existing.x = cur.x;
              existing.y = cur.y;
              existing.activeView = cur.view;
              existing.lastActive = cur.timestamp;
            }
          });
          return next;
        });
      });

      return () => {
        unsubPresence();
        unsubCursors();
        collaborationService.disconnect();
      };
    });
  }, [workspace.id]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !isBroadcastingCursor) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newX = Math.max(0, Math.min(100, x));
    const newY = Math.max(0, Math.min(100, y));
    setMyCursor({ x: newX, y: newY });

    import('../../collaboration/collaborationService').then(({ collaborationService }) => {
      collaborationService.updateCursor(newX, newY, 'Workspace Canvas');
    });
  };

  const handleToggleResolve = (id: string) => {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c)));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const item: TimelineComment = {
      id: `c-${Date.now()}`,
      author: 'You (Sonic Engineer)',
      authorAvatar: '',
      role: 'Engineer',
      timestampSeconds: parseFloat(timestamp.replace(':', '.')) || 15.0,
      text: newComment,
      resolved: false,
      createdAt: 'Just now',
    };
    setComments([item, ...comments]);
    setNewComment('');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in duration-200">
      {/* Header & Broadcast Telemetry Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-neutral-100 uppercase tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Studio Team & Live Multi-User Collaboration</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time interactive cursor tracking, DAW workspace presence, timestamped mix markers,
            and role permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBroadcastingCursor((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              isBroadcastingCursor
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800'
            }`}
            title="Toggle broadcasting your cursor position to all connected session producers"
          >
            <Radio
              className={`w-3.5 h-3.5 ${isBroadcastingCursor ? 'animate-pulse text-emerald-400' : ''}`}
            />
            <span>
              {isBroadcastingCursor ? 'BROADCASTING CURSOR (LIVE)' : 'CURSOR BROADCAST MUTED'}
            </span>
          </button>

          <button
            onClick={() =>
              toast({
                type: 'success',
                title: 'Link copied',
                description: 'Studio session invitation copied to clipboard.',
              })
            }
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>INVITE COLLABORATOR</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          REAL-TIME INTERACTIVE DAW WORKSPACE CANVAS WITH LIVE CURSORS
         ------------------------------------------------------------- */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-black text-neutral-100 uppercase tracking-wider">
              Real-Time Interactive DAW Workspace & Live Cursor Radar
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              {collaborators.length + 1} Active Producers Connected
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400">
            <span>
              Your Cursor:{' '}
              <span className="text-emerald-400 font-bold">
                X:{myCursor.x.toFixed(0)}% Y:{myCursor.y.toFixed(0)}%
              </span>
            </span>
            {followedUser && (
              <button
                onClick={() => setFollowedUser(null)}
                className="text-amber-400 hover:text-white underline text-[10px]"
              >
                Unfollow
              </button>
            )}
          </div>
        </div>

        {/* Live Interactive Workspace Surface */}
        <div
          ref={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          className="relative w-full h-80 bg-neutral-950 rounded-xl border border-neutral-850 overflow-hidden select-none cursor-crosshair group shadow-inner"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        >
          {/* Simulated DAW Track Arrangement Lanes in Canvas Background */}
          <div className="absolute inset-0 p-4 space-y-3 pointer-events-none opacity-40">
            <div className="h-9 bg-neutral-900/60 rounded-lg border border-neutral-800 flex items-center px-3 justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-400">
                Track 1: Lead Vocals (Afrofusion Pitch)
              </span>
              <div className="flex gap-1 h-3">
                <span className="w-16 bg-amber-500/30 rounded" />
                <span className="w-28 bg-amber-500/50 rounded" />
                <span className="w-20 bg-amber-500/30 rounded" />
              </div>
            </div>

            <div className="h-9 bg-neutral-900/60 rounded-lg border border-neutral-800 flex items-center px-3 justify-between">
              <span className="text-[10px] font-mono font-bold text-red-400">
                Track 2: Drums, Shekere & Shakers
              </span>
              <div className="flex gap-1 h-3">
                <span className="w-32 bg-red-500/40 rounded" />
                <span className="w-14 bg-red-500/20 rounded" />
                <span className="w-32 bg-red-500/40 rounded" />
              </div>
            </div>

            <div className="h-9 bg-neutral-900/60 rounded-lg border border-neutral-800 flex items-center px-3 justify-between">
              <span className="text-[10px] font-mono font-bold text-blue-400">
                Track 3: Log Drum & 808 Sub-Bass
              </span>
              <div className="flex gap-1 h-3">
                <span className="w-20 bg-blue-500/40 rounded" />
                <span className="w-36 bg-blue-500/50 rounded" />
                <span className="w-16 bg-blue-500/30 rounded" />
              </div>
            </div>

            <div className="h-9 bg-neutral-900/60 rounded-lg border border-neutral-800 flex items-center px-3 justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-400">
                Track 4: Kalakuta Horns & Brass
              </span>
              <div className="flex gap-1 h-3">
                <span className="w-24 bg-emerald-500/30 rounded" />
                <span className="w-24 bg-emerald-500/50 rounded" />
              </div>
            </div>

            <div className="h-9 bg-neutral-900/60 rounded-lg border border-neutral-800 flex items-center px-3 justify-between">
              <span className="text-[10px] font-mono font-bold text-purple-400">
                Track 5: Shrine Convo Reverb FX
              </span>
              <div className="flex gap-1 h-3">
                <span className="w-40 bg-purple-500/30 rounded" />
              </div>
            </div>
          </div>

          {/* User's Own Cursor Marker */}
          {isBroadcastingCursor && (
            <div
              className="absolute pointer-events-none transition-transform duration-75 z-30"
              style={{
                left: `${myCursor.x}%`,
                top: `${myCursor.y}%`,
                transform: 'translate(-2px, -2px)',
              }}
            >
              <svg
                className="w-5 h-5 text-emerald-400 drop-shadow-md"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 3l7 18 3-7 7-3L3 3z" />
              </svg>
              <div className="ml-4 -mt-2 bg-emerald-500 text-neutral-950 text-[10px] font-black px-2 py-0.5 rounded shadow-lg whitespace-nowrap flex items-center gap-1">
                <span>YOU (Active)</span>
              </div>
            </div>
          )}

          {/* Remote Collaborators' Live Cursors */}
          {collaborators.map((collab) => {
            const isFollowed = followedUser === collab.id;

            return (
              <div
                key={collab.id}
                className="absolute transition-all duration-1000 ease-out z-20"
                style={{
                  left: `${collab.x}%`,
                  top: `${collab.y}%`,
                  transform: 'translate(-2px, -2px)',
                }}
              >
                {/* Pointer Icon */}
                <svg
                  className="w-5 h-5 drop-shadow-md transition-colors"
                  style={{ color: collab.color }}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M3 3l7 18 3-7 7-3L3 3z" />
                </svg>

                {/* Presence Tag Card */}
                <div
                  className="ml-3 -mt-3 bg-neutral-900 border rounded-lg shadow-xl px-2 py-1 max-w-[200px] flex flex-col gap-0.5 backdrop-blur-md"
                  style={{ borderColor: `${collab.color}60` }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: collab.color }}
                    />
                    <span className="text-[10px] font-bold text-neutral-100 truncate">
                      {collab.name}
                    </span>
                    <span className="text-[8px] font-mono px-1 rounded bg-neutral-800 text-neutral-300">
                      {collab.role}
                    </span>
                  </div>

                  <span className="text-[9px] font-mono text-amber-300 truncate">
                    {collab.lastAction}
                  </span>

                  <span className="text-[8px] text-neutral-400 truncate">
                    📍 {collab.activeTrackName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Collaborator Presence Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {collaborators.map((c) => (
            <div
              key={c.id}
              onClick={() => setFollowedUser(c.id === followedUser ? null : c.id)}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                followedUser === c.id
                  ? 'bg-neutral-800 border-amber-500 shadow-md'
                  : 'bg-neutral-950 border-neutral-850 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-neutral-950 font-mono shadow"
                  style={{ backgroundColor: c.color }}
                >
                  {c.name[0]}
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-200 block">{c.name}</span>
                  <span className="text-[10px] font-mono text-neutral-400 block truncate max-w-[150px]">
                    {c.currentTool}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400">
                <Eye className="w-3.5 h-3.5" />
                <span>{followedUser === c.id ? 'FOLLOWING' : 'FOLLOW'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------------
          STUDIO MEMBERS DIRECTORY & TIMELINE COMMENTS
         ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members List (1 col) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <span className="text-xs font-bold text-neutral-100 uppercase tracking-wider">
              STUDIO MEMBERS ({team.length})
            </span>
            <span className="text-[10px] font-mono text-emerald-400">3 ONLINE</span>
          </div>

          <div className="space-y-3">
            {team.map((member) => (
              <div
                key={member.id}
                className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl flex items-center justify-between hover:border-neutral-750 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-neutral-950"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name[0]}
                    </div>
                    {member.isOnline && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-neutral-950 absolute bottom-0 right-0 animate-pulse" />
                    )}
                  </div>

                  <div>
                    <span className="text-xs font-bold text-neutral-200 block">{member.name}</span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {member.currentAction}
                    </span>
                  </div>
                </div>

                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-amber-400 border border-amber-500/20 font-bold">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timestamped Timeline Comments (2 cols) */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <span className="text-xs font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Timeline Markers & Mix Notes</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                {comments.filter((c) => !c.resolved).length} PENDING NOTES
              </span>
            </div>

            {/* Comment Form */}
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-neutral-400">AT TIMELINE:</span>
                <input
                  type="text"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="w-16 bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 text-xs text-amber-400 font-mono focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a mix note or stem adjustment..."
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
                />
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>POST</span>
                </button>
              </div>
            </div>

            {/* Comment List */}
            <div className="space-y-3">
              {comments.map((cmt) => (
                <div
                  key={cmt.id}
                  className={`p-3.5 rounded-xl border transition ${
                    cmt.resolved
                      ? 'bg-neutral-950/40 border-neutral-850 opacity-60'
                      : 'bg-neutral-950 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-200">{cmt.author}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 text-amber-400 border border-neutral-800">
                        {cmt.role}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                        {cmt.timestampSeconds}s
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleResolve(cmt.id)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded transition flex items-center gap-1 ${
                        cmt.resolved
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{cmt.resolved ? 'RESOLVED' : 'MARK RESOLVED'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-neutral-300">{cmt.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
