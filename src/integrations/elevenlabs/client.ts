import { ElevenLabsClient } from 'elevenlabs';
import { v4 as uuidv4 } from 'uuid';
import { adminDb } from '../../lib/firebase-admin.js';
import {
  ElevenLabsProvider,
  MusicGenerationRequest,
  SoundEffectRequest,
  VoiceIsolationRequest,
  VoiceTransformRequest,
  GeneratedAsset,
} from './types';

// This file MUST NOT be imported by client-side code.
if (typeof window !== 'undefined') {
  throw new Error('ElevenLabs client.ts must only be used on the server.');
}

// Export the authenticated SDK client instance
export const elevenLabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || '',
});

async function uploadToStorage(buffer: Buffer, mimeType: string, prefix: string): Promise<string> {
  const fileId = `${prefix}-${uuidv4()}`;
  // Save to Firestore as a base64 asset temporarily to avoid setting up a real GCS bucket in this sandbox
  await adminDb
    .collection('assets')
    .doc(fileId)
    .set({
      data: buffer.toString('base64'),
      mimeType,
      createdAt: new Date().toISOString(),
    });
  return `/api/assets/${fileId}`;
}

export const elevenLabsProvider: ElevenLabsProvider = {
  generateMusic: async (input: MusicGenerationRequest): Promise<GeneratedAsset> => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('Missing ElevenLabs API key');

    const body: any = {
      text: input.prompt,
    };
    if (input.duration_seconds) body.duration_seconds = input.duration_seconds;

    const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      if (text.includes('bad_composition_plan')) {
        throw new Error('bad_composition_plan: Request contains copyrighted material');
      }
      throw new Error(`ElevenLabs API error: ${text}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url = await uploadToStorage(buffer, 'audio/mpeg', 'music');
    return {
      id: uuidv4(),
      url,
    };
  },

  streamMusic: async function* (input: MusicGenerationRequest): AsyncIterable<Buffer> {
    throw new Error('Not implemented');
  },

  generateSoundEffect: async (input: SoundEffectRequest): Promise<GeneratedAsset> => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('Missing ElevenLabs API key');

    const body: any = {
      text: input.prompt,
    };
    if (input.duration_seconds) body.duration_seconds = input.duration_seconds;
    if (input.prompt_influence) body.prompt_influence = input.prompt_influence;

    const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`ElevenLabs API error: ${await res.text()}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url = await uploadToStorage(buffer, 'audio/mpeg', 'sfx');
    return {
      id: uuidv4(),
      url,
    };
  },

  isolateVoice: async (input: VoiceIsolationRequest): Promise<GeneratedAsset> => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('Missing ElevenLabs API key');

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(input.audioBuffer)], { type: input.contentType });
    formData.append('audio', blob, 'input.wav');

    const res = await fetch('https://api.elevenlabs.io/v1/audio-isolation', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData as any,
    });

    if (!res.ok) {
      throw new Error(`ElevenLabs API error: ${await res.text()}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url = await uploadToStorage(buffer, 'audio/mpeg', 'isolated');
    return {
      id: uuidv4(),
      url,
    };
  },

  transformVoice: async (input: VoiceTransformRequest): Promise<GeneratedAsset> => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('Missing ElevenLabs API key');

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(input.audioBuffer)], { type: input.contentType });
    formData.append('audio', blob, 'input.wav');
    formData.append('voice_id', input.voice_id);
    formData.append('model_id', 'eleven_english_sts_v2');

    const res = await fetch(`https://api.elevenlabs.io/v1/speech-to-speech/${input.voice_id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData as any,
    });

    if (!res.ok) {
      throw new Error(`ElevenLabs API error: ${await res.text()}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url = await uploadToStorage(buffer, 'audio/mpeg', 'transformed');
    return {
      id: uuidv4(),
      url,
    };
  },
};
