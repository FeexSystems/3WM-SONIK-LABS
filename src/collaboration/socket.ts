// @deprecated — socket.io removed, now Supabase Realtime via supabase.channel
import { supabase } from '../lib/supabase';
import { worldState } from '../agents/WorldState';
import { Track } from '../types';

let isInitialized = false;

// Channel for high-frequency UI updates (presence/cursors)
const uiChannel = supabase.channel('ui-state', {
  config: { broadcast: { ack: false } },
});

// Channel for lower-frequency, high-reliability track data
const dataChannel = supabase.channel('track-data', {
  config: { broadcast: { ack: true } },
});

export const initMultiplayer = () => {
  if (isInitialized) return;

  dataChannel.on('broadcast', { event: 'track-update' }, ({ payload }) => {
    console.log('Received track update from remote collaborator', payload);
  });

  dataChannel.on('broadcast', { event: 'agent-activity' }, ({ payload }) => {
    worldState.logActivity(payload.agent, payload.message);
  });

  uiChannel.on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
    // Handle remote cursor rendering
  });

  dataChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected to 3WM Multiplayer Data Channel');
    }
  });

  uiChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected to 3WM Multiplayer UI Channel');
    }
  });

  isInitialized = true;
};

export const broadcastTrackUpdate = (track: Track) => {
  dataChannel.send({
    type: 'broadcast',
    event: 'track-update',
    payload: track,
  });
};

export const broadcastCursorMove = (x: number, y: number, view: string) => {
  uiChannel.send({
    type: 'broadcast',
    event: 'cursor-move',
    payload: { x, y, view, userId: 'current-user' },
  });
};
