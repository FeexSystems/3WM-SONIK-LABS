// 3WM SONIK - Kingpin (The Vocal Oracle) Vocal Intelligence
// Vocals, vocal arrangement, harmony, melody, performance expertise

export interface KingpinSuggestion {
  id: string;
  category: 'melody' | 'harmony' | 'arrangement' | 'performance' | 'lyrics' | 'vocal_fx';
  title: string;
  description: string;
  parameters: Record<string, any>;
  reasoning: string;
  confidence: number;
  emotionalImpact: number; // 0-1
}

export interface KingpinAnalysis {
  id: string;
  type: 'melodic' | 'harmonic' | 'rhythmic' | 'emotional' | 'performance';
  description: string;
  findings: Record<string, any>;
  suggestions: KingpinSuggestion[];
  confidence: number;
}

export class KingpinCapabilities {
  private analysisHistory: KingpinAnalysis[] = [];
  private suggestionHistory: KingpinSuggestion[] = [];
  private vocalTemplates: Map<string, any> = new Map();
  private harmonyLibrary: Map<string, any> = new Map();

  /**
   * Analyze melody and suggest improvements
   */
  public analyzeMelody(midiData: number[], key: string, scale: string[]): KingpinAnalysis {
    // Calculate melodic contour
    const contour = this.calculateMelodicContour(midiData);

    // Analyze interval patterns
    const intervals = this.analyzeIntervals(midiData);

    // Identify melodic motifs
    const motifs = this.identifyMotifs(midiData);

    // Generate suggestions
    const suggestions = this.generateMelodySuggestions(contour, intervals, motifs);

    const analysis: KingpinAnalysis = {
      id: `kingpin_melody_${Date.now()}`,
      type: 'melodic',
      description: 'Melodic analysis with vocal arrangement suggestions',
      findings: {
        contour,
        intervals,
        motifs,
        key,
        scale,
      },
      suggestions,
      confidence: 0.85,
    };

    this.analysisHistory.push(analysis);
    return analysis;
  }

  /**
   * Calculate melodic contour
   */
  private calculateMelodicContour(midiData: number[]): string[] {
    const contour: string[] = [];

    for (let i = 1; i < midiData.length; i++) {
      if (midiData[i] > midiData[i - 1]) {
        contour.push('up');
      } else if (midiData[i] < midiData[i - 1]) {
        contour.push('down');
      } else {
        contour.push('same');
      }
    }

    return contour;
  }

  /**
   * Analyze intervals
   */
  private analyzeIntervals(midiData: number[]): Record<string, number> {
    const intervals: Record<string, number> = {
      unison: 0,
      second: 0,
      third: 0,
      fourth: 0,
      fifth: 0,
      sixth: 0,
      seventh: 0,
      octave: 0,
    };

    for (let i = 1; i < midiData.length; i++) {
      const interval = Math.abs(midiData[i] - midiData[i - 1]);

      if (interval === 0) intervals.unison++;
      else if (interval <= 2) intervals.second++;
      else if (interval <= 4) intervals.third++;
      else if (interval <= 5) intervals.fourth++;
      else if (interval <= 7) intervals.fifth++;
      else if (interval <= 9) intervals.sixth++;
      else if (interval <= 11) intervals.seventh++;
      else intervals.octave++;
    }

    return intervals;
  }

  /**
   * Identify melodic motifs
   */
  private identifyMotifs(midiData: number[]): string[] {
    const motifs: string[] = [];
    const motifLength = 4;

    for (let i = 0; i <= midiData.length - motifLength; i++) {
      const motif = midiData.slice(i, i + motifLength).join('-');
      motifs.push(motif);
    }

    // Find repeating motifs
    const motifCounts: Map<string, number> = new Map();
    for (const motif of motifs) {
      motifCounts.set(motif, (motifCounts.get(motif) || 0) + 1);
    }

    const repeatingMotifs = Array.from(motifCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([motif, _]) => motif);

    return repeatingMotifs;
  }

