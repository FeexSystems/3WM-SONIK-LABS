import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check, Loader2, Sparkles, User, Music, Headphones } from 'lucide-react';
import { landingAudioEngine } from '../../audio/landingAudioEngine';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface WaitlistFormProps {
  className?: string;
  source?: string;
  isDetailed?: boolean;
}

interface WaitlistEntry {
  name?: string;
  email: string;
  genre: string;
  role: string;
  experience?: string;
  source: string;
  joinedAt: string;
}

export function WaitlistForm({
  className = '',
  source = 'landing',
  isDetailed = false,
}: WaitlistFormProps) {
  const { openAuthModal } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [genre, setGenre] = useState('Amapiano');
  const [role, setRole] = useState('Producer');
  const [experience, setExperience] = useState('Pro / 3+ Years');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const genres = ['Amapiano', 'Afrobeats', 'Afro-Trap', 'R&B / Soul', 'Hip-Hop'];
  const roles = ['Producer', 'Artist', 'Sound Engineer', 'Vocalist'];
  const experiences = ['1-3 Years', 'Pro / 3+ Years', 'Master / Studio Owner'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email?.includes('@')) {
      setError('Please enter a valid producer or artist email.');
      return;
    }

    setIsSubmitting(true);

    // Audio feedback on waitlist join
    landingAudioEngine.playMelodicChord(0);
    landingAudioEngine.playLogDrum(0, 55);
    setTimeout(() => landingAudioEngine.playVocalChant(0), 300);

    try {
      // 1. Try persisting directly to Supabase
      try {
        const userId = `beta_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await supabase.from('users').upsert({
          id: userId,
          email: email.trim(),
          display_name: name.trim() || email.split('@')[0],
          plan: 'BETA_VIP',
          settings: {
            genre,
            role,
            experience,
            source,
            waitlistJoinedAt: new Date().toISOString(),
          },
        });
      } catch (sbErr) {
        console.warn('Supabase waitlist sync fallback:', sbErr);
      }

      // 2. Try POST /api/waitlist
      try {
        await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            genre,
            role,
            experience,
            source,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch {
        // Fallback silently
      }

      // 3. Persist in local storage
      try {
        const stored = localStorage.getItem('3wm_sonik_waitlist');
        const existing: WaitlistEntry[] = stored ? (JSON.parse(stored) as WaitlistEntry[]) : [];
        existing.push({
          name: name.trim(),
          email: email.trim(),
          genre,
          role,
          experience,
          source,
          joinedAt: new Date().toISOString(),
        });
        localStorage.setItem('3wm_sonik_waitlist', JSON.stringify(existing));
      } catch {
        // Local storage available
      }

      setIsSubmitted(true);
      setEmail('');
      setName('');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex flex-col sm:flex-row items-center gap-4 px-6 py-5 bg-[#2affa3]/10 border border-[#2affa3]/40 rounded-2xl backdrop-blur-xl shadow-[0_0_40px_rgba(42,255,163,0.2)] text-left ${className}`}
      >
        <div className="w-12 h-12 rounded-full bg-[#2affa3] flex items-center justify-center text-black font-bold shrink-0 shadow-[0_0_20px_rgba(42,255,163,0.5)]">
          <Check className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div className="flex-1">
          <p className="font-mono text-sm uppercase tracking-widest text-[#2affa3] font-bold">
            🔱 VIP Beta Access Request Received
          </p>
          <p className="text-xs text-[var(--foreground-bright)] mt-1 font-light leading-relaxed">
            Your studio profile has been registered for <b>{genre}</b> ({role}). You will receive an
            exclusive early access key as new slots open.
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => openAuthModal('signin')}
              className="text-xs font-mono text-[#f5a800] hover:underline flex items-center gap-1.5"
            >
              <span>Already registered? Sign In to Studio →</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 text-left ${className}`}>
      {isDetailed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Producer / Artist Name"
              className="w-full pl-11 pr-4 py-3.5 bg-black/60 border border-white/10 rounded-xl text-xs text-[var(--foreground-bright)] placeholder:text-neutral-500 focus:outline-none focus:border-[#f5a800]/60 focus:bg-white/5 transition-all font-mono"
            />
          </div>

          <div className="relative">
            <Headphones className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-black/60 border border-white/10 rounded-xl text-xs text-[var(--foreground-bright)] focus:outline-none focus:border-[#f5a800]/60 focus:bg-neutral-900 transition-all font-mono"
            >
              {roles.map((r) => (
                <option key={r} value={r} className="bg-neutral-900 text-white">
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Genre Pills */}
      <div>
        <span className="block font-mono text-[10px] uppercase text-[var(--muted)] tracking-wider mb-2">
          Primary Sound Style:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenre(g)}
              className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all ${
                genre === g
                  ? 'bg-[#f5a800] text-black font-bold shadow-[0_0_15px_rgba(245,168,0,0.35)]'
                  : 'bg-white/5 text-[var(--muted)] hover:text-[var(--foreground-bright)] border border-white/10 hover:border-white/25'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email for early access..."
            className="w-full pl-11 pr-4 py-3.5 bg-black/60 border border-white/10 rounded-xl text-xs text-[var(--foreground-bright)] placeholder:text-neutral-500 focus:outline-none focus:border-[#f5a800]/60 focus:bg-white/5 transition-all font-mono"
            disabled={isSubmitting}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3.5 bg-gradient-to-r from-[#f5a800] to-[#ff3c00] text-black font-bold font-mono text-xs uppercase tracking-widest rounded-xl hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,168,0,0.35)] hover:shadow-[0_0_35px_rgba(255,60,0,0.5)] shrink-0"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
              Securing Key...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-black" />
              Request Beta Access
            </>
          )}
        </button>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-[#ff3c00] font-mono"
        >
          {error}
        </motion.p>
      )}
    </form>
  );
}
