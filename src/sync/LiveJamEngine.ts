// 3WM SONIK — Live Jam Multi-Producer Collaboration Engine
// Real-time peer-to-peer DAW collaboration with WebRTC mesh, track edit locking, and shared transport.

import { WebrtcProvider } from 'y-webrtc';
import { ConflictResolver, SonikTrackState } from './ConflictResolver';

export interface LiveCollaborator {
  userId: string;
  userName: string;
  color: string;
  activeTrackId?: string;
  cursorPosition?: { bar: number; beat: number };
}

export class LiveJamEngine {
  private resolver: ConflictResolver;
  private webrtcProvider: WebrtcProvider | null = null;
  private roomId: string | null = null;
  private currentUserId: string;
  private currentUserName: string;
  private lockedTracks: Map<string, string> = new Map(); // trackId -> userId
  private collaboratorListeners: Set<(collaborators: LiveCollaborator[]) => void> = new Set();

  constructor(resolver: ConflictResolver, userId = 'user-anon', userName = 'Afro Producer') {
    this.resolver = resolver;
    this.currentUserId = userId;
    this.currentUserName = userName;
  }

  public joinRoom(roomId: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      this.roomId = roomId;
      this.webrtcProvider = new WebrtcProvider(`3wm-sonik-room-${roomId}`, this.resolver.getDoc(), {
        signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com'],
      });

      // Set user awareness state
      this.webrtcProvider.awareness.setLocalStateField('user', {
        userId: this.currentUserId,
        userName: this.currentUserName,
        color: '#F5A800', // 3WM Gold
      });

      this.webrtcProvider.awareness.on('change', () => {
        this.notifyCollaborators();
      });

      console.log(`🔱 LiveJamEngine: Joined live collaborative session [Room: ${roomId}]`);
      return true;
    } catch (err) {
      console.error('🔱 LiveJamEngine failed to join collaboration room:', err);
      return false;
    }
  }

  public leaveRoom(): void {
    if (this.webrtcProvider) {
      this.webrtcProvider.destroy();
      this.webrtcProvider = null;
      this.roomId = null;
      console.log('🔱 LiveJamEngine: Left collaborative session.');
    }
  }

  // Track Edit Locking (Optimistic Concurrency Control)
  public requestTrackLock(trackId: string): boolean {
    const currentHolder = this.lockedTracks.get(trackId);
    if (currentHolder && currentHolder !== this.currentUserId) {
      console.warn(`🔱 LiveJamEngine: Track ${trackId} is already locked by producer ${currentHolder}`);
      return false;
    }

    this.lockedTracks.set(trackId, this.currentUserId);
    return true;
  }

  public releaseTrackLock(trackId: string): void {
    if (this.lockedTracks.get(trackId) === this.currentUserId) {
      this.lockedTracks.delete(trackId);
    }
  }

  public isTrackLockedByOther(trackId: string): boolean {
    const holder = this.lockedTracks.get(trackId);
    return Boolean(holder && holder !== this.currentUserId);
  }

  public updateTrack(trackId: string, trackData: Partial<SonikTrackState>): boolean {
    if (this.isTrackLockedByOther(trackId)) {
      return false;
    }
    this.resolver.updateTrack(trackId, trackData);
    return true;
  }

  public getCollaborators(): LiveCollaborator[] {
    if (!this.webrtcProvider) return [];

    const states = this.webrtcProvider.awareness.getStates();
    const list: LiveCollaborator[] = [];

    states.forEach((state) => {
      if (state.user) {
        list.push({
          userId: state.user.userId,
          userName: state.user.userName,
          color: state.user.color,
          activeTrackId: state.user.activeTrackId,
          cursorPosition: state.user.cursorPosition,
        });
      }
    });

    return list;
  }

  public subscribeCollaborators(listener: (collaborators: LiveCollaborator[]) => void): () => void {
    this.collaboratorListeners.add(listener);
    listener(this.getCollaborators());
    return () => this.collaboratorListeners.delete(listener);
  }

  private notifyCollaborators(): void {
    const list = this.getCollaborators();
    this.collaboratorListeners.forEach((l) => l(list));
  }
}
