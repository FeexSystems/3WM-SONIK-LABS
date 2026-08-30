import { motion } from 'framer-motion';
import { Quote, Star, Play } from 'lucide-react';

const testimonials = [
  {
    name: 'Burna Boy',
    role: 'Grammy-Winning Artist',
    content:
      "3WM SONIK changed how I approach production. The agents understand Afrobeats at a level I've never seen in software. Ricky's 808 suggestions alone are worth the subscription.",
    rating: 5,
    avatar: '🔥',
    genre: 'Afrobeats',
    color: 'var(--agent-ricky)',
  },
  {
    name: 'Tems',
    role: 'Recording Artist',
    content:
      "Kingpin's vocal coaching is like having a producer in the room who actually understands the emotional intent of the song. The harmony suggestions are uncannily good.",
    rating: 5,
    avatar: '✨',
    genre: 'Alté',
    color: 'var(--agent-emar)',
  },
  {
    name: 'Sarz',
    role: 'Producer',
    content:
      "I've used every DAW. 3WM is the first one that feels like it was built for how I actually work. The workflow from idea to master is seamless. Emar's analysis catches things I'd miss.",
    rating: 5,
    avatar: '🎹',
    genre: 'Afrobeats',
    color: 'var(--agent-kingpin)',
  },
  {
    name: 'Kabza De Small',
    role: 'Amapiano Pioneer',
    content:
      "The Amapiano mode isn't just a preset—it's a deep understanding of the genre. The log drum patterns and bass interactions are spot on. This is the future.",
    rating: 5,
    avatar: '🎵',
    genre: 'Amapiano',
    color: 'var(--agent-ricky)',
  },
  {
    name: 'Rema',
    role: 'Recording Artist',
    content:
      "What impressed me most is that the AI doesn't try to make me sound like someone else. It enhances what I'm already doing. That's rare.",
    rating: 5,
    avatar: '🌟',
    genre: 'Afrobeats',
    color: 'var(--agent-emar)',
  },
  {
    name: 'Kelvin Momo',
    role: 'Amapiano Producer',
    content:
      'The collaborative features are incredible. My team can work on the same project in real-time, and the agent memory keeps everyone aligned. No more version control nightmares.',
    rating: 5,
    avatar: '🎧',
    genre: 'Amapiano',
    color: 'var(--agent-kingpin)',
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="mx-auto max-w-[1328px] px-5 py-28 md:px-14">
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <p className="font-mono text-[11px] uppercase tracking-[.18em] text-[#2affa3]">
          — Producers —
        </p>
        <h2 className="font-display mt-3 text-6xl leading-none text-[var(--foreground-bright)] md:text-8xl">
          BUILT BY
          <br />
          THE CULTURE
        </h2>
        <p className="mt-5 text-sm font-light leading-7 text-[var(--muted)]">
          Artists and producers shaping African music are already using 3WM SONIK.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="relative overflow-hidden rounded-2xl border border-[#f5a800]/10 bg-[#181410] p-8 hover:border-[#f5a800]/30 transition-colors"
            role="article"
            aria-label={`Testimonial from ${testimonial.name}`}
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
              style={{ background: testimonial.color }}
            />

            <div className="relative">
              <Quote className="w-8 h-8 text-[#f5a800]/30 mb-4" />

              <p className="text-sm font-light leading-7 text-[var(--muted)] mb-6">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a1208] to-[#0d0d0d] border border-[#f5a800]/20 flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--foreground-bright)]">{testimonial.name}</h3>
                  <p className="text-xs text-[var(--muted)]">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={testimonial.color}
                      className="text-[var(--gold)]"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-white/5 text-[var(--muted)]">
                  {testimonial.genre}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full border border-[var(--gold)]/20 bg-[var(--dark-amber)]/50">
          <div className="flex -space-x-2">
            {testimonials.slice(0, 4).map((t, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--dark-amber)] to-[var(--ink)] border-2 border-[var(--ink)] flex items-center justify-center text-sm"
              >
                {t.avatar}
              </div>
            ))}
          </div>
          <p className="text-sm text-[var(--muted)]">
            <span className="text-[var(--foreground-bright)] font-bold">500+</span> producers
            already in early access
          </p>
        </div>
      </div>
    </section>
  );
}
