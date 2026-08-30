import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  BrainCircuit,
  Mic,
  Layers,
  Activity,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
} from 'lucide-react';

interface AppGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    title: 'Welcome to 3WM SONIK',
    description:
      "The AI-Native Musical Operating Environment. Designed for Afrofusion, Amapiano, Hip-Hop, and R&B producers. Let's take a quick tour of your new studio.",
    icon: Sparkles,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    image: (
      <div className="w-full h-40 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center text-6xl drop-shadow-[0_0_16px_rgba(245,168,0,0.4)]">
        🔱
      </div>
    ),
  },
  {
    title: 'The Three Wise Men',
    description:
      'Your AI Council. Emar (The Scientist/DSP), Ricky (The Sound God), and Kingpin (The Vocal Oracle) collaborate directly with you. Use the Agent Panel (top left or right) to interact, generate samples, and mix.',
    icon: BrainCircuit,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    image: (
      <div className="w-full h-40 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col items-center justify-center gap-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 bg-neutral-950 flex items-center justify-center text-xs font-bold text-emerald-400">
            EM
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-amber-500 bg-neutral-950 flex items-center justify-center text-xs font-bold text-amber-400">
            RK
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-orange-500 bg-neutral-950 flex items-center justify-center text-xs font-bold text-orange-400">
            KP
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'The Beat Lab & MIDI',
    description:
      'Compose using the advanced step sequencer and piano roll. Generate patterns dynamically, dial in the Lagos Bounce, and drag-and-drop right onto your arrangement timeline.',
    icon: Layers,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    image: (
      <div className="w-full h-40 bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-1 h-6">
            <div className="w-16 bg-neutral-800 rounded-l text-[9px] flex items-center px-1 text-neutral-400">
              Track {i}
            </div>
            <div className="flex-1 flex gap-1">
              {[...Array(8)].map((_, j) => (
                <div
                  key={j}
                  className={`flex-1 rounded ${Math.random() > 0.5 ? 'bg-amber-500/50' : 'bg-neutral-800'}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Spectral Intelligence',
    description:
      'Go beyond static EQs. Emar actively listens to your master bus with real-time FFT analysis to automatically scoop mud, balance LUFS, and deliver streaming-ready masters.',
    icon: Activity,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    image: (
      <div className="w-full h-40 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex items-end p-2 gap-1">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-emerald-500/20 to-emerald-400 rounded-t"
            style={{ height: `${Math.random() * 80 + 10}%` }}
          />
        ))}
      </div>
    ),
  },
  {
    title: 'Sample Vault & AI Source Separation',
    description:
      'Generate 808s and loops from pure text prompts. Drop existing audio files to separate stems using Demucs/Spleeter architecture—all from the Sample Vault view.',
    icon: Mic,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    image: (
      <div className="w-full h-40 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center flex-col gap-3">
        <div className="bg-neutral-950 border border-neutral-800 p-2 w-3/4 rounded flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded-sm" />
          <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-orange-500/50" />
          </div>
        </div>
      </div>
    ),
  },
];

export const AppGuide: React.FC<AppGuideProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[step];
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) setStep((s) => s + 1);
    else onClose();
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-none overflow-hidden shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-500 hover:text-white z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8">
            <div
              className={`w-12 h-12 rounded-xl ${currentStep.bgColor} ${currentStep.color} flex items-center justify-center mb-6`}
            >
              <Icon className="w-6 h-6" />
            </div>

            <h2 className="text-3xl font-display text-white mb-3 tracking-wide">
              {currentStep.title}
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed mb-8 h-16">
              {currentStep.description}
            </p>

            {currentStep.image}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-850">
              <div className="flex gap-2">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-amber-500' : 'w-2 bg-neutral-800'}`}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePrev}
                  disabled={step === 0}
                  className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-lg flex items-center gap-2 transition-colors"
                >
                  {step === TOUR_STEPS.length - 1 ? 'Start Producing' : 'Next'}
                  {step < TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
