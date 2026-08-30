# 3WM SONIK API Documentation

## Overview

The 3WM SONIK API provides a comprehensive interface for interacting with the cinematic AI music production platform. This API enables audio track management, AI-powered music production through the Three Wise Men agents, vocal synthesis, project exports, and real-time collaboration.

**Base URL:** `http://localhost:3000` (Development) or `https://3wm-sonik.com` (Production)  
**API Version:** 1.0.0  
**Interactive Documentation:** `/api-docs` (Swagger UI)

## Authentication

All API endpoints (except health check) require JWT authentication using the Bearer token scheme.

### Getting Your Token

1. **Register** at `/api/auth/register` to create an account
2. **Login** at `/api/auth/login` to receive your JWT token
3. Include the token in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

### CSRF Protection

State-changing requests (POST, PATCH, DELETE) require a CSRF token:

1. Get a fresh CSRF token from `/api/csrf-token`
2. Include it in the request headers:

```http
X-CSRF-Token: <your-csrf-token>
```

## Rate Limiting

The API implements per-endpoint rate limiting to ensure fair usage:

- **Lenient:** 100 requests per minute (health checks, reads)
- **Moderate:** 50 requests per minute (moderate operations)
- **Strict:** 20 requests per minute (write operations, exports)

Rate limit headers are included in responses:

- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## API Endpoints

### Health

#### Health Check

```http
GET /api/health
```

Returns the current platform status (no authentication required).

**Response:**

```json
{
  "status": "ok",
  "platform": "3WM - Sonic AI Platform",
  "version": "1.0.0",
  "activeTracks": 0,
  "time": "2026-08-22T12:00:00.000Z"
}
```

### Authentication

#### Get CSRF Token

```http
GET /api/csrf-token
```

Returns a fresh CSRF token for state-changing requests.

**Response:**

```json
{
  "csrfToken": "abc123def456..."
}
```

### Tracks

#### Get All Tracks

```http
GET /api/tracks
```

Retrieves all tracks belonging to the authenticated user.

**Response:**

```json
[
  {
    "id": "track-1234567890",
    "title": "Afrofusion Session 1",
    "artist": "Kappachino Emar x Kappachino Ricky",
    "genre": "Afrofusion",
    "bpm": 112,
    "key": "F# Minor",
    "duration": 180,
    "status": "production",
    "createdAt": "2026-08-22T12:00:00.000Z"
  }
]
```

#### Get Track by ID

```http
GET /api/tracks/:id
```

Retrieves a specific track by its ID.

**Parameters:**

- `id` (path): Track ID

#### Create Track

```http
POST /api/tracks
```

Creates a new audio track with default Afrofusion settings.

**Request Body:**

```json
{
  "title": "Lagos Nights",
  "artist": "Kappachino Ricky",
  "genre": "Afrofusion",
  "bpm": 115,
  "key": "D Minor"
}
```

**Response:**

```json
{
  "id": "track-1234567890",
  "title": "Lagos Nights",
  "artist": "Kappachino Ricky",
  "genre": "Afrofusion",
  "bpm": 115,
  "key": "D Minor",
  "duration": 180,
  "status": "raw",
  "settings": {
    "volume": 0.88,
    "pan": 0,
    "eq": { "low": 0, "mid": 0, "high": 0 }
  }
}
```

#### Update Track Settings

```http
PATCH /api/tracks/:id/settings
```

Updates audio settings, EQ, compression, and mastering parameters.

**Request Body:**

```json
{
  "settings": {
    "volume": 0.9,
    "eq": { "low": 2.5, "mid": 0, "high": 1.5 },
    "compression": { "threshold": -18, "ratio": 3 }
  }
}
```

#### Generate Stem

```http
POST /api/tracks/:id/generate-stem
```

Generates a new audio stem using AI-powered synthesis.

**Request Body:**

```json
{
  "prompt": "Add a warm bassline with Lagos log-drum character",
  "type": "bass"
}
```

**Response:**

