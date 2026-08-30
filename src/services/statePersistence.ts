// State Persistence Layer for 3WM SONIK
// Provides abstraction for persistent state storage with multiple backend support

export interface StatePersistenceConfig {
  storageType: 'indexeddb' | 'firestore' | 'supabase' | 'memory';
  autoSync: boolean;
  syncInterval: number; // milliseconds
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
}

export interface StateSnapshot {
  id: string;
  timestamp: number;
  version: string;
  data: any;
  metadata?: {
    userId?: string;
    projectId?: string;
    tags?: string[];
  };
}

export interface StateReconciliationResult {
  success: boolean;
  conflicts: Array<{
    path: string;
    localValue: any;
    remoteValue: any;
  }>;
  resolvedState: any;
}

export interface StatePersistence {
  /**
   * Save state to persistent storage
   */
  save(key: string, state: any): Promise<void>;

  /**
   * Load state from persistent storage
   */
  load(key: string): Promise<any>;

  /**
   * Sync state with remote storage
   */
  sync(): Promise<void>;

  /**
   * Reconcile conflicts between local and remote state
   */
  reconcile(remoteState: any): Promise<StateReconciliationResult>;

  /**
   * Create a snapshot of current state
   */
  createSnapshot(label: string): Promise<StateSnapshot>;

  /**
   * Restore from a snapshot
   */
  restoreSnapshot(snapshotId: string): Promise<void>;

  /**
   * Get all available snapshots
   */
  getSnapshots(): Promise<StateSnapshot[]>;

  /**
   * Delete a snapshot
   */
  deleteSnapshot(snapshotId: string): Promise<void>;

  /**
   * Clear all persisted state
   */
  clear(): Promise<void>;

  /**
   * Get storage statistics
   */
  getStatistics(): Promise<{
    totalKeys: number;
    totalSize: number;
    lastSync: number | null;
  }>;
}

/**
 * IndexedDB Persistence Implementation
 */
export class IndexedDBPersistence implements StatePersistence {
  private config: StatePersistenceConfig;
  private dbName: string = '3wm-sonik-state';
  private dbVersion: number = 1;
  private db: IDBDatabase | null = null;

  constructor(config: Partial<StatePersistenceConfig> = {}) {
    this.config = {
      storageType: 'indexeddb',
      autoSync: false,
      syncInterval: 30000, // 30 seconds
      encryptionEnabled: false,
      compressionEnabled: false,
      ...config,
    };
  }

