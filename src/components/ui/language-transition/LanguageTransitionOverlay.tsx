'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/store/ui/ui-store';

/**
 * Full-screen pixel-wave transition triggered by the EN/ES language switch.
 *
 * Wave direction: bottom-right → top-left (like a gust of wind crossing the
 * screen diagonally). Each cell's delay is derived from its normalised
 * distance to the bottom-right corner plus a small organic jitter so the
 * wave front looks natural rather than perfectly mechanical.
 *
 * KEY DESIGN: each cell receives BOTH animations (pixel-in + pixel-out) in a
 * single React render pass. The browser chains them natively — there is no
 * React state change (and therefore no re-render of hundreds of divs) between
 * the entry and exit phases, which eliminates the pause that a phase-switch
 * approach would cause.
 *
 * The Footer dispatches `languageToggleRequest`; this overlay catches it,
 * plays the wave, calls toggleLanguage() at peak coverage, then unwinds.
 */

// Design-system colours — dark blues + occasional warm accent
const PIXEL_COLORS = [
  '#112f40', // primary-background
  '#112f40', // (weighted heavier — dominant hue)
  '#173b4f', // secondary-background
  '#173b4f',
  '#1c4c67', // indigo-100
  '#15384b', // indigo-200
  '#224e67', // secondary-background-hover
  '#21516b', // border accent
  '#569cc3', // primary-text (blue spark)
  '#437b9a', // primary-text-hover
  '#74bde8', // blue-100 (lighter spark)
  '#f6d4c2', // activated-text (warm accent — rare pop)
];

const PIXEL_SIZE = 72; // px — side length of each mosaic square
const STAGGER_MS = 240; // total wave sweep duration bottom-right → top-left
const JITTER_MS = 28; // per-cell organic noise layered on top of wave delay
const CELL_IN_MS = 140; // each block's scale-in duration
const CELL_OUT_MS = 95; // each block's scale-out duration

// Time from animation start when ALL cells have finished entering.
// = max possible inDelay + CELL_IN_MS + 1 frame buffer
const PEAK_MS = STAGGER_MS + JITTER_MS + CELL_IN_MS + 16;

// Glitch burst: starts just before peak, lasts through the exit sweep onset.
// Each cell gets a small per-cell offset so the corruption looks organic.
const GLITCH_DURATION_MS = 400;
const GLITCH_BASE_DELAY_MS = PEAK_MS - 55; // starts as coverage peaks

interface Cell {
  color: string;
  inDelay: number;
  totalExitDelay: number; // absolute ms from t=0 when pixel-out should start
  glitchDelay: number; // absolute ms from t=0 when pixel-glitch starts
}

export function LanguageTransitionOverlay() {
  const { toggleLanguage } = useUIStore();
  const [isVisible, setIsVisible] = useState(false);
  const [cells, setCells] = useState<Cell[]>([]);
  const [cols, setCols] = useState(0);

  const isRunningRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const latestRunRef = useRef<() => void>(() => {});

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  };

  const runTransition = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    clearTimers();

    const w = window.innerWidth;
    const h = window.innerHeight;
    const numCols = Math.ceil(w / PIXEL_SIZE) + 1;
    const numRows = Math.ceil(h / PIXEL_SIZE) + 1;

    const newCells: Cell[] = Array.from(
      { length: numCols * numRows },
      (_, index) => {
        const col = index % numCols;
        const row = Math.floor(index / numCols);

        // Normalised position: 0 = left/top edge, 1 = right/bottom edge
        const colNorm = numCols > 1 ? col / (numCols - 1) : 0;
        const rowNorm = numRows > 1 ? row / (numRows - 1) : 0;

        // waveT: 0 = bottom-right (first to animate) → 1 = top-left (last)
        const waveT = (1 - colNorm + (1 - rowNorm)) / 2;

        const inDelay = waveT * STAGGER_MS + Math.random() * JITTER_MS;
        // Exit wave rolls in the same direction
        const outDelay = waveT * STAGGER_MS + Math.random() * JITTER_MS;

        return {
          color: PIXEL_COLORS[Math.floor(Math.random() * PIXEL_COLORS.length)],
          inDelay,
          // Exit starts AFTER all cells have entered (PEAK_MS), then each cell
          // adds its own wave-based outDelay so the wave rolls out the same way.
          totalExitDelay: PEAK_MS + outDelay,
          // Small per-cell glitch offset so the corruption isn't a uniform flash.
          glitchDelay: GLITCH_BASE_DELAY_MS + Math.floor(inDelay % 55),
        };
      }
    );

    setCols(numCols);
    setCells(newCells);
    setIsVisible(true);

    // Switch language while everything is covered (at peak coverage)
    schedule(() => toggleLanguage(), PEAK_MS);

    // Remove cells from DOM after the full animation completes
    const totalDuration = PEAK_MS + STAGGER_MS + JITTER_MS + CELL_OUT_MS + 60;
    schedule(() => {
      setIsVisible(false);
      isRunningRef.current = false;
    }, totalDuration);
  }, [toggleLanguage]);

  useEffect(() => {
    latestRunRef.current = runTransition;
  });

  useEffect(() => {
    const handler = () => latestRunRef.current();
    document.addEventListener('languageToggleRequest', handler);
    return () => {
      document.removeEventListener('languageToggleRequest', handler);
      clearTimers();
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 9998, pointerEvents: 'none' }}
      aria-hidden
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${PIXEL_SIZE}px)`,
          gridAutoRows: `${PIXEL_SIZE}px`,
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        {cells.map((cell, i) => (
          <div
            key={i}
            style={{
              pointerEvents: 'none',
              backgroundColor: cell.color,
              // Start hidden — cannot rely on animation backwards-fill here because
              // pixel-out (declared second) would win the cascade during its own
              // backwards-fill period and show all cells as scale(1) from the start.
              transform: 'scale(0)',
              // Three animations declared upfront — browser sequences them natively.
              // "forwards" on scale animations (no backwards-fill conflict).
              // Glitch uses no fill-mode: it's a burst that starts/ends cleanly.
              animation: [
                `pixel-in ${CELL_IN_MS}ms cubic-bezier(0.22,1,0.36,1) ${cell.inDelay}ms forwards`,
                `pixel-out ${CELL_OUT_MS}ms cubic-bezier(0.4,0,0.8,0.2) ${cell.totalExitDelay}ms forwards`,
                `pixel-glitch ${GLITCH_DURATION_MS}ms steps(6, end) ${cell.glitchDelay}ms`,
              ].join(', '),
            }}
          />
        ))}
      </div>
    </div>
  );
}
