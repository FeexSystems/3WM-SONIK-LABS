// 3WM SONIK - DSP Analysis Tools for Kappachino Emar (The Scientist)
// Professional audio analysis tools for the scientific intelligence of 3WM SONIK

import { ToolDefinition, ToolExecutionContext, ToolResult } from './agentTools';
import { AgentId } from './types';
import { validators } from './agentTools';

/**
 * Analyze frequency spectrum of audio
 */
export const analyzeFrequencySpectrum: ToolDefinition = {
  name: 'analyze_frequency_spectrum',
  description:
    'Analyze the frequency spectrum of audio to identify frequency content, peaks, and balance',
  inputSchema: {
    type: 'object',
    properties: {
      audioBuffer: { type: 'any', description: 'AudioBuffer to analyze' },
      fftSize: { type: 'number', description: 'FFT size for analysis (default: 2048)' },
      frequencyBands: { type: 'array', description: 'Custom frequency bands to analyze' },
    },
    required: ['audioBuffer'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      frequencyData: { type: 'array' },
      peaks: { type: 'array' },
      spectralCentroid: { type: 'number' },
      spectralRolloff: { type: 'number' },
      spectralFlatness: { type: 'number' },
      frequencyBalance: { type: 'object' },
    },
  },
  authorizedAgents: ['kappachino_emar'],
  destructive: false,
  validate: (params) => {
    const errors: string[] = [];
    if (!params.audioBuffer) {
      errors.push('audioBuffer is required');
    }
    if (params.fftSize !== undefined) {
      const numCheck = validators.number(params.fftSize, 256, 16384);
      if (!numCheck.valid) errors.push(...numCheck.errors);
    }
    return { valid: errors.length === 0, errors };
  },
  execute: async (context: ToolExecutionContext, params: any): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      const { audioBuffer, fftSize = 2048, frequencyBands } = params;

      if (!context.audioContext) {
        return {
          success: false,
          error: 'AudioContext not available',
          destructive: false,
          requiresApproval: false,
          executionTime: Date.now() - startTime,
        };
      }

      // Create analyser node
      const analyser = context.audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0.8;

      // Create buffer source and connect
      const source = context.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);

      // Get frequency data
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(frequencyData as any);

      // Calculate spectral features
      const spectralCentroid = calculateSpectralCentroid(
        frequencyData,
        context.audioContext.sampleRate,
        fftSize
      );
      const spectralRolloff = calculateSpectralRolloff(
        frequencyData,
        context.audioContext.sampleRate,
        fftSize
      );
      const spectralFlatness = calculateSpectralFlatness(frequencyData);

      // Find frequency peaks
      const peaks = findFrequencyPeaks(frequencyData, context.audioContext.sampleRate, fftSize);

      // Calculate frequency balance
      const frequencyBalance = calculateFrequencyBalance(
        frequencyData,
        context.audioContext.sampleRate,
        fftSize
      );

      // Clean up
      source.disconnect();
      analyser.disconnect();

      return {
        success: true,
        data: {
          frequencyData: Array.from(frequencyData),
          peaks,
          spectralCentroid,
          spectralRolloff,
          spectralFlatness,
          frequencyBalance,
        },
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in frequency analysis',
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    }
  },
};

/**
 * Analyze dynamic range and compression characteristics
 */
