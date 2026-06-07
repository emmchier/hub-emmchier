'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDataStore } from '@/store/data/data-store';
import { useUIStore } from '@/store/ui/ui-store';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import Sidebar from '../sidebar/Sidebar';
import { SideFooter } from '@/components';

/** If visible width ≤ this fraction of drawer width, dismiss (≤50% = half or less still on screen). */
const DISMISS_VISIBLE_FRACTION = 0.5;
const AXIS_LOCK_PX = 8;
/** Same scale as BottomSheet velocityDismiss (px/ms). */
const VELOCITY_DISMISS = 0.35;
/** On full-bleed mobile drawer, any clear left swipe starts close drag (iOS scroll otherwise wins). */
const FULL_BLEED_LEFT_PX = 6;

/** Drawer + overlay stay below Navbar (z-180); Bottom Sheet portals to body at Z_INDEX 500+. */
const DRAWER_OVERLAY_Z = 150;
const DRAWER_PANEL_Z = 151;

export const Drawer = () => {
  const { isDrawerOpen, closeDrawer } = useUIStore();
  const { currentCollection } = useDataStore();
  const isNarrowViewport = useMediaQuery('(max-width: 1265px)');
  const isMobileViewport = useMediaQuery('(max-width: 767px)');

  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [slidePx, setSlidePx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [viewportW, setViewportW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 400
  );

  const drawerWidthPx = isMobileViewport ? viewportW : Math.min(320, viewportW);

  const slidePxRef = useRef(0);
  const dragActiveRef = useRef(false);
  const dragAxisRef = useRef<null | 'h' | 'v'>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startSlideRef = useRef(0);
  const lastXRef = useRef(0);
  const startTimeRef = useRef(0);
  const prevDrawerOpenRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const touchIdRef = useRef<number | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const pointerCaptureActiveRef = useRef(false);
  const drawerWidthRef = useRef(drawerWidthPx);
  const isMobileViewportRef = useRef(isMobileViewport);

  useEffect(() => {
    drawerWidthRef.current = drawerWidthPx;
  }, [drawerWidthPx]);

  useEffect(() => {
    isMobileViewportRef.current = isMobileViewport;
  }, [isMobileViewport]);

  useEffect(() => {
    slidePxRef.current = slidePx;
  }, [slidePx]);

  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isNarrowViewport && isDrawerOpen) closeDrawer();
  }, [isNarrowViewport, isDrawerOpen, closeDrawer]);

  const requestClose = useCallback(() => {
    closeDrawer();
  }, [closeDrawer]);

  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    if (!currentCollection?.items || !isNarrowViewport) {
      if (!isDrawerOpen) {
        setIsMounted(false);
        setIsVisible(false);
        setSlidePx(0);
      }
      prevDrawerOpenRef.current = false;
      return;
    }

    if (isDrawerOpen) {
      if (!prevDrawerOpenRef.current) {
        setIsMounted(true);
        setSlidePx(-drawerWidthPx);
        setIsVisible(false);
        const openTimer = window.setTimeout(() => {
          setIsVisible(true);
          requestAnimationFrame(() => setSlidePx(0));
        }, 10);
        prevDrawerOpenRef.current = true;
        return () => window.clearTimeout(openTimer);
      }
      prevDrawerOpenRef.current = true;
      return;
    }

    if (prevDrawerOpenRef.current) {
      setIsVisible(false);
      setSlidePx(-drawerWidthPx);
      const closeTimer = window.setTimeout(() => {
        setIsMounted(false);
        setSlidePx(0);
      }, 300);
      prevDrawerOpenRef.current = false;
      return () => window.clearTimeout(closeTimer);
    }

    prevDrawerOpenRef.current = false;
    return undefined;
  }, [isDrawerOpen, currentCollection?.items, isNarrowViewport, drawerWidthPx]);

  const handleOverlayClick = () => {
    requestClose();
  };

  const handleDrawerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const endHorizontalDrag = useCallback(() => {
    const currentSlide = slidePxRef.current;
    const w = drawerWidthRef.current;
    const visibleW = w + currentSlide;
    const visibleFraction = w > 0 ? visibleW / w : 1;
    const deltaTime = Date.now() - startTimeRef.current;
    const totalDx = lastXRef.current - startXRef.current;
    const velocity = deltaTime > 0 ? totalDx / deltaTime : 0;

    if (
      visibleFraction <= DISMISS_VISIBLE_FRACTION ||
      velocity < -VELOCITY_DISMISS
    ) {
      requestClose();
    } else {
      setSlidePx(0);
    }
    setIsDragging(false);
  }, [requestClose]);

  const releasePointerCaptureIfHeld = useCallback(() => {
    const nav = navRef.current;
    const pid = pointerIdRef.current;
    if (!pointerCaptureActiveRef.current || !nav || pid == null) return;
    try {
      nav.releasePointerCapture(pid);
    } catch {
      /* ignore */
    }
    pointerCaptureActiveRef.current = false;
  }, []);

  const runDragStep = useCallback(
    (
      clientX: number,
      clientY: number,
      opts: {
        preventDefault: () => void;
        pointerIdForCapture?: number;
      }
    ) => {
      if (!dragActiveRef.current) return;

      const dx = clientX - startXRef.current;
      const dy = clientY - startYRef.current;
      const dw = drawerWidthRef.current;
      const iw = typeof window !== 'undefined' ? window.innerWidth : dw;
      const fullBleed = dw >= iw * 0.88;

      if (dragAxisRef.current === null) {
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);
        const tiny = adx < AXIS_LOCK_PX && ady < AXIS_LOCK_PX;
        if (tiny && !(fullBleed && dx <= -FULL_BLEED_LEFT_PX)) return;

        if (fullBleed && dx <= -FULL_BLEED_LEFT_PX) {
          dragAxisRef.current = 'h';
        } else {
          dragAxisRef.current = adx >= ady ? 'h' : 'v';
        }

        if (dragAxisRef.current === 'v') {
          dragActiveRef.current = false;
          pointerIdRef.current = null;
          touchIdRef.current = null;
          return;
        }

        const nav = navRef.current;
        const pid = opts.pointerIdForCapture;
        if (nav && pid != null) {
          try {
            nav.setPointerCapture(pid);
            pointerCaptureActiveRef.current = true;
          } catch {
            /* ignore */
          }
        }
        setIsDragging(true);
      }

      if (dragAxisRef.current !== 'h') return;

      let next = startSlideRef.current + dx;
      if (next > 0) next = 0;
      if (next < -dw) next = -dw;

      const visibleFraction = dw > 0 ? (dw + next) / dw : 1;
      if (visibleFraction <= DISMISS_VISIBLE_FRACTION) {
        releasePointerCaptureIfHeld();
        slidePxRef.current = -dw;
        setSlidePx(-dw);
        dragActiveRef.current = false;
        dragAxisRef.current = null;
        touchIdRef.current = null;
        pointerIdRef.current = null;
        setIsDragging(false);
        requestCloseRef.current();
        opts.preventDefault();
        return;
      }

      slidePxRef.current = next;
      setSlidePx(next);
      lastXRef.current = clientX;
      opts.preventDefault();
    },
    [releasePointerCaptureIfHeld]
  );

  const handlePointerMoveNative = useCallback(
    (e: PointerEvent) => {
      if (!dragActiveRef.current || e.pointerId !== pointerIdRef.current)
        return;
      runDragStep(e.clientX, e.clientY, {
        preventDefault: () => e.preventDefault(),
        pointerIdForCapture: e.pointerId,
      });
    },
    [runDragStep]
  );

  /** Tablet / mouse: pointer + capture (touch on mobile uses separate listeners). */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !isMounted || isMobileViewport) return;
    const opts = { passive: false, capture: true } as const;
    nav.addEventListener('pointermove', handlePointerMoveNative, opts);
    return () => {
      nav.removeEventListener('pointermove', handlePointerMoveNative, opts);
    };
  }, [isMounted, isMobileViewport, handlePointerMoveNative]);

  /** Mobile (iOS): TouchEvent + passive:false; PointerEvent + pan-y scroll fights the close drag. */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !isMounted || !isMobileViewport) return;

    const findTouch = (list: TouchList, id: number) => {
      for (let i = 0; i < list.length; i++) {
        if (list[i]!.identifier === id) return list[i];
      }
      return undefined;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0]!;
      touchIdRef.current = t.identifier;
      pointerIdRef.current = null;
      startXRef.current = t.clientX;
      startYRef.current = t.clientY;
      lastXRef.current = t.clientX;
      startSlideRef.current = slidePxRef.current;
      startTimeRef.current = Date.now();
      dragAxisRef.current = null;
      dragActiveRef.current = true;
      pointerCaptureActiveRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      const id = touchIdRef.current;
      if (id === null || !dragActiveRef.current) return;
      const t = findTouch(e.touches, id);
      if (!t) return;
      runDragStep(t.clientX, t.clientY, {
        preventDefault: () => e.preventDefault(),
      });
    };

    const onTouchEnd = (e: TouchEvent) => {
      const id = touchIdRef.current;
      if (id === null) return;
      const t = findTouch(e.changedTouches, id);
      if (!t) return;
      touchIdRef.current = null;
      lastXRef.current = t.clientX;

      if (!dragActiveRef.current) return;
      dragActiveRef.current = false;
      const wasHorizontal = dragAxisRef.current === 'h';
      dragAxisRef.current = null;

      if (!wasHorizontal) {
        setIsDragging(false);
        return;
      }

      endHorizontalDrag();
    };

    const onTouchCancel = () => {
      touchIdRef.current = null;
      dragActiveRef.current = false;
      dragAxisRef.current = null;
      setSlidePx(0);
      setIsDragging(false);
    };

    const opts = { capture: true, passive: false } as const;
    nav.addEventListener('touchstart', onTouchStart, opts);
    nav.addEventListener('touchmove', onTouchMove, opts);
    nav.addEventListener('touchend', onTouchEnd, opts);
    nav.addEventListener('touchcancel', onTouchCancel, opts);

    const onPointerMoveMouseOnly = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (!dragActiveRef.current || e.pointerId !== pointerIdRef.current)
        return;
      runDragStep(e.clientX, e.clientY, {
        preventDefault: () => e.preventDefault(),
        pointerIdForCapture: e.pointerId,
      });
    };

    const pOpts = { passive: false, capture: true } as const;
    nav.addEventListener('pointermove', onPointerMoveMouseOnly, pOpts);

    return () => {
      nav.removeEventListener('touchstart', onTouchStart, opts);
      nav.removeEventListener('touchmove', onTouchMove, opts);
      nav.removeEventListener('touchend', onTouchEnd, opts);
      nav.removeEventListener('touchcancel', onTouchCancel, opts);
      nav.removeEventListener('pointermove', onPointerMoveMouseOnly, pOpts);
    };
  }, [isMounted, isMobileViewport, runDragStep, endHorizontalDrag]);

  const onPointerDownCapture = (e: React.PointerEvent<HTMLElement>) => {
    if (isMobileViewportRef.current && e.pointerType === 'touch') {
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerIdRef.current = e.pointerId;
    pointerCaptureActiveRef.current = false;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    lastXRef.current = e.clientX;
    startSlideRef.current = slidePxRef.current;
    startTimeRef.current = Date.now();
    dragAxisRef.current = null;
    dragActiveRef.current = true;
    touchIdRef.current = null;
  };

  const releaseCaptureIfNeeded = (pointerId: number) => {
    const nav = navRef.current;
    if (pointerCaptureActiveRef.current && nav) {
      try {
        nav.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
      pointerCaptureActiveRef.current = false;
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (isMobileViewportRef.current && e.pointerType === 'touch') {
      return;
    }
    if (e.pointerId !== pointerIdRef.current) return;
    releaseCaptureIfNeeded(e.pointerId);
    pointerIdRef.current = null;

    if (!dragActiveRef.current) return;
    dragActiveRef.current = false;
    const wasHorizontal = dragAxisRef.current === 'h';
    dragAxisRef.current = null;

    if (!wasHorizontal) {
      setIsDragging(false);
      return;
    }

    endHorizontalDrag();
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLElement>) => {
    if (isMobileViewportRef.current && e.pointerType === 'touch') {
      return;
    }
    if (e.pointerId !== pointerIdRef.current) return;
    releaseCaptureIfNeeded(e.pointerId);
    pointerIdRef.current = null;
    dragActiveRef.current = false;
    dragAxisRef.current = null;
    setSlidePx(0);
    setIsDragging(false);
  };

  if (!currentCollection?.items) return null;
  if (!isNarrowViewport) return null;
  if (!isMounted) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ zIndex: DRAWER_OVERLAY_Z }}
        onClick={handleOverlayClick}
        aria-hidden
      />

      <nav
        ref={navRef}
        className={`fixed left-0 top-0 flex h-dvh flex-col overflow-hidden bg-primary-background pt-[56px] shadow-2xl md:pt-[48px] ${
          isDragging ? '' : 'transition-[transform] duration-300 ease-out'
        }`}
        style={{
          zIndex: DRAWER_PANEL_Z,
          width: drawerWidthPx,
          transform: `translateX(${slidePx}px)`,
        }}
        onClick={handleDrawerClick}
        onPointerDownCapture={onPointerDownCapture}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={() => {
          const hadOurCapture = pointerCaptureActiveRef.current;
          pointerCaptureActiveRef.current = false;
          pointerIdRef.current = null;
          if (!hadOurCapture) return;
          dragActiveRef.current = false;
          dragAxisRef.current = null;
          endHorizontalDrag();
        }}
        role="navigation"
        aria-label="Site menu"
      >
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          style={{ touchAction: 'pan-y' }}
        >
          <Sidebar collection={currentCollection} isMobile />
        </div>

        <div
          className="z-50 flex w-full shrink-0 justify-start border-t border-indigo-100 bg-[#112F40] px-4 py-[8px] text-left"
          style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}
        >
          <div className="min-w-0 max-w-full overflow-hidden">
            <SideFooter />
          </div>
        </div>
      </nav>
    </>
  );
};
