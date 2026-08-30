/**
 * 3WM SONIK — DSP Fallback System
 * Provides AudioNode-based fallback when AudioWorklet is not supported
 * Ensures compatibility across all browsers
 */

export interface DSPFallbackNode {
  eqLow: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHigh: BiquadFilterNode;
  compressor: DynamicsCompressorNode;
  delay: DelayNode;
  delayFeedback: GainNode;
  delayMix: GainNode;
  saturation: WaveShaperNode;
  saturationMix: GainNode;
  limiter: DynamicsCompressorNode;
}

export class DSPFallback {
  private audioContext: AudioContext | null = null;
  private fallbackNodes: Map<string, DSPFallbackNode> = new Map();

  /**
   * Initialize the audio context
   */
  initialize(audioContext: AudioContext): void {
    this.audioContext = audioContext;
    console.log('DSP fallback system initialized');
  }

  /**
   * Create a fallback DSP node chain using AudioNodes
   */
  createFallbackNode(nodeId: string): DSPFallbackNode | null {
    if (!this.audioContext) {
      console.error('AudioContext not initialized');
      return null;
    }

    try {
      const ctx = this.audioContext;

      // Create EQ nodes
      const eqLow = ctx.createBiquadFilter();
      eqLow.type = 'lowshelf';
      eqLow.frequency.value = 80;
      eqLow.gain.value = 0;

      const eqMid = ctx.createBiquadFilter();
      eqMid.type = 'peaking';
      eqMid.frequency.value = 1000;
      eqMid.Q.value = 1;
      eqMid.gain.value = 0;

      const eqHigh = ctx.createBiquadFilter();
      eqHigh.type = 'highshelf';
      eqHigh.frequency.value = 8000;
      eqHigh.gain.value = 0;

      // Create compressor
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 6;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.1;

      // Create delay chain
      const delay = ctx.createDelay(2);
      delay.delayTime.value = 0.25;

      const delayFeedback = ctx.createGain();
      delayFeedback.gain.value = 0.3;

      const delayMix = ctx.createGain();
      delayMix.gain.value = 0;

      // Create saturation (using waveshaper)
      const saturation = ctx.createWaveShaper();
      saturation.curve = this.makeDistortionCurve(0) as any;
      saturation.oversample = '4x';

      const saturationMix = ctx.createGain();
      saturationMix.gain.value = 0;

      // Create limiter
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -1;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.1;

      const fallbackNode: DSPFallbackNode = {
        eqLow,
        eqMid,
        eqHigh,
        compressor,
        delay,
        delayFeedback,
        delayMix,
        saturation,
        saturationMix,
        limiter,
      };

      // Connect the chain
      this.connectFallbackChain(fallbackNode);

      this.fallbackNodes.set(nodeId, fallbackNode);
      console.log(`DSP fallback node created: ${nodeId}`);
      return fallbackNode;
    } catch (error) {
      console.error(`Failed to create DSP fallback node ${nodeId}:`, error);
      return null;
    }
  }

  /**
   * Connect the fallback node chain
   */
  private connectFallbackChain(node: DSPFallbackNode): void {
    // EQ chain
    node.eqLow.connect(node.eqMid);
    node.eqMid.connect(node.eqHigh);

    // Compressor
    node.eqHigh.connect(node.compressor);

    // Saturation (parallel)
    node.compressor.connect(node.saturation);
    node.compressor.connect(node.saturationMix);

    // Delay (parallel)
    node.compressor.connect(node.delay);
    node.delay.connect(node.delayFeedback);
    node.delayFeedback.connect(node.delay);
    node.delay.connect(node.delayMix);

    // Limiter
    node.saturation.connect(node.limiter);
    node.saturationMix.connect(node.limiter);
    node.delayMix.connect(node.limiter);
  }

  /**
   * Get an existing fallback node
   */
  getFallbackNode(nodeId: string): DSPFallbackNode | null {
    return this.fallbackNodes.get(nodeId) || null;
  }

  /**
   * Remove a fallback node
   */
  removeFallbackNode(nodeId: string): void {
    const node = this.fallbackNodes.get(nodeId);
    if (node) {
      this.disconnectFallbackChain(node);
      this.fallbackNodes.delete(nodeId);
      console.log(`DSP fallback node removed: ${nodeId}`);
    }
  }

  /**
   * Disconnect the fallback node chain
   */
  private disconnectFallbackChain(node: DSPFallbackNode): void {
    node.eqLow.disconnect();
    node.eqMid.disconnect();
    node.eqHigh.disconnect();
    node.compressor.disconnect();
    node.delay.disconnect();
    node.delayFeedback.disconnect();
    node.delayMix.disconnect();
    node.saturation.disconnect();
    node.saturationMix.disconnect();
    node.limiter.disconnect();
  }

  /**
   * Remove all fallback nodes
   */
  removeAllFallbackNodes(): void {
    this.fallbackNodes.forEach((node) => this.disconnectFallbackChain(node));
    this.fallbackNodes.clear();
    console.log('All DSP fallback nodes removed');
  }

  /**
   * Create a distortion curve for saturation
   */
  private makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples) as any;
    const deg = Math.PI / 180;

    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }

    return curve;
  }

  /**
   * Get the current audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get all active fallback node IDs
   */
  getActiveNodeIds(): string[] {
    return Array.from(this.fallbackNodes.keys());
  }

  /**
   * Get the count of active fallback nodes
   */
  getActiveNodeCount(): number {
    return this.fallbackNodes.size;
  }
}

// Singleton instance
export const dspFallback = new DSPFallback();
