'use client';

import React from 'react';
import { useSkeletonOnce } from '@/hooks/useSkeletonOnce';
import { useEntranceAnimation } from '@/hooks/useEntranceAnimation';

interface HeaderProps {
  className?: string;
}

const GLOW_COLORS = ['#f6d4c2', '#74bde8', '#67cfcb'] as const;

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
          className={`glow-letter${animate ? ' glow-wave' : ''}`}
          style={
            {
              '--glow-color': color,
              '--wave-delay': `${delay}ms`,
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
    mb-[8px]
    md:mb-[16px]
    flex
    flex-col
    items-center
    leading-[0.8]
    font-bold
    tracking-[-0.02em]
    select-none
    pointer-events-none
  `;

  return (
    <div className="relative w-full flex justify-center">
      {/* Skeleton shimmer — fades out when skeleton ends */}
      <div
        className={`${layoutClasses} absolute inset-0 z-10 flex justify-center`}
        aria-hidden="true"
        style={{
          opacity: showSkeleton ? 1 : 0,
          transition: showSkeleton ? 'none' : 'opacity 500ms ease-out',
          pointerEvents: 'none',
        }}
      >
        <span
          className="text-[clamp(2.5rem,8vw,6.5rem)] leading-[0.8] whitespace-nowrap"
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

      {/* Animated letters */}
      <div className={`${layoutClasses} relative z-0`}>
        <span className="text-[clamp(2.5rem,8vw,6.5rem)] leading-[0.8] whitespace-nowrap">
          {/* "emmchier." — letters start at index 0 */}
          <GlowText text="emmchier." startIndex={0} animate={animate} />
        </span>
      </div>
    </div>
  );
};
