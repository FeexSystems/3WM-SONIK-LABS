import { useEffect, useState, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

interface CollaborationOptions {
  roomName: string;
  signalingServers?: string[];
}

interface CollaborationState {
  isConnected: boolean;
  peers: number;
  userId: string;
  awareness: any;
}

export function useCollaboration<T extends Y.Doc>(options: CollaborationOptions) {
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    peers: 0,
    userId: '',
    awareness: null,
  });

  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);

  useEffect(() => {
    const doc = new Y.Doc();
    docRef.current = doc;

    const provider = new WebrtcProvider(options.roomName, doc, {
      signaling: options.signalingServers || ['wss://signaling.yjs.dev'],
    });
    providerRef.current = provider;

    const userId = doc.clientID.toString();
    setState((prev) => ({ ...prev, userId }));

    provider.on('status', (event: any) => {
      setState((prev) => ({ ...prev, isConnected: event.status === 'connected' }));
    });

    provider.on('peers', (event: any) => {
      setState((prev) => ({ ...prev, peers: event.peers.size }));
    });

    const awareness = provider.awareness;
    setState((prev) => ({ ...prev, awareness }));

    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, [options.roomName, options.signalingServers]);

  const updateAwareness = useCallback((data: any) => {
    if (providerRef.current) {
      providerRef.current.awareness.setLocalStateField('user', data);
    }
  }, []);

  const getAwarenessStates = useCallback(() => {
    if (providerRef.current) {
      return Array.from(providerRef.current.awareness.getStates().values());
    }
    return [];
  }, []);

  return {
    ...state,
    doc: docRef.current,
    updateAwareness,
    getAwarenessStates,
  };
}

// Hook for collaborative text editing
export function useCollaborativeText(roomName: string, initialValue: string = '') {
  const [text, setText] = useState(initialValue);
  const { doc, isConnected, userId, updateAwareness } = useCollaboration({ roomName });

  useEffect(() => {
    if (!doc) return;

    const yText = doc.getText('content');
    setText(yText.toString());

    const observer = () => {
      setText(yText.toString());
    };
    yText.observe(observer);

    if (yText.length === 0 && initialValue) {
      yText.insert(0, initialValue);
    }

    return () => {
      yText.unobserve(observer);
    };
  }, [doc, initialValue]);

  const updateText = useCallback(
    (newText: string) => {
      if (!doc) return;
      const yText = doc.getText('content');
      yText.delete(0, yText.length);
      yText.insert(0, newText);
    },
    [doc]
  );

  return { text, updateText, isConnected, userId, updateAwareness };
}

// Hook for collaborative array/list
export function useCollaborativeArray<T>(roomName: string, initialItems: T[] = []) {
  const [items, setItems] = useState<T[]>(initialItems);
  const { doc, isConnected, userId } = useCollaboration({ roomName });

  useEffect(() => {
    if (!doc) return;

    const yArray = doc.getArray<T>('items');
    setItems(yArray.toArray());

    const arrayObserver = () => {
      setItems(yArray.toArray());
    };
    yArray.observe(arrayObserver);

    if (yArray.length === 0 && initialItems.length > 0) {
      yArray.push(initialItems);
    }

    return () => {
      yArray.unobserve(arrayObserver);
    };
  }, [doc, initialItems]);

  const addItem = useCallback(
    (item: T) => {
      if (!doc) return;
      const yArray = doc.getArray<T>('items');
      yArray.push([item]);
    },
    [doc]
  );

  const removeItem = useCallback(
    (index: number) => {
      if (!doc) return;
      const yArray = doc.getArray<T>('items');
      yArray.delete(index, 1);
    },
    [doc]
  );

  const updateItem = useCallback(
    (index: number, item: T) => {
      if (!doc) return;
      const yArray = doc.getArray<T>('items');
      yArray.delete(index, 1);
      yArray.insert(index, [item]);
    },
    [doc]
  );

  return { items, addItem, removeItem, updateItem, isConnected, userId };
}
