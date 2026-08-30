import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { soundEngine } from '../../audio/engine';
import { AvatarState } from '../../types';
import { Play, Pause, Sparkles, Eye, RotateCcw, Volume2, Mic, Sliders, Layers } from 'lucide-react';
import {
  artistProfiles,
  AVATAR_STATE_OPTIONS,
  StudioRoomId,
  STUDIO_ROOMS,
  EnhancedArtistProfile,
} from './artistProfiles';

export { artistProfiles, AVATAR_STATE_OPTIONS, STUDIO_ROOMS };
export type { StudioRoomId };

interface Studio3DCanvasProps {
  isPlaying: boolean;
  onTogglePlay?: () => void;
  selectedAvatar?: string;
  onSelectAvatar?: (id: string) => void;
  activeRoom?: StudioRoomId;
  onSelectRoom?: (room: StudioRoomId) => void;
  currentArtistState?: AvatarState;
  onArtistStateChange?: (state: AvatarState) => void;
  sessionLabel?: string;
  onTriggerActionFeedback?: (message: string) => void;
}

export type CameraView = 'WIDE' | 'ARTIST_FOCUS' | 'MIXER_VIEW' | 'BOOTH_CLOSEUP';
export type QualityMode = 'BALANCED' | 'CINEMATIC';

interface AvatarRig {
  id: string;
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  halo: THREE.Group;
  coreResonator?: THREE.Mesh;
  bodyMat: THREE.MeshStandardMaterial;
  accentMat: THREE.MeshBasicMaterial;
  spotlight: THREE.SpotLight;
}

const AVATAR_X: Record<string, number> = { emar: -1.8, ricky: 0, kingpin: 1.8 };

function motionForState(state: AvatarState, playing: boolean, energy: number) {
  switch (state) {
    case 'IDLE':
      return {
        bounceFreq: 0.7,
        bounceAmp: 0.016,
        swayY: 0.06,
        swayZ: 0.008,
        haloSpin: 0.35,
        leanX: 0,
      };
    case 'LISTENING':
      return {
        bounceFreq: 0.9,
        bounceAmp: 0.02,
        swayY: 0.05,
        swayZ: 0.01,
        haloSpin: 0.8,
        leanX: 0.12,
      };
    case 'RECORDING':
      return {
        bounceFreq: 0.35,
        bounceAmp: 0.01,
        swayY: 0.02,
        swayZ: 0.004,
        haloSpin: 2.2,
        leanX: 0.06,
      };
    case 'SINGING':
      return {
        bounceFreq: playing ? 3.2 : 1.8,
        bounceAmp: 0.05 + energy * 0.14,
        swayY: 0.1,
        swayZ: 0.03,
        haloSpin: 1.6,
        leanX: 0.04,
      };
    case 'THINKING':
      return {
        bounceFreq: 0.55,
        bounceAmp: 0.018,
        swayY: 0.22,
        swayZ: 0.012,
        haloSpin: 0.45,
        leanX: -0.04,
      };
    case 'MIXING':
      return {
        bounceFreq: 1.8,
        bounceAmp: 0.035 + energy * 0.06,
        swayY: 0.12,
        swayZ: 0.055,
        haloSpin: 1.2,
        leanX: 0.08,
      };
    case 'MASTERING':
      return {
        bounceFreq: 0.45,
        bounceAmp: 0.012,
        swayY: 0.04,
        swayZ: 0.006,
        haloSpin: 0.25,
        leanX: 0,
      };
    case 'CELEBRATING':
      return {
        bounceFreq: 5.2,
        bounceAmp: 0.12 + energy * 0.1,
        swayY: 0.16,
        swayZ: 0.05,
        haloSpin: 3.5,
        leanX: 0,
      };
    case 'WARNING':
    case 'ERROR':
      return { bounceFreq: 7, bounceAmp: 0.03, swayY: 0.18, swayZ: 0.04, haloSpin: 4, leanX: 0 };
    default:
      return { bounceFreq: 1, bounceAmp: 0.02, swayY: 0.08, swayZ: 0.01, haloSpin: 0.6, leanX: 0 };
  }
}

function disposeScene(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const material = (child as THREE.Mesh).material;
    if (!material) return;
    const mats = Array.isArray(material) ? material : [material];
    mats.forEach((mat) => {
      if (!mat) return;
      Object.values(mat).forEach((value) => {
        if (value && typeof value === 'object' && 'isTexture' in value) {
          (value as THREE.Texture).dispose();
        }
      });
      mat.dispose();
    });
  });
}

