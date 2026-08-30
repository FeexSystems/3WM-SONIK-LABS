/**
 * Voice Cloning Wizard
 * Multi-step wizard for creating custom vocal styles with Kingpin
 */

import React, { useState, useRef } from 'react';
import { kingpin } from '../../agents/Kingpin';

interface VoiceCloningWizardProps {
  onVoiceCreated?: (voiceId: string) => void;
}

type WizardStep = 'upload' | 'details' | 'processing' | 'complete';

export const VoiceCloningWizard: React.FC<VoiceCloningWizardProps> = ({ onVoiceCreated }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [voiceName, setVoiceName] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [audioSamples, setAudioSamples] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [createdVoiceId, setCreatedVoiceId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAudioSamples(files);
    }
  };

  const handleRemoveSample = (index: number) => {
    setAudioSamples((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    setError('');

    if (currentStep === 'upload') {
      if (audioSamples.length === 0) {
        setError('Please upload at least one audio sample');
        return;
      }
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      if (!voiceName.trim()) {
        setError('Please enter a voice name');
        return;
      }
      setCurrentStep('processing');
      handleVoiceCloning();
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep === 'details') {
      setCurrentStep('upload');
    }
  };

  const handleVoiceCloning = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const voiceId = await kingpin.createCustomVocalStyle(
        voiceName,
        voiceDescription,
        audioSamples
      );
      setCreatedVoiceId(voiceId);
      setCurrentStep('complete');
      onVoiceCreated?.(voiceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voice cloning failed');
      setCurrentStep('details');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setVoiceName('');
    setVoiceDescription('');
    setAudioSamples([]);
    setError('');
    setCreatedVoiceId('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="voice-cloning-wizard"
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
        KINGPIN VOICE CLONING
      </h2>

      {/* Progress Steps */}
      <div
        style={{
          display: 'flex',
          marginBottom: '30px',
          gap: '8px',
        }}
      >
        {(['upload', 'details', 'processing', 'complete'] as WizardStep[]).map((step, index) => (
          <div
            key={step}
            style={{
              flex: 1,
              height: '4px',
              backgroundColor:
                currentStep === step
                  ? '#F5A800'
                  : ['upload', 'details', 'processing', 'complete'].indexOf(currentStep) > index
                    ? '#2AFFA3'
                    : '#181410',
              borderRadius: '2px',
              transition: 'background-color 0.3s',
            }}
          />
        ))}
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

      {/* Step 1: Upload Audio Samples */}
      {currentStep === 'upload' && (
        <div>
          <h3
            style={{
              fontSize: '18px',
              marginBottom: '16px',
              color: '#F5A800',
              fontFamily: 'Bebas Neue, sans-serif',
            }}
          >
            STEP 1: UPLOAD AUDIO SAMPLES
          </h3>
          <p
            style={{
              marginBottom: '16px',
              fontSize: '14px',
              color: '#C9C9D4',
            }}
          >
            Upload 1-5 audio samples of the voice you want to clone. Each sample should be 10-60
            seconds of clear speech.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileSelect}
            style={{
              display: 'none',
            }}
            id="audio-upload"
          />
          <label
            htmlFor="audio-upload"
            style={{
              display: 'block',
              padding: '20px',
              backgroundColor: '#181410',
              border: '2px dashed #F5A800',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Click to upload audio files</div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: '#C9C9D4' }}>
              MP3, WAV, or other audio formats
            </div>
          </label>

          {audioSamples.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4
                style={{
                  fontSize: '14px',
                  marginBottom: '12px',
                  fontWeight: 'bold',
                }}
              >
                Uploaded Samples ({audioSamples.length})
              </h4>
              {audioSamples.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#181410',
                    borderRadius: '4px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ fontSize: '14px' }}>{file.name}</div>
                  <button
                    onClick={() => handleRemoveSample(index)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#FF3C00',
                      color: '#0D0D0D',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleNext}
            disabled={audioSamples.length === 0}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: audioSamples.length > 0 ? '#F5A800' : '#181410',
              color: audioSamples.length > 0 ? '#0D0D0D' : '#C9C9D4',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: audioSamples.length > 0 ? 'pointer' : 'not-allowed',
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: '2px',
            }}
          >
            NEXT
          </button>
        </div>
      )}

      {/* Step 2: Voice Details */}
      {currentStep === 'details' && (
        <div>
          <h3
            style={{
              fontSize: '18px',
              marginBottom: '16px',
              color: '#F5A800',
              fontFamily: 'Bebas Neue, sans-serif',
            }}
          >
            STEP 2: VOICE DETAILS
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              Voice Name *
            </label>
            <input
              type="text"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="e.g., My Custom Voice"
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

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              Description (Optional)
            </label>
            <textarea
              value={voiceDescription}
              onChange={(e) => setVoiceDescription(e.target.value)}
              placeholder="Describe the voice characteristics..."
              rows={4}
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

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#181410',
                color: '#C9C9D4',
                border: '1px solid #F5A800',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: 'Bebas Neue, sans-serif',
                letterSpacing: '2px',
              }}
            >
              BACK
            </button>
            <button
              onClick={handleNext}
              disabled={!voiceName.trim()}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: voiceName.trim() ? '#F5A800' : '#181410',
                color: voiceName.trim() ? '#0D0D0D' : '#C9C9D4',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: voiceName.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'Bebas Neue, sans-serif',
                letterSpacing: '2px',
              }}
            >
              CREATE VOICE
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Processing */}
      {currentStep === 'processing' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div
            style={{
              fontSize: '48px',
              marginBottom: '20px',
              animation: 'pulse 2s infinite',
            }}
          >
            🔮
          </div>
          <h3
            style={{
              fontSize: '18px',
              marginBottom: '12px',
              color: '#F5A800',
              fontFamily: 'Bebas Neue, sans-serif',
            }}
          >
            TRAINING YOUR VOICE
          </h3>
          <p style={{ fontSize: '14px', color: '#C9C9D4' }}>
            Kingpin is analyzing your audio samples and creating a custom vocal model...
          </p>
          <p style={{ fontSize: '12px', marginTop: '16px', color: '#C9C9D4' }}>
            This may take a few minutes.
          </p>
        </div>
      )}

      {/* Step 4: Complete */}
      {currentStep === 'complete' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div
            style={{
              fontSize: '48px',
              marginBottom: '20px',
            }}
          >
            ✨
          </div>
          <h3
            style={{
              fontSize: '18px',
              marginBottom: '12px',
              color: '#2AFFA3',
              fontFamily: 'Bebas Neue, sans-serif',
            }}
          >
            VOICE CREATED SUCCESSFULLY
          </h3>
          <p style={{ fontSize: '14px', color: '#C9C9D4', marginBottom: '20px' }}>
            Your custom voice "{voiceName}" is now available for synthesis.
          </p>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#181410',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '12px',
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            Voice ID: {createdVoiceId}
          </div>
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#F5A800',
              color: '#0D0D0D',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: '2px',
            }}
          >
            CREATE ANOTHER VOICE
          </button>
        </div>
      )}
    </div>
  );
};
