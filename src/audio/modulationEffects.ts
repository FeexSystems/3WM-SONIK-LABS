/**
 * 3WM SONIK — Modulation Effects
 * Implementation of Chorus, Phaser, and Flanger effects
 */

export interface ChorusParams {
  rate: number; // LFO rate in Hz (0.1 - 10)
  depth: number; // Modulation depth (0 - 1)
  voices: number; // Number of chorus voices (1 - 8)
  delayTime: number; // Base delay time in seconds (0.005 - 0.05)
  mix: number; // Wet/dry mix (0 - 1)
}

export interface PhaserParams {
  rate: number; // LFO rate in Hz (0.1 - 10)
  depth: number; // Modulation depth in Hz (100 - 5000)
  feedback: number; // Feedback amount (0 - 0.95)
  stages: number; // Number of all-pass stages (2 - 12)
  mix: number; // Wet/dry mix (0 - 1)
}

export interface FlangerParams {
  rate: number; // LFO rate in Hz (0.01 - 10)
  depth: number; // Modulation depth in seconds (0.001 - 0.02)
  feedback: number; // Feedback amount (-0.95 - 0.95)
  delayTime: number; // Base delay time in seconds (0.001 - 0.01)
  mix: number; // Wet/dry mix (0 - 1)
}

export class ChorusEffect {
  private audioContext: AudioContext;
  private delayNodes: DelayNode[] = [];
  private gainNodes: GainNode[] = [];
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private inputGain: GainNode | null = null;
  private outputGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private params: ChorusParams;

  constructor(audioContext: AudioContext, params: Partial<ChorusParams> = {}) {
    this.audioContext = audioContext;
    this.params = {
      rate: params.rate ?? 1.5,
      depth: params.depth ?? 0.5,
      voices: params.voices ?? 3,
      delayTime: params.delayTime ?? 0.025,
      mix: params.mix ?? 0.5,
    };
  }

  async initialize(): Promise<void> {
    // Create input/output routing
    this.inputGain = this.audioContext.createGain();
    this.outputGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();

    // Set initial mix
    this.dryGain.gain.value = 1 - this.params.mix;
    this.wetGain.gain.value = this.params.mix;

    // Create LFO
    this.lfo = this.audioContext.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = this.params.rate;
    this.lfoGain = this.audioContext.createGain();
    this.lfoGain.gain.value = this.params.depth * 0.01; // Convert to delay modulation

    // Create chorus voices
    for (let i = 0; i < this.params.voices; i++) {
      const delay = this.audioContext.createDelay(5.0);
      const gain = this.audioContext.createGain();

      // Set base delay with slight offset for each voice
      delay.delayTime.value = this.params.delayTime + i * 0.002;
      gain.gain.value = 1 / this.params.voices;

      // Connect LFO to delay time
      this.lfo.connect(this.lfoGain!);
      this.lfoGain!.connect(delay.delayTime);

      this.delayNodes.push(delay);
      this.gainNodes.push(gain);
    }

    // Connect routing
    this.inputGain.connect(this.dryGain);
    this.dryGain.connect(this.outputGain);

    this.inputGain.connect(this.delayNodes[0]);
    for (let i = 0; i < this.delayNodes.length; i++) {
      this.delayNodes[i].connect(this.gainNodes[i]);
      this.gainNodes[i].connect(this.wetGain);
    }
    this.wetGain.connect(this.outputGain);

    // Start LFO
    this.lfo.start();
  }

  connect(destination: AudioNode): void {
    this.outputGain?.connect(destination);
  }

  disconnect(): void {
    this.inputGain?.disconnect();
    this.outputGain?.disconnect();
    this.lfo?.stop();
    this.lfo?.disconnect();
    this.lfoGain?.disconnect();
    this.dryGain?.disconnect();
    this.wetGain?.disconnect();

    this.delayNodes.forEach((node) => node.disconnect());
    this.gainNodes.forEach((node) => node.disconnect());
  }

