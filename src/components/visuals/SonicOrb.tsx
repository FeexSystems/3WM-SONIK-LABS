import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { landingAudioEngine } from '../../audio/landingAudioEngine';

export function SonicOrb() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Initialize Three.js Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Group for all rotating elements
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // 1. Central Core Sphere with Custom Shaders & Glassmorphic Wireframe
    const coreGeometry = new THREE.IcosahedronGeometry(1.35, 2);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#F5A800'),
      emissive: new THREE.Color('#1A1208'),
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    orbGroup.add(coreMesh);

    // 2. Outer Wireframe Polyhedron (The Scientist - Mint)
    const emarGeo = new THREE.IcosahedronGeometry(1.6, 2);
    const emarMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2AFFA3'),
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      emissive: new THREE.Color('#2AFFA3'),
      emissiveIntensity: 0.4,
    });
    const emarMesh = new THREE.Mesh(emarGeo, emarMat);
    orbGroup.add(emarMesh);

    // 3. Orbital Resonance Rings (The Sound God - Gold, The Vocal Oracle - Fire)
    const createRing = (
      radius: number,
      tube: number,
      color: string,
      rotX: number,
      rotY: number
    ) => {
      const ringGeo = new THREE.TorusGeometry(radius, tube, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.6,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = rotX;
      ringMesh.rotation.y = rotY;
      return ringMesh;
    };

    const goldRing = createRing(1.85, 0.015, '#F5A800', Math.PI / 3, 0);
    const fireRing = createRing(2.05, 0.012, '#FF3C00', -Math.PI / 4, Math.PI / 6);
    const mintRing = createRing(2.25, 0.01, '#2AFFA3', Math.PI / 6, -Math.PI / 4);

    orbGroup.add(goldRing);
    orbGroup.add(fireRing);
    orbGroup.add(mintRing);

    // 4. Floating Particle Cloud
    const particleCount = 280;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color('#F5A800'),
      new THREE.Color('#FF3C00'),
      new THREE.Color('#2AFFA3'),
    ];

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2.2 + Math.random() * 1.5;

      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);

      const pColor = colorPalette[i % colorPalette.length];
      particleColors[i * 3] = pColor.r;
      particleColors[i * 3 + 1] = pColor.g;
      particleColors[i * 3 + 2] = pColor.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    orbGroup.add(particles);

    // 5. Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const goldPoint = new THREE.PointLight(0xf5a800, 4, 12);
    goldPoint.position.set(3, 2, 4);
    scene.add(goldPoint);

    const firePoint = new THREE.PointLight(0xff3c00, 3, 12);
    firePoint.position.set(-3, -2, 3);
    scene.add(firePoint);

    const mintPoint = new THREE.PointLight(0x2affa3, 3, 12);
    mintPoint.position.set(0, 4, -2);
    scene.add(mintPoint);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    window.addEventListener('mousemove', onMouseMove);

    // Animation Loop
    let clock = { elapsed: 0 };
    let lastTime = performance.now();
    let animationId: number;

    const originalPositions = coreGeometry.attributes.position.clone();

    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      clock.elapsed += delta;

      // Mouse Lerp
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      orbGroup.rotation.y = clock.elapsed * 0.35 + targetX * 0.8;
      orbGroup.rotation.x = Math.sin(clock.elapsed * 0.25) * 0.15 + targetY * 0.6;

      // Rotate individual rings
      goldRing.rotation.z = clock.elapsed * 0.5;
      fireRing.rotation.y = -clock.elapsed * 0.4;
      mintRing.rotation.x = clock.elapsed * 0.3;
      particles.rotation.y = -clock.elapsed * 0.15;

      // Audio Reactivity from landing audio engine
      const freqData = landingAudioEngine.getFrequencyData();
      let bassEnergy = 0;
      if (freqData && freqData.length > 0) {
        for (let i = 0; i < 6; i++) {
          bassEnergy += freqData[i] || 0;
        }
        bassEnergy = bassEnergy / (6 * 255);
      }

      // Pulse Core scale
      const scalePulse = 1 + bassEnergy * 0.25 + Math.sin(clock.elapsed * 2) * 0.03;
      coreMesh.scale.set(scalePulse, scalePulse, scalePulse);

      // Distort core vertices with audio wave via direct typed array access
      const posAttr = coreGeometry.attributes.position;
      const posArray = posAttr.array as Float32Array;
      const origArray = originalPositions.array as Float32Array;
      const len = origArray.length;
      const factor = 0.08 + bassEnergy * 0.18;
      const t3 = clock.elapsed * 3;
      const t2 = clock.elapsed * 2;

      for (let i = 0; i < len; i += 3) {
        const u = origArray[i];
        const v = origArray[i + 1];
        const w = origArray[i + 2];
        const mult = 1 + Math.sin(u * 2.5 + t3) * Math.cos(v * 2.5 + t2) * factor;

        posArray[i] = u * mult;
        posArray[i + 1] = v * mult;
        posArray[i + 2] = w * mult;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      emarGeo.dispose();
      emarMat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-[520px] w-full items-center justify-center cursor-pointer group"
      onClick={() => {
        landingAudioEngine.playLogDrum(0, 55);
        landingAudioEngine.playKick(0);
      }}
      title="Click 3D Resonator Orb to trigger 808 Sub-Bass"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full drop-shadow-[0_0_50px_rgba(245,168,0,0.3)] transition-transform duration-700 group-hover:scale-105"
      />

      {/* Floating HUD status */}
      <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 font-mono text-[10px] text-[#C9C9D4] backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-[#F5A800] animate-ping" />
        <span className="font-bold text-white uppercase tracking-wider">3WM Resonator</span>
        <span className="text-[#F5A800]">Ready</span>
      </div>
    </div>
  );
}

export default SonicOrb;
