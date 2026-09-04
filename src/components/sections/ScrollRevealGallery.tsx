'use client';

import React, { useRef } from 'react';
import ScrollRevealImage from '../ui/scroll-reveal-image';

const IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0',
    alt: 'Studio Control Room - Cinematic wide shot',
    height: '900px',
  },
];

export function ScrollRevealGallery({
  fromWidth = '40%',
  toWidth = '95%',
  fromScale = 1.6,
  toScale = 1,
  fromRadius = '0px',
  toRadius = '22px',
  stiffness = 120,
  damping = 80,
}: {
  fromWidth?: string;
  toWidth?: string;
  fromScale?: number;
  toScale?: number;
  fromRadius?: string;
  toRadius?: string;
  stiffness?: number;
  damping?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={scrollRef} className="w-full h-full relative" style={{ overflowY: 'visible' }}>
      <div className="space-y-24 flex flex-col gap-12 pb-24 pt-12">
        {IMAGES.map((img) => (
          <ScrollRevealImage
            key={img.src}
            src={img.src}
            alt={img.alt}
            height={img.height}
            fromWidth={fromWidth}
            toWidth={toWidth}
            innerWidth="95%"
            fromScale={fromScale}
            toScale={toScale}
            fromRadius={fromRadius}
            toRadius={toRadius}
            stiffness={stiffness}
            damping={damping}
            container={scrollRef} // Use the local wrapper ref instead of the whole page
          />
        ))}
      </div>
    </div>
  );
}

export default ScrollRevealGallery;