  setParams(params: Partial<ChorusParams>): void {
    if (params.rate !== undefined && this.lfo) {
      this.params.rate = params.rate;
      this.lfo.frequency.value = this.params.rate;
    }
    if (params.depth !== undefined && this.lfoGain) {
      this.params.depth = params.depth;
      this.lfoGain.gain.value = this.params.depth * 0.01;
    }
    if (params.mix !== undefined && this.dryGain && this.wetGain) {
      this.params.mix = params.mix;
      this.dryGain.gain.value = 1 - this.params.mix;
      this.wetGain.gain.value = this.params.mix;
    }
    if (params.delayTime !== undefined) {
      this.params.delayTime = params.delayTime;
      this.delayNodes.forEach((node, i) => {
        node.delayTime.value = this.params.delayTime + i * 0.002;
      });
    }
  }

  getInput(): AudioNode | null {
    return this.inputGain;
  }

  getOutput(): AudioNode | null {
    return this.outputGain;
  }
}

export class PhaserEffect {
  private audioContext: AudioContext;
  private allPassFilters: BiquadFilterNode[] = [];
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private inputGain: GainNode | null = null;
  private outputGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private feedbackGain: GainNode | null = null;
  private params: PhaserParams;

  constructor(audioContext: AudioContext, params: Partial<PhaserParams> = {}) {
    this.audioContext = audioContext;
    this.params = {
      rate: params.rate ?? 0.5,
      depth: params.depth ?? 1000,
      feedback: params.feedback ?? 0.7,
      stages: params.stages ?? 4,
      mix: params.mix ?? 0.5,
    };
  }

  async initialize(): Promise<void> {
    // Create input/output routing
    this.inputGain = this.audioContext.createGain();
    this.outputGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();
    this.feedbackGain = this.audioContext.createGain();

    // Set initial mix and feedback
    this.dryGain.gain.value = 1 - this.params.mix;
    this.wetGain.gain.value = this.params.mix;
    this.feedbackGain.gain.value = this.params.feedback;

    // Create LFO
    this.lfo = this.audioContext.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = this.params.rate;
    this.lfoGain = this.audioContext.createGain();
    this.lfoGain.gain.value = this.params.depth;

    // Create all-pass filter stages
    for (let i = 0; i < this.params.stages; i++) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'allpass';
      filter.frequency.value = 1000 + i * 500;
      filter.Q.value = 5;

      // Connect LFO to filter frequency
      this.lfo.connect(this.lfoGain!);
      this.lfoGain!.connect(filter.frequency);

      this.allPassFilters.push(filter);
    }

    // Connect routing (series of all-pass filters)
    this.inputGain.connect(this.dryGain);
    this.dryGain.connect(this.outputGain);

    this.inputGain.connect(this.allPassFilters[0]);
    for (let i = 0; i < this.allPassFilters.length - 1; i++) {
      this.allPassFilters[i].connect(this.allPassFilters[i + 1]);
    }

    // Feedback loop
    const lastFilter = this.allPassFilters[this.allPassFilters.length - 1];
    lastFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.allPassFilters[0]);
    lastFilter.connect(this.wetGain);
    this.wetGain.connect(this.outputGain);

    // Start LFO
    this.lfo.start();
  }

  connect(destination: AudioNode): void {
    this.outputGain?.connect(destination);
  }

  disconnect(): void {
    this.inputGain?.disconnect();
    this.outputGain?.disconnect();
    this.lfo?.stop();
    this.lfo?.disconnect();
    this.lfoGain?.disconnect();
    this.dryGain?.disconnect();
    this.wetGain?.disconnect();
    this.feedbackGain?.disconnect();

    this.allPassFilters.forEach((node) => node.disconnect());
  }

  setParams(params: Partial<PhaserParams>): void {
    if (params.rate !== undefined && this.lfo) {
      this.params.rate = params.rate;
      this.lfo.frequency.value = this.params.rate;
    }
    if (params.depth !== undefined && this.lfoGain) {
      this.params.depth = params.depth;
      this.lfoGain.gain.value = this.params.depth;
    }
    if (params.feedback !== undefined && this.feedbackGain) {
      this.params.feedback = params.feedback;
      this.feedbackGain.gain.value = this.params.feedback;
    }
    if (params.mix !== undefined && this.dryGain && this.wetGain) {
      this.params.mix = params.mix;
      this.dryGain.gain.value = 1 - this.params.mix;
      this.wetGain.gain.value = this.params.mix;
    }
  }

  getInput(): AudioNode | null {
    return this.inputGain;
  }

  getOutput(): AudioNode | null {
    return this.outputGain;
  }
}

