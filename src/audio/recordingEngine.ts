// 3WM SONIK - Professional Multitrack Recording Engine
// Supports 24+ simultaneous tracks, low-latency monitoring, punch-in/out, and professional audio formats

import {
  RecordingConfiguration,
  PunchConfiguration,
  TrackRecordingState,
  RecordedTake,
  AudioRegion,
  WaveformDisplayData,
  StemTrack,
} from '../types';

export class ProfessionalRecordingEngine {
  private audioContext: AudioContext | null = null;
  private recordingConfig: RecordingConfiguration;
  private punchConfig: PunchConfiguration;
  private trackStates: Map<string, TrackRecordingState> = new Map();
  private activeRecordings: Map<string, MediaRecorder> = new Map();
  private mediaStreams: Map<string, MediaStream> = new Map();
  private recordingPromises: Map<string, Promise<RecordedTake>> = new Map();
  private audioWorklets: Map<string, AudioWorkletNode> = new Map();
  private monitoringNodes: Map<string, GainNode> = new Map();
  private latencyCompensationNodes: Map<string, DelayNode> = new Map();

  private globalRecordingStartTime: number = 0;
  private isGlobalRecording: boolean = false;
  private recordingChunkSize: number = 1000; // 1 second chunks

  constructor() {
    this.recordingConfig = {
      sampleRate: 48000,
      bitDepth: 24,
      channels: 2,
      format: 'wav',
      bufferSize: 512,
      monitoringMode: 'latency-compensated',
      autoSaveEnabled: true,
      autoSaveInterval: 30,
    };

    this.punchConfig = {
      enabled: false,
      mode: 'manual',
      preRoll: 2000, // 2 seconds
      postRoll: 1000, // 1 second
      crossfadeDuration: 100, // 100ms
    };
  }

  public async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;

