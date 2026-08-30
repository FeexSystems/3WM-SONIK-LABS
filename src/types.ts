// 3WM SONIK — Master Domain Models & Type System (Version 2.2 — PRODUCER ENGINE)

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'PRODUCER' | 'ENGINEER' | 'ARTIST' | 'VIEWER';
export type SaaSPlan = 'FREE' | 'CREATOR' | 'PRO' | 'STUDIO';
export type StudioThemeMode =
  'dark' | 'midnight' | 'studio-light' | 'light' | 'studio-night' | 'midnight-light';
export type ThemeMode =
  'dark' | 'midnight' | 'studio-light' | 'light' | 'studio-night' | 'midnight-light';

export interface WorkspaceMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: WorkspaceRole;
  joinedAt: string;
  isOnline?: boolean;
  activeLocation?: string;
}

export interface WorkspaceUsage {
  aiActionsUsed: number;
  aiActionsLimit: number;
  masterExportsUsed: number;
  masterExportsLimit: number;
  storageUsedGb: number;
  storageLimitGb: number;
}

export interface Workspace {
  id: string;
  name: string;
  slug?: string;
  avatarUrl?: string;
  ownerId?: string;
  plan: SaaSPlan;
  members?: WorkspaceMember[];
  membersCount?: number;
  usage: WorkspaceUsage;
  createdAt?: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// MIDI & Musical Event Models
// -------------------------------------------------------------

export interface MidiNote {
  id: string;
  pitch: number; // MIDI note number 0-127 (e.g. 60 = C4)
  startStep: number; // Step or beat offset in 16th notes (0, 1, 2... 15 for a 1-bar pattern)
  durationSteps: number; // Length in steps (e.g. 1 = 16th, 4 = quarter note)
  velocity: number; // 0 to 127
  probability: number; // 0 to 1 (1.0 = 100% chance)
  channel: number; // 0 to 15
  pan?: number; // -1.0 to 1.0
  microTimingOffset?: number; // -0.5 to +0.5 fraction of a step for humanization
}

export interface MidiPattern {
  id: string;
  name: string;
  channelId?: string;
  instrumentType:
    | 'synth_lead'
    | 'synth_pad'
    | 'afro_bass'
    | 'log_drum'
    | 'horns'
    | 'drums'
    | 'marimba'
    | 'kora'
    | 'rhodes'
    | string;
  lengthSteps: number; // Usually 16 (1 bar) or 32 (2 bars)
  notes: MidiNote[];
  color?: string;
  isMuted?: boolean;
}

export interface StepSequencerStep {
  enabled: boolean;
  velocity: number; // 0-127
  probability: number; // 0-1
  offset: number; // -0.5 to 0.5
  accent: boolean;
  pitch?: number; // Custom MIDI pitch for 808 notes (e.g. 36 = C1, 41 = F1, 44 = G#1)
  noteName?: string; // e.g. "F1", "C2", "G#1"
  slide?: boolean; // Pitch portamento slide for Drill & Trap 808s
  ratchet?: 1 | 2 | 3 | 4 | 6 | 8; // Ratchet roll multiplier
}

export interface StepSequencerChannel {
  id: string;
  name: string;
  sampleKey:
    | 'kick'
    | 'snare'
    | 'clap'
    | 'closed_hat'
    | 'open_hat'
    | 'percussion'
    | 'shaker'
    | 'conga'
    | 'talking_drum'
    | 'tom'
    | 'fx'
    | 'log_drum'
    | 'sub_808'
    | 'sonik_808'
    | '808'
    | string;
  pitch: number; // Root MIDI note (e.g. 36 for kick)
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  muted: boolean;
  solo: boolean;
  steps: StepSequencerStep[];
  is808Channel?: boolean;
  eight08Params?: Partial<Eight08Parameters>;
}

export interface SequencerLoopPreset {
  id: string;
  name: string;
  category: 'TRAP' | 'DRILL' | 'AFROFUSION' | 'AMAPIANO' | 'PHONK' | 'BOOM BAP' | 'RNB';
  bpm: number;
  key: string;
  description: string;
  eight08PresetId?: string;
  channels: StepSequencerChannel[];
}

export interface GrooveTemplate {
  id: string;
  name: string;
  genre: 'Afrofusion' | 'Amapiano' | 'Afrobeats' | 'Highlife' | 'Jùjú' | 'Straight' | string;
  swing: number; // 0 to 1
  humanizeTiming: number; // 0 to 1
  humanizeVelocity: number; // 0 to 1
  polyrhythmFactor: number;
  description: string;
}

export interface ScaleDefinition {
  name: string;
  intervals: number[]; // e.g. Major: [0, 2, 4, 5, 7, 9, 11]
}

export interface ChordProgressionSuggestion {
  name: string;
  numeral: string; // e.g. "i - VII - VI - V"
  chords: { root: string; type: string; notes: number[] }[];
  style: string;
}

// -------------------------------------------------------------
// Track & Project State Architecture
// -------------------------------------------------------------

export type TrackType = 'audio' | 'midi' | 'instrument' | 'bus';
export type ProjectStatus =
  | 'DRAFT'
  | 'RECORDING'
  | 'PRODUCTION'
  | 'MIXING'
  | 'MASTERING'
  | 'COMPLETE'
  | 'ARCHIVED'
  | 'raw'
  | 'analyzing'
  | 'mastered';
export type ProjectStage =
  'DRAFT' | 'RECORDING' | 'PRODUCTION' | 'MIXING' | 'MASTERING' | 'COMPLETE';

export interface StemTrack {
  id: string;
  name:
    'Vocals' | 'Drums & Percussion' | 'Bassline' | 'Instruments & Horns' | 'FX & Synths' | string;
  type?: TrackType;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  muted: boolean;
  solo: boolean;
  armed?: boolean;
  color: string;
  waveformSeed: number;
  audioBlobUrl?: string;
  isCustomTake?: boolean;
  archived?: boolean;
  archivedAt?: string;
  midiPattern?: MidiPattern;
}

export interface RecordedTake {
  id: string;
  stemId: string;
  takeNumber: number;
  durationMs: number;
  blobUrl: string;
  createdAt: string;
  label: string;
  isActive: boolean;
  audioBuffer?: AudioBuffer;
  sampleRate?: number;
  bitDepth?: number;
  channels?: number;
  fileSize?: number;
  format?: 'wav' | 'mp3' | 'flac' | 'aiff';
  notes?: string;
  rating?: number; // 1-5 stars
  isSelected?: boolean; // For comping
  isSelectedForComping?: boolean;
  punchInPoint?: number; // in milliseconds
  punchOutPoint?: number; // in milliseconds
  crossfadeIn?: number; // in milliseconds
  crossfadeOut?: number; // in milliseconds
  isCustomTake?: boolean;
}

export interface RecordingConfiguration {
  sampleRate: 44100 | 48000 | 96000 | 192000;
  bitDepth: 16 | 24 | 32;
  channels: 1 | 2;
  format: 'wav' | 'flac' | 'aiff';
  bufferSize: 256 | 512 | 1024 | 2048 | 4096 | 8192;
  monitoringMode: 'direct' | 'latency-compensated' | 'software';
  inputDevice?: string;
  inputChannels?: number;
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // in seconds
}

export interface PunchConfiguration {
  enabled: boolean;
  mode: 'manual' | 'auto';
  preRoll: number; // in milliseconds
  postRoll: number; // in milliseconds
  crossfadeDuration: number; // in milliseconds
  autoPunchRegion?: {
    start: number; // in milliseconds
    end: number; // in milliseconds
  };
}

export interface TrackRecordingState {
  isArmed: boolean;
  isRecording: boolean;
  monitoringEnabled: boolean;
  inputDevice?: string;
  inputChannel?: number;
  gain: number; // pre-fader input gain
  latencyCompensation: number; // in samples
}

export interface AudioRegion {
  id: string;
  trackId: string;
  takeId: string;
  startOffset: number; // in milliseconds
  duration: number; // in milliseconds
  startTime: number; // in milliseconds from project start
  isSelected: boolean;
  isMuted: boolean;
  gain: number;
  fadeIn: number; // in milliseconds
  fadeOut: number; // in milliseconds
  crossfadeRegions?: {
    regionId: string;
    duration: number;
    curve: 'linear' | 'equal-power' | 'exponential';
  }[];
}

export interface WaveformDisplayData {
  regionId: string;
  peaks: number[]; // peak values for display
  rms: number[]; // RMS values for display
  resolution: number; // samples per peak
  sampleRate: number;
  channels: number;
}

export interface TrackSettings {
  volume: number;
  pan: number;
  saturation?: number;
  eq: {
    low: number; // -12 to +12 dB
    mid: number;
    high: number;
  };
  compression: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
    makeupGain: number;
  };
  reverb: {
    type: 'shrine' | 'lagos_hall' | 'studio_plate' | 'warm_room' | string;
    amount: number;
    decay: number;
  };
  mastering: {
    preset: 'Afrofusion Warmth' | 'Radio Ready' | 'Lagos Bounce' | 'Shrine Gold' | 'None' | string;
    limiterCeiling: number;
    targetLufs: number;
    warmthSaturation: number;
    stereoWidth: number;
  };
}

