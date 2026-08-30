import { useState, useEffect, useCallback, useRef } from 'react';

export function useAudioContext() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initialize = useCallback(async () => {
    try {
      if (audioContext) {
        await audioContext.resume();
        return audioContext;
      }

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
      setIsInitialized(true);
      return ctx;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [audioContext]);

  const suspend = useCallback(async () => {
    if (audioContext) {
      await audioContext.suspend();
    }
  }, [audioContext]);

  const resume = useCallback(async () => {
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  }, [audioContext]);

  const close = useCallback(async () => {
    if (audioContext) {
      await audioContext.close();
      setAudioContext(null);
      setIsInitialized(false);
    }
  }, [audioContext]);

  return {
    audioContext,
    isInitialized,
    error,
    initialize,
    suspend,
    resume,
    close,
  };
}

export function useAnalyser(audioContext: AudioContext | null, fftSize: number = 2048) {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    if (!audioContext) return;

    const node = audioContext.createAnalyser();
    node.fftSize = fftSize;
    setAnalyser(node);

    return () => {
      node.disconnect();
    };
  }, [audioContext, fftSize]);

  return analyser;
}

export function useGainNode(audioContext: AudioContext | null, initialValue: number = 1) {
  const [gainNode, setGainNode] = useState<GainNode | null>(null);

  useEffect(() => {
    if (!audioContext) return;

    const node = audioContext.createGain();
    node.gain.value = initialValue;
    setGainNode(node);

    return () => {
      node.disconnect();
    };
  }, [audioContext, initialValue]);

  const setGain = useCallback(
    (value: number) => {
      if (gainNode) {
        gainNode.gain.setValueAtTime(value, audioContext?.currentTime || 0);
      }
    },
    [gainNode, audioContext]
  );

  return { gainNode, setGain };
}
