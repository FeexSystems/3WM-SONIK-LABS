// 3WM SONIK — CRDT Conflict Resolution Engine
// Resolves concurrent DAW edits across multiple producers using Yjs CRDT data structures.

import * as Y from 'yjs';

export interface SonikTrackState {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  clips: Array<{
    id: string;
    start: number;
    duration: number;
    name: string;
  }>;
}

export class ConflictResolver {
  private doc: Y.Doc;
  private tracksMap: Y.Map<any>;
  private transportMap: Y.Map<any>;
  private metadataMap: Y.Map<any>;

  constructor(doc?: Y.Doc) {
    this.doc = doc || new Y.Doc();
    this.tracksMap = this.doc.getMap('tracks');
    this.transportMap = this.doc.getMap('transport');
    this.metadataMap = this.doc.getMap('metadata');
  }

  public getDoc(): Y.Doc {
    return this.doc;
  }

  // Atomically apply track updates without race conditions
  public updateTrack(trackId: string, trackData: Partial<SonikTrackState>): void {
    this.doc.transact(() => {
      let trackObj = this.tracksMap.get(trackId);
      if (!trackObj) {
        trackObj = new Y.Map();
        this.tracksMap.set(trackId, trackObj);
      }
      for (const [key, val] of Object.entries(trackData)) {
        trackObj.set(key, val);
      }
    });
  }

  // Set shared global BPM & transport state
  public setBpm(bpm: number): void {
    this.doc.transact(() => {
      this.transportMap.set('bpm', Math.max(20, Math.min(300, bpm)));
      this.transportMap.set('updatedAt', Date.now());
    });
  }

  public getBpm(): number {
    return this.transportMap.get('bpm') || 120;
  }

  // Subscribe to external track changes with automatic deterministic merging
  public observeTracks(callback: (tracks: Record<string, SonikTrackState>) => void): () => void {
    const observer = () => {
      const result: Record<string, SonikTrackState> = {};
      this.tracksMap.forEach((trackMap: Y.Map<any>, trackId: string) => {
        result[trackId] = trackMap.toJSON() as SonikTrackState;
      });
      callback(result);
    };

    this.tracksMap.observeDeep(observer);
    return () => this.tracksMap.unobserveDeep(observer);
  }

  // Export current CRDT state as Uint8Array binary for offline or cloud storage
  public exportState(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  // Apply binary delta updates from remote producers or offline queue
  public applyUpdate(updateBinary: Uint8Array): void {
    Y.applyUpdate(this.doc, updateBinary);
  }
}