export interface AudioAnalysis {
  duration?: number;
  bpm?: number;
  dynamics?: {
    range: number;
    rms: number;
    peak: number;
    lufs: number;
  };
  loudness?: {
    lufs: number;
    rms: number;
    peak: number;
    truePeak: number;
    dynamicRange: number;
  };
  frequencies: {
    subBass: number;
    bass: number;
    lowMids: number;
    mids: number;
    highMids: number;
    treble: number;
    air: number;
  };
  stereoWidth?: number;
  phaseCorrelation?: number;
  clippingCount?: number;
  silenceSections?: number;
  afrobeatGrooveIndex: number;
  harmonicWarmthScore: number;
  suggestions?: string[];
  warnings?: string[];
  recommendations?: string[];
  agentInsights: {
    bushBot: string;
    grok: string;
    perplexity: string;
    openAi?: string;
  };
}

export interface ProcessingEvent {
  id: string;
  timestamp: string;
  agent:
    | 'BushBot'
    | 'Grok Audio'
    | 'Perplexity'
    | 'OpenAI Sonic'
    | 'Ozone 11'
    | 'T-RackS'
    | 'n8n AutoFlow'
    | 'Engineer'
    | 'SONIK Orchestrator'
    | string;
  action: string;
  details: string;
  versionSnapshot?: string;
}

