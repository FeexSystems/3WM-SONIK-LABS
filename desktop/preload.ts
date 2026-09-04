// 3WM SONIK — Electron Preload Script
// Securely bridges Node.js / C++ native capabilities to the React Renderer process via contextBridge.

import { contextBridge, ipcRenderer } from 'electron';

const sonikDesktopAPI = {
  isDesktop: true,
  platform: process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'windows' : 'linux',

  // System & Hardware Metrics
  getCapabilities: () => ipcRenderer.invoke('sonik:getCapabilities'),
  getSystemMetrics: () => ipcRenderer.invoke('sonik:getSystemMetrics'),

  // Audio Driver & Configuration
  getAudioDevices: () => ipcRenderer.invoke('sonik:getAudioDevices'),
  setAudioConfig: (config: unknown) => ipcRenderer.invoke('sonik:setAudioConfig', config),
  getAudioConfig: () => ipcRenderer.invoke('sonik:getAudioConfig'),

  // Engine Lifecycle Controls
  startAudioContext: () => ipcRenderer.invoke('sonik:startAudioContext'),
  suspendAudioContext: () => ipcRenderer.invoke('sonik:suspendAudioContext'),
  resumeAudioContext: () => ipcRenderer.invoke('sonik:resumeAudioContext'),
  getAudioState: () => ipcRenderer.invoke('sonik:getAudioState'),

  // Master Volume & Realtime Peak Metering
  getMasterVolume: () => ipcRenderer.invoke('sonik:getMasterVolume'),
  setMasterVolume: (vol: number) => ipcRenderer.send('sonik:setMasterVolume', vol),
  getPeakLevels: () => ipcRenderer.invoke('sonik:getPeakLevels'),

  // File System & Local Disk Access
  showOpenFileDialog: (options: unknown) => ipcRenderer.invoke('sonik:showOpenFileDialog', options),
  showSaveFileDialog: (options: unknown) => ipcRenderer.invoke('sonik:showSaveFileDialog', options),
  readFileAsArrayBuffer: (filePath: string) => ipcRenderer.invoke('sonik:readFileAsArrayBuffer', filePath),
  writeFileFromArrayBuffer: (filePath: string, buffer: ArrayBuffer) =>
    ipcRenderer.invoke('sonik:writeFileFromArrayBuffer', filePath, buffer),
  exists: (filePath: string) => ipcRenderer.invoke('sonik:exists', filePath),
  getTempDirectory: () => ipcRenderer.invoke('sonik:getTempDirectory'),

  // MIDI Native Devices
  getMidiPorts: () => ipcRenderer.invoke('sonik:getMidiPorts'),
  onMidiMessage: (callback: (event: { portId: string; data: Uint8Array; timestamp: number }) => void) => {
    const handler = (_evt: unknown, data: { portId: string; data: Uint8Array; timestamp: number }) => callback(data);
    ipcRenderer.on('sonik:midiMessage', handler);
    return () => {
      ipcRenderer.removeListener('sonik:midiMessage', handler);
    };
  },
  sendMidiMessage: (portId: string, data: Uint8Array, timestamp?: number) => {
    ipcRenderer.send('sonik:sendMidiMessage', { portId, data, timestamp });
  },

  // Window Framing & Title Bar
  minimizeWindow: () => ipcRenderer.send('sonik:window:minimize'),
  maximizeWindow: () => ipcRenderer.send('sonik:window:maximize'),
  closeWindow: () => ipcRenderer.send('sonik:window:close'),
};

contextBridge.exposeInMainWorld('sonikDesktopAPI', sonikDesktopAPI);
