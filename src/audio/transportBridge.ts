// 3WM SONIK — Master Transport Event-Bridge & Clock Synchronizer
// Provides bidirectional real-time synchronization between RecordingView, BeatLabView, and SonicAudioEngine.

import { StepSequencerChannel, MidiPattern } from '../types';

export type TransportEventType =
  | 'PLAY_STATE_CHANGE'
  | 'RECORD_STATE_CHANGE'
  | 'STEP_TICK'
  | 'BPM_CHANGE'
  | 'METRONOME_CHANGE'
  | 'CHANNELS_SYNC'
  | 'PATTERNS_SYNC'
  | 'COUNT_IN_TICK'
  | 'TAKE_ADDED'
  | 'DIRECT_MONITOR_CHANGE';

export interface TransportState {
  isPlaying: boolean;
  isRecording: boolean;
  currentStep: number; // 0 to 15 (or 63)
  bar: number; // 1-based
  beat: number; // 1-based (1-4)
  bpm: number;
  metronomeEnabled: boolean;
  countInBeat: number; // 0 = not counting in, 4..1 = counting in
  directMonitoring: boolean;
  monitorVolume: number; // 0-100
  targetStem: string;
  activeChannels: StepSequencerChannel[];
  activePatterns: MidiPattern[];
}

type EventCallback = (state: TransportState, payload?: any) => void;

class MasterTransportBridge {
  private state: TransportState = {
    isPlaying: false,
    isRecording: false,
    currentStep: 0,
    bar: 1,
    beat: 1,
    bpm: 112,
    metronomeEnabled: false,
    countInBeat: 0,
    directMonitoring: true,
    monitorVolume: 75,
    targetStem: 'Vocals',
    activeChannels: [],
    activePatterns: [],
  };

  private listeners: Map<TransportEventType, Set<EventCallback>> = new Map();

  constructor() {
    // Initialize event listener sets
    const types: TransportEventType[] = [
      'PLAY_STATE_CHANGE',
      'RECORD_STATE_CHANGE',
      'STEP_TICK',
      'BPM_CHANGE',
      'METRONOME_CHANGE',
      'CHANNELS_SYNC',
      'PATTERNS_SYNC',
      'COUNT_IN_TICK',
      'TAKE_ADDED',
      'DIRECT_MONITOR_CHANGE',
    ];
    types.forEach((t) => this.listeners.set(t, new Set()));
  }

  public getState(): TransportState {
    return { ...this.state };
  }

  public subscribe(eventType: TransportEventType, callback: EventCallback): () => void {
    const set = this.listeners.get(eventType);
    if (set) {
      set.add(callback);
    }
    return () => {
      set?.delete(callback);
    };
  }

  private emit(eventType: TransportEventType, payload?: any) {
    const set = this.listeners.get(eventType);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(this.getState(), payload);
        } catch (err) {
          console.error(`[TransportBridge] Error in listener for ${eventType}:`, err);
        }
      });
    }
  }

  // --- Transport Actions ---

  public setPlayState(isPlaying: boolean) {
    if (this.state.isPlaying !== isPlaying) {
      this.state.isPlaying = isPlaying;
      if (!isPlaying) {
        this.state.currentStep = 0;
        this.state.bar = 1;
        this.state.beat = 1;
      }
      this.emit('PLAY_STATE_CHANGE', { isPlaying });
    }
  }

  public setRecordState(isRecording: boolean) {
    if (this.state.isRecording !== isRecording) {
      this.state.isRecording = isRecording;
      this.emit('RECORD_STATE_CHANGE', { isRecording });
    }
  }

  public stepTick(step: number, bar: number, beat: number) {
    this.state.currentStep = step;
    this.state.bar = bar;
    this.state.beat = beat;
    this.emit('STEP_TICK', { step, bar, beat });
  }

  public setBpm(bpm: number) {
    const clamped = Math.max(40, Math.min(240, bpm));
    if (this.state.bpm !== clamped) {
      this.state.bpm = clamped;
      this.emit('BPM_CHANGE', { bpm: clamped });
    }
  }

  public setMetronome(enabled: boolean) {
    this.state.metronomeEnabled = enabled;
    this.emit('METRONOME_CHANGE', { enabled });
  }

  public setCountInBeat(beat: number) {
    this.state.countInBeat = beat;
    this.emit('COUNT_IN_TICK', { countInBeat: beat });
  }

  public setDirectMonitoring(enabled: boolean, volume?: number) {
    this.state.directMonitoring = enabled;
    if (volume !== undefined) {
      this.state.monitorVolume = volume;
    }
    this.emit('DIRECT_MONITOR_CHANGE', {
      enabled: this.state.directMonitoring,
      volume: this.state.monitorVolume,
    });
  }

  public setTargetStem(stem: string) {
    this.state.targetStem = stem;
  }

  public syncChannels(channels: StepSequencerChannel[]) {
    this.state.activeChannels = [...channels];
    this.emit('CHANNELS_SYNC', { channels: this.state.activeChannels });
  }

  public syncPatterns(patterns: MidiPattern[]) {
    this.state.activePatterns = [...patterns];
    this.emit('PATTERNS_SYNC', { patterns: this.state.activePatterns });
  }

  public notifyTakeAdded(take: any) {
    this.emit('TAKE_ADDED', { take });
  }
}

export const transportBridge = new MasterTransportBridge();
