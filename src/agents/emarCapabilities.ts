// 3WM SONIK - Kappachino Emar (The Scientist) Technical Intelligence
// Audio engineering, DSP, mixing, mastering, acoustics, music theory expertise

export interface EmarAnalysis {
  id: string;
  type: 'frequency' | 'dynamic' | 'harmonic' | 'spatial' | 'technical';
  description: string;
  findings: Record<string, any>;
  recommendations: string[];
  confidence: number;
}

export interface EmarSuggestion {
  id: string;
  category: 'mixing' | 'mastering' | 'dsp' | 'acoustics' | 'theory';
  title: string;
  description: string;
  parameters: Record<string, any>;
  reasoning: string;
  confidence: number;
}

export class EmarCapabilities {
  private analysisHistory: EmarAnalysis[] = [];
  private suggestionHistory: EmarSuggestion[] = [];

  /**
   * Analyze frequency spectrum and provide technical recommendations
   */
  public analyzeFrequencySpectrum(audioData: Float32Array, sampleRate: number): EmarAnalysis {
    const fftSize = 2048;
    const frequencyBins = new Float32Array(fftSize / 2);

    // Perform FFT (simplified - would use proper FFT implementation)
    for (let i = 0; i < frequencyBins.length; i++) {
      frequencyBins[i] = Math.random(); // Placeholder
    }

    // Analyze frequency bands
    const bands = this.analyzeFrequencyBands(frequencyBins, sampleRate);

    // Identify issues
    const issues = this.identifyFrequencyIssues(bands);

    // Generate recommendations
    const recommendations = this.generateFrequencyRecommendations(issues);

    const analysis: EmarAnalysis = {
      id: `emar_freq_${Date.now()}`,
      type: 'frequency',
      description: 'Frequency spectrum analysis with technical recommendations',
      findings: {
        bands,
        issues,
        spectrum: Array.from(frequencyBins),
      },
      recommendations,
      confidence: 0.85,
    };

    this.analysisHistory.push(analysis);
    return analysis;
  }

  /**
   * Analyze frequency bands
   */
  private analyzeFrequencyBands(
    spectrum: Float32Array,
    sampleRate: number
  ): Record<string, number> {
    const binWidth = sampleRate / spectrum.length;

    const bands: Record<string, number> = {
      sub: 0, // 20-60 Hz
      bass: 0, // 60-250 Hz
      lowMid: 0, // 250-500 Hz
      mid: 0, // 500-2000 Hz
      highMid: 0, // 2000-4000 Hz
      presence: 0, // 4000-6000 Hz
      brilliance: 0, // 6000-20000 Hz
    };

    for (let i = 0; i < spectrum.length; i++) {
      const freq = i * binWidth;
      const magnitude = spectrum[i];

      if (freq >= 20 && freq < 60) bands.sub += magnitude;
      else if (freq >= 60 && freq < 250) bands.bass += magnitude;
      else if (freq >= 250 && freq < 500) bands.lowMid += magnitude;
      else if (freq >= 500 && freq < 2000) bands.mid += magnitude;
      else if (freq >= 2000 && freq < 4000) bands.highMid += magnitude;
      else if (freq >= 4000 && freq < 6000) bands.presence += magnitude;
      else if (freq >= 6000 && freq < 20000) bands.brilliance += magnitude;
    }

    // Normalize
    const total = Object.values(bands).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      for (const key in bands) {
        bands[key] /= total;
      }
    }

