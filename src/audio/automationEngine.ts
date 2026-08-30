// 3WM SONIK - Professional Automation Engine
// Implements advanced automation with lanes, curves, and multiple modes

import { StemTrack, TrackSettings } from '../types';

export interface AutomationPoint {
  id: string;
  time: number; // in milliseconds
  value: number;
  curve: 'linear' | 'exponential' | 'logarithmic' | 's-curve';
  tension?: number; // for curve tension
}

export interface AutomationLane {
  id: string;
  trackId: string;
  parameter: string; // e.g., 'volume', 'pan', 'eq-low', 'compression-threshold'
  points: AutomationPoint[];
  mode: 'write' | 'latch' | 'touch' | 'read';
  isArmed: boolean;
  min: number;
  max: number;
  defaultValue: number;
}

export interface AutomationSnapshot {
  id: string;
  laneId: string;
  timestamp: number;
  state: AutomationLane;
}

export class AutomationEngine {
  private lanes: Map<string, AutomationLane> = new Map();
  private snapshots: Map<string, AutomationSnapshot[]> = new Map();
  private writeModeStartTime: number | null = null;
  private writeModeData: Map<string, AutomationPoint[]> = new Map();

  /**
   * Create an automation lane
   */
  public createLane(
    trackId: string,
    parameter: string,
    min: number,
    max: number,
    defaultValue: number
  ): AutomationLane {
    const lane: AutomationLane = {
      id: `automation_${trackId}_${parameter}_${Date.now()}`,
      trackId,
      parameter,
      points: [],
      mode: 'read',
      isArmed: false,
      min,
      max,
      defaultValue,
    };

    this.lanes.set(lane.id, lane);
    return lane;
  }

  /**
   * Get an automation lane
   */
  public getLane(laneId: string): AutomationLane | undefined {
    return this.lanes.get(laneId);
  }

  /**
   * Get all lanes for a track
   */
  public getTrackLanes(trackId: string): AutomationLane[] {
    return Array.from(this.lanes.values()).filter((lane) => lane.trackId === trackId);
  }

  /**
   * Add an automation point
   */
  public addPoint(
    laneId: string,
    time: number,
    value: number,
    curve: AutomationPoint['curve'] = 'linear'
  ): AutomationPoint | null {
    const lane = this.lanes.get(laneId);
    if (!lane) {
      return null;
    }

    // Clamp value to min/max range
    const clampedValue = Math.max(lane.min, Math.min(lane.max, value));

    const point: AutomationPoint = {
      id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      time,
      value: clampedValue,
      curve,
    };

    // Insert point in correct position (sorted by time)
    const insertIndex = lane.points.findIndex((p) => p.time > time);
    if (insertIndex === -1) {
      lane.points.push(point);
    } else {
      lane.points.splice(insertIndex, 0, point);
    }

    return point;
  }

  /**
   * Remove an automation point
   */
  public removePoint(laneId: string, pointId: string): boolean {
    const lane = this.lanes.get(laneId);
    if (!lane) {
      return false;
    }

    const index = lane.points.findIndex((p) => p.id === pointId);
    if (index === -1) {
      return false;
    }

    lane.points.splice(index, 1);
    return true;
  }

  /**
   * Update an automation point
   */
  public updatePoint(laneId: string, pointId: string, updates: Partial<AutomationPoint>): boolean {
    const lane = this.lanes.get(laneId);
    if (!lane) {
      return false;
    }

    const point = lane.points.find((p) => p.id === pointId);
    if (!point) {
      return false;
    }

    Object.assign(point, updates);

    // Re-sort if time was updated
    if (updates.time !== undefined) {
      lane.points.sort((a, b) => a.time - b.time);
    }

    return true;
  }

