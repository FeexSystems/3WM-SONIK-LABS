/**
 * 3WM SONIK — Agent Geometry Tests
 * Tests for procedural agent geometry generation
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createAgentGeometry, getAgentColor, getAgentEmissiveColor } from './AgentGeometry';

describe('AgentGeometry', () => {
  describe('createAgentGeometry', () => {
    it('should create geometry for Emar', () => {
      const geometry = createAgentGeometry('emar');
      expect(geometry).toBeInstanceOf(THREE.Group);
      expect(geometry.children.length).toBeGreaterThan(0);
    });

    it('should create geometry for Ricky', () => {
      const geometry = createAgentGeometry('ricky');
      expect(geometry).toBeInstanceOf(THREE.Group);
      expect(geometry.children.length).toBeGreaterThan(0);
    });

    it('should create geometry for Kingpin', () => {
      const geometry = createAgentGeometry('kingpin');
      expect(geometry).toBeInstanceOf(THREE.Group);
      expect(geometry.children.length).toBeGreaterThan(0);
    });

    it('should have correct number of shapes for Emar', () => {
      const geometry = createAgentGeometry('emar');
      // Emar should have base + 3 cubes + 1 icosahedron = 5 shapes
      expect(geometry.children.length).toBe(5);
    });

    it('should have correct number of shapes for Ricky', () => {
      const geometry = createAgentGeometry('ricky');
      // Ricky should have base + 2 cylinders + 1 torus + 1 spike = 5 shapes
      expect(geometry.children.length).toBe(5);
    });

    it('should have correct number of shapes for Kingpin', () => {
      const geometry = createAgentGeometry('kingpin');
      // Kingpin should have base + 3 crown cones + 2 vocal rings = 6 shapes
      expect(geometry.children.length).toBe(6);
    });
  });

  describe('getAgentColor', () => {
    it('should return correct color for Emar', () => {
      const color = getAgentColor('emar');
      expect(color).toBe(0x2affa3);
    });

    it('should return correct color for Ricky', () => {
      const color = getAgentColor('ricky');
      expect(color).toBe(0xf5a800);
    });

    it('should return correct color for Kingpin', () => {
      const color = getAgentColor('kingpin');
      expect(color).toBe(0xff3c00);
    });
  });

  describe('getAgentEmissiveColor', () => {
    it('should return correct emissive color for Emar', () => {
      const color = getAgentEmissiveColor('emar');
      expect(color).toBe(0x2affa3);
    });

    it('should return correct emissive color for Ricky', () => {
      const color = getAgentEmissiveColor('ricky');
      expect(color).toBe(0xf5a800);
    });

    it('should return correct emissive color for Kingpin', () => {
      const color = getAgentEmissiveColor('kingpin');
      expect(color).toBe(0xff3c00);
    });
  });

  describe('Material Properties', () => {
    it('should have PBR materials', () => {
      const geometry = createAgentGeometry('emar');
      geometry.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
          expect(material.metalness).toBe(0.8);
          expect(material.roughness).toBe(0.2);
        }
      });
    });

    it('should have emissive materials', () => {
      const geometry = createAgentGeometry('ricky');
      geometry.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          expect(material.emissiveIntensity).toBeGreaterThan(0);
        }
      });
    });
  });
});