```json
{
  "track": {/* updated track object */},
  "audioUrl": "data:audio/wav;base64,...",
  "message": "Stem generated successfully"
}
```

#### Apply Mastering

```http
POST /api/tracks/:id/master
```

Applies AI-powered mastering presets to the track.

**Request Body:**

```json
{
  "preset": "Lagos Bounce"
}
```

**Available Presets:**

- `Afrofusion Warmth`: Warm, vintage character with rich harmonics
- `Lagos Bounce`: Punchy, dynamic with enhanced stereo width
- `Shrine Reverb`: Atmospheric with convolution reverb tails
- `Clean Mix`: Transparent, modern mastering

### AI Agents

#### Execute AI Agent Command

```http
POST /api/tracks/:id/ai-command
```

Sends a command to one of the Three Wise Men AI agents.

**Request Body:**

```json
{
  "agent": "emar",
  "command": "Add more warmth to the vocals and boost the low-mids"
}
```

**Available Agents:**

- `emar`: Kappachino Emar - The Scientist (audio engineering, DSP, mixing, mastering)
- `ricky`: Kappachino Ricky - The Sound God (instruments, drums, sound design, groove)
- `kingpin`: Kingpin - The Vocal Oracle (vocals, vocal arrangement, harmony)
- `orchestrator`: ThreeWM Orchestrator (coordinates the system)

**Response:**

```json
{
  "track": {/* updated track object */},
  "responseText": "I've applied a 3dB boost to the low-mids (200-500Hz) and added subtle saturation to the vocal track for warmth."
}
```

### Exports

#### Get Export Quota

```http
GET /api/projects/:id/export-quota?sampleRate=48000&bitDepth=24&format=wav
```

Returns export quota information and estimated cost.

**Response:**

```json
{
  "estimatedUnits": 2.4,
  "remainingUnits": 97.6,
  "canExport": true,
  "planLimit": 100,
  "format": "wav",
  "sampleRate": 48000,
  "bitDepth": 24,
  "costDescription": "Studio Lossless 24-bit / 48kHz Render"
}
```

#### Create Export Job

```http
POST /api/projects/:id/exports
```

Creates a new audio export job.

**Request Body:**

```json
{
  "format": "wav",
  "sampleRate": 48000,
  "bitDepth": 24,
  "includeStems": false,
  "masterPreset": "Lagos Bounce",
  "idempotencyKey": "export-abc123"
}
```

**Response:**

```json
{
  "id": "job-1234567890-abc",
  "projectId": "track-1234567890",
  "trackTitle": "Afrofusion Session 1",
  "status": "processing",
  "format": "wav",
  "sampleRate": 48000,
  "bitDepth": 24,
  "progressPercent": 20,
  "createdAt": "2026-08-22T12:00:00.000Z"
}
```

#### Get Export Job Status

```http
GET /api/exports/:jobId
```

Retrieves the status and progress of an export job.

**Response:**

```json
{
  "id": "job-1234567890-abc",
  "status": "completed",
  "progressPercent": 100,
  "completedAt": "2026-08-22T12:01:30.000Z",
  "outputUrl": "/api/exports/job-1234567890-abc/download"
}
```

#### Download Export

```http
GET /api/exports/:jobId/download
```

Downloads the completed audio export as a WAV file.

#### Download Stems ZIP

```http
GET /api/exports/:jobId/download-zip
```

Downloads all stems and master as a ZIP archive.

### Vocal

#### Synthesize Vocal

```http
POST /api/vocal/synthesize
```

Converts text to speech using ElevenLabs AI voice synthesis.

**Request Body:**

```json
{
  "text": "Three Wise Men, one vision, infinite sound.",
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "model": "eleven_multilingual_v2",
  "outputFormat": "mp3"
}
```

**Response:**

```json
{
  "success": true,
  "audioUrl": "data:audio/mp3;base64,SUQzBAAAAAAAI1RT...",
  "format": "mp3",
  "duration": 2456
}
```

#### Clone Voice

