/**
 * Unit tests for Device Capability Detector
 * Part of Phase 5.1.2: Add unit tests for critical audio components
 */

import { DeviceCapabilityDetector } from './deviceCapabilities';

describe('DeviceCapabilityDetector', () => {
  let detector: DeviceCapabilityDetector;
  let audioContext: AudioContext;

  beforeEach(() => {
    audioContext = new AudioContext();
    detector = new DeviceCapabilityDetector();
  });

  afterEach(async () => {
    detector.destroy();
    await audioContext.close();
  });

  describe('initialization', () => {
    it('should initialize successfully', () => {
      expect(detector).toBeDefined();
    });

    it('should start with no capabilities detected', () => {
      expect(detector.getCapabilities()).toBeNull();
    });
  });

  describe('capability detection', () => {
    it('should detect CPU capabilities', async () => {
      const capabilities = await detector.detectCapabilities();

      expect(capabilities).toBeDefined();
      expect(capabilities.cpu).toBeDefined();
      expect(capabilities.cpu.cores).toBeGreaterThan(0);
      expect(capabilities.cpu.memory).toBeGreaterThan(0);
      expect(capabilities.cpu.estimatedPerformance).toMatch(/^(low|medium|high|ultra)$/);
    });

    it('should detect audio capabilities', async () => {
      const capabilities = await detector.detectCapabilities();

      expect(capabilities.audio).toBeDefined();
      expect(capabilities.audio.sampleRate).toBeGreaterThan(0);
      expect(capabilities.audio.bufferSize).toBeGreaterThan(0);
      expect(capabilities.audio.latency).toBeGreaterThan(0);
      expect(typeof capabilities.audio.supportsAudioWorklet).toBe('boolean');
    });

    it('should detect browser capabilities', async () => {
      const capabilities = await detector.detectCapabilities();

      expect(capabilities.browser).toBeDefined();
      expect(capabilities.browser.name).toBeDefined();
      expect(capabilities.browser.version).toBeDefined();
      expect(typeof capabilities.browser.supportsWebGL2).toBe('boolean');
      expect(typeof capabilities.browser.supportsWebAssembly).toBe('boolean');
    });

    it('should calculate performance capabilities', async () => {
      const capabilities = await detector.detectCapabilities();

      expect(capabilities.performance).toBeDefined();
      expect(capabilities.performance.qualityPreset).toMatch(/^(low|medium|high|ultra)$/);
      expect(capabilities.performance.recommendedBufferSize).toBeGreaterThan(0);
      expect(capabilities.performance.maxDSPNodes).toBeGreaterThan(0);
      expect(capabilities.performance.maxConcurrentPlugins).toBeGreaterThan(0);
    });
  });

  describe('capability retrieval', () => {
    it('should return detected capabilities', async () => {
      await detector.detectCapabilities();
      const capabilities = detector.getCapabilities();

      expect(capabilities).toBeDefined();
    });

    it('should return null before detection', () => {
      const capabilities = detector.getCapabilities();
      expect(capabilities).toBeNull();
    });
  });

  describe('minimum requirements check', () => {
    it('should check if device meets minimum requirements', async () => {
      await detector.detectCapabilities();
      const meetsRequirements = detector.meetsMinimumRequirements();

      expect(typeof meetsRequirements).toBe('boolean');
    });

    it('should return false before detection', () => {
      const meetsRequirements = detector.meetsMinimumRequirements();
      expect(meetsRequirements).toBe(false);
    });
  });

  describe('capability report', () => {
    it('should generate capability report', async () => {
      await detector.detectCapabilities();
      const report = detector.getCapabilityReport();

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report).toContain('Device Capability Report');
    });

    it('should return message before detection', () => {
      const report = detector.getCapabilityReport();
      expect(report).toContain('not detected yet');
    });
  });

  describe('destruction', () => {
    it('should clear capabilities on destroy', async () => {
      await detector.detectCapabilities();
      detector.destroy();

      expect(detector.getCapabilities()).toBeNull();
    });
  });
});
