import { useState, useCallback } from 'react';

interface OptimisticUpdateOptions<T> {
  mutateFn: (data: T) => Promise<any>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error, originalData: T) => void;
}

export function useOptimisticUpdate<T>(initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(
    async (newData: T, options: OptimisticUpdateOptions<T>) => {
      const originalData = data;

      // Optimistically update
      setData(newData);
      setIsPending(true);
      setError(null);

      try {
        await options.mutateFn(newData);
        options.onSuccess?.(newData);
      } catch (err) {
        // Rollback on error
        setData(originalData);
        setError(err as Error);
        options.onError?.(err as Error, originalData);
      } finally {
        setIsPending(false);
      }
    },
    [data]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setIsPending(false);
  }, [initialData]);

  return { data, update, isPending, error, reset };
}

// Hook for optimistic list operations (add, remove, update)
export function useOptimisticList<T>(initialItems: T[], getId: (item: T) => string) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addItem = useCallback(
    async (item: T, mutateFn: (item: T) => Promise<any>) => {
      setIsPending(true);
      setError(null);

      // Optimistically add
      setItems((prev) => [...prev, item]);

      try {
        await mutateFn(item);
      } catch (err) {
        // Rollback
        setItems((prev) => prev.filter((i) => getId(i) !== getId(item)));
        setError(err as Error);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [getId]
  );

  const updateItem = useCallback(
    async (
      id: string,
      updates: Partial<T>,
      mutateFn: (id: string, updates: Partial<T>) => Promise<any>
    ) => {
      const originalItems = items;
      setIsPending(true);
      setError(null);

      // Optimistically update
      setItems((prev) => prev.map((item) => (getId(item) === id ? { ...item, ...updates } : item)));

      try {
        await mutateFn(id, updates);
      } catch (err) {
        // Rollback
        setItems(originalItems);
        setError(err as Error);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [items, getId]
  );

  const removeItem = useCallback(
    async (id: string, mutateFn: (id: string) => Promise<any>) => {
      const originalItems = items;
      setIsPending(true);
      setError(null);

      // Optimistically remove
      setItems((prev) => prev.filter((item) => getId(item) !== id));

      try {
        await mutateFn(id);
      } catch (err) {
        // Rollback
        setItems(originalItems);
        setError(err as Error);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [items, getId]
  );

  return { items, addItem, updateItem, removeItem, isPending, error, setItems };
}
