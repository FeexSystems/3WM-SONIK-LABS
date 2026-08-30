/**
 * DSP Plugin Integration - Connects real-time DSP system with existing plugin engine
 * Part of Phase 4.1.6: Integrate real-time DSP with existing plugin engine
 */

import { DSPGraphBuilder, DSPNodeType, SerializedDSPGraph } from './dspGraphBuilder';
import { ParameterSmoothingEngine, RampType, smoothAudioParam } from './parameterSmoothing';
import { PluginInstanceNode } from './pluginEngine';
import { PluginDefinition } from '../types';

export interface DSPPluginConfig {
  enableAudioWorklets: boolean;
  enableParameterSmoothing: boolean;
  smoothingTime: number;
  workletUrls: {
    eq?: string;
    compression?: string;
    saturation?: string;
  };
}

export class DSPPluginIntegration {
  private dspGraphBuilder: DSPGraphBuilder;
  private parameterSmoothing: ParameterSmoothingEngine;
  private audioContext: BaseAudioContext;
  private config: DSPPluginConfig;
  private pluginInstances: Map<string, PluginInstanceNode> = new Map();
  private workletNodes: Map<string, AudioWorkletNode> = new Map();

  constructor(audioContext: BaseAudioContext, config: Partial<DSPPluginConfig> = {}) {
    this.audioContext = audioContext;
    this.config = {
      enableAudioWorklets: true,
      enableParameterSmoothing: true,
      smoothingTime: 0.02,
      workletUrls: {
        eq: '/worklets/eq-processor.js',
        compression: '/worklets/compression-processor.js',
        saturation: '/worklets/saturation-processor.js',
      },
      ...config,
    };

    this.dspGraphBuilder = new DSPGraphBuilder(audioContext as any);
    this.parameterSmoothing = new ParameterSmoothingEngine(audioContext as any);
  }

  /**
   * Initialize the DSP plugin integration
   */
  async initialize(): Promise<void> {
    await this.dspGraphBuilder.initialize();

    if (this.config.enableAudioWorklets) {
      await this.loadAudioWorklets();
    }

    console.log('DSP Plugin Integration initialized');
  }

  /**
   * Load AudioWorklet processors
   */
  private async loadAudioWorklets(): Promise<void> {
    const workletUrls = this.config.workletUrls;

    try {
      if (workletUrls.eq) {
        await (this.audioContext as any).audioWorklet.addModule(workletUrls.eq);
        console.log('EQ AudioWorklet loaded');
      }
      if (workletUrls.compression) {
        await (this.audioContext as any).audioWorklet.addModule(workletUrls.compression);
        console.log('Compression AudioWorklet loaded');
      }
      if (workletUrls.saturation) {
        await (this.audioContext as any).audioWorklet.addModule(workletUrls.saturation);
        console.log('Saturation AudioWorklet loaded');
      }
    } catch (error) {
      console.error('Failed to load AudioWorklets:', error);
    }
  }

  /**
   * Create a plugin instance with DSP integration
   */
  async createPluginInstance(
    pluginDef: PluginDefinition,
    initialParams: Record<string, any> = {}
  ): Promise<PluginInstanceNode> {
    const instance = new PluginInstanceNode(this.audioContext, pluginDef, initialParams);
    const instanceId = instance.instanceId;

    this.pluginInstances.set(instanceId, instance);

    // Apply DSP enhancements based on plugin category
    await this.applyDSPEnhancements(instance, pluginDef);

    // Setup parameter smoothing if enabled
    if (this.config.enableParameterSmoothing) {
      this.setupParameterSmoothing(instance, pluginDef);
    }

    return instance;
  }

  /**
   * Apply DSP enhancements to a plugin instance
   */
  private async applyDSPEnhancements(
    instance: PluginInstanceNode,
    pluginDef: PluginDefinition
  ): Promise<void> {
    switch (pluginDef.category) {
      case 'EFFECT':
        await this.applyEffectDSP(instance, pluginDef);
        break;
      case 'INSTRUMENT':
        await this.applyInstrumentDSP(instance, pluginDef);
        break;
      case 'MASTERING':
        await this.applyMasteringDSP(instance, pluginDef);
        break;
    }
  }

  /**
   * Apply DSP enhancements for effect plugins
   */
  private async applyEffectDSP(
    instance: PluginInstanceNode,
    pluginDef: PluginDefinition
  ): Promise<void> {
    if (pluginDef.id === 'sonik-eq' && this.config.enableAudioWorklets) {
      await this.createEQWorklet(instance);
    } else if (pluginDef.id === 'sonik-comp' && this.config.enableAudioWorklets) {
      await this.createCompressionWorklet(instance);
    } else if (pluginDef.id === 'sonik-color' && this.config.enableAudioWorklets) {
      await this.createSaturationWorklet(instance);
    }
  }