export const analyzeDynamics: ToolDefinition = {
  name: 'analyze_dynamics',
  description: 'Analyze dynamic range, crest factor, and compression characteristics of audio',
  inputSchema: {
    type: 'object',
    properties: {
      audioBuffer: { type: 'any', description: 'AudioBuffer to analyze' },
      channel: { type: 'number', description: 'Channel to analyze (default: 0)' },
    },
    required: ['audioBuffer'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      peakLevel: { type: 'number' },
      rmsLevel: { type: 'number' },
      crestFactor: { type: 'number' },
      dynamicRange: { type: 'number' },
      loudnessRange: { type: 'number' },
      compressionRatio: { type: 'number' },
    },
  },
  authorizedAgents: ['kappachino_emar'],
  destructive: false,
  validate: (params) => {
    const errors: string[] = [];
    if (!params.audioBuffer) errors.push('audioBuffer is required');
    if (params.channel !== undefined) {
      const numCheck = validators.number(params.channel, 0);
      if (!numCheck.valid) errors.push(...numCheck.errors);
    }
    return { valid: errors.length === 0, errors };
  },
  execute: async (context: ToolExecutionContext, params: any): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      const { audioBuffer, channel = 0 } = params;

      if (channel >= audioBuffer.numberOfChannels) {
        return {
          success: false,
          error: `Channel ${channel} does not exist in audio buffer`,
          destructive: false,
          requiresApproval: false,
          executionTime: Date.now() - startTime,
        };
      }

      const channelData = audioBuffer.getChannelData(channel);

      // Calculate peak level
      let peak = 0;
      for (let i = 0; i < channelData.length; i++) {
        peak = Math.max(peak, Math.abs(channelData[i]));
      }
      const peakDb = 20 * Math.log10(peak);

      // Calculate RMS level
      let sumSquares = 0;
      for (let i = 0; i < channelData.length; i++) {
        sumSquares += channelData[i] * channelData[i];
      }
      const rms = Math.sqrt(sumSquares / channelData.length);
      const rmsDb = 20 * Math.log10(rms);

      // Calculate crest factor
      const crestFactor = peakDb - rmsDb;

      // Calculate dynamic range (simplified)
      const dynamicRange = calculateDynamicRange(channelData);

      // Calculate loudness range (simplified EBU R128)
      const loudnessRange = calculateLoudnessRange(channelData, audioBuffer.sampleRate);

      // Estimate compression ratio
      const compressionRatio = estimateCompressionRatio(channelData);

      return {
        success: true,
        data: {
          peakLevel: peakDb,
          rmsLevel: rmsDb,
          crestFactor,
          dynamicRange,
          loudnessRange,
          compressionRatio,
        },
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in dynamics analysis',
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    }
  },
};

/**
 * Analyze stereo imaging and phase
 */
export const analyzeStereoImaging: ToolDefinition = {
  name: 'analyze_stereo_imaging',
  description: 'Analyze stereo width, phase correlation, and imaging characteristics',
  inputSchema: {
    type: 'object',
    properties: {
      audioBuffer: { type: 'any', description: 'Stereo AudioBuffer to analyze' },
    },
    required: ['audioBuffer'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      stereoWidth: { type: 'number' },
      phaseCorrelation: { type: 'number' },
      midSideRatio: { type: 'object' },
      panPosition: { type: 'number' },
      monoCompatibility: { type: 'number' },
    },
  },
  authorizedAgents: ['kappachino_emar'],
  destructive: false,
  validate: (params) => {
    if (!params.audioBuffer) {
      return { valid: false, errors: ['audioBuffer is required'] };
    }
    if (params.audioBuffer.numberOfChannels < 2) {
      return { valid: false, errors: ['AudioBuffer must be stereo'] };
    }
    return { valid: true, errors: [] };
  },
  execute: async (context: ToolExecutionContext, params: any): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      const { audioBuffer } = params;

      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = audioBuffer.getChannelData(1);

      // Calculate stereo width
      const stereoWidth = calculateStereoWidth(leftChannel, rightChannel);

      // Calculate phase correlation
      const phaseCorrelation = calculatePhaseCorrelation(leftChannel, rightChannel);

      // Calculate mid/side ratio
      const midSideRatio = calculateMidSideRatio(leftChannel, rightChannel);

      // Calculate pan position
      const panPosition = calculatePanPosition(leftChannel, rightChannel);

      // Calculate mono compatibility
      const monoCompatibility = calculateMonoCompatibility(leftChannel, rightChannel);

      return {
        success: true,
        data: {
          stereoWidth,
          phaseCorrelation,
          midSideRatio,
          panPosition,
          monoCompatibility,
        },
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in stereo imaging analysis',
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    }
  },
};

/**
 * Analyze harmonic content and distortion
 */
