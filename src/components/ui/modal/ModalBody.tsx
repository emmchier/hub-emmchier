'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useModalStore } from '@/store/ui/ui-store';

const TRANSITION_MS = 300;
const SNAP_BACK_MS = 220;
const DRAG_THRESHOLD_RATIO = 0.25;
const DRAG_CLAMP_RATIO = 0.85;

interface ModalBodyProps {
  embedded?: boolean;
  /** Increments each time the modal opens — triggers image fade-in overlay. */
  animKey?: number;
}

/**
 * Three-slot strip carousel.
 *
 * Layout: [prev | center | next] — each slot is containerWidth wide.
 * Default transform: translateX(-containerWidth) → shows center slot.
 *
 * Navigating "next": animate to translateX(-2*containerWidth),
 * then instantly reset slots and translateX back to -containerWidth.
 * The reset is invisible because slot-1 and slot-2 both show the same
 * image at the same screen position before and after the reset.
 *
 * containerWidth is rounded to the nearest integer pixel to avoid
 * sub-pixel misalignment that can shift the center slot off-center.
 */
export const ModalBody: React.FC<ModalBodyProps> = ({
  embedded = false,
  animKey = 0,
}) => {
  const { images, currentImage, goToNextImage, goToPreviousImage, closeModal } =
    useModalStore();

  const n = images.length;
  const rawIndex = currentImage ? images.indexOf(currentImage) : 0;
  const storeIndex = rawIndex < 0 ? 0 : rawIndex;

  const [centerIndex, setCenterIndex] = useState(storeIndex);
  const [containerWidth, setContainerWidth] = useState(0);
  const [trackX, setTrackX] = useState(0);
  const [animMs, setAnimMs] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackXRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const axisRef = useRef<'x' | 'y' | null>(null);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStoreIndexRef = useRef(storeIndex);
  const isFirstRef = useRef(true);

  const applyTrackX = (x: number) => {
    trackXRef.current = x;
    setTrackX(x);
  };

  // ── Container width ─────────────────────────────────────────────────────────
  // Round to nearest pixel — avoids sub-pixel gap that shifts the center slot.

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setContainerWidth(Math.round(w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── External navigation (button, keyboard, thumbnail) ──────────────────────

  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      prevStoreIndexRef.current = storeIndex;
      setCenterIndex(storeIndex);
      return;
    }
    if (storeIndex === prevStoreIndexRef.current) return;
    if (isDraggingRef.current || isTransitioningRef.current) return;

    const prevIdx = prevStoreIndexRef.current;
    prevStoreIndexRef.current = storeIndex;

    if (containerWidth <= 0) {
      setCenterIndex(storeIndex);
      return;
    }

    const goingNext = (prevIdx + 1) % n === storeIndex;
    const target = goingNext ? -containerWidth : containerWidth;

    isTransitioningRef.current = true;
    setAnimMs(TRANSITION_MS);
    applyTrackX(target);

    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => {
      setCenterIndex(storeIndex);
      setAnimMs(0);
      applyTrackX(0);
      requestAnimationFrame(() => {
        isTransitioningRef.current = false;
      });
      pendingRef.current = null;
    }, TRANSITION_MS);
  }, [storeIndex, containerWidth, n]);

  // ── Reset when a new gallery is opened ─────────────────────────────────────

  useEffect(() => {
    if (isFirstRef.current) return;
    if (pendingRef.current) {
      clearTimeout(pendingRef.current);
      pendingRef.current = null;
    }
    isTransitioningRef.current = false;
    isDraggingRef.current = false;
    prevStoreIndexRef.current = storeIndex;
    setCenterIndex(storeIndex);
    setAnimMs(0);
    applyTrackX(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  useEffect(
    () => () => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
    },
    []
  );

  // ── Drag handlers ───────────────────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (n <= 1 || isTransitioningRef.current) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragStartXRef.current = e.clientX;
      dragStartYRef.current = e.clientY;
      axisRef.current = null;
      isDraggingRef.current = true;
      setAnimMs(0);
    },
    [n]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || containerWidth <= 0) return;
      const dx = e.clientX - dragStartXRef.current;
      const dy = e.clientY - dragStartYRef.current;

      if (!axisRef.current) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          axisRef.current = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        }
        return;
      }
      if (axisRef.current === 'y') return;

      const clamp = containerWidth * DRAG_CLAMP_RATIO;
      applyTrackX(Math.max(-clamp, Math.min(clamp, dx)));
    },
    [containerWidth]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      isDraggingRef.current = false;

      const dy = e.clientY - dragStartYRef.current;

      if (axisRef.current === 'y' && Math.abs(dy) > 50) {
        applyTrackX(0);
        closeModal();
        return;
      }

      const offset = trackXRef.current;
      const threshold = containerWidth * DRAG_THRESHOLD_RATIO;

      const completeSwipe = (toNext: boolean) => {
        const newIdx = toNext
          ? (centerIndex + 1) % n
          : (centerIndex - 1 + n) % n;
        isTransitioningRef.current = true;
        setAnimMs(TRANSITION_MS);
        applyTrackX(toNext ? -containerWidth : containerWidth);
        prevStoreIndexRef.current = newIdx;
        pendingRef.current = setTimeout(() => {
          if (toNext) {
            goToNextImage();
          } else {
            goToPreviousImage();
          }
          setCenterIndex(newIdx);
          setAnimMs(0);
          applyTrackX(0);
          requestAnimationFrame(() => {
            isTransitioningRef.current = false;
          });
          pendingRef.current = null;
        }, TRANSITION_MS);
      };

      if (offset < -threshold) {
        completeSwipe(true);
      } else if (offset > threshold) {
        completeSwipe(false);
      } else {
        setAnimMs(SNAP_BACK_MS);
        applyTrackX(0);
      }
    },
    [
      centerIndex,
      n,
      containerWidth,
      closeModal,
      goToNextImage,
      goToPreviousImage,
    ]
  );

  const handlePointerCancel = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setAnimMs(SNAP_BACK_MS);
    applyTrackX(0);
  }, []);

  // ── Slots ───────────────────────────────────────────────────────────────────

  const prevIdx = (centerIndex - 1 + n) % n;
  const nextIdx = (centerIndex + 1) % n;
  const slots =
    n > 0 ? [images[prevIdx], images[centerIndex], images[nextIdx]] : [];

  const imgCls = embedded
    ? 'object-contain object-center'
    : 'object-contain object-top';

  return (
    <div
      ref={containerRef}
      className={
        embedded
          ? 'absolute inset-0 overflow-hidden touch-none select-none'
          : 'absolute top-0 left-0 right-0 bottom-[200px] w-full overflow-hidden mt-[56px] touch-none select-none md:max-[1265px]:mt-[48px] min-[1266px]:mt-[72px]'
      }
      // translateZ(0) forces GPU compositing layer so overflow:hidden clips correctly
      // on iOS Safari / Chrome with animated children.
      style={{ transform: 'translateZ(0)' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/*
       * ── Three-slot carousel ────────────────────────────────────────────
       *
       * Each slot is explicitly absolute-positioned:
       *   prev  → left: -containerWidth  (off-screen left)
       *   center→ left: 0               (exactly fills the container)
       *   next  → left: +containerWidth  (off-screen right)
       *
       * The wrapper carries only the animation/drag offset via translateX.
       * This guarantees the center slot's left edge is always exactly 0
       * regardless of any sub-pixel discrepancies.
       */}
      {containerWidth > 0 && slots.length > 0 && (
        <div
          className="absolute inset-0"
          style={{
            transform: trackX !== 0 ? `translateX(${trackX}px)` : 'none',
            transition: animMs > 0 ? `transform ${animMs}ms ease-out` : 'none',
          }}
        >
          {slots.map((url, i) => {
            // Use percentage-based positioning so the center slot is ALWAYS
            // exactly at left: 0% regardless of containerWidth measurement.
            // prev=-100%, center=0%, next=100% — relative to the wrapper width
            // which equals containerWidth (wrapper is absolute inset-0).
            const leftPercent = (i - 1) * 100;
            return (
              <div
                key={`slot-${i}`}
                className="absolute top-0 bottom-0"
                style={{ left: `${leftPercent}%`, width: '100%' }}
              >
                {url && (
                  <Image
                    key={url}
                    src={url}
                    alt={i === 1 ? 'Current image' : ''}
                    fill
                    className={imgCls}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
                    draggable={false}
                    loading="eager"
                    priority={i === 1}
                  />
                )}

                {/*
                 * ── Image fade-in overlay (center slot only) ───────────────
                 * An opaque bg-color overlay that fades out on modal open,
                 * revealing the image with a smooth, elegant transition.
                 * Keyed to animKey so it remounts and replays on each open.
                 * Uses `forwards` fill-mode so it stays at opacity:0 after done.
                 */}
                {i === 1 && animKey > 0 && (
                  <div
                    key={`img-reveal-${animKey}`}
                    className="absolute inset-0 bg-primary-background pointer-events-none"
                    aria-hidden="true"
                    style={{
                      zIndex: 5,
                      animation:
                        'modal-overlay-out 550ms cubic-bezier(0.4, 0, 0.2, 1) 80ms forwards',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Fallback while containerWidth is being measured (first paint) ── */}
      {containerWidth <= 0 && currentImage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            <Image
              src={currentImage}
              alt="Current image"
              fill
              className={imgCls}
              sizes="100vw"
              draggable={false}
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
};
