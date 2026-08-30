# 3WM SONIK — Architecture & Systems Specification (v2.2)

## 1. High-Level System Architecture

```
                         3WM SONIK (v2.2)
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
   BEAT LAB               RECORDING             MIX / MASTER
  (Sequencer,            (Multi-take,          (10-band EQ,
   Piano Roll,            Waveforms,            Ozone 11,
   Drum Rack)             Stem Lanes)           LUFS Meters)
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              ▼
                     MUSICAL EVENT ENGINE
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
               MIDI ENGINE         AUDIO ENGINE
             (Web MIDI Clock,    (Web Audio API,
              Quantizer, DSP)     DSP Nodes, Stereo Analysers)
                    │                   │
                    └─────────┬─────────┘
                              ▼
                       SHARED TRANSPORT
                 (Master Clock, Step Dispatcher,
                  Stereo Peak & RMS VU Metering)
                              │
                              ▼
                        PROJECT STORE
                 (Canonical Track State, AutoSave,
                  Local Recovery, Version Drawer)
                              │
                              ▼
                   SERVER-SIDE REST API
                 (/api/tracks, /api/projects,
                  /api/exports, /api/ai-command)
                              │
                              ▼
                 SERVER PCM WAV RENDERER
                 (24-bit 48kHz / 16-bit 44.1kHz
                  Deterministic Lossless WAV)
```

## 2. Core Modules & Directory Layout

- **Audio Engine (`src/audio/engine.ts`)**:
  - Web Audio API context with master stereo gain, 3-band parametric EQ, dynamics compressor, and convolver/algorithmic shrine reverb.
  - Stereo AnalyserNodes with independent Left and Right channel peak, RMS, clip detection, and LUFS computation.
  - Polyphonic synthesis (808/Amapiano Log Drum FM synth, Sub-bass, Brass horns, Soul Rhodes, Shekeres, Kick & Snare).
- **MIDI Engine (`src/audio/midiEngine.ts`)**:
  - `MidiClock` with high-resolution Web Audio scheduler (`requestAnimationFrame` + `AudioContext.currentTime` lookahead).
  - Quantization (1/4, 1/8, 1/16, 1/32, Triplets) & African Rhythm DNA Groove templates (Lagos Bounce, Amapiano Log, Kalakuta Shrine).
  - Scale assistance (Afro Minor, Pentatonic, Dorian, Highlife, Blues, Harmonic Minor).
  - Chord Progression Generator (Afrobeats I-V-vi-IV, Amapiano Soul, Highlife 1-4-5, Neo-Soul).
- **Interactive Piano Roll (`src/components/audio/PianoRoll.tsx`)**:
  - Multi-octave note canvas with click-to-place, duration drag resizing, note deletion, velocity editing, scale highlights, and chord stampers.
- **16-Step Afrofusion Sequencer (`src/components/audio/StepSequencer.tsx`)**:
  - Polyrhythmic channel rack for Kick, Rim/Snare, Shekere/Shaker, Talking Drum/Conga, and Amapiano Log Drum.
  - Step velocity accents, probability triggering, microtiming offsets, mute/solo strips.
- **Stereo VU Meter (`src/components/audio/StereoMeter.tsx`)**:
  - Left and Right peak bars, ambient RMS fill, 1200ms peak hold with decay, overload clip LEDs, and numerical dB/LUFS readouts.
- **Auto-Save & Version Control (`src/services/projectStore.ts`)**:
  - Immediate local storage recovery caching for offline resilience.
  - Debounced (2s) server synchronization with 30s periodic safety checkpointing.
  - Non-destructive version history rollback (restoring v10 when at v14 creates v15 = snapshot of v10).
- **Server WAV Export Engine (`server.ts` & `src/components/export/ExportConfirmationModal.tsx`)**:
  - Server-authoritative quota calculation and idempotent render job execution.
  - Binary RIFF PCM WAV file generation (24-bit 48kHz and 16-bit 44.1kHz) with tube saturation and brickwall limiter.

## 3. Theming & Design System

- Semantic CSS tokens for **Studio Dark**, **Midnight Abyss**, and **Studio Light**.
- Global Command Palette (`Cmd+K` / `Ctrl+K`) for swift navigation and musical operations.
