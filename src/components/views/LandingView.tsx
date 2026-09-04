import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Nav } from '../sections/Nav';
import { Hero } from '../sections/Hero';
import { SocialProof } from '../sections/SocialProof';
import { UseCases } from '../sections/UseCases';
import { PainPoints } from '../sections/PainPoints';
import { WhyUs } from '../sections/WhyUs';
import { CTV } from '../sections/CTV';
import { TalkToTheThree } from '../sections/TalkToTheThree';
import { Council } from '../sections/Council';
import { Capabilities } from '../sections/Capabilities';
import { Workflow } from '../sections/Workflow';
import { Telemetry } from '../sections/Telemetry';
import { AudioShowcase } from '../sections/AudioShowcase';
import { VisualShowcase } from '../sections/VisualShowcase';
import { StudioGallery } from '../sections/StudioGallery';
import { CinematicStudioTour } from '../sections/CinematicStudioTour';
import { Testimonials } from '../sections/Testimonials';
import { Pricing } from '../sections/Pricing';
import { FAQ } from '../sections/FAQ';
import { Footer } from '../sections/Footer';
import { ScrollProgress } from '../sections/ScrollProgress';
import { ScrollRevealGallery } from '../sections/ScrollRevealGallery';
import { ScrollReveal } from '../ui/scroll-reveal';
import { Button } from '../ui/button';
import { Waveform } from '../visuals/Waveform';
import { WaitlistForm } from '../sections/WaitlistForm';
import { LandingAudioProvider } from '../../context/LandingAudioContext';
import { VoiceAgentModal } from '../agents/VoiceAgentModal';
import { AgentId } from '../../audio/voiceAgentEngine';
import { useLandingAudio } from '../../context/LandingAudioContext';
import { Play, Square } from 'lucide-react';

const WaveformSection = () => {
  const { isPlaying, togglePlay } = useLandingAudio();

  return (
    <section className="relative w-full border-y border-[var(--border)] bg-[var(--surface-color)]/70 backdrop-blur-xl py-6 overflow-hidden transition-colors duration-300 group">
      <div className="h-24 w-full px-0 relative">
        <Waveform />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[var(--background)]/20">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-[#f5a800] text-black flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_rgba(245,168,0,0.5)]"
          >
            {isPlaying ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-6 h-6 ml-1 fill-current" />
            )}
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] w-full px-4 md:px-12 mt-6">
        <div className="flex w-full flex-wrap justify-between items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
          <div className="flex items-center gap-2 text-[#2affa3]">
            <span className="w-2 h-2 rounded-full bg-[#2affa3] animate-pulse" />
            <span>EMAR — SPECTRAL ANALYSIS & DSP</span>
          </div>
          <div className="flex items-center gap-2 text-[#f5a800]">
            <span className="w-2 h-2 rounded-full bg-[#f5a800] animate-pulse" />
            <span>RICKY — SYNTHESIS & 808 ENGINE</span>
          </div>
          <div className="flex items-center gap-2 text-[#ff3c00]">
            <span className="w-2 h-2 rounded-full bg-[#ff3c00] animate-pulse" />
            <span>KINGPIN — VOCAL ORACLE & HARMONY</span>
          </div>
        </div>
      </div>
    </section>
  );
};

