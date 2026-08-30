/**
 * 3WM SONIK — Social Teaser Video Composition (Remotion)
 * Generates 9:16 social media videos with audio-reactive visuals
 */

import {
  Composition,
  AbsoluteFill,
  Sequence,
  Audio,
  useCurrentFrame,
  interpolate,
  spring,
} from 'remotion';
import { useAudioData } from '@remotion/media-utils';
import { z } from 'zod';

// Theme configurations
const themes = {
  lagos_fire: {
    primary: '#FF3C00',
    secondary: '#F5A800',
    accent: '#181410',
    background: '#0D0D0D',
  },
  scientist_neon: {
    primary: '#2AFFA3',
    secondary: '#00D4FF',
    accent: '#0D1F0D',
    background: '#050A05',
  },
  oracle_gold: {
    primary: '#FF3C00',
    secondary: '#FFD700',
    accent: '#1A0A00',
    background: '#0D0500',
  },
};

// Agent reactions
const agentReactions = {
  ricky: [
    'That bounce is fire! 🔥',
    '808s hitting different today',
    'This groove is unstoppable',
    'Pure Lagos energy right here',
  ],
  emar: [
    'Spectral analysis complete',
    'Frequency response optimized',
    'Dynamic range within parameters',
    'Acoustic balance achieved',
  ],
  kingpin: [
    'The voice has found its body',
    'Soul is in the performance',
    'Emotion resonates through',
    'This is the oracle speaking',
  ],
};

// Input schema for the composition
export const socialTeaserSchema = z.object({
  audioUrl: z.string(),
  duration: z.number(),
  theme: z.enum(['lagos_fire', 'scientist_neon', 'oracle_gold']),
  agentReaction: z.enum(['ricky', 'emar', 'kingpin']),
  includeWaveform: z.boolean(),
  includeMetadata: z.boolean(),
  trackTitle: z.string().optional(),
  artist: z.string().optional(),
});

type SocialTeaserProps = z.infer<typeof socialTeaserSchema>;

// Audio visualizer component
const AudioVisualizer: React.FC<{
  audioUrl: string;
  theme: keyof typeof themes;
}> = ({ audioUrl, theme }) => {
  const frame = useCurrentFrame();
  const { audioData } = useAudioData(audioUrl);

  if (!audioData) return null;

  const themeColors = themes[theme];
  const frequencyData = audioData.frequency;

  // Calculate average frequency for the current frame
  const getAverageFrequency = () => {
    const startIndex = Math.floor(frequencyData.length * 0.1);
    const endIndex = Math.floor(frequencyData.length * 0.5);
    let sum = 0;
    for (let i = startIndex; i < endIndex; i++) {
      sum += frequencyData[i];
    }
    return sum / (endIndex - startIndex);
  };

  const averageFreq = getAverageFrequency();
  const barCount = 32;
  const barWidth = 100 / barCount;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '2px',
      }}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const freqIndex = Math.floor((i / barCount) * frequencyData.length);
        const amplitude = frequencyData[freqIndex] / 255;
        const height = interpolate(amplitude, [0, 1], [10, 100]);

        return (
          <div
            key={i}
            style={{
              width: `${barWidth}%`,
              height: `${height}%`,
              backgroundColor: themeColors.primary,
              borderRadius: '4px',
              opacity: 0.8 + amplitude * 0.2,
            }}
          />
        );
      })}
    </div>
  );
};

// Agent reaction overlay
const AgentReaction: React.FC<{
  agent: keyof typeof agentReactions;
  theme: keyof typeof themes;
}> = ({ agent, theme }) => {
  const frame = useCurrentFrame();
  const themeColors = themes[theme];
  const reactions = agentReactions[agent];
  const reactionIndex = Math.floor(frame / 90) % reactions.length;
  const reaction = reactions[reactionIndex];

  const opacity = spring({
    frame: frame % 90,
    fps: 30,
    config: { damping: 12, stiffness: 80 },
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '15%',
        left: '5%',
        right: '5%',
        textAlign: 'center',
        opacity: opacity,
      }}
    >
      <div
        style={{
          backgroundColor: themeColors.accent,
          padding: '16px 24px',
          borderRadius: '12px',
          border: `2px solid ${themeColors.primary}`,
        }}
      >
        <div
          style={{
            color: themeColors.primary,
            fontSize: '24px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          {agent.toUpperCase()}
        </div>
        <div
          style={{
            color: '#FFFFFF',
            fontSize: '18px',
            lineHeight: '1.4',
          }}
        >
          {reaction}
        </div>
      </div>
    </div>
  );
};

// Metadata overlay
const MetadataOverlay: React.FC<{
  trackTitle?: string;
  artist?: string;
  theme: keyof typeof themes;
}> = ({ trackTitle, artist, theme }) => {
  const themeColors = themes[theme];

  return (
    <div
      style={{
        position: 'absolute',
        top: '5%',
        left: '5%',
        right: '5%',
      }}
    >
      <div
        style={{
          backgroundColor: themeColors.accent,
          padding: '12px 20px',
          borderRadius: '8px',
          border: `1px solid ${themeColors.secondary}`,
        }}
      >
        <div
          style={{
            color: themeColors.secondary,
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '4px',
          }}
        >
          {trackTitle || '3WM SONIK'}
        </div>
        <div
          style={{
            color: '#FFFFFF',
            fontSize: '14px',
            opacity: 0.8,
          }}
        >
          {artist || 'THREE WISE MEN'}
        </div>
      </div>
    </div>
  );
};

// Main composition
export const SocialTeaser: React.FC<SocialTeaserProps> = ({
  audioUrl,
  duration,
  theme,
  agentReaction,
  includeWaveform,
  includeMetadata,
  trackTitle,
  artist,
}) => {
  const themeColors = themes[theme];
  const fps = 30;
  const totalFrames = duration * fps;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: themeColors.background,
      }}
    >
      <Audio src={audioUrl} />

      {/* Background gradient */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${themeColors.accent} 0%, ${themeColors.background} 70%)`,
          opacity: 0.3,
        }}
      />

      {/* Waveform visualization */}
      {includeWaveform && (
        <Sequence from={0} durationInFrames={totalFrames}>
          <AudioVisualizer audioUrl={audioUrl} theme={theme} />
        </Sequence>
      )}

      {/* Metadata overlay */}
      {includeMetadata && (
        <Sequence from={0} durationInFrames={totalFrames}>
          <MetadataOverlay trackTitle={trackTitle} artist={artist} theme={theme} />
        </Sequence>
      )}

      {/* Agent reaction */}
      <Sequence from={30} durationInFrames={totalFrames - 30}>
        <AgentReaction agent={agentReaction} theme={theme} />
      </Sequence>

      {/* 3WM Logo */}
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          right: '5%',
          color: themeColors.secondary,
          fontSize: '14px',
          fontWeight: 'bold',
          opacity: 0.6,
        }}
      >
        🔱 3WM SONIK
      </div>
    </AbsoluteFill>
  );
};

// Root composition for Remotion
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SocialTeaser"
        component={SocialTeaser}
        durationInFrames={900} // 30 seconds at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          audioUrl: '',
          duration: 30,
          theme: 'lagos_fire',
          agentReaction: 'ricky',
          includeWaveform: true,
          includeMetadata: true,
          trackTitle: '3WM SONIK',
          artist: 'THREE WISE MEN',
        }}
      />
    </>
  );
};