  /**
   * Get value at a specific time using interpolation
   */
  public getValueAtTime(laneId: string, time: number): number {
    const lane = this.lanes.get(laneId);
    if (!lane || lane.points.length === 0) {
      return lane?.defaultValue || 0;
    }

    // If no points, return default
    if (lane.points.length === 0) {
      return lane.defaultValue;
    }

    // If time is before first point, return first point value
    if (time <= lane.points[0].time) {
      return lane.points[0].value;
    }

    // If time is after last point, return last point value
    if (time >= lane.points[lane.points.length - 1].time) {
      return lane.points[lane.points.length - 1].value;
    }

    // Find surrounding points
    let lowerPoint = lane.points[0];
    let upperPoint = lane.points[lane.points.length - 1];

    for (let i = 0; i < lane.points.length - 1; i++) {
      if (lane.points[i].time <= time && lane.points[i + 1].time >= time) {
        lowerPoint = lane.points[i];
        upperPoint = lane.points[i + 1];
        break;
      }
    }

    // Interpolate between points
    return this.interpolate(lowerPoint, upperPoint, time);
  }

  /**
   * Interpolate between two points
   */
  private interpolate(p1: AutomationPoint, p2: AutomationPoint, time: number): number {
    const duration = p2.time - p1.time;
    if (duration === 0) {
      return p1.value;
    }

    const position = (time - p1.time) / duration;

    switch (p1.curve) {
      case 'linear':
        return p1.value + (p2.value - p1.value) * position;

      case 'exponential':
        return p1.value * Math.pow(p2.value / p1.value, position);

      case 'logarithmic':
        const logP1 = Math.log(p1.value);
        const logP2 = Math.log(p2.value);
        return Math.exp(logP1 + (logP2 - logP1) * position);

      case 's-curve':
        // Smooth step interpolation
        const smoothPosition = position * position * (3 - 2 * position);
        return p1.value + (p2.value - p1.value) * smoothPosition;

      default:
        return p1.value + (p2.value - p1.value) * position;
    }
  }

  /**
   * Set automation mode
   */
  public setMode(laneId: string, mode: AutomationLane['mode']): void {
    const lane = this.lanes.get(laneId);
    if (!lane) {
      return;
    }

    // Handle mode transitions
    if (lane.mode === 'write' && mode !== 'write') {
      // Exiting write mode - finalize automation
      this.finalizeWriteMode(laneId);
    }

    if (mode === 'write') {
      // Entering write mode
      this.writeModeStartTime = Date.now();
      this.writeModeData.set(laneId, []);
    }

    lane.mode = mode;
  }

  /**
   * Arm/disarm lane for writing
   */
  public setArm(laneId: string, armed: boolean): void {
    const lane = this.lanes.get(laneId);
    if (lane) {
      lane.isArmed = armed;
    }
  }

  /**
   * Record automation value (for write mode)
   */
  public recordValue(laneId: string, time: number, value: number): void {
    const lane = this.lanes.get(laneId);
    if (!lane || lane.mode !== 'write' || !lane.isArmed) {
      return;
    }

    const clampedValue = Math.max(lane.min, Math.min(lane.max, value));
    const recordedData = this.writeModeData.get(laneId) || [];

    recordedData.push({
      id: `recorded_${Date.now()}_${recordedData.length}`,
      time,
      value: clampedValue,
      curve: 'linear',
    });

    this.writeModeData.set(laneId, recordedData);
  }

  /**
   * Finalize write mode and apply recorded automation
   */
  private finalizeWriteMode(laneId: string): void {
    const recordedData = this.writeModeData.get(laneId);
    if (!recordedData || recordedData.length === 0) {
      return;
    }

    const lane = this.lanes.get(laneId);
    if (!lane) {
      return;
    }

    // Simplify recorded data (remove redundant points)
    const simplifiedData = this.simplifyAutomationData(recordedData);

    // Replace existing points with recorded data
    lane.points = simplifiedData;

    this.writeModeData.delete(laneId);
    this.writeModeStartTime = null;
  }

