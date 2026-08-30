import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';

// The Yjs document is the single source of truth for CRDT state
export const ydoc = new Y.Doc();

// Share the track state via a Y.Map
export const yTrack = ydoc.getMap('track');

// Additional shared data structures
export const yProject = ydoc.getMap('project');
export const ySettings = ydoc.getMap('settings');
export const yCollaborators = ydoc.getMap('collaborators');

// Yjs provider flags
let isProviderInitialized = false;
let indexeddbProvider: IndexeddbPersistence | null = null;
let webrtcProvider: WebrtcProvider | null = null;

// Conflict resolution strategy
export enum ConflictResolutionStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  FIRST_WRITE_WINS = 'first_write_wins',
  MANUAL = 'manual',
  MERGE = 'merge',
}

let currentConflictStrategy: ConflictResolutionStrategy =
  ConflictResolutionStrategy.LAST_WRITE_WINS;

export const initYjsCollaboration = (roomName: string = '3wm-sonik-studio-room-1') => {
  if (isProviderInitialized) return;

  // 1. IndexedDB persistence (Offline support / Epic 3)
  indexeddbProvider = new IndexeddbPersistence(roomName, ydoc);

  indexeddbProvider.on('synced', () => {
    console.log('Yjs: Local IndexedDB state synced');
  });

  indexeddbProvider.on('load', () => {
    console.log('Yjs: Local IndexedDB state loaded');
  });

  // 2. WebRTC provider for true peer-to-peer CRDT syncing without a heavy server
  // (In a full prod environment, we would use y-websocket + Firebase functions)
  webrtcProvider = new WebrtcProvider(roomName, ydoc, {
    signaling: ['wss://signaling.yjs.dev'], // Public signaling server for demo
    maxConns: 20, // Maximum concurrent connections
  });

  webrtcProvider.on('status', (event: any) => {
    console.log(`Yjs: WebRTC connection status: ${event.status}`);
    if (event.status === 'connected') {
      handleConnectionEstablished();
    }
  });

  webrtcProvider.on('peers', (event: any) => {
    console.log(`Yjs: Connected peers: ${event.peers.length}`);
    updateCollaboratorsList(event.peers);
  });

  // Set up awareness for cursor tracking and user presence
  webrtcProvider.awareness.setLocalStateField('user', {
    name: getUserIdentifier(),
    cursor: null,
  });

  webrtcProvider.awareness.on('change', () => {
    updateCollaboratorsList(webrtcProvider?.awareness.getStates() || new Map());
  });

  isProviderInitialized = true;
  console.log('CRDT Collaboration Engine Initialized (Yjs)');
};

/**
 * Get user identifier for collaboration
 */
function getUserIdentifier(): string {
  const userId = localStorage.getItem('3wm-sonik-user-id');
  if (userId) return userId;

  const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('3wm-sonik-user-id', newId);
  return newId;
}

/**
 * Handle connection established
 */
function handleConnectionEstablished(): void {
  console.log('Yjs: Connection established, syncing state');
  // Could trigger initial sync or conflict resolution here
}

/**
 * Update collaborators list
 */
function updateCollaboratorsList(peers: any): void {
  const collaborators: Map<string, any> = new Map();

  if (peers instanceof Map) {
    peers.forEach((state: any, clientId: string) => {
      if (state.user) {
        collaborators.set(clientId, state.user);
      }
    });
  } else if (Array.isArray(peers)) {
    // For WebRTC peer list
    peers.forEach((peerId: string) => {
      collaborators.set(peerId, { name: `Peer ${peerId.substr(0, 8)}` });
    });
  }

  // Update Yjs collaborators map
  ydoc.transact(() => {
    yCollaborators.clear();
    collaborators.forEach((data, id) => {
      yCollaborators.set(id, data);
    });
  });
}

/**
 * Sync track data to Yjs with conflict resolution
 */
export const syncTrackToYjs = (
  trackData: any,
  strategy: ConflictResolutionStrategy = currentConflictStrategy
) => {
  switch (strategy) {
    case ConflictResolutionStrategy.LAST_WRITE_WINS:
      syncTrackLastWriteWins(trackData);
      break;
    case ConflictResolutionStrategy.FIRST_WRITE_WINS:
      syncTrackFirstWriteWins(trackData);
      break;
    case ConflictResolutionStrategy.MANUAL:
      syncTrackManual(trackData);
      break;
    case ConflictResolutionStrategy.MERGE:
      syncTrackMerge(trackData);
      break;
    default:
      syncTrackLastWriteWins(trackData);
  }
};

/**
 * Last write wins strategy
 */
function syncTrackLastWriteWins(trackData: any): void {
  ydoc.transact(() => {
    Object.keys(trackData).forEach((key) => {
      const existingValue = yTrack.get(key);
      const newValue = trackData[key];

      // Simple timestamp comparison if available
      const existingTimestamp = (existingValue as any)?.timestamp || 0;
      const newTimestamp = newValue?.timestamp || Date.now();

      if (newTimestamp >= existingTimestamp) {
        yTrack.set(key, {
          ...newValue,
          timestamp: newTimestamp,
          lastModifiedBy: getUserIdentifier(),
        });
      }
    });
  });
}

/**
 * First write wins strategy
 */
function syncTrackFirstWriteWins(trackData: any): void {
  ydoc.transact(() => {
    Object.keys(trackData).forEach((key) => {
      if (!yTrack.has(key)) {
        yTrack.set(key, {
          ...trackData[key],
          timestamp: Date.now(),
          createdBy: getUserIdentifier(),
        });
      }
    });
  });
}

/**
 * Manual conflict resolution (requires user intervention)
 */
