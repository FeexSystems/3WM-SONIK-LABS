import React, { useState } from 'react';
import { Track, TrackSettings, StemTrack } from '../../types';
import { RotaryKnob } from '../../design-system/RotaryKnob';
import { FaderSlider } from '../../design-system/FaderSlider';
import { LedMeter } from '../../design-system/LedMeter';
import {
  Sliders,
  Sparkles,
  Activity,
  Shield,
  RotateCcw,
  Volume2,
  Radio,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { MidiControllerMappingModal } from '../audio/MidiControllerMappingModal';
import { AutomationLaneEditor } from '../audio/AutomationLaneEditor';
import { AudioEngineDiagnosticOverlay } from '../audio/AudioEngineDiagnosticOverlay';

interface MixerViewProps {
  track: Track;
  onUpdateTrackSettings: (settingsPatch: Partial<TrackSettings>, stems?: StemTrack[]) => void;
  isPlaying: boolean;
}

export const MixerView: React.FC<MixerViewProps> = ({
  track,
  onUpdateTrackSettings,
  isPlaying,
}) => {
  const { eq, compression, reverb, volume } = track.settings;

  const [isMidiModalOpen, setIsMidiModalOpen] = useState(false);
  const [isDiagModalOpen, setIsDiagModalOpen] = useState(false);
  const [showAutomation, setShowAutomation] = useState(true);

  const handleEqChange = (key: 'low' | 'mid' | 'high', val: number) => {
    onUpdateTrackSettings({
      eq: { ...eq, [key]: val },
    });
  };

  const handleCompressionChange = (key: string, val: number) => {
    onUpdateTrackSettings({
      compression: { ...compression, [key]: val },
    });
  };

  const handleReverbChange = (key: string, val: any) => {
    onUpdateTrackSettings({
      reverb: { ...reverb, [key]: val },
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-neutral-100 uppercase tracking-tight">
              3WM Analog Console & Multi-Stem Mixer
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Precision 3-band parametric EQ, opto-compression, Lagos Shrine reverb modeling, stem
            faders, and graphical automation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* MIDI Hardware Map Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsMidiModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-750 hover:border-cyan-400/50 text-neutral-200 hover:text-cyan-300 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>MIDI Hardware Map</span>
          </button>

          {/* Audio Engine Diagnostics Trigger */}
          <button
            type="button"
            onClick={() => setIsDiagModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-750 hover:border-amber-400/50 text-neutral-200 hover:text-amber-300 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Engine Diagnostics</span>
          </button>

          <span className="text-[10px] font-mono px-3 py-2 rounded-xl bg-neutral-950 text-neutral-300 border border-neutral-800">
            SESSION: {track.title}
          </span>
        </div>
      </div>

      {/* Main Hardware Strip Rack */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module 1: Parametric 3-Band EQ */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5 mb-4">
              <span className="text-xs font-bold text-neutral-100 uppercase tracking-wider">
                3-Band Parametric EQ
              </span>
              <span className="text-[10px] font-mono text-amber-400">ANALOG MODELED</span>
            </div>

            <div className="flex items-center justify-around py-4">
              <RotaryKnob
                label="LOW (120Hz)"
                value={eq.low}
                min={-12}
                max={12}
                step={0.5}
                unit=" dB"
                color="#f59e0b"
                onChange={(v) => handleEqChange('low', v)}
              />
              <RotaryKnob
                label="MID (1kHz)"
                value={eq.mid}
                min={-12}
                max={12}
                step={0.5}
                unit=" dB"
                color="#10b981"
                onChange={(v) => handleEqChange('mid', v)}
              />
              <RotaryKnob
                label="HIGH (8kHz)"
                value={eq.high}
                min={-12}
                max={12}
                step={0.5}
                unit=" dB"
                color="#06b6d4"
                onChange={(v) => handleEqChange('high', v)}
              />
            </div>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 text-[11px] text-neutral-400">
            <span className="text-amber-400 font-mono font-bold block mb-0.5">
              LAGOS SWEET SPOT:
            </span>
            Sub-bass boost at +2.8dB gives the log drum its chest-thumping club definition.
          </div>
        </div>

        {/* Module 2: Opto-Compressor */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5 mb-4">
              <span className="text-xs font-bold text-neutral-100 uppercase tracking-wider">
                VCA / Opto Dynamics Compressor
              </span>
              <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
            </div>

            <div className="flex items-center justify-around py-4">
              <RotaryKnob
                label="THRESHOLD"
                value={compression.threshold}
                min={-40}
                max={0}
                step={1}
                unit=" dB"
                color="#10b981"
                onChange={(v) => handleCompressionChange('threshold', v)}
              />
              <RotaryKnob
                label="RATIO"
                value={compression.ratio}
                min={1}
                max={12}
                step={0.5}
                unit=":1"
                color="#f59e0b"
                onChange={(v) => handleCompressionChange('ratio', v)}
              />
              <RotaryKnob
                label="ATTACK"
                value={compression.attack}
                min={5}
                max={100}
                step={5}
                unit=" ms"
                color="#8b5cf6"
                onChange={(v) => handleCompressionChange('attack', v)}
              />
            </div>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 text-[11px] text-neutral-400">
            <span className="text-emerald-400 font-mono font-bold block mb-0.5">
              TRANSIENT RECOVERY:
            </span>
            Fast 25ms attack retains the percussive attack of talking drums and shekeres.
          </div>
        </div>

        {/* Module 3: Afrofusion Reverb Space */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5 mb-4">
              <span className="text-xs font-bold text-neutral-100 uppercase tracking-wider">
                Acoustic Space & Reverb
              </span>
              <span className="text-[10px] font-mono text-purple-400">CONVOLUTION</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 mb-1">
                  ROOM MODEL / ALGORITHM
                </label>
                <select
                  value={reverb.type}
                  onChange={(e) => handleReverbChange('type', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 focus:outline-none"
                >
                  <option value="shrine">Kalakuta Shrine Hall (Fela Legacy Plate)</option>
                  <option value="lagos_hall">Lagos City Music Hall (Spacious)</option>
                  <option value="studio_plate">High-End Vocal Studio Plate</option>
                  <option value="warm_room">Warm Wooden Acoustic Room</option>
                </select>
              </div>

              <div className="flex items-center justify-around py-2">
                <RotaryKnob
                  label="AMOUNT"
                  value={reverb.amount}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  color="#8b5cf6"
                  onChange={(v) => handleReverbChange('amount', v)}
                />
                <RotaryKnob
                  label="DECAY"
                  value={reverb.decay}
                  min={0.5}
                  max={5}
                  step={0.1}
                  unit=" s"
                  color="#ec4899"
                  onChange={(v) => handleReverbChange('decay', v)}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 text-[11px] text-neutral-400">
            <span className="text-purple-400 font-mono font-bold block mb-0.5">SHRINE VIBE:</span>
            Simulates the historic high-ceiling acoustics of Lagos Kalakuta Shrine.
          </div>
        </div>
      </div>

      {/* Multi-Stem Fader Console */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <span className="text-xs font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Multi-Channel Stem Fader Strip</span>
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            {track.stems.length} STEMS CONNECTED
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-around gap-6 py-4">
          {track.stems.map((stem) => (
            <div
              key={stem.id}
              className="flex flex-col items-center bg-neutral-950 p-3 rounded-2xl border border-neutral-850"
            >
              <span className="text-[10px] font-bold text-neutral-200 mb-2 truncate max-w-[100px]">
                {stem.name}
              </span>
              <FaderSlider
                value={stem.volume}
                min={0}
                max={1}
                step={0.01}
                label="FADER"
                color={stem.color}
                onChange={(v) => {
                  const updated = track.stems.map((s) =>
                    s.id === stem.id ? { ...s, volume: v } : s
                  );
                  onUpdateTrackSettings(track.settings, updated);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Graphical Automation Lane Editor */}
      <AutomationLaneEditor
        isPlaying={isPlaying}
        bpm={track.bpm || 112}
        onApplyParam={(param, val) => {
          if (param === 'volume') {
            onUpdateTrackSettings({ volume: val });
          } else if (param === 'eq_low' || param === 'eq_mid' || param === 'eq_high') {
            const key = param === 'eq_low' ? 'low' : param === 'eq_mid' ? 'mid' : 'high';
            onUpdateTrackSettings({ eq: { ...eq, [key]: val } });
          }
        }}
      />

      {/* MIDI Controller Hardware Mapping Modal */}
      <MidiControllerMappingModal
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
        onUpdateTrackSettings={onUpdateTrackSettings}
      />

      {/* Real-time Audio Engine Diagnostic Overlay */}
      <AudioEngineDiagnosticOverlay
        isOpen={isDiagModalOpen}
        onClose={() => setIsDiagModalOpen(false)}
      />
    </div>
  );
};
