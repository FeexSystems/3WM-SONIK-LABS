/**
 * Unit tests for Project Store Service
 * Part of Phase 5.1.4: Cover state management logic (projectStore, worldState, memory)
 */

import { ProjectStoreService } from './projectStore';
import { Track, TrackSettings } from '../types';

const defaultSettings: TrackSettings = {
  volume: 0.8,
  pan: 0,
  eq: { low: 0, mid: 0, high: 0 },
  compression: { threshold: -18, ratio: 3, attack: 20, release: 100, makeupGain: 2 },
  reverb: { type: 'shrine', amount: 20, decay: 2.0 },
  mastering: {
    preset: 'Lagos Bounce',
    limiterCeiling: -0.1,
    targetLufs: -14,
    warmthSaturation: 50,
    stereoWidth: 100,
  },
};

function createMockTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'test-track',
    title: 'Test Track',
    artist: '3WM Producer',
    genre: 'Afrofusion',
    bpm: 112,
    key: 'F# Minor',
    duration: 180,
    createdAt: new Date().toISOString(),
    status: 'DRAFT',
    settings: defaultSettings,
    stems: [],
    history: [],
    ...overrides,
  };
}

describe('ProjectStoreService', () => {
  let store: ProjectStoreService;

  beforeEach(() => {
    store = new ProjectStoreService();
  });

  afterEach(() => {
    // Clean up any timers
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize successfully', () => {
      expect(store).toBeDefined();
    });

    it('should start with no current project', () => {
      expect(store.getCurrentProject()).toBeNull();
    });

    it('should start with saved status', () => {
      const state = store.getAutoSaveState();
      expect(state.status).toBe('saved');
    });

    it('should start with empty history', () => {
      const history = store.getHistoryState();
      expect(history.canUndo).toBe(false);
      expect(history.canRedo).toBe(false);
      expect(history.undoCount).toBe(0);
      expect(history.redoCount).toBe(0);
    });
  });

  describe('project loading', () => {
    it('should load a project', () => {
      const mockProject = createMockTrack();

      store.loadProject(mockProject);

      const loaded = store.getCurrentProject();
      expect(loaded).toEqual(mockProject);
    });

    it('should notify project listeners on load', (done) => {
      const mockProject = createMockTrack();

      store.subscribeProject((project) => {
        if (project.id === 'test-track') {
          done();
        }
      });

      store.loadProject(mockProject);
    });
  });

  describe('auto-save status', () => {
    it('should mark project as dirty on update', () => {
      const mockProject = createMockTrack();

      store.loadProject(mockProject);
      store.updateProject({ title: 'Updated Track' });

      const state = store.getAutoSaveState();
      expect(state.status).toBe('dirty');
      expect(state.pendingChangesCount).toBeGreaterThan(0);
    });

    it('should get initial auto-save state', () => {
      const state = store.getAutoSaveState();

      expect(state).toBeDefined();
      expect(state.status).toBe('saved');
      expect(state.pendingChangesCount).toBe(0);
    });
  });

  describe('history management', () => {
    it('should push to undo stack on update', () => {
      const mockProject = createMockTrack();

      store.loadProject(mockProject);
      store.updateProject({ title: 'Updated Track' }, 'Update title');

      const history = store.getHistoryState();
      expect(history.canUndo).toBe(true);
      expect(history.undoCount).toBe(1);
      expect(history.lastAction).toBe('Update title');
    });

    it('should undo last action', () => {
      const mockProject = createMockTrack();

      store.loadProject(mockProject);
      store.updateProject({ title: 'Updated Track' }, 'Update title');
      store.undo();

      const project = store.getCurrentProject();
      expect(project?.title).toBe('Test Track');

      const history = store.getHistoryState();
      expect(history.canUndo).toBe(false);
      expect(history.canRedo).toBe(true);
    });

    it('should redo undone action', () => {
      const mockProject = createMockTrack();

      store.loadProject(mockProject);
      store.updateProject({ title: 'Updated Track' }, 'Update title');
      store.undo();
      store.redo();

      const project = store.getCurrentProject();
      expect(project?.title).toBe('Updated Track');

      const history = store.getHistoryState();
      expect(history.canUndo).toBe(true);
      expect(history.canRedo).toBe(false);
    });

    it('should clear redo stack on new action', () => {
      const mockProject = createMockTrack();

      store.loadProject(mockProject);
      store.updateProject({ title: 'Updated Track' }, 'Update title');
      store.undo();
      store.updateProject({ title: 'Another Update' }, 'Another update');

      const history = store.getHistoryState();
      expect(history.canRedo).toBe(false);
    });

    it('should limit undo stack size', () => {
      const mockProject = createMockTrack();

      store.loadProject(mockProject);

      // Add more than MAX_HISTORY_LEVELS actions
      for (let i = 0; i < 60; i++) {
        store.updateProject({ title: `Track ${i}` }, `Update ${i}`);
      }

      const history = store.getHistoryState();
      expect(history.undoCount).toBeLessThanOrEqual(50);
    });

    it('should notify history listeners on change', (done) => {
      store.subscribeHistory((history) => {
        if (history.canUndo) {
          done();
        }
      });

      const mockProject = createMockTrack();

      store.loadProject(mockProject);
      store.updateProject({ title: 'Updated Track' }, 'Update title');
    });
  });

  describe('subscriptions', () => {
    it('should unsubscribe from status updates', () => {
      let callCount = 0;
      const unsubscribe = store.subscribeStatus(() => {
        callCount++;
      });

      unsubscribe();
      store.updateProject({ title: 'Test' });

      expect(callCount).toBe(1); // Only initial call
    });

    it('should unsubscribe from project updates', () => {
      let callCount = 0;
      const unsubscribe = store.subscribeProject(() => {
        callCount++;
      });

      unsubscribe();

      const mockProject = createMockTrack();

      store.loadProject(mockProject);

      expect(callCount).toBe(0); // No initial call since no project loaded
    });

    it('should unsubscribe from history updates', () => {
      let callCount = 0;
      const unsubscribe = store.subscribeHistory(() => {
        callCount++;
      });

      unsubscribe();
      store.updateProject({ title: 'Test' }, 'Test');

      expect(callCount).toBe(1); // Only initial call
    });
  });

  describe('error handling', () => {
    it('should handle undo with no history', () => {
      const result = store.undo();
      expect(result).toBe(false);
    });

    it('should handle redo with no history', () => {
      const result = store.redo();
      expect(result).toBe(false);
    });
  });
});
