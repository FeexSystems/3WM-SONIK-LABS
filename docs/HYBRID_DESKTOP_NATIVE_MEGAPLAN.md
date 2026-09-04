# 🔱 3WM SONIK — Hybrid Desktop & Native Audio Implementation Megaplan (v3.0)

> **"ONE VISION. THREE MINDS. INFINITE SOUND."**  
> **"3ONIK is the brain; 3WM SONIK is the sound."**  
> 🔱 FeexSystems / 3WM-SONIK-LABS

---

## Executive Summary & Architectural Directive

While **3WM SONIK** currently provides a full-featured, cinematic Web & PWA digital audio workstation powered by the **3ONIK multi-agent engine**, **Web Audio DSP**, **Gemini Live bidirectional voice streaming**, and **Yjs collaborative sync**, achieving **professional studio desktop equivalence** requires:
1. **Low-latency hardware driver access** (ASIO on Windows, CoreAudio on macOS).
2. **Native VST3 / AU third-party plugin hosting**.
3. **WebAssembly and WebGPU compute-accelerated DSP**.
4. **An Electron-wrapped cross-platform desktop binary**.

This Megaplan details the engineering roadmap to build, integrate, and verify every unbuilt and partial component across 6 phases (Weeks 1 to 24).

---

## 1. Architectural Topology & Platform Abstraction

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SHARED REACT APPLICATION                               │
│        DAW Studio · Beat Lab · Mixer · Council Chamber · 3WM Agents Sidebar            │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           PLATFORM ABSTRACTION LAYER (PAL)                             │
│                               (`src/audio/platform/`)                                  │
│   ┌───────────────────────────┐    ┌───────────────────────────┐    ┌──────────────┐   │
│   │   AudioPlatformAdapter    │    │    FileSystemAdapter      │    │ MidiAdapter  │   │
│   └─────────────┬─────────────┘    └─────────────┬─────────────┘    └───────┬──────┘   │
└─────────────────┼────────────────────────────────┼──────────────────────────┼──────────┘
                  │                                │                          │
        ┌─────────┴─────────┐            ┌─────────┴─────────┐      ┌─────────┴─────────┐
        ▼                   ▼            ▼                   ▼      ▼                   ▼
