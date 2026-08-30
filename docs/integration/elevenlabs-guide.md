# ElevenLabs Integration Guide for 3WM SONIK

This guide covers the integration of ElevenLabs text-to-speech and voice cloning capabilities with Kingpin, The Vocal Oracle.

## Overview

ElevenLabs provides advanced AI-powered text-to-speech and voice cloning capabilities that enhance Kingpin's vocal synthesis features. This integration allows producers to:

- Generate vocal audio from text suggestions
- Create custom vocal styles from audio samples
- Stream real-time vocal guidance during production
- Manage a library of preset and custom voices

## Architecture

### Components

1. **ElevenLabs Service** (`src/services/elevenLabsService.ts`)
   - Core service for ElevenLabs API interactions
   - Handles synthesis, cloning, and streaming
   - Implements caching for cost optimization

2. **Kingpin Enhancement** (`src/agents/Kingpin.ts`)
   - Extended with ElevenLabs capabilities
   - Methods for vocal audio generation and voice cloning
   - Integration with existing agent system

3. **UI Components** (`src/components/vocal/`)
   - `VocalSynthesisPanel`: Text-to-speech interface
   - `VoiceCloningWizard`: Custom voice creation
   - `VocalLibrary`: Voice management and preview

4. **Audio Engine Integration** (`src/audio/engine.ts`)
   - Vocal track support
   - Real-time monitoring
   - DSP chain integration

5. **API Endpoints** (`server.ts`)
   - `/api/vocal/synthesize`: Text-to-speech
   - `/api/vocal/clone-voice`: Voice cloning
   - `/api/vocal/voices`: Get available voices

## Setup

### 1. Obtain ElevenLabs API Key

1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Navigate to API settings
3. Generate an API key
4. Copy the key for configuration

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your-api-key-here
ELEVENLABS_MODEL=eleven_multilingual_v2
ELEVENLABS_DEFAULT_VOICE=
ELEVENLABS_CACHE_ENABLED=true
ELEVENLABS_MAX_CACHE_SIZE=100
```

### 3. Verify Configuration

The service automatically initializes when Kingpin is instantiated. Check the console for initialization messages:

```
[Kingpin] ElevenLabs service initialized
```

## Usage

### Vocal Synthesis

#### Using Kingpin Directly

```typescript
import { kingpin } from './agents/Kingpin';

// Check if ElevenLabs is available
if (kingpin.isElevenLabsAvailable()) {
  // Generate vocal audio
  const audioBuffer = await kingpin.generateVocalAudio(
    'Add a soulful ad-lib here',
    'voice-id-or-style'
  );

  // Use the audio buffer in your project
  audioEngine.addSynthesizedVocal(audioBuffer, 'track-id');
}
```

#### Using the UI

1. Open the Vocal Synthesis Panel
2. Select a voice style from the dropdown
3. Enter the text you want synthesized
4. Click "Synthesize Vocal"
5. Play the result or export as WAV

### Voice Cloning

#### Using Kingpin Directly

```typescript
// Prepare audio samples (10-60 seconds each, clear speech)
const audioSamples = [
  new File([audioData1], 'sample1.mp3', { type: 'audio/mpeg' }),
  new File([audioData2], 'sample2.mp3', { type: 'audio/mpeg' }),
];

// Create custom voice
const voiceId = await kingpin.createCustomVocalStyle('My Custom Voice', audioSamples);

console.log(`Voice created with ID: ${voiceId}`);
```

#### Using the UI

1. Open the Voice Cloning Wizard
2. Upload 1-5 audio samples (10-60 seconds each)
3. Enter voice name and description
4. Click "Create Voice"
5. Wait for training to complete (may take several minutes)

### Real-Time Streaming

```typescript
// Stream vocal guidance during production
for await (const chunk of kingpin.streamVocalGuidance(
  'Try adding more emotion to this section',
  'voice-id'
)) {
  // Process audio chunks in real-time
  audioEngine.routeVocalToMonitoring(chunk.data);
}
```

### Voice Library

```typescript
// Get available voices
const voices = await kingpin.getAvailableVoices();