```http
POST /api/vocal/clone-voice
```

Creates a custom voice clone from audio samples.

**Request Body:**

```json
{
  "name": "Custom Afrofusion Voice",
  "description": "Voice with warm Lagos character",
  "samples": [
    { "data": "base64-encoded-audio-sample-1" },
    { "data": "base64-encoded-audio-sample-2" }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "voiceId": "custom-voice-123",
  "name": "Custom Afrofusion Voice",
  "message": "Voice cloned successfully"
}
```

#### Get Available Voices

```http
GET /api/vocal/voices
```

Retrieves all available voices from ElevenLabs.

**Response:**

```json
{
  "success": true,
  "voices": [
    {
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "labels": { "accent": "American", "description": "Soft", "age": "Young" }
    }
  ]
}
```

### Projects

#### Archive Project

```http
PATCH /api/projects/:id/archive
```

Archives or unarchives a project.

**Request Body:**

```json
{
  "archived": true
}
```

### Memory

#### Get Vector Memory

```http
GET /api/vector-memory
```

Retrieves all items from the vector memory knowledge base.

**Response:**

```json
[
  {
    "id": "mem-1",
    "content": "Afrofusion production techniques",
    "embedding": [0.1, 0.2, 0.3]
  }
]
```

### Collaboration

#### Get n8n Workflows

```http
GET /api/n8n/workflows
```

Retrieves all available n8n automation workflows.

**Response:**

```json
[
  {
    "id": "wf-1",
    "name": "Auto-Mastering Pipeline",
    "status": "active"
  }
]
```

#### Trigger n8n Workflow

```http
POST /api/n8n/workflows/:id/trigger
```

Triggers a specific n8n automation workflow.

**Response:**

```json
{
  "success": true,
  "workflow": {/* workflow object */},
  "message": "Workflow \"Auto-Mastering Pipeline\" executed successfully"
}
```

## Error Handling

The API uses standard HTTP status codes and returns error details in the response body:

```json
{
  "error": "Error message",
  "message": "Detailed error message",
  "statusCode": 400
}
```

**Common Status Codes:**

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Security

### Security Headers

All API responses include security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy`: Default CSP policy

### CORS

Cross-Origin Resource Sharing is configured for authorized domains. Contact support to whitelist your domain.

## SDK Examples

### JavaScript/TypeScript

```typescript
// Authentication
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const { token } = await response.json();
  return token;
};

// Create Track
const createTrack = async (token: string, trackData: CreateTrackRequest) => {
  const csrfResponse = await fetch('/api/csrf-token', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { csrfToken } = await csrfResponse.json();

  const response = await fetch('/api/tracks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(trackData),
  });
  return response.json();
};

// AI Agent Command
const executeAgentCommand = async (
  token: string,
  trackId: string,
  agent: string,
  command: string
) => {
  const csrfResponse = await fetch('/api/csrf-token', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { csrfToken } = await csrfResponse.json();

  const response = await fetch(`/api/tracks/${trackId}/ai-command`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ agent, command }),
  });
  return response.json();
};
```

### cURL

```bash
# Health Check
curl http://localhost:3000/api/health

# Create Track
TOKEN="your-jwt-token"
CSRF_TOKEN=$(curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/csrf-token | jq -r '.csrfToken')

curl -X POST http://localhost:3000/api/tracks \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Lagos Nights","artist":"Kappachino Ricky","genre":"Afrofusion"}'

# AI Agent Command
curl -X POST http://localhost:3000/api/tracks/track-123/ai-command \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agent":"emar","command":"Add warmth to the vocals"}'
```

## Support

For API support and questions:

- Email: support@3wm-sonik.com
- Documentation: https://docs.3wm-sonik.com
- Interactive API: https://3wm-sonik.com/api-docs

## Changelog

### Version 1.0.0 (2026-08-22)

- Initial API release
- Track management endpoints
- AI agent integration
- Vocal synthesis
- Export system
- Real-time collaboration
- Vector memory
