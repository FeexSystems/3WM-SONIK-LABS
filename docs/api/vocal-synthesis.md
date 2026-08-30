# Vocal Synthesis API Documentation

This document describes the API endpoints for vocal synthesis and voice cloning in 3WM SONIK.

## Base URL

All endpoints are relative to the server base URL:

- Development: `http://localhost:3000`
- Production: Configured via environment

## Authentication

All API endpoints require authentication via Firebase Auth. Include the Firebase ID token in the request:

```http
Authorization: Bearer <firebase-id-token>
```

## Endpoints

### Synthesize Vocal

Convert text to speech using ElevenLabs.

**Endpoint:** `POST /api/vocal/synthesize`

**Authentication:** Required

**Request Body:**

```typescript
{
  text: string;              // Text to synthesize (required)
  voiceId?: string;          // Voice ID to use (optional, uses default if not provided)
  model?: string;            // ElevenLabs model (default: "eleven_multilingual_v2")
  outputFormat?: 'mp3' | 'pcm' | 'wav';  // Output format (default: "mp3")
}
```

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/vocal/synthesize \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a vocal synthesis test",
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "model": "eleven_multilingual_v2",
    "outputFormat": "mp3"
  }'
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "audioUrl": "data:audio/mp3;base64,SUQzBAAAAAAAI1RT...",
  "format": "mp3",
  "duration": 12345
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "Text is required for synthesis"
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "error": "Failed to synthesize vocal",
  "details": "ElevenLabs API error: 401 - Invalid API key"
}
```

---

### Clone Voice

Create a custom voice from audio samples.

**Endpoint:** `POST /api/vocal/clone-voice`

**Authentication:** Required

**Request Body:**

```typescript
{
  name: string;              // Voice name (required)
  description?: string;      // Voice description (optional)
  samples: Array<{          // Audio samples (required, 1-5 samples)
    data: string;           // Base64-encoded audio data
  }>;
}
```

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/vocal/clone-voice \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Custom Voice",
    "description": "A custom vocal style for Afrofusion",
    "samples": [
      {
        "data": "base64-encoded-audio-sample-1"
      },
      {
        "data": "base64-encoded-audio-sample-2"
      }
    ]
  }'
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "voiceId": "voice-id-returned-by-elevenlabs",
  "name": "My Custom Voice",
  "message": "Voice cloned successfully"
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "Voice name is required"
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "At least one audio sample is required"
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "error": "Failed to clone voice",
  "details": "ElevenLabs API error: 400 - Invalid audio format"
}
```

---

### Get Available Voices

Retrieve all available voices from ElevenLabs.

**Endpoint:** `GET /api/vocal/voices`

**Authentication:** Required

**Query Parameters:** None

**Example Request:**

```bash
curl -X GET http://localhost:3000/api/vocal/voices \
  -H "Authorization: Bearer <token>"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "voices": [
    {
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "category": "generated",
      "labels": {
        "accent": "american",
        "gender": "female",
        "age": "young"
      },
      "description": "Soft and calm voice"
    },
    {
      "voice_id": "AZnzlk1XvdvUeBnXmlldI",
      "name": "Domi",
      "category": "generated",
      "labels": {
        "accent": "american",
        "gender": "female",
        "age": "middle"
      },
      "description": "Confident and professional"
    }
  ]
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "error": "Failed to fetch voices",
  "details": "ElevenLabs API error: 401 - Invalid API key"
}
```

---

## Data Types

### Voice Object

```typescript
interface Voice {
  voice_id: string; // Unique voice identifier
  name: string; // Display name
  category?: string; // Voice category (e.g., "generated", "cloned")
  labels?: Record<string, string>; // Voice metadata labels
  description?: string; // Voice description
}
```

### Audio Chunk (Streaming)

```typescript
interface AudioChunk {
  data: ArrayBuffer; // Audio data chunk
  isFinal: boolean; // Whether this is the final chunk
}
```

---

## Rate Limiting

API endpoints are subject to rate limits based on your ElevenLabs subscription:

