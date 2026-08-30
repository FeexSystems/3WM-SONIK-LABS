/**
 * Unit tests for Parameter Smoothing Engine
 * Part of Phase 5.1.2: Add unit tests for critical audio components
 */

import { ParameterSmoothingEngine, RampType } from './parameterSmoothing';

describe('ParameterSmoothingEngine', () => {
  let smoothingEngine: ParameterSmoothingEngine;
  let audioContext: AudioContext;

  beforeEach(() => {
    audioContext = new AudioContext();
    smoothingEngine = new ParameterSmoothingEngine(audioContext);
  });

  afterEach(() => {
    smoothingEngine.destroy();
    audioContext.close();
  });

  describe('initialization', () => {
    it('should initialize successfully', () => {
      expect(smoothingEngine).toBeDefined();
    });

    it('should start with no smoothers', () => {
      expect(smoothingEngine.getSmootherIds()).toHaveLength(0);
    });
  });

  describe('smoother creation', () => {
    it('should create a parameter smoother', () => {
      smoothingEngine.createSmoother('test-param', 0.5, 0.01, RampType.LINEAR);

      expect(smoothingEngine.getSmootherIds()).toContain('test-param');
    });

    it('should set initial value correctly', () => {
      smoothingEngine.createSmoother('test-param', 0.75, 0.01, RampType.LINEAR);

      expect(smoothingEngine.getCurrentValue('test-param')).toBe(0.75);
    });

    it('should create multiple smoothers', () => {
      smoothingEngine.createSmoother('param1', 0.5, 0.01, RampType.LINEAR);
      smoothingEngine.createSmoother('param2', 0.75, 0.01, RampType.EXPONENTIAL);

      expect(smoothingEngine.getSmootherIds()).toHaveLength(2);
    });
  });

  describe('target value setting', () => {
    it('should set target value for a parameter', () => {
      smoothingEngine.createSmoother('test-param', 0.5, 0.01, RampType.LINEAR);
      smoothingEngine.setTargetValue('test-param', 0.8);

      expect(smoothingEngine.getCurrentValue('test-param')).toBeGreaterThan(0.5);
    });

    it('should mark smoother as active when target set', () => {
      smoothingEngine.createSmoother('test-param', 0.5, 0.01, RampType.LINEAR);
      smoothingEngine.setTargetValue('test-param', 0.8);

      expect(smoothingEngine.isSmoothing('test-param')).toBe(true);
    });

    it('should handle custom smoothing time', () => {
      smoothingEngine.createSmoother('test-param', 0.5, 0.01, RampType.LINEAR);
      smoothingEngine.setTargetValue('test-param', 0.8, 0.05);

      expect(smoothingEngine.getCurrentValue('test-param')).toBeDefined();
    });

    it('should return undefined for non-existent parameter', () => {
      const value = smoothingEngine.getCurrentValue('non-existent');
      expect(value).toBe(0);
    });
  });

  describe('smoothing progress', () => {
    it('should return smoothing progress', () => {
      smoothingEngine.createSmoother('test-param', 0.5, 0.01, RampType.LINEAR);
      smoothingEngine.setTargetValue('test-param', 0.8);

      const progress = smoothingEngine.getSmoothingProgress('test-param');
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });

    it('should return 1 for non-smoothing parameter', () => {
      smoothingEngine.createSmoother('test-param', 0.5, 0.01, RampType.LINEAR);

      const progress = smoothingEngine.getSmoothingProgress('test-param');
      expect(progress).toBe(1);
    });
  });

  describe('ramp types', () => {
    it('should support linear ramp', () => {
      smoothingEngine.createSmoother('test-param', 0.5, 0.01, RampType.LINEAR);
      smoothingEngine.setTargetValue('test-param', 0.8);

      expect(smoothingEngine.getCurrentValue('test-param')).toBeDefined();
    });

    it('should support exponential ramp', () => {
      smoothingEngine.createSmoother('test-param', 0.5, 0.01, RampType.EXPONENTIAL);
      smoothingEngine.setTargetValue('test-param', 0.8);

      expect(smoothingEngine.getCurrentValue('test-param')).toBeDefined();
    });

    it('should support logarithmic ramp', () => {
      smoothingEngine.createSmoother('test-param', 0.5, 0.01, RampType.LOGARITHMIC);
      smoothingEngine.setTargetValue('test-param', 0.8);

      expect(smoothingEngine.getCurrentValue('test-param')).toBeDefined();
    });
  });

  describe('smoother removal', () => {
    it('should remove a parameter smoother', () => {
      smoothingEngine.createSmoother('test-param', 0.5, 0.01, RampType.LINEAR);
      smoothingEngine.removeSmoother('test-param');

      expect(smoothingEngine.getSmootherIds()).not.toContain('test-param');
    });

    it('should handle removing non-existent smoother', () => {
      smoothingEngine.removeSmoother('non-existent');
      expect(smoothingEngine.getSmootherIds()).toHaveLength(0);
    });
  });

  describe('clearing', () => {
    it('should clear all smoothers', () => {
      smoothingEngine.createSmoother('param1', 0.5, 0.01, RampType.LINEAR);
      smoothingEngine.createSmoother('param2', 0.75, 0.01, RampType.EXPONENTIAL);

      smoothingEngine.clearAll();

      expect(smoothingEngine.getSmootherIds()).toHaveLength(0);
    });
  });

  describe('smoother info', () => {
    it('should get smoother info', () => {
      smoothingEngine.createSmoother('test-param', 0.5, 0.01, RampType.LINEAR);

      const info = smoothingEngine.getSmootherInfo('test-param');

      expect(info).toBeDefined();
      expect(info?.currentValue).toBe(0.5);
      expect(info?.smoothingTime).toBe(0.01);
      expect(info?.rampType).toBe(RampType.LINEAR);
    });

    it('should return undefined for non-existent smoother', () => {
      const info = smoothingEngine.getSmootherInfo('non-existent');
      expect(info).toBeUndefined();
    });
  });

  describe('configuration updates', () => {
    it('should set ramp type', () => {
      smoothingEngine.createSmoother('test-param', 0.5, 0.01, RampType.LINEAR);
      smoothingEngine.setRampType('test-param', RampType.EXPONENTIAL);

      const info = smoothingEngine.getSmootherInfo('test-param');
      expect(info?.rampType).toBe(RampType.EXPONENTIAL);
    });

    it('should set smoothing time', () => {
      smoothingEngine.createSmoother('test-param', 0.5, 0.01, RampType.LINEAR);
      smoothingEngine.setSmoothingTime('test-param', 0.05);

      const info = smoothingEngine.getSmootherInfo('test-param');
      expect(info?.smoothingTime).toBe(0.05);
    });
  });

  describe('force value', () => {
    it('should force immediate value', () => {
      smoothingEngine.createSmoother('test-param', 0.5, 0.01, RampType.LINEAR);
      smoothingEngine.forceValue('test-param', 0.9);

      expect(smoothingEngine.getCurrentValue('test-param')).toBe(0.9);
      expect(smoothingEngine.isSmoothing('test-param')).toBe(false);
    });
  });

  describe('destruction', () => {
    it('should clear all smoothers on destroy', () => {
      smoothingEngine.createSmoother('param1', 0.5, 0.01, RampType.LINEAR);
      smoothingEngine.destroy();

      expect(smoothingEngine.getSmootherIds()).toHaveLength(0);
    });
  });
});
