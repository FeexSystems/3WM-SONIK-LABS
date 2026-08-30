// 3WM SONIK - Professional Multitrack Recording System
// Industry-standard multitrack recording with simultaneous 24+ tracks, low-latency monitoring, and advanced take management

export interface TrackRecordingState {
  trackId: string;
  isArmed: boolean;
  isRecording: boolean;
  inputSource: string | null; // 'microphone', 'line', 'instrument', or device ID
  monitoringEnabled: boolean;
  monitoringLatency: number; // in milliseconds
  inputGain: number;
  inputPan: number;
  muteDuringRecording: boolean;
}

export interface TakeInfo {
  takeId: string;
  trackId: string;
  takeNumber: number;
  startTime: number; // Project time in seconds
  duration: number; // in seconds
  audioBuffer: AudioBuffer | null;
  blobUrl: string | null;
  createdAt: Date;
  isSelected: boolean;
  punchInPoint: number | null; // Project time
  punchOutPoint: number | null; // Project time
  crossfadeIn: number; // in milliseconds
  crossfadeOut: number; // in milliseconds
  notes: string;
  rating: number; // 1-5 stars
}

export interface PunchInSettings {
  enabled: boolean;
  preRoll: number; // in seconds
  postRoll: number; // in seconds
  mode: 'manual' | 'auto';
  autoPunchInPoint: number | null; // Project time
  autoPunchOutPoint: number | null; // Project time
}

export interface RecordingSession {
  sessionId: string;
  startTime: Date;
  tracks: Map<string, TrackRecordingState>; // trackId -> state
  takes: TakeInfo[];
  punchSettings: PunchInSettings;
  sampleRate: number;
  bitDepth: number;
}

export class MultitrackRecorder {
  private audioContext: AudioContext | null = null;
  private currentSession: RecordingSession | null = null;
  private mediaStreams: Map<string, MediaStream> = new Map();
  private mediaRecorders: Map<string, MediaRecorder> = new Map();
  private recordingNodes: Map<
    string,
    {
      inputNode: MediaStreamAudioSourceNode;
      monitorGain: GainNode;
      directGain: GainNode;
    }
  > = new Map();
  private recordedChunks: Map<string, Blob[]> = new Map();

  // Monitoring configuration
  private monitoringLatency: number = 5; // 5ms target latency
  private directMonitoringEnabled: boolean = true;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Create a new recording session
   */
  public createSession(sampleRate: number = 48000, bitDepth: number = 24): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.currentSession = {
      sessionId,
      startTime: new Date(),
      tracks: new Map(),
      takes: [],
      punchSettings: {
        enabled: false,
        preRoll: 2,
        postRoll: 2,
        mode: 'manual',
        autoPunchInPoint: null,
        autoPunchOutPoint: null,
      },
      sampleRate,
      bitDepth,
    };