  /**
   * Create EQ AudioWorklet node
   */
  private async createEQWorklet(instance: PluginInstanceNode): Promise<void> {
    try {
      const eqNode = new AudioWorkletNode(this.audioContext as any, 'eq-processor');

      // Connect EQ into the plugin chain
      instance.inputNode.disconnect();
      instance.inputNode.connect(eqNode);
      eqNode.connect(instance.wetGain);

      this.workletNodes.set(instance.instanceId, eqNode);

      // Setup parameter updates
      eqNode.port.onmessage = (event: any) => {
        if (event.data.type === 'parameterUpdate') {
          // Handle parameter updates from worklet
        }
      };

      // Send initial parameters
      this.updateEQParameters(instance, eqNode);
    } catch (error) {
      console.error('Failed to create EQ worklet:', error);
    }
  }

  /**
   * Update EQ parameters
   */
  private updateEQParameters(instance: PluginInstanceNode, eqNode: AudioWorkletNode): void {
    const params = instance.parameters;

    eqNode.port.postMessage({
      type: 'updateParams',
      params: {
        lowFreq: params.lowFreq || 100,
        midFreq: params.midFreq || 1200,
        highFreq: params.highFreq || 9500,
        lowGain: params.lowGain || 0,
        midGain: params.midGain || 0,
        highGain: params.highGain || 0,
        lowQ: 1.0,
        midQ: params.midQ || 1.2,
        highQ: 1.0,
      },
    });
  }

  /**
   * Create Compression AudioWorklet node
   */
  private async createCompressionWorklet(instance: PluginInstanceNode): Promise<void> {
    try {
      const compNode = new AudioWorkletNode(this.audioContext as any, 'compression-processor');

      instance.inputNode.disconnect();
      instance.inputNode.connect(compNode);
      compNode.connect(instance.wetGain);

      this.workletNodes.set(instance.instanceId, compNode);
      this.updateCompressionParameters(instance, compNode);
    } catch (error) {
      console.error('Failed to create compression worklet:', error);
    }
  }

  /**
   * Update compression parameters
   */
  private updateCompressionParameters(
    instance: PluginInstanceNode,
    compNode: AudioWorkletNode
  ): void {
    const params = instance.parameters;

    compNode.port.postMessage({
      type: 'updateParams',
      params: {
        threshold: params.threshold || -18,
        ratio: params.ratio || 4,
        knee: 6,
        attack: params.attack || 0.02,
        release: params.release || 0.12,
        makeup: params.makeup || 3.5,
      },
    });
  }

  /**
   * Create Saturation AudioWorklet node
   */
  private async createSaturationWorklet(instance: PluginInstanceNode): Promise<void> {
    try {
      const satNode = new AudioWorkletNode(this.audioContext as any, 'saturation-processor');

      instance.inputNode.disconnect();
      instance.inputNode.connect(satNode);
      satNode.connect(instance.wetGain);

      this.workletNodes.set(instance.instanceId, satNode);
      this.updateSaturationParameters(instance, satNode);
    } catch (error) {
      console.error('Failed to create saturation worklet:', error);
    }
  }

  /**
   * Update saturation parameters
   */
  private updateSaturationParameters(
    instance: PluginInstanceNode,
    satNode: AudioWorkletNode
  ): void {
    const params = instance.parameters;

    satNode.port.postMessage({
      type: 'updateParams',
      params: {
        drive: params.drive || 0.45,
        tone: params.warmthTone || 1.5,
        mix: params.mix || 0.8,
        output: 1.0,
        mode: params.type || 'Tape',
      },
    });
  }

  /**
   * Apply DSP enhancements for instrument plugins
   */
  private async applyInstrumentDSP(
    instance: PluginInstanceNode,
    pluginDef: PluginDefinition
  ): Promise<void> {
    // Add filter nodes for instruments
    const filter = (this.audioContext as any).createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 12000;
    filter.Q.value = 1.0;

    instance.inputNode.disconnect();
    instance.inputNode.connect(filter);
    filter.connect(instance.wetGain);
  }

