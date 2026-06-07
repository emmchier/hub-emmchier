'use client';

import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/** Outer ring size (px); inner lens matches this diameter. */
const DIAMETER_PX = 40;
const RADIUS_PX = DIAMETER_PX / 2;

/**
 * B&W negative with moderate final contrast. Extreme contrast (e.g. 6000%+)
 * collapses thin stroked text (`-webkit-text-fill-color: transparent`) to a
 * flat white disk; ~400–500% tends to keep hairlines as dark marks on light.
 */
const BACKDROP_LENS_FILTER = 'grayscale(1) invert(1) contrast(480%)';

/** Native / semantic controls only (no `cursor-pointer` divs, no gallery tiles, no role="button" wrappers). */
const CLICKABLE_SELECTOR = [
  'a[href]',
  'button',
  'summary',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'label[for]',
].join(', ');

const SKIP_ROOT_SELECTOR = '[data-no-inverted-cursor]';

function isDisabledClickable(el: Element): boolean {
  if (el instanceof HTMLButtonElement && el.disabled) return true;
  if (el instanceof HTMLInputElement && el.disabled) return true;
  if (el instanceof HTMLSelectElement && el.disabled) return true;
  if (el instanceof HTMLTextAreaElement && el.disabled) return true;
  if (
    el instanceof HTMLAnchorElement &&
    el.getAttribute('aria-disabled') === 'true'
  )
    return true;
  if (el.getAttribute('aria-disabled') === 'true') return true;
  return false;
}

/** Nearest interactive target under the pointer, or null. */
function resolveClickableTarget(target: Element | null): Element | null {
  if (!target) return null;
  const skip = target.closest(SKIP_ROOT_SELECTOR);
  if (skip) return null;

  const bySemantics = target.closest(CLICKABLE_SELECTOR);
  if (bySemantics && !isDisabledClickable(bySemantics)) return bySemantics;

  return null;
}

const HTML_CURSOR_CLASS = 'inverted-cursor-active';

/**
 * Desktop-only: over native controls (`a[href]`, `button`, form fields, `summary`),
 * shows a circular high-contrast B&W lens (~40px); mid-gray is pushed to #000 / #fff.
 */
export function InvertedCursor() {
  /** Avoid hydration mismatch: media queries differ SSR (no window) vs first client paint. */
  const [hasMounted, setHasMounted] = useState(false);
  const enabled = useMediaQuery('(pointer: fine) and (hover: hover)');
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [active, setActive] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef(false);
  const rafRef = useRef<number>(0);

  const ready = hasMounted && enabled;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!ready) {
      document.documentElement.classList.remove(HTML_CURSOR_CLASS);
      return;
    }
    if (active) {
      document.documentElement.classList.add(HTML_CURSOR_CLASS);
    } else {
      document.documentElement.classList.remove(HTML_CURSOR_CLASS);
    }
    return () => {
      document.documentElement.classList.remove(HTML_CURSOR_CLASS);
    };
  }, [ready, active]);

  useEffect(() => {
    if (!ready) {
      setActive(false);
      activeRef.current = false;
      return;
    }

    const paint = () => {
      rafRef.current = 0;
      const ring = ringRef.current;
      if (!ring) return;
      const { x, y } = posRef.current;
      ring.style.transform = `translate3d(${x - RADIUS_PX}px, ${y - RADIUS_PX}px, 0)`;
    };

    const schedulePaint = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        paint();
      });
    };

    const setActiveIfChanged = (next: boolean) => {
      if (next === activeRef.current) return;
      activeRef.current = next;
      setActive(next);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      posRef.current = { x: e.clientX, y: e.clientY };
      schedulePaint();

      const raw = e.target;
      const t =
        raw instanceof Element
          ? raw
          : raw instanceof Node
            ? raw.parentElement
            : null;
      if (t?.closest(SKIP_ROOT_SELECTOR)) {
        setActiveIfChanged(false);
        return;
      }

      const clickable = resolveClickableTarget(t);
      setActiveIfChanged(Boolean(clickable));
    };

    const onBlur = () => {
      setActiveIfChanged(false);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('blur', onBlur);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      document.documentElement.classList.remove(HTML_CURSOR_CLASS);
    };
  }, [ready]);

  if (!ready) return null;

  const innerTransition = reduceMotion
    ? 'opacity 120ms ease-out, transform 120ms ease-out'
    : 'opacity 380ms cubic-bezier(0.22, 1, 0.36, 1), transform 480ms cubic-bezier(0.22, 1, 0.36, 1)';

  return (
    <div
      ref={ringRef}
      className="pointer-events-none fixed left-0 top-0 z-600"
      style={{
        width: DIAMETER_PX,
        height: DIAMETER_PX,
        willChange: 'transform',
      }}
      aria-hidden
    >
      <div
        className="h-full w-full rounded-full"
        style={{
          opacity: active ? 1 : 0,
          transform: active ? 'scale(1)' : 'scale(0.28)',
          transformOrigin: '50% 50%',
          transition: innerTransition,
          WebkitBackdropFilter: BACKDROP_LENS_FILTER,
          backdropFilter: BACKDROP_LENS_FILTER,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
        }}
      />
    </div>
  );
}