// Filter for custom voices
const customVoices = voices.filter((v) => v.category === 'cloned');

// Use a voice
const audioBuffer = await kingpin.generateVocalAudio(
  'Text to synthesize',
  customVoices[0].voice_id
);
```

## Audio Engine Integration

### Adding Synthesized Vocals to Tracks

```typescript
import { soundEngine } from './audio/engine';

// Add synthesized vocal to project
await soundEngine.addSynthesizedVocal(audioBuffer, 'vocal-track-1', 'Lead Vocal');

// Play the vocal track
soundEngine.playVocalTrack('vocal-track-1');

// Adjust volume
soundEngine.setVocalTrackVolume('vocal-track-1', 0.8);

// Adjust pan
soundEngine.setVocalTrackPan('vocal-track-1', -0.3);

// Stop playback
soundEngine.stopVocalTrack('vocal-track-1');

// Remove track when done
soundEngine.removeVocalTrack('vocal-track-1');
```

### Vocal Monitoring

```typescript
// Enable vocal monitoring
soundEngine.enableVocalMonitoring(true);

// Route synthesized audio to monitoring
await soundEngine.routeVocalToMonitoring(audioBuffer);

// Disable when done
soundEngine.enableVocalMonitoring(false);
```

## API Reference

### ElevenLabsService

#### `synthesizeVoice(request: VoiceSynthesisRequest): Promise<AudioBuffer>`

Synthesize vocal audio from text.

**Parameters:**

- `text`: Text to synthesize
- `voiceId`: Voice ID to use (optional, uses default if not provided)
- `model`: Model to use (default: `eleven_multilingual_v2`)
- `outputFormat`: Output format (`mp3`, `pcm`, `wav`)
- `stability`: Stability value (0-1, default: 0.5)
- `similarityBoost`: Similarity boost (0-1, default: 0.75)

**Returns:** AudioBuffer with synthesized audio

#### `cloneVoice(request: VoiceCloningRequest): Promise<string>`

Clone a custom voice from audio samples.

**Parameters:**

- `name`: Name for the custom voice
- `description`: Description of the voice
- `audioSamples`: Array of File objects with audio samples

**Returns:** Voice ID of the cloned voice

#### `getAvailableVoices(): Promise<Voice[]>`

Get list of available voices.

**Returns:** Array of voice objects with IDs, names, and metadata

#### `streamSynthesis(text: string, voiceId?: string): AsyncGenerator<AudioChunk>`

Stream synthesis in real-time.

**Parameters:**

- `text`: Text to synthesize
- `voiceId`: Voice ID to use (optional)

**Returns:** Async generator of audio chunks

### Kingpin Methods

#### `generateVocalAudio(suggestion: string, voiceStyle?: string): Promise<AudioBuffer>`

Generate vocal audio from a suggestion.

#### `createCustomVocalStyle(name: string, referenceAudio: File[]): Promise<string>`

Create a custom vocal style.

#### `streamVocalGuidance(guidance: string, voiceStyle?: string): AsyncGenerator<AudioChunk>`

Stream vocal guidance in real-time.

#### `getAvailableVoices(): Promise<Voice[]>`

Get available voices.

#### `getDefaultVoice(): string | undefined`

Get the default voice ID.

#### `isElevenLabsAvailable(): boolean`

Check if ElevenLabs service is available.

## Best Practices

### Cost Optimization

1. **Enable Caching**: Caching is enabled by default and reduces API calls
2. **Reuse Synthesized Audio**: Store and reuse synthesized vocals
3. **Batch Requests**: Synthesize multiple texts in one session
4. **Monitor Usage**: Track API usage to control costs

### Voice Quality

1. **Quality Samples**: Use clear, high-quality audio samples for cloning
2. **Sample Length**: 10-60 seconds per sample, 3-5 samples recommended
3. **Consistent Audio**: Use similar recording conditions for all samples
4. **Test Voices**: Preview voices before using in production

### Performance

1. **Preload Voices**: Load voices before production sessions
2. **Use Streaming**: Use streaming for real-time guidance
3. **Cache Management**: Clear cache periodically to free memory
4. **Monitor Latency**: Track synthesis latency for optimal UX

## Troubleshooting

### Service Not Available

**Problem:** `ElevenLabs service is not available` error

**Solutions:**

1. Check API key is set in environment variables
2. Verify API key is valid and active
3. Check network connectivity to ElevenLabs API
4. Review console for initialization errors

### Synthesis Fails

**Problem:** Synthesis requests fail with API errors

**Solutions:**

1. Check API quota and usage limits
2. Verify voice ID is valid
3. Ensure text is not empty
4. Check ElevenLabs service status

### Voice Cloning Fails

**Problem:** Voice cloning fails or produces poor quality

**Solutions:**

1. Use higher quality audio samples
2. Ensure samples are 10-60 seconds each
3. Use clear speech without background noise
4. Try different sample combinations

### High Latency

**Problem:** Synthesis takes too long

**Solutions:**

1. Enable caching for repeated requests
2. Use shorter text for synthesis
3. Check network connectivity
4. Consider using a closer ElevenLabs server region

## Cost Management

### Pricing

ElevenLabs uses character-based pricing:

- Free tier: 10,000 characters/month
- Starter: $5/month for 30,000 characters
- Creator: $22/month for 100,000 characters
- Pro: $99/month for 500,000 characters

### Monitoring

Track usage with:

```typescript
// Check cache hit rate
const cacheStats = elevenLabsService.getCacheStats();

