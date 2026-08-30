/**
 * 3WM SONIK — Parameter Automation System
 * Enables recording and playback of DSP parameter automation from UI controls
 */

export interface AutomationPoint {
  time: number; // Time in seconds
  value: number;
}

export interface AutomationLane {
  parameter: string; // e.g., 'eq.low', 'compression.threshold'
  points: AutomationPoint[];
  interpolation: 'linear' | 'hold' | 'curve';
}

export interface AutomationClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  lanes: Map<string, AutomationLane>;
  isArmed: boolean;
  isRecording: boolean;
  isPlaying: boolean;
}

export class ParameterAutomation {
  private clips: Map<string, AutomationClip> = new Map();
  private activeClipId: string | null = null;
  private playbackStartTime: number = 0;
  private animationFrameId: number | null = null;
  private onParameterUpdate: ((parameter: string, value: number) => void) | null = null;

  constructor() {
    this.startPlaybackLoop();
  }

  /**
   * Create a new automation clip
   */
  public createClip(id: string, name: string, startTime: number, duration: number): AutomationClip {
    const clip: AutomationClip = {
      id,
      name,
      startTime,
      duration,
      lanes: new Map(),
      isArmed: false,
      isRecording: false,
      isPlaying: false,
    };
    this.clips.set(id, clip);
    return clip;
  }

  /**
   * Get a clip by ID
   */
  public getClip(id: string): AutomationClip | undefined {
    return this.clips.get(id);
  }

  /**
   * Delete a clip
   */
  public deleteClip(id: string): void {
    this.clips.delete(id);
    if (this.activeClipId === id) {
      this.activeClipId = null;
    }
  }

  /**
   * Set the active clip for recording/playback
   */
  public setActiveClip(id: string | null): void {
    this.activeClipId = id;
  }

  /**
   * Get the active clip
   */
  public getActiveClip(): AutomationClip | undefined {
    return this.activeClipId ? this.clips.get(this.activeClipId) : undefined;
  }

  /**
   * Arm a clip for recording
   */
  public armClip(id: string, armed: boolean): void {
    const clip = this.clips.get(id);
    if (clip) {
      clip.isArmed = armed;
      if (armed) {
        clip.lanes.clear(); // Clear existing lanes when arming
      }
    }
  }

  /**
   * Start recording on the active clip
   */
  public startRecording(): void {
    const clip = this.getActiveClip();
    if (clip && clip.isArmed) {
      clip.isRecording = true;
      this.playbackStartTime = performance.now();
    }
  }

  /**
   * Stop recording
   */
  public stopRecording(): void {
    const clip = this.getActiveClip();
    if (clip) {
      clip.isRecording = false;
    }
  }

  /**
   * Record a parameter value at the current time
   */
  public recordParameter(parameter: string, value: number): void {
    const clip = this.getActiveClip();
    if (!clip || !clip.isRecording) return;

    const currentTime = (performance.now() - this.playbackStartTime) / 1000;

    let lane = clip.lanes.get(parameter);
    if (!lane) {
      lane = {
        parameter,
        points: [],
        interpolation: 'linear',
      };
      clip.lanes.set(parameter, lane);
    }

    // Add point (remove nearby points to avoid clutter)
    lane.points = lane.points.filter((p) => Math.abs(p.time - currentTime) > 0.01);
    lane.points.push({ time: currentTime, value });
    lane.points.sort((a, b) => a.time - b.time);
  }

  /**
   * Start playback of the active clip
   */
  public startPlayback(): void {
    const clip = this.getActiveClip();
    if (clip && clip.lanes.size > 0) {
      clip.isPlaying = true;
      this.playbackStartTime = performance.now();
    }
  }

  /**
   * Stop playback
   */
  public stopPlayback(): void {
    const clip = this.getActiveClip();
    if (clip) {
      clip.isPlaying = false;
    }
  }

  /**
   * Set the callback for parameter updates during playback
   */
  public setParameterUpdateCallback(callback: (parameter: string, value: number) => void): void {
    this.onParameterUpdate = callback;
  }

  /**
   * Playback loop - interpolates and applies parameter values
   */
  private startPlaybackLoop(): void {
    const loop = () => {
      const clip = this.getActiveClip();
      if (clip && clip.isPlaying && this.onParameterUpdate) {
        const currentTime = (performance.now() - this.playbackStartTime) / 1000;

        // Process each lane
        clip.lanes.forEach((lane) => {
          const value = this.interpolateValue(lane, currentTime);
          if (value !== null) {
            this.onParameterUpdate!(lane.parameter, value);
          }
        });

        // Stop at end of clip
        if (currentTime >= clip.duration) {
          this.stopPlayback();
        }
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Interpolate value at a given time from automation points
   */
  private interpolateValue(lane: AutomationLane, time: number): number | null {
    if (lane.points.length === 0) return null;

    // Before first point
    if (time < lane.points[0].time) {
      return lane.points[0].value;
    }

    // After last point
    if (time >= lane.points[lane.points.length - 1].time) {
      return lane.points[lane.points.length - 1].value;
    }

    // Find surrounding points
    for (let i = 0; i < lane.points.length - 1; i++) {
      const p1 = lane.points[i];
      const p2 = lane.points[i + 1];

      if (time >= p1.time && time < p2.time) {
        switch (lane.interpolation) {
          case 'linear':
            const t = (time - p1.time) / (p2.time - p1.time);
            return p1.value + (p2.value - p1.value) * t;
          case 'hold':
            return p1.value;
          case 'curve':
            const curveT = (time - p1.time) / (p2.time - p1.time);
            const smoothT = curveT * curveT * (3 - 2 * curveT); // Smoothstep
            return p1.value + (p2.value - p1.value) * smoothT;
        }
      }
    }

    return lane.points[lane.points.length - 1].value;
  }

  /**
   * Get all automation points for a parameter
   */
  public getAutomationPoints(clipId: string, parameter: string): AutomationPoint[] {
    const clip = this.clips.get(clipId);
    if (!clip) return [];
    const lane = clip.lanes.get(parameter);
    return lane ? lane.points : [];
  }

  /**
   * Clear automation for a parameter
   */
  public clearParameterAutomation(clipId: string, parameter: string): void {
    const clip = this.clips.get(clipId);
    if (clip) {
      clip.lanes.delete(parameter);
    }
  }

  /**
   * Set interpolation mode for a lane
   */
  public setInterpolationMode(
    clipId: string,
    parameter: string,
    mode: 'linear' | 'hold' | 'curve'
  ): void {
    const clip = this.clips.get(clipId);
    if (clip) {
      const lane = clip.lanes.get(parameter);
      if (lane) {
        lane.interpolation = mode;
      }
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.clips.clear();
  }
}

// Singleton instance
export const parameterAutomation = new ParameterAutomation();
