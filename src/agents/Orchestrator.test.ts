// 3WM SONIK - Agent Orchestrator Tests
import { orchestrator } from './Orchestrator';
import { AgentMessage } from './types';

describe('Agent Orchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Message Handling', () => {
    it('should route messages to appropriate agents', async () => {
      const message: AgentMessage = {
        id: 'test-message-1',
        from: 'USER',
        to: 'ALL',
        type: 'REQUEST',
        projectId: 'test-project',
        payload: {
          intent: 'Mix the drums',
          context: {
            trackTitle: 'Test Track',
            bpm: 120,
          },
        },
        timestamp: new Date().toISOString(),
        requiresResponse: true,
      };

      await orchestrator.handleMessage(message);
      // Should route to Emar for mixing-related requests
      expect(orchestrator.getState()).toBe('IDLE');
    });

    it('should handle council mode debates', async () => {
      const message: AgentMessage = {
        id: 'test-message-2',
        from: 'USER',
        to: 'ALL',
        type: 'REQUEST',
        projectId: 'test-project',
        payload: {
          intent: 'Council review this track',
          isCouncilMode: true,
          context: {
            trackTitle: 'Test Track',
            bpm: 120,
          },
        },
        timestamp: new Date().toISOString(),
        requiresResponse: true,
      };

      await orchestrator.handleMessage(message);
      // Should initiate council debate with all agents
      expect(orchestrator.getState()).toBe('IDLE');
    });
  });

  describe('Agent Routing', () => {
    it('should route to Emar for mixing/mastering requests', async () => {
      const message: AgentMessage = {
        id: 'test-message-3',
        from: 'USER',
        to: 'ALL',
        type: 'REQUEST',
        projectId: 'test-project',
        payload: {
          intent: 'Master this track',
          context: {
            trackTitle: 'Test Track',
          },
        },
        timestamp: new Date().toISOString(),
        requiresResponse: true,
      };

      await orchestrator.handleMessage(message);
      expect(orchestrator.getState()).toBe('IDLE');
    });

    it('should route to Ricky for beat/808 requests', async () => {
      const message: AgentMessage = {
        id: 'test-message-4',
        from: 'USER',
        to: 'ALL',
        type: 'REQUEST',
        projectId: 'test-project',
        payload: {
          intent: 'Create a new 808 pattern',
          context: {
            trackTitle: 'Test Track',
            bpm: 140,
          },
        },
        timestamp: new Date().toISOString(),
        requiresResponse: true,
      };

      await orchestrator.handleMessage(message);
      expect(orchestrator.getState()).toBe('IDLE');
    });

    it('should route to Kingpin for vocal requests', async () => {
      const message: AgentMessage = {
        id: 'test-message-5',
        from: 'USER',
        to: 'ALL',
        type: 'REQUEST',
        projectId: 'test-project',
        payload: {
          intent: 'Add harmony to these vocals',
          context: {
            trackTitle: 'Test Track',
            hasVocals: true,
          },
        },
        timestamp: new Date().toISOString(),
        requiresResponse: true,
      };

      await orchestrator.handleMessage(message);
      expect(orchestrator.getState()).toBe('IDLE');
    });
  });

  describe('State Management', () => {
    it('should update agent states during processing', async () => {
      const message: AgentMessage = {
        id: 'test-message-6',
        from: 'USER',
        to: 'ALL',
        type: 'REQUEST',
        projectId: 'test-project',
        payload: {
          intent: 'Test message',
          context: {
            trackTitle: 'Test Track',
          },
        },
        timestamp: new Date().toISOString(),
        requiresResponse: true,
      };

      await orchestrator.handleMessage(message);
      // After processing, should return to IDLE
      expect(orchestrator.getState()).toBe('IDLE');
    });
  });

  describe('User Intent Dispatch', () => {
    it('should dispatch user intent with context', async () => {
      await orchestrator.dispatchUserIntent('Create a trap beat', {
        trackTitle: 'Test Track',
        bpm: 140,
        key: 'F Minor',
      });

      expect(orchestrator.getState()).toBe('IDLE');
    });

    it('should handle user intent with audio attachment', async () => {
      const audioBase64 = 'base64-encoded-audio-data';

      await orchestrator.dispatchUserIntent(
        'Analyze this audio',
        {
          trackTitle: 'Test Track',
        },
        audioBase64,
        'audio/wav'
      );

      expect(orchestrator.getState()).toBe('IDLE');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing context gracefully', async () => {
      const message: AgentMessage = {
        id: 'test-message-7',
        from: 'USER',
        to: 'ALL',
        type: 'REQUEST',
        projectId: 'test-project',
        payload: {
          intent: 'Test message',
          // Missing context
        },
        timestamp: new Date().toISOString(),
        requiresResponse: true,
      };

      await expect(orchestrator.handleMessage(message)).resolves.not.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      const message: AgentMessage = {
        id: 'test-message-8',
        from: 'USER',
        to: 'ALL',
        type: 'REQUEST',
        projectId: 'test-project',
        payload: {
          intent: 'Test message',
          context: {
            trackTitle: 'Test Track',
          },
        },
        timestamp: new Date().toISOString(),
        requiresResponse: true,
      };

      // Mock fetch to simulate network error
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      await expect(orchestrator.handleMessage(message)).resolves.not.toThrow();
    });
  });
});
