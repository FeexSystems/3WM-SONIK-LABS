# 🧠 3ONIK — Multi-Agent Intelligence & Audio Reasoning Engine Specification (v3.0)

> **"3ONIK is the brain; 3WM SONIK is the sound."**  
> **"ONE VISION. THREE MINDS. INFINITE SOUND."**  
> 🔱 FeexSystems / 3WM-SONIK-LABS

---

## 1. Executive Summary & Engine Thesis

**3ONIK** is the proprietary AI multi-agent intelligence and audio reasoning engine that powers the **3WM SONIK** operating workstation.

It transforms 3WM SONIK from a standard digital audio workstation (DAW) into an **AI-native musical operating environment**. Inside 3ONIK, three specialized musical intelligences collaborate directly with the producer inside a real-time production workspace.

The producer maintains absolute creative authority. The Three Wise Men provide domain-specific musical intelligence. The ThreeWM Orchestrator coordinates the system, harmonizes debate, and maintains state consistency across the entire project lifecycle.

---

## 2. Global Cognitive Architecture

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │                  3ONIK AGENTS ENGINE                   │
                                  │            (Cognitive Neural Audio Kernel)             │
                                  └──────────────────────────┬─────────────────────────────┘
                                                             │
                                  ┌──────────────────────────▼─────────────────────────────┐
                                  │                 THREEWM ORCHESTRATOR                   │
                                  │   • Intent Parsing & Task Decomposition                │
                                  │   • Multi-Agent Debate & Consensus Coordination        │
                                  │   • Shared World State Gatekeeper & Snapshot Auditor   │
                                  └──────────────────────────┬─────────────────────────────┘
                                                             │
                     ┌───────────────────────────────────────┼───────────────────────────────────────┐
                     ▼                                       ▼                                       ▼
     ┌───────────────────────────────┐       ┌───────────────────────────────┐       ┌───────────────────────────────┐
     │      KAPPACHINO EMAR          │       │      KAPPACHINO RICKY         │       │          KINGPIN              │
     │       (The Scientist)         │       │        (The Sound God)        │       │      (The Vocal Oracle)       │
     │      Color: Mint (#2AFFA3)    │       │       Color: Gold (#F5A800)   │       │       Color: Fire (#FF3C00)   │
     ├───────────────────────────────┤       ├───────────────────────────────┤       ├───────────────────────────────┤
     │ • Signal Processing & DSP     │       │ • Drum Synthesis & Sequencing │       │ • Vocal Harmonies & Stacks    │
     │ • Acoustic Physics & EQ       │       │ • 808 Tuning & Bass Grooves   │       │ • Vocal Chain Processing      │
     │ • Mastering & LUFS Dynamics   │       │ • Polyrhythms & Percussion    │       │ • Melodic Lead Guidance       │
     │ • Music Theory & Scales       │       │ • Timbre & Sound Design       │       │ • Soul, Energy & Emotion      │
     └───────────────────────────────┘       └───────────────────────────────┘       └───────────────────────────────┘
                     │                                       │                                       │
                     └───────────────────────────────────────┼───────────────────────────────────────┘
                                                             ▼
                                  ┌────────────────────────────────────────────────────────┐
                                  │                  THE COUNCIL CHAMBER                   │
                                  │    • Real-time Agent Consensus Deliberation            │
                                  │    • 2/3 Majority Voting Rule for Parameter Writes     │
                                  │    • High-Fidelity Audio Reasoning Trace               │
                                  └──────────────────────────┬─────────────────────────────┘
                                                             │
                                  ┌──────────────────────────▼─────────────────────────────┐
                                  │                SHARED WORLD MODEL                      │
                                  │        (`SonikWorldState` / Firestore Real-time)       │
                                  └──────────────────────────┬─────────────────────────────┘
                                                             │
                                  ┌──────────────────────────▼─────────────────────────────┐
                                  │                AUDIO EXECUTION ENGINE                  │
                                  │  Web Audio DSP · Step Sequencer · Mixer · Master Bus   │
                                  └────────────────────────────────────────────────────────┘
```

---

## 3. The Three Wise Men Agent Profiles

### 🧪 Kappachino Emar — The Scientist
- **Domain**: Audio engineering, digital signal processing (DSP), acoustics, music theory, mixing, mastering.
- **Identity**: Technical intelligence of 3WM SONIK. Understands sound as a physical, mathematical, acoustic, and signal-processing phenomenon.
- **Personality**: Precise, analytical, technical, calm, confident, experimental.
- **Core Principle**: *"Understand the sound. Control the system."*
- **Aesthetic**: Emerald / Scientist Mint (`#2AFFA3`).
- **Key Responsibilities**:
  - Parametric EQ sculpting (high-pass, low-pass, notch, bell curves).
  - Dynamic range control, multi-band compression, and peak limiting.
  - LUFS loudness normalization compliant with streaming standards (-14 LUFS integrated).
  - Harmonic saturation curves and phase alignment across drum and bass tracks.

### 🥁 Kappachino Ricky — The Sound God
- **Domain**: Instruments, drums, 808 sub-bass, groove design, syncopation, beat production.
- **Identity**: Sound-generation intelligence of 3WM SONIK. Responsible for making the production bounce and feel musically thrilling.
- **Personality**: Bold, musical, instinctive, confident, streetwise, experimental.
- **Core Principle**: *"Find the sound. Build the bounce."*
- **Aesthetic**: Gold Prestige (`#F5A800`).
- **Key Responsibilities**:
  - Polyrhythmic 16-step and 32-step drum sequencing.
  - Afrobeat, Amapiano, Afropop, Drill, and Trap percussion styling.
  - Log drum pitch gliding, 808 transient shaping, and sub-harmonic generation.
  - Groove swing adjustments and humanized micro-timing offsets.

### 🎤 Kingpin — The Vocal Oracle
- **Domain**: Vocals, vocal arrangement, choral harmony, emotional cadence.
- **Identity**: Vocal intelligence of 3WM SONIK. Treats the human voice as an orchestra and the soul of the track.
- **Personality**: Charismatic, intuitive, emotional, musical, performance-oriented, commanding.
- **Core Principle**: *"Give the voice a body. Give the body a soul."*
- **Aesthetic**: Solar Fire (`#FF3C00`).
- **Key Responsibilities**:
  - Multi-part vocal arrangement (lead, doubles, ad-libs, low octave, harmonies).
  - Vocal chain configuration: de-esser, pitch correction, warm tube preamp, plate reverb.
  - Dynamic spatial imaging and stereophonic widening for backing vocals.
  - Lyrical cadence alignment with rhythm tracks.

### 🔱 ThreeWM Orchestrator
- **Domain**: Intent interpretation, multi-agent dispatch, consensus verification, project state synchronization.
- **Identity**: Central cognitive coordinator of the 3ONIK engine.
- **Personality**: Regal, balanced, decisive, executive.
- **Key Responsibilities**:
  - Natural language intent parsing and goal decomposition.
  - Routing prompts to the appropriate agent or summoning a Council debate.
  - Enforcing the 2/3 consensus threshold before executing state writes.
  - Creating non-destructive rollback checkpoints for every project change.

---

## 4. Shared World Model (`SonikWorldState`)

The **Shared World Model** is the canonical source of truth for the entire DAW session. All agents within 3ONIK read from and propose mutations to this model.

### State Topology
```typescript
interface SonikWorldState {
  project: {
    id: string;
    name: string;
    genre: 'Afrobeats' | 'Amapiano' | 'Afropop' | 'Drill' | 'Trap';
    bpm: number;          // 60 - 220 BPM
    key: string;          // e.g., 'F# min'
    timeSignature: string;// e.g., '4/4', '6/8'
  };
  sequencer: {
    channels: SequencerChannel[];
    activePatternIndex: number;
    swing: number;        // 0% - 100%
  };
  mixer: {
    tracks: MixerTrack[];
    master: MasterBusState;
  };
  vocals: {
    chains: VocalChainState[];
    harmonies: VocalHarmonyPreset[];
  };
  history: {
    snapshots: ProjectSnapshot[];
    undoIndex: number;
  };
}
```

### Permission Hierarchy (Action Sandbox)
To ensure safety and producer control, every 3ONIK action is categorized into a strict permission tier:

1. **`READ`**: Inspects current tempo, sequencer patterns, EQ bands, or vocal chains. Zero side effects.
2. **`SUGGEST`**: Returns conversational advice, arrangement tips, or recommended settings in the AI Console.
3. **`PREVIEW`**: Temporarily routes audio through an isolated preview DSP node without altering track data.
4. **`WRITE`**: Non-destructively modifies parameters (e.g., changes tempo, sets EQ, inserts pattern steps). Automatically generates an undo snapshot.
5. **`DESTRUCTIVE`**: Deletes audio stems, clears entire sequencer banks, or resets project states. **Requires explicit user modal confirmation.**

---

## 5. Consensus Deliberation Protocol

When a complex musical command is issued (e.g., *"Make the mix club-ready and give the drums more punch"*), the 3ONIK engine initiates a Council deliberation:

1. **Dispatch**: The Orchestrator presents the producer intent to Emar, Ricky, and Kingpin.
2. **Agent Proposals**:
   - **Ricky**: Recommends boosting 808 transient attack and layering a punchy sidechain envelope.
   - **Emar**: Agrees with transient punch, but recommends cutting mud at 250Hz and applying a high-pass filter at 32Hz to prevent phase cancellation.
   - **Kingpin**: Notes that low-end boost must leave dynamic headroom for the lead vocal's fundamental frequency (180Hz–300Hz).
3. **Debate & Resolution**: The agents negotiate adjustments until a 2/3 consensus is reached.
4. **Commit**: The Orchestrator compiles the agreed parameters into a structured `WRITE` transaction, takes a state snapshot, and applies changes directly to the Web Audio DSP graph.

---

## 6. Real-Time Interfaces & Endpoints

### 1. 3ONIK Structured Command API
- **Endpoint**: `POST /api/voice/3onik-command`
- **Payload**:
  ```json
  {
    "prompt": "Emar, tame the high-end sibilance on the vocal track and add gentle tape saturation",
    "targetAgent": "emar",
    "context": {
      "trackId": "vocal-lead",
      "bpm": 112
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "agent": "emar",
    "reasoning": "Identified harshness at 6.8kHz. Applying dynamic de-esser notch filter and warming lows with subtle 1.8dB tape saturation.",
    "response": "I've smoothed out the sibilance at 6.8kHz and added analog warmth to the vocal bus.",
    "action": {
      "type": "WRITE",
      "target": "TRACK_DSP",
      "payload": {
        "eqHighCut": 6800,
        "saturationDrive": 0.28
      }
    }
  }
  ```

### 2. Gemini Live Bidirectional WebSocket
- **URL**: `ws://localhost:3000/api/audio/live-stream` (or production WSS)
- **Format**: Real-time bidirectional streaming of PCM 24kHz audio and structured JSON tool-call events.

---

## 7. Studio UI Integration

- **3WM Agents Sidebar**: Persistent slide-out studio assistant with 4 tabs (`Council`, `Emar`, `Ricky`, `Kingpin`), persona-matched visual styling, and instant action chips.
- **Council Chamber View**: Full-screen collaborative deliberation matrix displaying live consensus meters, agent reasoning feeds, and action diff previews.
- **AI Oracle View**: Visual acoustic analyzer and voice interaction node for rapid hands-free co-production.
- **Transport Bar**: Dedicated BPM engine with real-time Tap Tempo average calculation, genre presets, and millisecond timebase clocking.

---

🔱 **FeexSystems · 3WM SONIK Labs · Built for the Next Generation of Producers.**
