// 3WM SONIK - Professional Take Management System
// Handles multi-take recording, comping, and take organization

import { RecordedTake, AudioRegion, StemTrack } from '../types';

export interface TakeCompingSelection {
  takeId: string;
  regionId: string;
  startTime: number; // in milliseconds
  endTime: number; // in milliseconds
  isSelected: boolean;
}

export interface TakeCompResult {
  compedTake: RecordedTake;
  regions: AudioRegion[];
  crossfadePoints: number[];
}

export class TakeManager {
  private takes: Map<string, RecordedTake[]> = new Map(); // trackId -> takes
  private activeTakeId: string | null = null;
  private compingSelections: Map<string, TakeCompingSelection[]> = new Map();

  /**
   * Add a new take to a track
   */
  public addTake(trackId: string, take: RecordedTake): void {
    if (!this.takes.has(trackId)) {
      this.takes.set(trackId, []);
    }

    const trackTakes = this.takes.get(trackId)!;
    take.takeNumber = trackTakes.length + 1;
    take.label = `Take ${take.takeNumber}`;

    trackTakes.push(take);

    // Set as active if it's the first take
    if (trackTakes.length === 1) {
      this.setActiveTake(trackId, take.id);
    }
  }

  /**
   * Get all takes for a track
   */
  public getTakes(trackId: string): RecordedTake[] {
    return this.takes.get(trackId) || [];
  }

  /**
   * Get a specific take
   */
  public getTake(trackId: string, takeId: string): RecordedTake | undefined {
    const trackTakes = this.takes.get(trackId);
    return trackTakes?.find((take) => take.id === takeId);
  }

  /**
   * Set active take for a track
   */
  public setActiveTake(trackId: string, takeId: string): void {
    const trackTakes = this.takes.get(trackId);
    if (!trackTakes) {
      return;
    }

    // Deactivate all takes
    trackTakes.forEach((take) => (take.isActive = false));

    // Activate selected take
    const take = trackTakes.find((t) => t.id === takeId);
    if (take) {
      take.isActive = true;
      this.activeTakeId = takeId;
    }
  }

  /**
   * Get active take for a track
   */
  public getActiveTake(trackId: string): RecordedTake | undefined {
    const trackTakes = this.takes.get(trackId);
    return trackTakes?.find((take) => take.isActive);
  }

  /**
   * Delete a take
   */
  public deleteTake(trackId: string, takeId: string): boolean {
    const trackTakes = this.takes.get(trackId);
    if (!trackTakes) {
      return false;
    }

    const index = trackTakes.findIndex((take) => take.id === takeId);
    if (index === -1) {
      return false;
    }

    const wasActive = trackTakes[index].isActive;
    trackTakes.splice(index, 1);

    // If we deleted the active take, activate another one
    if (wasActive && trackTakes.length > 0) {
      trackTakes[trackTakes.length - 1].isActive = true;
    }

    return true;
  }

  /**
   * Rename a take
   */
  public renameTake(trackId: string, takeId: string, newLabel: string): boolean {
    const take = this.getTake(trackId, takeId);
    if (take) {
      take.label = newLabel;
      return true;
    }
    return false;
  }

  /**
   * Rate a take
   */
  public rateTake(trackId: string, takeId: string, rating: number): boolean {
    const take = this.getTake(trackId, takeId);
    if (take && rating >= 1 && rating <= 5) {
      take.rating = rating;
      return true;
    }
    return false;
  }

  /**
   * Add notes to a take
   */
  public addTakeNotes(trackId: string, takeId: string, notes: string): boolean {
    const take = this.getTake(trackId, takeId);
    if (take) {
      take.notes = notes;
      return true;
    }
    return false;
  }

  /**
   * Start comping session for a track
   */
  public startCompingSession(trackId: string): void {
    this.compingSelections.set(trackId, []);

    // Mark all takes as available for comping
    const trackTakes = this.takes.get(trackId);
    if (trackTakes) {
      trackTakes.forEach((take) => {
        take.isSelectedForComping = true;
      });
    }
  }

  /**
   * Add comping selection
   */
  public addCompingSelection(trackId: string, selection: TakeCompingSelection): void {
    if (!this.compingSelections.has(trackId)) {
      this.compingSelections.set(trackId, []);
    }

    const selections = this.compingSelections.get(trackId)!;
    selections.push(selection);
  }

  /**
   * Remove comping selection
   */
  public removeCompingSelection(trackId: string, selectionId: string): void {
    const selections = this.compingSelections.get(trackId);
    if (selections) {
      const index = selections.findIndex((s) => s.regionId === selectionId);
      if (index !== -1) {
        selections.splice(index, 1);
      }
    }
  }

  /**
   * Get comping selections for a track
   */
  public getCompingSelections(trackId: string): TakeCompingSelection[] {
    return this.compingSelections.get(trackId) || [];
  }