export interface ArrangementSection {
  id: string;
  name:
    | 'Intro'
    | 'Verse 1'
    | 'Pre-Hook'
    | 'Chorus'
    | 'Verse 2'
    | 'Bridge'
    | 'Chorus 2'
    | 'Outro'
    | string;
  startBar: number;
  lengthBars: number;
  color: string;
  energyLevel: number; // 1 to 10
  activeStems: string[]; // IDs of stems active in this section
}

export interface ProjectVersion {
  id: string;
  versionNumber: number;
  label: string;
  stage: 'BEAT' | 'MIX' | 'MASTER' | 'RECORDING' | 'ARRANGEMENT';
  createdAt: string;
  createdBy: string;
  settingsSnapshot: TrackSettings;
  stemsSnapshot?: StemTrack[];
  midiPatternsSnapshot?: MidiPattern[];
  stepChannelsSnapshot?: StepSequencerChannel[];
  lufs: number;
  audioBlobUrl?: string;
  description?: string;
  isAutosave?: boolean;
}

export interface TimelineComment {
  id: string;
  projectId?: string;
  trackId?: string;
  timestampMs?: number;
  timestampSeconds?: number;
  author?: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  role?: string;
  content?: string;
  text?: string;
  resolved: boolean;
  createdAt: string;
}

