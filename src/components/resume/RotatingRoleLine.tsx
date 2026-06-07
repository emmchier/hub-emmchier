'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_ROLES = ['Illustrator', 'UX/UI Designer', 'UI Developer'];

const LINE_PX = 32;
const INTERVAL_MS = 3000;
const TRANSITION_MS = 500;

interface RotatingRoleLineProps {
  className?: string;
  /**
   * Roles list from Contentful (max 3). Falls back to DEFAULT_ROLES when
   * undefined, empty or not yet loaded.
   */
  roles?: string[];
}

export function RotatingRoleLine({ className, roles }: RotatingRoleLineProps) {
  // Use Contentful roles when available (max 3), otherwise default
  const activeRoles = useMemo(() => {
    const r = roles && roles.length > 0 ? roles.slice(0, 3) : DEFAULT_ROLES;
    return r;
  }, [roles]);

  // Build the infinite strip: roles × 2 + first role (for seamless loop)
  const strip = useMemo(
    () => [...activeRoles, ...activeRoles, activeRoles[0]!],
    [activeRoles]
  );

  const loopResetIndex = activeRoles.length;

  const [index, setIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  const indexRef = useRef(index);
  indexRef.current = index;

  // Reset index when roles change (e.g. after Contentful data loads)
  useEffect(() => {
    setIndex(0);
    setNoTransition(true);
  }, [activeRoles]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => {
        if (prev >= strip.length - 1) return prev;
        return prev + 1;
      });
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [strip.length]);

  useLayoutEffect(() => {
    if (!noTransition) return;
    const raf = requestAnimationFrame(() => {
      setNoTransition(false);
    });
    return () => cancelAnimationFrame(raf);
  }, [noTransition]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== 'transform') return;
    if (indexRef.current !== strip.length - 1) return;
    setNoTransition(true);
    setIndex(loopResetIndex);
  };

  const visibleLabel = strip[index] ?? strip[0];

  return (
    <div
      className={['flex items-center gap-2', className ?? ''].join(' ')}
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        className="inline-block shrink-0 bg-[#67CFCB]"
        style={{ width: 10, height: 10, transform: 'rotate(45deg)' }}
        aria-hidden
      />
      <span className="sr-only">{visibleLabel}</span>
      <div className="min-w-0 overflow-hidden" style={{ height: LINE_PX }}>
        <div
          style={{
            transform: `translateY(-${index * LINE_PX}px)`,
            transition: noTransition
              ? 'none'
              : `transform ${TRANSITION_MS}ms ease-out`,
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {strip.map((label, i) => (
            <div
              key={`role-strip-${i}`}
              className="flex items-center font-medium leading-none text-white"
              style={{ height: LINE_PX, fontSize: 24 }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
