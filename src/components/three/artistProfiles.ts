import { ArtistProfile } from '../../types';

export type StudioRoomId = 'control_room' | 'vocal_booth' | 'mastering_chamber' | 'oracle_sphere';

export interface StudioRoomConfig {
  id: StudioRoomId;
  name: string;
  shortName: string;
  subtitle: string;
  description: string;
  accentColor: string;
  ambientHex: number;
  fogColorHex: number;
  fogDensity: number;
  featuredAgent: 'emar' | 'ricky' | 'kingpin' | 'all';
}

export interface AgentQuickAction {
  id: string;
  label: string;
  description: string;
  targetState: 'THINKING' | 'MIXING' | 'MASTERING' | 'SINGING' | 'RECORDING' | 'CELEBRATING';
  feedbackMessage: string;
}

export interface EnhancedArtistProfile extends ArtistProfile {
  title: string;
  frequencyDomain:
    | 'Sub & Percussion (20–250 Hz)'
    | 'Vocals & Harmonics (300–5 kHz)'
    | 'Master & Spectrum (5–20 kHz)';
  signatureElement: string;
  quickActions: AgentQuickAction[];
}

export const STUDIO_ROOMS: Record<StudioRoomId, StudioRoomConfig> = {
  control_room: {
    id: 'control_room',
    name: 'Lagos Kalakuta Acoustic Studio — Control Room',
    shortName: 'Control Room',
    subtitle: 'Warm Acoustic Walnut & High-End Console',
    description:
      'The central acoustic hub featuring organic diffuser slats, active studio monitors, and the main mixing desk.',
    accentColor: '#F5A800',
    ambientHex: 0x1a1208,
    fogColorHex: 0x0d0d0d,
    fogDensity: 0.035,
    featuredAgent: 'ricky',
  },
  vocal_booth: {
    id: 'vocal_booth',
    name: 'Vocal Booth — Isolation Chamber',
    shortName: 'Vocal Booth',
    subtitle: 'Pyramid Foam Baffles & Vintage Tube Mic',
    description:
      'A dedicated dead-room isolation booth with acoustic foam baffles and vintage tube condenser microphone array.',
    accentColor: '#FF3C00',
    ambientHex: 0x180b06,
    fogColorHex: 0x0c0604,
    fogDensity: 0.045,
    featuredAgent: 'kingpin',
  },
  mastering_chamber: {
    id: 'mastering_chamber',
    name: 'Mastering Chamber — Gold Bus Suite',
    shortName: 'Mastering Suite',
    subtitle: 'Precision Dark Slate & High-Voltage Hardware',
    description:
      'A clinical DSP calibration chamber with linear-phase meters, analog rack enclosures, and precision laser grids.',
    accentColor: '#2AFFA3',
    ambientHex: 0x061410,
    fogColorHex: 0x040e0b,
    fogDensity: 0.038,
    featuredAgent: 'emar',
  },
  oracle_sphere: {
    id: 'oracle_sphere',
    name: 'Oracle Sphere — Council Field',
    shortName: 'Oracle Sphere',
    subtitle: 'Celestial Dais & Tri-Agent Monolith',
    description:
      'An ethereal Afro-futuristic cosmic nexus where the Three Wise Men commune around the shared harmonic core.',
    accentColor: '#F5A800',
    ambientHex: 0x140d1a,
    fogColorHex: 0x0d0614,
    fogDensity: 0.025,
    featuredAgent: 'all',
  },
};

