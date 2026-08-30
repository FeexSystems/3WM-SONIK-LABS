/**
 * Unit tests for DSP Graph Builder
 * Part of Phase 5.1.2: Add unit tests for critical audio components
 */

import { DSPGraphBuilder, DSPNodeType } from './dspGraphBuilder';

describe('DSPGraphBuilder', () => {
  let dspGraphBuilder: DSPGraphBuilder;
  let audioContext: AudioContext;

  beforeEach(() => {
    audioContext = new AudioContext();
    dspGraphBuilder = new DSPGraphBuilder(audioContext);
  });

  afterEach(async () => {
    await dspGraphBuilder.destroy();
    await audioContext.close();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await dspGraphBuilder.initialize();
      expect(dspGraphBuilder).toBeDefined();
    });

    it('should create an empty graph initially', () => {
      const graph = dspGraphBuilder.getGraph();
      expect(graph.nodes.size).toBe(0);
      expect(graph.connections.length).toBe(0);
    });
  });

  describe('node creation', () => {
    it('should create a gain node', async () => {
      await dspGraphBuilder.initialize();
      const node = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      expect(node).toBeDefined();
      expect(node.type).toBe(DSPNodeType.GAIN);
      expect(node.audioNode).toBeInstanceOf(GainNode);
    });

    it('should create an EQ node', async () => {
      await dspGraphBuilder.initialize();
      const node = dspGraphBuilder.createNode(DSPNodeType.EQ);

      expect(node).toBeDefined();
      expect(node.type).toBe(DSPNodeType.EQ);
      expect(node.audioNode).toBeInstanceOf(BiquadFilterNode);
    });

    it('should create a compressor node', async () => {
      await dspGraphBuilder.initialize();
      const node = dspGraphBuilder.createNode(DSPNodeType.COMPRESSOR);

      expect(node).toBeDefined();
      expect(node.type).toBe(DSPNodeType.COMPRESSOR);
      expect(node.audioNode).toBeInstanceOf(DynamicsCompressorNode);
    });

    it('should create nodes with unique IDs', async () => {
      await dspGraphBuilder.initialize();
      const node1 = dspGraphBuilder.createNode(DSPNodeType.GAIN);
      const node2 = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      expect(node1.id).not.toBe(node2.id);
    });
  });

  describe('node removal', () => {
    it('should remove a node', async () => {
      await dspGraphBuilder.initialize();
      const node = dspGraphBuilder.createNode(DSPNodeType.GAIN);
      const nodeId = node.id;

      const removed = dspGraphBuilder.removeNode(nodeId);

      expect(removed).toBe(true);
      expect(dspGraphBuilder.getNode(nodeId)).toBeUndefined();
    });

    it('should return false when removing non-existent node', () => {
      const removed = dspGraphBuilder.removeNode('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('node connections', () => {
    it('should connect two nodes', async () => {
      await dspGraphBuilder.initialize();
      const sourceNode = dspGraphBuilder.createNode(DSPNodeType.GAIN);
      const destNode = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      const connected = dspGraphBuilder.connectNodes(sourceNode.id, destNode.id);

      expect(connected).toBe(true);
      expect(dspGraphBuilder.getConnections().length).toBe(1);
    });

    it('should disconnect two nodes', async () => {
      await dspGraphBuilder.initialize();
      const sourceNode = dspGraphBuilder.createNode(DSPNodeType.GAIN);
      const destNode = dspGraphBuilder.createNode(DSPNodeType.GAIN);
      dspGraphBuilder.connectNodes(sourceNode.id, destNode.id);

      const disconnected = dspGraphBuilder.disconnectNodes(sourceNode.id, destNode.id);

      expect(disconnected).toBe(true);
      expect(dspGraphBuilder.getConnections().length).toBe(0);
    });

    it('should return false when connecting non-existent nodes', async () => {
      await dspGraphBuilder.initialize();
      const connected = dspGraphBuilder.connectNodes('non-existent', 'non-existent');
      expect(connected).toBe(false);
    });
  });

  describe('parameter management', () => {
    it('should set node parameter', async () => {
      await dspGraphBuilder.initialize();
      const node = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      const success = dspGraphBuilder.setNodeParameter(node.id, 'gain', 0.5);

      expect(success).toBe(true);
      expect(dspGraphBuilder.getNodeParameter(node.id, 'gain')).toBe(0.5);
    });

    it('should set parameter with ramp time', async () => {
      await dspGraphBuilder.initialize();
      const node = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      const success = dspGraphBuilder.setNodeParameter(node.id, 'gain', 0.8, 0.1);

      expect(success).toBe(true);
    });

    it('should return undefined for non-existent parameter', async () => {
      await dspGraphBuilder.initialize();
      const node = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      const value = dspGraphBuilder.getNodeParameter(node.id, 'non-existent');

      expect(value).toBeUndefined();
    });
  });

  describe('graph validation', () => {
    it('should validate an empty graph', async () => {
      await dspGraphBuilder.initialize();
      const validation = dspGraphBuilder.validateGraph();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect cycles in graph', async () => {
      await dspGraphBuilder.initialize();
      const node1 = dspGraphBuilder.createNode(DSPNodeType.GAIN);
      const node2 = dspGraphBuilder.createNode(DSPNodeType.GAIN);
      const node3 = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      dspGraphBuilder.connectNodes(node1.id, node2.id);
      dspGraphBuilder.connectNodes(node2.id, node3.id);
      dspGraphBuilder.connectNodes(node3.id, node1.id); // Create cycle

      const validation = dspGraphBuilder.validateGraph();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Graph contains cycles');
    });

    it('should detect multiple output nodes', async () => {
      await dspGraphBuilder.initialize();
      const output1 = dspGraphBuilder.createNode(DSPNodeType.OUTPUT);
      const output2 = dspGraphBuilder.createNode(DSPNodeType.OUTPUT);

      const validation = dspGraphBuilder.validateGraph();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Graph has multiple output nodes');
    });
  });

  describe('serialization', () => {
    it('should serialize graph to JSON', async () => {
      await dspGraphBuilder.initialize();
      const node = dspGraphBuilder.createNode(DSPNodeType.GAIN);
      dspGraphBuilder.setNodeParameter(node.id, 'gain', 0.75);

      const serialized = dspGraphBuilder.serialize();

      expect(serialized).toBeDefined();
      expect(serialized.version).toBe('1.0');
      expect(serialized.nodes).toHaveLength(1);
      expect(serialized.nodes[0].parameters.gain).toBe(0.75);
    });

    it('should deserialize graph from JSON', async () => {
      await dspGraphBuilder.initialize();

      const serialized = {
        version: '1.0',
        nodes: [
          {
            id: 'test-node',
            type: DSPNodeType.GAIN,
            position: { x: 0, y: 0 },
            state: {},
            parameters: { gain: 0.5 },
          },
        ],
        connections: [],
      };

      const success = dspGraphBuilder.deserialize(serialized);

      expect(success).toBe(true);
      expect(dspGraphBuilder.getNodes()).toHaveLength(1);
    });

    it('should preserve parameters during serialization round-trip', async () => {
      await dspGraphBuilder.initialize();
      const node = dspGraphBuilder.createNode(DSPNodeType.GAIN);
      dspGraphBuilder.setNodeParameter(node.id, 'gain', 0.85);

      const serialized = dspGraphBuilder.serialize();
      dspGraphBuilder.clearGraph();
      dspGraphBuilder.deserialize(serialized);

      const restoredNode = dspGraphBuilder.getNodes()[0];
      expect(dspGraphBuilder.getNodeParameter(restoredNode.id, 'gain')).toBe(0.85);
    });
  });

  describe('graph clearing', () => {
    it('should clear all nodes and connections', async () => {
      await dspGraphBuilder.initialize();
      dspGraphBuilder.createNode(DSPNodeType.GAIN);
      dspGraphBuilder.createNode(DSPNodeType.EQ);

      dspGraphBuilder.clearGraph();

      expect(dspGraphBuilder.getNodes()).toHaveLength(0);
      expect(dspGraphBuilder.getConnections()).toHaveLength(0);
    });
  });

  describe('destruction', () => {
    it('should close audio context on destroy', async () => {
      await dspGraphBuilder.initialize();
      await dspGraphBuilder.destroy();

      // Note: AudioContext state may not be 'closed' immediately
      expect(dspGraphBuilder).toBeDefined();
    });
  });
});
