'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export function ScrollReveal({
  children,
  className = '',
  yOffset = 50,
  duration = 0.8,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  yOffset?: number;
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px -10% 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: yOffset }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: yOffset }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default ScrollReveal;