    return sessionId;
  }

  /**
   * Add a track to the recording session
   */
  public addTrack(trackId: string, inputSource: string | null = null): TrackRecordingState {
    if (!this.currentSession) {
      throw new Error('No active recording session');
    }

    const trackState: TrackRecordingState = {
      trackId,
      isArmed: false,
      isRecording: false,
      inputSource,
      monitoringEnabled: true,
      monitoringLatency: this.monitoringLatency,
      inputGain: 1.0,
      inputPan: 0,
      muteDuringRecording: false,
    };

    this.currentSession.tracks.set(trackId, trackState);
    return trackState;
  }

  /**
   * Arm a track for recording
   */
  public armTrack(trackId: string, inputSource?: string): void {
    const track = this.currentSession?.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    if (inputSource) {
      track.inputSource = inputSource;
    }

    track.isArmed = true;
  }

  /**
   * Disarm a track
   */
  public disarmTrack(trackId: string): void {
    const track = this.currentSession?.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    track.isArmed = false;
  }

  /**
   * Enable monitoring for a track
   */
  public enableMonitoring(trackId: string, latency: number = 5): void {
    const track = this.currentSession?.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    track.monitoringEnabled = true;
    track.monitoringLatency = latency;
  }

  /**
   * Disable monitoring for a track
   */
  public disableMonitoring(trackId: string): void {
    const track = this.currentSession?.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    track.monitoringEnabled = false;
  }

  /**
   * Set input gain for a track
   */
  public setInputGain(trackId: string, gain: number): void {
    const track = this.currentSession?.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    track.inputGain = Math.max(0, Math.min(1, gain));
  }

  /**
   * Set input pan for a track
   */
  public setInputPan(trackId: string, pan: number): void {
    const track = this.currentSession?.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    track.inputPan = Math.max(-1, Math.min(1, pan));
  }

  /**
   * Start recording on all armed tracks
   */
  public async startRecording(projectStartTime: number = 0): Promise<void> {
    if (!this.currentSession || !this.audioContext) {
      throw new Error('No active session or audio context');
    }

    const armedTracks = Array.from(this.currentSession.tracks.entries()).filter(
      ([_, track]) => track.isArmed
    );

    if (armedTracks.length === 0) {
      throw new Error('No armed tracks to record');
    }

    // Initialize recording for each armed track
    for (const [trackId, trackState] of armedTracks) {
      await this.startTrackRecording(trackId, trackState, projectStartTime);
    }
  }

  /**
   * Start recording for a single track
   */
  private async startTrackRecording(
    trackId: string,
    trackState: TrackRecordingState,
    projectStartTime: number
  ): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Get media stream for the input source
      let stream: MediaStream;

      if (trackState.inputSource === 'microphone') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else if (trackState.inputSource) {
        // Specific device ID
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: trackState.inputSource } },
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      this.mediaStreams.set(trackId, stream);

      // Create audio nodes for monitoring
      const inputNode = this.audioContext.createMediaStreamSource(stream);
      const monitorGain = this.audioContext.createGain();
      const directGain = this.audioContext.createGain();

      // Set up monitoring path
      if (trackState.monitoringEnabled && this.directMonitoringEnabled) {
        inputNode.connect(monitorGain);
        monitorGain.connect(directGain);
        directGain.connect(this.audioContext.destination);

        monitorGain.gain.value = trackState.inputGain;
      }

      // Store nodes for later cleanup
      this.recordingNodes.set(trackId, {
        inputNode,
        monitorGain,
        directGain,
      });

      // Create media recorder
      const mimeType = this.getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond:
          (this.currentSession?.bitDepth ?? 24) * (this.currentSession?.sampleRate ?? 48000),
      });

      this.recordedChunks.set(trackId, []);
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          const chunks = this.recordedChunks.get(trackId) || [];
          chunks.push(event.data);
          this.recordedChunks.set(trackId, chunks);
        }
      };

      mediaRecorder.start(100); // Collect chunks every 100ms
      this.mediaRecorders.set(trackId, mediaRecorder);

      // Update track state
      trackState.isRecording = true;
    } catch (error) {
      console.error(`Failed to start recording for track ${trackId}:`, error);
      throw error;
    }
  }

  /**
   * Stop recording on all tracks
   */
  public async stopRecording(projectStopTime: number = 0): Promise<TakeInfo[]> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const newTakes: TakeInfo[] = [];

    // Stop recording for each recording track
    for (const [trackId, trackState] of this.currentSession.tracks.entries()) {
      if (trackState.isRecording) {
        const take = await this.stopTrackRecording(trackId, trackState, projectStopTime);
        if (take) {
          newTakes.push(take);
        }
      }
    }

    return newTakes;
  }

  /**
   * Stop recording for a single track
   */
  private async stopTrackRecording(
    trackId: string,
    trackState: TrackRecordingState,
    projectStopTime: number
  ): Promise<TakeInfo | null> {
    const mediaRecorder = this.mediaRecorders.get(trackId);
    const mediaStream = this.mediaStreams.get(trackId);
    const nodes = this.recordingNodes.get(trackId);
    const chunks = this.recordedChunks.get(trackId);

    if (!mediaRecorder || !mediaStream || !chunks) {
      return null;
    }

    // Stop media recorder
    mediaRecorder.stop();

    // Create blob from chunks
    const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
    const blobUrl = URL.createObjectURL(blob);

    // Calculate take number for this track
    const trackTakes = this.currentSession!.takes.filter((t) => t.trackId === trackId);
    const takeNumber = trackTakes.length + 1;

    // Calculate duration
    const duration = projectStopTime - (trackTakes[trackTakes.length - 1]?.startTime || 0);

    // Create take info
    const take: TakeInfo = {
      takeId: `take_${trackId}_${Date.now()}`,
      trackId,
      takeNumber,
      startTime: projectStopTime - duration,
      duration,
      audioBuffer: null, // Will be decoded later
      blobUrl,
      createdAt: new Date(),
      isSelected: true,
      punchInPoint: null,
      punchOutPoint: null,
      crossfadeIn: 0,
      crossfadeOut: 0,
      notes: '',
      rating: 0,
    };

    // Add to session
    this.currentSession!.takes.push(take);

    // Clean up
    mediaStream.getTracks().forEach((track) => track.stop());
    this.mediaStreams.delete(trackId);
    this.mediaRecorders.delete(trackId);
    this.recordedChunks.delete(trackId);

    // Disconnect monitoring nodes
    if (nodes) {
      nodes.inputNode.disconnect();
      nodes.monitorGain.disconnect();
      nodes.directGain.disconnect();
      this.recordingNodes.delete(trackId);
    }

    // Update track state
    trackState.isRecording = false;
    trackState.isArmed = false;

    return take;
  }

  /**
   * Punch in at a specific time
   */
  public async punchIn(trackId: string, punchInTime: number): Promise<void> {
    const track = this.currentSession?.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    // Apply pre-roll if configured
    const preRoll = this.currentSession?.punchSettings?.preRoll ?? 0;
    const actualPunchInTime = punchInTime - preRoll;

    // Start recording
    await this.startTrackRecording(trackId, track, actualPunchInTime);

    // Store punch point
    const lastTake = this.currentSession?.takes?.filter((t) => t.trackId === trackId).pop();
    if (lastTake) {
      lastTake.punchInPoint = punchInTime;
    }
  }

  /**
   * Punch out at a specific time
   */
  public async punchOut(trackId: string, punchOutTime: number): Promise<TakeInfo | null> {
    const track = this.currentSession?.tracks.get(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    // Stop recording
    const take = await this.stopTrackRecording(trackId, track, punchOutTime);

    // Store punch point
    if (take) {
      take.punchOutPoint = punchOutTime;
    }

    return take;
  }

  /**
   * Configure punch in/out settings
   */
  public configurePunchSettings(settings: Partial<PunchInSettings>): void {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.punchSettings = {
      ...this.currentSession.punchSettings,
      ...settings,
    };
  }

  /**
   * Get punch settings
   */
  public getPunchSettings(): PunchInSettings | null {
    return this.currentSession?.punchSettings || null;
  }

  /**
   * Get all takes for a track
   */
  public getTakesForTrack(trackId: string): TakeInfo[] {
    if (!this.currentSession) return [];
    return this.currentSession.takes.filter((t) => t.trackId === trackId);
  }

  /**
   * Get all takes in the session
   */
  public getAllTakes(): TakeInfo[] {
    return this.currentSession?.takes || [];
  }

  /**
   * Select a take
   */
  public selectTake(takeId: string): void {
    if (!this.currentSession) return;

    // Deselect all takes for the same track
    const take = this.currentSession.takes.find((t) => t.takeId === takeId);
    if (!take) return;

    this.currentSession.takes.forEach((t) => {
      if (t.trackId === take.trackId) {
        t.isSelected = false;
      }
    });

    take.isSelected = true;
  }

  /**
   * Comp takes together
   */
  public compTakes(trackId: string, selectedTakeIds: string[]): TakeInfo | null {
    if (!this.currentSession) return null;

    const trackTakes = this.currentSession.takes.filter((t) => t.trackId === trackId);
    const selectedTakes = trackTakes.filter((t) => selectedTakeIds.includes(t.takeId));

    if (selectedTakes.length === 0) return null;

    // Sort by start time
    selectedTakes.sort((a, b) => a.startTime - b.startTime);

    // Create a new comped take
    const compedTake: TakeInfo = {
      takeId: `comp_${trackId}_${Date.now()}`,
      trackId,
      takeNumber: trackTakes.length + 1,
      startTime: selectedTakes[0].startTime,
      duration:
        selectedTakes[selectedTakes.length - 1].startTime +
        selectedTakes[selectedTakes.length - 1].duration -
        selectedTakes[0].startTime,
      audioBuffer: null,
      blobUrl: null,
      createdAt: new Date(),
      isSelected: true,
      punchInPoint: null,
      punchOutPoint: null,
      crossfadeIn: 0,
      crossfadeOut: 0,
      notes: `Comped from ${selectedTakes.length} takes`,
      rating: 0,
    };

    // Mark original takes as not selected
    selectedTakes.forEach((t) => (t.isSelected = false));

    // Add comped take
    this.currentSession.takes.push(compedTake);

    return compedTake;
  }

  /**
   * Delete a take
   */
  public deleteTake(takeId: string): void {
    if (!this.currentSession) return;

    const index = this.currentSession.takes.findIndex((t) => t.takeId === takeId);
    if (index !== -1) {
      const take = this.currentSession.takes[index];

      // Revoke blob URL if exists
      if (take.blobUrl) {
        URL.revokeObjectURL(take.blobUrl);
      }

      this.currentSession.takes.splice(index, 1);
    }
  }

  /**
   * Rename a take
   */
  public renameTake(takeId: string, notes: string): void {
    if (!this.currentSession) return;

    const take = this.currentSession.takes.find((t) => t.takeId === takeId);
    if (take) {
      take.notes = notes;
    }
  }

  /**
   * Rate a take
   */
  public rateTake(takeId: string, rating: number): void {
    if (!this.currentSession) return;

    const take = this.currentSession.takes.find((t) => t.takeId === takeId);
    if (take) {
      take.rating = Math.max(1, Math.min(5, rating));
    }
  }

  /**
   * Consolidate takes
   */
  public consolidateTakes(trackId: string): TakeInfo | null {
    if (!this.currentSession) return null;

    const trackTakes = this.currentSession.takes.filter((t) => t.trackId === trackId);
    if (trackTakes.length === 0) return null;

    // Sort by take number
    trackTakes.sort((a, b) => a.takeNumber - b.takeNumber);

    // Create consolidated take
    const consolidatedTake: TakeInfo = {
      takeId: `consolidated_${trackId}_${Date.now()}`,
      trackId,
      takeNumber: trackTakes.length + 1,
      startTime: trackTakes[0].startTime,
      duration:
        trackTakes[trackTakes.length - 1].startTime +
        trackTakes[trackTakes.length - 1].duration -
        trackTakes[0].startTime,
      audioBuffer: null,
      blobUrl: null,
      createdAt: new Date(),
      isSelected: true,
      punchInPoint: null,
      punchOutPoint: null,
      crossfadeIn: 0,
      crossfadeOut: 0,
      notes: `Consolidated from ${trackTakes.length} takes`,
      rating: 0,
    };

    // Mark original takes as not selected
    trackTakes.forEach((t) => (t.isSelected = false));

    // Add consolidated take
    this.currentSession.takes.push(consolidatedTake);

    return consolidatedTake;
  }

  /**
   * Get recording session info
   */
  public getSessionInfo(): RecordingSession | null {
    return this.currentSession;
  }

  /**
   * Get track recording state
   */
  public getTrackState(trackId: string): TrackRecordingState | null {
    return this.currentSession?.tracks.get(trackId) || null;
  }

  /**
   * Get all track states
   */
  public getAllTrackStates(): Map<string, TrackRecordingState> {
    return this.currentSession?.tracks || new Map();
  }

  /**
   * Set direct monitoring mode
   */
  public setDirectMonitoring(enabled: boolean): void {
    this.directMonitoringEnabled = enabled;
  }

  /**
   * Get supported MIME type for recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/wav',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm';
  }

  /**
   * Decode audio blob to AudioBuffer
   */
  public async decodeAudioBlob(takeId: string): Promise<AudioBuffer | null> {
    if (!this.currentSession || !this.audioContext) return null;

    const take = this.currentSession.takes.find((t) => t.takeId === takeId);
    if (!take || !take.blobUrl) return null;

    try {
      const response = await fetch(take.blobUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      take.audioBuffer = audioBuffer;
      return audioBuffer;
    } catch (error) {
      console.error('Failed to decode audio:', error);
      return null;
    }
  }

  /**
   * Clean up session
   */
  public cleanup(): void {
    // Stop all recordings
    for (const [trackId, recorder] of this.mediaRecorders) {
      try {
        recorder.stop();
      } catch {
        // Ignore errors
      }
    }

    // Stop all media streams
    for (const [_, stream] of this.mediaStreams) {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }

    // Revoke all blob URLs
    if (this.currentSession) {
      for (const take of this.currentSession.takes) {
        if (take.blobUrl) {
          URL.revokeObjectURL(take.blobUrl);
        }
      }
    }

    // Clear all maps
    this.mediaStreams.clear();
    this.mediaRecorders.clear();
    this.recordingNodes.clear();
    this.recordedChunks.clear();

    this.currentSession = null;
  }

  /**
   * Get recording statistics
   */
  public getStatistics(): {
    totalTracks: number;
    armedTracks: number;
    recordingTracks: number;
    totalTakes: number;
    sessionDuration: number;
  } {
    if (!this.currentSession) {
      return {
        totalTracks: 0,
        armedTracks: 0,
        recordingTracks: 0,
        totalTakes: 0,
        sessionDuration: 0,
      };
    }

    const tracks = Array.from(this.currentSession.tracks.values());
    const armedTracks = tracks.filter((t) => t.isArmed).length;
    const recordingTracks = tracks.filter((t) => t.isRecording).length;
    const sessionDuration = (Date.now() - this.currentSession.startTime.getTime()) / 1000;

    return {
      totalTracks: tracks.length,
      armedTracks,
      recordingTracks,
      totalTakes: this.currentSession.takes.length,
      sessionDuration,
    };
  }
}