function syncTrackManual(trackData: any): void {
  const conflicts: Array<{ key: string; local: any; remote: any }> = [];

  ydoc.transact(() => {
    Object.keys(trackData).forEach((key) => {
      const existingValue = yTrack.get(key);
      const newValue = trackData[key];

      if (existingValue && JSON.stringify(existingValue) !== JSON.stringify(newValue)) {
        conflicts.push({
          key,
          local: existingValue,
          remote: newValue,
        });
      }
    });
  });

  if (conflicts.length > 0) {
    // Emit conflict event for UI to handle
    const conflictEvent = new CustomEvent('yjs-conflicts', {
      detail: { conflicts },
    });
    window.dispatchEvent(conflictEvent);
  } else {
    // No conflicts, proceed with sync
    syncTrackLastWriteWins(trackData);
  }
}

/**
 * Merge strategy (intelligent merging)
 */
function syncTrackMerge(trackData: any): void {
  ydoc.transact(() => {
    Object.keys(trackData).forEach((key) => {
      const existingValue = yTrack.get(key);
      const newValue = trackData[key];

      if (!existingValue) {
        // New key, just add it
        yTrack.set(key, {
          ...newValue,
          timestamp: Date.now(),
          createdBy: getUserIdentifier(),
        });
      } else {
        // Try to merge based on data type
        const merged = mergeValues(existingValue, newValue);
        yTrack.set(key, {
          ...merged,
          timestamp: Date.now(),
          lastModifiedBy: getUserIdentifier(),
        });
      }
    });
  });
}

/**
 * Intelligent value merging
 */
function mergeValues(local: any, remote: any): any {
  // If values are the same, return either
  if (JSON.stringify(local) === JSON.stringify(remote)) {
    return local;
  }

  // Handle arrays (concatenate unique values)
  if (Array.isArray(local) && Array.isArray(remote)) {
    const merged = [...local];
    remote.forEach((item) => {
      if (!merged.includes(item)) {
        merged.push(item);
      }
    });
    return merged;
  }

  // Handle objects (recursive merge)
  if (
    typeof local === 'object' &&
    typeof remote === 'object' &&
    local !== null &&
    remote !== null
  ) {
    const merged: any = { ...local };
    Object.keys(remote).forEach((key) => {
      if (merged[key] !== undefined) {
        merged[key] = mergeValues(merged[key], remote[key]);
      } else {
        merged[key] = remote[key];
      }
    });
    return merged;
  }

  // For primitives, prefer remote (last write wins for primitives)
  return remote;
}

/**
 * Sync project data to Yjs
 */
export const syncProjectToYjs = (projectData: any) => {
  ydoc.transact(() => {
    Object.keys(projectData).forEach((key) => {
      yProject.set(key, {
        ...projectData[key],
        timestamp: Date.now(),
        lastModifiedBy: getUserIdentifier(),
      });
    });
  });
};

/**
 * Sync settings to Yjs
 */
export const syncSettingsToYjs = (settingsData: any) => {
  ydoc.transact(() => {
    Object.keys(settingsData).forEach((key) => {
      ySettings.set(key, {
        ...settingsData[key],
        timestamp: Date.now(),
        lastModifiedBy: getUserIdentifier(),
      });
    });
  });
};

/**
 * Get current track data from Yjs
 */
export const getTrackFromYjs = (): any => {
  const trackData: any = {};
  yTrack.forEach((value, key) => {
    trackData[key] = value;
  });
  return trackData;
};

/**
 * Get current project data from Yjs
 */
export const getProjectFromYjs = (): any => {
  const projectData: any = {};
  yProject.forEach((value, key) => {
    projectData[key] = value;
  });
  return projectData;
};

/**
 * Get current settings from Yjs
 */
export const getSettingsFromYjs = (): any => {
  const settingsData: any = {};
  ySettings.forEach((value, key) => {
    settingsData[key] = value;
  });
  return settingsData;
};

/**
 * Get current collaborators
 */
export const getCollaborators = (): Map<string, any> => {
  const collaborators = new Map();
  yCollaborators.forEach((value, key) => {
    collaborators.set(key, value);
  });
  return collaborators;
};

/**
 * Set conflict resolution strategy
 */
export const setConflictResolutionStrategy = (strategy: ConflictResolutionStrategy): void => {
  currentConflictStrategy = strategy;
  console.log(`Yjs: Conflict resolution strategy set to ${strategy}`);
};

/**
 * Get current conflict resolution strategy
 */
export const getConflictResolutionStrategy = (): ConflictResolutionStrategy => {
  return currentConflictStrategy;
};

/**
 * Disconnect from collaboration
 */
export const disconnectYjsCollaboration = (): void => {
  if (webrtcProvider) {
    webrtcProvider.destroy();
    webrtcProvider = null;
  }

  if (indexeddbProvider) {
    indexeddbProvider.destroy();
    indexeddbProvider = null;
  }

  isProviderInitialized = false;
  console.log('Yjs: Collaboration disconnected');
};

/**
 * Force sync with remote peers
 */
export const forceSync = (): void => {
  if (webrtcProvider) {
    (webrtcProvider as any).sync?.();
    console.log('Yjs: Forced sync with remote peers');
  }
};

/**
 * Get connection status
 */
export const getConnectionStatus = (): string => {
  if (!webrtcProvider) return 'disconnected';
  return (
    (webrtcProvider as any).room?.status ||
    (webrtcProvider.connected ? 'connected' : 'disconnected')
  );
};

/**
 * Get peer count
 */
export const getPeerCount = (): number => {
  if (!webrtcProvider) return 0;
  return (webrtcProvider as any).room?.peers?.size || 0;
};