  /**
   * Generate melody suggestions
   */
  private generateMelodySuggestions(
    contour: string[],
    intervals: Record<string, number>,
    motifs: string[]
  ): KingpinSuggestion[] {
    const suggestions: KingpinSuggestion[] = [];

    // Check for lack of contour variation
    const upMoves = contour.filter((c) => c === 'up').length;
    const downMoves = contour.filter((c) => c === 'down').length;

    if (Math.abs(upMoves - downMoves) > contour.length * 0.6) {
      suggestions.push({
        id: `kingpin_melody_${Date.now()}_1`,
        category: 'melody',
        title: 'Add melodic contour variation',
        description:
          upMoves > downMoves
            ? 'Melody is mostly ascending. Add descending phrases for balance.'
            : 'Melody is mostly descending. Add ascending phrases for balance.',
        parameters: { addContrast: true },
        reasoning: 'Balanced contour creates more engaging melodies.',
        confidence: 0.8,
        emotionalImpact: 0.6,
      });
    }

    // Check for lack of interval variety
    const intervalTypes = Object.values(intervals).filter((v) => v > 0).length;
    if (intervalTypes < 4) {
      suggestions.push({
        id: `kingpin_melody_${Date.now()}_2`,
        category: 'melody',
        title: 'Increase interval variety',
        description: 'Melody uses limited interval types. Add larger intervals for more interest.',
        parameters: { addLargeIntervals: true },
        reasoning: 'Interval variety creates more dynamic melodies.',
        confidence: 0.7,
        emotionalImpact: 0.7,
      });
    }

    // Check for lack of motifs
    if (motifs.length < 2) {
      suggestions.push({
        id: `kingpin_melody_${Date.now()}_3`,
        category: 'arrangement',
        title: 'Develop melodic motifs',
        description: 'Melody lacks repeating motifs. Create and develop motifs for memorability.',
        parameters: { developMotifs: true },
        reasoning: 'Motifs create memorable and cohesive melodies.',
        confidence: 0.75,
        emotionalImpact: 0.8,
      });
    }

    return suggestions;
  }

  /**
   * Analyze harmony and suggest vocal harmonies
   */
  public analyzeHarmony(melody: number[], key: string, scale: string[]): KingpinAnalysis {
    // Generate harmony suggestions
    const harmonies = this.generateHarmonySuggestions(melody, key, scale);

    // Analyze harmonic tension
    const tension = this.analyzeHarmonicTension(melody, scale);

    // Generate suggestions
    const suggestions = this.generateHarmonySuggestionsList(harmonies, tension);

    const analysis: KingpinAnalysis = {
      id: `kingpin_harmony_${Date.now()}`,
      type: 'harmonic',
      description: 'Harmonic analysis with vocal harmony suggestions',
      findings: {
        harmonies,
        tension,
        key,
        scale,
      },
      suggestions,
      confidence: 0.8,
    };

    this.analysisHistory.push(analysis);
    return analysis;
  }

  /**
   * Generate harmony suggestions
   */
  private generateHarmonySuggestions(melody: number[], key: string, scale: string[]): number[][] {
    const harmonies: number[][] = [];
    const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Thirds (most common)
    const thirds = melody.map((note) => {
      const noteName = chromaticNotes[note % 12];
      const noteIndex = scale.indexOf(noteName);
      if (noteIndex === -1) return note + 4; // Major 3rd fallback
      const thirdIndex = (noteIndex + 2) % scale.length;
      return (
        note +
        (thirdIndex >= noteIndex ? thirdIndex - noteIndex : thirdIndex + scale.length - noteIndex) *
          2
      );
    });
    harmonies.push(thirds);

    // Fifths
    const fifths = melody.map((note) => {
      const noteName = chromaticNotes[note % 12];
      const noteIndex = scale.indexOf(noteName);
      if (noteIndex === -1) return note + 7; // Perfect 5th fallback
      const fifthIndex = (noteIndex + 4) % scale.length;
      return (
        note +
        (fifthIndex >= noteIndex ? fifthIndex - noteIndex : fifthIndex + scale.length - noteIndex) *
          2
      );
    });
    harmonies.push(fifths);

    // Sixths
    const sixths = melody.map((note) => {
      const noteName = chromaticNotes[note % 12];
      const noteIndex = scale.indexOf(noteName);
      if (noteIndex === -1) return note + 9; // Major 6th fallback
      const sixthIndex = (noteIndex + 5) % scale.length;
      return (
        note +
        (sixthIndex >= noteIndex ? sixthIndex - noteIndex : sixthIndex + scale.length - noteIndex) *
          2
      );
    });
    harmonies.push(sixths);

    return harmonies;
  }

