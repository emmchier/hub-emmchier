'use client';

import React from 'react';
import { useSkeletonOnce } from '@/hooks/useSkeletonOnce';
import { useEntranceAnimation } from '@/hooks/useEntranceAnimation';

interface HeaderProps {
  className?: string;
}

const GLOW_COLORS = ['#f6d4c2', '#74bde8', '#67cfcb'] as const;

/**
 * Wave stagger: 27 ms per letter (double speed vs previous 55 ms).
 * Duration 410 ms → last letter (index 12) settles at 12×27+410 = 734 ms
 * after skeleton ends, still finishing after navbar/sidebar/tabs.
 */
const WAVE_STAGGER_MS = 27;

const GlowText = ({
  text,
  startIndex,
  animate,
}: {
  text: string;
  startIndex: number;
  animate: boolean;
}) => (
  <>
    {text.split('').map((char, i) => {
      const letterIndex = startIndex + i;
      const color = GLOW_COLORS[letterIndex % GLOW_COLORS.length];
      const delay = letterIndex * WAVE_STAGGER_MS;

      return (
        <span
          key={i}
          // Animation goes via className, NOT inline style, so CSS :hover can
          // override it (inline style has highest specificity and would block hover).
          className={`glow-letter${animate ? ' glow-wave' : ''}`}
          style={
            {
              '--glow-color': color,
              '--wave-delay': `${delay}ms`,
              // Keep invisible until animation fires (glow-wave handles opacity via keyframe)
              ...(!animate ? { opacity: 0 } : {}),
            } as React.CSSProperties
          }
        >
          {char}
        </span>
      );
    })}
  </>
);

export const Header = ({ className }: HeaderProps) => {
  const showSkeleton = useSkeletonOnce();
  const animate = useEntranceAnimation();

  const layoutClasses = `
    ${className ?? ''}
    ml-[8px]
    md:ml-0
    mb-[8px]
    md:mb-[16px]
    flex
    flex-col
    items-start
    leading-[0.8]
    font-bold
    tracking-[-0.02em]
    select-none
    pointer-events-none
  `;

  return (
    <div className="relative">
      {/* Siempre montado — fade-out de 500ms al terminar el skeleton,
          solapado con wave-letter-in para una transición continua */}
      <div
        className={`${layoutClasses} absolute inset-0 z-10`}
        aria-hidden="true"
        style={{
          opacity: showSkeleton ? 1 : 0,
          transition: showSkeleton ? 'none' : 'opacity 500ms ease-out',
          pointerEvents: 'none',
        }}
      >
        <span
          className="
              ml-0 mb:ml-[8px]
              text-[clamp(4rem,15vw,14rem)]
              mb-[-0.22em]
              inline-block
            "
          style={{
            background:
              'linear-gradient(90deg, #0f2a39 0%, #173b4f 18%, #1d536e 46%, #569cc322 50%, #1d536e 54%, #173b4f 82%, #0f2a39 100%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-pulse 2.2s ease-in-out infinite',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}
        >
          art.
        </span>

        <span
          className="
              block
              w-full
              text-[clamp(4.5rem,16vw,15.5rem)]
              leading-[0.8]
              whitespace-nowrap
            "
          style={{
            background:
              'linear-gradient(90deg, #0f2a39 0%, #173b4f 18%, #1d536e 46%, #569cc322 50%, #1d536e 54%, #173b4f 82%, #0f2a39 100%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-pulse 2.2s ease-in-out infinite',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}
        >
          emmchier.
        </span>
      </div>

      <div className={`${layoutClasses} relative z-0`}>
        <span
          className="
            ml-0 mb:ml-[8px]
            text-[clamp(4rem,15vw,14rem)]
            mb-[-0.22em]
            inline-block
            relative
          "
          style={{ zIndex: 1 }}
        >
          {/* "art." — letters 0..3 */}
          <GlowText text="art." startIndex={0} animate={animate} />
        </span>

        <span
          className="
            block
            w-full
            text-[clamp(4.5rem,16vw,15.5rem)]
            leading-[0.8]
            whitespace-nowrap
          "
        >
          {/* "emmchier." — letters 4..12 */}
          {/* "emmchier." — letters 4..12 */}
          <GlowText text="emmchier." startIndex={4} animate={animate} />
        </span>
      </div>
    </div>
  );
};
