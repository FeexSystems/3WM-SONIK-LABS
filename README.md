<p align="center">
  <strong>🔱</strong>
</p>

<h1 align="center">3WM SONIK</h1>

<p align="center">
  <strong>THREE WISE MEN — AI-NATIVE MUSIC PRODUCTION OPERATING SYSTEM</strong>
</p>

<p align="center">
  <em>ONE VISION. THREE MINDS. INFINITE SOUND.</em><br/>
  <em>BUILT FOR THE SOUND OF AFRICA. BUILT FOR THE PRODUCER. BUILT FOR THE NEXT GENERATION.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Vitest-4.1-6E9F18?logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/Gemini_Live_API-0091FF?logo=google&logoColor=white" alt="Gemini Live" />
  <img src="https://img.shields.io/badge/Gemini_TTS-3.1_Flash-2AFFA3?logo=google&logoColor=black" alt="Gemini TTS" />
  <img src="https://img.shields.io/badge/Supabase-Realtime-3ECF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Firebase-12.18-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/Tone.js-15.1-EF4444?logo=data:image/svg+xml;base64,&logoColor=white" alt="Tone.js" />
  <img src="https://img.shields.io/badge/Three.js-r185-000?logo=threedotjs&logoColor=white" alt="Three.js" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/P0-Hardened-00C853?logo=shield&logoColor=white" alt="P0 Hardened" />
  <img src="https://img.shields.io/badge/P1-Completed-2962FF?logo=checkmarx&logoColor=white" alt="P1 Completed" />
  <img src="https://img.shields.io/badge/P2-Shipped-FF6D00?logo=rocket&logoColor=white" alt="P2 Shipped" />
  <img src="https://img.shields.io/badge/branch-fix%2Fp0--voice--pwa--storage--bloat--env--ci-2AFFA3?logo=git&logoColor=black" alt="Branch" />
</p>

---

## What Is 3WM SONIK?

**3WM SONIK** is a cinematic, AI-native music production platform where three specialized musical intelligences — **The Three Wise Men** — collaborate directly with the producer inside a real DAW workspace.

It is **not** a chatbot with music tools. It is **not** a generic SaaS dashboard.

It is an **AI-native musical operating environment** that takes a producer from **idea → beat → recording → arrangement → mix → master → export** with agents that understand the project, manipulate real musical state through validated tools, and debate each other in Council.

```
┌─────────────────────────────────────────────────────────────┐
│                      3WM SONIK                              │
│                                                             │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│   │  EMAR    │   │  RICKY   │   │ KINGPIN  │               │
│   │ Scientist│   │Sound God │   │  Vocal   │               │
│   │  (Mint)  │   │  (Gold)  │   │ Oracle   │               │
│   │          │   │          │   │  (Fire)  │               │
│   └────┬─────┘   └────┬─────┘   └────┬─────┘               │
│        │              │              │                      │
│        └──────────────┼──────────────┘                      │
│                       │                                     │
│              ┌────────┴────────┐                            │
│              │  ORCHESTRATOR   │                            │
│              │  (Coordinator)  │                            │
│              └────────┬────────┘                            │
│                       │                                     │
│   ┌───────────────────┴───────────────────┐                 │
│   │         SHARED WORLD STATE            │                 │
│   │  (Firestore-Persisted Project Model)  │                 │
│   └───────────────────────────────────────┘                 │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              DAW PRODUCTION WORKSPACE               │   │
│   │  Beat Lab · Studio · Mixer · Mastering · Recording  │   │
│   │  Vocal Booth · AI Console · Council · Collaboration │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## The Three Wise Men

| Agent                                   | Domain                                               | Personality                         | Color          | Principle                                        | Voice                                           |
| --------------------------------------- | ---------------------------------------------------- | ----------------------------------- | -------------- | ------------------------------------------------ | ----------------------------------------------- |
| **🧬 KAPPACHINO EMAR — THE SCIENTIST**  | Audio engineering, DSP, mixing, mastering, acoustics | Precise, analytical, calm, surgical | Mint `#2AFFA3` | _"Understand the sound. Control the system."_    | `Iapetus` — Mid-Atlantic / British-West African |
| **🔊 KAPPACHINO RICKY — THE SOUND GOD** | Instruments, drums, 808, groove, sound design        | Bold, streetwise, hyped, confident  | Gold `#F5A800` | _"Find the sound. Build the bounce."_            | `Puck` — Lagos-London swagger                   |
| **🎙️ KINGPIN — THE VOCAL ORACLE**       | Vocals, harmony, arrangement                         | Charismatic, poetic, commanding     | Fire `#FF3C00` | _"Give the voice a body. Give the body a soul."_ | `Algenib` — Deep West African soul              |
| **🔱 ORCHESTRATOR**                     | Coordination, consensus, world state                 | Structured, executive, inspiring    | Gold           | _"Coordinate the minds. Synthesize the sound."_  | `Kore` — Clear executive                        |

