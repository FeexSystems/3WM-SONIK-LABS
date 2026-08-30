import { useEffect, useRef, useCallback } from 'react';

export function useWebWorker<T extends any, R extends any>(
  workerScript: string,
  onMessage: (data: R) => void,
  onError?: (error: Error) => void
) {
  const workerRef = useRef<Worker | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;

    try {
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      workerRef.current = new Worker(url);

      workerRef.current.onmessage = (e: MessageEvent<R>) => {
        onMessage(e.data);
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        onError?.(new Error(error.message));
      };

      isInitializedRef.current = true;

      return () => {
        URL.revokeObjectURL(url);
        workerRef.current?.terminate();
        workerRef.current = null;
        isInitializedRef.current = false;
      };
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      onError?.(error as Error);
    }
  }, [workerScript, onMessage, onError]);

  const postMessage = useCallback((data: T) => {
    if (workerRef.current) {
      workerRef.current.postMessage(data);
    }
  }, []);

  const terminate = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    isInitializedRef.current = false;
  }, []);

  return { postMessage, terminate };
}