┌──────────────┐    ┌──────────────┐┌──────────────┐ ┌─────────────┐┌──────────────┐┌───────────┐
│ WebAudioImpl │    │ NativeAudio  ││  OPFS/Cloud  │ │  Direct Disk││   Web MIDI   ││RtMidi Win/│
│ (Web/PWA)    │    │ (Electron IPC││  (IndexedDB) │ │ (Win/macOS) ││  (Browser)   ││CoreMidi   │
└──────────────┘    └──────────────┘└──────────────┘ └─────────────┘└──────────────┘└───────────┘
```

---

## 2. Phase-by-Phase Implementation Specifications

### 🏛️ PHASE 1: Desktop Foundation & Platform Abstraction (Weeks 1–4) — [NOT BUILT]

#### 1.1 Electron Application Structure
- **Target Files**:
  - `desktop/main.ts`: Main process lifecycle, secure window creation, protocol handlers, application menu, tray icon.
  - `desktop/preload.ts`: Context isolation script using `contextBridge.exposeInMainWorld('sonikDesktopAPI', { ... })`.
  - `desktop/ipc/`: Modular IPC routers for Audio, FileSystem, MIDI, and System Telemetry.
  - `desktop/windowManager.ts`: Multi-window coordinator (Main DAW + Detached Plugin Floating Windows + Spectrum HUD).
- **Security Guardrails**:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - `sandbox: true`
  - Strict Content Security Policy (CSP) blocking unauthorized remote scripts.

#### 1.2 Platform Abstraction Layer (`src/audio/platform/`)
- **`AudioPlatformAdapter` Interface**:
  ```typescript
  export interface IAudioPlatformAdapter {
    readonly isNative: boolean;
    readonly sampleRate: number;
    readonly bufferSize: number;
    initAudio(): Promise<void>;
    startPlayback(positionMs: number): void;
    stopPlayback(): void;
    setMasterVolume(val: number): void;
    getAvailableOutputDevices(): Promise<AudioDeviceDescriptor[]>;
    selectOutputDevice(deviceId: string): Promise<void>;
    loadStemBuffer(stemId: string, urlOrPath: string): Promise<AudioBuffer | NativeBufferHandle>;
  }
  ```
- **`WebAudioAdapter.ts`**: Encapsulates browser `AudioContext` and existing `src/audio/engine.ts`.
- **`NativeAudioAdapter.ts`**: Dispatches audio calls over IPC to native C++/Rust worker process.
- **`PlatformRegistry.ts`**: Factory providing singleton adapter based on runtime environment:
  ```typescript
  export const getAudioPlatform = (): IAudioPlatformAdapter => {
    return (typeof window !== 'undefined' && (window as any).sonikDesktopAPI)
      ? new NativeAudioAdapter()
      : new WebAudioAdapter();
  };
  ```

#### 1.3 Cross-Platform Multi-Target Build Pipeline
- Integrate `electron-builder` into `package.json`:
  - `build:desktop`: Vite builds client to `dist/`, esbuild bundles `desktop/main.ts` to `dist/desktop/main.js`.
  - `package:mac`: DMG & ZIP (Universal binary `x64` + `arm64`) with Apple Notarization support.
  - `package:win`: NSIS installer + portable `.exe` with code-signing hooks.
  - `package:linux`: AppImage & `.deb` packages.

---

### ⚡ PHASE 2: Web Audio & DSP Compute Enhancements (Weeks 5–8) — [PARTIALLY BUILT]

#### 2.1 WebAssembly High-Performance DSP Pipeline
- **Problem**: Complex mathematical modeling (e.g. analog tube saturation, multi-order biquad filter banks, polyrhythmic microtiming) in pure JavaScript can trigger garbage collection pauses and audio drops.
- **Solution**:
  - Scaffolding `src/wasm/`: C++/Rust DSP source files compiled to WebAssembly via Emscripten / `wasm-pack`.
  - Compile modules for:
    - `FastFourierTransform.wasm`: Hardware-accelerated 4096-point FFT for real-time visualizers.
    - `AnalogTapeSaturator.wasm`: Anti-aliased non-linear hyperbolic tangent drive models.
    - `PolyrhythmicClock.wasm`: Sub-microsecond tempo and Euclidean rhythm clock.

#### 2.2 WebGPU Compute Acceleration (`src/audio/webgpuDsp.ts`)
- Complete the existing WebGPU prototype in `src/audio/webgpuDsp.ts`:
  - **Impulse Response Convolution**: Offload 10-second multi-channel convolution reverb (hall, church, plate) from CPU to GPU compute shaders using parallel frequency-domain multiplication (Overlap-Add FFT).
  - **Zero CPU Penalty**: Freeing 100% of the audio thread for real-time synthesis and vocal recording.

#### 2.3 AudioWorklet Thread Isolation
- Upgrade all custom DSP filters to dedicated AudioWorklets running in `AudioWorkletGlobalScope`:
  - `src/audio/worklets/saturationWorklet.ts`
  - `src/audio/worklets/multibandCompressorWorklet.ts`
  - `src/audio/worklets/transientShaperWorklet.ts`
- Implement lock-free circular ring buffers via `SharedArrayBuffer` and `Atomics` to pass parameter updates from the UI thread to the audio thread without locking or message serialization overhead.

---

### 🎛️ PHASE 3: Native Audio Integration & VST3 Hosting (Weeks 9–12) — [NOT BUILT]

#### 3.1 Native Audio Engine Core (JUCE / C++ Addon)
- Build a lightweight native audio daemon / node native addon (`desktop/native-audio-core/`):
  - Written in modern C++20 / JUCE Audio Engine module.
  - Links directly to OS audio drivers:
    - **Windows**: Native ASIO driver support (`asio.h`), enabling 32–64 sample buffer sizes (< 3.0ms latency) bypassing Windows WASAPI mixer.
    - **macOS**: Native CoreAudio HAL client with aggregate device support.
    - **Linux**: ALSA and JACK / PipeWire client.
  - Connects to Electron via zero-copy shared memory buffer or fast local named pipes/domain sockets.

#### 3.2 Native Plugin Hosting Architecture (VST3 & AU)
- **Plugin Scanner & Cache**:
  - Standalone scanner process (`sonik-plugin-scanner.exe`) that iterates:
    - Windows: `C:\Program Files\Common Files\VST3`
    - macOS: `/Library/Audio/Plug-Ins/VST3` and `/Library/Audio/Plug-Ins/Components` (AU)
  - Extracts plugin metadata, manufacturer, inputs/outputs, and parameter trees into JSON cache (`vst_registry.json`).
- **Out-of-Process Plugin Sandbox**:
  - Each third-party VST3 plugin executes in an isolated worker process.
  - If an unstable third-party plugin crashes (Access Violation / Segfault), **3WM SONIK remains running**, automatically disabling that plugin channel and notifying the producer.
- **Native GUI Floating Window Bridge**:
  - Electron main process spawns native floating child windows attaching directly to the VST3 `IPlugView` HWND / NSView.
  - Parameter synchronization: Changes on the VST3 UI broadcast to 3WM SONIK mixer channels and vice versa in real-time.

---

### 🌐 PHASE 4: Hardened Real-Time Sync & Storage Encryption (Weeks 13–16) — [PARTIALLY BUILT]

#### 4.1 Standalone Signaling & Multi-Peer Mesh
- Deploy a dedicated self-hosted WebRTC signaling service (`server/signaling.ts`) matching `y-webrtc`:
  - Replaces public signaling servers with authenticated zero-trust WebSocket coordination.
  - Seamless fallback: Automatically downgrades from P2P WebRTC data channels to WebSocket broadcast if firewalls/NAT prevent direct peer connectivity.

#### 4.2 Local Project Vault & End-to-End Encryption
- Implement AES-256-GCM client-side encryption for collaborative stems and local project files:
  - Encryption keys derived from user authentication passwords using PBKDF2 with 100,000 iterations.
  - Ensures stems stored on AWS S3 or local SSD remain cryptographically secure.

---

### 🧠 PHASE 5: Advanced AI & Local Edge Intelligence (Weeks 17–20) — [PARTIALLY BUILT]

#### 5.1 Local Offline AI Processing via ONNX DirectML & Metal
- Expand `src/audio/onnxStemSeparator.ts` to support local hardware execution:
  - On Windows: Bind `onnxruntime-node` with **DirectML** execution provider to run stem separation directly on NVIDIA / AMD / Intel GPUs.
  - On macOS: Bind `onnxruntime-node` with **CoreML / Apple Metal** execution provider for Apple Silicon Neural Engine acceleration.
  - Results in 4-stem separation (Vocals, Drums, Bass, Other) completing in under 8 seconds offline with zero cloud API costs.

#### 5.2 Offline Voice Uplink & Hybrid Failover
- Integrate local quantized voice models:
  - Local Voice Activity Detection (Silero VAD) running in WebAssembly.
  - Local intent keyword spotter for rapid commands (*"Ricky, punch up the kick"*, *"Mute track 2"*).
  - Dynamic failover:
    - When online: Stream rich audio to **Gemini Live 2.0 / 3ONIK Acoustic Node** for deep conversational co-production.
    - When offline: Seamlessly route to the local 3ONIK rule-based parser and ONNX acoustic model.

---

### 💎 PHASE 6: Performance Optimization, Stress Testing & Release (Weeks 21–24) — [PARTIALLY BUILT]

#### 6.1 Performance Benchmarking & Latency Targets
- **Automated Latency Testing**:
  - Run roundtrip audio latency tests:
    - Target: < 4ms for Native Desktop ASIO (Focusrite / UA / RME).
    - Target: < 15ms for Web Audio API on Chrome / Edge / Safari.
- **DAW Stress Testing**:
  - 64 concurrent stereo audio tracks at 48kHz / 24-bit.
  - 16 simultaneous step-sequencer channels playing polyrhythms.
  - 8 concurrent DSP insert plugins per track with CPU load < 35%.

#### 6.2 Continuous Integration & Automated Release Matrix
- GitHub Actions CI/CD workflow (`.github/workflows/desktop-release.yml`):
  - Matrix build across `macos-14`, `windows-latest`, `ubuntu-latest`.
  - Runs unit tests, linting, and type verification.
  - Builds web production dist, bundles Electron desktop installers, signs binaries, and deploys updates via `electron-updater`.

---

## 3. Directory Layout for New Components

```
f:\3WM-SONIK\
├── desktop/                         # [NEW] Phase 1: Electron Desktop Shell
│   ├── main.ts                      # Main process entrypoint
│   ├── preload.ts                   # Context-isolated IPC bridge
│   ├── windowManager.ts             # Multi-window & floating GUI manager
│   ├── ipc/                         # IPC handlers (audio, files, midi)
│   └── native-audio-core/           # [NEW] Phase 3: JUCE / C++ Native Engine
│       ├── CMakeLists.txt           # C++ build configuration
│       ├── src/
│       │   ├── AsioDriverHandler.cpp # Low-latency ASIO driver bindings
│       │   ├── Vst3PluginHost.cpp   # Out-of-process VST3 hosting engine
│       │   └── AudioRingBuffer.h    # Shared memory lock-free buffer
├── src/
│   ├── audio/
│   │   ├── platform/                # [NEW] Phase 1: Platform Abstraction Layer
│   │   │   ├── IAudioPlatformAdapter.ts
│   │   │   ├── WebAudioAdapter.ts
│   │   │   ├── NativeAudioAdapter.ts
│   │   │   └── PlatformRegistry.ts
│   │   ├── worklets/                # [EXTEND] Phase 2: Dedicated AudioWorklet DSP
│   │   │   ├── dspProcessor.ts      # Existing worklet
│   │   │   ├── saturationWorklet.ts # [NEW]
│   │   │   └── multibandWorklet.ts  # [NEW]
│   │   └── webgpuDsp.ts             # [EXTEND] Phase 2: WebGPU Reverb & FFT
│   └── wasm/                        # [NEW] Phase 2: High-speed C++/Rust DSP Wasm
│       ├── Cargo.toml / CMakeLists.txt
│       └── src/
└── docs/
    └── HYBRID_DESKTOP_NATIVE_MEGAPLAN.md # Implementation roadmap & architecture guide
```

---

## 4. Verification & Testing Matrix

### Automated Testing
- **Vitest Unit Tests**: Verify `PlatformRegistry` instantiates `WebAudioAdapter` in browser and mocks `NativeAudioAdapter` in node test environments.
- **Worklet Performance Tests**: Measure audio rendering budget in `audioWorkletPerformance.test.ts` (must complete under 2.9ms per 128-sample buffer).
- **Audio Integrity Regression**: Verify bit-identical audio output between Web Audio DSP and native Wasm filters in `audioRegression.test.ts`.

### Manual & Hardware Verification
1. **Desktop Shell Launch**: Run `npm run desktop:build` on Windows; verify 3WM SONIK compiles cleanly.
2. **ASIO Device Detection**: Open Settings → Audio; verify external audio interfaces (e.g. Focusrite Scarlett, Universal Audio Apollo) appear with buffer size selectors (64, 128, 256, 512 samples).
3. **VST3 Plugin Scanning**: Point scanner to standard VST3 directories; verify plugins appear in the FX rack and open in floating windows.
4. **PWA & Web Parity**: Verify `npm run dev:client` continues to work in browser at `http://localhost:3000` with zero desktop import errors.

---

🔱 **FeexSystems · 3WM SONIK Labs · Built for the Next Generation of Producers.**