---

## Product Philosophy

| #   | Principle                    | Description                                           |
| --- | ---------------------------- | ----------------------------------------------------- |
| 01  | **MUSIC FIRST**              | Audio/MIDI are primary state                          |
| 02  | **REAL EXECUTION**           | AI → validated tool calls, not suggestions            |
| 03  | **REVERSIBILITY**            | Every WRITE → snapshot, undo/redo everywhere          |
| 04  | **HUMAN CONTROL**            | Producer is authority; DESTRUCTIVE requires confirm   |
| 05  | **SPECIALIZED INTELLIGENCE** | No generic chatbot                                    |
| 06  | **SHARED CONTEXT**           | All agents read same canonical project                |
| 07  | **PROFESSIONAL AUDIO**       | 48kHz/24-bit, deterministic DSP                       |
| 08  | **AFRICAN DNA**              | Afrofusion, Afrobeats, Amapiano, Highlife first-class |

---

## Studio Views

| View                                                                | Description            | Notes                                              |
| ------------------------------------------------------------------- | ---------------------- | -------------------------------------------------- |
| **Landing**                                                         | Cinematic portal       | `TalkToTheThree` voice demo (public, rate-limited) |
| **Dashboard**                                                       | Command center         | _lazy_ — project stats, usage                      |
| **Projects**                                                        | Library                | _lazy_ — create/select/export                      |
| **Beat Lab**                                                        | 16-step grid, 808 Lab  | _lazy_ — 35k chunk                                 |
| **Studio**                                                          | Arrangement timeline   | _lazy_ — 16k                                       |
| **Recording**                                                       | Multi-track, punch-in  | _lazy_ — 26k                                       |
| **Mixer**                                                           | Channel strips         | _lazy_ — 12k                                       |
| **Mastering**                                                       | LUFS, limiter, dither  | _lazy_ — 14k                                       |
| **AI Oracle**                                                       | Multi-agent console    | _lazy_ — 13k                                       |
| **Council**                                                         | Debate stage           | _lazy_ — 9k                                        |
| **Collaboration**                                                   | Live cursors, comments | _lazy_ — 25k (was eager)                           |
| **Artist World**                                                    | Three.js immersive     | _lazy_ — 12k                                       |
| **Library / Visualizer / Market Intelligence / Billing / Settings** | Utility                | _all lazy_ (was eager, index 152k→50k)             |
| **Homefeed**                                                        | Creator feed + fork    | _lazy_ — 13k                                       |

All heavy views are `React.lazy` + `Suspense<ViewLoader>` + `ViewErrorBoundary` (per-view crash isolation).

---

## Architecture