export const analyzeHarmonics: ToolDefinition = {
  name: 'analyze_harmonics',
  description: 'Analyze harmonic content, fundamental frequency, and distortion characteristics',
  inputSchema: {
    type: 'object',
    properties: {
      audioBuffer: { type: 'any', description: 'AudioBuffer to analyze' },
      fundamentalFrequency: { type: 'number', description: 'Expected fundamental frequency in Hz' },
    },
    required: ['audioBuffer'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      fundamentalFrequency: { type: 'number' },
      harmonics: { type: 'array' },
      thd: { type: 'number' },
      harmonicBalance: { type: 'object' },
      inharmonicity: { type: 'number' },
    },
  },
  authorizedAgents: ['kappachino_emar'],
  destructive: false,
  validate: (params) => {
    const errors: string[] = [];
    if (!params.audioBuffer) errors.push('audioBuffer is required');
    if (params.fundamentalFrequency !== undefined) {
      const numCheck = validators.number(params.fundamentalFrequency, 20, 20000);
      if (!numCheck.valid) errors.push(...numCheck.errors);
    }
    return { valid: errors.length === 0, errors };
  },
  execute: async (context: ToolExecutionContext, params: any): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      const { audioBuffer, fundamentalFrequency } = params;

      if (!context.audioContext) {
        return {
          success: false,
          error: 'AudioContext not available',
          destructive: false,
          requiresApproval: false,
          executionTime: Date.now() - startTime,
        };
      }

      const channelData = audioBuffer.getChannelData(0);

      // Detect fundamental frequency
      const detectedFundamental =
        fundamentalFrequency || detectFundamentalFrequency(channelData, audioBuffer.sampleRate);

      // Analyze harmonics
      const harmonics = analyzeHarmonicsContent(
        channelData,
        audioBuffer.sampleRate,
        detectedFundamental
      );

      // Calculate THD (Total Harmonic Distortion)
      const thd = calculateTHD(harmonics);

      // Calculate harmonic balance
      const harmonicBalance = calculateHarmonicBalance(harmonics);

      // Calculate inharmonicity
      const inharmonicity = calculateInharmonicity(harmonics, detectedFundamental);

      return {
        success: true,
        data: {
          fundamentalFrequency: detectedFundamental,
          harmonics,
          thd,
          harmonicBalance,
          inharmonicity,
        },
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in harmonic analysis',
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    }
  },
};

/**
 * Suggest EQ settings based on analysis
 */
export const suggestEQSettings: ToolDefinition = {
  name: 'suggest_eq_settings',
  description: 'Suggest EQ settings based on frequency analysis and target characteristics',
  inputSchema: {
    type: 'object',
    properties: {
      frequencyAnalysis: {
        type: 'object',
        description: 'Results from frequency spectrum analysis',
      },
      targetCharacteristics: { type: 'string', description: 'Target sound characteristics' },
      genre: { type: 'string', description: 'Musical genre for reference' },
    },
    required: ['frequencyAnalysis'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      lowShelf: { type: 'object' },
      midPeaking: { type: 'object' },
      highShelf: { type: 'object' },
      recommendations: { type: 'array' },
    },
  },
  authorizedAgents: ['kappachino_emar'],
  destructive: false,
  validate: (params) => {
    if (!params.frequencyAnalysis) {
      return { valid: false, errors: ['frequencyAnalysis is required'] };
    }
    return { valid: true, errors: [] };
  },
  execute: async (context: ToolExecutionContext, params: any): Promise<ToolResult> => {
    const startTime = Date.now();

    try {
      const { frequencyAnalysis, targetCharacteristics, genre } = params;

      // Generate EQ suggestions based on analysis
      const eqSuggestions = generateEQSuggestions(frequencyAnalysis, targetCharacteristics, genre);

      return {
        success: true,
        data: eqSuggestions,
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in EQ suggestion',
        destructive: false,
        requiresApproval: false,
        executionTime: Date.now() - startTime,
      };
    }
  },
};

// Helper functions for DSP analysis

function calculateSpectralCentroid(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number
): number {
  let weightedSum = 0;
  let sum = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    const frequency = (i * sampleRate) / fftSize;
    const magnitude = frequencyData[i];
    weightedSum += frequency * magnitude;
    sum += magnitude;
  }

  return sum > 0 ? weightedSum / sum : 0;
}

function calculateSpectralRolloff(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number
): number {
  const binSize = sampleRate / fftSize;
  let sum = 0;
  const totalSum = frequencyData.reduce((a, b) => a + b, 0);
  const threshold = totalSum * 0.85; // 85% energy threshold

  for (let i = 0; i < frequencyData.length; i++) {
    sum += frequencyData[i];
    if (sum >= threshold) {
      return i * binSize;
    }
  }

  return sampleRate / 2;
}

function calculateSpectralFlatness(frequencyData: Uint8Array): number {
  const geometricMean = Math.pow(
    frequencyData.reduce((a, b) => a * (b + 1), 1),
    1 / frequencyData.length
  );
  const arithmeticMean = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length;

  return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
}