- **Free Tier**: 10,000 characters per month
- **Starter Tier**: 30,000 characters per month
- **Creator Tier**: 100,000 characters per month

Monitor your usage at [https://elevenlabs.io/app/settings/subscription](https://elevenlabs.io/app/settings/subscription)

---

## Error Codes

| Status Code | Error Type            | Description                             |
| ----------- | --------------------- | --------------------------------------- |
| 400         | Bad Request           | Invalid request parameters              |
| 401         | Unauthorized          | Missing or invalid authentication token |
| 403         | Forbidden             | Insufficient permissions                |
| 429         | Too Many Requests     | Rate limit exceeded                     |
| 500         | Internal Server Error | Server or API error                     |

---

## Best Practices

### Synthesis

1. **Text Length**: Keep text under 500 characters for optimal performance
2. **Voice Selection**: Use appropriate voice for the content type
3. **Format Choice**: Use MP3 for web, WAV for high-quality audio
4. **Error Handling**: Always handle errors gracefully with user feedback

### Voice Cloning

1. **Sample Quality**: Use high-quality, clear audio samples
2. **Sample Duration**: Each sample should be 10-60 seconds
3. **Sample Count**: Provide 3-5 samples for best results
4. **Consistency**: Use samples from the same recording session

### API Usage

1. **Authentication**: Always include valid Firebase token
2. **Content-Type**: Use `application/json` for request bodies
3. **Base64 Encoding**: Encode audio samples as base64 before sending
4. **Caching**: Implement client-side caching for repeated requests

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { kingpin } from './agents/Kingpin';

// Synthesize vocal
async function synthesizeVocal(text: string, voiceId?: string) {
  try {
    const audioBuffer = await kingpin.generateVocalAudio(text, voiceId);
    return audioBuffer;
  } catch (error) {
    console.error('Synthesis failed:', error);
    throw error;
  }
}

// Clone voice
async function cloneVoice(name: string, samples: File[]) {
  try {
    const voiceId = await kingpin.createCustomVocalStyle(name, `Custom voice: ${name}`, samples);
    return voiceId;
  } catch (error) {
    console.error('Voice cloning failed:', error);
    throw error;
  }
}

// Get voices
async function getVoices() {
  try {
    const voices = await kingpin.getAvailableVoices();
    return voices;
  } catch (error) {
    console.error('Failed to fetch voices:', error);
    throw error;
  }
}
```

### React Component

```tsx
import { useState } from 'react';
import { kingpin } from '../agents/Kingpin';

export function VocalSynthesis() {
  const [text, setText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSynthesize = async () => {
    setLoading(true);
    try {
      const audioBuffer = await kingpin.generateVocalAudio(text);
      const blob = new Blob([audioBuffer.getChannelData(0)], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error) {
      console.error('Synthesis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to synthesize..."
      />
      <button onClick={handleSynthesize} disabled={loading}>
        {loading ? 'Synthesizing...' : 'Synthesize'}
      </button>
      {audioUrl && <audio src={audioUrl} controls />}
    </div>
  );
}
```

---

## Testing

### Local Testing

Use the provided test endpoints to verify integration:

```bash
# Test synthesis
curl -X POST http://localhost:3000/api/vocal/synthesize \
  -H "Authorization: Bearer <test-token>" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test synthesis"}'

# Test voice listing
curl -X GET http://localhost:3000/api/vocal/voices \
  -H "Authorization: Bearer <test-token>"
```

### Integration Tests

See test files:

- `src/services/elevenLabsService.test.ts`
- `src/agents/Kingpin.elevenlabs.test.ts`

---

## Support

For API-related issues:

- **ElevenLabs API**: [https://elevenlabs.io/docs](https://elevenlabs.io/docs)
- **3WM SONIK**: Check integration guide at `docs/integration/elevenlabs-guide.md`
- **GitHub Issues**: Report bugs in the project repository

---

## Changelog

### Version 1.0.0 (Current)

- Initial release
- Text-to-speech synthesis
- Voice cloning
- Voice library management
- Audio engine integration
