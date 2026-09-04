# 🔱 3WM SONIK API Documentation (v3.0)

## Overview

The 3WM SONIK API provides a comprehensive interface for interacting with the cinematic AI music production platform. This API enables audio track management, AI-powered music production through the Three Wise Men agents, vocal synthesis, project exports, and real-time collaboration.

**Base URL:** `http://localhost:3000` (Development) or `https://3wm-sonik.com` (Production)  
**API Version:** 3.0.0  
**Interactive Documentation:** `/api-docs` (Swagger UI)

---

## Authentication & Security

All API endpoints (except health check and verified webhooks) require JWT authentication using the Bearer token scheme.

### CSRF Protection

State-changing requests (POST, PATCH, DELETE) require a CSRF token:

1. Get a fresh CSRF token from `/api/csrf-token`
2. Include it in request headers: `X-CSRF-Token: <token>`

### CORS and Security Headers

All API responses include hardened security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## Unified Multi-Rail Payment Gateway API

The `/api/billing` router handles multi-currency transactions, enterprise subscriptions, real-time localized bank/wallet routing, and decentralized Web3 crypto checkouts.

### 1. Initiate Payment Charge

```http
POST /api/billing/charge
```

Pipes the transaction request to the appropriate rail (Stripe, Paystack, or Web3) based on the user's currency and target checkout format.

**Request Body (Paystack local Mobile Money/Card example):**

```json
{
  "gateway": "paystack",
  "amount": 5000,
  "currency": "NGN",
  "email": "producer@feexsystems.com",
  "planId": "pro_monthly_ngn",
  "metadata": {
    "userId": "usr-3wm7890",
    "split_code": "SPL_1987626"
  }
}
```

**Response (Paystack checkout link):**

```json
{
  "success": true,
  "reference": "pstk_tx_178810239",
  "authorization_url": "https://checkout.paystack.com/3Ie8r0Zl6bvoZ7vp",
  "currency": "NGN",
  "convertedAmount": 5000
}
```

**Request Body (Web3 Multi-Chain Deposit example):**

```json
{
  "gateway": "crypto",
  "amount": 50,
  "currency": "USDC",
  "network": "polygon",
  "email": "producer@feexsystems.com",
  "planId": "creator_pack"
}
```

**Response (Web3 Deposit instructions):**

```json
{
  "success": true,
  "vaultAddress": "0x3WM7A890F3B9A8912E1E6B9D8B2C4E0A8F2E1B4C",
  "network": "polygon",
  "estimatedGasGwei": 35,
  "memo": "PRODUCER_CREDITS"
}
```

### 2. Live Currency Converter

```http
GET /api/billing/convert-currency?amount=50&from=USD&to=NGN
```

Converts currency metrics using live regional bank conversion layers.

**Response:**

```json
{
  "amount": 50,
  "from": "USD",
  "to": "NGN",
  "rate": 1550.0,
  "convertedAmount": 77500.0
}
```

### 3. Stripe Webhook Handler

```http
POST /api/billing/webhook/stripe
```

Handles subscription states, payment successes, and identity checks. **Requires Stripe Signature (`stripe-signature`) verification.**

### 4. Paystack Live Webhook Handler

```http
POST /api/billing/webhook/paystack
```

Verifies localized payments and triggers automatic **85/15 revenue splits** back into subaccounts.  
**Security Contract:** Validates incoming payloads utilizing **SHA512 HMAC hashing** matching the server's local token:

```javascript
const hash = crypto
  .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
  .update(JSON.stringify(req.body))
  .digest('hex');
if (hash !== req.headers['x-paystack-signature']) {
  throw new Error('Invalid signature');
}
```

---

## Google Cloud BigQuery Music ML API

Pushes real-time track sequencing parameters to telemetry tables and pulls predictive accents.

### 1. Send Sequencer Telemetry

```http
POST /api/analytics/telemetry
```

Streams sequencer modifications directly to BigQuery tables.

**Request Body:**

```json
{
  "sessionId": "sess-3wm982",
  "trackId": "track-123",
  "genre": "Amapiano",
  "bpm": 112,
  "stepDensity": 0.65,
  "activeNotes": [1, 5, 9, 13]
}
```

**Response:**

```json
{
  "success": true,
  "logged": true,
  "timestamp": "2026-08-30T20:29:00Z"
}
```

### 2. Retrieve Predictive Accent Grooves

```http
GET /api/analytics/predict-accents?genre=Afrofusion&bpm=115
```

Queries the BigQuery ML forecasting model (`ARIMA_PLUS` + `K-Means`) to estimate syncopated accent beats for step-sequencer patterns.

**Response:**

```json
{
  "genre": "Afrofusion",
  "recommendedAccents": [3, 7, 12, 14],
  "groovePattern": "Kalakuta_Shrine",
  "accentConfidence": 0.94
}
```

---

## Gemini Live Bidirectional WebSocket API

Provides real-time bidirectional streaming for natural voice conversation and immediate tool execution.

**WebSocket URL:** `ws://localhost:3000/api/audio/live-stream`

### Connection Handshake

Clients must initiate the connection by sending an authentication token:

```json
{
  "type": "auth",
  "token": "your-jwt-token"
}
```

