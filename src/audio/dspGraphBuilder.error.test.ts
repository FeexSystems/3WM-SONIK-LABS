/**
 * Error handling tests for DSP Graph Builder
 * Part of Phase 5.1.5: Test error handling paths across all modules
 */

import { DSPGraphBuilder, DSPNodeType } from './dspGraphBuilder';

describe('DSPGraphBuilder Error Handling', () => {
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

  describe('node creation errors', () => {
    it('should handle invalid node type', async () => {
      await dspGraphBuilder.initialize();

      const node = (dspGraphBuilder as any).createNode('INVALID_TYPE');

      expect(node).toBeUndefined();
    });

    it('should handle node creation without initialization', () => {
      const node = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      // Should handle gracefully even without initialization
      expect(node).toBeDefined();
    });
  });

  describe('connection errors', () => {
    it('should handle connection of non-existent destination node', async () => {
      await dspGraphBuilder.initialize();
      const sourceNode = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      const connected = dspGraphBuilder.connectNodes(sourceNode.id, 'non-existent');

      expect(connected).toBe(false);
    });

    it('should handle duplicate connections', async () => {
      await dspGraphBuilder.initialize();
      const sourceNode = dspGraphBuilder.createNode(DSPNodeType.GAIN);
      const destNode = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      dspGraphBuilder.connectNodes(sourceNode.id, destNode.id);
      const duplicate = dspGraphBuilder.connectNodes(sourceNode.id, destNode.id);

      expect(duplicate).toBe(false);
    });

    it('should handle self-connections', async () => {
      await dspGraphBuilder.initialize();
      const node = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      const connected = dspGraphBuilder.connectNodes(node.id, node.id);

      expect(connected).toBe(false);
    });
  });

  describe('parameter errors', () => {
    it('should handle setting parameter on non-existent node', async () => {
      await dspGraphBuilder.initialize();

      const success = dspGraphBuilder.setNodeParameter('non-existent', 'gain', 0.5);

      expect(success).toBe(false);
    });

    it('should handle setting invalid parameter', async () => {
      await dspGraphBuilder.initialize();
      const node = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      const success = dspGraphBuilder.setNodeParameter(node.id, 'invalid-param', 0.5);

      expect(success).toBe(false);
    });

    it('should handle setting out-of-range parameter values', async () => {
      await dspGraphBuilder.initialize();
      const node = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      // Should handle gracefully even if value is out of range
      const success = dspGraphBuilder.setNodeParameter(node.id, 'gain', 999);

      expect(success).toBe(true); // Audio nodes handle clamping internally
    });

    it('should handle negative smoothing time', async () => {
      await dspGraphBuilder.initialize();
      const node = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      const success = dspGraphBuilder.setNodeParameter(node.id, 'gain', 0.5, -0.01);

      expect(success).toBe(true); // Should handle negative time gracefully
    });
  });

  describe('serialization errors', () => {
    it('should handle deserialization of invalid data', async () => {
      await dspGraphBuilder.initialize();

      const invalidData = {
        version: 'invalid',
        nodes: null,
        connections: 'invalid',
      };

      // @ts-expect-error - Testing invalid data
      const success = dspGraphBuilder.deserialize(invalidData);

      expect(success).toBe(false);
    });

    it('should handle deserialization with missing nodes', async () => {
      await dspGraphBuilder.initialize();

      const invalidData = {
        version: '1.0',
        nodes: [],
        connections: [{ sourceId: 'non-existent', destId: 'also-non-existent' }],
      };

      const success = dspGraphBuilder.deserialize(invalidData as any);

      expect(success).toBe(false);
    });

    it('should handle serialization before initialization', () => {
      const serialized = dspGraphBuilder.serialize();

      // Should return valid structure even without initialization
      expect(serialized).toBeDefined();
      expect(serialized.version).toBe('1.0');
    });
  });

  describe('validation errors', () => {
    it('should handle validation of empty graph', async () => {
      await dspGraphBuilder.initialize();

      const validation = dspGraphBuilder.validateGraph();

      expect(validation.valid).toBe(true);
    });

    it('should handle validation with disconnected nodes', async () => {
      await dspGraphBuilder.initialize();
      dspGraphBuilder.createNode(DSPNodeType.GAIN);
      dspGraphBuilder.createNode(DSPNodeType.GAIN);

      const validation = dspGraphBuilder.validateGraph();

      // Disconnected nodes should be flagged
      expect(validation.valid).toBe(false);
    });

    it('should handle validation with no input nodes', async () => {
      await dspGraphBuilder.initialize();
      const outputNode = dspGraphBuilder.createNode(DSPNodeType.OUTPUT);

      const validation = dspGraphBuilder.validateGraph();

      expect(validation.valid).toBe(false);
    });
  });

  describe('destruction errors', () => {
    it('should handle multiple destruction calls', async () => {
      await dspGraphBuilder.initialize();
      await dspGraphBuilder.destroy();

      // Second destroy should not throw
      await expect(dspGraphBuilder.destroy()).resolves.not.toThrow();
    });

    it('should handle operations after destruction', async () => {
      await dspGraphBuilder.initialize();
      await dspGraphBuilder.destroy();

      // Operations after destruction should handle gracefully
      const node = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      expect(node).toBeDefined(); // May still work or return undefined
    });
  });

  describe('context errors', () => {
    it('should handle closed audio context', async () => {
      await dspGraphBuilder.initialize();
      await audioContext.close();

      // Operations should handle closed context gracefully
      const node = dspGraphBuilder.createNode(DSPNodeType.GAIN);

      expect(node).toBeDefined(); // May still work or return undefined
    });
  });
});