// Monitor API calls
console.log('API calls made:', apiCallCount);
```

### Optimization Tips

1. Cache frequently used phrases
2. Use shorter, more concise text
3. Reuse synthesized audio when possible
4. Batch synthesis requests

## Security

### API Key Management

1. Never commit API keys to version control
2. Use environment variables for configuration
3. Rotate API keys regularly
4. Use different keys for development and production

### Data Privacy

1. Audio samples are sent to ElevenLabs for processing
2. Review ElevenLabs privacy policy
3. Consider using on-premise alternatives for sensitive data
4. Implement data retention policies

## Advanced Features

### Custom Voice Settings

```typescript
// Get voice settings
const settings = await elevenLabsService.getVoiceSettings(voiceId);

// Modify settings for synthesis
const audioBuffer = await elevenLabsService.synthesizeVoice({
  text: 'Custom synthesis',
  voiceId,
  stability: 0.3, // More expressive
  similarityBoost: 0.9, // Closer to original
});
```

### Voice Deletion

```typescript
// Delete a custom voice
await elevenLabsService.deleteVoice(voiceId);
```

### Cache Management

```typescript
// Clear cache
elevenLabsService.clearCache();

// Disable caching
elevenLabsService.setCacheEnabled(false);

// Set max cache size
elevenLabsService.setMaxCacheSize(50);
```

## Integration Examples

### Example 1: Auto-Generate Backing Vocals

```typescript
// Generate harmony vocals automatically
const melody = 'The main melody text';
const harmony = await kingpin.generateVocalAudio(`Harmony for: ${melody}`, 'harmony-voice-id');

audioEngine.addSynthesizedVocal(harmony, 'harmony-track');
```

### Example 2: Real-Time Vocal Guidance

```typescript
// Stream guidance during recording
const guidance = 'Try singing with more emotion on the chorus';
for await (const chunk of kingpin.streamVocalGuidance(guidance)) {
  audioEngine.routeVocalToMonitoring(chunk.data);
}
```

### Example 3: Multi-Language Vocals

```typescript
// Synthesize vocals in different languages
const englishVocal = await kingpin.generateVocalAudio('English lyrics here', 'english-voice-id');

const spanishVocal = await kingpin.generateVocalAudio('Spanish lyrics here', 'spanish-voice-id');
```

## Support

### Documentation

- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [3WM SONIK Architecture](../ARCHITECTURE_MAP.md)
- [Agent System](../../AGENTS.md)

### Issues

Report issues or request features via the project issue tracker.

### Community

Join the 3WM SONIK community for support and discussions.

---

**Document Version**: 1.0
**Last Updated**: 2024
**Maintained By**: 3WM SONIK Team
