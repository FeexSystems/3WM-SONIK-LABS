import { projectStore } from '../services/projectStore';
import {
  ydoc,
  yTrack,
  yProject,
  ySettings,
  syncTrackToYjs,
  syncProjectToYjs,
  syncSettingsToYjs,
  getTrackFromYjs,
  getProjectFromYjs,
  getSettingsFromYjs,
  ConflictResolutionStrategy,
} from './yjsSetup';
import { StateVersionControl } from './versionControl';

export class ProjectStoreYjsIntegration {
  private versionControl: StateVersionControl;
  private isInitialized: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private conflictStrategy: ConflictResolutionStrategy = ConflictResolutionStrategy.LAST_WRITE_WINS;

  constructor() {
    this.versionControl = new StateVersionControl(ydoc);
  }

  /**
   * Initialize integration between projectStore and Yjs
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Subscribe to projectStore changes and sync to Yjs
    projectStore.subscribeProject((project) => {
      if (project) {
        this.syncProjectToYjs(project);
      }
    });

    // Subscribe to Yjs changes and sync to projectStore
    this.setupYjsObservers();

    // Start periodic sync
    this.startPeriodicSync();

    // Create initial checkpoint
    this.versionControl.createCheckpoint('Initial project state');

    this.isInitialized = true;
    console.log('ProjectStore-Yjs Integration initialized');
  }

  /**
   * Sync projectStore state to Yjs
   */
  private syncProjectToYjs(project: any): void {
    try {
      // Sync track data
      syncTrackToYjs(
        {
          ...project,
          timestamp: Date.now(),
        },
        this.conflictStrategy
      );

      // Sync project metadata
      syncProjectToYjs({
        id: project.id,
        title: project.title,
        bpm: project.bpm,
        key: project.key,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      });

      // Sync settings
      if (project.settings) {
        syncSettingsToYjs(project.settings);
      }
    } catch (error) {
      console.error('Error syncing project to Yjs:', error);
    }
  }

  /**
   * Setup Yjs observers to sync changes back to projectStore
   */
  private setupYjsObservers(): void {
    // Observe track changes
    yTrack.observe((event) => {
      this.handleYjsChange('track', event);
    });

    // Observe project changes
    yProject.observe((event) => {
      this.handleYjsChange('project', event);
    });

    // Observe settings changes
    ySettings.observe((event) => {
      this.handleYjsChange('settings', event);
    });
  }

  /**
   * Handle Yjs changes and sync to projectStore
   */
  private handleYjsChange(type: string, event: any): void {
    const currentProject = projectStore.getCurrentProject();
    if (!currentProject) return;

    try {
      switch (type) {
        case 'track':
          this.syncTrackFromYjs(currentProject);
          break;
        case 'project':
          this.syncProjectMetadataFromYjs(currentProject);
          break;
        case 'settings':
          this.syncSettingsFromYjs(currentProject);
          break;
      }
    } catch (error) {
      console.error(`Error syncing ${type} from Yjs:`, error);
    }
  }

  /**
   * Sync track data from Yjs to projectStore
   */
  private syncTrackFromYjs(currentProject: any): void {
    const trackData = getTrackFromYjs();

    projectStore.updateProject(
      {
        ...trackData,
        updatedAt: new Date().toISOString(),
      },
      'Synced from collaborative session',
      'general'
    );
  }

  /**
   * Sync project metadata from Yjs to projectStore
   */
  private syncProjectMetadataFromYjs(currentProject: any): void {
    const projectData = getProjectFromYjs();

    projectStore.updateProject(
      {
        ...projectData,
        updatedAt: new Date().toISOString(),
      },
      'Synced project metadata from collaboration',
      'general'
    );
  }

  /**
   * Sync settings from Yjs to projectStore
   */
  private syncSettingsFromYjs(currentProject: any): void {
    const settingsData = getSettingsFromYjs();

    projectStore.updateProject(
      {
        settings: settingsData,
        updatedAt: new Date().toISOString(),
      },
      'Synced settings from collaboration',
      'general'
    );
  }

  /**
   * Start periodic sync to ensure consistency
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      const currentProject = projectStore.getCurrentProject();
      if (currentProject) {
        this.syncProjectToYjs(currentProject);
      }
    }, 10000); // Sync every 10 seconds
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Set conflict resolution strategy
   */
  setConflictResolutionStrategy(strategy: ConflictResolutionStrategy): void {
    this.conflictStrategy = strategy;
  }

  /**
   * Get conflict resolution strategy
   */
  getConflictResolutionStrategy(): ConflictResolutionStrategy {
    return this.conflictStrategy;
  }

  /**
   * Create a checkpoint
   */
  createCheckpoint(description?: string): string {
    return this.versionControl.createCheckpoint(description);
  }

  /**
   * Restore a checkpoint
   */
  restoreCheckpoint(checkpointId: string): boolean {
    const success = this.versionControl.restoreCheckpoint(checkpointId);
    if (success) {
      const trackData = getTrackFromYjs();
      const currentProject = projectStore.getCurrentProject();
      if (currentProject && trackData) {
        projectStore.updateProject(trackData, 'Restored from checkpoint', 'general');
      }
    }
    return success;
  }

  /**
   * Get all checkpoints
   */
  getCheckpoints() {
    return this.versionControl.getCheckpoints();
  }

  /**
   * Get diff between two checkpoints
   */
  getDiff(checkpointId1: string, checkpointId2: string) {
    return this.versionControl.getDiff(checkpointId1, checkpointId2);
  }

  /**
   * Force sync with remote peers
   */
  forceSync(): void {
    const currentProject = projectStore.getCurrentProject();
    if (currentProject) {
      this.syncProjectToYjs(currentProject);
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isInitialized: boolean;
    conflictStrategy: ConflictResolutionStrategy;
    checkpointCount: number;
  } {
    return {
      isInitialized: this.isInitialized,
      conflictStrategy: this.conflictStrategy,
      checkpointCount: this.versionControl.getCheckpoints().length,
    };
  }

  /**
   * Destroy integration
   */
  destroy(): void {
    this.stopPeriodicSync();
    this.versionControl.destroy();
    this.isInitialized = false;
    console.log('ProjectStore-Yjs Integration destroyed');
  }
}

// Export singleton instance
export const projectStoreYjsIntegration = new ProjectStoreYjsIntegration();
