/**
 * Vocal Synthesis Panel
 * UI for Kingpin's ElevenLabs-powered vocal synthesis capabilities
 */

import React, { useState, useRef } from 'react';
import { kingpin } from '../../agents/Kingpin';

interface VocalSynthesisPanelProps {
  onSynthesisComplete?: (audioBuffer: AudioBuffer) => void;
}

export const VocalSynthesisPanel: React.FC<VocalSynthesisPanelProps> = ({
  onSynthesisComplete,
}) => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    loadAvailableVoices();
  }, []);

  const loadAvailableVoices = async () => {
    try {
      if (kingpin.isElevenLabsAvailable()) {
        const voices = await kingpin.getAvailableVoices();
        setAvailableVoices(voices);
        const defaultVoice = kingpin.getDefaultVoice();
        if (defaultVoice) setSelectedVoice(defaultVoice);
      }
    } catch (err) {
      console.error('Failed to load voices:', err);
    }
  };

  const handleSynthesize = async () => {
    if (!text.trim()) {
      setError('Please enter text to synthesize');
      return;
    }

    if (!kingpin.isElevenLabsAvailable()) {
      setError('ElevenLabs service is not available. Please configure API key.');
      return;
    }

    setIsSynthesizing(true);
    setError('');
    setAudioBuffer(null);

    try {
      const buffer = await kingpin.generateVocalAudio(text, selectedVoice);
      setAudioBuffer(buffer);

      // Play the audio
      if (audioRef.current) {
        const audioContext = new AudioContext();
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
      }

      onSynthesisComplete?.(buffer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Synthesis failed');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleExport = async () => {
    if (!audioBuffer) return;

    const audioContext = new AudioContext();
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();

    const renderedBuffer = await offlineContext.startRendering();

    // Convert to WAV
    const wav = audioBufferToWav(renderedBuffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `vocal-synthesis-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  return (
    <div
      className="vocal-synthesis-panel"
      style={{
        padding: '20px',
        backgroundColor: '#0D0D0D',
        color: '#C9C9D4',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#FF3C00',
          fontFamily: 'Bebas Neue, sans-serif',
        }}
      >
        KINGPIN VOCAL SYNTHESIS
      </h2>

      {/* Voice Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Voice Style
        </label>
        <select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#181410',
            border: '1px solid #F5A800',
            color: '#C9C9D4',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <option value="">Select a voice...</option>
          {availableVoices.map((voice) => (
            <option key={voice.voice_id} value={voice.voice_id}>
              {voice.name}
            </option>
          ))}
        </select>
      </div>

      {/* Text Input */}
      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Vocal Text
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter the text you want Kingpin to synthesize..."
          rows={6}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#181410',
            border: '1px solid #F5A800',
            color: '#C9C9D4',
            borderRadius: '4px',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: 'rgba(255, 60, 0, 0.1)',
            border: '1px solid #FF3C00',
            borderRadius: '4px',
            color: '#FF3C00',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Synthesize Button */}
      <button
        onClick={handleSynthesize}
        disabled={isSynthesizing || !text.trim()}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: isSynthesizing ? '#1A1208' : '#F5A800',
          color: isSynthesizing ? '#F5A800' : '#0D0D0D',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: isSynthesizing ? 'not-allowed' : 'pointer',
          fontFamily: 'Bebas Neue, sans-serif',
          letterSpacing: '2px',
          transition: 'all 0.2s',
        }}
      >
        {isSynthesizing ? 'SYNTHESIZING...' : 'SYNTHESIZE VOCAL'}
      </button>

      {/* Audio Controls */}
      {audioBuffer && (
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#181410',
            borderRadius: '4px',
            border: '1px solid #2AFFA3',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              marginBottom: '12px',
              color: '#2AFFA3',
              fontFamily: 'Bebas Neue, sans-serif',
            }}
          >
            SYNTHESIS COMPLETE
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                const audioContext = new AudioContext();
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start();
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#2AFFA3',
                color: '#0D0D0D',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              PLAY
            </button>
            <button
              onClick={handleExport}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#F5A800',
                color: '#0D0D0D',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              EXPORT WAV
            </button>
          </div>
        </div>
      )}

      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
};