  /**
   * Create comped take from selections
   */
  public async createCompedTake(trackId: string): Promise<TakeCompResult | null> {
    const selections = this.compingSelections.get(trackId);
    if (!selections || selections.length === 0) {
      return null;
    }

    const trackTakes = this.takes.get(trackId);
    if (!trackTakes) {
      return null;
    }

    // Sort selections by start time
    selections.sort((a, b) => a.startTime - b.startTime);

    // Create new comped take
    const compedTake: RecordedTake = {
      id: `comped_${Date.now()}_${trackId}`,
      stemId: trackId,
      takeNumber: trackTakes.length + 1,
      durationMs: selections[selections.length - 1].endTime,
      blobUrl: '', // Will be set after audio processing
      createdAt: new Date().toISOString(),
      label: 'Comped Take',
      isActive: true,
      isCustomTake: true,
    };

    // Create audio regions for comped take
    const regions: AudioRegion[] = [];
    const crossfadePoints: number[] = [];

    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      const take = this.getTake(trackId, selection.takeId);

      if (!take || !take.audioBuffer) {
        continue;
      }

      const region: AudioRegion = {
        id: `region_${Date.now()}_${i}`,
        trackId,
        takeId: take.id,
        startOffset: selection.startTime,
        duration: selection.endTime - selection.startTime,
        startTime: selection.startTime,
        isSelected: true,
        isMuted: false,
        gain: 1.0,
        fadeIn: 0,
        fadeOut: 0,
      };

      // Add crossfade if there's a previous region
      if (i > 0) {
        const previousRegion = regions[i - 1];
        const crossfadeDuration = 100; // 100ms default crossfade
        const crossfadePoint =
          previousRegion.startTime + previousRegion.duration - crossfadeDuration;

        crossfadePoints.push(crossfadePoint);

        region.crossfadeRegions = [
          {
            regionId: previousRegion.id,
            duration: crossfadeDuration,
            curve: 'equal-power',
          },
        ];

        previousRegion.crossfadeRegions = [
          {
            regionId: region.id,
            duration: crossfadeDuration,
            curve: 'equal-power',
          },
        ];
      }

      regions.push(region);
    }

    // Deactivate all other takes
    trackTakes.forEach((take) => (take.isActive = false));
    compedTake.isActive = true;

    // Add comped take to track
    this.addTake(trackId, compedTake);

    // Clear comping selections
    this.compingSelections.delete(trackId);

    return {
      compedTake,
      regions,
      crossfadePoints,
    };
  }

  /**
   * Consolidate takes into a single take
   */
  public async consolidateTakes(trackId: string, takeIds: string[]): Promise<RecordedTake | null> {
    const trackTakes = this.takes.get(trackId);
    if (!trackTakes) {
      return null;
    }

    const takesToConsolidate = takeIds
      .map((id) => this.getTake(trackId, id))
      .filter((take) => take !== undefined) as RecordedTake[];

    if (takesToConsolidate.length === 0) {
      return null;
    }

    // Calculate total duration
    const totalDuration = takesToConsolidate.reduce((sum, take) => {
      return sum + (take.durationMs || 0);
    }, 0);

    // Create consolidated take
    const consolidatedTake: RecordedTake = {
      id: `consolidated_${Date.now()}_${trackId}`,
      stemId: trackId,
      takeNumber: trackTakes.length + 1,
      durationMs: totalDuration,
      blobUrl: '', // Will be set after audio processing
      createdAt: new Date().toISOString(),
      label: 'Consolidated Take',
      isActive: true,
      isCustomTake: true,
    };

    // Add consolidated take
    this.addTake(trackId, consolidatedTake);

    // Mark original takes as inactive
    takesToConsolidate.forEach((take) => (take.isActive = false));

    return consolidatedTake;
  }

  /**
   * Duplicate a take
   */
  public duplicateTake(trackId: string, takeId: string): RecordedTake | null {
    const originalTake = this.getTake(trackId, takeId);
    if (!originalTake) {
      return null;
    }

    const duplicatedTake: RecordedTake = {
      ...originalTake,
      id: `duplicate_${Date.now()}_${trackId}`,
      label: `${originalTake.label} (Copy)`,
      createdAt: new Date().toISOString(),
      isActive: false,
    };

    this.addTake(trackId, duplicatedTake);
    return duplicatedTake;
  }

  /**
   * Get take statistics for a track
   */
  public getTakeStatistics(trackId: string): {
    totalTakes: number;
    activeTake: string | null;
    totalDuration: number;
    averageRating: number;
    bestRatedTake: string | null;
  } {
    const trackTakes = this.takes.get(trackId) || [];

    const totalTakes = trackTakes.length;
    const activeTake = this.getActiveTake(trackId)?.id || null;
    const totalDuration = trackTakes.reduce((sum, take) => sum + (take.durationMs || 0), 0);

    const ratedTakes = trackTakes.filter((take) => take.rating !== undefined);
    const averageRating =
      ratedTakes.length > 0
        ? ratedTakes.reduce((sum, take) => sum + (take.rating || 0), 0) / ratedTakes.length
        : 0;

    const bestRatedTake =
      ratedTakes.length > 0
        ? ratedTakes.reduce((best, take) => ((take.rating || 0) > (best.rating || 0) ? take : best))
            .id
        : null;

    return {
      totalTakes,
      activeTake,
      totalDuration,
      averageRating,
      bestRatedTake,
    };
  }

  /**
   * Clear all takes for a track
   */
  public clearTakes(trackId: string): void {
    this.takes.delete(trackId);
    this.compingSelections.delete(trackId);
  }

  /**
   * Get all track IDs with takes
   */
  public getTrackIdsWithTakes(): string[] {
    return Array.from(this.takes.keys());
  }
}

// Export singleton instance
export const takeManager = new TakeManager();
