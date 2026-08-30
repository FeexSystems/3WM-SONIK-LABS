import React, { useState } from 'react';
import { PLUGIN_REGISTRY } from '../../audio/pluginEngine';
import { Eight08LabPlugin } from './Eight08LabPlugin';
import { TrapDrumMachinePlugin } from './TrapDrumMachinePlugin';
import { SonikEqPlugin } from './SonikEqPlugin';
import { SonikCompPlugin } from './SonikCompPlugin';
import { SubCheckPlugin } from './SubCheckPlugin';
import {
  X,
  Zap,
  Layers,
  Sliders,
  Activity,
  Plus,
  Power,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface PluginRackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPluginId?: string;
}

export const PluginRackModal: React.FC<PluginRackModalProps> = ({
  isOpen,
  onClose,
  initialPluginId = '808-lab',
}) => {
  const [selectedPluginId, setSelectedPluginId] = useState<string>(initialPluginId);
  const [bypassedPlugins, setBypassedPlugins] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleBypass = (id: string) => {
    setBypassedPlugins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const pluginList = [
    {
      id: '808-lab',
      name: 'SONIK 808 LAB',
      type: 'INSTRUMENT',
      icon: Zap,
      color: 'text-amber-400',
      tag: 'TRAP / DRILL 808',
    },
    {
      id: 'trap-drum-machine',
      name: 'TRAP DRUM MACHINE',
      type: 'INSTRUMENT',
      icon: Layers,
      color: 'text-rose-400',
      tag: '13-CH RATCHET ENGINE',
    },
    {
      id: 'sonik-eq',
      name: '5-BAND STUDIO EQ',
      type: 'EFFECT',
      icon: Sliders,
      color: 'text-emerald-400',
      tag: 'PARAMETRIC DSP',
    },
    {
      id: 'sonik-comp',
      name: 'DYNAMICS COMP',
      type: 'EFFECT',
      icon: Activity,
      color: 'text-indigo-400',
      tag: 'VCA / FET / GLUE',
    },
    {
      id: 'sub-check',
      name: 'SUB CHECK (20-200Hz)',
      type: 'ANALYZER',
      icon: Activity,
      color: 'text-cyan-400',
      tag: 'PHASE & CLASH AUDIT',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black font-mono text-white tracking-wider uppercase">
                3WM SONIK PLUGIN RACK & DSP ENGINE
              </h2>
              <p className="text-[11px] text-neutral-400">
                Native modern urban instruments & studio processing modules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Sidebar Selector + Right Active Plugin View */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="md:col-span-4 lg:col-span-3 border-r border-neutral-800 bg-neutral-950 p-3 space-y-1.5 overflow-y-auto">
            <div className="text-[10px] font-mono font-bold text-neutral-500 px-2 py-1 uppercase tracking-wider">
              PLUGINS & INSTRUMENTS
            </div>

            {pluginList.map((pl) => {
              const Icon = pl.icon;
              const isSelected = selectedPluginId === pl.id;
              const isBypassed = !!bypassedPlugins[pl.id];

              return (
                <button
                  key={pl.id}
                  onClick={() => setSelectedPluginId(pl.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-neutral-900 border-neutral-700 text-white shadow-lg ring-1 ring-amber-500/30'
                      : 'bg-transparent border-transparent hover:bg-neutral-900/50 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center ${pl.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold font-mono truncate">{pl.name}</div>
                      <div className="text-[9px] font-mono text-neutral-500 truncate">{pl.tag}</div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-neutral-600'}`}
                  />
                </button>
              );
            })}
          </div>

          {/* Plugin Active Stage */}
          <div className="md:col-span-8 lg:col-span-9 p-5 overflow-y-auto bg-neutral-900/50">
            {selectedPluginId === '808-lab' && (
              <Eight08LabPlugin
                bypassed={bypassedPlugins['808-lab']}
                onToggleBypass={() => toggleBypass('808-lab')}
              />
            )}
            {selectedPluginId === 'trap-drum-machine' && (
              <TrapDrumMachinePlugin
                bypassed={bypassedPlugins['trap-drum-machine']}
                onToggleBypass={() => toggleBypass('trap-drum-machine')}
              />
            )}
            {selectedPluginId === 'sonik-eq' && (
              <SonikEqPlugin
                bypassed={bypassedPlugins['sonik-eq']}
                onToggleBypass={() => toggleBypass('sonik-eq')}
              />
            )}
            {selectedPluginId === 'sonik-comp' && (
              <SonikCompPlugin
                bypassed={bypassedPlugins['sonik-comp']}
                onToggleBypass={() => toggleBypass('sonik-comp')}
              />
            )}
            {selectedPluginId === 'sub-check' && (
              <SubCheckPlugin
                bypassed={bypassedPlugins['sub-check']}
                onToggleBypass={() => toggleBypass('sub-check')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