export interface Track {
  id: string;
  workspaceId?: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  key: string;
  duration: number;
  createdAt: string;
  updatedAt?: string;
  status: ProjectStatus;
  stage?: ProjectStage;
  version?: number;
  coverArt?: string;
  album?: string;
  audioUrl?: string;
  settings: TrackSettings;
  analysis?: AudioAnalysis;
  stems: StemTrack[];
  midiPatterns?: MidiPattern[];
  stepChannels?: StepSequencerChannel[];
  arrangement?: ArrangementSection[];
  takes?: RecordedTake[];
  versions?: ProjectVersion[];
  comments?: TimelineComment[];
  history: ProcessingEvent[];
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

// -------------------------------------------------------------
// Auto-Save & Recovery State
// -------------------------------------------------------------

export type AutoSaveStatus = 'saved' | 'saving' | 'dirty' | 'error' | 'syncing';

export interface AutoSaveState {
  status: AutoSaveStatus;
  lastSavedAt: string | null;
  errorMessage?: string;
  pendingChangesCount: number;
}

// -------------------------------------------------------------
// Server Render & Export Models
// -------------------------------------------------------------

export type RenderJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface RenderJob {
  id: string;
  projectId: string;
  trackTitle: string;
  versionId?: string;
  status: RenderJobStatus;
  format: 'wav' | 'flac' | 'mp3';
  sampleRate: 44100 | 48000 | 96000;
  bitDepth: 16 | 24 | 32;
  includeStems: boolean;
  masterPreset: string;
  progressPercent: number;
  outputUrl?: string;
  stemUrls?: { stemName: string; url: string }[];
  fileSizeMb?: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  idempotencyKey?: string;
}

export interface ExportQuotaEstimate {
  estimatedUnits: number;
  remainingUnits: number;
  canExport: boolean;
  planLimit: number;
  format: string;
  sampleRate: number;
  bitDepth: number;
  costDescription: string;
}

// -------------------------------------------------------------
// AI Producer & Orchestration Models
// -------------------------------------------------------------

export type AIAgentId =
  | 'bushbot'
  | 'grok'
  | 'perplexity'
  | 'openai'
  | 'sonik_orchestrator'
  | 'ai_drummer'
  | 'ai_bassist'
  | 'ai_keys'
  | 'ai_melody'
  | 'ai_arranger';

export interface AIAgent {
  id: AIAgentId;
  name: string;
  title: string;
  avatar: string;
  persona: string;
  accentColor: string;
  skills: string[];
  examplePrompts: string[];
}

export interface AiProducerRequest {
  target: 'drums' | 'bass' | 'chords' | 'melody' | 'arrangement' | 'full_beat';
  prompt?: string;
  style:
    | 'Afrofusion'
    | 'Amapiano'
    | 'Afrobeats'
    | 'Highlife'
    | 'Jùjú'
    | 'Afro-Drill'
    | 'Afro-Soul'
    | string;
  bpm: number;
  key: string;
  scale: string;
  energyLevel: number; // 1 to 10
  complexity: number; // 1 to 10
  seed?: number;
  referencePattern?: MidiPattern;
}

export interface AiGenerationRecord {
  generationId: string;
  target: string;
  prompt: string;
  model: string;
  seed: number;
  tempo: number;
  key: string;
  style: string;
  outputPattern: MidiPattern | StepSequencerChannel[];
  createdAt: string;
}

export interface AiCommandResult {
  action: string;
  status: 'validated' | 'executed' | 'rejected';
  confidenceScore: number;
  reasoning: string;
  dryRun: boolean;
  executablePayload: Partial<TrackSettings>;
}

export interface MasteringProfile {
  id: string;
  name: string;
  presetName: string;
  engine: string;
  targetLufs: number;
  truePeak: number;
  dynamicRange: number;
  frequencyBalance: { low: number; mid: number; high: number };
  stereoWidth: number;
  harmonicWarmth: number;
  ceiling: number;
  description: string;
}

export interface VectorEmbeddingItem {
  id: string;
  style: string;
  era: string;
  acousticVector: number[];
  referenceTracks: string[];
  signatureTraits: string[];
  provenance?: {
    source: string;
    projectId?: string;
    timestamp: string;
    confidence: number;
  };
}

export interface N8nWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  lastRun?: string;
  steps: string[];
}

export type AvatarState =
  | 'IDLE'
  | 'LISTENING'
  | 'RECORDING'
  | 'SINGING'
  | 'THINKING'
  | 'MIXING'
  | 'MASTERING'
  | 'CELEBRATING'
  | 'WARNING'
  | 'ERROR';

export interface ArtistProfile {
  id: string;
  name: 'Kappachino Emar' | 'Kappachino Ricky' | 'Kingpin' | string;
  role: string;
  tagline: string;
  accentColor: string;
  voiceStyle: string;
  avatarModel: string;
  currentState: AvatarState;
  acousticFingerprint: string;
  avatarMeshColor: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  avatarUrl?: string;
  role: 'Artist' | 'Producer' | 'Engineer' | 'Studio' | 'Label';
  favoriteGenres: string[];
  workflowFocus: string[];
  aiRelationship: string;
  onboardingCompleted: boolean;
  themePreference?: ThemeMode;
}

// -------------------------------------------------------------
// 3WM PLUGIN ARCHITECTURE & MODERN URBAN PRO SYSTEM (v1.0)
// -------------------------------------------------------------

export type PluginCategory =
  'INSTRUMENT' | 'EFFECT' | 'MIDI' | 'UTILITY' | 'ANALYZER' | 'MASTERING';

export type PluginParameterType = 'float' | 'int' | 'enum' | 'bool';

export interface PluginParameterDef {
  id: string;
  name: string;
  type: PluginParameterType;
  min: number;
  max: number;
  default: number | string | boolean;
  step?: number;
  unit?: string;
  options?: string[]; // For enum types
  curve?: 'linear' | 'exponential' | 'logarithmic';
  automatable?: boolean;
}

export interface PluginPreset {
  id: string;
  pluginId: string;
  name: string;
  category: string;
  parameters: Record<string, any>;
  version: number;
  createdBy?: string;
  createdAt?: string;
  description?: string;
}

export interface PluginDefinition {
  id: string;
  name: string;
  version: string;
  manufacturer: string;
  category: PluginCategory;
  description: string;
  iconName?: string;
  parameters: PluginParameterDef[];
  presets: PluginPreset[];
}