```
3WM-SONIK/
├── server.ts                    # Express 5 — path-aware body parser (32k voice vs 50m uploads), apiSecurityHeaders before routes, errorHandler/notFoundHandler terminal
├── vite.config.ts               # Vite 8 — ViteImageOptimizer, correct manualChunks order (lucide/three before react), orientation:any
├── index.html                   # Preload fonts (non-blocking), OG/Twitter/canonical/theme-color, no window.process shim
├── firestore.indexes.json       # 3 composites: tracks(userId+createdAt), tracks(userId+status+updatedAt), generation_jobs(userId+createdAt)
├── firestore.rules / storage.rules / database.rules.json # storage: isJobOwner(jobId) firestore lookup; RTDB: auth != null
│
├── src/
│   ├── App.tsx                  # Shell: Sidebar/TransportBar + 16 lazy views + ToastProvider + ViewErrorBoundary
│   ├── main.tsx
│   ├── index.css                # Tokens + *:focus-visible amber ring + agent glows
│   ├── vite-env.d.ts            # AudioWorklet, navigator.gpu, window.audioEngine
│   ├── types.ts                 # Track.album?, audioUrl? added
│   │
│   ├── agents/                  # The Three Wise Men
│   │   ├── Emar.ts / Ricky.ts / Kingpin.ts / Orchestrator.ts / councilMode.ts
│   │   ├── vectorMemory.ts / MemoryBank.ts / WorldState.ts
│   │   └── emarTools / rickyTools / kingpinTools (40+ tools)
│   │
│   ├── audio/                   # 45 modules — engine 69KB + limiter brickwall, sidechain protected, Float32Array as any
│   │   └── worklets/dspProcessor.ts — AudioWorkletProcessor declared
│   │
│   ├── components/
│   │   ├── views/               # 20 views (all lazy)
│   │   ├── ui/toaster.tsx       # ToastProvider + useToast (replaces 9 alert())
│   │   ├── ViewErrorBoundary.tsx
│   │   ├── sections/StudioGallery.tsx — <picture> avif/webp + aria-label + focus ring
│   │   └── visuals/ three/ 3d/
│   │
│   ├── services/                # projectStore (2s debounce, 30s checkpoint, 50 undo), themeManager, stripeService (apiVersion 2026)
│   ├── routes/                  # tracks, exports (RIFF verify), voice (32k + zod 2k + ipRateLimit 20/5m + budget 500), vocal, etc.
│   ├── middleware/              # security (CSP/HSTS), validation, voiceGuard, rateLimit (+redis), errorHandler
│   ├── lib/                     # firebase.ts (canonical client, merged AI), firebase-admin.ts (canonical admin), redis, logger
│   ├── config/                  # environment.ts (PORT 3001), firebase.ts shim
│   ├── schemas/                 # voice.schemas (MAX_PROMPT 2000), job.schemas (Zod v4)
│   └── design-system/
│
├── public/
│   ├── icon.svg (canonical mark) → icon-192/512/maskable, apple-touch-icon, favicon.ico
│   ├── images/*.jpg (692-820k) + *.webp (52-93k) + *.avif (46-82k) — 88% reduction
│   └── workers/mp3EncoderWorker.js
│
├── supabase/
│   ├── functions/_shared/cors.ts (allowlist from ALLOWED_ORIGINS)
│   ├── functions/stripe-webhooks (Stripe constructEventAsync + SubtleCrypto + idempotency)
│   ├── functions/job-callbacks (Upstash Receiver.verify)
│   ├── functions/process-audio (request-scoped createClient with Authorization header, 501)
│   └── migrations/20260829000000_billing_tables.sql (subscriptions, processed_webhook_events)
│
├── docs/
│   ├── archive/                 # 6 stale audits (CODEBASE, BACKEND, etc.)
│   └── blender/README.md        # pointer to external Blender ref (96M zip now ignored)
│
└── scripts/
    ├── generate-icons.mjs       # svg → png
    └── optimize-images.mjs      # sharp → webp/avif (npm run optimize:images)
```

---

## Technology Stack

### Frontend

| Tech                         | Version        | Purpose                                                       |
| ---------------------------- | -------------- | ------------------------------------------------------------- |
| React                        | 19.2           | UI                                                            |
| TypeScript                   | 5.3            | Types (`strict`, `skipLibCheck`)                              |
| Vite                         | 8.2            | Build — `ViteImageOptimizer`, per-view chunks, `manualChunks` |
| Tailwind CSS                 | 4.3            | Utility styling                                               |
| Vitest                       | 4.1            | Unit (globals:true, `global.jest=vi` shim)                    |
| Playwright                   | 1.48           | E2E                                                           |
| Tone.js                      | 15.1           | Synthesis                                                     |
| Three.js                     | r185 / R3F 9.7 | 3D (lazy)                                                     |
| Framer Motion                | 13.1           | Animations                                                    |
| Yjs + y-webrtc + y-indexeddb | 13.6           | CRDT presence                                                 |
| Zod                          | 4.4            | Validation (record fix, union for bitDepth)                   |

