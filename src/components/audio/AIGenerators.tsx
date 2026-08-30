import React, { useState } from 'react';
import { Music, Wand2, Mic2, Sparkles, Loader2, Upload } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { useToast } from '../ui/toaster';

interface Props {
  projectId: string;
}

export const AIGenerators: React.FC<Props> = ({ projectId }) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'music' | 'sfx' | 'isolate' | 'transform'>('music');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!prompt && (mode === 'music' || mode === 'sfx')) return;
    if (!file && (mode === 'isolate' || mode === 'transform')) return;

    setIsSubmitting(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      let res;

      if (mode === 'music' || mode === 'sfx') {
        res = await fetch(`/api/projects/${projectId}/elevenlabs/${mode}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prompt, duration_seconds: mode === 'music' ? 60 : 10 }),
        });
      } else {
        const formData = new FormData();
        formData.append('audio', file as File);
        if (mode === 'transform') {
          // Hardcoded voice ID for testing demo purposes
          formData.append('voice_id', 'pNInz6obbfIdGwi4w8sN');
        }
        res = await fetch(`/api/projects/${projectId}/elevenlabs/${mode}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      }

      if (!res.ok) {
        const data = await res.json();
        toast({
          type: 'error',
          title: 'Generation failed',
          description: data.error || 'Failed to submit generation job',
        });
      } else {
        toast({
          type: 'success',
          title: 'Job queued',
          description: 'Your AI generation has been queued.',
        });
      }
      setPrompt('');
      setFile(null);
    } catch (e) {
      console.error(e);
      toast({
        type: 'error',
        title: 'Network error',
        description: 'Please check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden mt-4">
      <div className="p-3 border-b border-neutral-800 bg-neutral-950 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setMode('music')}
          className={`px-2 py-1 text-xs font-bold rounded ${mode === 'music' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:bg-neutral-800'}`}
        >
          Music
        </button>
        <button
          onClick={() => setMode('sfx')}
          className={`px-2 py-1 text-xs font-bold rounded ${mode === 'sfx' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:bg-neutral-800'}`}
        >
          SFX
        </button>
        <button
          onClick={() => setMode('isolate')}
          className={`px-2 py-1 text-xs font-bold rounded ${mode === 'isolate' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:bg-neutral-800'}`}
        >
          Isolate
        </button>
        <button
          onClick={() => setMode('transform')}
          className={`px-2 py-1 text-xs font-bold rounded ${mode === 'transform' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:bg-neutral-800'}`}
        >
          Transform
        </button>
      </div>

      <div className="p-3 space-y-3">
        {mode === 'music' || mode === 'sfx' ? (
          <div>
            <label className="text-xs text-neutral-400 font-bold mb-1 block uppercase">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-20 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              placeholder={`Describe the ${mode === 'music' ? 'musical composition' : 'sound effect'}...`}
            />
          </div>
        ) : (
          <div>
            <label className="text-xs text-neutral-400 font-bold mb-1 block uppercase">
              Upload Audio Take
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-neutral-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-bold file:bg-neutral-800 file:text-neutral-100"
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (mode in ['music', 'sfx'] ? !prompt : !file)}
          className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          Generate {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      </div>
    </div>
  );
};
