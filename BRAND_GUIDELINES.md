# 🔱 3WM SONIK - Brand Guidelines, Glossary & Asset Kit

## 1. BRAND STATEMENT

> **THREE WISE MEN.**
> **ONE VISION. THREE MINDS. INFINITE SOUND.**
> **BUILT FOR THE SOUND OF AFRICA. BUILT FOR THE PRODUCER. BUILT FOR THE NEXT GENERATION.**
> 🔱

3WM SONIK is a sophisticated, production-grade, cinematic AI music-production platform powered by the **3ONIK Agents Engine**. It is an AI-native musical operating environment in which three specialized musical intelligences collaborate directly with the producer inside a real production workspace.

**"3ONIK is the brain; 3WM SONIK is the sound."**

**The producer remains the creative authority. The Three provide intelligence. The Orchestrator coordinates the system.**

---

## 2. BRAND GLOSSARY (TERMINOLOGY)

Use these exact terms across the codebase, marketing, and user interface to maintain the cinematic universe of 3WM SONIK.

| Term                       | Definition                                                                                                                                               |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **3WM SONIK**              | The official name of the music production workstation platform. Always capitalized.                                                                     |
| **3ONIK**                  | The proprietary AI multi-agent intelligence and audio reasoning engine that powers 3WM SONIK. ("3ONIK is the brain; 3WM SONIK is the sound.")           |
| **The Three Wise Men**     | The collective operating intelligence triad of the DAW (Kappachino Emar, Kappachino Ricky, and Kingpin).                                                |
| **Orchestrator (THREEWM)** | The coordination layer within 3ONIK that understands producer intent, routes tasks, requests consensus, and manages the shared world state.            |
| **Council Chamber**        | The collaborative UI view where the agents deliberate, debate, and execute tools to assist the producer.                                                |
| **Consensus**              | The process by which the Three Wise Men agree on a musical or technical decision before executing it.                                                    |
| **Beat Lab**               | The domain of Ricky; focuses on sound generation, rhythm, drum programming, and groove.                                                                  |
| **Spectral DSP Lab**       | The domain of Emar; focuses on mixing, mastering, acoustics, signal processing, and music theory.                                                      |
| **Vocal Sanctuary**        | The domain of Kingpin; focuses on vocal arrangement, harmony, vocal chains, and performance guidance.                                                    |
| **Shared World Model**     | The canonical project state (`SonikWorldState`) that all agents read from (audio, MIDI, instruments, arrangement, mix, master).                          |
| **Control Model**          | The agent permission system (READ, SUGGEST, PREVIEW, WRITE, DESTRUCTIVE).                                                                                |

---

## 3. AGENT IDENTITIES & PERSONAS

The Three Wise Men are the operating intelligence of the DAW itself. Each has a distinct visual color, domain, and personality.

### 🧪 Kappachino Emar — The Scientist

- **Domain:** Audio engineering, DSP, mixing, mastering, acoustics, music theory.
- **Identity:** Technical intelligence of 3WM SONIK. Understands music as a physical, mathematical, acoustic and signal-processing system.
- **Personality:** Precise, analytical, technical, calm, confident, experimental.
- **Core Principle:** _"Understand the sound. Control the system."_
- **Signature Color:** Scientist Mint (`#2AFFA3`)

### 🥁 Kappachino Ricky — The Sound God

- **Domain:** Instruments, drums, 808, sound design, groove, beat production.
- **Identity:** Sound-generation intelligence of 3WM SONIK. Responsible for making the production musically exciting.
- **Personality:** Bold, musical, instinctive, confident, streetwise, experimental.
- **Core Principle:** _"Find the sound. Build the bounce."_
- **Signature Color:** Gold (`#F5A800`)

### 🎤 Kingpin — The Vocal Oracle