  /**
   * Analyze harmonic tension
   */
  private analyzeHarmonicTension(melody: number[], scale: string[]): Record<string, number> {
    const tension: Record<string, number> = {
      consonant: 0,
      dissonant: 0,
      neutral: 0,
    };
    const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    for (const note of melody) {
      const noteName = chromaticNotes[note % 12];
      const noteIndex = scale.indexOf(noteName);
      if (noteIndex === 0 || noteIndex === 3 || noteIndex === 4 || noteIndex === 7) {
        tension.consonant++;
      } else if (noteIndex === 1 || noteIndex === 2 || noteIndex === 5 || noteIndex === 6) {
        tension.dissonant++;
      } else {
        tension.neutral++;
      }
    }

    return tension;
  }

  /**
   * Generate harmony suggestions list
   */
  private generateHarmonySuggestionsList(
    harmonies: number[][],
    tension: Record<string, number>
  ): KingpinSuggestion[] {
    const suggestions: KingpinSuggestion[] = [];

    // Suggest third harmony
    suggestions.push({
      id: `kingpin_harmony_${Date.now()}_1`,
      category: 'harmony',
      title: 'Add third harmony',
      description: 'Add a third harmony part for rich, consonant vocal texture.',
      parameters: { harmony: 'third', voices: harmonies[0] },
      reasoning: 'Third harmonies provide the most consonant and pleasing vocal texture.',
      confidence: 0.9,
      emotionalImpact: 0.7,
    });

    // Suggest fifth harmony
    suggestions.push({
      id: `kingpin_harmony_${Date.now()}_2`,
      category: 'harmony',
      title: 'Add fifth harmony',
      description: 'Add a fifth harmony part for power and stability.',
      parameters: { harmony: 'fifth', voices: harmonies[1] },
      reasoning: 'Fifth harmonies add power and stability to the vocal arrangement.',
      confidence: 0.85,
      emotionalImpact: 0.6,
    });

    // Suggest sixth harmony
    suggestions.push({
      id: `kingpin_harmony_${Date.now()}_3`,
      category: 'harmony',
      title: 'Add sixth harmony',
      description: 'Add a sixth harmony part for emotional depth and warmth.',
      parameters: { harmony: 'sixth', voices: harmonies[2] },
      reasoning: 'Sixth harmonies add emotional warmth and sophistication.',
      confidence: 0.8,
      emotionalImpact: 0.9,
    });

    // Suggest tension resolution
    if (tension.dissonant > tension.consonant) {
      suggestions.push({
        id: `kingpin_harmony_${Date.now()}_4`,
        category: 'arrangement',
        title: 'Resolve harmonic tension',
        description:
          'Melody has high dissonance. Consider resolving to consonant notes for emotional release.',
        parameters: { resolveTension: true },
        reasoning: 'Balancing tension and resolution creates emotional impact.',
        confidence: 0.75,
        emotionalImpact: 0.85,
      });
    }

    return suggestions;
  }

  /**
   * Analyze vocal performance characteristics
   */
  public analyzePerformance(audioData: Float32Array): KingpinAnalysis {
    // Analyze dynamics
    const dynamics = this.analyzeVocalDynamics(audioData);

    // Analyze timing
    const timing = this.analyzeVocalTiming(audioData);

    // Analyze vibrato
    const vibrato = this.analyzeVibrato(audioData);

    // Generate suggestions
    const suggestions = this.generatePerformanceSuggestions(dynamics, timing, vibrato);

    const analysis: KingpinAnalysis = {
      id: `kingpin_performance_${Date.now()}`,
      type: 'performance',
      description: 'Vocal performance analysis with enhancement suggestions',
      findings: {
        dynamics,
        timing,
        vibrato,
      },
      suggestions,
      confidence: 0.8,
    };

    this.analysisHistory.push(analysis);
    return analysis;
  }

