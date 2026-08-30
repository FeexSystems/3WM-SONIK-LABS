/**
 * 3WM SONIK — AudioWorklet Loader
 * Dynamically loads and manages AudioWorklet processors for low-latency DSP
 */

export interface DSPWorkletNode extends Omit<AudioWorkletNode, 'parameters'> {
  parameters: AudioParamMap & {
    eqLow: AudioParam;
    eqMid: AudioParam;
    eqHigh: AudioParam;
    eqLowFreq: AudioParam;
    eqMidFreq: AudioParam;
    eqHighFreq: AudioParam;
    compThreshold: AudioParam;
    compRatio: AudioParam;
    compAttack: AudioParam;
    compRelease: AudioParam;
    compMakeupGain: AudioParam;
    reverbMix: AudioParam;
    reverbDecay: AudioParam;
    reverbPreDelay: AudioParam;
    delayTime: AudioParam;
    delayFeedback: AudioParam;
    delayMix: AudioParam;
    saturationDrive: AudioParam;
    saturationMix: AudioParam;
    limiterThreshold: AudioParam;
    limiterRelease: AudioParam;
  };
}

export class WorkletLoader {
  private audioContext: AudioContext | null = null;
  private workletNodes: Map<string, DSPWorkletNode> = new Map();
  private isWorkletLoaded = false;

  /**
   * Initialize the audio context and load the DSP worklet
   */
  async initialize(audioContext: AudioContext): Promise<boolean> {
    this.audioContext = audioContext;

    // Check if AudioWorklet is supported
    if (!audioContext.audioWorklet) {
      console.warn('AudioWorklet not supported, falling back to AudioNodes');
      return false;
    }

    try {
      // Load the DSP processor worklet
      await audioContext.audioWorklet.addModule('/src/audio/worklets/dspProcessor.ts');
      this.isWorkletLoaded = true;
      console.log('DSP worklet loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load DSP worklet:', error);
      return false;
    }
  }

  /**
   * Create a new DSP worklet node
   */
  async createDSPNode(nodeId: string): Promise<DSPWorkletNode | null> {
    if (!this.audioContext || !this.isWorkletLoaded) {
      console.error('AudioContext or worklet not initialized');
      return null;
    }

    try {
      const workletNode = new AudioWorkletNode(
        this.audioContext,
        'dsp-processor'
      ) as unknown as DSPWorkletNode;

      this.workletNodes.set(nodeId, workletNode);
      console.log(`DSP worklet node created: ${nodeId}`);
      return workletNode;
    } catch (error) {
      console.error(`Failed to create DSP worklet node ${nodeId}:`, error);
      return null;
    }
  }

  /**
   * Get an existing DSP worklet node
   */
  getDSPNode(nodeId: string): DSPWorkletNode | null {
    return this.workletNodes.get(nodeId) || null;
  }

  /**
   * Disconnect and remove a DSP worklet node
   */
  removeDSPNode(nodeId: string): void {
    const node = this.workletNodes.get(nodeId);
    if (node) {
      node.disconnect();
      this.workletNodes.delete(nodeId);
      console.log(`DSP worklet node removed: ${nodeId}`);
    }
  }

  /**
   * Remove all DSP worklet nodes
   */
  removeAllDSPNodes(): void {
    this.workletNodes.forEach((node) => node.disconnect());
    this.workletNodes.clear();
    console.log('All DSP worklet nodes removed');
  }

  /**
   * Check if AudioWorklet is supported
   */
  static isSupported(): boolean {
    return typeof AudioContext !== 'undefined' && 'audioWorklet' in AudioContext.prototype;
  }

  /**
   * Get the current audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Check if worklet is loaded
   */
  isLoaded(): boolean {
    return this.isWorkletLoaded;
  }

  /**
   * Get all active worklet node IDs
   */
  getActiveNodeIds(): string[] {
    return Array.from(this.workletNodes.keys());
  }

  /**
   * Get the count of active worklet nodes
   */
  getActiveNodeCount(): number {
    return this.workletNodes.size;
  }
}

// Singleton instance
export const workletLoader = new WorkletLoader();
