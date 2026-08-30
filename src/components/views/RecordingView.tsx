import React, { useState, useEffect, useRef } from 'react';
import { Track, RecordedTake, StemTrack } from '../../types';
import { soundEngine } from '../../audio/engine';
import { orchestrator } from '../../agents/Orchestrator';
import { midiSynth } from '../../audio/midiEngine';
import { transportBridge } from '../../audio/transportBridge';
import {
  Mic,
  Square,
  Circle,
  Play,
  Pause,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
  Headphones,
  Volume2,
  Radio,
  Sliders,
  Layers,
  Repeat,
  Music4,
  Zap,
  Activity,
} from 'lucide-react';

interface RecordingViewProps {
  track: Track;
  onAddTake: (take: RecordedTake) => void;
  onNavigate: (view: string) => void;
}

export const RecordingView: React.FC<RecordingViewProps> = ({ track, onAddTake, onNavigate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingBacking, setIsPlayingBacking] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [targetStem, setTargetStem] = useState<string>('Vocals');

  // Studio linking controls
  const [linkBeatLab, setLinkBeatLab] = useState<boolean>(true);
  const [directMonitoring, setDirectMonitoring] = useState<boolean>(true);
  const [monitorVolume, setMonitorVolume] = useState<number>(75);
  const [metronomeEnabled, setMetronomeEnabled] = useState<boolean>(false);
  const [preRollCountIn, setPreRollCountIn] = useState<boolean>(false);
  const [countInBeat, setCountInBeat] = useState<number>(0);

  // Dynamic Sidechain Ducking Controls
  const [sidechainEnabled, setSidechainEnabled] = useState<boolean>(true);
  const [isSendingToKingpin, setIsSendingToKingpin] = useState(false);
  const [duckAmountDb, setDuckAmountDb] = useState<number>(-6);
  const [duckThresholdDb, setDuckThresholdDb] = useState<number>(-26);
  const [duckReleaseMs, setDuckReleaseMs] = useState<number>(220);
  const [gainReductionDb, setGainReductionDb] = useState<number>(0);

  // Takes management
  const [sessionTakes, setSessionTakes] = useState<RecordedTake[]>([]);
  const [activeTakeId, setActiveTakeId] = useState<string | null>(null);
  const [playingTakeId, setPlayingTakeId] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const beatIntervalRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Sync sidechain configuration with soundEngine
  useEffect(() => {
    soundEngine.setSidechainDucking(sidechainEnabled, duckAmountDb, duckThresholdDb, duckReleaseMs);
  }, [sidechainEnabled, duckAmountDb, duckThresholdDb, duckReleaseMs]);

  // Poll Mic Input level while recording or armed and update sidechain
  useEffect(() => {
    let animId: number;
    const checkLevel = () => {
      if (isRecording) {
        const lvl = soundEngine.getInputLevel();
        setMicLevel(lvl);
        soundEngine.updateSidechainDucking(lvl);
        setGainReductionDb(soundEngine.getSidechainGainReduction());
      } else {
        setMicLevel(0);
        soundEngine.updateSidechainDucking(0);
        setGainReductionDb(soundEngine.getSidechainGainReduction());
      }
      animId = requestAnimationFrame(checkLevel);
    };
    animId = requestAnimationFrame(checkLevel);
    return () => cancelAnimationFrame(animId);
  }, [isRecording]);

  // Adjust direct monitoring in real time
  useEffect(() => {
    soundEngine.setDirectMonitoring(directMonitoring, monitorVolume / 100);
  }, [directMonitoring, monitorVolume]);

  // Synchronize recording state with master transport bridge
  useEffect(() => {
    const unsubRec = transportBridge.subscribe('RECORD_STATE_CHANGE', (state) => {
      setIsRecording(state.isRecording);
    });
    const unsubPlay = transportBridge.subscribe('PLAY_STATE_CHANGE', (state) => {
      setIsPlayingBacking(state.isPlaying);
    });

    return () => {
      unsubRec();
      unsubPlay();
    };
  }, []);

  const startMetronomeAndBeat = () => {
    const bpm = track.bpm || 140;
    const intervalMs = (60 / bpm) * 1000;
    let step = 0;

    if (linkBeatLab) {
      soundEngine.startPlayback();
    }

    beatIntervalRef.current = window.setInterval(() => {
      step = (step + 1) % 16;
      if (metronomeEnabled && step % 4 === 0) {
        soundEngine.playMetronomeClick(step === 0);
      }
    }, intervalMs / 4);
  };

  const stopMetronomeAndBeat = () => {
    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }
    if (linkBeatLab) {
      soundEngine.stopPlayback();
    }
  };

  const handleStartRecord = async () => {
    if (preRollCountIn) {
      setCountInBeat(4);
      const countTimer = setInterval(
        () => {
          setCountInBeat((prev) => {
            soundEngine.playMetronomeClick(prev === 4);
            if (prev <= 1) {
              clearInterval(countTimer);
              executeRecordingStart();
              return 0;
            }
            return prev - 1;
          });
        },
        (60 / (track.bpm || 140)) * 1000
      );
    } else {
      executeRecordingStart();
    }
  };

  const executeRecordingStart = async () => {
    const success = await soundEngine.startRecording(directMonitoring);
    if (success) {
      setHasMicPermission(true);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      // Start synchronized beat backing
      startMetronomeAndBeat();
      setIsPlayingBacking(true);
    } else {
      setHasMicPermission(false);
    }
  };

  const handleStopRecord = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopMetronomeAndBeat();
    setIsPlayingBacking(false);
    setIsRecording(false);

    const take = await soundEngine.stopRecording();
    if (take) {
      take.label = `${targetStem} Take ${sessionTakes.length + 1}`;
      setSessionTakes((prev) => [take, ...prev]);
      setActiveTakeId(take.id);
      onAddTake(take);
    }
  };

  const togglePlayBacking = () => {
    if (isPlayingBacking) {
      stopMetronomeAndBeat();
      setIsPlayingBacking(false);
    } else {
      startMetronomeAndBeat();
      setIsPlayingBacking(true);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-200">
      {/* Studio Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <Mic className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-neutral-100 uppercase tracking-tight">
              3WM Recording Studio & Live Beat Sync
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Real-time vocal tracking linked directly with BeatLab sequencer, headphone zero-latency
            cue monitoring, and stem routing.
          </p>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-3 py-1.5 rounded-lg bg-neutral-950 text-amber-300 border border-neutral-800 flex items-center gap-1.5">
            <Music4 className="w-3.5 h-3.5" />
            {track.bpm || 140} BPM • {track.key || 'C Minor'}
          </span>
          <button
            onClick={() => onNavigate('beatlab')}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
          >
            Open BeatLab
          </button>
        </div>
      </div>

      {/* Permission Warning */}
      {hasMicPermission === false && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-xs text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>
            Microphone access was denied. Please allow microphone permissions in your browser to
            record real vocal takes.
          </span>
        </div>
      )}

      {/* Studio Deck Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Recording Console */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-between text-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Animated Background Glow when Recording */}
          {isRecording && (
            <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
          )}

          {/* Top Bar: Stem Selector & Count In */}
          <div className="w-full flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-400">TARGET STEM:</span>
              <select
                value={targetStem}
                onChange={(e) => setTargetStem(e.target.value)}
                disabled={isRecording}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-amber-400 font-bold focus:outline-none"
              >
                <option value="Vocals">Lead Vocals</option>
                <option value="Vocal Doubles">Vocal Doubles & Harmony</option>
                <option value="Adlibs & Chants">Adlibs & Chants</option>
                <option value="Instruments & Horns">Live Acoustic / Horns</option>
                <option value="Live Percussion">Live Percussion / Shekere</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreRollCountIn(!preRollCountIn)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition border ${
                  preRollCountIn
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                }`}
              >
                1-Bar Count-In
              </button>
            </div>
          </div>

          {/* Big Record Timer & Beat Sync Visualizer */}
          <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800/80 px-8 py-5 rounded-2xl shadow-inner font-mono relative">
            {countInBeat > 0 ? (
              <div className="py-2">
                <span className="text-xs text-amber-400 block mb-1 font-bold">COUNTING IN...</span>
                <span className="text-5xl font-black text-amber-400 animate-bounce">
                  {countInBeat}
                </span>
              </div>
            ) : (
              <>
                <span className="text-[11px] text-neutral-400 block mb-1">
                  {isRecording ? 'LIVE RECORDING IN PROGRESS' : 'STUDIO TRANSPORT READY'}
                </span>
                <span
                  className={`text-5xl font-black tracking-wider ${
                    isRecording ? 'text-red-500 animate-pulse' : 'text-neutral-200'
                  }`}
                >
                  {formatSeconds(recordingSeconds)}
                </span>
              </>
            )}
          </div>

          {/* Live Mic VU Meter */}
          <div className="w-full max-w-md space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Radio
                  className={`w-3.5 h-3.5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-neutral-500'}`}
                />
                MIC INPUT VU METER
              </span>
              <span className="font-bold">{Math.round(micLevel * 100)}%</span>
            </div>
            <div className="w-full h-3.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  micLevel > 0.85
                    ? 'bg-red-500 shadow-md shadow-red-500/50'
                    : micLevel > 0.6
                      ? 'bg-amber-400 shadow-md shadow-amber-400/50'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, micLevel * 100)}%` }}
              />
            </div>
          </div>

          {/* Primary Transport Controls */}
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={togglePlayBacking}
              className={`p-3.5 rounded-full border transition flex items-center justify-center ${
                isPlayingBacking
                  ? 'bg-amber-400 text-black border-amber-400 shadow-lg shadow-amber-400/20'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:text-white hover:border-neutral-700'
              }`}
              title="Audition Beat Backing"
            >
              {isPlayingBacking ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
            </button>

            {isRecording ? (
              <button
                type="button"
                onClick={handleStopRecord}
                className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 text-white flex flex-col items-center justify-center gap-1 shadow-2xl shadow-red-600/50 transition transform hover:scale-105 active:scale-95"
              >
                <Square className="w-7 h-7 fill-current" />
                <span className="text-[10px] font-bold font-mono">STOP</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartRecord}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-400 text-white flex flex-col items-center justify-center gap-1 shadow-2xl shadow-red-500/40 transition transform hover:scale-105 active:scale-95"
              >
                <Circle className="w-7 h-7 fill-current" />
                <span className="text-[10px] font-bold font-mono">RECORD</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Studio Linking & Headphone Cue Mix */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* BeatLab & Headphone Sync Rack */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Studio Sync & Cue Mix
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                LOW LATENCY
              </span>
            </div>

            {/* Link BeatLab Sequencer Toggle */}
            <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-850">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-neutral-200">Link BeatLab Drum Engine</span>
                <span className="text-[11px] text-neutral-400">
                  Plays 808 Trap & Afro drums synchronously while recording
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLinkBeatLab(!linkBeatLab)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  linkBeatLab ? 'bg-amber-400' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black transition-transform ${
                    linkBeatLab ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Headphone Direct Monitoring Toggle */}
            <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-850">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-bold text-neutral-200">
                    Zero-Latency Cue Monitor
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400">
                  Hear your mic output directly in headphones without delay
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDirectMonitoring(!directMonitoring)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  directMonitoring ? 'bg-cyan-400' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black transition-transform ${
                    directMonitoring ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Cue Monitoring Volume Slider */}
            {directMonitoring && (
              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-850 space-y-2">
                <div className="flex justify-between text-xs font-mono text-neutral-400">
                  <span>HEADPHONE CUE GAIN</span>
                  <span className="text-cyan-300 font-bold">{monitorVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={monitorVolume}
                  onChange={(e) => setMonitorVolume(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            )}

            {/* Metronome Click Toggle */}
            <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-850">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-neutral-200">Studio Metronome Click</span>
                <span className="text-[11px] text-neutral-400">
                  Quarter-note click guide at {track.bpm || 140} BPM
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMetronomeEnabled(!metronomeEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  metronomeEnabled ? 'bg-amber-400' : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black transition-transform ${
                    metronomeEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Dynamic Vocal Sidechain Ducking Rack */}
            <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-850 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-neutral-200">
                    Dynamic Vocal Sidechain Ducking
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSidechainEnabled(!sidechainEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                    sidechainEnabled ? 'bg-amber-400' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-black transition-transform ${
                      sidechainEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {sidechainEnabled && (
                <div className="space-y-3 pt-1">
                  <p className="text-[11px] text-neutral-400">
                    Automatically attenuates background stems & 808s whenever vocal presence is
                    detected.
                  </p>

                  {/* Real-time Dynamic Gain Reduction (GR) Meter */}
                  <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-neutral-400">GAIN REDUCTION (GR):</span>
                      <span
                        className={`font-bold ${gainReductionDb < -1 ? 'text-amber-400' : 'text-neutral-500'}`}
                      >
                        {gainReductionDb.toFixed(1)} dB
                      </span>
                    </div>
                    <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-75 ${
                          gainReductionDb < -8
                            ? 'bg-red-500 shadow-sm shadow-red-500/50'
                            : gainReductionDb < -3
                              ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                              : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.abs(gainReductionDb) * 6)}%` }}
                      />
                    </div>
                  </div>

                  {/* Ducking Amount Presets */}
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 block mb-1">
                      DUCK DEPTH:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: '-3dB', val: -3, desc: 'Subtle' },
                        { label: '-6dB', val: -6, desc: 'Standard' },
                        { label: '-10dB', val: -10, desc: 'Deep' },
                        { label: '-16dB', val: -16, desc: 'Heavy' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setDuckAmountDb(item.val)}
                          className={`py-1 px-1.5 rounded-lg text-center font-mono text-[10px] font-bold border transition ${
                            duckAmountDb === item.val
                              ? 'bg-amber-400 text-black border-amber-400'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <div>{item.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Threshold & Release Sliders */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                        <span>THRESHOLD</span>
                        <span className="text-amber-300 font-bold">{duckThresholdDb} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-40"
                        max="-6"
                        step="1"
                        value={duckThresholdDb}
                        onChange={(e) => setDuckThresholdDb(Number(e.target.value))}
                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                        <span>RELEASE</span>
                        <span className="text-amber-300 font-bold">{duckReleaseMs} ms</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="600"
                        step="20"
                        value={duckReleaseMs}
                        onChange={(e) => setDuckReleaseMs(Number(e.target.value))}
                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recorded Takes Session Manager */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Studio Takes Manager ({sessionTakes.length} Takes in Session)
            </h3>
          </div>
          <button
            onClick={() => onNavigate('studio')}
            className="text-xs font-bold px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black rounded-xl transition"
          >
            Arrange in Multi-Track Studio →
          </button>
        </div>

        {sessionTakes.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500 font-mono">
            No takes recorded yet in this session. Press RECORD above to capture vocal or instrument
            stems.
          </div>
        ) : (
          <div className="space-y-3">
            {sessionTakes.map((take) => (
              <div
                key={take.id}
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition ${
                  activeTakeId === take.id
                    ? 'bg-amber-400/5 border-amber-400/40'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-mono text-xs font-bold">
                    T{take.takeNumber}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{take.label}</h4>
                    <p className="text-[11px] font-mono text-neutral-400">
                      Duration: {(take.durationMs / 1000).toFixed(1)}s • Stem: {take.stemId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <audio controls src={take.blobUrl} className="h-8 w-64 accent-amber-400" />
                  <button
                    type="button"
                    onClick={() => {
                      setSessionTakes((prev) => prev.filter((t) => t.id !== take.id));
                    }}
                    className="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition"
                    title="Delete Take"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
