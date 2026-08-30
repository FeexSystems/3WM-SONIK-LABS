/**
 * DSP Graph Builder - Real-time audio effect graph construction
 * Part of Phase 4.1.2: Implement DSP graph builder for real-time audio effects
 */

export enum DSPNodeType {
  SOURCE = 'source',
  GAIN = 'gain',
  EQ = 'eq',
  COMPRESSOR = 'compressor',
  SATURATION = 'saturation',
  REVERB = 'reverb',
  DELAY = 'delay',
  FILTER = 'filter',
  LIMITER = 'limiter',
  CHORUS = 'chorus',
  PHASER = 'phaser',
  FLANGER = 'flanger',
  OUTPUT = 'output',
}

export interface DSPNode {
  id: string;
  type: DSPNodeType;
  audioNode: AudioNode | AudioWorkletNode | null;
  parameters: Map<string, AudioParam | number | string>;
  state: any;
  position: { x: number; y: number };
}

export interface Connection {
  fromNodeId: string;
  fromOutput: number;
  toNodeId: string;
  toInput: number;
}

export interface DSPGraph {
  nodes: Map<string, DSPNode>;
  connections: Connection[];
  audioContext: AudioContext;
}

export interface SerializedDSPNode {
  id: string;
  type: DSPNodeType;
  position: { x: number; y: number };
  state: any;
  parameters: Record<string, number>;
}

export interface SerializedDSPGraph {
  version: string;
  nodes: SerializedDSPNode[];
  connections: Connection[];
}

export class DSPGraphBuilder {
  private graph: DSPGraph;
  private audioContext: AudioContext;
  private isInitialized: boolean = false;

  constructor(audioContext?: AudioContext) {
    this.audioContext = audioContext || new AudioContext();
    this.graph = {
      nodes: new Map(),
      connections: [],
      audioContext: this.audioContext,
    };
  }

  /**
   * Initialize the DSP graph builder
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.audioContext.resume();
      this.isInitialized = true;
      console.log('DSP Graph Builder initialized');
    } catch (error) {
      console.error('Failed to initialize DSP Graph Builder:', error);
      throw error;
    }
  }

  /**
   * Create a new DSP node
   */
  createNode(type: DSPNodeType, id?: string, initialState?: any): DSPNode {
    const nodeId = id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let audioNode: AudioNode | AudioWorkletNode | null = null;
    const parameters = new Map<string, AudioParam | number | string>();

    switch (type) {
      case DSPNodeType.GAIN:
        audioNode = this.audioContext.createGain();
        parameters.set('gain', (audioNode as GainNode).gain.value);
        break;

      case DSPNodeType.EQ:
        audioNode = this.audioContext.createBiquadFilter();
        (audioNode as BiquadFilterNode).type = 'peaking';
        parameters.set('frequency', (audioNode as BiquadFilterNode).frequency.value);
        parameters.set('Q', (audioNode as BiquadFilterNode).Q.value);
        parameters.set('gain', (audioNode as BiquadFilterNode).gain.value);
        break;

      case DSPNodeType.COMPRESSOR:
        audioNode = this.audioContext.createDynamicsCompressor();
        parameters.set('threshold', (audioNode as DynamicsCompressorNode).threshold.value);
        parameters.set('knee', (audioNode as DynamicsCompressorNode).knee.value);
        parameters.set('ratio', (audioNode as DynamicsCompressorNode).ratio.value);
        parameters.set('attack', (audioNode as DynamicsCompressorNode).attack.value);
        parameters.set('release', (audioNode as DynamicsCompressorNode).release.value);
        break;

      case DSPNodeType.FILTER:
        audioNode = this.audioContext.createBiquadFilter();
        parameters.set('frequency', (audioNode as BiquadFilterNode).frequency.value);
        parameters.set('Q', (audioNode as BiquadFilterNode).Q.value);
        parameters.set('type', (audioNode as BiquadFilterNode).type);
        break;

      case DSPNodeType.DELAY:
        audioNode = this.audioContext.createDelay(5.0);
        parameters.set('delayTime', (audioNode as DelayNode).delayTime.value);
        break;

      case DSPNodeType.CHORUS:
        // Chorus: Multiple modulated delay lines
        audioNode = this.audioContext.createDelay(5.0);
        parameters.set('delayTime', (audioNode as DelayNode).delayTime.value);
        parameters.set('rate', 1.5); // LFO rate in Hz
        parameters.set('depth', 0.5); // Modulation depth
        parameters.set('voices', 3); // Number of chorus voices
        break;

      case DSPNodeType.PHASER:
        // Phaser: All-pass filters with LFO modulation
        audioNode = this.audioContext.createBiquadFilter();
        (audioNode as BiquadFilterNode).type = 'allpass';
        parameters.set('frequency', (audioNode as BiquadFilterNode).frequency.value);
        parameters.set('Q', (audioNode as BiquadFilterNode).Q.value);
        parameters.set('rate', 0.5); // LFO rate in Hz
        parameters.set('depth', 1000); // Modulation depth in Hz
        parameters.set('feedback', 0.7); // Feedback amount
        parameters.set('stages', 4); // Number of all-pass stages
        break;

      case DSPNodeType.FLANGER:
        // Flanger: Short delay with feedback and LFO modulation
        audioNode = this.audioContext.createDelay(0.1);
        parameters.set('delayTime', (audioNode as DelayNode).delayTime.value);
        parameters.set('rate', 0.1); // LFO rate in Hz
        parameters.set('depth', 0.01); // Modulation depth in seconds
        parameters.set('feedback', 0.8); // Feedback amount
        parameters.set('mix', 0.5); // Wet/dry mix
        break;

      case DSPNodeType.SOURCE:
        // Source nodes are created externally (e.g., from audio files)
        audioNode = null;
        break;

      case DSPNodeType.OUTPUT:
        audioNode = this.audioContext.destination;
        break;

      default:
        console.warn(`Unknown DSP node type: ${type}`);
    }

    const node: DSPNode = {
      id: nodeId,
      type,
      audioNode,
      parameters,
      state: initialState || {},
      position: { x: 0, y: 0 },
    };

    this.graph.nodes.set(nodeId, node);
    return node;
  }