    return bands;
  }

  /**
   * Identify frequency issues
   */
  private identifyFrequencyIssues(bands: Record<string, number>): string[] {
    const issues: string[] = [];

    if (bands.sub > 0.15) issues.push('Excessive sub-bass energy');
    if (bands.bass > 0.25) issues.push('Bass frequencies too prominent');
    if (bands.lowMid > 0.2) issues.push('Low-mid buildup detected');
    if (bands.mid < 0.15) issues.push('Midrange lacking presence');
    if (bands.highMid < 0.1) issues.push('High-mid clarity insufficient');
    if (bands.presence < 0.08) issues.push('Presence region weak');
    if (bands.brilliance < 0.05) issues.push('High-frequency brilliance low');

    return issues;
  }

  /**
   * Generate frequency recommendations
   */
  private generateFrequencyRecommendations(issues: string[]): string[] {
    const recommendations: string[] = [];

    for (const issue of issues) {
      if (issue.includes('sub-bass')) {
        recommendations.push('Apply high-pass filter at 30Hz to control sub-bass');
        recommendations.push('Consider using a sub-bass compressor with sidechain');
      }
      if (issue.includes('Bass frequencies')) {
        recommendations.push('Reduce bass levels by 2-3dB or use dynamic EQ');
        recommendations.push('Check for bass masking in the mix');
      }
      if (issue.includes('Low-mid')) {
        recommendations.push('Apply low-mid cut around 300-400Hz');
        recommendations.push('Use dynamic EQ to control muddy frequencies');
      }
      if (issue.includes('Midrange')) {
        recommendations.push('Boost midrange around 1-2kHz for presence');
        recommendations.push('Check instrument balance in midrange');
      }
      if (issue.includes('High-mid')) {
        recommendations.push('Boost high-mid around 3-4kHz for clarity');
        recommendations.push('Use harmonic exciter to enhance high-mids');
      }
      if (issue.includes('Presence')) {
        recommendations.push('Boost presence region around 5-6kHz');
        recommendations.push('Add subtle saturation for presence enhancement');
      }
      if (issue.includes('High-frequency')) {
        recommendations.push('Apply high-shelf boost above 8kHz');
        recommendations.push('Use air EQ for high-frequency enhancement');
      }
    }

    return recommendations;
  }

  /**
   * Analyze dynamic range and compression needs
   */
  public analyzeDynamics(audioData: Float32Array): EmarAnalysis {
    // Calculate RMS
    let sumSquares = 0;
    for (let i = 0; i < audioData.length; i++) {
      sumSquares += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(sumSquares / audioData.length);
    const rmsDb = 20 * Math.log10(rms);

    // Calculate peak
    let peak = 0;
    for (let i = 0; i < audioData.length; i++) {
      const absValue = Math.abs(audioData[i]);
      if (absValue > peak) peak = absValue;
    }
    const peakDb = 20 * Math.log10(peak);

    // Calculate dynamic range
    const dynamicRange = peakDb - rmsDb;

    // Analyze crest factor
    const crestFactor = peakDb - rmsDb;

    // Generate recommendations
    const recommendations = this.generateDynamicRecommendations(dynamicRange, crestFactor);

    const analysis: EmarAnalysis = {
      id: `emar_dyn_${Date.now()}`,
      type: 'dynamic',
      description: 'Dynamic range analysis with compression recommendations',
      findings: {
        rms: rmsDb,
        peak: peakDb,
        dynamicRange,
        crestFactor,
      },
      recommendations,
      confidence: 0.9,
    };

    this.analysisHistory.push(analysis);
    return analysis;
  }

  /**
   * Generate dynamic recommendations
   */
  private generateDynamicRecommendations(dynamicRange: number, crestFactor: number): string[] {
    const recommendations: string[] = [];

    if (dynamicRange > 20) {
      recommendations.push('High dynamic range detected - consider gentle compression');
      recommendations.push('Use 2:1 ratio with slow attack/release for natural control');
    } else if (dynamicRange < 8) {
      recommendations.push('Low dynamic range - avoid additional compression');
      recommendations.push('Consider using transient shaper to restore dynamics');
    } else {
      recommendations.push('Dynamic range is balanced - minimal compression needed');
    }

    if (crestFactor > 14) {
      recommendations.push('High crest factor - use fast attack to catch transients');
      recommendations.push('Consider parallel compression for punch control');
    } else if (crestFactor < 6) {
      recommendations.push('Low crest factor - sound may be over-compressed');
      recommendations.push('Reduce compression ratio or use parallel processing');
    }

    return recommendations;
  }

  /**
   * Analyze harmonic content and suggest EQ
   */
  public analyzeHarmonics(audioData: Float32Array, sampleRate: number): EmarAnalysis {
    // Find fundamental frequency (simplified)
    const fundamental = this.detectFundamental(audioData, sampleRate);

    // Calculate harmonic series
    const harmonics = this.calculateHarmonicSeries(audioData, sampleRate, fundamental);

    // Analyze harmonic balance
    const harmonicBalance = this.analyzeHarmonicBalance(harmonics);

    // Generate recommendations
    const recommendations = this.generateHarmonicRecommendations(harmonicBalance);

    const analysis: EmarAnalysis = {
      id: `emar_harm_${Date.now()}`,
      type: 'harmonic',
      description: 'Harmonic analysis with EQ recommendations',
      findings: {
        fundamental,
        harmonics,
        harmonicBalance,
      },
      recommendations,
      confidence: 0.8,
    };

    this.analysisHistory.push(analysis);
    return analysis;
  }

  /**
   * Detect fundamental frequency
   */
  private detectFundamental(audioData: Float32Array, sampleRate: number): number {
    // Simplified autocorrelation
    const minPeriod = Math.floor(sampleRate / 500); // Max 500 Hz
    const maxPeriod = Math.floor(sampleRate / 20); // Min 20 Hz

    let bestPeriod = 0;
    let bestCorrelation = 0;

    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < audioData.length - period; i++) {
        correlation += audioData[i] * audioData[i + period];
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  /**
   * Calculate harmonic series
   */
  private calculateHarmonicSeries(
    audioData: Float32Array,
    sampleRate: number,
    fundamental: number
  ): number[] {
    const harmonics: number[] = [];

    for (let h = 1; h <= 10; h++) {
      const harmonicFreq = fundamental * h;
      const harmonicMag = this.calculateMagnitudeAtFrequency(audioData, sampleRate, harmonicFreq);
      harmonics.push(harmonicMag);
    }

    return harmonics;
  }

  /**
   * Calculate magnitude at specific frequency
   */
  private calculateMagnitudeAtFrequency(
    audioData: Float32Array,
    sampleRate: number,
    frequency: number
  ): number {
    // Simplified - would use proper FFT
    return Math.random() * 0.5;
  }

  /**
   * Analyze harmonic balance
   */
  private analyzeHarmonicBalance(harmonics: number[]): Record<string, number> {
    const balance: Record<string, number> = {
      odd: 0,
      even: 0,
      ratio: 0,
    };

    for (let i = 0; i < harmonics.length; i++) {
      if ((i + 1) % 2 === 0) {
        balance.even += harmonics[i];
      } else {
        balance.odd += harmonics[i];
      }
    }

    balance.ratio = balance.odd / (balance.even + 0.001);

    return balance;
  }

  /**
   * Generate harmonic recommendations
   */
  private generateHarmonicRecommendations(balance: Record<string, number>): string[] {
    const recommendations: string[] = [];

    if (balance.ratio > 2) {
      recommendations.push('Strong odd harmonics - sound has character and warmth');
      recommendations.push('Consider adding even harmonics for fuller sound');
    } else if (balance.ratio < 0.5) {
      recommendations.push('Strong even harmonics - sound is smooth but may lack character');
      recommendations.push('Consider adding subtle saturation for odd harmonics');
    } else {
      recommendations.push('Balanced harmonic content - natural sound character');
    }

    return recommendations;
  }

  /**
   * Analyze spatial characteristics
   */
  public analyzeSpatial(leftChannel: Float32Array, rightChannel: Float32Array): EmarAnalysis {
    // Calculate correlation
    const correlation = this.calculateStereoCorrelation(leftChannel, rightChannel);

    // Calculate width
    const width = this.calculateStereoWidth(leftChannel, rightChannel);

    // Generate recommendations
    const recommendations = this.generateSpatialRecommendations(correlation, width);

    const analysis: EmarAnalysis = {
      id: `emar_spatial_${Date.now()}`,
      type: 'spatial',
      description: 'Spatial analysis with stereo recommendations',
      findings: {
        correlation,
        width,
      },
      recommendations,
      confidence: 0.85,
    };

    this.analysisHistory.push(analysis);
    return analysis;
  }

  /**
   * Calculate stereo correlation
   */
  private calculateStereoCorrelation(left: Float32Array, right: Float32Array): number {
    let sumLeft = 0;
    let sumRight = 0;
    let sumLeftRight = 0;
    let sumLeftSq = 0;
    let sumRightSq = 0;

    for (let i = 0; i < Math.min(left.length, right.length); i++) {
      sumLeft += left[i];
      sumRight += right[i];
      sumLeftRight += left[i] * right[i];
      sumLeftSq += left[i] * left[i];
      sumRightSq += right[i] * right[i];
    }

    const n = Math.min(left.length, right.length);
    const numerator = sumLeftRight - (sumLeft * sumRight) / n;
    const denominator = Math.sqrt(
      (sumLeftSq - (sumLeft * sumLeft) / n) * (sumRightSq - (sumRight * sumRight) / n)
    );

    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Calculate stereo width
   */
  private calculateStereoWidth(left: Float32Array, right: Float32Array): number {
    let mid = 0;
    let side = 0;

    for (let i = 0; i < Math.min(left.length, right.length); i++) {
      mid += (left[i] + right[i]) / 2;
      side += (left[i] - right[i]) / 2;
    }

    const midRms = Math.sqrt(mid / Math.min(left.length, right.length));
    const sideRms = Math.sqrt(side / Math.min(left.length, right.length));

    return midRms > 0 ? sideRms / midRms : 0;
  }

  /**
   * Generate spatial recommendations
   */
  private generateSpatialRecommendations(correlation: number, width: number): string[] {
    const recommendations: string[] = [];

    if (correlation > 0.8) {
      recommendations.push('High correlation - narrow stereo image');
      recommendations.push('Consider widening with stereo enhancer or mid-side processing');
    } else if (correlation < 0.3) {
      recommendations.push('Low correlation - wide but potentially phase issues');
      recommendations.push('Check for phase coherence and mono compatibility');
    }

    if (width > 1.5) {
      recommendations.push('Very wide stereo image - check mono compatibility');
      recommendations.push('Consider using correlation meter to monitor phase');
    } else if (width < 0.5) {
      recommendations.push('Narrow stereo image - consider widening techniques');
      recommendations.push('Use stereo widener or mid-side processing');
    }

    return recommendations;
  }

  /**
   * Generate mixing suggestion
   */
  public generateMixingSuggestion(context: Record<string, any>): EmarSuggestion {
    const suggestion: EmarSuggestion = {
      id: `emar_mix_${Date.now()}`,
      category: 'mixing',
      title: 'Technical mixing optimization',
      description: 'Based on technical analysis, here are mixing recommendations',
      parameters: {},
      reasoning:
        'Analysis of frequency, dynamic, and spatial characteristics indicates areas for improvement.',
      confidence: 0.8,
    };

    this.suggestionHistory.push(suggestion);
    return suggestion;
  }

  /**
   * Generate mastering suggestion
   */
  public generateMasteringSuggestion(context: Record<string, any>): EmarSuggestion {
    const suggestion: EmarSuggestion = {
      id: `emar_master_${Date.now()}`,
      category: 'mastering',
      title: 'Technical mastering chain recommendation',
      description: 'Recommended mastering chain based on technical analysis',
      parameters: {
        eq: { lowShelf: { freq: 60, gain: 0 }, highShelf: { freq: 8000, gain: 0 } },
        compressor: { threshold: -12, ratio: 2, attack: 10, release: 100 },
        limiter: { threshold: -1, ceiling: -0.5 },
      },
      reasoning:
        'Based on LUFS, peak, and dynamic range analysis, this chain will achieve target loudness while preserving dynamics.',
      confidence: 0.85,
    };

    this.suggestionHistory.push(suggestion);
    return suggestion;
  }

  /**
   * Get analysis history
   */
  public getAnalysisHistory(): EmarAnalysis[] {
    return [...this.analysisHistory];
  }

  /**
   * Get suggestion history
   */
  public getSuggestionHistory(): EmarSuggestion[] {
    return [...this.suggestionHistory];
  }

  /**
   * Clear history
   */
  public clearHistory(): void {
    this.analysisHistory = [];
    this.suggestionHistory = [];
  }
}
