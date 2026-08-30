import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  index?: number;
}

export function FeatureCard({
  icon,
  title,
  description,
  badge,
  badgeColor = 'text-[#f5a800]',
  index = 0,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay: (index % 4) * 0.06 }}
      whileHover={{ backgroundColor: '#1c1811' }}
      className="min-h-56 border-b border-r border-[var(--gold)]/10 bg-[var(--surface)] p-7"
    >
      <span className="text-3xl">{icon}</span>
      <h3 className="font-display mt-4 text-2xl text-[var(--foreground-bright)]">{title}</h3>
      <p className="mt-2 text-xs font-light leading-6 text-[var(--muted)]">{description}</p>
      {badge && (
        <span
          className={`mt-5 inline-block rounded bg-white/5 px-2 py-1 font-mono text-[9px] uppercase tracking-widest ${badgeColor}`}
        >
          {badge}
        </span>
      )}
    </motion.div>
  );
}
