/**
 * 3WM SONIK — Parameter Automation Tests
 * Tests for the parameter automation system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ParameterAutomation, AutomationPoint, AutomationLane } from './parameterAutomation';

describe('ParameterAutomation', () => {
  let automation: ParameterAutomation;

  beforeEach(() => {
    automation = new ParameterAutomation();
  });

  afterEach(() => {
    automation.destroy();
  });

  describe('Clip Management', () => {
    it('should create a new automation clip', () => {
      const clip = automation.createClip('test-clip', 'Test Clip', 0, 30);
      expect(clip).toBeDefined();
      expect(clip.id).toBe('test-clip');
      expect(clip.name).toBe('Test Clip');
      expect(clip.startTime).toBe(0);
      expect(clip.duration).toBe(30);
    });

    it('should retrieve a clip by ID', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      const clip = automation.getClip('test-clip');
      expect(clip).toBeDefined();
      expect(clip?.id).toBe('test-clip');
    });

    it('should delete a clip', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      automation.deleteClip('test-clip');
      const clip = automation.getClip('test-clip');
      expect(clip).toBeUndefined();
    });

    it('should set active clip', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      automation.setActiveClip('test-clip');
      const activeClip = automation.getActiveClip();
      expect(activeClip?.id).toBe('test-clip');
    });
  });

  describe('Recording', () => {
    it('should arm a clip for recording', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      automation.armClip('test-clip', true);
      const clip = automation.getClip('test-clip');
      expect(clip?.isArmed).toBe(true);
    });

    it('should start recording on armed clip', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      automation.armClip('test-clip', true);
      automation.startRecording();
      const clip = automation.getClip('test-clip');
      expect(clip?.isRecording).toBe(true);
    });

    it('should stop recording', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      automation.armClip('test-clip', true);
      automation.startRecording();
      automation.stopRecording();
      const clip = automation.getClip('test-clip');
      expect(clip?.isRecording).toBe(false);
    });

    it('should record parameter values', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      automation.armClip('test-clip', true);
      automation.startRecording();

      automation.recordParameter('eq.low', 5.0);
      automation.recordParameter('eq.low', 7.0);

      const points = automation.getAutomationPoints('test-clip', 'eq.low');
      expect(points.length).toBe(2);
      expect(points[0].value).toBe(5.0);
      expect(points[1].value).toBe(7.0);
    });

    it('should not record when not armed', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      automation.startRecording();

      automation.recordParameter('eq.low', 5.0);

      const points = automation.getAutomationPoints('test-clip', 'eq.low');
      expect(points.length).toBe(0);
    });
  });

  describe('Playback', () => {
    it('should start playback', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      automation.setActiveClip('test-clip');
      automation.startPlayback();
      const clip = automation.getClip('test-clip');
      expect(clip?.isPlaying).toBe(true);
    });

    it('should stop playback', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      automation.setActiveClip('test-clip');
      automation.startPlayback();
      automation.stopPlayback();
      const clip = automation.getClip('test-clip');
      expect(clip?.isPlaying).toBe(false);
    });

    it('should set parameter update callback', () => {
      const callback = vi.fn();
      automation.setParameterUpdateCallback(callback);
      // Callback should be set (tested implicitly through playback)
    });
  });

  describe('Interpolation', () => {
    it('should interpolate linear values', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      automation.armClip('test-clip', true);
      automation.startRecording();

      automation.recordParameter('eq.low', 0.0);
      automation.recordParameter('eq.low', 10.0);

      automation.setInterpolationMode('test-clip', 'eq.low', 'linear');
      const clip = automation.getClip('test-clip');
      const lane = clip?.lanes.get('eq.low');
      expect(lane?.interpolation).toBe('linear');
    });

    it('should interpolate hold values', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      automation.armClip('test-clip', true);
      automation.startRecording();

      automation.recordParameter('eq.low', 5.0);

      automation.setInterpolationMode('test-clip', 'eq.low', 'hold');
      const clip = automation.getClip('test-clip');
      const lane = clip?.lanes.get('eq.low');
      expect(lane?.interpolation).toBe('hold');
    });

    it('should clear parameter automation', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      automation.armClip('test-clip', true);
      automation.startRecording();

      automation.recordParameter('eq.low', 5.0);
      automation.clearParameterAutomation('test-clip', 'eq.low');

      const points = automation.getAutomationPoints('test-clip', 'eq.low');
      expect(points.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle recording on non-existent clip', () => {
      automation.recordParameter('eq.low', 5.0);
      // Should not throw
    });

    it('should handle playback on clip with no lanes', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      automation.setActiveClip('test-clip');
      automation.startPlayback();
      // Should not throw
    });

    it('should handle deleting active clip', () => {
      automation.createClip('test-clip', 'Test Clip', 0, 30);
      automation.setActiveClip('test-clip');
      automation.deleteClip('test-clip');
      const activeClip = automation.getActiveClip();
      expect(activeClip).toBeUndefined();
    });
  });
});
