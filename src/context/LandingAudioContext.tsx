import React, { createContext, useContext, useEffect, useState } from 'react';
import { landingAudioEngine, StemState, AgentFxState } from '../audio/landingAudioEngine';

interface LandingAudioContextType {
  isPlaying: boolean;
  bpm: number;
  key: string;
  currentGenre: string;
  currentStep: number;
  stems: StemState[];
  fx: AgentFxState;
  stepPattern: Record<string, boolean[]>;
  togglePlay: () => void;
  setGenrePill: (genre: string, bpm: number, key: string) => void;
  toggleStemMute: (id: string) => void;
  toggleStemSolo: (id: string) => void;
  setStemVolume: (id: string, vol: number) => void;
  toggleFx: (key: keyof AgentFxState) => void;
  toggleStep: (track: string, stepIndex: number) => void;
  generateRickyBounce: () => void;
  getFrequencyData: () => Uint8Array;
  exportSessionState: () => any;
}

const LandingAudioContext = createContext<LandingAudioContextType | null>(null);

export const LandingAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState(landingAudioEngine.getState());

  useEffect(() => {
    const unsub = landingAudioEngine.subscribe(() => {
      setState(landingAudioEngine.getState());
    });
    return () => {
      unsub();
    };
  }, []);

  const value: LandingAudioContextType = {
    isPlaying: state.isPlaying,
    bpm: state.bpm,
    key: state.key,
    currentGenre: state.currentGenre,
    currentStep: state.currentStep,
    stems: state.stems,
    fx: state.fx,
    stepPattern: state.stepPattern,
    togglePlay: () => landingAudioEngine.togglePlay(),
    setGenrePill: (genre, bpm, key) => landingAudioEngine.setGenrePill(genre, bpm, key),
    toggleStemMute: (id) => landingAudioEngine.toggleStemMute(id),
    toggleStemSolo: (id) => landingAudioEngine.toggleStemSolo(id),
    setStemVolume: (id, vol) => landingAudioEngine.setStemVolume(id, vol),
    toggleFx: (key) => landingAudioEngine.toggleFx(key),
    toggleStep: (track, stepIndex) => landingAudioEngine.toggleStep(track, stepIndex),
    generateRickyBounce: () => landingAudioEngine.generateRickyBounce(),
    getFrequencyData: () => landingAudioEngine.getFrequencyData(),
    exportSessionState: () => landingAudioEngine.exportSessionState(),
  };

  return <LandingAudioContext.Provider value={value}>{children}</LandingAudioContext.Provider>;
};

export const useLandingAudio = () => {
  const ctx = useContext(LandingAudioContext);
  if (!ctx) {
    throw new Error('useLandingAudio must be used within a LandingAudioProvider');
  }
  return ctx;
};
