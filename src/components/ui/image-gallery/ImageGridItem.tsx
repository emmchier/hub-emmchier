'use client';

import { Illustration } from '@/interfaces';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface ImageGridItemProps {
  illustration: Illustration;
  index: number;
  isSkeleton?: boolean;
  className?: string;
  color?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  interactive?: boolean;
}

/**
 * Per-index variation tables for irregular (but deterministic) scroll animations.
 * Values cycle so the pattern repeats every N items — avoids Math.random()
 * which would differ between SSR and client renders.
 */
const DURATIONS = [600, 680, 540, 720, 570, 660, 610, 700, 550, 630, 690, 560];
const DELAY_EXTRA = [0, 45, -20, 70, -35, 55, 10, -45, 60, 25, -55, 35];
const TRANSLATE_Y = [20, 28, 16, 32, 18, 26, 22, 30, 14, 24, 20, 28];

export const ImageGridItem = ({
  illustration,
  index,
  isSkeleton = false,
  className = '',
  color,
  onClick,
  style,
  interactive = true,
}: ImageGridItemProps) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [transitionDelay, setTransitionDelay] = useState(0);
  const [isInitialBatch, setIsInitialBatch] = useState(false);
  const mountTime = useRef(0);

  // Varied per-item timing — creates the irregular, organic appearance
  const duration = DURATIONS[index % DURATIONS.length];
  const translateY = TRANSLATE_Y[index % TRANSLATE_Y.length];

  useEffect(() => {
    mountTime.current = performance.now();
    const el = itemRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          /**
           * Items visible within 500 ms of mount = initial batch → staggered
           * cascade (top-left to bottom-right). Items appearing later (user
           * scrolling) get near-zero delay so they feel instant and snappy.
           */
          const elapsed = performance.now() - mountTime.current;
          const isInitialBatch = elapsed < 500;
          setIsInitialBatch(isInitialBatch);
          const baseDelay = isInitialBatch ? Math.min(index * 70, 280) : 0;
          // Per-item extra jitter makes each item feel independently timed
          const extra = isInitialBatch
            ? DELAY_EXTRA[index % DELAY_EXTRA.length]
            : 0;
          setTransitionDelay(Math.max(0, baseDelay + extra));
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  const fadeStyle: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    // Slide up from below — amount varies per item for organic feel
    transform: isVisible ? 'translateY(0px)' : `translateY(${translateY}px)`,
    transition: isVisible
      ? `opacity ${duration}ms cubic-bezier(0.22,1,0.36,1) ${transitionDelay}ms, transform ${duration}ms cubic-bezier(0.22,1,0.36,1) ${transitionDelay}ms`
      : 'none',
  };

  const interactiveClass = interactive
    ? 'cursor-pointer group transform transition-transform duration-300 hover:scale-98'
    : 'cursor-default';

  if (!isSkeleton) {
    return (
      <div
        ref={itemRef}
        onClick={interactive ? onClick : undefined}
        style={{ backgroundColor: color, ...style, ...fadeStyle }}
        className={`relative overflow-hidden ${interactiveClass} ${className}`}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: color,
            ...(isInitialBatch && isVisible
              ? {
                  animation: `image-color-flash ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${transitionDelay}ms forwards`,
                }
              : { opacity: 0 }),
          }}
        />
        <Image
          src={`${illustration.image}`}
          alt={illustration.altText}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33.33vw"
          priority
          className="object-cover object-center w-full h-full duration-300"
        />
      </div>
    );
  }

  return (
    <div
      ref={itemRef}
      style={fadeStyle}
      className={`relative overflow-hidden cursor-pointer bg-tab-active animate-bounce ${className} transform transition-transform duration-300`}
    >
      <Image
        src=""
        alt="loading asset"
        className="opacity-0"
        width={500}
        height={500}
      />
    </div>
  );
};