interface LandingViewProps {
  onEnterStudio: (sessionData?: any) => void;
  onExploreSonic: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onEnterStudio, onExploreSonic }) => {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVoiceAgent, setSelectedVoiceAgent] = useState<AgentId>('orchestrator');

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const handleOpenVoice = (agentId: AgentId = 'orchestrator') => {
    setSelectedVoiceAgent(agentId);
    setIsVoiceModalOpen(true);
  };

  return (
    <LandingAudioProvider>
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[#f5a800]/30 selection:text-[var(--foreground-bright)] font-sans overflow-x-hidden transition-colors duration-300">
        <ScrollProgress />
        <Nav
          onEnterStudio={onEnterStudio}
          onOpenVoiceModal={() => handleOpenVoice('orchestrator')}
        />

        <main>
          <Hero onEnterStudio={onEnterStudio} onExploreSonic={onExploreSonic} />
          <SocialProof />

          {/* Standalone Full-Width Waveform & Audio Telemetry Section */}
          <WaveformSection />

          <div className="border-b border-[var(--border)] bg-[var(--surface-color)] py-4 overflow-hidden transition-colors duration-300">
            <motion.div
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
              className="flex w-max gap-10 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-[var(--foreground-muted)]/60"
            >
              {[
                ...[
                  'Beat Lab',
                  'Piano Roll',
                  '808 Design',
                  'MIDI Engine',
                  'Vocal Recording',
                  'Spectral Analysis',
                  'Amapiano Mode',
                  'Afrobeats Grid',
                  'Agent Memory',
                  'Version Control',
                  'AI Mastering',
                  'Sidechain Tools',
                  'Harmony Generator',
                  'Real-time Coaching',
                  'Mixing Console',
                  'Stem Export',
                  'ThreeWM Orchestrator',
                ],
                ...[
                  'Beat Lab',
                  'Piano Roll',
                  '808 Design',
                  'MIDI Engine',
                  'Vocal Recording',
                  'Spectral Analysis',
                  'Amapiano Mode',
                  'Afrobeats Grid',
                  'Agent Memory',
                  'Version Control',
                  'AI Mastering',
                  'Sidechain Tools',
                  'Harmony Generator',
                  'Real-time Coaching',
                  'Mixing Console',
                  'Stem Export',
                  'ThreeWM Orchestrator',
                ],
              ].map((x, i) => (
                <span key={i}>🔱 {x}</span>
              ))}
            </motion.div>
          </div>

          <ScrollReveal>
            <UseCases />
          </ScrollReveal>
          <ScrollReveal>
            <PainPoints />
          </ScrollReveal>
          <ScrollReveal>
            <WhyUs />
          </ScrollReveal>

          <ScrollReveal>
            <Telemetry />
          </ScrollReveal>
          <ScrollReveal>
            <Council />
          </ScrollReveal>
          <ScrollReveal>
            <AudioShowcase />
          </ScrollReveal>
          <ScrollReveal>
            <VisualShowcase />
          </ScrollReveal>

          <ScrollReveal>
            <section className="relative w-full py-24 bg-[var(--background)] overflow-hidden">
              <div className="text-center mb-16 px-4">
                <span className="text-[#f5a800] font-mono text-sm tracking-widest uppercase mb-4 block">
                  Immersive Experience
                </span>
                <h2 className="text-4xl md:text-5xl font-display text-[var(--foreground-bright)] tracking-wide">
                  STEP INTO{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-200">
                    THE LAB
                  </span>
                </h2>
              </div>
              <ScrollRevealGallery />
            </section>
          </ScrollReveal>

          <ScrollReveal>
            <CinematicStudioTour />
          </ScrollReveal>
          <ScrollReveal>
            <StudioGallery />
          </ScrollReveal>
          <ScrollReveal>
            <Capabilities />
          </ScrollReveal>
          <ScrollReveal>
            <Workflow />
          </ScrollReveal>
          <ScrollReveal>
            <Pricing onSelectPlan={() => onEnterStudio()} />
          </ScrollReveal>
          <ScrollReveal>
            <Testimonials />
          </ScrollReveal>
          <ScrollReveal>
            <CTV onEnterStudio={() => onEnterStudio()} />
          </ScrollReveal>
          <ScrollReveal>
            <FAQ />
          </ScrollReveal>
          <ScrollReveal>
            <TalkToTheThree onEnterStudio={onEnterStudio} />
          </ScrollReveal>

          <ScrollReveal>
            <section
              id="early-access"
              className="relative overflow-hidden px-5 py-32 text-center md:px-14"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(245,168,0,.07),transparent_70%)]" />
              <span className="relative text-5xl drop-shadow-[0_0_16px_rgba(245,168,0,.4)]">
                🔱
              </span>
              <h2 className="relative mt-6 font-display text-7xl leading-[.85] text-[var(--foreground-bright)] md:text-[120px]">
                YOUR STUDIO.
                <br />
                <span className="text-[#f5a800]">YOUR</span>
                <span className="text-[#ff3c00]"> COUNCIL.</span>
              </h2>
              <p className="relative mx-auto mt-7 max-w-xl text-base font-light leading-7 text-[var(--foreground-muted)]/80">
                3WM SONIK is currently accepting priority beta producers. Request your early access
                pass below — producers building in Afrobeats, Amapiano, Hip-Hop, and R&B receive
                priority batch approval.
              </p>

              {/* Embedded Interactive Beta Access Form */}
              <div className="relative mx-auto mt-10 max-w-xl rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
                <WaitlistForm isDetailed={true} source="landing-cta" />
              </div>

              <div className="relative mt-8 flex justify-center gap-4">
                <Button variant="ghost" onClick={onExploreSonic}>
                  Enter Artist World 3D
                </Button>
              </div>
            </section>
          </ScrollReveal>
        </main>

        <Footer />

        {/* Global Multimodal Voice Agent Modal */}
        <VoiceAgentModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          initialAgent={selectedVoiceAgent}
          onEnterStudio={onEnterStudio}
        />
      </div>
    </LandingAudioProvider>
  );
};