  /**
   * Remove a DSP node
   */
  removeNode(nodeId: string): boolean {
    const node = this.graph.nodes.get(nodeId);
    if (!node) return false;

    // Disconnect all connections involving this node
    this.graph.connections = this.graph.connections.filter(
      (conn) => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
    );

    // Disconnect audio node if it exists
    if (node.audioNode && node.type !== DSPNodeType.OUTPUT) {
      try {
        node.audioNode.disconnect();
      } catch (error) {
        console.warn(`Failed to disconnect node ${nodeId}:`, error);
      }
    }

    this.graph.nodes.delete(nodeId);
    return true;
  }

  /**
   * Connect two DSP nodes
   */
  connectNodes(
    fromNodeId: string,
    toNodeId: string,
    fromOutput: number = 0,
    toInput: number = 0
  ): boolean {
    const fromNode = this.graph.nodes.get(fromNodeId);
    const toNode = this.graph.nodes.get(toNodeId);

    if (!fromNode || !toNode) {
      console.error(`Cannot connect: one or both nodes not found`);
      return false;
    }

    if (!fromNode.audioNode || !toNode.audioNode) {
      console.error(`Cannot connect: one or both nodes have no audio node`);
      return false;
    }

    try {
      fromNode.audioNode.connect(toNode.audioNode, fromOutput, toInput);

      const connection: Connection = {
        fromNodeId,
        fromOutput,
        toNodeId,
        toInput,
      };

      this.graph.connections.push(connection);
      return true;
    } catch (error) {
      console.error(`Failed to connect nodes:`, error);
      return false;
    }
  }

  /**
   * Disconnect two DSP nodes
   */
  disconnectNodes(
    fromNodeId: string,
    toNodeId: string,
    fromOutput: number = 0,
    toInput: number = 0
  ): boolean {
    const fromNode = this.graph.nodes.get(fromNodeId);
    const toNode = this.graph.nodes.get(toNodeId);

    if (!fromNode || !toNode) return false;
    if (!fromNode.audioNode || !toNode.audioNode) return false;

    try {
      fromNode.audioNode.disconnect(toNode.audioNode, fromOutput, toInput);

      this.graph.connections = this.graph.connections.filter(
        (conn) =>
          !(
            conn.fromNodeId === fromNodeId &&
            conn.toNodeId === toNodeId &&
            conn.fromOutput === fromOutput &&
            conn.toInput === toInput
          )
      );

      return true;
    } catch (error) {
      console.error(`Failed to disconnect nodes:`, error);
      return false;
    }
  }

  /**
   * Set a parameter on a DSP node
   */
  setNodeParameter(
    nodeId: string,
    parameterName: string,
    value: number,
    rampTime: number = 0
  ): boolean {
    const node = this.graph.nodes.get(nodeId);
    if (!node) return false;

    const param = node.parameters.get(parameterName);
    if (!param) return false;

    if (param instanceof AudioParam) {
      if (rampTime > 0) {
        param.linearRampToValueAtTime(value, this.audioContext.currentTime + rampTime);
      } else {
        param.value = value;
      }
    } else {
      node.parameters.set(parameterName, value);
    }

    return true;
  }