export const artistProfiles: EnhancedArtistProfile[] = [
  {
    id: 'emar',
    name: 'Kappachino Emar',
    title: 'The Scientist',
    role: 'Audio Engineering & DSP Physics',
    tagline: 'Understand the sound. Control the system.',
    accentColor: '#2AFFA3',
    voiceStyle: 'Precise, analytical, technical — music as physics, DSP, and acoustics.',
    avatarModel: 'emar_rig_v2',
    currentState: 'THINKING',
    acousticFingerprint:
      'Scientist Mint presence, 2–5 kHz diagnostic clarity, linear-phase low end',
    avatarMeshColor: '#2AFFA3',
    frequencyDomain: 'Master & Spectrum (5–20 kHz)',
    signatureElement: 'Holographic Dual Diagnostic Rings & Cyan Prism Core',
    quickActions: [
      {
        id: 'emar_spectral_scan',
        label: 'Spectral Alignment Scan',
        description: 'Analyze phase coherence and 3D frequency masking across master bus.',
        targetState: 'THINKING',
        feedbackMessage: 'Emar is analyzing acoustic phase alignment across the master bus.',
      },
      {
        id: 'emar_dsp_polish',
        label: 'Dynamic Linear-Phase EQ',
        description: 'Engage surgical mid/side carving and sub-bass resonance damping.',
        targetState: 'MASTERING',
        feedbackMessage: 'Emar calibrated precision linear-phase curves with +1.8 dB air headroom.',
      },
      {
        id: 'emar_calibrate_room',
        label: 'Acoustic Room Tuning',
        description:
          'Optimize stereo spatial dispersion and early reflections for the active chamber.',
        targetState: 'CELEBRATING',
        feedbackMessage: 'Emar locked in optimal room boundary acoustics and stereo imaging.',
      },
    ],
  },
  {
    id: 'ricky',
    name: 'Kappachino Ricky',
    title: 'The Sound God',
    role: 'Drum Architecture & 808 Groove',
    tagline: 'Find the sound. Build the bounce.',
    accentColor: '#F5A800',
    voiceStyle: 'Bold, musical, instinctive — drums, 808, groove, and Afrofusion body.',
    avatarModel: 'ricky_rig_v2',
    currentState: 'MIXING',
    acousticFingerprint: 'Sub-bass 55 Hz tight punch, log-drum body, crisp transients',
    avatarMeshColor: '#F5A800',
    frequencyDomain: 'Sub & Percussion (20–250 Hz)',
    signatureElement: 'Solar Gold Crown & 808 Sub-Bass Resonator Core',
    quickActions: [
      {
        id: 'ricky_log_drum_punch',
        label: 'Amapiano Log Drum Pulse',
        description: 'Inject punchy dual-pitched log drum slide with dynamic transient snap.',
        targetState: 'MIXING',
        feedbackMessage: 'Ricky dialed in a resonant 3WM log-drum bounce with tight low-end snap.',
      },
      {
        id: 'ricky_808_saturate',
        label: 'Analog 808 Drive',
        description: 'Warm the sub frequencies through vintage tube saturation and tape glue.',
        targetState: 'RECORDING',
        feedbackMessage: 'Ricky engaged 55 Hz analog harmonic drive with zero sub-bass mud.',
      },
      {
        id: 'ricky_afro_groove',
        label: 'Lagos Pocket Swing',
        description: 'Apply 58% Afrofusion swing quantization to percussive shaker and conga grid.',
        targetState: 'CELEBRATING',
        feedbackMessage: 'Ricky synchronized percussion pocket swing to Lagos studio tempo.',
      },
    ],
  },
  {
    id: 'kingpin',
    name: 'Kingpin',
    title: 'The Vocal Oracle',
    role: 'Vocal Arrangement & Choir Harmonies',
    tagline: 'Give the voice a body. Give the body a soul.',
    accentColor: '#FF3C00',
    voiceStyle: 'Charismatic, emotional, performance-oriented — vocal as orchestra.',
    avatarModel: 'kingpin_rig_v2',
    currentState: 'SINGING',
    acousticFingerprint: 'Vocal presence 3.2 kHz, wide stereo doubles, analog tape warmth',
    avatarMeshColor: '#FF3C00',
    frequencyDomain: 'Vocals & Harmonics (300–5 kHz)',
    signatureElement: 'Flame Crown & Floating Harmonic Wave Array',
    quickActions: [
      {
        id: 'kingpin_vocal_stack',
        label: 'Choir Harmony Stack',
        description:
          'Synthesize 4-part Afro-gospel vocal harmonies with pitch-tracked formant widening.',
        targetState: 'SINGING',
        feedbackMessage: 'Kingpin stacked a lush 4-part choir layer with stereo wide formants.',
      },
      {
        id: 'kingpin_tape_warmth',
        label: 'Vintage Tube Warmth',
        description:
          'Route lead vocals through Kingpin’s vintage optical compressor and valve pre.',
        targetState: 'RECORDING',
        feedbackMessage:
          'Kingpin saturated the vocal lead with silky 3.2 kHz presence and tape glue.',
      },
      {
        id: 'kingpin_adlib_spread',
        label: 'Spacial Ad-Lib Echo',
        description: 'Generate ping-pong stereo spatial delay with tape flutter and modulation.',
        targetState: 'CELEBRATING',
        feedbackMessage: 'Kingpin opened wide spatial ad-lib echoes across the stereo spectrum.',
      },
    ],
  },
];

export const AVATAR_STATE_OPTIONS = [
  'IDLE',
  'LISTENING',
  'RECORDING',
  'SINGING',
  'THINKING',
  'MIXING',
  'MASTERING',
  'CELEBRATING',
] as const;