  private async initializeDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for different types of data
        if (!db.objectStoreNames.contains('state')) {
          db.createObjectStore('state', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('snapshots')) {
          db.createObjectStore('snapshots', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  async save(key: string, state: any): Promise<void> {
    try {
      const db = await this.initializeDB();
      const transaction = db.transaction(['state'], 'readwrite');
      const objectStore = transaction.objectStore('state');

      const data = {
        key,
        value: state,
        timestamp: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        const request = objectStore.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Update metadata
      await this.updateMetadata(key, state);
    } catch (error) {
      console.error('Failed to save state to IndexedDB:', error);
      throw error;
    }
  }

  async load(key: string): Promise<any> {
    try {
      const db = await this.initializeDB();
      const transaction = db.transaction(['state'], 'readonly');
      const objectStore = transaction.objectStore('state');

      return new Promise((resolve, reject) => {
        const request = objectStore.get(key);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.value : null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to load state from IndexedDB:', error);
      throw error;
    }
  }

  async sync(): Promise<void> {
    // IndexedDB is local, so sync is a no-op
    // Could be extended to sync with remote storage
    console.log('IndexedDB sync: local storage, no remote sync needed');
  }

  async reconcile(remoteState: any): Promise<StateReconciliationResult> {
    // Simple reconciliation strategy: prefer remote state
    return {
      success: true,
      conflicts: [],
      resolvedState: remoteState,
    };
  }

  async createSnapshot(label: string): Promise<StateSnapshot> {
    try {
      const db = await this.initializeDB();

      // Get all current state
      const allState = await this.getAllState();

      const snapshot: StateSnapshot = {
        id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        version: '1.0.0',
        data: allState,
        metadata: {
          tags: [label],
        },
      };

      const transaction = db.transaction(['snapshots'], 'readwrite');
      const objectStore = transaction.objectStore('snapshots');

      await new Promise<void>((resolve, reject) => {
        const request = objectStore.add(snapshot);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      return snapshot;
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      throw error;
    }
  }

  async restoreSnapshot(snapshotId: string): Promise<void> {
    try {
      const db = await this.initializeDB();
      const transaction = db.transaction(['snapshots', 'state'], 'readwrite');
      const snapshotsStore = transaction.objectStore('snapshots');
      const stateStore = transaction.objectStore('state');

      const snapshot = await new Promise<StateSnapshot | null>((resolve, reject) => {
        const request = snapshotsStore.get(snapshotId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      if (!snapshot) {
        throw new Error('Snapshot not found');
      }

      // Clear existing state
      await new Promise<void>((resolve, reject) => {
        const clearRequest = stateStore.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });

      // Restore state from snapshot
      for (const [key, value] of Object.entries(snapshot.data)) {
        await new Promise<void>((resolve, reject) => {
          const request = stateStore.put({ key, value, timestamp: Date.now() });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    } catch (error) {
      console.error('Failed to restore snapshot:', error);
      throw error;
    }
  }

  async getSnapshots(): Promise<StateSnapshot[]> {
    try {
      const db = await this.initializeDB();
      const transaction = db.transaction(['snapshots'], 'readonly');
      const objectStore = transaction.objectStore('snapshots');

      return new Promise((resolve, reject) => {
        const request = objectStore.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get snapshots:', error);
      throw error;
    }
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    try {
      const db = await this.initializeDB();
      const transaction = db.transaction(['snapshots'], 'readwrite');
      const objectStore = transaction.objectStore('snapshots');

      await new Promise<void>((resolve, reject) => {
        const request = objectStore.delete(snapshotId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.initializeDB();
      const transaction = db.transaction(['state', 'snapshots', 'metadata'], 'readwrite');

      for (const storeName of ['state', 'snapshots', 'metadata']) {
        const objectStore = transaction.objectStore(storeName);
        await new Promise<void>((resolve, reject) => {
          const request = objectStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    } catch (error) {
      console.error('Failed to clear state:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<{
    totalKeys: number;
    totalSize: number;
    lastSync: number | null;
  }> {
    try {
      const db = await this.initializeDB();
      const transaction = db.transaction(['state', 'metadata'], 'readonly');
      const stateStore = transaction.objectStore('state');
      const metadataStore = transaction.objectStore('metadata');

      const stateCount = await new Promise<number>((resolve, reject) => {
        const request = stateStore.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const metadata = await new Promise<any>((resolve, reject) => {
        const request = metadataStore.get('statistics');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      return {
        totalKeys: stateCount,
        totalSize: metadata?.totalSize || 0,
        lastSync: metadata?.lastSync || null,
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw error;
    }
  }

  private async getAllState(): Promise<Record<string, any>> {
    try {
      const db = await this.initializeDB();
      const transaction = db.transaction(['state'], 'readonly');
      const objectStore = transaction.objectStore('state');

      const allData = await new Promise<Record<string, any>>((resolve, reject) => {
        const request = objectStore.getAll();
        request.onsuccess = () => {
          const result: Record<string, any> = {};
          for (const item of request.result) {
            result[item.key] = item.value;
          }
          resolve(result);
        };
        request.onerror = () => reject(request.error);
      });

      return allData;
    } catch (error) {
      console.error('Failed to get all state:', error);
      throw error;
    }
  }

  private async updateMetadata(key: string, state: any): Promise<void> {
    try {
      const db = await this.initializeDB();
      const transaction = db.transaction(['metadata'], 'readwrite');
      const objectStore = transaction.objectStore('metadata');

      const currentState = await new Promise<any>((resolve, reject) => {
        const request = objectStore.get('statistics');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      const size = JSON.stringify(state).length;
      const totalSize = (currentState?.totalSize || 0) + size;

      await new Promise<void>((resolve, reject) => {
        const request = objectStore.put({
          key: 'statistics',
          totalSize,
          lastSync: Date.now(),
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  }
}

/**
 * Supabase Postgres Persistence Implementation
 */
export class SupabasePersistence implements StatePersistence {
  private config: StatePersistenceConfig;
  private supabaseClient: any = null;

  constructor(config: Partial<StatePersistenceConfig> = {}) {
    this.config = {
      storageType: 'supabase',
      autoSync: true,
      syncInterval: 30000,
      encryptionEnabled: false,
      compressionEnabled: false,
      ...config,
    };
  }

  private async initializeDB(): Promise<any> {
    if (this.supabaseClient) return this.supabaseClient;

    try {
      const { supabase } = await import('../lib/supabase');
      this.supabaseClient = supabase;
      return this.supabaseClient;
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      throw error;
    }
  }

  async save(key: string, state: any): Promise<void> {
    try {
      const supabase = await this.initializeDB();

      const { error } = await supabase
        .from('app_state')
        .upsert({ id: key, value: state, updated_at: new Date().toISOString() });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save state to Supabase:', error);
      throw error;
    }
  }

  async load(key: string): Promise<any> {
    try {
      const supabase = await this.initializeDB();

      const { data, error } = await supabase
        .from('app_state')
        .select('value')
        .eq('id', key)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found

      return data ? data.value : null;
    } catch (error) {
      console.error('Failed to load state from Supabase:', error);
      throw error;
    }
  }

  async sync(): Promise<void> {
    // Supabase handles real-time via subscriptions if needed
    console.log('Supabase sync: automatic sync enabled');
  }

  async reconcile(remoteState: any): Promise<StateReconciliationResult> {
    return {
      success: true,
      conflicts: [],
      resolvedState: remoteState,
    };
  }

  async createSnapshot(label: string): Promise<StateSnapshot> {
    try {
      const supabase = await this.initializeDB();
      const allState = await this.getAllState();

      const snapshot: StateSnapshot = {
        id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        version: '1.0.0',
        data: allState,
        metadata: {
          tags: [label],
        },
      };

      const { error } = await supabase
        .from('state_snapshots')
        .insert([
          { id: snapshot.id, snapshot_data: snapshot, created_at: new Date().toISOString() },
        ]);

      if (error) throw error;
      return snapshot;
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      throw error;
    }
  }

  async restoreSnapshot(snapshotId: string): Promise<void> {
    try {
      const supabase = await this.initializeDB();

      const { data, error } = await supabase
        .from('state_snapshots')
        .select('snapshot_data')
        .eq('id', snapshotId)
        .single();

      if (error || !data) {
        throw new Error('Snapshot not found');
      }

      const snapshot = data.snapshot_data as StateSnapshot;

      for (const [key, value] of Object.entries(snapshot.data)) {
        await this.save(key, value);
      }
    } catch (error) {
      console.error('Failed to restore snapshot:', error);
      throw error;
    }
  }

  async getSnapshots(): Promise<StateSnapshot[]> {
    try {
      const supabase = await this.initializeDB();

      const { data, error } = await supabase
        .from('state_snapshots')
        .select('snapshot_data')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((row: any) => row.snapshot_data as StateSnapshot);
    } catch (error) {
      console.error('Failed to get snapshots:', error);
      throw error;
    }
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    try {
      const supabase = await this.initializeDB();

      const { error } = await supabase.from('state_snapshots').delete().eq('id', snapshotId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const supabase = await this.initializeDB();

      // Caution: Delete all state
      const { error } = await supabase.from('app_state').delete().neq('id', '0'); // Delete everything

      if (error) throw error;
    } catch (error) {
      console.error('Failed to clear state:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<{
    totalKeys: number;
    totalSize: number;
    lastSync: number | null;
  }> {
    try {
      const supabase = await this.initializeDB();

      const { data, error } = await supabase.from('app_state').select('id, value');

      if (error) throw error;

      let totalSize = 0;
      for (const doc of data) {
        totalSize += JSON.stringify(doc.value).length;
      }

      return {
        totalKeys: data.length,
        totalSize,
        lastSync: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw error;
    }
  }

  private async getAllState(): Promise<Record<string, any>> {
    try {
      const supabase = await this.initializeDB();

      const { data, error } = await supabase.from('app_state').select('id, value');

      if (error) throw error;

      const result: Record<string, any> = {};
      for (const doc of data) {
        result[doc.id] = doc.value;
      }

      return result;
    } catch (error) {
      console.error('Failed to get all state:', error);
      throw error;
    }
  }
}

/**
 * State Persistence Factory
 */
export class StatePersistenceFactory {
  private static instances: Map<string, StatePersistence> = new Map();

  static createPersistence(config: StatePersistenceConfig): StatePersistence {
    const cacheKey = `${config.storageType}-${config.autoSync}`;

    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey)!;
    }

    let persistence: StatePersistence;

    switch (config.storageType) {
      case 'indexeddb':
        persistence = new IndexedDBPersistence(config);
        break;
      case 'firestore':
      case 'supabase':
        persistence = new SupabasePersistence(config);
        break;
      case 'memory':
        // Memory persistence could be implemented as a simple in-memory Map
        throw new Error('Memory persistence not yet implemented');
      default:
        throw new Error(`Unsupported storage type: ${config.storageType}`);
    }

    this.instances.set(cacheKey, persistence);
    return persistence;
  }

  static clearCache(): void {
    this.instances.clear();
  }
}

/**
 * Convenience function to get state persistence
 */
export function getStatePersistence(config?: Partial<StatePersistenceConfig>): StatePersistence {
  const defaultConfig: StatePersistenceConfig = {
    storageType: 'indexeddb',
    autoSync: false,
    syncInterval: 30000,
    encryptionEnabled: false,
    compressionEnabled: false,
  };

  return StatePersistenceFactory.createPersistence({
    ...defaultConfig,
    ...config,
  });
}