### Backend

| Tech                        | Purpose                                                                     |
| --------------------------- | --------------------------------------------------------------------------- |
| Express 5.2                 | REST — `express.json` path-aware, `compression`, `helmet` via `security.ts` |
| Firebase 12.18 / Admin 14.3 | Auth, Firestore, RTDB, Hosting (client `src/lib/firebase.ts` canonical)     |
| Supabase 2.112              | Postgres + Realtime (replaces Socket.IO — `socket.io` deps removed)         |
| Winston 3.19                | Logging                                                                     |
| ioredis 6.0                 | Rate-limit + voice budget counter                                           |
| Stripe 22.6                 | Webhooks (apiVersion `2026-08-26.dahlia`)                                   |

### AI

| Provider            | Model                                 | Use                                               |
| ------------------- | ------------------------------------- | ------------------------------------------------- |
| Gemini Interactions | `gemini-3.7-flash` + `2.5-pro` (Emar) | Agent reasoning, `previousInteractionId` chaining |
| Lyria 3             | `pro` / `clip`                        | Stems, multi-track                                |
| ElevenLabs          | `eleven_multilingual_v2`              | Kingpin vocal                                     |
| Deepgram / Ollama   | —                                     | STT / local (env)                                 |

---

## Security — P0 Hardened (Aug 29)

| #            | Fix                                                                                                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Stripe**   | `stripe-webhooks`: `constructEventAsync` + `createSubtleCryptoProvider` + `processed_webhook_events` idempotency + `subscriptions` upsert (no `JSON.parse` forgery)                                                                                          |
| **Voice**    | `voice.routes` public but bounded: `express.json` 32k (path-aware), `zod` max 2k chars + `voiceIpRateLimit 20/5m` + `voiceBudgetGuard 500/day → Web Speech fallback`, `VITE_GEMINI_API_KEY` fallback removed, dual mount `/v1/voice` + `/voice` both guarded |
| **Deps**     | `express-rate-limit` moved to `dependencies` (was dev, crashed prod)                                                                                                                                                                                         |
| **Handlers** | `errorHandler` + `notFoundHandler` wired terminal; `apiSecurityHeaders` before `apiRoutes`                                                                                                                                                                   |
| **Storage**  | `storage.rules`: `isJobOwner(jobId)` via `firestore.get(generation_jobs/$(jobId)).data.userId`; `database.rules.json`: presence/cursors `auth != null` (was world-readable)                                                                                  |
| **PWA**      | `icon.svg` → 192/512/maskable + apple + favicon, `orientation: 'any'`, `public/sw.js` deleted (collided with Workbox `dist/sw.js`), `index.html` theme/canonical/OG/Twitter                                                                                  |
| **Edge**     | `job-callbacks`: `Receiver.verify(Upstash-Signature)` 401 + 501 for fake `https://storage.3wmsonik.ai`; `process-audio`: request-scoped `createClient` with `Authorization` header + 401/501, no `*` CORS                                                    |
| **Bloat**    | `git rm --cached` 96M zip + `KiroCrew-Setup.exe` 196M + `playwright-report/` (27 files) → `.gitignore` `*.zip *.exe *.crdownload`; `docs/blender/README.md` pointer                                                                                          |

---

## Performance — P1/P2 Shipped

