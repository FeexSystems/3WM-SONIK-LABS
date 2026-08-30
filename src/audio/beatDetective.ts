// 3WM SONIK - Beat Detective and Tempo Mapping
// Industry-standard beat detection, tempo analysis, and audio warping

export interface Transient {
  time: number; // in seconds
  amplitude: number;
  confidence: number;
}

export interface BeatPattern {
  beats: number[]; // beat times in seconds
  tempo: number; // BPM
  confidence: number;
  timeSignature: [number, number]; // [numerator, denominator]
}

export interface TempoMap {
  points: Array<{
    time: number; // in seconds
    tempo: number; // BPM
    timeSignature: [number, number];
  }>;
}

export interface WarpMarker {
  sourceTime: number; // Original audio time
  targetTime: number; // Warped time
  strength: number; // 0-1
}

export class BeatDetective {
  private sampleRate: number;
  private audioContext: AudioContext | null = null;

  constructor(sampleRate: number = 48000, audioContext?: AudioContext) {
    this.sampleRate = sampleRate;
    this.audioContext = audioContext || null;
  }

  /**
   * Detect transients in audio buffer
   */
  public detectTransients(
    audioBuffer: AudioBuffer,
    sensitivity: number = 0.5,
    minTransientInterval: number = 0.05 // minimum 50ms between transients
  ): Transient[] {
    const channelData = audioBuffer.getChannelData(0);
    const transients: Transient[] = [];
    const windowSize = Math.floor(this.sampleRate * 0.01); // 10ms window
    const threshold = sensitivity * 0.3;

    let previousEnergy = 0;
    let lastTransientTime = -minTransientInterval;

    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += Math.abs(channelData[i + j]);
      }
      energy /= windowSize;

      const time = i / this.sampleRate;
      const energyIncrease = energy - previousEnergy;

      // Detect transient if energy increases significantly
      if (
        energy > threshold &&
        energyIncrease > 0.1 &&
        time - lastTransientTime >= minTransientInterval
      ) {
        // Refine transient position using zero-crossing
        const refinedPosition = this.refineTransientPosition(channelData, i);
        const refinedTime = refinedPosition / this.sampleRate;

        transients.push({
          time: refinedTime,
          amplitude: energy,
          confidence: Math.min(1, energyIncrease / 0.5),
        });

        lastTransientTime = refinedTime;
      }