  /**
   * Analyze vocal dynamics
   */
  private analyzeVocalDynamics(audioData: Float32Array): Record<string, number> {
    const windowSize = 1024;
    const dynamics: number[] = [];

    for (let i = 0; i < audioData.length - windowSize; i += windowSize / 2) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += Math.abs(audioData[i + j]);
      }
      dynamics.push(sum / windowSize);
    }

    const avg = dynamics.reduce((sum, d) => sum + d, 0) / dynamics.length;
    const variance = dynamics.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / dynamics.length;
    const dynamicRange = Math.max(...dynamics) - Math.min(...dynamics);

    return {
      average: avg,
      variance,
      range: dynamicRange,
      consistency: 1 - variance / (avg * avg + 0.001),
    };
  }

  /**
   * Analyze vocal timing
   */
  private analyzeVocalTiming(audioData: Float32Array): Record<string, number> {
    // Simplified timing analysis
    const onsets = this.detectOnsets(audioData);

    if (onsets.length < 2) {
      return { consistency: 1, avgInterval: 0, variance: 0 };
    }

    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }

    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;

    return {
      consistency: 1 - variance / (avgInterval * avgInterval + 0.001),
      avgInterval,
      variance,
    };
  }

  /**
   * Detect onsets in audio
   */
  private detectOnsets(audioData: Float32Array): number[] {
    const onsets: number[] = [];
    const windowSize = 512;
    const threshold = 0.2;

    for (let i = 0; i < audioData.length - windowSize; i += windowSize / 4) {
      let energy = 0;
      for (let j = 0; j < windowSize; j++) {
        energy += audioData[i + j] * audioData[i + j];
      }
      energy /= windowSize;

      if (energy > threshold) {
        onsets.push(i);
      }
    }

    return onsets;
  }

  /**
   * Analyze vibrato
   */
  private analyzeVibrato(audioData: Float32Array): Record<string, number> {
    // Simplified vibrato analysis
    // Would use proper pitch detection in full implementation
    return {
      rate: 5.5, // Hz
      depth: 0.3, // semitones
      consistency: 0.8,
    };
  }

  /**
   * Generate performance suggestions
   */
  private generatePerformanceSuggestions(
    dynamics: Record<string, number>,
    timing: Record<string, number>,
    vibrato: Record<string, number>
  ): KingpinSuggestion[] {
    const suggestions: KingpinSuggestion[] = [];

    if (dynamics.consistency < 0.6) {
      suggestions.push({
        id: `kingpin_perf_${Date.now()}_1`,
        category: 'performance',
        title: 'Improve dynamic consistency',
        description:
          'Vocal dynamics are inconsistent. Consider compression or re-recording for more consistent levels.',
        parameters: { applyCompression: true, targetConsistency: 0.8 },
        reasoning: 'Consistent dynamics improve mix clarity and vocal presence.',
        confidence: 0.75,
        emotionalImpact: 0.5,
      });
    }

    if (dynamics.range < 0.3) {
      suggestions.push({
        id: `kingpin_perf_${Date.now()}_2`,
        category: 'performance',
        title: 'Increase dynamic range',
        description:
          'Vocal performance lacks dynamic range. Add more expression through volume variation.',
        parameters: { increaseRange: true, targetRange: 0.5 },
        reasoning: 'Dynamic range adds emotional depth to vocal performance.',
        confidence: 0.7,
        emotionalImpact: 0.8,
      });
    }

    if (timing.consistency < 0.7) {
      suggestions.push({
        id: `kingpin_perf_${Date.now()}_3`,
        category: 'performance',
        title: 'Improve timing consistency',
        description:
          'Vocal timing is inconsistent. Consider quantization or re-recording for tighter timing.',
        parameters: { applyQuantization: true, strength: 0.5 },
        reasoning: 'Consistent timing improves groove and rhythmic precision.',
        confidence: 0.8,
        emotionalImpact: 0.4,
      });
    }

    if (vibrato.depth < 0.2) {
      suggestions.push({
        id: `kingpin_perf_${Date.now()}_4`,
        category: 'performance',
        title: 'Add vibrato for expression',
        description:
          'Vocal lacks vibrato. Add subtle vibrato to sustained notes for more expression.',
        parameters: { addVibrato: true, rate: 5.5, depth: 0.3 },
        reasoning: 'Vibrato adds warmth and expression to vocal performance.',
        confidence: 0.65,
        emotionalImpact: 0.7,
      });
    }

    return suggestions;
  }

  /**
   * Suggest vocal arrangement
   */
  public suggestVocalArrangement(context: Record<string, any>): KingpinSuggestion {
    const suggestion: KingpinSuggestion = {
      id: `kingpin_arrange_${Date.now()}`,
      category: 'arrangement',
      title: 'Vocal arrangement enhancement',
      description: 'Recommended vocal arrangement for maximum impact',
      parameters: {
        layers: ['lead', 'harmony', 'backing', 'adlibs'],
        panning: { lead: 0, harmony: [-30, 30], backing: [-50, 50], adlibs: [-20, 20] },
        processing: {
          lead: { compression: 4, eq: { lowCut: 100, highBoost: 8000 } },
          harmony: { compression: 6, eq: { lowCut: 200, highBoost: 6000 } },
          backing: { compression: 8, reverb: 0.3 },
          adlibs: { compression: 3, delay: 0.2 },
        },
      },
      reasoning:
        'This arrangement creates depth, width, and emotional impact through layered vocals.',
      confidence: 0.8,
      emotionalImpact: 0.9,
    };

    this.suggestionHistory.push(suggestion);
    return suggestion;
  }

  /**
   * Suggest vocal effects
   */
  public suggestVocalEffects(context: Record<string, any>): KingpinSuggestion {
    const suggestion: KingpinSuggestion = {
      id: `kingpin_fx_${Date.now()}`,
      category: 'vocal_fx',
      title: 'Vocal effects chain',
      description: 'Recommended vocal processing for professional sound',
      parameters: {
        chain: [
          { type: 'eq', settings: { lowCut: 100, highBoost: 8000, gain: 2 } },
          { type: 'compressor', settings: { threshold: -15, ratio: 4, attack: 10, release: 100 } },
          { type: 'deesser', settings: { threshold: -20, ratio: 4, frequency: 6000 } },
          { type: 'saturation', settings: { amount: 15 } },
          { type: 'reverb', settings: { decay: 1.5, mix: 0.2, preDelay: 20 } },
          { type: 'delay', settings: { time: 250, feedback: 0.3, mix: 0.15 } },
        ],
      },
      reasoning: 'This chain provides clarity, presence, and professional vocal character.',
      confidence: 0.85,
      emotionalImpact: 0.7,
    };

    this.suggestionHistory.push(suggestion);
    return suggestion;
  }

  /**
   * Suggest melody improvements
   */
  public suggestMelodyImprovement(context: Record<string, any>): KingpinSuggestion {
    const suggestion: KingpinSuggestion = {
      id: `kingpin_melody_${Date.now()}`,
      category: 'melody',
      title: 'Melody enhancement',
      description: 'Suggested melodic improvements for better memorability and emotion',
      parameters: {
        addContrast: true,
        developMotifs: true,
        addEmotionalPeaks: true,
        targetRange: 12, // octave
      },
      reasoning: 'These enhancements will create a more engaging and memorable melody.',
      confidence: 0.75,
      emotionalImpact: 0.85,
    };

    this.suggestionHistory.push(suggestion);
    return suggestion;
  }

  /**
   * Get analysis history
   */
  public getAnalysisHistory(): KingpinAnalysis[] {
    return [...this.analysisHistory];
  }

  /**
   * Get suggestion history
   */
  public getSuggestionHistory(): KingpinSuggestion[] {
    return [...this.suggestionHistory];
  }

  /**
   * Clear history
   */
  public clearHistory(): void {
    this.analysisHistory = [];
    this.suggestionHistory = [];
  }

  /**
   * Add vocal template
   */
  public addVocalTemplate(templateId: string, template: any): void {
    this.vocalTemplates.set(templateId, template);
  }

  /**
   * Get vocal template
   */
  public getVocalTemplate(templateId: string): any {
    return this.vocalTemplates.get(templateId);
  }

  /**
   * Add harmony to library
   */
  public addHarmony(harmonyId: string, harmony: any): void {
    this.harmonyLibrary.set(harmonyId, harmony);
  }

  /**
   * Get harmony from library
   */
  public getHarmony(harmonyId: string): any {
    return this.harmonyLibrary.get(harmonyId);
  }
}
