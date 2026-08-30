# Kingpin Vocal Features Guide

This guide explains how to use Kingpin's vocal synthesis and voice cloning features in 3WM SONIK.

## Overview

Kingpin, The Vocal Oracle, is enhanced with ElevenLabs integration to provide advanced vocal capabilities:

- **Text-to-Speech**: Convert vocal suggestions to audio
- **Voice Cloning**: Create custom vocal styles from reference audio
- **Voice Library**: Access preset and custom voices
- **Real-time Streaming**: Get instant vocal feedback during production

## Getting Started

### Prerequisites

1. **ElevenLabs API Key**: Obtain from [https://elevenlabs.io](https://elevenlabs.io)
2. **Environment Configuration**: Set up your `.env` file with the API key
3. **Audio Engine**: Ensure the SonicAudioEngine is initialized

### Configuration

Add to your `.env` file:

```bash
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_MODEL=eleven_multilingual_v2
ELEVENLABS_DEFAULT_VOICE=
ELEVENLABS_CACHE_ENABLED=true
ELEVENLABS_MAX_CACHE_SIZE=100
```

## Core Features

### 1. Vocal Synthesis

Convert text suggestions to vocal audio.

#### Basic Usage

```typescript
import { kingpin } from './agents/Kingpin';

// Check if ElevenLabs is available
if (kingpin.isElevenLabsAvailable()) {
  const audioBuffer = await kingpin.generateVocalAudio(
    'Add a soulful harmony in the chorus',
    'voice-style-id'
  );

  // Use the audio buffer
  const audioContext = new AudioContext();
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
}
```

#### With Custom Voice Settings

```typescript
const audioBuffer = await kingpin.generateVocalAudio(
  'The vocal should be emotional and powerful',
  'custom-voice-id'
);
```

#### Using the Vocal Synthesis Panel

```tsx
import { VocalSynthesisPanel } from './components/vocal/VocalSynthesisPanel';

<VocalSynthesisPanel
  onSynthesisComplete={(audioBuffer) => {
    // Handle synthesized audio
    console.log('Synthesis complete:', audioBuffer.duration);
  }}
/>;
```

### 2. Voice Cloning

Create custom vocal styles from your own audio samples.

#### Requirements for Reference Audio

- **Format**: MP3 or WAV
- **Duration**: 10-60 seconds per sample
- **Quality**: High quality, clear audio
- **Content**: Consistent vocal performance
- **Quantity**: 3-5 samples recommended for best results

#### Basic Usage

```typescript
import { kingpin } from './agents/Kingpin';

// Upload audio samples (from file input or drag-drop)
const audioFiles = [
  file1, // File object
  file2,
  file3,
];

// Create custom voice
const voiceId = await kingpin.createCustomVocalStyle(
  'My Afrofusion Voice',
  'Custom vocal style for Afrofusion productions',
  audioFiles
);

console.log('Voice created with ID:', voiceId);
```

#### Using the Voice Cloning Wizard

```tsx
import { VoiceCloningWizard } from './components/vocal/VoiceCloningWizard';

<VoiceCloningWizard
  onVoiceCreated={(voiceId) => {
    // Handle new voice creation
    console.log('New voice created:', voiceId);
  }}
/>;
```

### 3. Voice Library

Browse and manage available voices.

#### Get Available Voices

```typescript
import { kingpin } from './agents/Kingpin';

const voices = await kingpin.getAvailableVoices();

voices.forEach((voice) => {
  console.log(`${voice.name} (${voice.voice_id})`);
  console.log(`Category: ${voice.category}`);
  console.log(`Labels:`, voice.labels);
});
```

#### Using the Vocal Library UI

```tsx
import { VocalLibrary } from './components/vocal/VocalLibrary';

<VocalLibrary
  onVoiceSelect={(voiceId) => {
    // Handle voice selection
    console.log('Selected voice:', voiceId);
  }}
/>;
```

#### Preview Voices

```tsx
// In VocalLibrary component, preview with custom text
const previewText = 'This is a test of the voice';

await kingpin.generateVocalAudio(previewText, voiceId);
```

### 4. Real-time Vocal Guidance

Stream vocal feedback during production.

```typescript
import { kingpin } from './agents/Kingpin';

// Stream vocal guidance
for await (const chunk of kingpin.streamVocalGuidance(
  'Try adding more reverb to the vocal',
  'voice-style-id'
)) {
  if (chunk.isFinal) {
    console.log('Streaming complete');
  } else {
    // Process audio chunk
    console.log('Received chunk:', chunk.data.byteLength, 'bytes');
  }
}
```

## Audio Engine Integration

### Adding Synthesized Vocals to Projects

```typescript
import { soundEngine } from './audio/engine';
import { kingpin } from './agents/Kingpin';

// Synthesize vocal
const audioBuffer = await kingpin.generateVocalAudio('Lead vocal for the verse');

// Add to audio engine as a track
await soundEngine.addSynthesizedVocal(audioBuffer, 'vocal-track-lead');

// Play the vocal track
soundEngine.playVocalTrack('vocal-track-lead');

// Adjust volume
soundEngine.setVocalTrackVolume('vocal-track-lead', 0.8);

// Adjust pan
soundEngine.setVocalTrackPan('vocal-track-lead', 0.3);
```

### Managing Vocal Tracks

```typescript
// Stop playback
soundEngine.stopVocalTrack('vocal-track-lead');

// Remove track
soundEngine.removeVocalTrack('vocal-track-lead');

// Get all vocal tracks
const vocalTracks = soundEngine.getVocalTracks();
console.log('Active vocal tracks:', vocalTracks.size);

// Enable vocal monitoring
soundEngine.enableVocalMonitoring(true);
```

## Workflows

### Workflow 1: Create Custom Vocal Style

1. **Prepare Reference Audio**
   - Record 3-5 high-quality vocal samples
   - Ensure consistent performance across samples
   - Trim to 10-60 seconds each

2. **Use Voice Cloning Wizard**
   - Open Voice Cloning Wizard in the UI
   - Upload your reference audio samples
   - Provide voice name and description
   - Start the cloning process

3. **Test the New Voice**
   - Wait for cloning to complete (2-5 minutes)
   - Preview with test text
   - Adjust if needed

4. **Use in Production**
   - Select the new voice in Vocal Synthesis Panel
   - Generate vocal audio for your project
   - Add to audio engine as a track

### Workflow 2: Generate Vocal for Track

1. **Get Vocal Suggestion**
   - Use Kingpin to get vocal arrangement suggestions
   - Review the suggestion text

2. **Select Voice**
   - Open Vocal Library
   - Browse preset and custom voices
   - Preview voices with test text
   - Select appropriate voice

3. **Synthesize Audio**
   - Open Vocal Synthesis Panel
   - Enter the suggestion text
   - Select the voice
   - Click "Synthesize"

4. **Integrate into Project**
   - Preview the synthesized audio
   - Export to WAV if needed
   - Add to audio engine as a track
   - Adjust volume, pan, and effects

### Workflow 3: Real-time Vocal Feedback

1. **Enable Streaming**
   - Ensure ElevenLabs service is available
   - Select voice for feedback

2. **Request Guidance**
   - Ask Kingpin for vocal guidance
   - Stream the response as audio

3. **Apply Feedback**
   - Listen to the vocal guidance
   - Make adjustments to your production
   - Iterate as needed

## Best Practices

### Vocal Synthesis

1. **Text Quality**
   - Use clear, descriptive text
   - Include emotional context (e.g., "emotional", "powerful")
   - Specify timing if needed (e.g., "in the chorus")

2. **Voice Selection**
   - Match voice to genre and mood
   - Test multiple voices before finalizing
   - Consider using custom voices for unique sound

3. **Performance**
   - Enable caching for repeated phrases
   - Keep text under 500 characters
   - Use appropriate output format (MP3 for web, WAV for quality)

### Voice Cloning

1. **Reference Audio**
   - Use high-quality recordings
   - Ensure consistent microphone placement
   - Minimize background noise
   - Record in a treated environment

2. **Sample Variety**
   - Include different emotional expressions
   - Vary pitch and dynamics
   - Use consistent vocal technique

3. **Voice Management**
   - Give voices descriptive names
   - Add detailed descriptions
   - Organize by genre or use case

### Cost Management

1. **API Usage**
   - Monitor character usage
   - Enable caching to reduce API calls
   - Use preset voices when possible

2. **Efficiency**
   - Batch synthesis requests
   - Reuse synthesized audio
   - Clear cache periodically

## Troubleshooting

### Common Issues

**Issue**: "ElevenLabs service not initialized"

- **Solution**: Check that `ELEVENLABS_API_KEY` is set in `.env`

**Issue**: Synthesis is slow

- **Solution**: Enable caching, check internet connection, reduce text length

**Issue**: Voice quality is poor

- **Solution**: Use higher quality reference audio, adjust stability/similarity settings

**Issue**: Custom voice not appearing in library

- **Solution**: Wait for cloning to complete, refresh the voice list

**Issue**: Audio playback fails

- **Solution**: Check audio context is resumed, verify audio buffer format

### Debug Mode

Enable detailed logging:

```typescript
// In Kingpin.ts
this.logAction(`ElevenLabs status: ${this.isElevenLabsAvailable()}`);
this.logAction(`Default voice: ${this.getDefaultVoice()}`);
```

## Advanced Usage

### Custom Voice Settings

```typescript
// Adjust voice parameters for different effects
const audioBuffer = await kingpin.generateVocalAudio(text, voiceId, {
  stability: 0.3, // Lower = more expressive
  similarityBoost: 0.9, // Higher = closer to reference
});
```

### Multi-language Support

```typescript
// ElevenLabs supports multiple languages
const audioBuffer = await kingpin.generateVocalAudio(
  "Bonjour, c'est un test", // French text
  voiceId
);
```

### Batch Synthesis

```typescript
// Synthesize multiple phrases
const phrases = ['Verse line 1', 'Verse line 2', 'Chorus hook'];

const audioBuffers = await Promise.all(
  phrases.map((phrase) => kingpin.generateVocalAudio(phrase, voiceId))
);
```

## Integration with Other Agents

### Collaboration with Emar (The Scientist)

```typescript
// Emar provides vocal arrangement analysis
const emarAnalysis = await emmar.analyzeVocalStack(track);

// Kingpin uses analysis to generate appropriate vocals
const vocalSuggestion = await kingpin.generateVocalSuggestion(
  emarAnalysis,
  'Add harmony in the upper register'
);

// Synthesize the suggestion
const audioBuffer = await kingpin.generateVocalAudio(
  vocalSuggestion.text,
  vocalSuggestion.voiceStyle
);
```

### Collaboration with Ricky (The Sound God)

```typescript
// Ricky provides beat and groove context
const rickyContext = await ricky.getGrooveContext(track);

// Kingpin generates vocals that fit the groove
const vocalAudio = await kingpin.generateVocalAudio(
  `Vocals that match ${rickyContext.bpm} BPM with ${rickyContext.style} feel`,
  voiceId
);
```

## Performance Metrics

Target performance for Kingpin vocal features:

- **Synthesis Latency**: < 2 seconds
- **Voice Cloning**: < 5 minutes
- **Voice Listing**: < 500ms
- **Cache Hit Rate**: > 50%

## Security and Privacy

1. **API Key Protection**
   - Never expose API keys in client code
   - Use environment variables for configuration
   - Rotate keys regularly

2. **Voice Data**
   - Custom voices are stored on ElevenLabs servers
   - Review ElevenLabs privacy policy
   - Delete unused voices to reduce data exposure

3. **Authentication**
   - All API calls require Firebase authentication
   - Implement proper access controls
   - Log API usage for auditing

## Future Enhancements

Planned features for Kingpin vocal capabilities:

- Voice style transfer between voices
- Advanced vocal editing tools
- Real-time pitch correction
- Multi-part harmony generation
- Vocal arrangement automation

## Support

For issues specific to Kingpin vocal features:

- Check the integration guide: `docs/integration/elevenlabs-guide.md`
- Review API documentation: `docs/api/vocal-synthesis.md`
- Report bugs in the project repository

## License

Kingpin vocal features are part of 3WM SONIK and follow the project license. ElevenLabs API usage is subject to ElevenLabs terms of service.
