import React, { useState, useEffect } from 'react';
import { UserProfile, Workspace, StudioThemeMode } from '../../types';
import { Settings, User, Sliders, Save, Check, Moon, Sun } from 'lucide-react';
import { MidiControllerMappingModal } from '../audio/MidiControllerMappingModal';

interface SettingsViewProps {
  user: UserProfile;
  workspace: Workspace;
  themeMode?: StudioThemeMode;
  onUpdateUser: (patch: Partial<UserProfile>) => void;
  onUpdateWorkspace: (patch: Partial<Workspace>) => void;
  onUpdateTheme?: (theme: StudioThemeMode) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  workspace,
  themeMode = 'dark',
  onUpdateUser,
  onUpdateWorkspace,
  onUpdateTheme,
}) => {
  const [userName, setUserName] = useState(user.name);
  const [userRole, setUserRole] = useState<UserProfile['role']>(user.role);
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [sampleRate, setSampleRate] = useState('44100');
  const [bufferSize, setBufferSize] = useState('256');
  const [currentTheme, setCurrentTheme] = useState<StudioThemeMode>(themeMode);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modal State
  const [isMidiModalOpen, setIsMidiModalOpen] = useState(false);

  useEffect(() => {
    setCurrentTheme(themeMode);
  }, [themeMode]);

  const handleThemeChange = (newTheme: StudioThemeMode) => {
    setCurrentTheme(newTheme);
    if (onUpdateTheme) {
      onUpdateTheme(newTheme);
    }
  };

  const handleSave = () => {
    onUpdateUser({ name: userName, role: userRole });
    onUpdateWorkspace({ name: workspaceName });
    if (onUpdateTheme) {
      onUpdateTheme(currentTheme);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-neutral-100 uppercase tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <span>Studio Engine & Hardware Settings</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure circadian display themes, IndexedDB auto-save crash protection, profile
            identity, and audio driver latency.
          </p>
        </div>

        <button
          onClick={handleSave}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            savedSuccess
              ? 'bg-emerald-500 text-neutral-950 shadow-lg shadow-emerald-500/20'
              : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20'
          }`}
        >
          {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'SETTINGS SAVED' : 'SAVE CHANGES'}</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          1. DISPLAY THEME SELECTOR (Light, Dark, Studio Night)
         ------------------------------------------------------------- */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
              Studio Color Theme & Circadian Lighting
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950 text-amber-400 border border-amber-500/20">
            ACTIVE: {currentTheme.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Option 1: 3WM Dark */}
          <div
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              currentTheme === 'dark'
                ? 'bg-neutral-950 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-neutral-100">3WM Dark</span>
                </div>
                {currentTheme === 'dark' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <p className="text-[11px] text-neutral-400 mb-3">
                Cinematic deep obsidian studio environment designed for precision mixing and
                spectrum metering.
              </p>
            </div>

            <div className="h-6 rounded bg-neutral-900 border border-neutral-800 flex items-center px-2 gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            </div>
          </div>

          {/* Option 2: Midnight OLED */}
          <div
            onClick={() => handleThemeChange('midnight')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              currentTheme === 'midnight'
                ? 'bg-black border-[#ff3c00] ring-2 ring-[#ff3c00]/30 shadow-lg'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-[#ff3c00]" />
                  <span className="text-xs font-bold text-white">Midnight OLED</span>
                </div>
                {currentTheme === 'midnight' && <Check className="w-3.5 h-3.5 text-[#ff3c00]" />}
              </div>
              <p className="text-[11px] text-neutral-400 mb-3">
                Pure true-black #000000 high-contrast environment with electric fire and gold
                accents.
              </p>
            </div>

            <div className="h-6 rounded bg-black border border-neutral-900 flex items-center px-2 gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff3c00]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#f5a800]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#2affa3]" />
            </div>
          </div>

          {/* Option 3: Studio Light */}
          <div
            onClick={() => handleThemeChange('studio-light')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              currentTheme === 'studio-light'
                ? 'bg-white border-amber-500 ring-2 ring-amber-500/30 shadow-lg text-neutral-900'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sun
                    className={`w-4 h-4 ${currentTheme === 'studio-light' ? 'text-amber-600' : 'text-amber-400'}`}
                  />
                  <span
                    className={`text-xs font-bold ${currentTheme === 'studio-light' ? 'text-neutral-900' : 'text-neutral-100'}`}
                  >
                    Studio Light
                  </span>
                </div>
                {currentTheme === 'studio-light' && (
                  <Check className="w-3.5 h-3.5 text-amber-600" />
                )}
              </div>
              <p
                className={`text-[11px] ${currentTheme === 'studio-light' ? 'text-neutral-600' : 'text-neutral-400'} mb-3`}
              >
                Clean architectural daylight workspace with crisp high contrast and dark type
                legibility.
              </p>
            </div>

            <div className="h-6 rounded bg-neutral-200 border border-neutral-300 flex items-center px-2 gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. INDEXEDDB AUTO-SAVE & CRASH RESILIENCE VAULT
         ------------------------------------------------------------- */}
      {/* -------------------------------------------------------------
          3. USER & WORKSPACE IDENTITY
         ------------------------------------------------------------- */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-amber-400" />
          <span>Profile & Workspace Identity</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Your Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Primary Role
            </label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserProfile['role'])}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none"
            >
              <option value="Artist">Artist / Vocalist</option>
              <option value="Producer">Beat Producer</option>
              <option value="Engineer">Mixing & Mastering Engineer</option>
              <option value="Studio">Commercial Studio Owner</option>
              <option value="Label">Record Label Executive</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          4. WEB AUDIO DSP DRIVER LATENCY
         ------------------------------------------------------------- */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Web Audio DSP Driver Latency</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Sample Rate</label>
            <select
              value={sampleRate}
              onChange={(e) => setSampleRate(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none"
            >
              <option value="44100">44.1 kHz (CD / Streaming Standard)</option>
              <option value="48000">48.0 kHz (Cinema / Broadcast)</option>
              <option value="96000">96.0 kHz (Audiophile High-Res)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Buffer Size (Latency)
            </label>
            <select
              value={bufferSize}
              onChange={(e) => setBufferSize(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none"
            >
              <option value="128">128 samples (~2.9 ms Ultra-Low)</option>
              <option value="256">256 samples (~5.8 ms Balanced Recording)</option>
              <option value="512">512 samples (~11.6 ms High DSP Capacity)</option>
            </select>
          </div>
        </div>

        {/* -------------------------------------------------------------
          5. GLOBAL MIDI CONTROLLER MAPPING
         ------------------------------------------------------------- */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            Global MIDI Controller Mappings
          </h3>
          <p className="text-xs text-neutral-400">
            Map your physical MIDI keyboard or controller knobs to global transport controls (Play,
            Stop, Record) or master effect parameters.
          </p>
          <button
            onClick={() => setIsMidiModalOpen(true)}
            className="px-4 py-2 bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800 text-neutral-200 text-xs font-bold rounded-xl transition flex items-center gap-2"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            Configure MIDI Mappings
          </button>
        </div>
      </div>

      {/* MIDI Mapping Modal */}
      <MidiControllerMappingModal
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
      />
    </div>
  );
};