      previousEnergy = energy;
    }

    return transients;
  }

  /**
   * Refine transient position using zero-crossing detection
   */
  private refineTransientPosition(channelData: Float32Array, approximateIndex: number): number {
    const searchWindow = 100; // samples to search
    const start = Math.max(0, approximateIndex - searchWindow);
    const end = Math.min(channelData.length, approximateIndex + searchWindow);

    for (let i = start; i < end - 1; i++) {
      // Check for zero-crossing (sign change)
      if (
        (channelData[i] >= 0 && channelData[i + 1] < 0) ||
        (channelData[i] <= 0 && channelData[i + 1] > 0)
      ) {
        return i;
      }
    }

    return approximateIndex;
  }

  /**
   * Analyze beat pattern from transients
   */
  public analyzeBeatPattern(
    transients: Transient[],
    expectedTempoRange: [number, number] = [60, 180]
  ): BeatPattern {
    if (transients.length < 4) {
      return {
        beats: transients.map((t) => t.time),
        tempo: 120,
        confidence: 0,
        timeSignature: [4, 4],
      };
    }

    // Calculate intervals between transients
    const intervals: number[] = [];
    for (let i = 1; i < transients.length; i++) {
      intervals.push(transients[i].time - transients[i - 1].time);
    }

    // Find most common interval (likely the beat duration)
    const intervalHistogram = new Map<number, number>();
    for (const interval of intervals) {
      const rounded = Math.round(interval * 1000) / 1000; // Round to ms
      intervalHistogram.set(rounded, (intervalHistogram.get(rounded) || 0) + 1);
    }

    let bestInterval = 0.5; // Default 120 BPM
    let bestCount = 0;
    for (const [interval, count] of intervalHistogram) {
      if (count > bestCount) {
        bestCount = count;
        bestInterval = interval;
      }
    }

    // Calculate tempo from interval
    let tempo = 60 / bestInterval;

    // Check for octave errors (tempo could be half or double)
    if (tempo < expectedTempoRange[0]) {
      tempo *= 2;
    } else if (tempo > expectedTempoRange[1]) {
      tempo /= 2;
    }

    // Clamp to expected range
    tempo = Math.max(expectedTempoRange[0], Math.min(expectedTempoRange[1], tempo));

    // Group transients into beats based on detected tempo
    const beatDuration = 60 / tempo;
    const beats: number[] = [transients[0].time];

    for (let i = 1; i < transients.length; i++) {
      const expectedTime = beats[beats.length - 1] + beatDuration;
      const actualTime = transients[i].time;

      // If transient is close to expected beat time, add it
      if (Math.abs(actualTime - expectedTime) < beatDuration * 0.3) {
        beats.push(actualTime);
      }
    }

    // Estimate time signature based on beat groupings
    const timeSignature = this.estimateTimeSignature(beats, tempo);

    // Calculate confidence based on how well beats match expected timing
    let confidence = 0;
    for (let i = 1; i < beats.length; i++) {
      const interval = beats[i] - beats[i - 1];
      const deviation = Math.abs(interval - beatDuration) / beatDuration;
      confidence += Math.max(0, 1 - deviation * 2);
    }
    confidence /= Math.max(1, beats.length - 1);

    return {
      beats,
      tempo,
      confidence,
      timeSignature,
    };
  }

  /**
   * Estimate time signature from beat pattern
   */
  private estimateTimeSignature(beats: number[], tempo: number): [number, number] {
    if (beats.length < 8) return [4, 4];

    // Look for patterns in accent/transient strength
    const barDuration = 4 * (60 / tempo); // Assume 4/4 initially
    const bars: number[][] = [];

    let currentBar: number[] = [];
    let barStartTime = beats[0];

    for (const beat of beats) {
      if (beat - barStartTime >= barDuration) {
        bars.push(currentBar);
        currentBar = [];
        barStartTime = beat;
      }
      currentBar.push(beat);
    }

    if (currentBar.length > 0) {
      bars.push(currentBar);
    }

    // Count beats per bar
    const beatsPerBar = bars.map((bar) => bar.length);
    const mostCommon = this.getMostCommon(beatsPerBar);

    // Map to time signature
    switch (mostCommon) {
      case 3:
        return [3, 4];
      case 4:
        return [4, 4];
      case 6:
        return [6, 8];
      case 7:
        return [7, 8];
      default:
        return [4, 4];
    }
  }

  /**
   * Get most common value in array
   */
  private getMostCommon(arr: number[]): number {
    const counts = new Map<number, number>();
    for (const val of arr) {
      counts.set(val, (counts.get(val) || 0) + 1);
    }

    let bestVal = arr[0];
    let bestCount = 0;
    for (const [val, count] of counts) {
      if (count > bestCount) {
        bestCount = count;
        bestVal = val;
      }
    }

    return bestVal;
  }

  /**
   * Create tempo map from beat pattern
   */
  public createTempoMap(beatPattern: BeatPattern): TempoMap {
    const points: TempoMap['points'] = [];

    // Start with initial tempo
    points.push({
      time: 0,
      tempo: beatPattern.tempo,
      timeSignature: beatPattern.timeSignature,
    });

    // Add tempo changes if detected (simplified - in reality would analyze tempo drift)
    // For now, assume constant tempo
    if (beatPattern.beats.length > 0) {
      points.push({
        time: beatPattern.beats[beatPattern.beats.length - 1],
        tempo: beatPattern.tempo,
        timeSignature: beatPattern.timeSignature,
      });
    }

    return { points };
  }

  /**
   * Create warp markers from beat pattern
   */
  public createWarpMarkers(beatPattern: BeatPattern, targetTempo: number): WarpMarker[] {
    const markers: WarpMarker[] = [];
    const beatDuration = 60 / targetTempo;

    for (let i = 0; i < beatPattern.beats.length; i++) {
      markers.push({
        sourceTime: beatPattern.beats[i],
        targetTime: i * beatDuration,
        strength: 0.8, // Default strength
      });
    }

    return markers;
  }

  /**
   * Warp audio buffer to match tempo using warp markers
   */
  public warpAudio(
    audioBuffer: AudioBuffer,
    warpMarkers: WarpMarker[],
    audioContext: AudioContext,
    algorithm: 'time-domain' | 'phase-vocoder' = 'phase-vocoder'
  ): AudioBuffer | null {
    if (!audioBuffer || warpMarkers.length < 2) return null;

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;

    // Calculate time stretch ratio based on first and last markers
    const sourceDuration =
      warpMarkers[warpMarkers.length - 1].sourceTime - warpMarkers[0].sourceTime;
    const targetDuration =
      warpMarkers[warpMarkers.length - 1].targetTime - warpMarkers[0].targetTime;
    const stretchRatio = targetDuration / sourceDuration;

    // Create new buffer with stretched duration
    const newLength = Math.floor(audioBuffer.length * stretchRatio);
    const newBuffer = audioContext.createBuffer(numChannels, newLength, sampleRate);

    if (algorithm === 'time-domain') {
      // Simple time-domain stretching (linear interpolation)
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const newChannelData = newBuffer.getChannelData(channel);

        for (let i = 0; i < newLength; i++) {
          const sourceIndex = i / stretchRatio;
          const indexFloor = Math.floor(sourceIndex);
          const indexCeil = Math.min(channelData.length - 1, indexFloor + 1);
          const fraction = sourceIndex - indexFloor;

          // Linear interpolation
          newChannelData[i] =
            channelData[indexFloor] * (1 - fraction) + channelData[indexCeil] * fraction;
        }
      }
    } else {
      // Phase-vocoder stretching (simplified - would need FFT for proper implementation)
      // For now, use time-domain as fallback
      return this.warpAudio(audioBuffer, warpMarkers, audioContext, 'time-domain');
    }

    return newBuffer;
  }

  /**
   * Quantize audio to grid using beat pattern
   */
  public quantizeAudio(
    audioBuffer: AudioBuffer,
    beatPattern: BeatPattern,
    audioContext: AudioContext,
    quantizeStrength: number = 1.0 // 0 = no quantization, 1 = full quantization
  ): AudioBuffer | null {
    if (!audioBuffer || beatPattern.beats.length < 2) return null;

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const beatDuration = 60 / beatPattern.tempo;

    // Create new buffer
    const newBuffer = audioContext.createBuffer(numChannels, audioBuffer.length, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);

      // Copy samples with time shift for quantization
      for (let i = 0; i < channelData.length; i++) {
        const time = i / sampleRate;

        // Find nearest beat
        let nearestBeat = 0;
        let minDistance = Infinity;

        for (const beat of beatPattern.beats) {
          const distance = Math.abs(time - beat);
          if (distance < minDistance) {
            minDistance = distance;
            nearestBeat = beat;
          }
        }

        // Calculate quantized position
        const quantizedTime = time + (nearestBeat - time) * quantizeStrength;
        const quantizedIndex = Math.floor(quantizedTime * sampleRate);

        // Copy sample to quantized position
        if (quantizedIndex >= 0 && quantizedIndex < newChannelData.length) {
          newChannelData[quantizedIndex] = channelData[i];
        }
      }
    }

    return newBuffer;
  }

  /**
   * Extract groove from audio
   */
  public extractGroove(audioBuffer: AudioBuffer, beatPattern: BeatPattern): number[] {
    const transients = this.detectTransients(audioBuffer, 0.5, 0.05);
    const groove: number[] = [];
    const beatDuration = 60 / beatPattern.tempo;

    // Calculate deviation from grid for each beat
    for (let i = 0; i < Math.min(transients.length, beatPattern.beats.length); i++) {
      const expectedTime = i * beatDuration;
      const actualTime = transients[i].time;
      const deviation = actualTime - expectedTime;
      groove.push(deviation);
    }

    return groove;
  }

  /**
   * Apply groove to audio
   */
  public applyGroove(
    audioBuffer: AudioBuffer,
    groove: number[],
    beatPattern: BeatPattern,
    audioContext: AudioContext,
    strength: number = 1.0
  ): AudioBuffer | null {
    if (!audioBuffer || groove.length === 0) return null;

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const beatDuration = 60 / beatPattern.tempo;

    // Create new buffer
    const newBuffer = audioContext.createBuffer(numChannels, audioBuffer.length, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const newChannelData = newBuffer.getChannelData(channel);

      for (let i = 0; i < channelData.length; i++) {
        const time = i / sampleRate;
        const beatIndex = Math.floor(time / beatDuration);

        if (beatIndex < groove.length) {
          const grooveOffset = groove[beatIndex] * strength;
          const newTime = time + grooveOffset;
          const newIndex = Math.floor(newTime * sampleRate);

          if (newIndex >= 0 && newIndex < newChannelData.length) {
            newChannelData[newIndex] = channelData[i];
          }
        } else {
          newChannelData[i] = channelData[i];
        }
      }
    }

    return newBuffer;
  }

  /**
   * Analyze audio for tempo changes
   */
  public analyzeTempoChanges(audioBuffer: AudioBuffer, windowSize: number = 4): TempoMap {
    const transients = this.detectTransients(audioBuffer, 0.5, 0.05);
    const points: TempoMap['points'] = [];
    const duration = audioBuffer.duration;

    // Analyze tempo in windows
    for (let time = 0; time < duration; time += windowSize) {
      const windowTransients = transients.filter(
        (t) => t.time >= time && t.time < time + windowSize
      );

      if (windowTransients.length >= 4) {
        const beatPattern = this.analyzeBeatPattern(windowTransients);
        points.push({
          time,
          tempo: beatPattern.tempo,
          timeSignature: beatPattern.timeSignature,
        });
      }
    }

    // Add final point
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      if (lastPoint.time < duration) {
        points.push({
          time: duration,
          tempo: lastPoint.tempo,
          timeSignature: lastPoint.timeSignature,
        });
      }
    }

    return { points };
  }

  /**
   * Smooth tempo map
   */
  public smoothTempoMap(tempoMap: TempoMap, smoothingFactor: number = 0.5): TempoMap {
    if (tempoMap.points.length < 2) return tempoMap;

    const smoothedPoints = [...tempoMap.points];

    for (let i = 1; i < smoothedPoints.length - 1; i++) {
      const prevTempo = smoothedPoints[i - 1].tempo;
      const currentTempo = smoothedPoints[i].tempo;
      const nextTempo = smoothedPoints[i + 1].tempo;

      // Apply smoothing
      smoothedPoints[i].tempo =
        currentTempo * (1 - smoothingFactor) + ((prevTempo + nextTempo) / 2) * smoothingFactor;
    }

    return { points: smoothedPoints };
  }
}
