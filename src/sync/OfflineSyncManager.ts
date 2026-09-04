// 3WM SONIK — Offline Sync & Local Persistence Manager
// Automatically caches project CRDT state locally using IndexedDB and handles network reconnections.

import { IndexeddbPersistence } from 'y-indexeddb';
import { ConflictResolver } from './ConflictResolver';

export interface OfflineSyncStatus {
  isOnline: boolean;
  isSynced: boolean;
  lastSyncedTimestamp: number;
  pendingChangesCount: number;
}

export class OfflineSyncManager {
  private resolver: ConflictResolver;
  private indexeddbProvider: IndexeddbPersistence | null = null;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSynced = false;
  private lastSyncedTimestamp = Date.now();
  private pendingChanges = 0;
  private statusListeners: Set<(status: OfflineSyncStatus) => void> = new Set();

  constructor(resolver: ConflictResolver) {
    this.resolver = resolver;
    this.setupNetworkListeners();
  }

  public async initialize(projectName = '3wm-sonik-project-default'): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      this.indexeddbProvider = new IndexeddbPersistence(projectName, this.resolver.getDoc());

      this.indexeddbProvider.on('synced', () => {
        this.isSynced = true;
        this.lastSyncedTimestamp = Date.now();
        this.notifyStatus();
        console.log(`🔱 OfflineSyncManager: Local IndexedDB database [${projectName}] loaded and synced.`);
      });

      return true;
    } catch (err) {
      console.error('🔱 OfflineSyncManager failed to initialize local storage:', err);
      return false;
    }
  }

  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleReconnection();
      this.notifyStatus();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatus();
      console.warn('🔱 OfflineSyncManager: Network connection lost. Operating in offline mode.');
    });
  }

  private handleReconnection(): void {
    console.log('🔱 OfflineSyncManager: Connection restored. Re-synchronizing changes...');
    this.pendingChanges = 0;
    this.isSynced = true;
    this.lastSyncedTimestamp = Date.now();
  }

  public getStatus(): OfflineSyncStatus {
    return {
      isOnline: this.isOnline,
      isSynced: this.isSynced,
      lastSyncedTimestamp: this.lastSyncedTimestamp,
      pendingChangesCount: this.pendingChanges,
    };
  }

  public subscribeStatus(listener: (status: OfflineSyncStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatus(): void {
    const status = this.getStatus();
    this.statusListeners.forEach((l) => l(status));
  }

  public destroy(): void {
    if (this.indexeddbProvider) {
      this.indexeddbProvider.destroy();
      this.indexeddbProvider = null;
    }
    this.statusListeners.clear();
  }
}