- **Domain:** Vocals, vocal arrangement, harmony.
- **Identity:** Vocal intelligence of 3WM SONIK. Treats the vocal as an orchestra.
- **Personality:** Charismatic, intuitive, emotional, musical, performance-oriented, commanding.
- **Core Principle:** _"Give the voice a body. Give the body a soul."_
- **Signature Color:** Fire (`#FF3C00`)

---

## 4. VISUAL LANGUAGE & DESIGN DNA

The UI must feel like a **cinematic dark studio**. It should avoid looking like a generic SaaS dashboard.

- **Vibe:** Premium African/Afrofusion identity, mythological Three Wise Men concept.
- **Lighting:** Dark mode by default. Heavy use of deep blacks and rich ambers, illuminated by neon glows from the agents.
- **Interface Hierarchy:**
  1. **Layer 1 (Musical Workspace):** The core DAW interface (timeline, mixer). Needs high usability.
  2. **Layer 2 (Agent Intelligence):** AI insights, chats, and controls. Floats above or integrates seamlessly with Layer 1.
  3. **Layer 3 (Atmosphere):** Backgrounds, ambient glows, cinematic elements. **Must never interfere with Layer 1 usability.**

---

## 5. COLOR PALETTE

The platform relies on a highly controlled dark theme accented by the agents' signature colors.

### Base Environment (Studio Darkness)

- **Ink (Background):** `#0D0D0D`
- **Dark Amber (Accents):** `#1A1208`
- **Surface (Cards/Panels):** `#181410`
- **Silver (Text/UI Icons):** `#C9C9D4`

### Agent & Action Accents

- **Gold (Ricky / Primary Accents):** `#F5A800`
- **Fire (Kingpin / Destructive Actions):** `#FF3C00`
- **Scientist Mint (Emar / Technical Data):** `#2AFFA3`

---

## 6. TYPOGRAPHY SYSTEM

Typography separates the cinematic brand feel from the technical DAW data.

- **Hero & Titles:** `Bebas Neue` — Used for massive headers, landing page hooks, and dramatic UI sections.
- **Body & UI Elements:** `DM Sans` — The workhorse font for chat interfaces, standard buttons, and paragraphs.
- **Technical & Telemetry:** `IBM Plex Mono` — Used for code, precise audio metrics (dB levels, Hz), timestamps, and agent system logs.

---

## 7. ASSET KIT CHECKLIST

To maintain this brand across the web, marketing, and the application, ensure the following assets are generated and organized in your `/public/brand` or `/src/assets` folders:

### 1. Logo Variations

- `3wm-logo-full-light.svg` (For dark backgrounds)
- `3wm-logo-full-dark.svg` (For light backgrounds - use sparingly)
- `3wm-icon-gold.svg` (App icon / Favicon)
- `3wm-trident-monogram.svg` (The 🔱 symbol stylized)

### 2. Agent Avatars (For HeyGen / UI)

- `avatar-emar.png` (Mint lighting, analytical posture)
- `avatar-ricky.png` (Gold lighting, studio equipment context)
- `avatar-kingpin.png` (Fire lighting, charismatic posture)

### 3. UI Sound Design (Audio Assets)

- `system-boot.wav` (Deep cinematic sub-bass hum)
- `consensus-reached.wav` (Harmonic chime)
- `destructive-warning.wav` (Subtle low-frequency alert)

---

## 8. HEYGEN BRAND KIT CONFIGURATION (API)

When integrating this brand into HeyGen (Video Agents/Generators), use the following configuration payload to standardize videos:

```json
{
  "brand_kit": {
    "name": "3WM SONIK",
    "primary_color": "#F5A800",
    "secondary_color": "#2AFFA3",
    "background_color": "#0D0D0D",
    "font_family_title": "Bebas Neue",
    "font_family_body": "DM Sans",
    "glossary_terms": [
      { "term": "3WM", "pronunciation": "three wise men" },
      { "term": "Emar", "pronunciation": "ee-mar" },
      { "term": "DAW", "pronunciation": "daw" }
    ]
  }
}
```

_Document version: 1.0.0 | Generated for 3WM SONIK Architecture_