export const Studio3DCanvas: React.FC<Studio3DCanvasProps> = ({
  isPlaying,
  onTogglePlay,
  selectedAvatar = 'emar',
  onSelectAvatar,
  activeRoom = 'control_room',
  onSelectRoom,
  currentArtistState = 'LISTENING',
  onArtistStateChange,
  sessionLabel,
  onTriggerActionFeedback,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [qualityMode, setQualityMode] = useState<QualityMode>('BALANCED');
  const [activeCameraView, setActiveCameraView] = useState<CameraView>('WIDE');
  const [glError, setGlError] = useState<string | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);

  const pointerPosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const liveRef = useRef({
    isPlaying,
    selectedAvatar,
    activeRoom,
    activeCameraView,
    qualityMode,
    currentArtistState,
  });
  liveRef.current = {
    isPlaying,
    selectedAvatar,
    activeRoom,
    activeCameraView,
    qualityMode,
    currentArtistState,
  };

  const activeArtist = (artistProfiles.find((a) => a.id === selectedAvatar) ||
    artistProfiles[0]) as EnhancedArtistProfile;
  const currentRoomConfig = STUDIO_ROOMS[activeRoom] || STUDIO_ROOMS.control_room;

  // Handle pointer tracking for parallax & raycasting
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    pointerPosRef.current.targetX = x;
    pointerPosRef.current.targetY = y;
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const roomCfg = STUDIO_ROOMS[liveRef.current.activeRoom] || STUDIO_ROOMS.control_room;
    scene.background = new THREE.Color(roomCfg.fogColorHex);
    scene.fog = new THREE.FogExp2(roomCfg.fogColorHex, roomCfg.fogDensity);

    const camera = new THREE.PerspectiveCamera(
      48,
      Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
      0.1,
      100
    );
    camera.position.set(0, 3.2, 7.5);
    camera.lookAt(0, 1.4, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setGlError('WebGL is not available on this device.');
      return;
    }

    if (!renderer.getContext()) {
      renderer.dispose();
      setGlError('WebGL context failed to initialize.');
      return;
    }

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(roomCfg.ambientHex, 1.2);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.SpotLight(0xf5a800, 4.5);
    mainKeyLight.position.set(0, 7, 3);
    mainKeyLight.angle = Math.PI / 3.8;
    mainKeyLight.penumbra = 0.65;
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    mainKeyLight.shadow.bias = -0.0008;
    scene.add(mainKeyLight);

    const scientistRimLight = new THREE.PointLight(0x2affa3, 3, 14);
    scientistRimLight.position.set(-4, 2.5, -2);
    scene.add(scientistRimLight);

    const fireOracleLight = new THREE.PointLight(0xff3c00, 3, 14);
    fireOracleLight.position.set(4, 2.5, -2);
    scene.add(fireOracleLight);

    // Floor Mesh & Grid
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x14110e,
      roughness: 0.32,
      metalness: 0.65,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const floorGrid = new THREE.GridHelper(30, 30, 0xf5a800, 0x1f1710);
    floorGrid.position.y = 0.015;
    scene.add(floorGrid);

    // Room Environment Container (Dynamically populated)
    const roomEnvironmentGroup = new THREE.Group();
    scene.add(roomEnvironmentGroup);

    // Speaker references for audio reactivity
    const speakerCones: THREE.Mesh[] = [];
    const interactiveMeshes: THREE.Object3D[] = [];

    // Helper to build Room Meshes
    const buildRoomGeometry = (roomId: StudioRoomId) => {
      disposeScene(roomEnvironmentGroup);
      while (roomEnvironmentGroup.children.length > 0) {
        roomEnvironmentGroup.remove(roomEnvironmentGroup.children[0]);
      }
      speakerCones.length = 0;

      const curRoom = STUDIO_ROOMS[roomId];
      scene.background = new THREE.Color(curRoom.fogColorHex);
      if (scene.fog) {
        (scene.fog as THREE.FogExp2).color.setHex(curRoom.fogColorHex);
        (scene.fog as THREE.FogExp2).density = curRoom.fogDensity;
      }
      ambientLight.color.setHex(curRoom.ambientHex);

      if (roomId === 'control_room') {
        // Acoustic Walnut Diffuser Backwall
        let slatIdx = 0;
        for (let x = -7; x <= 7; x += 0.75) {
          const depth = 0.18 + Math.sin(x * 1.8) * 0.08;
          const slat = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, 5, depth),
            new THREE.MeshStandardMaterial({
              color: slatIdx % 2 === 0 ? 0x22160c : 0x362112,
              roughness: 0.55,
              metalness: 0.15,
            })
          );
          slat.position.set(x, 2.5, -4.2);
          slat.castShadow = true;
          slat.receiveShadow = true;
          roomEnvironmentGroup.add(slat);
          slatIdx++;
        }

        // Gold Horizon Neon Strip
        const neonMat = new THREE.MeshBasicMaterial({ color: 0xf5a800 });
        const neonStrip = new THREE.Mesh(new THREE.BoxGeometry(14, 0.08, 0.05), neonMat);
        neonStrip.position.set(0, 3.8, -4.05);
        roomEnvironmentGroup.add(neonStrip);

        // Control Desk
        const desk = new THREE.Mesh(
          new THREE.BoxGeometry(4.8, 0.18, 1.8),
          new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.25, metalness: 0.7 })
        );
        desk.position.set(0, 1.05, 0.6);
        desk.castShadow = true;
        desk.receiveShadow = true;
        desk.name = 'studio_console';
        roomEnvironmentGroup.add(desk);
        interactiveMeshes.push(desk);

        // Studio Monitor Speakers
        [-2.1, 2.1].forEach((xPos, idx) => {
          const speakerBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.9, 0.55),
            new THREE.MeshStandardMaterial({ color: 0x101216, roughness: 0.35, metalness: 0.4 })
          );
          speakerBox.position.set(xPos, 1.65, 0.4);
          speakerBox.rotation.y = xPos > 0 ? -0.28 : 0.28;
          speakerBox.castShadow = true;
          speakerBox.name = `studio_monitor_${idx === 0 ? 'left' : 'right'}`;
          roomEnvironmentGroup.add(speakerBox);
          interactiveMeshes.push(speakerBox);

          const cone = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.16, 0.06, 24),
            new THREE.MeshStandardMaterial({
              color: 0xf5a800,
              emissive: 0xf5a800,
              emissiveIntensity: 0.4,
            })
          );
          cone.rotation.x = Math.PI / 2;
          cone.position.set(xPos, 1.65, 0.68);
          cone.rotation.y = xPos > 0 ? -0.28 : 0.28;
          roomEnvironmentGroup.add(cone);
          speakerCones.push(cone);
        });
      } else if (roomId === 'vocal_booth') {
        // Acoustic Foam Pyramid Backwall
        for (let x = -5.5; x <= 5.5; x += 1.1) {
          for (let y = 1; y <= 4.5; y += 1.1) {
            const foam = new THREE.Mesh(
              new THREE.ConeGeometry(0.5, 0.4, 4),
              new THREE.MeshStandardMaterial({ color: 0x1a0f0a, roughness: 0.9, metalness: 0.05 })
            );
            foam.rotation.x = Math.PI / 2;
            foam.position.set(x, y, -3.8);
            roomEnvironmentGroup.add(foam);
          }
        }

        // Studio Isolation Glass Panel
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0x22110c,
          transparent: true,
          opacity: 0.35,
          roughness: 0.1,
          metalness: 0.2,
          reflectivity: 0.9,
          clearcoat: 1.0,
        });
        const glassPanel = new THREE.Mesh(new THREE.BoxGeometry(7, 3.5, 0.08), glassMat);
        glassPanel.position.set(0, 2.2, 1.6);
        roomEnvironmentGroup.add(glassPanel);

        // Vintage Tube Microphone on Stand
        const micStand = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 1.8, 12),
          new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.2 })
        );
        micStand.position.set(1.8, 1.2, -0.4);
        micStand.name = 'vintage_tube_mic';
        roomEnvironmentGroup.add(micStand);
        interactiveMeshes.push(micStand);

        const micCapsule = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.25, 16),
          new THREE.MeshStandardMaterial({
            color: 0xff3c00,
            emissive: 0xff3c00,
            emissiveIntensity: 0.6,
            metalness: 0.8,
          })
        );
        micCapsule.position.set(1.8, 2.1, -0.4);
        roomEnvironmentGroup.add(micCapsule);
      } else if (roomId === 'mastering_chamber') {
        // Precision Dark Slate Panels
        for (let x = -6; x <= 6; x += 1.5) {
          const panel = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 4.8, 0.15),
            new THREE.MeshStandardMaterial({ color: 0x081612, roughness: 0.3, metalness: 0.7 })
          );
          panel.position.set(x, 2.4, -4);
          panel.castShadow = true;
          roomEnvironmentGroup.add(panel);
        }

        // Cyan Laser Grid Strip
        const laserMat = new THREE.MeshBasicMaterial({ color: 0x2affa3 });
        const laserStrip = new THREE.Mesh(new THREE.BoxGeometry(13, 0.04, 0.04), laserMat);
        laserStrip.position.set(0, 0.05, 0);
        roomEnvironmentGroup.add(laserStrip);

        // Hardware Outboard Rack Enclosures
        [-2.4, 2.4].forEach((xPos) => {
          const rack = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 2.2, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x0a1412, roughness: 0.4, metalness: 0.8 })
          );
          rack.position.set(xPos, 1.1, -2.8);
          rack.castShadow = true;
          rack.name = 'dsp_mastering_rack';
          roomEnvironmentGroup.add(rack);
          interactiveMeshes.push(rack);

          // LED Meter Bars on Rack
          for (let m = 0; m < 5; m++) {
            const led = new THREE.Mesh(
              new THREE.BoxGeometry(0.9, 0.03, 0.02),
              new THREE.MeshBasicMaterial({ color: m > 3 ? 0xff3c00 : 0x2affa3 })
            );
            led.position.set(xPos, 0.6 + m * 0.28, -2.38);
            roomEnvironmentGroup.add(led);
          }
        });
      } else if (roomId === 'oracle_sphere') {
        // Elevated Gold Ceremonial Dais Platform
        const dais = new THREE.Mesh(
          new THREE.CylinderGeometry(4.2, 4.6, 0.35, 32),
          new THREE.MeshStandardMaterial({ color: 0x24180d, roughness: 0.25, metalness: 0.85 })
        );
        dais.position.set(0, 0.18, -1.2);
        dais.receiveShadow = true;
        roomEnvironmentGroup.add(dais);

        // Tri-Agent Monolith Pillars
        [-3.2, 0, 3.2].forEach((xPos, idx) => {
          const colors = [0x2affa3, 0xf5a800, 0xff3c00];
          const monolith = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 3.8, 0.4),
            new THREE.MeshStandardMaterial({
              color: 0x140f1a,
              emissive: colors[idx],
              emissiveIntensity: 0.3,
              roughness: 0.2,
              metalness: 0.9,
            })
          );
          monolith.position.set(xPos, 1.9, -3.2);
          monolith.castShadow = true;
          monolith.name = `oracle_pillar_${idx}`;
          roomEnvironmentGroup.add(monolith);
          interactiveMeshes.push(monolith);
        });
      }
    };

    // Initial room build
    buildRoomGeometry(liveRef.current.activeRoom);

    // Build Afro-Futuristic Bespoke Avatar Rigs
    const avatarRigs: AvatarRig[] = [];
    const avatarClickMeshes: THREE.Object3D[] = [];

    artistProfiles.forEach((profile) => {
      const color = new THREE.Color(profile.accentColor);
      const group = new THREE.Group();
      group.position.set(AVATAR_X[profile.id] ?? 0, 0, -1.2);
      group.name = `avatar_${profile.id}`;

      // Bespoke Body Silhouette
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x161311,
        roughness: 0.28,
        metalness: 0.75,
        emissive: color,
        emissiveIntensity: 0.15,
      });

      const accentMat = new THREE.MeshBasicMaterial({ color });

      // Stylized Torso
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.26, 1.35, 18), bodyMat);
      body.position.y = 1.65;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Sleek Afro-futuristic Faceted Head
      const head = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.26, 2),
        new THREE.MeshStandardMaterial({ color: 0x2b2622, roughness: 0.35, metalness: 0.5 })
      );
      head.position.y = 2.58;
      head.castShadow = true;
      group.add(head);

      // Cybernetic Diagnostic Visor
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.22), accentMat);
      visor.position.set(0, 2.6, 0.16);
      group.add(visor);

      // Bespoke Halo / Signature Geometry per Wise Man
      const haloGroup = new THREE.Group();
      haloGroup.position.y = 3.05;

      let coreResonator: THREE.Mesh | undefined;

      if (profile.id === 'emar') {
        // EMAR: Dual concentric holographic diagnostic rings
        const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.018, 12, 36), accentMat);
        innerRing.rotation.x = Math.PI / 2.2;
        haloGroup.add(innerRing);

        const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.012, 12, 36), accentMat);
        outerRing.rotation.x = -Math.PI / 2.4;
        haloGroup.add(outerRing);

        // Cyan Crystal Core
        coreResonator = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.14, 0),
          new THREE.MeshStandardMaterial({
            color: 0x2affa3,
            emissive: 0x2affa3,
            emissiveIntensity: 1.2,
          })
        );
        coreResonator.position.set(0, 1.8, 0.28);
        group.add(coreResonator);
      } else if (profile.id === 'ricky') {
        // RICKY: Spiked Solar Gold Crown Halo
        const solarHalo = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.03, 12, 48), accentMat);
        solarHalo.rotation.x = Math.PI / 2;
        haloGroup.add(solarHalo);

        for (let s = 0; s < 8; s++) {
          const ang = (s / 8) * Math.PI * 2;
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 6), accentMat);
          spike.position.set(Math.cos(ang) * 0.58, 0, Math.sin(ang) * 0.58);
          spike.rotation.z = -ang + Math.PI / 2;
          haloGroup.add(spike);
        }

        // 808 Sub-Bass Resonator Core (Throbs with Low-End)
        coreResonator = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 16, 16),
          new THREE.MeshStandardMaterial({
            color: 0xf5a800,
            emissive: 0xf5a800,
            emissiveIntensity: 1.5,
          })
        );
        coreResonator.position.set(0, 1.75, 0.28);
        group.add(coreResonator);
      } else {
        // KINGPIN: Flame Crown & Vocal Harmonic Rings
        const flameHalo = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.035, 12, 32), accentMat);
        flameHalo.rotation.x = Math.PI / 2.3;
        haloGroup.add(flameHalo);

        const waveRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.65, 0.015, 8, 36),
          new THREE.MeshBasicMaterial({ color: 0xff3c00, transparent: true, opacity: 0.75 })
        );
        waveRing.rotation.y = Math.PI / 4;
        haloGroup.add(waveRing);

        // Vocal Tube Core
        coreResonator = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.26, 12),
          new THREE.MeshStandardMaterial({
            color: 0xff3c00,
            emissive: 0xff3c00,
            emissiveIntensity: 1.4,
          })
        );
        coreResonator.position.set(0, 1.82, 0.28);
        group.add(coreResonator);
      }

      group.add(haloGroup);

      // Volumetric Overhead Artist Spotlight
      const artistSpot = new THREE.SpotLight(color, 2.5);
      artistSpot.position.set(AVATAR_X[profile.id] ?? 0, 5.5, -0.8);
      artistSpot.target = body;
      artistSpot.angle = Math.PI / 6;
      artistSpot.penumbra = 0.75;
      scene.add(artistSpot);

      // Soft Contact Floor Shadow
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.65, 24),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.02;
      group.add(shadow);

      scene.add(group);
      avatarRigs.push({
        id: profile.id,
        group,
        bodyMesh: body,
        halo: haloGroup,
        coreResonator,
        bodyMat,
        accentMat,
        spotlight: artistSpot,
      });
      avatarClickMeshes.push(body);
    });

    // Particle System (Spatial Stardust)
    const particleCount = 240;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 16;
      particlePos[i + 1] = Math.random() * 5.5 + 0.3;
      particlePos[i + 2] = (Math.random() - 0.5) * 12;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xf5a800,
      size: 0.055,
      transparent: true,
      opacity: 0.8,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Audio Equalizer Rings around the center console
    const ringSegments = 36;
    const ringGroup = new THREE.Group();
    ringGroup.position.set(0, 2.35, 0.6);
    const ringBars: THREE.Mesh[] = [];
    const ringColors = [0x2affa3, 0xf5a800, 0xff3c00];

    for (let i = 0; i < ringSegments; i++) {
      const theta = (i / ringSegments) * Math.PI * 2;
      const radius = 1.25;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.45, 0.045),
        new THREE.MeshBasicMaterial({ color: ringColors[i % ringColors.length] })
      );
      bar.position.set(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
      bar.rotation.y = -theta;
      ringGroup.add(bar);
      ringBars.push(bar);
    }
    scene.add(ringGroup);

    // Raycaster for Hover and Direct 3D Clicks
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(pointer, camera);
      const allClickables = [...avatarClickMeshes, ...interactiveMeshes];
      const intersects = raycaster.intersectObjects(allClickables, true);

      if (intersects.length > 0) {
        let clickedObj = intersects[0].object;
        while (
          clickedObj.parent &&
          !clickedObj.name.startsWith('avatar_') &&
          !clickedObj.name.startsWith('studio_') &&
          !clickedObj.name.startsWith('dsp_') &&
          !clickedObj.name.startsWith('vintage_') &&
          !clickedObj.name.startsWith('oracle_')
        ) {
          clickedObj = clickedObj.parent as THREE.Mesh;
        }

        if (clickedObj.name.startsWith('avatar_')) {
          const avatarId = clickedObj.name.replace('avatar_', '');
          onSelectAvatar?.(avatarId);
          onTriggerActionFeedback?.(`Focused on ${avatarId.toUpperCase()} in 3D studio.`);
        } else if (clickedObj.name.startsWith('studio_monitor')) {
          onTogglePlay?.();
          onTriggerActionFeedback?.(
            liveRef.current.isPlaying ? 'Muted Studio Monitors.' : 'Activated Studio Monitors.'
          );
        } else if (clickedObj.name === 'vintage_tube_mic') {
          setActiveCameraView('BOOTH_CLOSEUP');
          onSelectAvatar?.('kingpin');
        } else if (clickedObj.name === 'studio_console') {
          setActiveCameraView('MIXER_VIEW');
        }
      }
    };

    container.addEventListener('click', handleCanvasClick);

    // Render Animation Loop
    const timer = new THREE.Timer();
    let animationFrameId = 0;
    let running = true;
    let prevActiveRoom = liveRef.current.activeRoom;

    const renderLoop = (timestamp: number) => {
      if (!running || document.hidden) {
        animationFrameId = 0;
        return;
      }
      animationFrameId = requestAnimationFrame(renderLoop);

      const live = liveRef.current;
      timer.update(timestamp);
      const elapsedTime = timer.getElapsed();

      // Dynamic room swap detection
      if (prevActiveRoom !== live.activeRoom) {
        prevActiveRoom = live.activeRoom;
        buildRoomGeometry(live.activeRoom);
      }

      // Quality & Pixel Ratio
      const cinematic = live.qualityMode === 'CINEMATIC';
      const targetPR = Math.min(window.devicePixelRatio || 1, cinematic ? 2 : 1);
      if (renderer.getPixelRatio() !== targetPR) {
        renderer.setPixelRatio(targetPR);
      }

      // Smooth pointer parallax
      pointerPosRef.current.x = THREE.MathUtils.lerp(
        pointerPosRef.current.x,
        pointerPosRef.current.targetX,
        0.06
      );
      pointerPosRef.current.y = THREE.MathUtils.lerp(
        pointerPosRef.current.y,
        pointerPosRef.current.targetY,
        0.06
      );
      const parallaxX = pointerPosRef.current.x * 0.45;
      const parallaxY = pointerPosRef.current.y * 0.25;

      // Stem & Spectrum Analysis
      const analyserData = soundEngine.getAnalyserData();
      let lowEnergy = 0;
      let midEnergy = 0;
      let highEnergy = 0;

      if (analyserData && live.isPlaying) {
        const len = analyserData.length;
        const lowEnd = Math.min(8, len);
        const midEnd = Math.min(32, len);
        const highEnd = Math.min(64, len);
        for (let i = 0; i < lowEnd; i++) lowEnergy += analyserData[i];
        lowEnergy /= Math.max(lowEnd, 1) * 255;
        for (let i = lowEnd; i < midEnd; i++) midEnergy += analyserData[i];
        midEnergy /= Math.max(midEnd - lowEnd, 1) * 255;
        for (let i = midEnd; i < highEnd; i++) highEnergy += analyserData[i];
        highEnergy /= Math.max(highEnd - midEnd, 1) * 255;
      }

      // Lighting dynamics
      mainKeyLight.intensity = 3.5 + lowEnergy * 4;
      scientistRimLight.intensity = 2 + highEnergy * 3.5;
      fireOracleLight.intensity = 2 + midEnergy * 3.5;

      // Speaker Woofer Cone Pulsation
      speakerCones.forEach((cone) => {
        const scale = 1 + lowEnergy * 0.35;
        cone.scale.set(scale, scale, 1);
      });

      // Character Dynamics (Stem-aware)
      const motion = motionForState(live.currentArtistState, live.isPlaying, lowEnergy);

      avatarRigs.forEach((rig, idx) => {
        const isSel = rig.id === live.selectedAvatar;
        const bounceAmp = motion.bounceAmp * (isSel ? 1.4 : 0.6);

        // Per-Wise Man Frequency Reactivity
        let agentEnergy = midEnergy;
        if (rig.id === 'ricky') agentEnergy = lowEnergy; // Ricky gets drums & 808
        if (rig.id === 'kingpin') agentEnergy = midEnergy; // Kingpin gets vocals & choir
        if (rig.id === 'emar') agentEnergy = highEnergy; // Emar gets master air & spectrum

        rig.group.position.y = Math.sin(elapsedTime * motion.bounceFreq + idx * 1.5) * bounceAmp;
        rig.group.rotation.y = Math.sin(elapsedTime * 1.4 + idx) * motion.swayY;
        rig.group.rotation.z = Math.cos(elapsedTime * 1.8 + idx) * motion.swayZ;
        rig.group.rotation.x = THREE.MathUtils.lerp(
          rig.group.rotation.x,
          isSel ? motion.leanX : 0,
          0.08
        );

        const targetScale = isSel ? 1.08 : 0.98;
        const s = THREE.MathUtils.lerp(rig.group.scale.x, targetScale, 0.08);
        rig.group.scale.set(s, s, s);

        rig.halo.rotation.z = elapsedTime * motion.haloSpin;
        const haloScale = 1 + (isSel ? agentEnergy * 0.5 : agentEnergy * 0.2);
        rig.halo.scale.set(haloScale, haloScale, haloScale);

        if (rig.coreResonator) {
          rig.coreResonator.rotation.y += 0.03;
          rig.coreResonator.rotation.x += 0.02;
          const coreScale = 1 + agentEnergy * 0.6;
          rig.coreResonator.scale.set(coreScale, coreScale, coreScale);
        }

        rig.bodyMat.emissiveIntensity = isSel ? 0.35 + agentEnergy * 0.5 : 0.08;
        rig.spotlight.intensity = isSel ? 4.5 + agentEnergy * 3 : 0.8;
      });

      // Equalizer Ring Rotation and Bar Scaling
      ringGroup.rotation.y = elapsedTime * 0.35;
      ringBars.forEach((bar, i) => {
        let val = 0.2;
        if (analyserData && live.isPlaying) {
          const dataIdx = i % analyserData.length;
          val = 0.1 + (analyserData[dataIdx] / 255) * 1.5;
        }
        bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, val, 0.25);
      });

      // Ambient Particle Flow
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        positions[i] += Math.sin(elapsedTime + i) * 0.002 * (1 + highEnergy * 2.5);
        if (positions[i] > 5.8) positions[i] = 0.4;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Camera Presets with Smooth Parallax
      if (live.activeCameraView === 'ARTIST_FOCUS') {
        const targetX = (AVATAR_X[live.selectedAvatar] ?? 0) + parallaxX;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.06);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 2.45 + parallaxY, 0.06);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 3.4, 0.06);
        camera.lookAt(targetX, 2.3, -1.2);
      } else if (live.activeCameraView === 'MIXER_VIEW') {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0 + parallaxX * 0.5, 0.06);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 2.15 + parallaxY * 0.5, 0.06);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 2.3, 0.06);
        camera.lookAt(0, 1.1, 0.6);
      } else if (live.activeCameraView === 'BOOTH_CLOSEUP') {
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, 1.8 + parallaxX * 0.5, 0.06);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 2.1 + parallaxY * 0.5, 0.06);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 1.5, 0.06);
        camera.lookAt(1.8, 2.0, -0.4);
      } else {
        // WIDE STUDIO VIEW
        const orbitX = Math.sin(elapsedTime * 0.12) * 0.6 + parallaxX;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, orbitX, 0.04);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 3.25 + parallaxY, 0.04);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, 7.6, 0.04);
        camera.lookAt(0, 1.4, 0);
      }

      renderer.render(scene, camera);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
        return;
      }
      if (running && animationFrameId === 0) {
        renderLoop(performance.now());
      }
    };

    const handleResize = () => {
      if (!container.clientWidth || !container.clientHeight) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    document.addEventListener('visibilitychange', handleVisibility);
    renderLoop(performance.now());

    return () => {
      running = false;
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('click', handleCanvasClick);
      document.removeEventListener('visibilitychange', handleVisibility);
      resizeObserver.disconnect();
      disposeScene(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (glError) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 bg-[#0D0D0D] px-6 text-center">
        <p className="font-display text-3xl tracking-wide text-[#F5A800]">WORLD OFFLINE</p>
        <p className="max-w-md font-mono text-[11px] uppercase tracking-widest text-[#C9C9D4]/70">
          {glError}
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#0D0D0D]"
      onPointerMove={handlePointerMove}
    >
      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        className="relative min-h-0 w-full flex-1 cursor-grab active:cursor-grabbing"
        aria-label="3WM Artist World 3D studio"
      />

      {/* Top HUD: Room Header & Quick Controls */}
      <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap items-start justify-between gap-3">
        {/* Room & Session Info */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-[#F5A800]/25 bg-[#0D0D0D]/90 px-4 py-2.5 shadow-[0_0_30px_rgba(245,168,0,0.1)] backdrop-blur-xl">
          <div
            className="h-3 w-3 animate-pulse rounded-full"
            style={{ backgroundColor: currentRoomConfig.accentColor }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C9C9D4]/60">
                Spatial Environment
              </span>
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider font-semibold"
                style={{
                  backgroundColor: `${currentRoomConfig.accentColor}20`,
                  color: currentRoomConfig.accentColor,
                }}
              >
                {currentRoomConfig.shortName}
              </span>
            </div>
            <h4 className="font-display text-xl leading-tight tracking-wide text-[#F5A800]">
              {currentRoomConfig.name}
            </h4>
            <span className="mt-0.5 block font-mono text-[10px] text-[#C9C9D4]/50">
              {sessionLabel ? `Master Stems · ${sessionLabel}` : 'Studio Live · 3WM Direct Stream'}
            </span>
          </div>
        </div>

        {/* Room Switcher Pills & Top Actions */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {/* Room Selector */}
          <div className="flex items-center gap-1 rounded-xl border border-[#F5A800]/20 bg-[#0D0D0D]/90 p-1 shadow-xl backdrop-blur-md">
            {(Object.keys(STUDIO_ROOMS) as StudioRoomId[]).map((roomId) => {
              const r = STUDIO_ROOMS[roomId];
              const isCurrent = activeRoom === roomId;
              return (
                <button
                  key={roomId}
                  type="button"
                  onClick={() => onSelectRoom?.(roomId)}
                  aria-pressed={isCurrent}
                  className={`rounded-lg px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition ${
                    isCurrent
                      ? 'bg-[#F5A800] text-[#0D0D0D] shadow-md'
                      : 'text-[#C9C9D4]/70 hover:text-white hover:bg-white/5'
                  }`}
                  title={r.description}
                >
                  {r.shortName}
                </button>
              );
            })}
          </div>

          {/* Audio Transport Button */}
          {onTogglePlay && (
            <button
              type="button"
              onClick={onTogglePlay}
              aria-pressed={isPlaying}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition shadow-lg ${
                isPlaying
                  ? 'border-[#F5A800] bg-[#F5A800] text-[#0D0D0D] shadow-[0_0_20px_rgba(245,168,0,0.3)]'
                  : 'border-[#F5A800]/30 bg-[#0D0D0D]/90 text-[#C9C9D4] hover:border-[#F5A800] hover:text-[#F5A800]'
              }`}
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5 fill-current" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
              {isPlaying ? 'Engine Live' : 'Start Audio'}
            </button>
          )}

          {/* Camera View Switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-[#F5A800]/20 bg-[#0D0D0D]/90 p-1 font-mono text-[10px] uppercase tracking-widest shadow-xl backdrop-blur-md">
            {(
              [
                ['WIDE', 'Wide', Eye],
                ['ARTIST_FOCUS', 'Avatar', RotateCcw],
                ['MIXER_VIEW', 'Console', Sliders],
                ['BOOTH_CLOSEUP', 'Mic', Mic],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                aria-pressed={activeCameraView === id}
                onClick={() => setActiveCameraView(id)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition ${
                  activeCameraView === id
                    ? 'bg-[#F5A800] font-bold text-[#0D0D0D]'
                    : 'text-[#C9C9D4] hover:text-white'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Quality Mode Toggle */}
          <button
            type="button"
            onClick={() => setQualityMode((q) => (q === 'CINEMATIC' ? 'BALANCED' : 'CINEMATIC'))}
            className="flex items-center gap-1.5 rounded-xl border border-[#F5A800]/20 bg-[#0D0D0D]/90 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#C9C9D4] transition hover:text-[#F5A800] shadow-xl backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#F5A800]" />
            <span>{qualityMode}</span>
          </button>
        </div>
      </div>

      {/* Bottom HUD: Artist Selector & Council Action Drawer */}
      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        {/* Left: The Three Wise Men Avatars */}
        <div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-2 rounded-2xl border border-[#F5A800]/20 bg-[#0D0D0D]/95 p-2 shadow-2xl backdrop-blur-xl">
          {artistProfiles.map((artist) => {
            const isSelected = artist.id === selectedAvatar;
            return (
              <button
                key={artist.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  onSelectAvatar?.(artist.id);
                  onTriggerActionFeedback?.(`Switched focus to ${artist.name}.`);
                }}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all ${
                  isSelected
                    ? 'bg-[#181410] shadow-lg'
                    : 'border-[#F5A800]/10 bg-[#0D0D0D]/40 hover:border-[#F5A800]/30'
                }`}
                style={{
                  borderColor: isSelected ? artist.accentColor : undefined,
                  boxShadow: isSelected ? `0 0 20px ${artist.accentColor}30` : undefined,
                }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black shadow-inner"
                  style={{
                    backgroundColor: `${artist.accentColor}20`,
                    color: artist.accentColor,
                    border: `1px solid ${artist.accentColor}60`,
                  }}
                >
                  {artist.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#C9C9D4]">{artist.name}</span>
                    {isSelected && (
                      <span
                        className="h-2 w-2 animate-pulse rounded-full"
                        style={{ backgroundColor: artist.accentColor }}
                      />
                    )}
                  </div>
                  <span className="block font-mono text-[10px] text-[#C9C9D4]/60">
                    {artist.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Active Artist Real-Time State Rig & Quick Actions */}
        <div className="pointer-events-auto flex max-w-2xl flex-col gap-2 rounded-2xl border border-[#F5A800]/20 bg-[#0D0D0D]/95 p-3.5 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#C9C9D4]/60">
                {activeArtist.name} · {activeArtist.frequencyDomain}
              </span>
            </div>
            <span
              className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest"
              style={{
                backgroundColor: `${activeArtist.accentColor}20`,
                color: activeArtist.accentColor,
                border: `1px solid ${activeArtist.accentColor}40`,
              }}
            >
              STATE: {currentArtistState}
            </span>
          </div>

          {/* Quick Council Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {activeArtist.quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  onArtistStateChange?.(action.targetState);
                  onTriggerActionFeedback?.(action.feedbackMessage);
                }}
                className="group flex flex-col gap-1 rounded-xl border border-white/10 bg-[#16120e]/60 p-2 text-left transition hover:border-[#F5A800] hover:bg-[#F5A800]/10"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-[#F5A800] group-hover:text-white">
                    {action.label}
                  </span>
                  <span className="text-[9px] font-mono text-white/40">⚡</span>
                </div>
                <span className="line-clamp-2 font-mono text-[9px] leading-tight text-[#C9C9D4]/60">
                  {action.description}
                </span>
              </button>
            ))}
          </div>

          {/* Gesture Rig State Selector */}
          <div className="flex flex-wrap items-center gap-1 pt-1">
            <span className="mr-1 font-mono text-[9px] uppercase tracking-wider text-[#C9C9D4]/40">
              Rig:
            </span>
            {AVATAR_STATE_OPTIONS.map((st) => {
              const isSelected = currentArtistState === st;
              return (
                <button
                  key={st}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onArtistStateChange?.(st)}
                  className={`rounded-md border px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider transition ${
                    isSelected
                      ? 'border-[#F5A800] bg-[#F5A800]/20 text-[#F5A800]'
                      : 'border-white/5 bg-[#0D0D0D] text-[#C9C9D4]/50 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Studio3DCanvas;