function findFrequencyPeaks(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number
): Array<{ frequency: number; magnitude: number }> {
  const peaks: Array<{ frequency: number; magnitude: number }> = [];
  const binSize = sampleRate / fftSize;
  const threshold = 100; // Minimum magnitude threshold

  for (let i = 1; i < frequencyData.length - 1; i++) {
    if (
      frequencyData[i] > threshold &&
      frequencyData[i] > frequencyData[i - 1] &&
      frequencyData[i] > frequencyData[i + 1]
    ) {
      peaks.push({
        frequency: i * binSize,
        magnitude: frequencyData[i],
      });
    }
  }

  // Sort by magnitude and return top 10
  return peaks.sort((a, b) => b.magnitude - a.magnitude).slice(0, 10);
}

function calculateFrequencyBalance(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number
): {
  low: number;
  mid: number;
  high: number;
} {
  const binSize = sampleRate / fftSize;
  const lowEnd = Math.floor(200 / binSize);
  const midEnd = Math.floor(2000 / binSize);

  let lowSum = 0,
    midSum = 0,
    highSum = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    if (i < lowEnd) {
      lowSum += frequencyData[i];
    } else if (i < midEnd) {
      midSum += frequencyData[i];
    } else {
      highSum += frequencyData[i];
    }
  }

  const total = lowSum + midSum + highSum;

  return {
    low: total > 0 ? lowSum / total : 0,
    mid: total > 0 ? midSum / total : 0,
    high: total > 0 ? highSum / total : 0,
  };
}

function calculateDynamicRange(channelData: Float32Array): number {
  let min = Infinity,
    max = -Infinity;

  for (let i = 0; i < channelData.length; i++) {
    const value = 20 * Math.log10(Math.abs(channelData[i]) + 0.0001);
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  return max - min;
}

function calculateLoudnessRange(channelData: Float32Array, sampleRate: number): number {
  // Simplified loudness range calculation
  const windowSize = Math.floor(sampleRate * 0.4); // 400ms windows
  const loudnessValues: number[] = [];

  for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
    let sumSquares = 0;
    for (let j = 0; j < windowSize; j++) {
      sumSquares += channelData[i + j] * channelData[i + j];
    }
    const rms = Math.sqrt(sumSquares / windowSize);
    const loudness = 20 * Math.log10(rms + 0.0001);
    loudnessValues.push(loudness);
  }

  if (loudnessValues.length < 2) return 0;

  const sorted = [...loudnessValues].sort((a, b) => a - b);
  const low10 = sorted[Math.floor(sorted.length * 0.1)];
  const high95 = sorted[Math.floor(sorted.length * 0.95)];

  return high95 - low10;
}

function estimateCompressionRatio(channelData: Float32Array): number {
  // Estimate compression ratio from peak-to-RMS relationship
  let peak = 0;
  let sumSquares = 0;

  for (let i = 0; i < channelData.length; i++) {
    peak = Math.max(peak, Math.abs(channelData[i]));
    sumSquares += channelData[i] * channelData[i];
  }

  const rms = Math.sqrt(sumSquares / channelData.length);
  const crestFactor = peak / (rms + 0.0001);

  // Estimate compression ratio (simplified)
  if (crestFactor > 20) return 1; // No compression
  if (crestFactor > 14) return 2;
  if (crestFactor > 10) return 4;
  if (crestFactor > 6) return 8;
  return 10; // Heavy compression
}

function calculateStereoWidth(leftChannel: Float32Array, rightChannel: Float32Array): number {
  let midSum = 0,
    sideSum = 0;

  for (let i = 0; i < Math.min(leftChannel.length, rightChannel.length); i++) {
    const mid = (leftChannel[i] + rightChannel[i]) / 2;
    const side = (leftChannel[i] - rightChannel[i]) / 2;
    midSum += mid * mid;
    sideSum += side * side;
  }

  const midRMS = Math.sqrt(midSum / leftChannel.length);
  const sideRMS = Math.sqrt(sideSum / leftChannel.length);

  return midRMS > 0 ? sideRMS / midRMS : 0;
}

function calculatePhaseCorrelation(leftChannel: Float32Array, rightChannel: Float32Array): number {
  let correlation = 0;
  let leftSum = 0,
    rightSum = 0;

  for (let i = 0; i < Math.min(leftChannel.length, rightChannel.length); i++) {
    correlation += leftChannel[i] * rightChannel[i];
    leftSum += leftChannel[i] * leftChannel[i];
    rightSum += rightChannel[i] * rightChannel[i];
  }

  const denominator = Math.sqrt(leftSum * rightSum);
  return denominator > 0 ? correlation / denominator : 0;
}

