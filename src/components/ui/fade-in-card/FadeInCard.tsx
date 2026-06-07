'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useEntranceAnimation } from '@/hooks/useEntranceAnimation';

interface FadeInCardProps {
  children: ReactNode;
  /**
   * Position index within the group — drives the stagger delay.
   * Stagger = Math.min(index * 60, 450) ms.
   */
  index: number;
  /**
   * Increment this value to re-trigger the entrance animation (e.g. on tab
   * switch). Changing animationKey causes the card to:
   *   • instantly reset to invisible (no transition)
   *   • re-evaluate its viewport position on the next RAF
   *   • if in viewport → play the staggered wave entrance
   *   • if below fold → enter lazy-scroll mode (IntersectionObserver)
   *
   * On initial mount this value is ignored — the first wave is driven by
   * useEntranceAnimation (fires once after the skeleton clears at ~1 500 ms).
   */
  animationKey: number;
  className?: string;
}

/**
 * Two-phase entrance animation wrapper.
 *
 * Phase 1 — Wave (plays once when skeleton ends, and again on every
 * animationKey change while entranceReady = true):
 *   Cards in the viewport fade+slide up with a staggered delay that creates
 *   a left→right / top→bottom wave. No neon — clean opacity + translateY.
 *
 * Phase 2 — Lazy scroll:
 *   Cards below the fold at wave-time use IntersectionObserver to reveal
 *   themselves when the user scrolls them into view.
 *
 * Performance notes:
 *   • React 18 automatic batching: all setState calls from the same RAF frame
 *     are batched into a single render pass, regardless of how many FadeInCard
 *     instances are mounted. A tab click causes exactly 2 render batches total
 *     (resetting → wave/lazy) across all cards.
 *   • No CSS animation restart hacks — we use CSS transitions throughout.
 *     The RAF between "resetting" and "wave" states guarantees the browser
 *     paints opacity: 0 before starting the transition to opacity: 1.
 *   • Lazy IntersectionObserver is disconnected on every cleanup so there
 *     are no dangling observers after re-triggers or unmounts.
 */

type PhaseState =
  | { phase: 'pending' } // skeleton still showing — invisible, no transition
  | { phase: 'resetting' } // briefly invisible before wave — clears previous state
  | { phase: 'wave'; delay: number } // CSS transition with stagger delay
  | { phase: 'lazy-hidden' } // below fold — waiting for IntersectionObserver
  | { phase: 'lazy-visible' }; // revealed via scroll

export function FadeInCard({
  children,
  index,
  animationKey,
  className = '',
}: FadeInCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const entranceReady = useEntranceAnimation();
  const [phaseState, setPhaseState] = useState<PhaseState>({
    phase: 'pending',
  });
  // Stable ref so the cleanup function always disconnects the latest observer.
  const lazyObserverRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!entranceReady) return;
    const el = ref.current;
    if (!el) return;

    // Always disconnect any in-flight lazy observer before re-triggering.
    lazyObserverRef.current?.disconnect();
    lazyObserverRef.current = null;

    // Step 1 — instantly hide (no transition, clears whatever visual state
    // the card is in — works for both fresh mounts and re-triggers).
    setPhaseState({ phase: 'resetting' });

    // Step 2 — after the browser paints the invisible frame, decide:
    //   • card in viewport → join the staggered wave
    //   • card below fold  → set up lazy IntersectionObserver
    const raf = requestAnimationFrame(() => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const inViewport = rect.top < window.innerHeight && rect.bottom > 0;

      if (inViewport) {
        setPhaseState({ phase: 'wave', delay: Math.min(index * 60, 450) });
      } else {
        setPhaseState({ phase: 'lazy-hidden' });

        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setPhaseState({ phase: 'lazy-visible' });
              observer.disconnect();
              lazyObserverRef.current = null;
            }
          },
          { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
        );
        lazyObserverRef.current = observer;
        observer.observe(ref.current);
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      lazyObserverRef.current?.disconnect();
      lazyObserverRef.current = null;
    };
  }, [entranceReady, animationKey, index]);

  // Compute inline style from current phase. Using a switch keeps the logic
  // co-located and avoids conditional hook calls.
  let inlineStyle: React.CSSProperties;
  switch (phaseState.phase) {
    case 'pending':
    case 'resetting':
    case 'lazy-hidden':
      inlineStyle = { opacity: 0, transform: 'translateY(22px)' };
      break;
    case 'wave':
      inlineStyle = {
        opacity: 1,
        transform: 'translateY(0px)',
        transition: `opacity 540ms cubic-bezier(0.16, 1, 0.3, 1) ${phaseState.delay}ms, transform 540ms cubic-bezier(0.16, 1, 0.3, 1) ${phaseState.delay}ms`,
      };
      break;
    case 'lazy-visible':
      inlineStyle = {
        opacity: 1,
        transform: 'translateY(0px)',
        transition:
          'opacity 520ms cubic-bezier(0.22, 1, 0.36, 1), transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
      };
      break;
  }

  return (
    <div ref={ref} style={inlineStyle} className={className}>
      {children}
    </div>
  );
}