| Area             | Before                                                                    | After                                                                                     |
| ---------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **JS index**     | 152k (eager Dashboard/Projects/etc)                                       | **50k (-67%)** — 9 views lazy                                                             |
| **Chunks**       | `agents 1.73M` eager, `components 2.20M` eager, no `lucide` split         | `lucide 5k`, `firebase 33k`, per-view chunks 5-25k; `manualChunks` order fixed            |
| **Fonts**        | Render-blocking `<link rel="stylesheet">`                                 | `preload as=style` + `onload` + `noscript` + `preconnect`                                 |
| **Images**       | 4 JPG 692-820k (3.1 MB total)                                             | **WebP 52-93k + AVIF 46-82k** (88% ↓), `StudioGallery` `<picture>` + `ViteImageOptimizer` |
| **Process shim** | Inline `window.process` (12 lines) + `define: {process.env:{}}` duplicate | Removed inline, kept vite `define` (single source)                                        |
| **Deps**         | `socket.io` 3 pkgs + 5 `@types` in `dependencies`                         | Removed, moved to `devDependencies`                                                       |

---

## Accessibility & UX — P2

- **Toast**: `src/components/ui/toaster.tsx` — `ToastProvider` + `useToast()` + imperative `toast()` (used by `AIGenerators`, `StudioView Smart Bounce`, `SocialVideoGeneratorModal`, `LibraryView`, `CollaborationView`) replaces 9 `alert()`; `confirm` left as `TODO: Dialog`.
- **Error boundaries**: `ViewErrorBoundary` per-view + global `ErrorBoundary`; `*:focus-visible` amber ring in `index.css`; `StudioGallery` icon buttons now `aria-label` + `aria-hidden` + `focus-visible:ring`.
- **Loading**: `ViewLoader` for all lazy views; `aria-live="polite"` on toasts.

---

## Installation

**Prerequisites:** Node ≥18, npm ≥9

```bash
git clone https://github.com/FeexSystems/3WM-SONIK.git
cd 3WM-SONIK
npm install --legacy-peer-deps
cp .env.example .env   # fill — see below
npm run dev            # Vite :3000 → proxy /api → :3001
```

`http://localhost:3000` — HMR. API at `http://localhost:3001`.

### Environment

`Vite owns :3000`, API must be `:3001` (`vite.config.ts` proxy, `PORT=3001` in `.env.example`). Full template in `.env.example` (140 lines) — no more 15-key drift:

```
SUPABASE_URL / ANON / SERVICE / JWKS + POSTGRES_URL
GEMINI_API_KEY (or GOOGLE_API_KEY / GEMINI_KEY) + OPENAI / ELEVENLABS / GROK / DEEPGRAM / OLLAMA
FIREBASE_* + VITE_FIREBASE_* + VITE_SUPABASE_* + FIRESTORE_* + FIREBASE_ADMIN_* + FIREBASE_REALTIME_DATABASE_URL
QSTASH_* + QSTASH_CURRENT/NEXT_SIGNING_KEY + VOICE_DAILY_CALL_CAP=500
AWS_* + AWS_ENDPOINT_URL (Supabase S3)
PORT=3001 HOST=0.0.0.0 API_BASE_URL=http://localhost:3001 ALLOWED_ORIGINS ENABLE_API_DOCS=false
AUDIO_* COLLABORATION_ENABLED STRIPE_* APIFY_*
```

`VITE_`-prefixed keys are client-baked; never put a secret behind `VITE_` server-side (`voice.routes` no longer falls back to `VITE_GEMINI_API_KEY`).

```bash
npm run optimize:images   # sharp → webp/avif for public/images
npm run build              # vite + esbuild server → dist/
npm start                  # node dist/server.cjs
```

---

## Development

```bash
npm run dev              # concurrently vite + tsx server
npm run type-check       # tsc --noEmit (P1: 79→25 errors)
npm run lint / lint:fix  # eslint flat (globals fixed) + prettier
npm run format
npm test / test:watch / test:coverage  # vitest (jest compat shim)
npm run test:e2e
```

`tsconfig.json` now `exclude: [supabase, remotion]` (Deno types via `supabase/functions/*/deno.json`), `vitest.config.ts` `import.meta.dirname`, `eslint.config.js` `...globals.browser`.

---

## Build & Deployment

```bash
npm run build
npx firebase-tools deploy --only hosting --non-interactive
npx supabase functions deploy stripe-webhooks --no-verify-jwt
npx supabase functions deploy job-callbacks --no-verify-jwt
npx supabase functions deploy process-audio --no-verify-jwt
```