function calculateMidSideRatio(
  leftChannel: Float32Array,
  rightChannel: Float32Array
): {
  midLevel: number;
  sideLevel: number;
  ratio: number;
} {
  let midSum = 0,
    sideSum = 0;

  for (let i = 0; i < Math.min(leftChannel.length, rightChannel.length); i++) {
    const mid = (leftChannel[i] + rightChannel[i]) / 2;
    const side = (leftChannel[i] - rightChannel[i]) / 2;
    midSum += mid * mid;
    sideSum += side * side;
  }

  const midLevel = Math.sqrt(midSum / leftChannel.length);
  const sideLevel = Math.sqrt(sideSum / leftChannel.length);

  return {
    midLevel: 20 * Math.log10(midLevel + 0.0001),
    sideLevel: 20 * Math.log10(sideLevel + 0.0001),
    ratio: midLevel > 0 ? sideLevel / midLevel : 0,
  };
}

function calculatePanPosition(leftChannel: Float32Array, rightChannel: Float32Array): number {
  let leftSum = 0,
    rightSum = 0;

  for (let i = 0; i < Math.min(leftChannel.length, rightChannel.length); i++) {
    leftSum += leftChannel[i] * leftChannel[i];
    rightSum += rightChannel[i] * rightChannel[i];
  }

  const leftLevel = Math.sqrt(leftSum / leftChannel.length);
  const rightLevel = Math.sqrt(rightSum / rightChannel.length);

  const total = leftLevel + rightLevel;
  if (total === 0) return 0;

  return (rightLevel - leftLevel) / total;
}

function calculateMonoCompatibility(leftChannel: Float32Array, rightChannel: Float32Array): number {
  let monoSum = 0,
    stereoSum = 0;

  for (let i = 0; i < Math.min(leftChannel.length, rightChannel.length); i++) {
    const mono = (leftChannel[i] + rightChannel[i]) / 2;
    const stereoLeft = leftChannel[i];
    const stereoRight = rightChannel[i];

    monoSum += mono * mono;
    stereoSum += (stereoLeft * stereoLeft + stereoRight * stereoRight) / 2;
  }

  const monoLevel = Math.sqrt(monoSum / leftChannel.length);
  const stereoLevel = Math.sqrt(stereoSum / leftChannel.length);

  return stereoLevel > 0 ? monoLevel / stereoLevel : 0;
}

function detectFundamentalFrequency(channelData: Float32Array, sampleRate: number): number {
  // Simple autocorrelation-based pitch detection
  const minPeriod = Math.floor(sampleRate / 2000); // 2000 Hz max
  const maxPeriod = Math.floor(sampleRate / 20); // 20 Hz min

  let bestCorrelation = 0;
  let bestPeriod = minPeriod;

  for (let period = minPeriod; period <= maxPeriod; period++) {
    let correlation = 0;
    for (let i = 0; i < channelData.length - period; i++) {
      correlation += channelData[i] * channelData[i + period];
    }

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }

  return sampleRate / bestPeriod;
}

function analyzeHarmonicsContent(
  channelData: Float32Array,
  sampleRate: number,
  fundamental: number
): Array<{ harmonic: number; frequency: number; magnitude: number }> {
  const harmonics: Array<{ harmonic: number; frequency: number; magnitude: number }> = [];
  const fftSize = 4096;

  // Create temporary analyser for FFT
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;

  const source = audioContext.createBufferSource();
  const buffer = audioContext.createBuffer(1, channelData.length, sampleRate);
  buffer.getChannelData(0).set(channelData);
  source.buffer = buffer;
  source.connect(analyser);

  const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(frequencyData as any);

  const binSize = sampleRate / fftSize;

  // Analyze first 10 harmonics
  for (let h = 1; h <= 10; h++) {
    const harmonicFreq = fundamental * h;
    const binIndex = Math.floor(harmonicFreq / binSize);

    if (binIndex < frequencyData.length) {
      harmonics.push({
        harmonic: h,
        frequency: harmonicFreq,
        magnitude: frequencyData[binIndex],
      });
    }
  }

  source.disconnect();
  analyser.disconnect();
  audioContext.close();

  return harmonics;
}

function calculateTHD(harmonics: Array<{ harmonic: number; magnitude: number }>): number {
  if (harmonics.length < 2) return 0;

  const fundamentalMagnitude = harmonics[0].magnitude;
  let harmonicSum = 0;

  for (let i = 1; i < harmonics.length; i++) {
    harmonicSum += harmonics[i].magnitude * harmonics[i].magnitude;
  }

  const fundamentalPower = fundamentalMagnitude * fundamentalMagnitude;

  return fundamentalPower > 0 ? Math.sqrt(harmonicSum / fundamentalPower) : 0;
}