    // Load recording audio worklet
    try {
      await audioContext.audioWorklet.addModule('/worklets/recording-processor.js');
    } catch (error) {
      console.warn('Recording worklet not available, using fallback mode');
    }
  }

  public setRecordingConfig(config: Partial<RecordingConfiguration>): void {
    this.recordingConfig = { ...this.recordingConfig, ...config };
  }

  public setPunchConfig(config: Partial<PunchConfiguration>): void {
    this.punchConfig = { ...this.punchConfig, ...config };
  }

  public getRecordingConfig(): RecordingConfiguration {
    return { ...this.recordingConfig };
  }

  public getPunchConfig(): PunchConfiguration {
    return { ...this.punchConfig };
  }

  /**
   * Arm a track for recording
   */
  public armTrack(trackId: string, inputDevice?: string, inputChannel?: number): void {
    const state: TrackRecordingState = {
      isArmed: true,
      isRecording: false,
      monitoringEnabled: true,
      inputDevice,
      inputChannel,
      gain: 1.0,
      latencyCompensation: 0,
    };

    this.trackStates.set(trackId, state);
  }

  /**
   * Disarm a track
   */
  public disarmTrack(trackId: string): void {
    const state = this.trackStates.get(trackId);
    if (state) {
      state.isArmed = false;
      state.isRecording = false;
    }
  }

  /**
   * Enable monitoring for a track
   */
  public enableMonitoring(trackId: string, enabled: boolean): void {
    const state = this.trackStates.get(trackId);
    if (state) {
      state.monitoringEnabled = enabled;
    }
  }

  /**
   * Set input gain for a track
   */
  public setInputGain(trackId: string, gain: number): void {
    const state = this.trackStates.get(trackId);
    if (state) {
      state.gain = Math.max(0, Math.min(1, gain));

      // Update monitoring node if exists
      const monitoringNode = this.monitoringNodes.get(trackId);
      if (monitoringNode) {
        monitoringNode.gain.value = state.gain;
      }
    }
  }

  /**
   * Set latency compensation for a track
   */
  public setLatencyCompensation(trackId: string, samples: number): void {
    const state = this.trackStates.get(trackId);
    if (state) {
      state.latencyCompensation = samples;

      // Update latency compensation node if exists
      const latencyNode = this.latencyCompensationNodes.get(trackId);
      if (latencyNode && this.audioContext) {
        const delayTime = samples / this.audioContext.sampleRate;
        latencyNode.delayTime.value = delayTime;
      }
    }
  }

  /**
   * Start global recording
   */
  public async startRecording(): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    if (this.isGlobalRecording) {
      return;
    }

    this.isGlobalRecording = true;
    this.globalRecordingStartTime = Date.now();

    // Start recording for all armed tracks
    const armedTracks = Array.from(this.trackStates.entries()).filter(
      ([_, state]) => state.isArmed
    );

    for (const [trackId, state] of armedTracks) {
      await this.startTrackRecording(trackId);
    }
  }

  /**
   * Stop global recording
   */
  public async stopRecording(): Promise<Map<string, RecordedTake>> {
    if (!this.isGlobalRecording) {
      return new Map();
    }

    this.isGlobalRecording = false;

    // Stop all active recordings
    const recordings = new Map<string, RecordedTake>();

    for (const [trackId, recorder] of this.activeRecordings) {
      try {
        const take = await this.stopTrackRecording(trackId);
        if (take) {
          recordings.set(trackId, take);
        }
      } catch (error) {
        console.error(`Error stopping recording for track ${trackId}:`, error);
      }
    }

    return recordings;
  }

  /**
   * Start recording for a specific track
   */
  private async startTrackRecording(trackId: string): Promise<void> {
    const state = this.trackStates.get(trackId);
    if (!state || !state.isArmed) {
      return;
    }

    try {
      // Get media stream from input device
      const mediaStream = await this.getMediaStream(state.inputDevice);
      this.mediaStreams.set(trackId, mediaStream);

      // Create audio worklet for processing
      if (this.audioContext) {
        const source = this.audioContext.createMediaStreamSource(mediaStream);

        // Create monitoring chain
        const monitoringGain = this.audioContext.createGain();
        monitoringGain.gain.value = state.gain;
        this.monitoringNodes.set(trackId, monitoringGain);

        // Create latency compensation if needed
        if (
          state.latencyCompensation > 0 &&
          this.recordingConfig.monitoringMode === 'latency-compensated'
        ) {
          const delayNode = this.audioContext.createDelay(2.0);
          const delayTime = state.latencyCompensation / this.audioContext.sampleRate;
          delayNode.delayTime.value = delayTime;
          this.latencyCompensationNodes.set(trackId, delayNode);

          source.connect(delayNode);
          delayNode.connect(monitoringGain);
        } else {
          source.connect(monitoringGain);
        }

        // Connect to destination for monitoring
        if (state.monitoringEnabled) {
          monitoringGain.connect(this.audioContext.destination);
        }
      }

      // Create MediaRecorder
      const mimeType = this.getMimeType();
      const recorder = new MediaRecorder(mediaStream, {
        mimeType,
        audioBitsPerSecond:
          this.recordingConfig.bitDepth *
          this.recordingConfig.sampleRate *
          this.recordingConfig.channels,
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      const recordingPromise = new Promise<RecordedTake>((resolve, reject) => {
        recorder.onstop = async () => {
          try {
            const blob = new Blob(chunks, { type: mimeType });
            const audioBuffer = await this.blobToAudioBuffer(blob);

            const take: RecordedTake = {
              id: `take_${Date.now()}_${trackId}`,
              stemId: trackId,
              takeNumber: this.getNextTakeNumber(trackId),
              durationMs: audioBuffer.duration * 1000,
              blobUrl: URL.createObjectURL(blob),
              createdAt: new Date().toISOString(),
              label: `Take ${this.getNextTakeNumber(trackId)}`,
              isActive: true,
              audioBuffer,
              sampleRate: audioBuffer.sampleRate,
              bitDepth: this.recordingConfig.bitDepth,
              channels: audioBuffer.numberOfChannels,
              fileSize: blob.size,
              format: this.recordingConfig.format,
            };

            resolve(take);
          } catch (error) {
            reject(error);
          }
        };
      });

      recorder.start(this.recordingChunkSize);
      this.activeRecordings.set(trackId, recorder);
      this.recordingPromises.set(trackId, recordingPromise);

      state.isRecording = true;
    } catch (error) {
      console.error(`Error starting recording for track ${trackId}:`, error);
      throw error;
    }
  }

  /**
   * Stop recording for a specific track
   */
  private async stopTrackRecording(trackId: string): Promise<RecordedTake | null> {
    const recorder = this.activeRecordings.get(trackId);
    const recordingPromise = this.recordingPromises.get(trackId);
    const state = this.trackStates.get(trackId);

    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }

    if (recordingPromise) {
      try {
        const take = await recordingPromise;

        // Clean up
        this.activeRecordings.delete(trackId);
        this.recordingPromises.delete(trackId);

        const mediaStream = this.mediaStreams.get(trackId);
        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
          this.mediaStreams.delete(trackId);
        }

        const monitoringNode = this.monitoringNodes.get(trackId);
        if (monitoringNode) {
          monitoringNode.disconnect();
          this.monitoringNodes.delete(trackId);
        }

        const latencyNode = this.latencyCompensationNodes.get(trackId);
        if (latencyNode) {
          latencyNode.disconnect();
          this.latencyCompensationNodes.delete(trackId);
        }

        if (state) {
          state.isRecording = false;
        }

        return take;
      } catch (error) {
        console.error(`Error completing recording for track ${trackId}:`, error);
        return null;
      }
    }

    return null;
  }

  /**
   * Punch in recording at specific time
   */
  public async punchIn(trackId: string, punchTime: number): Promise<void> {
    if (!this.punchConfig.enabled) {
      return;
    }

    const state = this.trackStates.get(trackId);
    if (!state) {
      return;
    }

    // Calculate pre-roll time
    const preRollTime = punchTime - this.punchConfig.preRoll;
    const currentTime = Date.now() - this.globalRecordingStartTime;

    if (this.punchConfig.mode === 'auto' && this.punchConfig.autoPunchRegion) {
      // Auto punch mode - recording will start automatically at punch-in point
      if (
        currentTime >= this.punchConfig.autoPunchRegion.start &&
        currentTime <= this.punchConfig.autoPunchRegion.end
      ) {
        await this.startTrackRecording(trackId);
      }
    } else {
      // Manual punch mode - start recording immediately with pre-roll
      if (currentTime >= preRollTime) {
        await this.startTrackRecording(trackId);
      }
    }
  }

  /**
   * Punch out recording at specific time
   */
  public async punchOut(trackId: string, punchTime: number): Promise<void> {
    if (!this.punchConfig.enabled) {
      return;
    }

    const state = this.trackStates.get(trackId);
    if (!state || !state.isRecording) {
      return;
    }

    const currentTime = Date.now() - this.globalRecordingStartTime;
    const postRollTime = punchTime + this.punchConfig.postRoll;

    if (currentTime >= postRollTime) {
      await this.stopTrackRecording(trackId);
    }
  }

  /**
   * Get media stream from input device
   */
  private async getMediaStream(deviceId?: string): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        channelCount: this.recordingConfig.channels,
        sampleRate: this.recordingConfig.sampleRate,
        sampleSize: this.recordingConfig.bitDepth,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    };

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.error('Error getting media stream:', error);
      throw new Error('Failed to access audio input device');
    }
  }

  /**
   * Get available input devices
   */
  public async getInputDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === 'audioinput');
    } catch (error) {
      console.error('Error enumerating devices:', error);
      return [];
    }
  }

  /**
   * Convert blob to audio buffer
   */
  private async blobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    const arrayBuffer = await blob.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * Get MIME type based on configuration
   */
  private getMimeType(): string {
    const format = this.recordingConfig.format;

    switch (format) {
      case 'wav':
        return 'audio/wav';
      case 'flac':
        return 'audio/flac';
      case 'aiff':
        return 'audio/aiff';
      default:
        return 'audio/webm'; // Fallback
    }
  }

  /**
   * Get next take number for a track
   */
  private getNextTakeNumber(trackId: string): number {
    // This would typically query the project store for existing takes
    // For now, return a sequential number
    return this.trackStates.has(trackId) ? 1 : 1;
  }

  /**
   * Generate waveform display data for a take
   */
  public async generateWaveformData(
    take: RecordedTake,
    resolution: number = 64
  ): Promise<WaveformDisplayData> {
    if (!take.audioBuffer) {
      throw new Error('Audio buffer not available for take');
    }

    const audioBuffer = take.audioBuffer;
    const channels = audioBuffer.numberOfChannels;
    const samplesPerPeak = Math.floor(audioBuffer.length / resolution);

    const peaks: number[] = [];
    const rms: number[] = [];

    for (let i = 0; i < resolution; i++) {
      let channelPeak = 0;
      let channelRms = 0;

      for (let channel = 0; channel < channels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        let peak = 0;
        let sumSquares = 0;

        for (let j = 0; j < samplesPerPeak; j++) {
          const sampleIndex = i * samplesPerPeak + j;
          if (sampleIndex < channelData.length) {
            const sample = Math.abs(channelData[sampleIndex]);
            peak = Math.max(peak, sample);
            sumSquares += sample * sample;
          }
        }

        channelPeak = Math.max(channelPeak, peak);
        channelRms = Math.sqrt(sumSquares / samplesPerPeak);
      }

      peaks.push(channelPeak);
      rms.push(channelRms);
    }

    return {
      regionId: take.id,
      peaks,
      rms,
      resolution,
      sampleRate: audioBuffer.sampleRate,
      channels,
    };
  }

  /**
   * Get recording state for a track
   */
  public getTrackState(trackId: string): TrackRecordingState | undefined {
    return this.trackStates.get(trackId);
  }

  /**
   * Get all track states
   */
  public getAllTrackStates(): Map<string, TrackRecordingState> {
    return new Map(this.trackStates);
  }

  /**
   * Check if global recording is active
   */
  public isRecording(): boolean {
    return this.isGlobalRecording;
  }

  /**
   * Get recording duration
   */
  public getRecordingDuration(): number {
    if (!this.isGlobalRecording) {
      return 0;
    }
    return Date.now() - this.globalRecordingStartTime;
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Stop all recordings
    for (const [trackId, recorder] of this.activeRecordings) {
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    }

    // Stop all media streams
    for (const [_, mediaStream] of this.mediaStreams) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }

    // Clear all maps
    this.activeRecordings.clear();
    this.mediaStreams.clear();
    this.recordingPromises.clear();
    this.audioWorklets.clear();
    this.monitoringNodes.clear();
    this.latencyCompensationNodes.clear();
    this.trackStates.clear();
  }
}

// Export singleton instance
export const recordingEngine = new ProfessionalRecordingEngine();
