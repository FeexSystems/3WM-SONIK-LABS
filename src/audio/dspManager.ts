/**
 * 3WM SONIK — Unified DSP Manager
 * Automatically selects between AudioWorklet (low-latency) and AudioNode fallback
 * Provides a unified interface for DSP operations across all browsers
 */

import { workletLoader, WorkletLoader, DSPWorkletNode } from './workletLoader';
import { dspFallback, DSPFallbackNode } from './dspFallback';

export type DSPMode = 'worklet' | 'fallback';

export interface DSPNode {
  id: string;
  mode: DSPMode;
  workletNode?: DSPWorkletNode;
  fallbackNode?: DSPFallbackNode;
}

export interface DSPParameters {
  eqLow?: number;
  eqMid?: number;
  eqHigh?: number;
  eqLowFreq?: number;
  eqMidFreq?: number;
  eqHighFreq?: number;
  compThreshold?: number;
  compRatio?: number;
  compAttack?: number;
  compRelease?: number;
  compMakeupGain?: number;
  reverbMix?: number;
  reverbDecay?: number;
  reverbPreDelay?: number;
  delayTime?: number;
  delayFeedback?: number;
  delayMix?: number;
  saturationDrive?: number;
  saturationMix?: number;
  limiterThreshold?: number;
  limiterRelease?: number;
}

export class DSPManager {
  private audioContext: AudioContext | null = null;
  private dspNodes: Map<string, DSPNode> = new Map();
  private mode: DSPMode = 'fallback';
  private isInitialized = false;

  /**
   * Initialize the DSP manager with automatic mode selection
   */
  async initialize(audioContext: AudioContext): Promise<DSPMode> {
    this.audioContext = audioContext;

    // Check if AudioWorklet is supported
    if (WorkletLoader.isSupported()) {
      console.log('AudioWorklet supported, attempting to load...');
      const workletLoaded = await workletLoader.initialize(audioContext);

      if (workletLoaded) {
        this.mode = 'worklet';
        console.log('DSP Manager initialized in Worklet mode (sub-5ms latency)');
        this.isInitialized = true;
        return this.mode;
      }
    }

    // Fallback to AudioNodes
    console.log('AudioWorklet not available, using AudioNode fallback');
    this.mode = 'fallback';
    dspFallback.initialize(audioContext);
    this.isInitialized = true;
    console.log('DSP Manager initialized in Fallback mode (20-50ms latency)');
    return this.mode;
  }

  /**
   * Create a new DSP node (automatically uses current mode)
   */
  async createDSPNode(nodeId: string): Promise<DSPNode | null> {
    if (!this.isInitialized) {
      console.error('DSP Manager not initialized');
      return null;
    }

    if (this.mode === 'worklet') {
      const workletNode = await workletLoader.createDSPNode(nodeId);
      if (workletNode) {
        const dspNode: DSPNode = {
          id: nodeId,
          mode: 'worklet',
          workletNode,
        };
        this.dspNodes.set(nodeId, dspNode);
        return dspNode;
      }
    }

    // Fallback mode
    const fallbackNode = dspFallback.createFallbackNode(nodeId);
    if (fallbackNode) {
      const dspNode: DSPNode = {
        id: nodeId,
        mode: 'fallback',
        fallbackNode,
      };
      this.dspNodes.set(nodeId, dspNode);
      return dspNode;
    }

    return null;
  }

  /**
   * Get an existing DSP node
   */
  getDSPNode(nodeId: string): DSPNode | null {
    return this.dspNodes.get(nodeId) || null;
  }

  /**
   * Remove a DSP node
   */
  removeDSPNode(nodeId: string): void {
    const node = this.dspNodes.get(nodeId);
    if (node) {
      if (node.mode === 'worklet') {
        workletLoader.removeDSPNode(nodeId);
      } else {
        dspFallback.removeFallbackNode(nodeId);
      }
      this.dspNodes.delete(nodeId);
      console.log(`DSP node removed: ${nodeId} (${node.mode})`);
    }
  }

  /**
   * Remove all DSP nodes
   */
  removeAllDSPNodes(): void {
    this.dspNodes.forEach((node) => {
      if (node.mode === 'worklet') {
        workletLoader.removeDSPNode(node.id);
      } else {
        dspFallback.removeFallbackNode(node.id);
      }
    });
    this.dspNodes.clear();
    console.log('All DSP nodes removed');
  }