### Audio Input Stream (PCM 24kHz / 16-bit Mono)

Clients stream microphone PCM buffers chunks serialized in Base64:

```json
{
  "type": "audio",
  "data": "SUQzBAAAAAAAI1RT..."
}
```

### Server Event Stream (Response & Instrument Action)

The server streams bidirectional synthetic vocals and triggers corresponding UI updates:

```json
{
  "type": "agent_response",
  "agent": "ricky",
  "audio": "base64-encoded-audio...",
  "actions": [
    {
      "type": "WRITE",
      "command": "UPDATE_STEP_SEQUENCER",
      "params": { "track": "Kick", "steps": [1, 5, 9, 13] }
    }
  ]
}
```

---

## Core Track & Sequencer Endpoints

### 1. Get All Tracks

```http
GET /api/tracks
```

Retrieves all tracks belonging to the authenticated user.

### 2. Create Track

```http
POST /api/tracks
```

Creates a new audio track with default Afrofusion settings.

### 3. Update Track Settings

```http
PATCH /api/tracks/:id/settings
```

Updates audio settings, EQ, compression, and mastering parameters.

### 4. 3ONIK Agents Engine Command Execution

```http
POST /api/voice/3onik-command
```

Processes natural language and vocal producer commands through the **3ONIK Cognitive Kernel**, routing tasks across the Three Wise Men triad and returning structured action payloads with parameters.

**Request Body:**

```json
{
  "prompt": "Ricky, build an Amapiano log drum bounce at 112 BPM",
  "targetAgent": "ricky",
  "context": {
    "genre": "Amapiano",
    "bpm": 112,
    "key": "F# min"
  }
}
```

**Response Body:**

```json
{
  "success": true,
  "agent": "ricky",
  "reasoning": "Generated syncopated 16-step log drum pattern tuned to F#1 with dynamic accents and pitch bends.",
  "response": "I laid down the bounce for you. Deep Amapiano log drum groove loaded into the Beat Lab.",
  "action": {
    "type": "WRITE",
    "target": "BEAT_LAB_PATTERN",
    "payload": {
      "channelId": "ch-logdrum",
      "bpm": 112,
      "steps": [0, 3, 6, 8, 12, 14]
    }
  }
}
```

### 5. Execute AI Agent Track Command

```http
POST /api/tracks/:id/ai-command
```

Sends track-specific instructions directly to the designated agent (Emar, Ricky, Kingpin) to inspect or modify mixer strips and DSP parameters.

---

## Client & Platform Abstraction Layer (PAL) APIs

### 1. `PlatformRegistry` (`src/audio/platform/PlatformRegistry.ts`)
- `PlatformRegistry.getAudioPlatform()`: Returns `IAudioPlatformAdapter` (`NativeAudioAdapter` if in Electron, else `WebAudioAdapter`).
- `PlatformRegistry.getFileSystem()`: Returns `IFileSystemAdapter` (Desktop direct disk I/O or browser File System Access API).
- `PlatformRegistry.getMidiPlatform()`: Returns `IMidiPlatformAdapter` (Web MIDI or hardware MIDI interfaces).
- `PlatformRegistry.getCapabilities()`: Returns `PlatformCapabilities` (supported drivers, buffer sizes, WebGPU support).

### 2. `PluginHostManager` (`src/audio/plugins/PluginHostManager.ts`)
- `pluginHostManager.scanPlugins()`: Scans and registers system VST3/AU plugins and built-in WASM DSP effects.
- `pluginHostManager.instantiatePlugin(pluginId)`: Creates a live DSP instance with real-time parameter automation.
- `pluginHostManager.getActiveInstances()`: Lists all active plugin instances on mixer strips.

### 3. `ConflictResolver` & `LiveJamEngine` (`src/sync/`)
- `conflictResolver.updateTrack(trackId, trackData)`: Atomically merges track changes using Yjs CRDT vector clocks.
- `conflictResolver.exportState()`: Returns `Uint8Array` binary state snapshot for cloud persistence.
- `liveJamEngine.joinRoom(roomId)`: Connects to peer-to-peer WebRTC audio mesh.
- `liveJamEngine.requestTrackLock(trackId)`: Claims exclusive edit lock on a track to avoid edit collisions.

### 4. `LocalInferenceEngine` (`src/agents/localInferenceEngine.ts`)
- `localInferenceEngine.generateChordProgression(rootNote, scaleType, length)`: Local ONNX WebGPU neural chord generator.
- `localInferenceEngine.predictAfrobeatGrooveVelocity(baseVelocities, genre)`: Generates Amapiano / Afrobeats micro-timing velocity curves.

### 5. `ProductionDiagnostics` (`src/telemetry/ProductionDiagnostics.ts`)
- `productionDiagnostics.captureSnapshot()`: Retrieves real-time DSP latency, buffer underruns (xruns), and audio thread CPU load.
- `productionDiagnostics.subscribe(callback)`: Real-time telemetry stream listener for UI HUDs.

---

## Support & Interactive Console

- Swagger UI: `https://3wm-sonik.com/api-docs`
- Tech Support: `developer@feexsystems.com`  
  🔱

