/**
 * 3WM SONIK — DSP Manager Tests
 * Tests for DSP manager integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dspManager } from './dspManager';

// Mock AudioContext
global.AudioContext = vi.fn(() => ({
  createScriptProcessor: vi.fn(),
  createAnalyser: vi.fn(),
  destination: {},
  sampleRate: 44100,
  state: 'running',
})) as any;

describe('DSP Manager', () => {
  beforeEach(() => {
    // Reset DSP manager state before each test
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with AudioContext', async () => {
      const ctx = new AudioContext();
      await dspManager.initialize(ctx);
      expect(dspManager.isReady()).toBe(true);
    });

    it('should detect mode (worklet or fallback)', async () => {
      const ctx = new AudioContext();
      await dspManager.initialize(ctx);
      const mode = dspManager.getMode();
      expect(mode).toMatch(/worklet|fallback/);
    });
  });

  describe('DSP Node Creation', () => {
    it('should create DSP node for track', async () => {
      const ctx = new AudioContext();
      await dspManager.initialize(ctx);
      const node = await dspManager.createDSPNode('test-track');
      expect(node).toBeDefined();
    });

    it('should remove DSP node', async () => {
      const ctx = new AudioContext();
      await dspManager.initialize(ctx);
      await dspManager.createDSPNode('test-track');
      dspManager.removeDSPNode('test-track');
      // Should not throw
    });
  });

  describe('Parameter Setting', () => {
    it('should set DSP parameters', async () => {
      const ctx = new AudioContext();
      await dspManager.initialize(ctx);
      await dspManager.createDSPNode('test-track');

      dspManager.setDSPParameters('test-track', {
        eqLow: 5.0,
        eqMid: 0.0,
        eqHigh: -3.0,
        compThreshold: -20,
        compRatio: 4,
        compAttack: 0.01,
        compRelease: 0.1,
        saturationDrive: 10,
        limiterThreshold: -1,
        limiterRelease: 0.1,
      });

      // Should not throw
    });

    it('should handle invalid track ID', () => {
      dspManager.setDSPParameters('invalid-track', {
        eqLow: 5.0,
        eqMid: 0.0,
        eqHigh: -3.0,
        compThreshold: -20,
        compRatio: 4,
        compAttack: 0.01,
        compRelease: 0.1,
        saturationDrive: 10,
        limiterThreshold: -1,
        limiterRelease: 0.1,
      });
      // Should not throw
    });
  });

  describe('Mode Detection', () => {
    it('should return worklet mode when supported', async () => {
      const ctx = new AudioContext();
      // Mock AudioWorklet support
      (ctx as any).audioWorklet = {
        addModule: vi.fn(() => Promise.resolve()),
      };

      await dspManager.initialize(ctx);
      const mode = dspManager.getMode();
      expect(mode).toBe('worklet');
    });

    it('should return fallback mode when worklet not supported', async () => {
      const ctx = new AudioContext();
      // No audioWorklet support
      await dspManager.initialize(ctx);
      const mode = dspManager.getMode();
      expect(mode).toBe('fallback');
    });
  });
});
