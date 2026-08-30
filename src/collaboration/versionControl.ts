import * as Y from 'yjs';

export interface StateCheckpoint {
  id: string;
  timestamp: number;
  createdBy: string;
  description: string;
  state: any;
}

export class StateVersionControl {
  private ydoc: Y.Doc;
  private checkpoints: Map<string, StateCheckpoint> = new Map();
  private maxCheckpoints: number = 50;
  private autoSaveInterval: number = 5 * 60 * 1000; // 5 minutes
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor(ydoc: Y.Doc) {
    this.ydoc = ydoc;
    this.startAutoSave();
  }

  /**
   * Create a checkpoint of current state
   */
  createCheckpoint(description: string = 'Auto-save checkpoint'): string {
    const id = `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const state = this.serializeState();

    const checkpoint: StateCheckpoint = {
      id,
      timestamp: Date.now(),
      createdBy: this.getUserId(),
      description,
      state,
    };

    this.checkpoints.set(id, checkpoint);
    this.pruneOldCheckpoints();

    console.log(`Version Control: Created checkpoint ${id}`);
    return id;
  }

  /**
   * Restore state from a checkpoint
   */
  restoreCheckpoint(checkpointId: string): boolean {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      console.error(`Version Control: Checkpoint ${checkpointId} not found`);
      return false;
    }

    try {
      this.deserializeState(checkpoint.state);
      console.log(`Version Control: Restored checkpoint ${checkpointId}`);
      return true;
    } catch (error) {
      console.error(`Version Control: Failed to restore checkpoint ${checkpointId}`, error);
      return false;
    }
  }

  /**
   * Get all checkpoints
   */
  getCheckpoints(): StateCheckpoint[] {
    return Array.from(this.checkpoints.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get checkpoint by ID
   */
  getCheckpoint(checkpointId: string): StateCheckpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }

  /**
   * Delete a checkpoint
   */
  deleteCheckpoint(checkpointId: string): boolean {
    return this.checkpoints.delete(checkpointId);
  }

  /**
   * Get state diff between two checkpoints
   */
  getDiff(checkpointId1: string, checkpointId2: string): any {
    const checkpoint1 = this.checkpoints.get(checkpointId1);
    const checkpoint2 = this.checkpoints.get(checkpointId2);

    if (!checkpoint1 || !checkpoint2) {
      throw new Error('One or both checkpoints not found');
    }

    return this.computeDiff(checkpoint1.state, checkpoint2.state);
  }

  /**
   * Start auto-save
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      this.createCheckpoint('Auto-save checkpoint');
    }, this.autoSaveInterval);
  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Serialize current state
   */
  private serializeState(): any {
    const yTrack = this.ydoc.getMap('track');
    const yProject = this.ydoc.getMap('project');
    const ySettings = this.ydoc.getMap('settings');

    const trackData: any = {};
    yTrack.forEach((value, key) => {
      trackData[key] = value;
    });

    const projectData: any = {};
    yProject.forEach((value, key) => {
      projectData[key] = value;
    });

    const settingsData: any = {};
    ySettings.forEach((value, key) => {
      settingsData[key] = value;
    });

    return {
      track: trackData,
      project: projectData,
      settings: settingsData,
    };
  }

  /**
   * Deserialize state to Yjs document
   */
  private deserializeState(state: any): void {
    const yTrack = this.ydoc.getMap('track');
    const yProject = this.ydoc.getMap('project');
    const ySettings = this.ydoc.getMap('settings');

    this.ydoc.transact(() => {
      // Clear existing state
      yTrack.clear();
      yProject.clear();
      ySettings.clear();

      // Restore track state
      if (state.track) {
        Object.keys(state.track).forEach((key) => {
          yTrack.set(key, state.track[key]);
        });
      }

      // Restore project state
      if (state.project) {
        Object.keys(state.project).forEach((key) => {
          yProject.set(key, state.project[key]);
        });
      }

      // Restore settings state
      if (state.settings) {
        Object.keys(state.settings).forEach((key) => {
          ySettings.set(key, state.settings[key]);
        });
      }
    });
  }

  /**
   * Compute diff between two states
   */
  private computeDiff(state1: any, state2: any): any {
    const diff: any = {
      added: {},
      removed: {},
      modified: {},
    };

    const allKeys = new Set([...Object.keys(state1 || {}), ...Object.keys(state2 || {})]);

    allKeys.forEach((key) => {
      const value1 = state1?.[key];
      const value2 = state2?.[key];

      if (value1 === undefined && value2 !== undefined) {
        diff.added[key] = value2;
      } else if (value1 !== undefined && value2 === undefined) {
        diff.removed[key] = value1;
      } else if (JSON.stringify(value1) !== JSON.stringify(value2)) {
        diff.modified[key] = {
          from: value1,
          to: value2,
        };
      }
    });

    return diff;
  }

  /**
   * Prune old checkpoints to maintain max limit
   */
  private pruneOldCheckpoints(): void {
    if (this.checkpoints.size <= this.maxCheckpoints) {
      return;
    }

    const sortedCheckpoints = Array.from(this.checkpoints.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );

    const toRemove = sortedCheckpoints.slice(0, this.checkpoints.size - this.maxCheckpoints);
    toRemove.forEach((checkpoint) => {
      this.checkpoints.delete(checkpoint.id);
    });

    console.log(`Version Control: Pruned ${toRemove.length} old checkpoints`);
  }

  /**
   * Get user ID
   */
  private getUserId(): string {
    const userId = localStorage.getItem('3wm-sonik-user-id');
    if (userId) return userId;

    const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('3wm-sonik-user-id', newId);
    return newId;
  }

  /**
   * Export checkpoints to JSON
   */
  exportCheckpoints(): string {
    const checkpoints = this.getCheckpoints();
    return JSON.stringify(checkpoints, null, 2);
  }

  /**
   * Import checkpoints from JSON
   */
  importCheckpoints(json: string): boolean {
    try {
      const checkpoints = JSON.parse(json) as StateCheckpoint[];
      checkpoints.forEach((checkpoint) => {
        this.checkpoints.set(checkpoint.id, checkpoint);
      });
      this.pruneOldCheckpoints();
      console.log(`Version Control: Imported ${checkpoints.length} checkpoints`);
      return true;
    } catch (error) {
      console.error('Version Control: Failed to import checkpoints', error);
      return false;
    }
  }

  /**
   * Destroy version control
   */
  destroy(): void {
    this.stopAutoSave();
    this.checkpoints.clear();
  }
}
