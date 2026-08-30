---
name: 3wm-3d-architecture
description: Directives and architectural rules for implementing the 3WM 3D Asset Intelligence Layer and React Three Fiber environments.
---

# 3WM SONIK — 3D Asset Architecture & Runtime Directive

## 1. Core Architecture Strategy

The 3WM SONIK engine leverages a modern, highly performant WebGL stack to render three-dimensional, audio-reactive entities (The Three Wise Men: Emar, Ricky, Kingpin).
To maintain 60 FPS while streaming 24-bit audio, the 3D layer operates independently of the React DOM render cycle using **React Three Fiber (R3F)** and **Three.js**.

### 1.1 Format Standards

- **Web Runtime (Primary):** `.glb` (glTF 2.0 Binary)
- **Apple AR (Secondary):** `.usdz`

## 2. Directory Structure

The 3D assets and their corresponding React components MUST follow this strict taxonomy:

- `public/models/agents/` (e.g. `emar_v1.glb`, `ricky_v1.glb`, `kingpin_v1.glb`)
- `public/models/environments/`
- `public/models/instruments/`
- `src/three/components/` (R3F Mesh Components)
- `src/three/hooks/` (Audio-reactive hooks)
- `src/three/shaders/` (Custom GLSL Shaders)
- `src/three/canvas/` (Core R3F Canvas Provider)

## 3. Audio-Reactive Integration

The 3D models must react dynamically to the DSP pipeline:

1. Extract FFT frequency data using an `AnalyserNode` connected to the `AudioContext`.
2. Use a custom hook (e.g., `useAudioAnalyzer.ts`) to sample arrays on every `useFrame`.
3. Drive shader uniforms, blend shape weights, or material emissive intensities.

## 4. Performance Directives

- Wrap all `.glb` loads in `<Suspense fallback={<AgentSkeleton />}>`.
- Preload critical assets: `useGLTF.preload('/models/agents/emar_v1.glb')`.
- Cap device pixel ratio (`dpr={[1, 2]}`) to prevent overheating.
