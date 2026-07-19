'use client';

import React, {
  ReactElement,
  ReactNode,
  CSSProperties,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useId,
} from 'react';
import { TabItemProps } from './TabItem';
import { Button } from '../button/Button';
import { Skeleton } from '@/components';
import { useUIStore } from '@/store/ui/ui-store';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useSkeletonOnce } from '@/hooks/useSkeletonOnce';
import { useEntranceAnimation } from '@/hooks/useEntranceAnimation';

interface TabProps {
  children: ReactNode | ReactNode[];
  sideContent?: ReactNode;
  className?: string;
  headerClasses?: string;
  bodyClasses?: string;
  style?: CSSProperties;
  defaultActiveIndex?: number;
  onTabChange?: (index: number) => void;
  mobileBodyMarginTop?: string;
  mobileIndicatorBottomClass?: string;
  desktopBodyMarginTop?: string;
  headerSkeleton?: ReactNode;
  showSkeletonOverride?: boolean;
  /**
   * `/contact` only: when the viewport is mobile (`useBreakpoint`), pin Say hello / Resumé
   * against the right edge. Tablet/desktop tab rows are unchanged.
   */
  contactMobileTabsRight?: boolean;
  /** Clases extra en la fila de tabs (p. ej. `invisible pointer-events-none`). */
  tabListRowExtraClassName?: string;
  /** Si está definido, el cuerpo muestra siempre ese panel aunque el tab “activo” sea otro. */
  lockedBodyTabIndex?: number;
  bodyStyle?: React.CSSProperties;
  /**
   * Mobile only: skip scroll-down header/body collapse.
   * Use on Resumé so inner `position: sticky` headers are not clipped
   * (transform on the tab body breaks sticky + leaves a footer gap).
   */
  suppressMobileScrollCollapse?: boolean;
}

