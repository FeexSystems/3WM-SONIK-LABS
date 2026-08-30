import React, { useState } from 'react';
import { UserProfile, Workspace } from '../../types';
import {
  Sparkles,
  ArrowRight,
  Check,
  Music,
  UserCheck,
  Sliders,
  Cpu,
  Building2,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: Partial<UserProfile>, workspaceName: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'Artist' | 'Producer' | 'Engineer' | 'Studio' | 'Label'>(
    'Artist'
  );
  const [genres, setGenres] = useState<string[]>(['Afrofusion', 'Amapiano']);
  const [workflows, setWorkflows] = useState<string[]>(['Recording', 'Mixing', 'Mastering']);
  const [aiRelationship, setAiRelationship] = useState('Engineer');
  const [workspaceName, setWorkspaceName] = useState('Three Wise Men Main Studio');

  if (!isOpen) return null;

  const genreOptions = [
    'Afrofusion',
    'Afrobeats',
    'Amapiano',
    'Highlife',
    'Hip-Hop',
    'R&B',
    'Gospel',
    'Electronic',
  ];

  const workflowOptions = [
    'Recording',
    'Mixing',
    'Mastering',
    'Songwriting',
    'Beat Production',
    'All Steps',
  ];

  const aiOptions = [
    { title: 'Engineer', desc: 'Precision EQ, compression & technical mastering' },
    { title: 'Producer', desc: 'Creative arrangement, beat syncopation & groove' },
    { title: 'Critic', desc: 'Objective spectral critiques & dynamic feedback' },
    { title: 'Creative Partner', desc: 'Holistic sonic evolution & lyric matching' },
  ];

  const handleToggleGenre = (g: string) => {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const handleToggleWorkflow = (w: string) => {
    setWorkflows((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]));
  };

  const handleFinish = () => {
    onComplete(
      {
        role,
        favoriteGenres: genres,
        workflowFocus: workflows,
        aiRelationship,
        onboardingCompleted: true,
      },
      workspaceName
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
              0{step}
            </div>
            <div>
              <h3 className="font-bold text-neutral-100 text-sm">3WM Sonic Setup</h3>
              <p className="text-[10px] font-mono text-neutral-400">Step {step} of 5</p>
            </div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-4 h-1 rounded-full ${i <= step ? 'bg-amber-500' : 'bg-neutral-800'}`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Who are you? */}
        {step === 1 && (
          <div className="space-y-4">
            <h4 className="text-base font-bold text-neutral-100">Who are you in the studio?</h4>
            <p className="text-xs text-neutral-400">
              We personalize your mixing console, AI models, and mastering presets to your primary
              workflow.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(['Artist', 'Producer', 'Engineer', 'Studio', 'Label'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-3 rounded-xl border text-left transition ${
                    role === r
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-xs">{r}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Genres */}
        {step === 2 && (
          <div className="space-y-4">
            <h4 className="text-base font-bold text-neutral-100">What genres do you create?</h4>
            <p className="text-xs text-neutral-400">
              Select your primary sonic palette for vector memory and acoustic fingerprinting.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {genreOptions.map((g) => {
                const selected = genres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleToggleGenre(g)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs ${
                      selected
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <span>{g}</span>
                    {selected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Workflow */}
        {step === 3 && (
          <div className="space-y-4">
            <h4 className="text-base font-bold text-neutral-100">Your core studio workflow:</h4>
            <p className="text-xs text-neutral-400">
              We optimize the DAW workspace and audio rack around your favorite tasks.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {workflowOptions.map((w) => {
                const selected = workflows.includes(w);
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleToggleWorkflow(w)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs ${
                      selected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <span>{w}</span>
                    {selected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: AI Relationship */}
        {step === 4 && (
          <div className="space-y-4">
            <h4 className="text-base font-bold text-neutral-100">Choose your AI relationship:</h4>
            <p className="text-xs text-neutral-400">
              BushBot, Grok, and Perplexity will calibrate their tone and recommendation depth.
            </p>
            <div className="space-y-2">
              {aiOptions.map((opt) => (
                <button
                  key={opt.title}
                  type="button"
                  onClick={() => setAiRelationship(opt.title)}
                  className={`w-full p-3 rounded-xl border text-left transition ${
                    aiRelationship === opt.title
                      ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-bold text-xs">{opt.title}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Workspace */}
        {step === 5 && (
          <div className="space-y-4">
            <h4 className="text-base font-bold text-neutral-100">Create your Studio Workspace</h4>
            <p className="text-xs text-neutral-400">
              Your multi-tenant workspace houses all projects, stem libraries, and mastering
              archives.
            </p>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-neutral-100 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Next / Back Controls */}
        <div className="flex items-center justify-between border-t border-neutral-800 pt-4 mt-6">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => s - 1)}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-300 text-xs font-semibold rounded-xl transition"
          >
            Back
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <span>ENTER WORKSPACE</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
