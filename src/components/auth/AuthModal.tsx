import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Disc3,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithGithub,
    signInAsGuest,
    sendPasswordReset,
    error,
    clearError,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Artist' | 'Producer' | 'Engineer' | 'Vocalist'>('Producer');
  const [submitting, setSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResetSuccess(false);

    try {
      if (authModalMode === 'signin') {
        await signInWithEmail(email, password);
      } else if (authModalMode === 'signup') {
        await signUpWithEmail(email, password, name, role);
      } else if (authModalMode === 'reset') {
        await sendPasswordReset(email);
        setResetSuccess(true);
      }
    } catch {
      // Error handled inside AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setSubmitting(true);
    try {
      if (provider === 'google') await signInWithGoogle();
      else if (provider === 'github') await signInWithGithub();
    } catch {
      // Error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#12100c] border border-[#f5a800]/30 rounded-2xl shadow-[0_0_60px_rgba(245,168,0,0.15)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header */}
        <div className="relative p-6 border-b border-[#f5a800]/15 bg-gradient-to-b from-[#f5a800]/10 to-transparent">
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <span className="text-3xl drop-shadow-[0_0_12px_#f5a800]">🔱</span>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-white">
                {authModalMode === 'signin' && 'STUDIO ACCESS'}
                {authModalMode === 'signup' && 'JOIN THE COUNCIL'}
                {authModalMode === 'reset' && 'RESTORE KEY'}
              </h2>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#f5a800]/80">
                3WM SONIK · Music Intelligence Platform
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        {authModalMode !== 'reset' && (
          <div className="grid grid-cols-2 p-1.5 mx-6 mt-5 bg-neutral-900/90 border border-neutral-800 rounded-xl">
            <button
              onClick={() => {
                clearError();
                openAuthModal('signin');
              }}
              className={`py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
                authModalMode === 'signin'
                  ? 'bg-[#f5a800] text-black font-bold shadow-md shadow-[#f5a800]/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                clearError();
                openAuthModal('signup');
              }}
              className={`py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all ${
                authModalMode === 'signup'
                  ? 'bg-[#f5a800] text-black font-bold shadow-md shadow-[#f5a800]/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>Password reset instructions sent to {email}. Check your inbox!</span>
            </div>
          )}

          {/* Instant Guest / Demo Mode Button - Prominent VIP & Judge Access */}
          {authModalMode !== 'reset' && (
            <button
              type="button"
              onClick={() => signInAsGuest()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#2affa3]/20 via-[#f5a800]/20 to-[#2affa3]/20 hover:from-[#2affa3]/30 hover:to-[#f5a800]/30 border border-[#2affa3]/50 text-[#2affa3] font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(42,255,163,0.15)] transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-[#2affa3] animate-pulse" />
              <span className="font-bold">⚡ Instant Demo Studio Access (Judge Mode)</span>
            </button>
          )}

          {/* OAuth Quick Connect */}
          {authModalMode !== 'reset' && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium transition active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth('github')}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium transition active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-800" />
                </div>
                <span className="relative px-3 bg-[#12100c] text-[10px] font-mono uppercase text-neutral-500 tracking-widest">
                  Or Email
                </span>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {authModalMode === 'signup' && (
              <>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    Artist / Producer Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sarz, Telz, P.Priime"
                      className="w-full pl-9 pr-3 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-600 text-xs focus:outline-none focus:border-[#f5a800] focus:ring-1 focus:ring-[#f5a800] transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    Studio Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-xl text-neutral-100 text-xs focus:outline-none focus:border-[#f5a800] transition"
                  >
                    <option value="Producer">Beatmaker & Producer</option>
                    <option value="Artist">Vocalist & Songwriter</option>
                    <option value="Engineer">Mix & Master Engineer</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="producer@3wm.audio"
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-600 text-xs focus:outline-none focus:border-[#f5a800] focus:ring-1 focus:ring-[#f5a800] transition"
                />
              </div>
            </div>

            {authModalMode !== 'reset' && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    Password
                  </label>
                  {authModalMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => openAuthModal('reset')}
                      className="text-[10px] font-mono text-[#f5a800] hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-600 text-xs focus:outline-none focus:border-[#f5a800] focus:ring-1 focus:ring-[#f5a800] transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#f5a800] to-[#ff3c00] text-black font-bold font-mono text-xs uppercase tracking-widest shadow-lg shadow-[#f5a800]/20 hover:brightness-110 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {authModalMode === 'signin' && 'Enter Studio'}
                    {authModalMode === 'signup' && 'Initialize Account'}
                    {authModalMode === 'reset' && 'Send Reset Link'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Instant Guest / Demo Mode Button */}
          {authModalMode !== 'reset' && (
            <button
              type="button"
              onClick={() => signInAsGuest()}
              className="w-full py-2.5 px-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-[#2affa3]/30 text-[#2affa3] font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2affa3]" />
              <span>⚡ Instant Demo Studio Access (Judge Mode)</span>
            </button>
          )}

          {/* Reset password back to signin */}
          {authModalMode === 'reset' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                className="text-xs font-mono text-[#f5a800] hover:underline"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="p-3 bg-black/50 border-t border-neutral-900 flex items-center justify-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2affa3]" />
          <span>Protected by Firebase Auth 256-bit Token Encryption</span>
        </div>
      </div>
    </div>
  );
};
