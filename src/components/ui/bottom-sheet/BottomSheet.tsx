'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Z_INDEX } from '@/constants/z-index';
import { useUIStore } from '@/store/ui/ui-store';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  copyLink,
  shareOnLinkedIn,
  shareOnFacebook,
  shareOnInstagram,
  shareOnThreads,
  shareOnWhatsApp,
  shareOnX,
} from '@/utils/functions';
import { CheckIcon, CloseIcon, Button } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';

interface BottomSheetProps {
  mode?: 'list' | 'share';
  enableSwipe?: boolean;
  showCloseButton?: boolean;
}

const HEADER_PX = 56;
/** Content taller than this fraction of viewport opens sheet at full height */
const CONTENT_FULL_THRESHOLD = 0.5;
const DISMISS_DRAG_THRESHOLD_PX = 96;
const DISMISS_VELOCITY_PX_MS = 0.35;
const EXPAND_VELOCITY_PX_MS = -0.35;
const EXPAND_DRAG_UP_PX = 16;

export const BottomSheet = ({
  mode = 'list',
  enableSwipe = true,
  showCloseButton = true,
}: BottomSheetProps) => {
  const {
    isBottomSheetOpen,
    bottomSheetMode,
    bottomSheetListItems,
    bottomSheetShareData,
    closeBottomSheet,
  } = useUIStore();
  const t = useTranslation();
  const isNarrowViewport = useMediaQuery('(max-width: 1023px)');
  const [isCopied, setIsCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sheetHeightPx, setSheetHeightPx] = useState(0);
  const [dismissTranslatePx, setDismissTranslatePx] = useState(0);
  /** User-settled height: only half (50vh) or full (100vh); drives scroll + snap */
  const [settledSnap, setSettledSnap] = useState<'half' | 'full'>('half');

  const sheetRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentMeasureRef = useRef<HTMLDivElement>(null);

  const [viewportH, setViewportH] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 640
  );
  const [naturalContentPx, setNaturalContentPx] = useState(0);

  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const dragStartDismissRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const liveHeightRef = useRef(0);
  const liveDismissRef = useRef(0);
  const touchLastYRef = useRef(0);
  const dragActiveRef = useRef(false);
  /** After user finishes a drag, keep their half/full until sheet closes */
  const userAdjustedSnapRef = useRef(false);

  const actualMode = mode === 'share' ? 'share' : bottomSheetMode;
  const shouldShowCloseButton = actualMode === 'share' ? true : showCloseButton;
  /** Header drag (expand / dismiss) is always on for mobile bottom sheet. */
  const shouldEnableDrag = enableSwipe !== false;

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      closeBottomSheet();
    }, 300);
  }, [closeBottomSheet]);

  const handleCopyLink = useCallback(async () => {
    if (bottomSheetShareData) {
      await copyLink(bottomSheetShareData.pathname);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
        handleClose();
      }, 2000);
    }
  }, [bottomSheetShareData, handleClose]);

  const shareOptions = useMemo(
    () =>
      bottomSheetShareData
        ? [
            {
              value: 'copy-link',
              label: isCopied ? t.copied : t.copyLink,
              icon: isCopied ? (
                <CheckIcon
                  color="currentColor"
                  size="sm"
                  className="text-green-500"
                />
              ) : undefined,
              onClick: handleCopyLink,
              className: isCopied ? 'text-green-500!' : 'text-white',
            },
            {
              value: 'linkedin',
              label: t.shareOnLinkedIn,
              onClick: () => {
                shareOnLinkedIn(bottomSheetShareData.pathname);
                handleClose();
              },
            },
            {
              value: 'facebook',
              label: t.shareOnFacebook,
              onClick: () => {
                shareOnFacebook(bottomSheetShareData.pathname);
                handleClose();
              },
            },
            {
              value: 'whatsapp',
              label: t.shareOnWhatsapp,
              onClick: () => {
                shareOnWhatsApp(
                  bottomSheetShareData.pathname,
                  bottomSheetShareData.title
                );
                handleClose();
              },
            },
            {
              value: 'instagram',
              label: t.shareOnInstagram,
              onClick: () => {
                shareOnInstagram(
                  bottomSheetShareData.pathname,
                  bottomSheetShareData.title
                );
                handleClose();
              },
            },
            {
              value: 'threads',
              label: t.shareOnThreads,
              onClick: () => {
                shareOnThreads(
                  bottomSheetShareData.pathname,
                  bottomSheetShareData.title
                );
                handleClose();
              },
            },
            {
              value: 'x',
              label: t.shareOnX,
              onClick: () => {
                shareOnX(
                  bottomSheetShareData.pathname,
                  bottomSheetShareData.title
                );
                handleClose();
              },
            },
          ]
        : [],
    [bottomSheetShareData, isCopied, handleCopyLink, handleClose, t]
  );

  const itemsToShow = useMemo(
    () => (actualMode === 'share' ? shareOptions : bottomSheetListItems || []),
    [actualMode, shareOptions, bottomSheetListItems]
  );

  const { minSheetPx, maxSheetPx } = useMemo(() => {
    const minH = viewportH * CONTENT_FULL_THRESHOLD;
    const maxH = viewportH;
    return { minSheetPx: minH, maxSheetPx: maxH };
  }, [viewportH]);

  const contentExceedsHalfViewport =
    naturalContentPx > viewportH * CONTENT_FULL_THRESHOLD;

  useEffect(() => {
    if (isBottomSheetOpen && isNarrowViewport) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
    return undefined;
  }, [isBottomSheetOpen, isNarrowViewport]);

  useEffect(() => {
    if (!isNarrowViewport || !isBottomSheetOpen) {
      document.body.style.overscrollBehavior = '';
      return;
    }

    let touchStartY = 0;
    let isAtTop = false;

    const touchIsOverSheet = (clientX: number, clientY: number) => {
      const sheet = sheetRef.current;
      if (!sheet) return false;
      const node = document.elementFromPoint(clientX, clientY);
      return Boolean(node && sheet.contains(node));
    };

    const preventRefresh = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      if (touchIsOverSheet(t.clientX, t.clientY)) return;

      isAtTop = window.scrollY === 0 || window.pageYOffset === 0;
      if (isAtTop) {
        touchStartY = t.clientY;
      }
    };

    const preventPullToRefresh = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      if (touchIsOverSheet(touch.clientX, touch.clientY)) return;

      if (isAtTop && touch.clientY > touchStartY) {
        e.preventDefault();
      }
    };

    document.body.style.overscrollBehavior = 'none';
    document.addEventListener('touchstart', preventRefresh, { passive: false });
    document.addEventListener('touchmove', preventPullToRefresh, {
      passive: false,
    });

    return () => {
      document.body.style.overscrollBehavior = '';
      document.removeEventListener('touchstart', preventRefresh);
      document.removeEventListener('touchmove', preventPullToRefresh);
    };
  }, [isBottomSheetOpen, isNarrowViewport]);

  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const measureContent = useCallback(() => {
    const el = contentMeasureRef.current;
    if (!el) return;
    const h = el.scrollHeight;
    setNaturalContentPx((prev) => (Math.abs(prev - h) > 0.5 ? h : prev));
  }, []);

  useLayoutEffect(() => {
    if (!isNarrowViewport || !isBottomSheetOpen) return;
    measureContent();
    const el = contentMeasureRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measureContent());
    ro.observe(el);
    return () => ro.disconnect();
  }, [
    isNarrowViewport,
    isBottomSheetOpen,
    measureContent,
    itemsToShow.length,
    isCopied,
    actualMode,
  ]);

  useEffect(() => {
    if (isBottomSheetOpen && isNarrowViewport) {
      userAdjustedSnapRef.current = false;
    }
  }, [isBottomSheetOpen, isNarrowViewport]);

  useLayoutEffect(() => {
    if (!isNarrowViewport || !isBottomSheetOpen || !isVisible) return;
    if (isDragging) return;
    if (itemsToShow.length > 0 && naturalContentPx < 1) return;

    let snap: 'half' | 'full';
    if (userAdjustedSnapRef.current) {
      snap = settledSnap;
    } else {
      snap = contentExceedsHalfViewport ? 'full' : 'half';
      if (snap !== settledSnap) {
        setSettledSnap(snap);
      }
    }

    setSheetHeightPx(snap === 'full' ? maxSheetPx : minSheetPx);
    setDismissTranslatePx(0);
  }, [
    isNarrowViewport,
    isBottomSheetOpen,
    isVisible,
    isDragging,
    settledSnap,
    contentExceedsHalfViewport,
    naturalContentPx,
    itemsToShow.length,
    maxSheetPx,
    minSheetPx,
  ]);

  useEffect(() => {
    if (!isBottomSheetOpen || !isNarrowViewport) {
      userAdjustedSnapRef.current = false;
      setSettledSnap('half');
      setSheetHeightPx(0);
      setDismissTranslatePx(0);
    }
  }, [isBottomSheetOpen, isNarrowViewport]);

  const closeWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      closeBottomSheet();
    }, 300);
  }, [closeBottomSheet]);

  const resolveActiveSheetHeightPx = useCallback(() => {
    if (sheetHeightPx > 0) return sheetHeightPx;
    return settledSnap === 'full' ? maxSheetPx : minSheetPx;
  }, [sheetHeightPx, settledSnap, maxSheetPx, minSheetPx]);

  const isPointerOnDragHandle = useCallback((target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    if (target.closest('[data-sheet-close]')) return false;
    return Boolean(target.closest('[data-sheet-drag-handle]'));
  }, []);

  const applyDragAt = useCallback(
    (clientY: number) => {
      const deltaY = clientY - dragStartYRef.current;
      const startH = dragStartHeightRef.current;
      const maxH = maxSheetPx;

      if (deltaY > 0) {
        liveDismissRef.current = dragStartDismissRef.current + deltaY;
        liveHeightRef.current = startH;
        setDismissTranslatePx(liveDismissRef.current);
        setSheetHeightPx(startH);
        return;
      }

      const nextH = Math.min(maxH, startH - deltaY);
      liveHeightRef.current = nextH;
      liveDismissRef.current = 0;
      setSheetHeightPx(nextH);
      setDismissTranslatePx(0);
    },
    [maxSheetPx]
  );

  const settleDrag = useCallback(() => {
    const ty = liveDismissRef.current;
    const totalDeltaY = touchLastYRef.current - dragStartYRef.current;
    const deltaTime = Date.now() - dragStartTimeRef.current;
    const velocity = deltaTime > 0 ? totalDeltaY / deltaTime : 0;
    const dismissThresholdPx = Math.min(
      DISMISS_DRAG_THRESHOLD_PX,
      viewportH * 0.15
    );

    const startH = dragStartHeightRef.current;
    const startedHalf = Math.abs(startH - minSheetPx) < 2;
    const finalH = liveHeightRef.current;
    const mid = (minSheetPx + maxSheetPx) / 2;

    if (ty > dismissThresholdPx || velocity > DISMISS_VELOCITY_PX_MS) {
      closeWithAnimation();
      setIsDragging(false);
      return;
    }

    setDismissTranslatePx(0);

    let nextSnap: 'half' | 'full';
    if (
      startedHalf &&
      (totalDeltaY < -EXPAND_DRAG_UP_PX || velocity < EXPAND_VELOCITY_PX_MS)
    ) {
      nextSnap = 'full';
    } else if (finalH >= mid) {
      nextSnap = 'full';
    } else {
      nextSnap = 'half';
    }

    userAdjustedSnapRef.current = true;
    setSettledSnap(nextSnap);
    setSheetHeightPx(nextSnap === 'full' ? maxSheetPx : minSheetPx);
    setIsDragging(false);
  }, [closeWithAnimation, minSheetPx, maxSheetPx, viewportH]);

  const beginHeaderDrag = useCallback(
    (clientY: number, pointerId: number) => {
      const startH = resolveActiveSheetHeightPx();
      dragStartYRef.current = clientY;
      dragStartTimeRef.current = Date.now();
      touchLastYRef.current = clientY;
      dragStartHeightRef.current = startH;
      dragStartDismissRef.current = dismissTranslatePx;
      liveHeightRef.current = startH;
      liveDismissRef.current = dismissTranslatePx;
      dragActiveRef.current = true;
      setIsDragging(true);
      headerRef.current?.setPointerCapture(pointerId);
    },
    [resolveActiveSheetHeightPx, dismissTranslatePx]
  );

  const handleHeaderPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!shouldEnableDrag) return;
      if (e.button !== 0) return;
      if (!isPointerOnDragHandle(e.target)) return;

      beginHeaderDrag(e.clientY, e.pointerId);
      e.preventDefault();
    },
    [shouldEnableDrag, isPointerOnDragHandle, beginHeaderDrag]
  );

  const handleHeaderPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!shouldEnableDrag || !dragActiveRef.current) return;
      touchLastYRef.current = e.clientY;
      applyDragAt(e.clientY);
      e.preventDefault();
    },
    [shouldEnableDrag, applyDragAt]
  );

  const endHeaderDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragActiveRef.current) return;
      dragActiveRef.current = false;
      try {
        headerRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* capture may already be released */
      }
      settleDrag();
    },
    [settleDrag]
  );

  const handleHeaderPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragActiveRef.current) return;
      dragActiveRef.current = false;
      try {
        headerRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      settleDrag();
    },
    [settleDrag]
  );

  const handleOverlayClick = () => {
    setIsVisible(false);
    setTimeout(() => {
      closeBottomSheet();
    }, 300);
  };

  const handleSheetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isNarrowViewport || !isBottomSheetOpen) {
    return null;
  }

  const effectiveHeight =
    sheetHeightPx > 0
      ? sheetHeightPx
      : isVisible
        ? settledSnap === 'full'
          ? maxSheetPx
          : minSheetPx
        : minSheetPx;

  const sheet = (
    <>
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex: Z_INDEX.bottomSheetOverlay }}
        onClick={handleOverlayClick}
        aria-hidden={!isVisible}
      />

      <div
        className={`fixed bottom-0 left-0 right-0 flex flex-col overflow-hidden bg-primary-background shadow-2xl ${
          isDragging
            ? ''
            : 'transition-[transform,height] duration-300 ease-out'
        }`}
        style={{
          zIndex: Z_INDEX.bottomSheet,
          height: `${effectiveHeight}px`,
          maxHeight: `${maxSheetPx}px`,
          clipPath:
            'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%, 0 16px)',
          WebkitClipPath:
            'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%, 0 16px)',
          transform: isVisible
            ? `translateY(${dismissTranslatePx}px)`
            : 'translateY(100%)',
        }}
        onClick={handleSheetClick}
        ref={sheetRef}
      >
        <div
          ref={headerRef}
          data-sheet-drag-handle
          className="relative z-10 flex shrink-0 select-none items-center justify-between bg-primary-background px-4 touch-none"
          style={{
            height: HEADER_PX,
            minHeight: HEADER_PX,
            touchAction: 'none',
          }}
          onPointerDown={shouldEnableDrag ? handleHeaderPointerDown : undefined}
          onPointerMove={shouldEnableDrag ? handleHeaderPointerMove : undefined}
          onPointerUp={shouldEnableDrag ? endHeaderDrag : undefined}
          onPointerCancel={
            shouldEnableDrag ? handleHeaderPointerCancel : undefined
          }
        >
          <div
            className="flex min-h-[44px] flex-1 cursor-grab items-center justify-center py-2 active:cursor-grabbing"
            aria-label="Arrastrar para expandir o cerrar"
          >
            <div
              className="h-1 w-12 shrink-0 rounded-full bg-primary-text/30"
              aria-hidden
            />
          </div>
          {shouldShowCloseButton && (
            <div className="absolute right-4" data-sheet-close>
              <Button
                ariaLabel="Close"
                onClick={handleClose}
                onPointerDown={(e) => e.stopPropagation()}
                size="s"
                icon={<CloseIcon className="h-[24px] w-[24px]" />}
                iconButton
                className="border-none!"
              />
            </div>
          )}
        </div>

        <div
          className={[
            'min-h-0 flex-1 overscroll-contain px-4 pb-8',
            settledSnap === 'full' && !isDragging
              ? 'overflow-y-auto'
              : 'overflow-y-hidden',
          ].join(' ')}
        >
          <div ref={contentMeasureRef}>
            {itemsToShow.map((item, index) => (
              <div
                key={item.value}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  if (actualMode === 'list') {
                    handleClose();
                  }
                }}
                className={`flex cursor-pointer items-center justify-between py-4 text-white transition-colors last:border-b-0 active:bg-secondary-background ${item.className || ''}`}
                style={{
                  borderBottom:
                    index < itemsToShow.length - 1
                      ? '1px solid #21516B'
                      : 'none',
                }}
              >
                <span className={`text-white ${item.className || ''}`}>
                  {item.label}
                </span>
                {item.value === 'copy-link' && item.icon && (
                  <span className="ml-4 text-white">{item.icon}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(sheet, document.body);
};
