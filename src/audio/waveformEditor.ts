// 3WM SONIK - Professional Waveform Editor
// Implements sample-level precision editing, region management, and audio manipulation

import { AudioRegion, WaveformDisplayData, RecordedTake } from '../types';

export interface EditOperation {
  type: 'split' | 'trim' | 'delete' | 'move' | 'resize' | 'fade' | 'crossfade';
  regionId: string;
  parameters: any;
  timestamp: number;
}

export interface WaveformEditState {
  selectedRegionId: string | null;
  editingMode: 'select' | 'split' | 'trim' | 'fade' | 'draw' | 'sample-edit';
  zoomLevel: number; // samples per pixel
  scrollPosition: number; // in samples
  snapToGrid: boolean;
  gridResolution: number; // in samples
  undoStack: EditOperation[];
  redoStack: EditOperation[];
  sampleSelection: {
    startSample: number;
    endSample: number;
    active: boolean;
  } | null;
}

export class WaveformEditor {
  private audioContext: AudioContext | null = null;
  private regions: Map<string, AudioRegion> = new Map();
  private waveformCache: Map<string, WaveformDisplayData> = new Map();
  private editState: WaveformEditState = {
    selectedRegionId: null,
    editingMode: 'select',
    zoomLevel: 100,
    scrollPosition: 0,
    snapToGrid: true,
    gridResolution: 4800, // 100ms at 48kHz
    undoStack: [],
    redoStack: [],
    sampleSelection: null,
  };

  constructor() {
    // Initialize with default state
  }

