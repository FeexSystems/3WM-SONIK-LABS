import { getDatabase, ref, onValue, set, onDisconnect, remove } from 'firebase/database';
import { app } from '../lib/firebase';

export interface CollaboratorCursor {
  x: number;
  y: number;
  view: string;
  userId: string;
  userName: string;
  timestamp: number;
}

export interface CollaboratorPresence {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  lastActive: number;
}

class CollaborationService {
  private db = app ? getDatabase(app) : null;
  private currentUserId: string | null = null;
  private currentUserName: string = 'Anonymous Producer';
  private currentProjectId: string | null = null;

  private presenceRef: any = null;
  private cursorRef: any = null;

  private presenceListeners: Set<(presence: Record<string, CollaboratorPresence>) => void> =
    new Set();
  private cursorListeners: Set<(cursors: Record<string, CollaboratorCursor>) => void> = new Set();

  public init(userId: string, userName: string, projectId: string) {
    if (!this.db) return;

    this.currentUserId = userId;
    this.currentUserName = userName;
    this.currentProjectId = projectId;

    const projectPresenceRef = ref(this.db, `presence/${projectId}`);
    this.presenceRef = ref(this.db, `presence/${projectId}/${userId}`);
    this.cursorRef = ref(this.db, `cursors/${projectId}/${userId}`);

    // Set up presence
    const isOfflineForDatabase = {
      status: 'offline',
      lastActive: Date.now(),
      userId,
      userName,
    };

    const isOnlineForDatabase = {
      status: 'online',
      lastActive: Date.now(),
      userId,
      userName,
    };

    const connectedRef = ref(this.db, '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        onDisconnect(this.presenceRef)
          .set(isOfflineForDatabase)
          .then(() => {
            set(this.presenceRef, isOnlineForDatabase);
          });

        onDisconnect(this.cursorRef).remove();
      }
    });

    // Listen to presence changes
    onValue(projectPresenceRef, (snapshot) => {
      const data = snapshot.val() || {};
      this.presenceListeners.forEach((l) => l(data));
    });

    // Listen to cursor changes
    const projectCursorsRef = ref(this.db, `cursors/${projectId}`);
    onValue(projectCursorsRef, (snapshot) => {
      const data = snapshot.val() || {};
      this.cursorListeners.forEach((l) => l(data));
    });
  }

  public updateCursor(x: number, y: number, view: string) {
    if (!this.cursorRef || !this.currentUserId) return;
    set(this.cursorRef, {
      x,
      y,
      view,
      userId: this.currentUserId,
      userName: this.currentUserName,
      timestamp: Date.now(),
    });
  }

  public subscribePresence(listener: (presence: Record<string, CollaboratorPresence>) => void) {
    this.presenceListeners.add(listener);
    return () => this.presenceListeners.delete(listener);
  }

  public subscribeCursors(listener: (cursors: Record<string, CollaboratorCursor>) => void) {
    this.cursorListeners.add(listener);
    return () => this.cursorListeners.delete(listener);
  }

  public disconnect() {
    if (this.presenceRef) {
      set(this.presenceRef, { status: 'offline', lastActive: Date.now() });
    }
    if (this.cursorRef) {
      remove(this.cursorRef);
    }
  }
}

export const collaborationService = new CollaborationService();