  /**
   * Simplify automation data by removing redundant points
   */
  private simplifyAutomationData(
    points: AutomationPoint[],
    tolerance: number = 0.01
  ): AutomationPoint[] {
    if (points.length === 0) {
      return points;
    }

    const simplified: AutomationPoint[] = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      const current = points[i];
      const next = points[i + 1];

      // Check if current point is redundant (linear interpolation would pass through it)
      const expectedValue =
        prev.value +
        (next.value - prev.value) * ((current.time - prev.time) / (next.time - prev.time));

      if (Math.abs(current.value - expectedValue) > tolerance) {
        simplified.push(current);
      }
    }

    simplified.push(points[points.length - 1]);
    return simplified;
  }

  /**
   * Create snapshot of automation state
   */
  public createSnapshot(laneId: string): string {
    const lane = this.lanes.get(laneId);
    if (!lane) {
      return '';
    }

    const snapshot: AutomationSnapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      laneId,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(lane)),
    };

    if (!this.snapshots.has(laneId)) {
      this.snapshots.set(laneId, []);
    }

    const snapshots = this.snapshots.get(laneId)!;
    snapshots.push(snapshot);

    // Limit snapshots to prevent memory issues
    if (snapshots.length > 50) {
      snapshots.shift();
    }

    return snapshot.id;
  }

  /**
   * Restore snapshot
   */
  public restoreSnapshot(laneId: string, snapshotId: string): boolean {
    const snapshots = this.snapshots.get(laneId);
    if (!snapshots) {
      return false;
    }

    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) {
      return false;
    }

    const lane = this.lanes.get(laneId);
    if (!lane) {
      return false;
    }

    // Restore state
    Object.assign(lane, snapshot.state);
    return true;
  }

  /**
   * Clear automation lane
   */
  public clearLane(laneId: string): void {
    const lane = this.lanes.get(laneId);
    if (lane) {
      lane.points = [];
    }
  }

  /**
   * Delete automation lane
   */
  public deleteLane(laneId: string): boolean {
    return this.lanes.delete(laneId);
  }

  /**
   * Get automation statistics
   */
  public getStatistics(laneId: string): {
    totalPoints: number;
    timeRange: { start: number; end: number };
    valueRange: { min: number; max: number };
    mode: AutomationLane['mode'];
  } | null {
    const lane = this.lanes.get(laneId);
    if (!lane || lane.points.length === 0) {
      return null;
    }

    const times = lane.points.map((p) => p.time);
    const values = lane.points.map((p) => p.value);

    return {
      totalPoints: lane.points.length,
      timeRange: {
        start: Math.min(...times),
        end: Math.max(...times),
      },
      valueRange: {
        min: Math.min(...values),
        max: Math.max(...values),
      },
      mode: lane.mode,
    };
  }

  /**
   * Export automation as MIDI CC data
   */
  public exportToMIDI(laneId: string): { time: number; value: number }[] {
    const lane = this.lanes.get(laneId);
    if (!lane) {
      return [];
    }

    // Convert automation points to MIDI CC format
    // Values are normalized to 0-127 range
    const valueRange = lane.max - lane.min;

    return lane.points.map((point) => ({
      time: point.time,
      value: Math.round(((point.value - lane.min) / valueRange) * 127),
    }));
  }

  /**
   * Import automation from MIDI CC data
   */
  public importFromMIDI(laneId: string, midiData: { time: number; value: number }[]): void {
    const lane = this.lanes.get(laneId);
    if (!lane) {
      return;
    }

    // Clear existing points
    lane.points = [];

    // Convert MIDI CC values to automation range
    const valueRange = lane.max - lane.min;

    midiData.forEach((data) => {
      const normalizedValue = (data.value / 127) * valueRange + lane.min;
      this.addPoint(laneId, data.time, normalizedValue);
    });
  }

  /**
   * Get all lanes
   */
  public getAllLanes(): AutomationLane[] {
    return Array.from(this.lanes.values());
  }

  /**
   * Clear all lanes
   */
  public clearAllLanes(): void {
    this.lanes.clear();
    this.snapshots.clear();
    this.writeModeData.clear();
  }
}

// Export singleton instance
export const automationEngine = new AutomationEngine();
