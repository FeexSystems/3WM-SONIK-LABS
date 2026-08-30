import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface AudioAnalyzerData {
  kickIntensity: number;
  vocalEnergy: number;
  overallRMS: number;
}

/**
 * useAudioAnalyzer Hook
 * Bridges the Web Audio API Context with the React Three Fiber rendering loop.
 *
 * @param audioContext The active AudioContext from the VoiceAgentEngine or LandingAudioEngine.
 * @param sourceNode The specific audio node (e.g. MediaElementSource or MediaStreamSource) to analyze.
 * @returns A ref containing the current frame's extracted audio data for use in R3F meshes.
 */
export const useAudioAnalyzer = (
  audioContext: AudioContext | null,
  sourceNode: AudioNode | null
) => {
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Expose this mutable ref to components so they can read values synchronously in useFrame
  const metricsRef = useRef<AudioAnalyzerData>({
    kickIntensity: 0,
    vocalEnergy: 0,
    overallRMS: 0,
  });

  useEffect(() => {
    if (!audioContext || !sourceNode) return;

    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    analyzer.smoothingTimeConstant = 0.8;

    sourceNode.connect(analyzer);

    analyzerRef.current = analyzer;
    dataArrayRef.current = new Uint8Array(analyzer.frequencyBinCount);

    return () => {
      sourceNode.disconnect(analyzer);
      analyzer.disconnect();
    };
  }, [audioContext, sourceNode]);

  // Optionally hook into useFrame here if this hook is used inside the <Canvas>,
  // otherwise, the consuming R3F component should call an update function on useFrame.
  useFrame(() => {
    if (!analyzerRef.current || !dataArrayRef.current) return;

    analyzerRef.current.getByteFrequencyData(dataArrayRef.current as any);

    const data = dataArrayRef.current;

    // Example logic to extract specific bands
    // Kick drum usually resides in the lower frequency bins (e.g. 0-5)
    let kickSum = 0;
    for (let i = 0; i < 5; i++) kickSum += data[i];

    // Vocals usually reside in the mid frequencies (e.g. 20-60)
    let vocalSum = 0;
    for (let i = 20; i < 60; i++) vocalSum += data[i];

    metricsRef.current = {
      kickIntensity: kickSum / 5 / 255,
      vocalEnergy: vocalSum / 40 / 255,
      overallRMS: Array.from(data).reduce((acc, val) => acc + val, 0) / data.length / 255,
    };
  });

  return metricsRef;
};
