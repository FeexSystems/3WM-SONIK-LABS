import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Loader2, Radio } from 'lucide-react';

interface LiveAudioAgentProps {
  sessionId?: string;
  backendUrl?: string; // e.g. ws://localhost:3001/ws/live/
  onTranscript?: (text: string, role: 'user' | 'agent') => void;
}

export const LiveAudioAgent: React.FC<LiveAudioAgentProps> = ({
  sessionId = 'session_' + Math.random().toString(36).substring(2, 11),
  backendUrl = 'ws://localhost:3001/ws/live/',
  onTranscript,
}) => {
  const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [transcript, setTranscript] = useState<{ id: string; role: 'user' | 'agent'; text: string }[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    return () => {
      stopConnection();
    };
  }, []);

  const appendTranscript = useCallback((text: string, role: 'user' | 'agent') => {
    setTranscript((prev) => [...prev, { id: Math.random().toString(), role, text }]);
    if (onTranscript) onTranscript(text, role);
  }, [onTranscript]);

  const convertFloat32ToInt16 = (buffer: Float32Array) => {
    let l = buffer.length;
    const buf = new Int16Array(l);
    while (l--) {
      const s = Math.max(-1, Math.min(1, buffer[l]));
      buf[l] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return buf;
  };

  const playIncomingAudio = (arrayBuffer: ArrayBuffer) => {
    if (!audioCtxRef.current) return;
    const int16Array = new Int16Array(arrayBuffer);
    const float32Array = new Float32Array(int16Array.length);

    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0; // Normalize back to Float32
    }

    const buffer = audioCtxRef.current.createBuffer(1, float32Array.length, 16000);
    buffer.copyToChannel(float32Array, 0);

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtxRef.current.destination);

    const startTime = Math.max(nextPlayTimeRef.current, audioCtxRef.current.currentTime);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;
  };

  const startRecording = async () => {
    try {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (!audioCtxRef.current) return;
      const source = audioCtxRef.current.createMediaStreamSource(micStreamRef.current);

      // Prefer modern AudioWorkletNode to eliminate ScriptProcessorNode deprecation warnings
      if (audioCtxRef.current.audioWorklet) {
        try {
          const workletCode = `
            class PcmCaptureProcessor extends AudioWorkletProcessor {
              process(inputs) {
                const input = inputs[0];
                if (input && input[0]) {
                  this.port.postMessage(input[0]);
                }
                return true;
              }
            }
            registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
          `;
          const blob = new Blob([workletCode], { type: 'application/javascript' });
          const workletUrl = URL.createObjectURL(blob);
          await audioCtxRef.current.audioWorklet.addModule(workletUrl);
          URL.revokeObjectURL(workletUrl);

          const workletNode = new AudioWorkletNode(audioCtxRef.current, 'pcm-capture-processor');
          workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              const pcm16 = convertFloat32ToInt16(e.data);
              wsRef.current.send(pcm16.buffer);
            }
          };
          source.connect(workletNode);
          workletNode.connect(audioCtxRef.current.destination);
          processorRef.current = workletNode;
          return;
        } catch {
          // If AudioWorklet fails to initialize, fallback to ScriptProcessorNode
        }
      }

      const legacyProcessor = audioCtxRef.current.createScriptProcessor(2048, 1, 1);
      processorRef.current = legacyProcessor;
      source.connect(legacyProcessor);
      legacyProcessor.connect(audioCtxRef.current.destination);

      legacyProcessor.onaudioprocess = (e) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = convertFloat32ToInt16(inputData);
          wsRef.current.send(pcm16.buffer);
        }
      };
    } catch (err) {
      console.error('Microphone access denied: ', err);
      appendTranscript('Error: Microphone access denied.', 'agent');
      stopConnection();
    }
  };

  const startConnection = async () => {
    setStatus('CONNECTING');
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass({ sampleRate: 16000 });
      nextPlayTimeRef.current = audioCtxRef.current.currentTime;

      const wsUrl = `${backendUrl.replace(/\/$/, '')}/${sessionId}`;
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.binaryType = 'arraybuffer';

      wsRef.current.onopen = async () => {
        setStatus('CONNECTED');
        await startRecording();
      };

      wsRef.current.onmessage = async (event) => {
        if (event.data instanceof ArrayBuffer) {
          playIncomingAudio(event.data);
        } else {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'text') {
              appendTranscript(message.content, 'agent');
            }
          } catch (e) {
            console.error('Failed to parse WS message', e);
          }
        }
      };

      wsRef.current.onclose = () => {
        stopConnection();
      };

      wsRef.current.onerror = (err) => {
        console.error('WebSocket Error: ', err);
        stopConnection();
      };
    } catch (err) {
      console.error('Failed to start connection:', err);
      stopConnection();
    }
  };

  const stopConnection = () => {
    setStatus('DISCONNECTED');

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(console.error);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }

    wsRef.current = null;
    audioCtxRef.current = null;
    micStreamRef.current = null;
    processorRef.current = null;
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c0e] shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-black/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3 items-center justify-center">
            {status === 'CONNECTED' ? (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </>
            ) : status === 'CONNECTING' ? (
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            ) : (
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">
            {status === 'CONNECTED'
              ? 'Live Agent Active'
              : status === 'CONNECTING'
                ? 'Establishing Uplink...'
                : 'Live Agent Offline'}
          </span>
        </div>
        
        <div className="flex gap-2">
          {status === 'DISCONNECTED' ? (
            <button
              onClick={startConnection}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20"
            >
              <Mic className="h-3.5 w-3.5" />
              Connect Live
            </button>
          ) : status === 'CONNECTING' ? (
            <button
              disabled
              className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Connecting...
            </button>
          ) : (
            <button
              onClick={stopConnection}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Transcript Area */}
      <div 
        ref={transcriptRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[120px] max-h-[250px] bg-gradient-to-b from-transparent to-black/20"
      >
        {transcript.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-zinc-600">
            <Radio className="mb-2 h-8 w-8 opacity-20" />
            <p className="font-mono text-xs">Awaiting voice uplink...</p>
          </div>
        ) : (
          transcript.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <span className="mb-1 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                {msg.role === 'user' ? 'You' : 'Agent'}
              </span>
              <div
                className={`rounded-xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'bg-emerald-950/30 border border-emerald-900/50 text-emerald-100'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