function calculateHarmonicBalance(harmonics: Array<{ harmonic: number; magnitude: number }>): {
  even: number;
  odd: number;
  ratio: number;
} {
  let evenSum = 0,
    oddSum = 0;

  for (const harmonic of harmonics) {
    if (harmonic.harmonic % 2 === 0) {
      evenSum += harmonic.magnitude;
    } else {
      oddSum += harmonic.magnitude;
    }
  }

  return {
    even: evenSum,
    odd: oddSum,
    ratio: oddSum > 0 ? evenSum / oddSum : 0,
  };
}

function calculateInharmonicity(
  harmonics: Array<{ harmonic: number; frequency: number; magnitude: number }>,
  fundamental: number
): number {
  let deviationSum = 0;
  let totalMagnitude = 0;

  for (const harmonic of harmonics) {
    const expectedFreq = fundamental * harmonic.harmonic;
    const deviation = Math.abs(harmonic.frequency - expectedFreq) / expectedFreq;
    deviationSum += deviation * harmonic.magnitude;
    totalMagnitude += harmonic.magnitude;
  }

  return totalMagnitude > 0 ? deviationSum / totalMagnitude : 0;
}

function generateEQSuggestions(
  frequencyAnalysis: any,
  targetCharacteristics?: string,
  genre?: string
): any {
  const { frequencyBalance, peaks } = frequencyAnalysis;

  // Base EQ suggestions on frequency balance
  const suggestions = {
    lowShelf: {
      frequency: 120,
      gain: 0,
      q: 0.7,
    },
    midPeaking: {
      frequency: 1000,
      gain: 0,
      q: 1.0,
    },
    highShelf: {
      frequency: 8000,
      gain: 0,
      q: 0.7,
    },
    recommendations: [] as string[],
  };

  // Adjust based on frequency balance
  if (frequencyBalance) {
    if (frequencyBalance.low < 0.3) {
      suggestions.lowShelf.gain = 3;
      suggestions.recommendations.push('Boost low frequencies to add warmth and body');
    } else if (frequencyBalance.low > 0.5) {
      suggestions.lowShelf.gain = -2;
      suggestions.recommendations.push('Cut low frequencies to reduce mud and improve clarity');
    }

    if (frequencyBalance.mid < 0.3) {
      suggestions.midPeaking.gain = 2;
      suggestions.recommendations.push('Boost mid frequencies to enhance presence and clarity');
    } else if (frequencyBalance.mid > 0.5) {
      suggestions.midPeaking.gain = -1;
      suggestions.recommendations.push('Cut mid frequencies to reduce boxiness and harshness');
    }

    if (frequencyBalance.high < 0.3) {
      suggestions.highShelf.gain = 3;
      suggestions.recommendations.push('Boost high frequencies to add air and sparkle');
    } else if (frequencyBalance.high > 0.5) {
      suggestions.highShelf.gain = -2;
      suggestions.recommendations.push('Cut high frequencies to reduce harshness and sibilance');
    }
  }

  // Genre-specific adjustments
  if (genre === 'afrofusion' || genre === 'afrobeats') {
    suggestions.lowShelf.frequency = 80;
    suggestions.recommendations.push('Afrofusion: Emphasize low-mid punch for rhythmic drive');
  } else if (genre === 'amapiano') {
    suggestions.midPeaking.frequency = 2000;
    suggestions.recommendations.push('Amapiano: Enhance log drum frequency range');
  }

  // Target characteristic adjustments
  if (targetCharacteristics === 'warm') {
    suggestions.lowShelf.gain += 2;
    suggestions.highShelf.gain -= 1;
  } else if (targetCharacteristics === 'bright') {
    suggestions.highShelf.gain += 2;
    suggestions.lowShelf.gain -= 1;
  } else if (targetCharacteristics === 'punchy') {
    suggestions.midPeaking.gain += 2;
    suggestions.midPeaking.frequency = 500;
  }

  return suggestions;
}

// Export all Emar tools
export const emarTools: ToolDefinition[] = [
  analyzeFrequencySpectrum,
  analyzeDynamics,
  analyzeStereoImaging,
  analyzeHarmonics,
  suggestEQSettings,
];