  /**
   * Set DSP parameters (unified interface)
   */
  setDSPParameters(nodeId: string, params: DSPParameters): void {
    const node = this.dspNodes.get(nodeId);
    if (!node) {
      console.error(`DSP node not found: ${nodeId}`);
      return;
    }

    if (node.mode === 'worklet' && node.workletNode) {
      // Set worklet parameters via AudioParams
      const p = node.workletNode.parameters;
      if (params.eqLow !== undefined) p.eqLow.value = params.eqLow;
      if (params.eqMid !== undefined) p.eqMid.value = params.eqMid;
      if (params.eqHigh !== undefined) p.eqHigh.value = params.eqHigh;
      if (params.eqLowFreq !== undefined) p.eqLowFreq.value = params.eqLowFreq;
      if (params.eqMidFreq !== undefined) p.eqMidFreq.value = params.eqMidFreq;
      if (params.eqHighFreq !== undefined) p.eqHighFreq.value = params.eqHighFreq;
      if (params.compThreshold !== undefined) p.compThreshold.value = params.compThreshold;
      if (params.compRatio !== undefined) p.compRatio.value = params.compRatio;
      if (params.compAttack !== undefined) p.compAttack.value = params.compAttack;
      if (params.compRelease !== undefined) p.compRelease.value = params.compRelease;
      if (params.compMakeupGain !== undefined) p.compMakeupGain.value = params.compMakeupGain;
      if (params.reverbMix !== undefined) p.reverbMix.value = params.reverbMix;
      if (params.reverbDecay !== undefined) p.reverbDecay.value = params.reverbDecay;
      if (params.reverbPreDelay !== undefined) p.reverbPreDelay.value = params.reverbPreDelay;
      if (params.delayTime !== undefined) p.delayTime.value = params.delayTime;
      if (params.delayFeedback !== undefined) p.delayFeedback.value = params.delayFeedback;
      if (params.delayMix !== undefined) p.delayMix.value = params.delayMix;
      if (params.saturationDrive !== undefined) p.saturationDrive.value = params.saturationDrive;
      if (params.saturationMix !== undefined) p.saturationMix.value = params.saturationMix;
      if (params.limiterThreshold !== undefined) p.limiterThreshold.value = params.limiterThreshold;
      if (params.limiterRelease !== undefined) p.limiterRelease.value = params.limiterRelease;
    } else if (node.mode === 'fallback' && node.fallbackNode) {
      // Set fallback node parameters
      const n = node.fallbackNode;
      if (params.eqLow !== undefined) n.eqLow.gain.value = params.eqLow;
      if (params.eqMid !== undefined) n.eqMid.gain.value = params.eqMid;
      if (params.eqHigh !== undefined) n.eqHigh.gain.value = params.eqHigh;
      if (params.eqLowFreq !== undefined) n.eqLow.frequency.value = params.eqLowFreq;
      if (params.eqMidFreq !== undefined) n.eqMid.frequency.value = params.eqMidFreq;
      if (params.eqHighFreq !== undefined) n.eqHigh.frequency.value = params.eqHighFreq;
      if (params.compThreshold !== undefined) n.compressor.threshold.value = params.compThreshold;
      if (params.compRatio !== undefined) n.compressor.ratio.value = params.compRatio;
      if (params.compAttack !== undefined) n.compressor.attack.value = params.compAttack;
      if (params.compRelease !== undefined) n.compressor.release.value = params.compRelease;
      if (params.delayTime !== undefined) n.delay.delayTime.value = params.delayTime / 1000;
      if (params.delayFeedback !== undefined) n.delayFeedback.gain.value = params.delayFeedback;
      if (params.delayMix !== undefined) n.delayMix.gain.value = params.delayMix;
      if (params.saturationDrive !== undefined) {
        n.saturation.curve = this.makeDistortionCurve(params.saturationDrive) as any;
      }
      if (params.saturationMix !== undefined) n.saturationMix.gain.value = params.saturationMix;
      if (params.limiterThreshold !== undefined)
        n.limiter.threshold.value = params.limiterThreshold;
      if (params.limiterRelease !== undefined) n.limiter.release.value = params.limiterRelease;
    }
  }

  /**
   * Connect a DSP node to the audio graph
   */
  connectDSPNode(nodeId: string, source: AudioNode, destination: AudioNode): void {
    const node = this.dspNodes.get(nodeId);
    if (!node) {
      console.error(`DSP node not found: ${nodeId}`);
      return;
    }

    if (node.mode === 'worklet' && node.workletNode) {
      source.connect(node.workletNode).connect(destination);
    } else if (node.mode === 'fallback' && node.fallbackNode) {
      source.connect(node.fallbackNode.eqLow);
      node.fallbackNode.limiter.connect(destination);
    }
  }

  /**
   * Disconnect a DSP node from the audio graph
   */
  disconnectDSPNode(nodeId: string, source: AudioNode, destination: AudioNode): void {
    const node = this.dspNodes.get(nodeId);
    if (!node) {
      console.error(`DSP node not found: ${nodeId}`);
      return;
    }

    if (node.mode === 'worklet' && node.workletNode) {
      source.disconnect(node.workletNode);
      node.workletNode.disconnect(destination);
    } else if (node.mode === 'fallback' && node.fallbackNode) {
      source.disconnect(node.fallbackNode.eqLow);
      node.fallbackNode.limiter.disconnect(destination);
    }
  }

  /**
   * Get the current DSP mode
   */
  getMode(): DSPMode {
    return this.mode;
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get all active DSP node IDs
   */
  getActiveNodeIds(): string[] {
    return Array.from(this.dspNodes.keys());
  }

  /**
   * Get the count of active DSP nodes
   */
  getActiveNodeCount(): number {
    return this.dspNodes.size;
  }

  /**
   * Helper: Create distortion curve for fallback saturation
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
}

// Singleton instance
export const dspManager = new DSPManager();