  public async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
  }

  /**
   * Add an audio region
   */
  public addRegion(region: AudioRegion): void {
    this.regions.set(region.id, region);
  }

  /**
   * Get a region by ID
   */
  public getRegion(regionId: string): AudioRegion | undefined {
    return this.regions.get(regionId);
  }

  /**
   * Get all regions for a track
   */
  public getTrackRegions(trackId: string): AudioRegion[] {
    return Array.from(this.regions.values())
      .filter((region) => region.trackId === trackId)
      .sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Select a region
   */
  public selectRegion(regionId: string | null): void {
    this.editState.selectedRegionId = regionId;

    // Update region selection state
    this.regions.forEach((region) => {
      region.isSelected = region.id === regionId;
    });
  }

  /**
   * Get selected region
   */
  public getSelectedRegion(): AudioRegion | undefined {
    if (!this.editState.selectedRegionId) {
      return undefined;
    }
    return this.regions.get(this.editState.selectedRegionId);
  }

  /**
   * Split a region at a specific time
   */
  public splitRegion(regionId: string, splitTime: number): AudioRegion[] {
    const originalRegion = this.regions.get(regionId);
    if (!originalRegion) {
      return [];
    }

    const relativeSplitTime = splitTime - originalRegion.startTime;

    if (relativeSplitTime <= 0 || relativeSplitTime >= originalRegion.duration) {
      return [originalRegion]; // Split point outside region
    }

    // Create two new regions
    const leftRegion: AudioRegion = {
      ...originalRegion,
      id: `${regionId}_left_${Date.now()}`,
      duration: relativeSplitTime,
      crossfadeRegions: undefined, // Remove crossfades on split
    };

    const rightRegion: AudioRegion = {
      ...originalRegion,
      id: `${regionId}_right_${Date.now()}`,
      startOffset: originalRegion.startOffset + relativeSplitTime,
      startTime: splitTime,
      duration: originalRegion.duration - relativeSplitTime,
      crossfadeRegions: undefined,
    };

    // Add operation to undo stack
    this.addEditOperation({
      type: 'split',
      regionId,
      parameters: { splitTime, leftRegionId: leftRegion.id, rightRegionId: rightRegion.id },
      timestamp: Date.now(),
    });

    // Remove original region and add new ones
    this.regions.delete(regionId);
    this.regions.set(leftRegion.id, leftRegion);
    this.regions.set(rightRegion.id, rightRegion);

    return [leftRegion, rightRegion];
  }

  /**
   * Trim a region
   */
  public trimRegion(
    regionId: string,
    newStartTime: number,
    newDuration: number
  ): AudioRegion | null {
    const region = this.regions.get(regionId);
    if (!region) {
      return null;
    }

    const oldStartTime = region.startTime;
    const oldDuration = region.duration;

    // Apply trim
    region.startTime = newStartTime;
    region.duration = newDuration;
    region.startOffset = region.startOffset + (newStartTime - oldStartTime);

    // Add operation to undo stack
    this.addEditOperation({
      type: 'trim',
      regionId,
      parameters: { oldStartTime, oldDuration, newStartTime, newDuration },
      timestamp: Date.now(),
    });

    return region;
  }

  /**
   * Delete a region
   */
  public deleteRegion(regionId: string): boolean {
    const region = this.regions.get(regionId);
    if (!region) {
      return false;
    }

    // Add operation to undo stack
    this.addEditOperation({
      type: 'delete',
      regionId,
      parameters: { region: { ...region } },
      timestamp: Date.now(),
    });

    this.regions.delete(regionId);
    return true;
  }

  /**
   * Move a region
   */
  public moveRegion(regionId: string, newStartTime: number): AudioRegion | null {
    const region = this.regions.get(regionId);
    if (!region) {
      return null;
    }

    const oldStartTime = region.startTime;
    region.startTime = newStartTime;

    // Add operation to undo stack
    this.addEditOperation({
      type: 'move',
      regionId,
      parameters: { oldStartTime, newStartTime },
      timestamp: Date.now(),
    });

    return region;
  }

  /**
   * Resize a region
   */
  public resizeRegion(regionId: string, newDuration: number): AudioRegion | null {
    const region = this.regions.get(regionId);
    if (!region) {
      return null;
    }

    const oldDuration = region.duration;
    region.duration = newDuration;

    // Add operation to undo stack
    this.addEditOperation({
      type: 'resize',
      regionId,
      parameters: { oldDuration, newDuration },
      timestamp: Date.now(),
    });

    return region;
  }

  /**
   * Apply fade to a region
   */
  public applyFade(regionId: string, fadeIn: number, fadeOut: number): AudioRegion | null {
    const region = this.regions.get(regionId);
    if (!region) {
      return null;
    }

    const oldFadeIn = region.fadeIn;
    const oldFadeOut = region.fadeOut;

    region.fadeIn = fadeIn;
    region.fadeOut = fadeOut;

    // Add operation to undo stack
    this.addEditOperation({
      type: 'fade',
      regionId,
      parameters: { oldFadeIn, oldFadeOut, newFadeIn: fadeIn, newFadeOut: fadeOut },
      timestamp: Date.now(),
    });

    return region;
  }

  /**
   * Apply crossfade between two regions
   */
  public applyCrossfade(
    regionId1: string,
    regionId2: string,
    duration: number,
    curve: 'linear' | 'equal-power' | 'exponential' = 'equal-power'
  ): boolean {
    const region1 = this.regions.get(regionId1);
    const region2 = this.regions.get(regionId2);

    if (!region1 || !region2) {
      return false;
    }

    // Add crossfade to both regions
    if (!region1.crossfadeRegions) {
      region1.crossfadeRegions = [];
    }
    if (!region2.crossfadeRegions) {
      region2.crossfadeRegions = [];
    }

    region1.crossfadeRegions.push({
      regionId: regionId2,
      duration,
      curve,
    });

    region2.crossfadeRegions.push({
      regionId: regionId1,
      duration,
      curve,
    });

    // Add operation to undo stack
    this.addEditOperation({
      type: 'crossfade',
      regionId: regionId1,
      parameters: { targetRegionId: regionId2, duration, curve },
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Join adjacent regions
   */
  public joinRegions(regionId1: string, regionId2: string): AudioRegion | null {
    const region1 = this.regions.get(regionId1);
    const region2 = this.regions.get(regionId2);

    if (!region1 || !region2) {
      return null;
    }

    // Check if regions are adjacent
    const endTime1 = region1.startTime + region1.duration;
    if (Math.abs(endTime1 - region2.startTime) > 1) {
      // Allow 1ms tolerance
      return null;
    }

    // Create joined region
    const joinedRegion: AudioRegion = {
      ...region1,
      id: `joined_${Date.now()}`,
      duration: region1.duration + region2.duration,
      crossfadeRegions: undefined,
    };

    // Add operation to undo stack
    this.addEditOperation({
      type: 'split', // Using split type as inverse operation
      regionId: joinedRegion.id,
      parameters: { splitTime: endTime1, leftRegionId: regionId1, rightRegionId: regionId2 },
      timestamp: Date.now(),
    });

    // Remove original regions and add joined one
    this.regions.delete(regionId1);
    this.regions.delete(regionId2);
    this.regions.set(joinedRegion.id, joinedRegion);

    return joinedRegion;
  }

  /**
   * Set zoom level
   */
  public setZoomLevel(zoomLevel: number): void {
    this.editState.zoomLevel = Math.max(1, zoomLevel);
  }

  /**
   * Get zoom level
   */
  public getZoomLevel(): number {
    return this.editState.zoomLevel;
  }

  /**
   * Set scroll position
   */
  public setScrollPosition(position: number): void {
    this.editState.scrollPosition = Math.max(0, position);
  }

  /**
   * Get scroll position
   */
  public getScrollPosition(): number {
    return this.editState.scrollPosition;
  }

  /**
   * Set editing mode
   */
  public setEditingMode(mode: WaveformEditState['editingMode']): void {
    this.editState.editingMode = mode;
  }

  /**
   * Get editing mode
   */
  public getEditingMode(): WaveformEditState['editingMode'] {
    return this.editState.editingMode;
  }

  /**
   * Enable/disable snap to grid
   */
  public setSnapToGrid(enabled: boolean): void {
    this.editState.snapToGrid = enabled;
  }

  /**
   * Set grid resolution
   */
  public setGridResolution(resolution: number): void {
    this.editState.gridResolution = resolution;
  }

  /**
   * Snap a time value to grid if enabled
   */
  public snapToGrid(time: number): number {
    if (!this.editState.snapToGrid) {
      return time;
    }

    const resolution = this.editState.gridResolution;
    return Math.round(time / resolution) * resolution;
  }

  /**
   * Undo last operation
   */
  public undo(): boolean {
    const operation = this.editState.undoStack.pop();
    if (!operation) {
      return false;
    }

    // Add to redo stack
    this.editState.redoStack.push(operation);

    // Execute inverse operation based on type
    switch (operation.type) {
      case 'split':
        // Inverse: join the split regions
        this.joinRegions(operation.parameters.leftRegionId, operation.parameters.rightRegionId);
        break;
      case 'trim':
        // Inverse: restore original trim
        const trimRegion = this.regions.get(operation.regionId);
        if (trimRegion) {
          trimRegion.startTime = operation.parameters.oldStartTime;
          trimRegion.duration = operation.parameters.oldDuration;
        }
        break;
      case 'delete':
        // Inverse: restore deleted region
        this.regions.set(operation.regionId, operation.parameters.region);
        break;
      case 'move':
        // Inverse: move back to original position
        const moveRegion = this.regions.get(operation.regionId);
        if (moveRegion) {
          moveRegion.startTime = operation.parameters.oldStartTime;
        }
        break;
      case 'resize':
        // Inverse: restore original size
        const resizeRegion = this.regions.get(operation.regionId);
        if (resizeRegion) {
          resizeRegion.duration = operation.parameters.oldDuration;
        }
        break;
      case 'fade':
        // Inverse: restore original fade
        const fadeRegion = this.regions.get(operation.regionId);
        if (fadeRegion) {
          fadeRegion.fadeIn = operation.parameters.oldFadeIn;
          fadeRegion.fadeOut = operation.parameters.oldFadeOut;
        }
        break;
      case 'crossfade':
        // Inverse: remove crossfade
        const crossRegion1 = this.regions.get(operation.regionId);
        const crossRegion2 = this.regions.get(operation.parameters.targetRegionId);
        if (crossRegion1 && crossRegion1.crossfadeRegions) {
          crossRegion1.crossfadeRegions = crossRegion1.crossfadeRegions.filter(
            (cf) => cf.regionId !== operation.parameters.targetRegionId
          );
        }
        if (crossRegion2 && crossRegion2.crossfadeRegions) {
          crossRegion2.crossfadeRegions = crossRegion2.crossfadeRegions.filter(
            (cf) => cf.regionId !== operation.regionId
          );
        }
        break;
    }

    return true;
  }

  /**
   * Redo last undone operation
   */
  public redo(): boolean {
    const operation = this.editState.redoStack.pop();
    if (!operation) {
      return false;
    }

    // Add back to undo stack
    this.editState.undoStack.push(operation);

    // Re-execute the operation
    switch (operation.type) {
      case 'split':
        this.splitRegion(operation.regionId, operation.parameters.splitTime);
        break;
      case 'trim':
        this.trimRegion(
          operation.regionId,
          operation.parameters.newStartTime,
          operation.parameters.newDuration
        );
        break;
      case 'delete':
        this.deleteRegion(operation.regionId);
        break;
      case 'move':
        this.moveRegion(operation.regionId, operation.parameters.newStartTime);
        break;
      case 'resize':
        this.resizeRegion(operation.regionId, operation.parameters.newDuration);
        break;
      case 'fade':
        this.applyFade(
          operation.regionId,
          operation.parameters.newFadeIn,
          operation.parameters.newFadeOut
        );
        break;
      case 'crossfade':
        this.applyCrossfade(
          operation.regionId,
          operation.parameters.targetRegionId,
          operation.parameters.duration,
          operation.parameters.curve
        );
        break;
    }

    return true;
  }

  /**
   * Check if undo is available
   */
  public canUndo(): boolean {
    return this.editState.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  public canRedo(): boolean {
    return this.editState.redoStack.length > 0;
  }

  /**
   * Clear undo/redo stacks
   */
  public clearHistory(): void {
    this.editState.undoStack = [];
    this.editState.redoStack = [];
  }

  /**
   * Add edit operation to undo stack
   */
  private addEditOperation(operation: EditOperation): void {
    this.editState.undoStack.push(operation);
    this.editState.redoStack = []; // Clear redo stack on new operation

    // Limit stack size to prevent memory issues
    if (this.editState.undoStack.length > 100) {
      this.editState.undoStack.shift();
    }
  }

  /**
   * Cache waveform data for a region
   */
  public cacheWaveformData(regionId: string, waveformData: WaveformDisplayData): void {
    this.waveformCache.set(regionId, waveformData);
  }

  /**
   * Get cached waveform data
   */
  public getCachedWaveformData(regionId: string): WaveformDisplayData | undefined {
    return this.waveformCache.get(regionId);
  }

  /**
   * Clear waveform cache
   */
  public clearWaveformCache(): void {
    this.waveformCache.clear();
  }

  /**
   * Get edit state
   */
  public getEditState(): WaveformEditState {
    return { ...this.editState };
  }

  /**
   * Get all regions
   */
  public getAllRegions(): AudioRegion[] {
    return Array.from(this.regions.values());
  }

  /**
   * Select samples in a region for precise editing
   */
  public selectSamples(regionId: string, startSample: number, endSample: number): void {
    const region = this.regions.get(regionId);
    if (!region) return;

    this.editState.sampleSelection = {
      startSample,
      endSample,
      active: true,
    };
  }

  /**
   * Clear sample selection
   */
  public clearSampleSelection(): void {
    this.editState.sampleSelection = null;
  }

  /**
   * Get sample selection
   */
  public getSampleSelection(): {
    startSample: number;
    endSample: number;
    active: boolean;
  } | null {
    return this.editState.sampleSelection;
  }

  /**
   * Delete selected samples (sample-level editing)
   */
  public deleteSelectedSamples(regionId: string, audioBuffer: AudioBuffer): AudioBuffer | null {
    if (!this.audioContext || !this.editState.sampleSelection?.active) {
      return null;
    }

    const region = this.regions.get(regionId);
    if (!region) return null;

    const { startSample, endSample } = this.editState.sampleSelection;
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;

    // Calculate new buffer length
    const samplesToDelete = endSample - startSample;
    const newLength = audioBuffer.length - samplesToDelete;

    if (newLength <= 0) return null;

    // Create new buffer
    const newBuffer = this.audioContext.createBuffer(numChannels, newLength, sampleRate);

    // Copy samples before selection
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);

      // Copy samples before selection
      for (let i = 0; i < startSample; i++) {
        newChannelData[i] = channelData[i];
      }

      // Copy samples after selection
      for (let i = endSample; i < audioBuffer.length; i++) {
        newChannelData[i - samplesToDelete] = channelData[i];
      }
    }

    // Update region duration
    region.duration = newLength / sampleRate;

    // Clear selection
    this.clearSampleSelection();

    return newBuffer;
  }

  /**
   * Cut selected samples to clipboard
   */
  public cutSelectedSamples(
    regionId: string,
    audioBuffer: AudioBuffer
  ): {
    cutBuffer: AudioBuffer;
    remainingBuffer: AudioBuffer;
  } | null {
    if (!this.audioContext || !this.editState.sampleSelection?.active) {
      return null;
    }

    const region = this.regions.get(regionId);
    if (!region) return null;

    const { startSample, endSample } = this.editState.sampleSelection;
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const samplesToCut = endSample - startSample;

    // Create cut buffer
    const cutBuffer = this.audioContext.createBuffer(numChannels, samplesToCut, sampleRate);

    // Create remaining buffer
    const remainingLength = audioBuffer.length - samplesToCut;
    const remainingBuffer = this.audioContext.createBuffer(
      numChannels,
      remainingLength,
      sampleRate
    );

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const cutChannelData = cutBuffer.getChannelData(channel);
      const remainingChannelData = remainingBuffer.getChannelData(channel);

      // Copy selected samples to cut buffer
      for (let i = 0; i < samplesToCut; i++) {
        cutChannelData[i] = channelData[startSample + i];
      }

      // Copy samples before selection
      for (let i = 0; i < startSample; i++) {
        remainingChannelData[i] = channelData[i];
      }

      // Copy samples after selection
      for (let i = endSample; i < audioBuffer.length; i++) {
        remainingChannelData[i - samplesToCut] = channelData[i];
      }
    }

    // Update region duration
    region.duration = remainingLength / sampleRate;

    // Clear selection
    this.clearSampleSelection();

    return { cutBuffer, remainingBuffer };
  }

  /**
   * Copy selected samples to clipboard
   */
  public copySelectedSamples(audioBuffer: AudioBuffer): AudioBuffer | null {
    if (!this.audioContext || !this.editState.sampleSelection?.active) {
      return null;
    }

    const { startSample, endSample } = this.editState.sampleSelection;
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const samplesToCopy = endSample - startSample;

    // Create copy buffer
    const copyBuffer = this.audioContext.createBuffer(numChannels, samplesToCopy, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const copyChannelData = copyBuffer.getChannelData(channel);

      // Copy selected samples
      for (let i = 0; i < samplesToCopy; i++) {
        copyChannelData[i] = channelData[startSample + i];
      }
    }

    return copyBuffer;
  }

  /**
   * Paste samples at cursor position
   */
  public pasteSamples(
    regionId: string,
    audioBuffer: AudioBuffer,
    pasteBuffer: AudioBuffer,
    pasteSample: number
  ): AudioBuffer | null {
    if (!this.audioContext) return null;

    const region = this.regions.get(regionId);
    if (!region) return null;

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;

    // Calculate new buffer length
    const newLength = audioBuffer.length + pasteBuffer.length;

    // Create new buffer
    const newBuffer = this.audioContext.createBuffer(numChannels, newLength, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const pasteChannelData = pasteBuffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);

      // Copy samples before paste position
      for (let i = 0; i < pasteSample; i++) {
        newChannelData[i] = channelData[i];
      }

      // Paste samples
      for (let i = 0; i < pasteBuffer.length; i++) {
        newChannelData[pasteSample + i] = pasteChannelData[i];
      }

      // Copy samples after paste position
      for (let i = pasteSample; i < audioBuffer.length; i++) {
        newChannelData[pasteBuffer.length + i] = channelData[i];
      }
    }

    // Update region duration
    region.duration = newLength / sampleRate;

    return newBuffer;
  }

  /**
   * Silence selected samples
   */
  public silenceSelectedSamples(regionId: string, audioBuffer: AudioBuffer): AudioBuffer | null {
    if (!this.audioContext || !this.editState.sampleSelection?.active) {
      return null;
    }

    const region = this.regions.get(regionId);
    if (!region) return null;

    const { startSample, endSample } = this.editState.sampleSelection;
    const numChannels = audioBuffer.numberOfChannels;

    // Create new buffer (same length)
    const newBuffer = this.audioContext.createBuffer(
      numChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);

      // Copy all samples
      for (let i = 0; i < audioBuffer.length; i++) {
        newChannelData[i] = channelData[i];
      }

      // Silence selected range
      for (let i = startSample; i < endSample; i++) {
        newChannelData[i] = 0;
      }
    }

    // Clear selection
    this.clearSampleSelection();

    return newBuffer;
  }

  /**
   * Normalize selected samples
   */
  public normalizeSelectedSamples(
    regionId: string,
    audioBuffer: AudioBuffer,
    targetLevel: number = 0.0 // dB
  ): AudioBuffer | null {
    if (!this.audioContext || !this.editState.sampleSelection?.active) {
      return null;
    }

    const region = this.regions.get(regionId);
    if (!region) return null;

    const { startSample, endSample } = this.editState.sampleSelection;
    const numChannels = audioBuffer.numberOfChannels;

    // Find peak in selection
    let peak = 0;
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = startSample; i < endSample; i++) {
        const absValue = Math.abs(channelData[i]);
        if (absValue > peak) peak = absValue;
      }
    }

    if (peak === 0) return null; // Silent selection

    // Calculate gain factor
    const targetAmplitude = Math.pow(10, targetLevel / 20);
    const gainFactor = targetAmplitude / peak;

    // Create new buffer
    const newBuffer = this.audioContext.createBuffer(
      numChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);

      // Copy all samples
      for (let i = 0; i < audioBuffer.length; i++) {
        newChannelData[i] = channelData[i];
      }

      // Normalize selected range
      for (let i = startSample; i < endSample; i++) {
        newChannelData[i] *= gainFactor;
      }
    }

    // Clear selection
    this.clearSampleSelection();

    return newBuffer;
  }

  /**
   * Reverse selected samples
   */
  public reverseSelectedSamples(regionId: string, audioBuffer: AudioBuffer): AudioBuffer | null {
    if (!this.audioContext || !this.editState.sampleSelection?.active) {
      return null;
    }

    const region = this.regions.get(regionId);
    if (!region) return null;

    const { startSample, endSample } = this.editState.sampleSelection;
    const numChannels = audioBuffer.numberOfChannels;

    // Create new buffer
    const newBuffer = this.audioContext.createBuffer(
      numChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);

      // Copy all samples
      for (let i = 0; i < audioBuffer.length; i++) {
        newChannelData[i] = channelData[i];
      }

      // Reverse selected range
      const selectionLength = endSample - startSample;
      for (let i = 0; i < selectionLength; i++) {
        newChannelData[startSample + i] = channelData[endSample - 1 - i];
      }
    }

    // Clear selection
    this.clearSampleSelection();

    return newBuffer;
  }

  /**
   * Clear all regions
   */
  public clearRegions(): void {
    this.regions.clear();
  }

  /**
   * Get region statistics
   */
  public getRegionStatistics(trackId: string): {
    totalRegions: number;
    totalDuration: number;
    selectedRegion: string | null;
    gaps: number[];
  } {
    const trackRegions = this.getTrackRegions(trackId);
    const totalRegions = trackRegions.length;
    const totalDuration = trackRegions.reduce((sum, region) => sum + region.duration, 0);
    const selectedRegion = this.editState.selectedRegionId;

    // Find gaps between regions
    const gaps: number[] = [];
    for (let i = 0; i < trackRegions.length - 1; i++) {
      const currentEnd = trackRegions[i].startTime + trackRegions[i].duration;
      const nextStart = trackRegions[i + 1].startTime;
      if (nextStart > currentEnd) {
        gaps.push(nextStart - currentEnd);
      }
    }

    return {
      totalRegions,
      totalDuration,
      selectedRegion,
      gaps,
    };
  }
}

// Export singleton instance
export const waveformEditor = new WaveformEditor();
