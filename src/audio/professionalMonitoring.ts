// 3WM SONIK - Professional Monitoring System
// Implements solo/mute, reference tracks, and professional monitoring features

import { StemTrack, TrackSettings } from '../types';

export interface MonitoringState {
  soloTracks: Set<string>;
  muteTracks: Set<string>;
  soloInPlace: boolean;
  referenceTrackEnabled: boolean;
  referenceTrackLevel: number;
  monitorMode: 'mono' | 'stereo' | 'surround';
  dimLevel: number; // for monitor dimming
  monoCompatibility: boolean;
}

export interface SoloSafeMode {
  enabled: boolean;
  warningThreshold: number; // dB level for warning
  autoDim: boolean;
}

export class ProfessionalMonitoring {
  private state: MonitoringState = {
    soloTracks: new Set(),
    muteTracks: new Set(),
    soloInPlace: false,
    referenceTrackEnabled: false,
    referenceTrackLevel: 0.8,
    monitorMode: 'stereo',
    dimLevel: 0.3, // -10dB when dimmed
    monoCompatibility: false,
  };

  private soloSafeMode: SoloSafeMode = {
    enabled: true,
    warningThreshold: -3, // -3dB warning
    autoDim: true,
  };

  private referenceAudioBuffer: AudioBuffer | null = null;
  private referenceGainNode: GainNode | null = null;
  private soloDimNode: GainNode | null = null;

  constructor() {
    // Initialize with default state
  }

  /**
   * Solo a track
   */
  public soloTrack(trackId: string): void {
    if (this.state.soloInPlace) {
      // Solo in place - only solo this track, leave others un-muted
      this.state.soloTracks.clear();
      this.state.soloTracks.add(trackId);
    } else {
      // Normal solo - solo this track, mute others
      this.state.soloTracks.add(trackId);
    }
  }

  /**
   * Unsolo a track
   */
  public unsoloTrack(trackId: string): void {
    this.state.soloTracks.delete(trackId);
  }

  /**
   * Check if track is soloed
   */
  public isTrackSoloed(trackId: string): boolean {
    return this.state.soloTracks.has(trackId);
  }

  /**
   * Get all soloed tracks
   */
  public getSoloedTracks(): string[] {
    return Array.from(this.state.soloTracks);
  }

  /**
   * Check if any tracks are soloed
   */
  public hasSoloedTracks(): boolean {
    return this.state.soloTracks.size > 0;
  }

  /**
   * Mute a track
   */
  public muteTrack(trackId: string): void {
    this.state.muteTracks.add(trackId);
  }

  /**
   * Unmute a track
   */
  public unmuteTrack(trackId: string): void {
    this.state.muteTracks.delete(trackId);
  }

  /**
   * Check if track is muted
   */
  public isTrackMuted(trackId: string): boolean {
    return this.state.muteTracks.has(trackId);
  }

  /**
   * Get all muted tracks
   */
  public getMutedTracks(): string[] {
    return Array.from(this.state.muteTracks);
  }

  /**
   * Toggle solo in place mode
   */
  public toggleSoloInPlace(): void {
    this.state.soloInPlace = !this.state.soloInPlace;

    if (!this.state.soloInPlace) {
      // When turning off solo in place, clear all solos
      this.state.soloTracks.clear();
    }
  }

  /**
   * Check if track should be audible based on solo/mute state
   */
  public isTrackAudible(trackId: string): boolean {
    // If track is muted, it's not audible
    if (this.state.muteTracks.has(trackId)) {
      return false;
    }

    // If any tracks are soloed and this track is not one of them, it's not audible
    if (this.state.soloTracks.size > 0 && !this.state.soloTracks.has(trackId)) {
      return false;
    }

    return true;
  }

  /**
   * Set monitor mode
   */
  public setMonitorMode(mode: MonitoringState['monitorMode']): void {
    this.state.monitorMode = mode;
  }

  /**
   * Get monitor mode
   */
  public getMonitorMode(): MonitoringState['monitorMode'] {
    return this.state.monitorMode;
  }

  /**
   * Enable/disable mono compatibility mode
   */
  public setMonoCompatibility(enabled: boolean): void {
    this.state.monoCompatibility = enabled;
  }

  /**
   * Check if mono compatibility is enabled
   */
  public isMonoCompatibilityEnabled(): boolean {
    return this.state.monoCompatibility;
  }

  /**
   * Set reference track
   */
  public setReferenceTrack(audioBuffer: AudioBuffer): void {
    this.referenceAudioBuffer = audioBuffer;
  }

  /**
   * Enable/disable reference track
   */
  public setReferenceTrackEnabled(enabled: boolean): void {
    this.state.referenceTrackEnabled = enabled;
  }