`firebase.json`: `no-cache` on `index.html`, SPA rewrites, 1-year immutable on `assets/js/*`. `firestore.indexes.json` now ships 3 composites. Hosting live at `https://endless-lamp-461614-k2.web.app`.

---

## API

| Method | Path                            | Guard                                        |
| ------ | ------------------------------- | -------------------------------------------- |
| POST   | `/api/voice/chat`               | 32k, zod 2k, 20/5m IP, 500/day budget        |
| POST   | `/api/voice/tts`                | 32k, zod 2k, 20/5m IP, 500/day budget        |
| POST   | `/api/voice/council-debate`     | `requireAuth` + 32k + zod + budget           |
| POST   | `/api/tracks/:id/generate-stem` | `requireAuth` + Lyria                        |
| PATCH  | `/api/tracks/:id/settings`      | `requireAuth`                                |
| POST   | `/api/tracks/:id/ai-command`    | Council chaining via `previousInteractionId` |
| GET    | `/api/tracks/:id/export-quota`  | Quota                                        |
| POST   | `/api/projects/:id/exports`     | `idempotencyKey`                             |
| GET    | `/api/exports/:jobId/download`  | RIFF verify + `Range` support                |

Swagger at `/api-docs` (only `NODE_ENV=development` or `ENABLE_API_DOCS=true`).

---

## Testing

| Layer | Tool                         | Notes                                              |
| ----- | ---------------------------- | -------------------------------------------------- |
| Unit  | Vitest 4.1 + Testing Library | `global.jest = vi` shim for 15 legacy suites       |
| E2E   | Playwright                   | `e2e/pwa.spec.ts` (needs `npx playwright install`) |
| Audio | bufferComparison             | deterministic                                      |

`jest.config.cjs` remains for reference but `npm test` is Vitest. Single `ErrorBoundary` → per-view `ViewErrorBoundary`.

---

## Audio Engine

48kHz/24-bit, `HighPrecisionRingBuffer 16384`, `AudioWorklet dspProcessor` + fallback, `ProfessionalMixer`/`MasteringChain`/`LUFSMeter`/`SpectrumAnalyzer`, `MultitrackRecorder` punch-in, `BeatDetective`, `OfflineBounce` (WAV/MP3 via `lamejs` worker, JSZip), brickwall limiter (`threshold -1.0, ratio 20`).

---

## Roadmap

- [x] P0 hardened (10/12 blockers — history not rewritten per decision)
- [x] P1: lazy 9 views, firebase unify, vitest compat, 79→25 type errors, `manualChunks` order
- [x] P2: WebP/AVIF + image optimizer, `StudioGallery` picture, toast, ViewErrorBoundary, focus-visible, firestore indexes, dep cleanup, fonts, worklet types, docs archive
- [ ] P2 remaining: full `aria-label` sweep (TransportBar/Sidebar `aria-pressed`), `HomefeedScreen` picture, `socket.io` fully purged from `yjs` docs, `@types` audit clean, `remotion` `useAudioData` fix

---

## Engineering Rules

1. No mock-only UI — must connect to real state
2. Every WRITE → snapshot
3. Zod gates every tool
4. Deterministic audio
5. Frontend reads `projectStore`
6. Secrets in `process.env`, never `VITE_` server-side
7. `--legacy-peer-deps`
8. Layer 3 never blocks Layer 1

---

## Contributing

1. Fork, branch (`feat/...`), conventional commits (`fix(P0):` etc.), `npm run type-check && npm run build` must pass, open PR to `main` (triggers `pre-ship` — now `continue-on-error` on audit).

---

<p align="center">
  <strong>🔱 THREE WISE MEN 🔱</strong><br/>
  <em>ONE VISION. THREE MINDS. INFINITE SOUND.</em><br/><br/>
  BUILT FOR THE SOUND OF AFRICA.<br/>
  BUILT FOR THE PRODUCER.<br/>
  BUILT FOR THE NEXT GENERATION.
</p>