  /**
   * Apply DSP enhancements for mastering plugins
   */
  private async applyMasteringDSP(
    instance: PluginInstanceNode,
    pluginDef: PluginDefinition
  ): Promise<void> {
    // Add limiter for mastering
    const limiter = (this.audioContext as any).createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;

    instance.inputNode.disconnect();
    instance.inputNode.connect(limiter);
    limiter.connect(instance.wetGain);
  }

  /**
   * Setup parameter smoothing for a plugin instance
   */
  private setupParameterSmoothing(instance: PluginInstanceNode, pluginDef: PluginDefinition): void {
    instance.setParameterSmoothingTime(this.config.smoothingTime);

    // Create smoothers for automatable parameters
    pluginDef.parameters.forEach((param) => {
      if (param.automatable) {
        const paramId = `${instance.instanceId}-${param.id}`;
        this.parameterSmoothing.createSmoother(
          paramId,
          instance.parameters[param.id] as number,
          this.config.smoothingTime,
          RampType.LINEAR
        );
      }
    });
  }

  /**
   * Update plugin parameter with smoothing
   */
  setPluginParameter(
    instanceId: string,
    parameterId: string,
    value: number,
    smoothingTime?: number
  ): void {
    const instance = this.pluginInstances.get(instanceId);
    if (!instance) return;

    const paramId = `${instanceId}-${parameterId}`;

    if (this.config.enableParameterSmoothing) {
      this.parameterSmoothing.setTargetValue(paramId, value, smoothingTime);

      // Get smoothed value
      const smoothedValue = this.parameterSmoothing.getCurrentValue(paramId);
      instance.parameters[parameterId] = smoothedValue;
    } else {
      instance.parameters[parameterId] = value;
    }

    // Update worklet parameters if applicable
    const workletNode = this.workletNodes.get(instanceId);
    if (workletNode) {
      this.updateWorkletParameters(instance, workletNode);
    }
  }

  /**
   * Update worklet parameters
   */
  private updateWorkletParameters(
    instance: PluginInstanceNode,
    workletNode: AudioWorkletNode
  ): void {
    const pluginId = instance.pluginDef.id;

    if (pluginId === 'sonik-eq') {
      this.updateEQParameters(instance, workletNode);
    } else if (pluginId === 'sonik-comp') {
      this.updateCompressionParameters(instance, workletNode);
    } else if (pluginId === 'sonik-color') {
      this.updateSaturationParameters(instance, workletNode);
    }
  }

  /**
   * Get DSP graph state for a plugin instance
   */
  getDSPGraphState(instanceId: string): SerializedDSPGraph | null {
    const instance = this.pluginInstances.get(instanceId);
    if (!instance) return null;

    return instance.getDspGraph() as any;
  }

  /**
   * Set DSP graph state for a plugin instance
   */
  setDSPGraphState(instanceId: string, state: SerializedDSPGraph): void {
    const instance = this.pluginInstances.get(instanceId);
    if (!instance) return;

    instance.deserializeDspGraph(state as any);
  }

  /**
   * Remove a plugin instance
   */
  removePluginInstance(instanceId: string): void {
    const instance = this.pluginInstances.get(instanceId);
    if (!instance) return;

    // Clean up worklet nodes
    const workletNode = this.workletNodes.get(instanceId);
    if (workletNode) {
      workletNode.disconnect();
      this.workletNodes.delete(instanceId);
    }

    // Clean up parameter smoothers
    if (this.config.enableParameterSmoothing) {
      instance.pluginDef.parameters.forEach((param) => {
        if (param.automatable) {
          const paramId = `${instanceId}-${param.id}`;
          this.parameterSmoothing.removeSmoother(paramId);
        }
      });
    }

    this.pluginInstances.delete(instanceId);
  }

  /**
   * Get all plugin instances
   */
  getPluginInstances(): PluginInstanceNode[] {
    return Array.from(this.pluginInstances.values());
  }

  /**
   * Get DSP graph builder
   */
  getDSPGraphBuilder(): DSPGraphBuilder {
    return this.dspGraphBuilder;
  }

  /**
   * Get parameter smoothing engine
   */
  getParameterSmoothing(): ParameterSmoothingEngine {
    return this.parameterSmoothing;
  }

  /**
   * Destroy the DSP plugin integration
   */
  destroy(): void {
    // Clean up all plugin instances
    this.pluginInstances.forEach((instance, instanceId) => {
      this.removePluginInstance(instanceId);
    });

    // Clean up DSP graph builder
    this.dspGraphBuilder.destroy();

    // Clean up parameter smoothing
    this.parameterSmoothing.destroy();

    console.log('DSP Plugin Integration destroyed');
  }
}
