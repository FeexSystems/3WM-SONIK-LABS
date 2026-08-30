import React, { useState, useEffect } from 'react';
import { Play, Pause, Disc, Check, Sparkles, Flame, Sliders } from 'lucide-react';
import { landingAudioEngine } from '../../../audio/landingAudioEngine';

interface StepLayer {
  name: string;
  color: string;
  steps: boolean[];
}

interface RickyBounceWidgetProps {
  tempoBpm?: number;
  presetName?: string;
  onApplyToDaw?: (pattern: { bpm: number; swing: number; layers: StepLayer[] }) => void;
}

const DEFAULT_LAYERS: StepLayer[] = [
  {
    name: 'Kick Punch',
    color: 'bg-amber-500',
    steps: [
      true,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      true,
      false,
    ],
  },
  {
    name: 'Log Drum Sub',
    color: 'bg-orange-500',
    steps: [
      true,
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      true,
      false,
      false,
    ],
  },
  {
    name: 'Rim / Clave',
    color: 'bg-yellow-400',
    steps: [
      false,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
    ],
  },
  {
    name: 'Afro Shaker',
    color: 'bg-amber-300',
    steps: [
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ],
  },
];

export const RickyBounceWidget: React.FC<RickyBounceWidgetProps> = ({
  tempoBpm = 112,
  presetName = 'Lagos 3AM Amapiano Log',
  onApplyToDaw,
}) => {
  const [bpm, setBpm] = useState<number>(tempoBpm);
  const [swing, setSwing] = useState<number>(58); // 58% Afrobeat / Amapiano swing
  const [drive, setDrive] = useState<number>(45); // Log drum distortion
  const [layers, setLayers] = useState<StepLayer[]>(DEFAULT_LAYERS);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isApplied, setIsApplied] = useState<boolean>(false);

  const toggleStep = (layerIdx: number, stepIdx: number) => {
    setLayers((prev) => {
      const copy = [...prev];
      const stepCopy = [...copy[layerIdx].steps];
      stepCopy[stepIdx] = !stepCopy[stepIdx];
      copy[layerIdx] = { ...copy[layerIdx], steps: stepCopy };
      return copy;
    });
    setIsApplied(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      const stepDuration = (60 / bpm / 4) * 1000;
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          const next = (prev + 1) % 16;
          // Trigger audio for active steps
          if (layers[0].steps[next]) landingAudioEngine.playKick(0);
          if (layers[1].steps[next]) landingAudioEngine.playLogDrum(0, 50);
          return next;
        });
      }, stepDuration);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, bpm, layers]);

  const handleCommit = () => {
    setIsApplied(true);
    if (onApplyToDaw) {
      onApplyToDaw({ bpm, swing, layers });
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-[#160f06] p-4 text-amber-100 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <Flame className="h-4 w-4 animate-bounce" />
          </div>
          <div>
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
              Ricky 808 Groove Generator
            </h4>
            <p className="text-[11px] text-zinc-400">{presetName} & Syncopated Log Drum Matrix</p>
          </div>
        </div>
        <span className="rounded-full border border-amber-500/30 bg-amber-950/60 px-2.5 py-0.5 font-mono text-[10px] text-amber-300">
          Sound God
        </span>
      </div>

      {/* Sequencer Grid */}
      <div className="mb-3 space-y-2 rounded-lg border border-amber-950/70 bg-black/50 p-2.5">
        {layers.map((layer, lIdx) => (
          <div key={layer.name} className="flex items-center gap-2">
            <span className="w-24 truncate font-mono text-[10px] font-semibold text-zinc-300">
              {layer.name}
            </span>
            <div className="grid flex-1 grid-cols-16 gap-1">
              {layer.steps.map((active, sIdx) => {
                const isCurrent = isPlaying && currentStep === sIdx;
                const isBarStart = sIdx % 4 === 0;
                return (
                  <button
                    key={sIdx}
                    onClick={() => toggleStep(lIdx, sIdx)}
                    className={`h-6 rounded transition-all ${
                      active
                        ? `${layer.color} text-black font-bold shadow-md shadow-amber-500/20`
                        : isBarStart
                          ? 'bg-amber-950/60 hover:bg-amber-900/60 border border-amber-900/40'
                          : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800'
                    } ${isCurrent ? 'ring-2 ring-white scale-105' : ''}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Macro Knobs & Groove Feel */}
      <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg border border-amber-950 bg-black/40 p-2.5">
        <div>
          <label className="block font-mono text-[10px] text-zinc-400">
            Tempo: <span className="text-amber-300 font-bold">{bpm} BPM</span>
          </label>
          <input
            type="range"
            min="90"
            max="140"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-amber-950 accent-amber-400"
          />
        </div>

        <div>
          <label className="block font-mono text-[10px] text-zinc-400">
            Groove Swing: <span className="text-amber-300 font-bold">{swing}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="80"
            value={swing}
            onChange={(e) => setSwing(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-amber-950 accent-amber-400"
          />
        </div>

        <div>
          <label className="block font-mono text-[10px] text-zinc-400">
            Sub Saturation: <span className="text-amber-300 font-bold">{drive}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={drive}
            onChange={(e) => setDrive(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-amber-950 accent-amber-400"
          />
        </div>
      </div>

      {/* Controls & DAW Inject */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-900/60"
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-amber-300" />
          )}
          {isPlaying ? 'Stop Loop' : 'Play Bounce'}
        </button>

        <button
          onClick={handleCommit}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
            isApplied
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
              : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black hover:opacity-95'
          }`}
        >
          {isApplied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Groove Locked to BeatLab
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Inject Pattern into DAW
            </>
          )}
        </button>
      </div>
    </div>
  );
};
