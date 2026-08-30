import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: 'How is 3WM SONIK different from other AI music tools?',
    answer:
      "Most AI tools are chatbots bolted onto existing DAWs. 3WM SONIK is built from the ground up as an AI-native production environment. The Three Wise Men agents don't just suggest changes—they execute tools on your actual project state. Every action is reversible, and the agents maintain memory of your preferences across sessions.",
    category: 'Product',
  },
  {
    question: 'Do I need to know how to use a DAW?',
    answer:
      "3WM SONIK is designed for producers at all levels. If you're new to production, the agents can guide you through every step from beat creation to mastering. If you're experienced, you'll appreciate the speed and precision of having specialized AI that understands professional workflows. The interface is intuitive but powerful.",
    category: 'Getting Started',
  },
  {
    question: 'What happens to my music? Do you own it?',
    answer:
      'You own everything you create in 3WM SONIK. Your projects, stems, and final exports are 100% yours. We use your data only to provide the service and improve the AI agents. We never claim ownership of your music or use it for training without explicit permission.',
    category: 'Ownership',
  },
  {
    question: 'Can I export my projects to other DAWs?',
    answer:
      'Yes. You can export your projects as standard MIDI files, audio stems, or full mixes. We also support exporting to common DAW formats. The goal is to give you flexibility—3WM SONIK can be your primary studio or a powerful tool in your existing workflow.',
    category: 'Export',
  },
  {
    question: 'How accurate is the AI analysis and suggestions?',
    answer:
      'Our agents are trained specifically on African music genres—Afrobeats, Amapiano, Highlife, and their global derivatives. They understand the rhythmic patterns, harmonic structures, and production techniques that make these genres unique. That said, the producer always has final authority. AI proposes; you decide.',
    category: 'AI Accuracy',
  },
  {
    question: 'Can I collaborate with other producers in real-time?',
    answer:
      'Yes, on the PRO and LABEL tiers. Multiple producers can work on the same project simultaneously with real-time sync. The agents maintain a shared context so everyone sees the same project state. You can also leave comments, track changes, and manage version history together.',
    category: 'Collaboration',
  },
  {
    question: 'What genres do the agents understand best?',
    answer:
      "3WM SONIK has first-class support for Afrobeats, Amapiano, Afrofusion, Highlife, Afrotrap, and related genres. The agents understand the specific drum patterns, bass interactions, vocal styles, and harmonic progressions that define these sounds. We're continuously expanding support for other genres.",
    category: 'Genres',
  },
  {
    question: 'Is my audio processing done locally or in the cloud?',
    answer:
      'We use a hybrid approach. Real-time audio processing (playback, recording, mixing) happens locally in your browser using Web Audio API for lowest latency. AI analysis, stem generation, and mastering happen in the cloud where we can leverage more powerful models. This gives you the best of both worlds—speed and intelligence.',
    category: 'Technical',
  },
  {
    question: 'Can I train the agents on my own sound?',
    answer:
      'On the LABEL tier, you can train custom agent models on your previous productions. The agents learn your preferences for drum sounds, vocal processing, mixing techniques, and more. This creates a personalized AI that sounds like you—not a generic preset.',
    category: 'Customization',
  },
  {
    question: "What if I'm not satisfied with the results?",
    answer:
      "Every AI action in 3WM SONIK is reversible with full version history. If you don't like what an agent does, you can undo it instantly. You can also provide feedback to help the agents learn your preferences. We offer a 14-day free trial on all plans so you can experience the full workflow before committing.",
    category: 'Support',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(faqs.map((f) => f.category)))];
  const filteredFaqs = filter === 'All' ? faqs : faqs.filter((f) => f.category === filter);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFAQ(index);
    }
  };

  return (
    <section id="faq" className="mx-auto max-w-[1328px] px-5 py-28 md:px-14">
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#ff3c00]">
          — Questions —
        </p>
        <h2 className="font-display mt-3 text-6xl leading-none text-[var(--foreground-bright)] md:text-8xl">
          ASK THE
          <br />
          ORCHESTRATOR
        </h2>
        <p className="mt-5 text-sm font-light leading-7 text-[var(--muted)]">
          Everything you need to know about 3WM SONIK and how it works.
        </p>
      </div>

      {/* Category Filter */}
      <div
        className="flex flex-wrap justify-center gap-2 mb-12"
        role="group"
        aria-label="FAQ categories"
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all ${
              filter === category
                ? 'bg-[#f5a800] text-black'
                : 'bg-white/5 text-[var(--muted)] hover:bg-white/10 hover:text-[var(--foreground-bright)]'
            }`}
            aria-pressed={filter === category}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="max-w-3xl mx-auto space-y-4">
        {filteredFaqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="border border-[#f5a800]/10 bg-[#181410] rounded-xl overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              aria-expanded={openIndex === index}
              aria-controls={`faq-answer-${index}`}
              id={`faq-question-${index}`}
            >
              <div className="flex-1 pr-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#f5a800] mb-2 block">
                  {faq.category}
                </span>
                <h3 className="text-sm font-semibold text-[var(--foreground-bright)]">
                  {faq.question}
                </h3>
              </div>
              <div className="flex-shrink-0">
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-[#f5a800]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[var(--muted)]" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 pt-0">
                    <p className="text-sm text-[var(--muted)] leading-7">{faq.answer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-16 text-center">
        <p className="text-sm text-[var(--muted)] mb-4">Still have questions?</p>
        <a
          href="mailto:support@3wm.audio"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#f5a800] text-black font-bold font-mono text-xs uppercase tracking-wider rounded-xl hover:bg-[#ffb71b] transition-colors"
        >
          Contact Support
        </a>
      </div>
    </section>
  );
}