  /**
   * Get a parameter from a DSP node
   */
  getNodeParameter(nodeId: string, parameterName: string): number | undefined {
    const node = this.graph.nodes.get(nodeId);
    if (!node) return undefined;

    const param = node.parameters.get(parameterName);
    if (param instanceof AudioParam) {
      return param.value;
    }
    return param as number;
  }

  /**
   * Validate the DSP graph
   */
  validateGraph(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for cycles
    if (this.hasCycles()) {
      errors.push('Graph contains cycles');
    }

    // Check for disconnected nodes
    const connectedNodeIds = new Set<string>();
    this.graph.connections.forEach((conn) => {
      connectedNodeIds.add(conn.fromNodeId);
      connectedNodeIds.add(conn.toNodeId);
    });

    this.graph.nodes.forEach((node, id) => {
      if (node.type !== DSPNodeType.SOURCE && !connectedNodeIds.has(id)) {
        errors.push(`Node ${id} is disconnected`);
      }
    });

    // Check for multiple outputs
    const outputNodes = Array.from(this.graph.nodes.values()).filter(
      (node) => node.type === DSPNodeType.OUTPUT
    );

    if (outputNodes.length > 1) {
      errors.push('Graph has multiple output nodes');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if the graph has cycles
   */
  private hasCycles(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingConnections = this.graph.connections.filter(
        (conn) => conn.fromNodeId === nodeId
      );

      for (const conn of outgoingConnections) {
        if (hasCycle(conn.toNodeId)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.graph.nodes.keys()) {
      if (hasCycle(nodeId)) return true;
    }

    return false;
  }

  /**
   * Serialize the DSP graph
   */
  serialize(): SerializedDSPGraph {
    const nodes: SerializedDSPNode[] = [];

    this.graph.nodes.forEach((node) => {
      const serializedNode: SerializedDSPNode = {
        id: node.id,
        type: node.type,
        position: node.position,
        state: node.state,
        parameters: {},
      };

      node.parameters.forEach((value, key) => {
        if (value instanceof AudioParam) {
          serializedNode.parameters[key] = value.value;
        } else {
          serializedNode.parameters[key] = value as number;
        }
      });

      nodes.push(serializedNode);
    });

    return {
      version: '1.0',
      nodes,
      connections: [...this.graph.connections],
    };
  }

  /**
   * Deserialize a DSP graph
   */
  deserialize(serialized: SerializedDSPGraph): boolean {
    try {
      // Clear existing graph
      this.graph.nodes.forEach((node) => {
        if (node.audioNode && node.type !== DSPNodeType.OUTPUT) {
          try {
            node.audioNode.disconnect();
          } catch (error) {
            // Ignore disconnection errors
          }
        }
      });
      this.graph.nodes.clear();
      this.graph.connections = [];

      // Recreate nodes
      serialized.nodes.forEach((serializedNode) => {
        const node = this.createNode(serializedNode.type, serializedNode.id, serializedNode.state);
        node.position = serializedNode.position;

        // Restore parameters
        Object.entries(serializedNode.parameters).forEach(([key, value]) => {
          this.setNodeParameter(node.id, key, value);
        });
      });

      // Recreate connections
      serialized.connections.forEach((connection) => {
        this.connectNodes(
          connection.fromNodeId,
          connection.toNodeId,
          connection.fromOutput,
          connection.toInput
        );
      });

      return true;
    } catch (error) {
      console.error('Failed to deserialize DSP graph:', error);
      return false;
    }
  }

  /**
   * Get the current graph
   */
  getGraph(): DSPGraph {
    return this.graph;
  }

  /**
   * Get all nodes
   */
  getNodes(): DSPNode[] {
    return Array.from(this.graph.nodes.values());
  }

  /**
   * Get a specific node
   */
  getNode(nodeId: string): DSPNode | undefined {
    return this.graph.nodes.get(nodeId);
  }

  /**
   * Get all connections
   */
  getConnections(): Connection[] {
    return [...this.graph.connections];
  }

  /**
   * Clear the entire graph
   */
  clearGraph(): void {
    this.graph.nodes.forEach((node) => {
      if (node.audioNode && node.type !== DSPNodeType.OUTPUT) {
        try {
          node.audioNode.disconnect();
        } catch (error) {
          // Ignore disconnection errors
        }
      }
    });
    this.graph.nodes.clear();
    this.graph.connections = [];
  }

  /**
   * Destroy the DSP graph builder
   */
  destroy(): void {
    this.clearGraph();
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.isInitialized = false;
  }
}