export interface PluginInstance {
  instanceId: string;
  pluginId: string;
  trackId?: string;
  name: string;
  bypassed: boolean;
  parameters: Record<string, any>;
  activePresetId?: string;
}

export interface PluginChain {
  trackId: string;
  instances: PluginInstance[];
}

// Specialized 808 Lab Parameters
export interface Eight08Parameters {
  mode:
    | 'DEEP'
    | 'PUNCH'
    | 'DIRTY'
    | 'DISTORTED'
    | 'SUB'
    | 'METALLIC'
    | 'GROWL'
    | 'BELL'
    | 'LONG'
    | 'SHORT';
  waveform: 'sine' | 'triangle' | 'sawtooth' | 'fm_sine' | 'sub_distort';
  glideTime: number; // 0 to 500 ms
  glideCurve: 'exponential' | 'linear';
  legato: boolean;
  punchAttack: number; // 0 to 1
  decay: number; // 0.1 to 4.0 s
  sustain: number; // 0 to 1
  release: number; // 0.01 to 2.0 s
  saturationMode: 'Soft' | 'Warm' | 'Tape' | 'Tube' | 'Hard' | 'Fold' | 'Bitcrush' | 'Destroy';
  drive: number; // 0 to 1
  subBoost: number; // 0 to 12 dB
  harmonicLevel: number; // 0 to 1
  filterCutoff: number; // 20 to 20000 Hz
  filterResonance: number; // 0 to 10
  monoRetrigger: boolean;
  scaleLock: boolean;
  rootKey: string;
  scale: string;
}

// Specialized Trap Drum Machine Parameters
export interface TrapDrumPadParameters {
  id: string;
  name: string;
  sampleKey: string;
  pitch: number; // -24 to +24 semitones
  decay: number; // 0.05 to 2.5 s
  tune: number; // semitones
  filterCutoff: number;
  filterType: 'lowpass' | 'highpass' | 'bandpass';
  volume: number;
  pan: number;
  chokeGroup?: number;
  rollMultiplier: 1 | 2 | 3 | 4 | 6 | 8;
  reverse: boolean;
  probability: number;
  swing: number;
}

// Specialized Synth Lab Parameters
export interface SynthLabParameters {
  osc1Type: 'sine' | 'sawtooth' | 'square' | 'triangle';
  osc1Octave: number; // -2, -1, 0, 1, 2
  osc1Detune: number; // -100 to 100 cents
  osc1Volume: number;
  osc2Type: 'sine' | 'sawtooth' | 'square' | 'triangle' | 'noise';
  osc2Octave: number;
  osc2Detune: number;
  osc2Volume: number;
  osc2Sync: boolean;
  unisonVoices: number; // 1 to 7
  unisonDetune: number;
  filterType: 'lowpass' | 'highpass' | 'bandpass';
  filterCutoff: number;
  filterResonance: number;
  filterEnvAmount: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  lfoRate: number; // Hz or sync fraction
  lfoDepth: number;
  lfoTarget: 'pitch' | 'cutoff' | 'pan' | 'volume';
  distortionDrive: number;
  chorusMix: number;
  delayMix: number;
  reverbMix: number;
}

// -------------------------------------------------------------
// Global History Stack (Multi-Level Undo/Redo)
// -------------------------------------------------------------
export interface HistoryEntry {
  id: string;
  timestamp: string;
  description: string;
  category: 'mixer' | 'track_edit' | 'plugins' | 'stems' | 'tempo' | 'mastering' | 'general';
  snapshot: Track;
}

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  lastAction?: string;
  undoStackDescriptions: string[];
  redoStackDescriptions: string[];
}

// -------------------------------------------------------------
// Real-Time Collaboration & Multi-User Cursor Presence
// -------------------------------------------------------------
export interface CollaboratorPresence {
  id: string;
  name: string;
  avatar: string;
  role: string;
  color: string;
  x: number; // percentage (0-100) or pixel coord
  y: number;
  activeView: string;
  activeTrackName?: string;
  currentTool: string;
  lastAction: string;
  lastActive: number;
  isTyping?: boolean;
}

// -------------------------------------------------------------
// IndexedDB Auto-Save Vault System
// -------------------------------------------------------------
export interface VaultBackupRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  savedAt: string;
  version: number;
  sizeBytes: number;
  bpm: number;
  key: string;
  stemCount: number;
  data: Track;
}

export interface VaultStats {
  recordCount: number;
  totalBytes: number;
  lastSavedAt: string | null;
  latestRecordId: string | null;
  databaseReady: boolean;
}
