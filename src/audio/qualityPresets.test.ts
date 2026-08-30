/**
 * Unit tests for Quality Preset Manager
 * Part of Phase 5.1.2: Add unit tests for critical audio components
 */

import { QualityPresetManager, QUALITY_PRESETS } from './qualityPresets';

describe('QualityPresetManager', () => {
  let presetManager: QualityPresetManager;
  let audioContext: AudioContext;

  beforeEach(() => {
    audioContext = new AudioContext();
    presetManager = new QualityPresetManager(audioContext);
  });

  afterEach(() => {
    presetManager.destroy();
    audioContext.close();
  });

  describe('initialization', () => {
    it('should initialize with medium preset', () => {
      expect(presetManager.getCurrentPreset()).toBe('medium');
    });

    it('should have valid initial configuration', () => {
      const config = presetManager.getCurrentConfig();
      expect(config).toBeDefined();
      expect(config.name).toBe('Medium Quality');
    });
  });

  describe('preset setting', () => {
    it('should set low preset', () => {
      presetManager.setPreset('low');
      expect(presetManager.getCurrentPreset()).toBe('low');
    });

    it('should set high preset', () => {
      presetManager.setPreset('high');
      expect(presetManager.getCurrentPreset()).toBe('high');
    });

    it('should set ultra preset', () => {
      presetManager.setPreset('ultra');
      expect(presetManager.getCurrentPreset()).toBe('ultra');
    });

    it('should notify listeners on preset change', (done) => {
      presetManager.subscribe((preset) => {
        if (preset === 'high') {
          done();
        }
      });
      presetManager.setPreset('high');
    });
  });

  describe('preset configuration', () => {
    it('should get preset configuration', () => {
      const config = presetManager.getPresetConfig('high');
      expect(config).toBeDefined();
      expect(config.name).toBe('High Quality');
      expect(config.bufferSize).toBe(512);
    });

    it('should have correct buffer sizes for presets', () => {
      expect(QUALITY_PRESETS.low.bufferSize).toBe(2048);
      expect(QUALITY_PRESETS.medium.bufferSize).toBe(1024);
      expect(QUALITY_PRESETS.high.bufferSize).toBe(512);
      expect(QUALITY_PRESETS.ultra.bufferSize).toBe(256);
    });

    it('should have correct max DSP nodes for presets', () => {
      expect(QUALITY_PRESETS.low.maxDSPNodes).toBe(8);
      expect(QUALITY_PRESETS.medium.maxDSPNodes).toBe(16);
      expect(QUALITY_PRESETS.high.maxDSPNodes).toBe(32);
      expect(QUALITY_PRESETS.ultra.maxDSPNodes).toBe(64);
    });
  });

  describe('auto-selection', () => {
    it('should auto-select ultra preset for high-end device', () => {
      const preset = presetManager.autoSelectPreset(8, 16, true);
      expect(preset).toBe('ultra');
    });

    it('should auto-select high preset for mid-high device', () => {
      const preset = presetManager.autoSelectPreset(6, 8, true);
      expect(preset).toBe('high');
    });

    it('should auto-select medium preset for mid-range device', () => {
      const preset = presetManager.autoSelectPreset(4, 4, true);
      expect(preset).toBe('medium');
    });

    it('should auto-select low preset for low-end device', () => {
      const preset = presetManager.autoSelectPreset(2, 2, false);
      expect(preset).toBe('low');
    });
  });

  describe('feature checks', () => {
    it('should check if AudioWorklets are enabled', () => {
      presetManager.setPreset('low');
      expect(presetManager.isFeatureEnabled('enableAudioWorklets')).toBe(false);

      presetManager.setPreset('medium');
      expect(presetManager.isFeatureEnabled('enableAudioWorklets')).toBe(true);
    });

    it('should check if parameter smoothing is enabled', () => {
      presetManager.setPreset('low');
      expect(presetManager.isFeatureEnabled('enableParameterSmoothing')).toBe(false);

      presetManager.setPreset('medium');
      expect(presetManager.isFeatureEnabled('enableParameterSmoothing')).toBe(true);
    });
  });

  describe('preset navigation', () => {
    it('should get next higher preset', () => {
      presetManager.setPreset('medium');
      const next = presetManager.getNextHigherPreset();
      expect(next).toBe('high');
    });

    it('should return null when at highest preset', () => {
      presetManager.setPreset('ultra');
      const next = presetManager.getNextHigherPreset();
      expect(next).toBeNull();
    });

    it('should get next lower preset', () => {
      presetManager.setPreset('high');
      const next = presetManager.getNextLowerPreset();
      expect(next).toBe('medium');
    });

    it('should return null when at lowest preset', () => {
      presetManager.setPreset('low');
      const next = presetManager.getNextLowerPreset();
      expect(next).toBeNull();
    });

    it('should upgrade preset', () => {
      presetManager.setPreset('medium');
      const upgraded = presetManager.upgradePreset();
      expect(upgraded).toBe(true);
      expect(presetManager.getCurrentPreset()).toBe('high');
    });

    it('should not upgrade when at highest', () => {
      presetManager.setPreset('ultra');
      const upgraded = presetManager.upgradePreset();
      expect(upgraded).toBe(false);
    });

    it('should downgrade preset', () => {
      presetManager.setPreset('high');
      const downgraded = presetManager.downgradePreset();
      expect(downgraded).toBe(true);
      expect(presetManager.getCurrentPreset()).toBe('medium');
    });

    it('should not downgrade when at lowest', () => {
      presetManager.setPreset('low');
      const downgraded = presetManager.downgradePreset();
      expect(downgraded).toBe(false);
    });
  });

  describe('preset comparison', () => {
    it('should compare presets correctly', () => {
      expect(presetManager.comparePresets('low', 'high')).toBeLessThan(0);
      expect(presetManager.comparePresets('high', 'low')).toBeGreaterThan(0);
      expect(presetManager.comparePresets('medium', 'medium')).toBe(0);
    });
  });

  describe('configuration getters', () => {
    it('should get CPU budget', () => {
      presetManager.setPreset('high');
      const budget = presetManager.getCPUBudget();
      expect(budget).toBe(70);
    });

    it('should get max DSP nodes', () => {
      presetManager.setPreset('ultra');
      const maxNodes = presetManager.getMaxDSPNodes();
      expect(maxNodes).toBe(64);
    });

    it('should get max concurrent plugins', () => {
      presetManager.setPreset('high');
      const maxPlugins = presetManager.getMaxConcurrentPlugins();
      expect(maxPlugins).toBe(12);
    });

    it('should get target latency', () => {
      presetManager.setPreset('ultra');
      const latency = presetManager.getTargetLatency();
      expect(latency).toBe(0.006);
    });

    it('should get buffer size', () => {
      presetManager.setPreset('medium');
      const bufferSize = presetManager.getBufferSize();
      expect(bufferSize).toBe(1024);
    });

    it('should get smoothing time', () => {
      presetManager.setPreset('high');
      const smoothingTime = presetManager.getSmoothingTime();
      expect(smoothingTime).toBe(0.01);
    });

    it('should get sample rate', () => {
      presetManager.setPreset('ultra');
      const sampleRate = presetManager.getSampleRate();
      expect(sampleRate).toBe(48000);
    });
  });

  describe('subscription', () => {
    it('should subscribe to preset changes', (done) => {
      let callCount = 0;
      presetManager.subscribe((preset) => {
        callCount++;
        if (callCount === 2) done();
      });
      presetManager.setPreset('high');
      presetManager.setPreset('ultra');
    });

    it('should unsubscribe from preset changes', (done) => {
      let callCount = 0;
      const unsubscribe = presetManager.subscribe(() => {
        callCount++;
      });

      unsubscribe();
      presetManager.setPreset('high');

      setTimeout(() => {
        expect(callCount).toBe(1); // Only initial call
        done();
      }, 100);
    });
  });

  describe('audio context', () => {
    it('should set audio context', () => {
      const newContext = new AudioContext();
      presetManager.setAudioContext(newContext);
      expect(presetManager.getCurrentConfig()).toBeDefined();
      newContext.close();
    });
  });

  describe('destruction', () => {
    it('should clear listeners on destroy', () => {
      presetManager.subscribe(() => {});
      presetManager.destroy();
      // No way to directly check listeners, but should not throw
      expect(presetManager.getCurrentPreset()).toBe('medium');
    });
  });
});