export const Tab: React.FC<TabProps> = ({
  children,
  sideContent,
  className,
  headerClasses,
  bodyClasses,
  style,
  defaultActiveIndex = 0,
  onTabChange,
  mobileBodyMarginTop = '24px',
  mobileIndicatorBottomClass = 'bottom-0',
  desktopBodyMarginTop,
  headerSkeleton,
  showSkeletonOverride,
  contactMobileTabsRight = false,
  tabListRowExtraClassName,
  lockedBodyTabIndex,
  bodyStyle,
  suppressMobileScrollCollapse = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);
  const uid = useId();
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabItems = React.Children.toArray(
    children
  ) as ReactElement<TabItemProps>[];
  const { breakpoint } = useBreakpoint();
  const scrollDirection = useScrollDirection();
  const isMobile = breakpoint === 'mobile';
  const contactMobileFlushTabs = Boolean(contactMobileTabsRight && isMobile);
  const mobileScrollCollapseEnabled = isMobile && !suppressMobileScrollCollapse;
  const tabListRowClassName = contactMobileTabsRight
    ? [
        'flex items-center w-full bg-[#112F40] px-0',
        contactMobileFlushTabs ? 'justify-end' : 'justify-start md:justify-end',
      ].join(' ')
    : 'flex items-center w-full justify-start px-[16px] md:justify-end md:px-0 md:pl-0 md:pr-[16px] bg-[#112F40]';

  // Calcular si el header está en top-0 (scrolleado) o top-[56px] (no scrolleado)
  // Memoizar para evitar recálculos innecesarios en cada render
  const isHeaderAtTop = useMemo(() => {
    return Boolean(mobileScrollCollapseEnabled && scrollDirection === 'down');
  }, [mobileScrollCollapseEnabled, scrollDirection]);

  // Determinar si el header está en top-0 basado en las clases pasadas
  // Si headerClasses incluye 'top-0', entonces no debemos aplicar translate-y
  const isHeaderAtTopPosition = useMemo(() => {
    if (!isMobile) return false;
    return headerClasses?.includes('top-0') ?? false;
  }, [isMobile, headerClasses]);

  useEffect(() => {
    if (lockedBodyTabIndex !== undefined) {
      setActiveIndex(lockedBodyTabIndex);
      return;
    }
    setActiveIndex(defaultActiveIndex);
  }, [defaultActiveIndex, lockedBodyTabIndex]);

  const containerRef = useRef<HTMLUListElement>(null);
  /** Tight wrapper around tab labels + indicator — positioning is relative to this, not full row width */
  const trackRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const sideContentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const { setTabHeaderHeight } = useUIStore();
  const [hasMeasuredHeight, setHasMeasuredHeight] = useState(false);
  const showSkeletonOnce = useSkeletonOnce();
  const showSkeleton = showSkeletonOverride ?? showSkeletonOnce;
  const animateTabs = useEntranceAnimation();

  useEffect(() => {
    if (!sideContentRef.current) {
      setHasMeasuredHeight(true);
      return;
    }
    if (typeof ResizeObserver === 'undefined') {
      setHasMeasuredHeight(true);
      return;
    }

    const observer = new ResizeObserver(() => {
      const h = headerRef.current?.getBoundingClientRect().height ?? 0;
      setTabHeaderHeight(h);
      setHasMeasuredHeight(true);
    });

    observer.observe(sideContentRef.current);

    return () => observer.disconnect();
  }, [setTabHeaderHeight]);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      if (lockedBodyTabIndex !== undefined) return;
      const listEl = containerRef.current;
      const track = trackRef.current;
      const indicator = indicatorRef.current;
      if (!listEl || !track || !indicator) return;

      const listItems = Array.from(
        listEl.querySelectorAll(':scope > li')
      ) as HTMLElement[];
      const activeItem = listItems[activeIndex];
      if (!activeItem) return;

      const trackRect = track.getBoundingClientRect();
      const activeRect = activeItem.getBoundingClientRect();
      const left = activeRect.left - trackRect.left + track.scrollLeft;
      indicator.style.left = `${left}px`;
      indicator.style.width = `${activeRect.width}px`;
    };

    const scheduleUpdate = () => {
      requestAnimationFrame(updateIndicator);
    };

    updateIndicator();

    window.addEventListener('resize', updateIndicator);

    let resizeObserver: ResizeObserver | undefined;
    const trackEl = trackRef.current;
    const listElForRo = containerRef.current;
    if (typeof ResizeObserver !== 'undefined' && trackEl && listElForRo) {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(trackEl);
      resizeObserver.observe(listElForRo);
    }

    return () => {
      window.removeEventListener('resize', updateIndicator);
      resizeObserver?.disconnect();
    };
  }, [activeIndex, showSkeleton, lockedBodyTabIndex]);

  const handleTabChange = (index: number, moveFocus = false) => {
    setActiveIndex(index);
    if (onTabChange) {
      onTabChange(index);
    }
    if (moveFocus) {
      tabButtonRefs.current[index]?.focus();
    }
  };

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (lockedBodyTabIndex !== undefined) return;
    const count = tabItems.length;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleTabChange((index + 1) % count, true);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      handleTabChange((index - 1 + count) % count, true);
    } else if (e.key === 'Home') {
      e.preventDefault();
      handleTabChange(0, true);
    } else if (e.key === 'End') {
      e.preventDefault();
      handleTabChange(count - 1, true);
    }
  };

  return (
    <div className={className} style={style}>
      {/* Header */}
      <div
        ref={headerRef}
        className={[
          headerClasses || '',
          'relative',
          showSkeleton ? 'static! top-auto! translate-y-0!' : '',
          isMobile
            ? `transition-transform duration-300 ease-out ${
                isHeaderAtTop && !isHeaderAtTopPosition
                  ? '-translate-y-[56px]'
                  : 'translate-y-0'
              }`
            : 'transition-transform duration-200 ease-[cubic-bezier(0.25, 0.8, 0.25, 1)] translate-y-0',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Skeleton overlay — siempre montado, fade-out 500ms al terminar */}
        <div
          className="absolute inset-0 z-40 pointer-events-none bg-primary-background"
          aria-hidden="true"
          style={{
            opacity: showSkeleton ? 1 : 0,
            transition: showSkeleton ? 'none' : 'opacity 500ms ease-out',
          }}
        >
          {headerSkeleton ? (
            headerSkeleton
          ) : (
            <div className="relative w-full h-full px-[16px] md:px-[8px] pt-[24px] md:pt-0 flex flex-col md:flex-row md:items-center md:justify-between gap-[8px] md:gap-[16px]">
              {sideContent && (
                <div className="pt-0 pb-[8px] md:pt-[8px] md:pb-[8px]">
                  <Skeleton className="h-[32px] w-[150px]" />
                </div>
              )}
              <div className="flex items-center gap-[16px] md:ml-auto justify-start md:justify-end w-full md:w-auto">
                {tabItems.map((_, index) => (
                  <Skeleton
                    key={`tab-skeleton-${index}`}
                    className="h-[32px] w-[100px]"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        {sideContent && (
          <div
            ref={sideContentRef}
            className="w-full transition-all duration-200 top-0 z-30 bg-primary-background m-0"
          >
            {sideContent}
          </div>
        )}

        <div
          className={[tabListRowClassName, tabListRowExtraClassName ?? '']
            .filter(Boolean)
            .join(' ')}
        >
          <div
            ref={trackRef}
            className={[
              'relative w-max max-w-full min-w-0',
              contactMobileFlushTabs ? 'shrink-0' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <ul
              ref={containerRef}
              role="tablist"
              aria-label="Content tabs"
              className="relative m-0 flex list-none flex-nowrap gap-4 p-0 md:gap-[16px]"
            >
              {tabItems.map((child, index) => {
                const isActive = activeIndex === index;

                return (
                  <li
                    key={`text-${index}`}
                    role="presentation"
                    ref={(el) => {
                      tabButtonRefs.current[index] =
                        el?.querySelector('button') ?? null;
                    }}
                    className="shrink-0"
                    style={
                      animateTabs
                        ? {
                            animation:
                              'entrance-fade-up 440ms cubic-bezier(0.16, 1, 0.3, 1) both',
                            animationDelay: `${100 + index * 70}ms`,
                          }
                        : undefined
                    }
                  >
                    <Button
                      ariaLabel={child.props.label}
                      role="tab"
                      size="s"
                      state={isActive ? 'selected' : 'enabled'}
                      noPadding={true}
                      tabIndex={0}
                      onClick={
                        isActive ? undefined : () => handleTabChange(index)
                      }
                      onKeyDown={(e) => handleTabKeyDown(e, index)}
                      className={[
                        isActive ? 'cursor-default pointer-events-none' : '',
                        'relative flex h-[48px] w-auto items-center justify-center px-0',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span className="inline-flex items-center text-center px-0">
                        {child.props.icon && (
                          <span className="mr-2 inline-flex">
                            {child.props.icon}
                          </span>
                        )}
                        {child.props.label}
                        {child.props.count !== undefined && (
                          <span className="text-xs -translate-y-0.5 opacity-70">
                            ({child.props.count})
                          </span>
                        )}
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
            <div
              ref={indicatorRef}
              aria-hidden
              className={`pointer-events-none absolute ${isMobile ? mobileIndicatorBottomClass : 'bottom-0'} left-0 h-[2px] bg-selected-text transition-[left,width] duration-200 ease-in-out ${
                showSkeleton ? 'opacity-0' : 'opacity-100'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      {hasMeasuredHeight && (
        <div
          role="tabpanel"
          id={`${uid}-panel-${lockedBodyTabIndex ?? activeIndex}`}
          aria-labelledby={`${uid}-tab-${lockedBodyTabIndex ?? activeIndex}`}
          className={['w-full', bodyClasses ? bodyClasses : 'overflow-visible']
            .filter(Boolean)
            .join(' ')}
          style={{
            ...bodyStyle,
            marginTop: isMobile
              ? showSkeleton
                ? '0px'
                : mobileBodyMarginTop
              : desktopBodyMarginTop,
            transform: isMobile
              ? isHeaderAtTop
                ? 'translateY(-56px)'
                : 'translateY(0)'
              : undefined,
            transition: isMobile ? 'transform 300ms ease-out' : undefined,
          }}
        >
          {
            tabItems[
              Math.max(
                0,
                Math.min(
                  lockedBodyTabIndex ?? activeIndex,
                  Math.max(tabItems.length - 1, 0)
                )
              )
            ]
          }
        </div>
      )}
    </div>
  );
};
