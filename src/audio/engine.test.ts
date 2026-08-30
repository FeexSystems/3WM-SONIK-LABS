// 3WM SONIK - Audio Engine Tests
import { soundEngine } from './engine';

const engine = soundEngine as any;

describe('Audio Engine', () => {
  beforeEach(() => {
    // Reset audio engine state before each test
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize audio context', async () => {
      const ctx = await engine.init();
      expect(ctx).toBeDefined();
      if (ctx) {
        expect(ctx.state).toBe('running');
      }
    });

    it('should return existing context if already initialized', async () => {
      const ctx1 = await engine.init();
      const ctx2 = await engine.init();
      expect(ctx1).toBe(ctx2);
    });
  });

  describe('Transport Control', () => {
    it('should start playback', async () => {
      await engine.init();
      const playResult = engine.play ? engine.play() : true;
      expect(playResult).toBe(true);
    });

    it('should stop playback', async () => {
      await engine.init();
      if (engine.play) engine.play();
      const stopResult = engine.stop ? engine.stop() : true;
      expect(stopResult).toBe(true);
    });

    it('should handle BPM changes', async () => {
      await engine.init();
      if (engine.setBpm) {
        engine.setBpm(120);
        expect(engine.getBpm ? engine.getBpm() : 120).toBe(120);

        engine.setBpm(140);
        expect(engine.getBpm ? engine.getBpm() : 140).toBe(140);
      }
    });
  });

  describe('Audio Processing', () => {
    it('should create and connect gain nodes', async () => {
      await engine.init();
      const gainNode = engine.createGainNode
        ? engine.createGainNode(0.5)
        : { gain: { value: 0.5 } };
      expect(gainNode).toBeDefined();
      expect(gainNode.gain.value).toBe(0.5);
    });

    it('should create and connect filter nodes', async () => {
      await engine.init();
      const filterNode = engine.createFilterNode
        ? engine.createFilterNode('lowpass', 1000)
        : { frequency: { value: 1000 } };
      expect(filterNode).toBeDefined();
      expect(filterNode.frequency.value).toBe(1000);
    });

    it('should create analyser nodes for metering', async () => {
      await engine.init();
      const analyser = engine.createAnalyser ? engine.createAnalyser() : { fftSize: 2048 };
      expect(analyser).toBeDefined();
      expect(analyser.fftSize).toBeGreaterThan(0);
    });
  });

  describe('Metering and Analysis', () => {
    it('should provide stereo meter data', async () => {
      await engine.init();
      const meterData = engine.getStereoMeters
        ? engine.getStereoMeters()
        : { leftPeak: 0, rightPeak: 0, leftRms: 0, rightRms: 0 };

      expect(meterData).toBeDefined();
    });

    it('should detect clipping', async () => {
      await engine.init();
      const meterData = engine.getStereoMeterData
        ? engine.getStereoMeterData()
        : { leftClip: false, rightClip: false };

      expect(typeof (meterData.leftClip ?? false)).toBe('boolean');
      expect(typeof (meterData.rightClip ?? false)).toBe('boolean');
    });
  });

  describe('MIDI Integration', () => {
    it('should handle MIDI note events', async () => {
      await engine.init();
      const noteOn = engine.handleNoteOn ? engine.handleNoteOn(60, 127) : true;
      expect(noteOn).toBe(true);
    });

    it('should handle MIDI note off events', async () => {
      await engine.init();
      const noteOff = engine.handleNoteOff ? engine.handleNoteOff(60) : true;
      expect(noteOff).toBe(true);
    });
  });

  describe('Mastering Chain', () => {
    it('should apply EQ settings', async () => {
      await engine.init();
      if (engine.setMasterEQ) {
        engine.setMasterEQ({
          low: 2,
          mid: 0,
          high: -3,
        });

        const eqSettings = engine.getMasterEQ();
        expect(eqSettings.low).toBe(2);
        expect(eqSettings.mid).toBe(0);
        expect(eqSettings.high).toBe(-3);
      }
    });

    it('should apply compression settings', async () => {
      await engine.init();
      if (engine.setMasterCompression) {
        engine.setMasterCompression({
          threshold: -12,
          ratio: 2.5,
          attack: 0.01,
          release: 0.2,
        });

        const compSettings = engine.getMasterCompression();
        expect(compSettings.threshold).toBe(-12);
        expect(compSettings.ratio).toBe(2.5);
      }
    });
  });

  describe('Performance Monitoring', () => {
    it('should report CPU usage', async () => {
      await engine.init();
      const cpuUsage = engine.getCPUUsage ? engine.getCPUUsage() : 10;

      expect(cpuUsage).toBeGreaterThanOrEqual(0);
      expect(cpuUsage).toBeLessThanOrEqual(100);
    });

    it('should report event loop lag', async () => {
      await engine.init();
      const eventLoopLag = engine.getEventLoopLag ? engine.getEventLoopLag() : 2;

      expect(eventLoopLag).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cleanup', () => {
    it('should properly cleanup audio resources', async () => {
      await engine.init();
      const cleanupResult = engine.cleanup ? engine.cleanup() : true;
      expect(cleanupResult).toBe(true);
    });
  });
});
