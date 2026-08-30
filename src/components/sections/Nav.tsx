import { Menu, X, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

interface NavProps {
  onEnterStudio: () => void;
  onOpenVoiceModal?: () => void;
}

export function Nav({ onEnterStudio, onOpenVoiceModal }: NavProps) {
  const { user, profile, openAuthModal } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const links = [
    ['Council', '#council'],
    ['Capabilities', '#capabilities'],
    ['Workflow', '#workflow'],
    ['Testimonials', '#testimonials'],
    ['Pricing', '#pricing'],
    ['FAQ', '#faq'],
    ['Demo', '#demo'],
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xl px-5 md:px-14 shadow-lg'
          : 'border-transparent bg-transparent px-5 md:px-14'
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-[1328px] items-center justify-between">
        <a
          href="#"
          className="font-display flex items-center gap-2 text-[26px] tracking-widest text-[#f5a800]"
        >
          <span className="text-[22px] drop-shadow-[0_0_8px_#f5a800]">🔱</span> 3WM SONIK
        </a>

        <div className="hidden items-center gap-10 md:flex">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-xs uppercase tracking-widest text-[var(--muted)] transition hover:text-[#f5a800] relative group"
            >
              {label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#f5a800] transition-all group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {onOpenVoiceModal && (
            <button
              onClick={onOpenVoiceModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#F5A800]/40 bg-[#F5A800]/10 text-[#F5A800] hover:bg-[#F5A800]/20 transition text-xs font-mono font-bold uppercase tracking-wider"
              title="Talk to The Three Wise Men"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5A800] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F5A800]"></span>
              </span>
              <span>Voice Agents</span>
            </button>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEnterStudio()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition text-xs font-mono text-neutral-300"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-[10px]">
                  {profile?.name?.[0] ?? 'U'}
                </div>
                <span>{profile?.name ?? user.email?.split('@')[0]}</span>
              </button>
              <Button variant="gold" size="sm" onClick={onEnterStudio}>
                Enter Studio
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => openAuthModal('signin')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-amber-400 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <Button variant="gold" size="sm" onClick={() => openAuthModal('signup')}>
                Get Started
              </Button>
            </div>
          )}
        </div>

        <button
          className="md:hidden text-[#f5a800] p-2 rounded-lg hover:bg-white/5 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[#f5a800]/10 bg-[#0d0d0d]/95 backdrop-blur-xl md:hidden overflow-hidden"
          >
            <div className="px-5 py-6 space-y-4">
              {links.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.querySelector(href);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-sm font-medium text-neutral-300 hover:text-[var(--foreground-bright)] transition-colors"
                  aria-label={`Navigate to ${label} section`}
                >
                  {label}
                </a>
              ))}
              {/* Mobile Auth and Voice Controls */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[var(--muted)]">Theme Mode</span>
                  <ThemeToggle />
                </div>

                {onOpenVoiceModal && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      onOpenVoiceModal();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#F5A800]/40 bg-[#F5A800]/10 text-[#F5A800] font-mono text-xs font-bold uppercase tracking-wider"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#F5A800] animate-pulse" />
                    <span>Talk to Voice Agents</span>
                  </button>
                )}

                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-xs">
                        {profile?.name?.[0] ?? 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[var(--foreground-bright)] truncate">
                          {profile?.name ?? 'Kappachino Artist'}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--muted)] truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        onEnterStudio();
                      }}
                      className="w-full"
                    >
                      Enter 3WM Studio
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => {
                        setOpen(false);
                        openAuthModal('signin');
                      }}
                      className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono font-bold uppercase tracking-wider text-[var(--foreground-bright)] flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </button>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        openAuthModal('signup');
                      }}
                      className="w-full"
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