export class FlangerEffect {
  private audioContext: AudioContext;
  private delayNode: DelayNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private inputGain: GainNode | null = null;
  private outputGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private feedbackGain: GainNode | null = null;
  private params: FlangerParams;

  constructor(audioContext: AudioContext, params: Partial<FlangerParams> = {}) {
    this.audioContext = audioContext;
    this.params = {
      rate: params.rate ?? 0.1,
      depth: params.depth ?? 0.01,
      feedback: params.feedback ?? 0.8,
      delayTime: params.delayTime ?? 0.005,
      mix: params.mix ?? 0.5,
    };
  }

  async initialize(): Promise<void> {
    // Create input/output routing
    this.inputGain = this.audioContext.createGain();
    this.outputGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();
    this.feedbackGain = this.audioContext.createGain();

    // Set initial mix and feedback
    this.dryGain.gain.value = 1 - this.params.mix;
    this.wetGain.gain.value = this.params.mix;
    this.feedbackGain.gain.value = this.params.feedback;

    // Create delay line
    this.delayNode = this.audioContext.createDelay(0.1);
    this.delayNode.delayTime.value = this.params.delayTime;

    // Create LFO
    this.lfo = this.audioContext.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = this.params.rate;
    this.lfoGain = this.audioContext.createGain();
    this.lfoGain.gain.value = this.params.depth;

    // Connect LFO to delay time
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.delayNode.delayTime);

    // Connect routing with feedback loop
    this.inputGain.connect(this.dryGain);
    this.dryGain.connect(this.outputGain);

    this.inputGain.connect(this.delayNode);
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.wetGain);
    this.wetGain.connect(this.outputGain);

    // Start LFO
    this.lfo.start();
  }

  connect(destination: AudioNode): void {
    this.outputGain?.connect(destination);
  }

  disconnect(): void {
    this.inputGain?.disconnect();
    this.outputGain?.disconnect();
    this.lfo?.stop();
    this.lfo?.disconnect();
    this.lfoGain?.disconnect();
    this.delayNode?.disconnect();
    this.dryGain?.disconnect();
    this.wetGain?.disconnect();
    this.feedbackGain?.disconnect();
  }

  setParams(params: Partial<FlangerParams>): void {
    if (params.rate !== undefined && this.lfo) {
      this.params.rate = params.rate;
      this.lfo.frequency.value = this.params.rate;
    }
    if (params.depth !== undefined && this.lfoGain) {
      this.params.depth = params.depth;
      this.lfoGain.gain.value = this.params.depth;
    }
    if (params.feedback !== undefined && this.feedbackGain) {
      this.params.feedback = params.feedback;
      this.feedbackGain.gain.value = this.params.feedback;
    }
    if (params.delayTime !== undefined && this.delayNode) {
      this.params.delayTime = params.delayTime;
      this.delayNode.delayTime.value = this.params.delayTime;
    }
    if (params.mix !== undefined && this.dryGain && this.wetGain) {
      this.params.mix = params.mix;
      this.dryGain.gain.value = 1 - this.params.mix;
      this.wetGain.gain.value = this.params.mix;
    }
  }

  getInput(): AudioNode | null {
    return this.inputGain;
  }

  getOutput(): AudioNode | null {
    return this.outputGain;
  }
}
