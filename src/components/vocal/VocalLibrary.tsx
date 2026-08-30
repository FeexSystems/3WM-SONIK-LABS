/**
 * Vocal Library
 * Library of custom voices with preview and management capabilities
 */

import React, { useState, useEffect } from 'react';
import { kingpin } from '../../agents/Kingpin';

interface VocalLibraryProps {
  onVoiceSelect?: (voiceId: string) => void;
}

export const VocalLibrary: React.FC<VocalLibraryProps> = ({ onVoiceSelect }) => {
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [previewText, setPreviewText] = useState('Hello, this is a preview of the voice.');

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (kingpin.isElevenLabsAvailable()) {
        const availableVoices = await kingpin.getAvailableVoices();
        setVoices(availableVoices);
      } else {
        setError('ElevenLabs service is not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load voices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId);
    onVoiceSelect?.(voiceId);
  };

  const handlePreview = async (voiceId: string) => {
    try {
      const audioBuffer = await kingpin.generateVocalAudio(previewText, voiceId);
      const audioContext = new AudioContext();
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (err) {
      console.error('Preview failed:', err);
      setError('Preview failed');
    }
  };

  const handleDelete = async (voiceId: string) => {
    if (!confirm('Are you sure you want to delete this voice?')) return; // TODO: replace confirm with Dialog

    try {
      // Note: ElevenLabs service needs delete method implementation
      // await kingpin.deleteVoice(voiceId);
      await loadVoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete voice');
    }
  };

  const categorizeVoices = () => {
    const categories: Record<string, any[]> = {
      Preset: [],
      Custom: [],
    };

    voices.forEach((voice) => {
      if (voice.category === 'cloned' || voice.labels?.custom) {
        categories['Custom'].push(voice);
      } else {
        categories['Preset'].push(voice);
      }
    });

    return categories;
  };

  const categories = categorizeVoices();

  return (
    <div
      className="vocal-library"
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
        KINGPIN VOCAL LIBRARY
      </h2>

      {/* Preview Text Input */}
      <div style={{ marginBottom: '20px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Preview Text
        </label>
        <input
          type="text"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder="Enter text for voice preview..."
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#181410',
            border: '1px solid #F5A800',
            color: '#C9C9D4',
            borderRadius: '4px',
            fontSize: '14px',
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

      {/* Loading State */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔮</div>
          <div style={{ fontSize: '14px', color: '#C9C9D4' }}>Loading voices...</div>
        </div>
      ) : (
        <>
          {/* Preset Voices */}
          {categories['Preset'].length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3
                style={{
                  fontSize: '18px',
                  marginBottom: '16px',
                  color: '#F5A800',
                  fontFamily: 'Bebas Neue, sans-serif',
                }}
              >
                PRESET VOICES ({categories['Preset'].length})
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {categories['Preset'].map((voice) => (
                  <VoiceCard
                    key={voice.voice_id}
                    voice={voice}
                    isSelected={selectedVoice === voice.voice_id}
                    onSelect={() => handleVoiceSelect(voice.voice_id)}
                    onPreview={() => handlePreview(voice.voice_id)}
                    onDelete={undefined} // Cannot delete preset voices
                  />
                ))}
              </div>
            </div>
          )}

          {/* Custom Voices */}
          {categories['Custom'].length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: '18px',
                  marginBottom: '16px',
                  color: '#2AFFA3',
                  fontFamily: 'Bebas Neue, sans-serif',
                }}
              >
                CUSTOM VOICES ({categories['Custom'].length})
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {categories['Custom'].map((voice) => (
                  <VoiceCard
                    key={voice.voice_id}
                    voice={voice}
                    isSelected={selectedVoice === voice.voice_id}
                    onSelect={() => handleVoiceSelect(voice.voice_id)}
                    onPreview={() => handlePreview(voice.voice_id)}
                    onDelete={() => handleDelete(voice.voice_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {voices.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#181410',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎤</div>
              <div style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 'bold' }}>
                No voices available
              </div>
              <div style={{ fontSize: '14px', color: '#C9C9D4' }}>
                Create custom voices using the Voice Cloning Wizard
              </div>
            </div>
          )}
        </>
      )}

      {/* Refresh Button */}
      <button
        onClick={loadVoices}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '14px',
          marginTop: '20px',
          backgroundColor: '#181410',
          color: '#F5A800',
          border: '1px solid #F5A800',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontFamily: 'Bebas Neue, sans-serif',
          letterSpacing: '2px',
        }}
      >
        REFRESH LIBRARY
      </button>
    </div>
  );
};

interface VoiceCardProps {
  voice: any;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onDelete?: () => void;
}

const VoiceCard: React.FC<VoiceCardProps> = ({
  voice,
  isSelected,
  onSelect,
  onPreview,
  onDelete,
}) => {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: isSelected ? '#1A1208' : '#181410',
        border: `2px solid ${isSelected ? '#F5A800' : '#181410'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onClick={onSelect}
    >
      <div style={{ marginBottom: '12px' }}>
        <h4
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '4px',
            color: '#C9C9D4',
          }}
        >
          {voice.name}
        </h4>
        {voice.description && (
          <p
            style={{
              fontSize: '12px',
              color: '#C9C9D4',
              opacity: 0.7,
            }}
          >
            {voice.description}
          </p>
        )}
      </div>

      {voice.labels && Object.keys(voice.labels).length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            marginBottom: '12px',
          }}
        >
          {Object.entries(voice.labels).map(([key, value]) => (
            <span
              key={key}
              style={{
                padding: '4px 8px',
                backgroundColor: '#1A1208',
                borderRadius: '4px',
                fontSize: '10px',
                color: '#F5A800',
              }}
            >
              {key}: {value as string}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#2AFFA3',
            color: '#0D0D0D',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          PREVIEW
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              padding: '10px 16px',
              backgroundColor: '#FF3C00',
              color: '#0D0D0D',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            DELETE
          </button>
        )}
      </div>
    </div>
  );
};