  /**
   * Set reference track level
   */
  public setReferenceTrackLevel(level: number): void {
    this.state.referenceTrackLevel = Math.max(0, Math.min(1, level));
  }

  /**
   * Get reference track state
   */
  public getReferenceTrackState(): {
    enabled: boolean;
    level: number;
    hasAudio: boolean;
  } {
    return {
      enabled: this.state.referenceTrackEnabled,
      level: this.state.referenceTrackLevel,
      hasAudio: this.referenceAudioBuffer !== null,
    };
  }

  /**
   * Dim monitors (for solo safe or manual dimming)
   */
  public dimMonitors(dimmed: boolean): void {
    if (this.soloDimNode) {
      this.soloDimNode.gain.value = dimmed ? this.state.dimLevel : 1.0;
    }
  }

  /**
   * Set dim level
   */
  public setDimLevel(level: number): void {
    this.state.dimLevel = Math.max(0, Math.min(1, level));
  }

  /**
   * Configure solo safe mode
   */
  public configureSoloSafeMode(config: Partial<SoloSafeMode>): void {
    Object.assign(this.soloSafeMode, config);
  }

  /**
   * Get solo safe mode configuration
   */
  public getSoloSafeMode(): SoloSafeMode {
    return { ...this.soloSafeMode };
  }

  /**
   * Check if solo safe warning should be triggered
   */
  public shouldTriggerSoloWarning(level: number): boolean {
    if (!this.soloSafeMode.enabled) {
      return false;
    }

    return level > this.soloSafeMode.warningThreshold;
  }

  /**
   * Calculate effective gain for a track considering solo/mute state
   */
  public calculateEffectiveGain(trackId: string, baseGain: number): number {
    if (!this.isTrackAudible(trackId)) {
      return 0;
    }

    // Apply solo dim if needed
    if (this.state.soloTracks.size > 0 && this.soloSafeMode.autoDim) {
      // When tracks are soloed, reduce gain slightly to prevent clipping
      return baseGain * 0.9;
    }

    return baseGain;
  }

  /**
   * Get monitoring state
   */
  public getMonitoringState(): MonitoringState {
    return {
      soloTracks: new Set(this.state.soloTracks),
      muteTracks: new Set(this.state.muteTracks),
      soloInPlace: this.state.soloInPlace,
      referenceTrackEnabled: this.state.referenceTrackEnabled,
      referenceTrackLevel: this.state.referenceTrackLevel,
      monitorMode: this.state.monitorMode,
      dimLevel: this.state.dimLevel,
      monoCompatibility: this.state.monoCompatibility,
    };
  }

  /**
   * Reset all monitoring state
   */
  public resetMonitoring(): void {
    this.state.soloTracks.clear();
    this.state.muteTracks.clear();
    this.state.soloInPlace = false;
    this.state.referenceTrackEnabled = false;
    this.state.monitorMode = 'stereo';
    this.state.monoCompatibility = false;
  }

  /**
   * Create monitor mix for A/B comparison
   */
  public createMonitorMix(
    tracks: StemTrack[],
    settings: Map<string, TrackSettings>
  ): {
    leftLevel: number;
    rightLevel: number;
    monoLevel: number;
  } {
    let leftSum = 0;
    let rightSum = 0;
    let monoSum = 0;

    for (const track of tracks) {
      if (!this.isTrackAudible(track.id)) {
        continue;
      }

      const trackSettings = settings.get(track.id);
      if (!trackSettings) {
        continue;
      }

      const effectiveGain = this.calculateEffectiveGain(track.id, trackSettings.volume);
      const pan = trackSettings.pan;

      // Calculate stereo contributions
      const leftGain = effectiveGain * Math.sqrt(Math.max(0, 1 - pan));
      const rightGain = effectiveGain * Math.sqrt(Math.max(0, 1 + pan));

      leftSum += leftGain;
      rightSum += rightGain;
      monoSum += effectiveGain;
    }

    // Normalize to prevent clipping
    const maxLevel = Math.max(leftSum, rightSum, monoSum);
    const normalization = maxLevel > 1 ? 1 / maxLevel : 1;

    return {
      leftLevel: leftSum * normalization,
      rightLevel: rightSum * normalization,
      monoLevel: monoSum * normalization,
    };
  }

  /**
   * Get monitoring statistics
   */
  public getStatistics(): {
    soloedCount: number;
    mutedCount: number;
    referenceActive: boolean;
    soloSafeEnabled: boolean;
    monitorMode: string;
  } {
    return {
      soloedCount: this.state.soloTracks.size,
      mutedCount: this.state.muteTracks.size,
      referenceActive: this.state.referenceTrackEnabled,
      soloSafeEnabled: this.soloSafeMode.enabled,
      monitorMode: this.state.monitorMode,
    };
  }
}

// Export singleton instance
export const professionalMonitoring = new ProfessionalMonitoring();
