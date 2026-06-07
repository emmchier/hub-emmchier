'use client';

import React, {
  ReactNode,
  useState,
  useEffect,
  useRef,
  CSSProperties,
} from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export interface TooltipProps {
  direction?:
    | 'top'
    | 'top-right'
    | 'right'
    | 'bottom-right'
    | 'bottom'
    | 'bottom-left'
    | 'left'
    | 'top-left';
  bg?: string;
  textColor?: string;
  content: ReactNode;
  timer?: number;
  size?: 'm' | 's';
  openBy?: 'click' | 'hover';
  lapse?: number;
  off?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export const Tooltip = ({
  direction = 'top',
  bg = '#000000',
  textColor = '#FFFFFF',
  content = '',
  timer = 5,
  size = 's',
  openBy = 'hover',
  lapse = 0.5,
  off = false,
  className,
  style,
  children,
}: TooltipProps) => {
  const { breakpoint } = useBreakpoint();
  const isDesktop = breakpoint === 'desktop' || breakpoint === 'macbook';
  const isTabletOrBelow =
    breakpoint === 'mobile' ||
    breakpoint === 'tablet' ||
    breakpoint === 'tablet-sm';
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);
  const showTimeout = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (showTimeout.current) clearTimeout(showTimeout.current);
  };

  const handleShowTooltip = () => {
    clearTimers();
    showTimeout.current = setTimeout(() => {
      setIsVisible(true);
    }, lapse * 1000);
  };

  const handleHideTooltip = () => {
    clearTimers();
    setIsVisible(false);
  };

  const handleClick = () => {
    if (isVisible) {
      handleHideTooltip();
    } else {
      handleShowTooltip();
      hideTimeout.current = setTimeout(() => {
        setIsVisible(false);
      }, timer * 1000);
    }
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  // Posición determinística del tooltip
  let tooltipPosition = '';
  if (direction === 'left')
    tooltipPosition =
      'left-0 top-1/2 transform -translate-x-full -translate-y-1/2 -ml-[4px]';
  else if (direction === 'right')
    tooltipPosition =
      'right-0 top-1/2 transform translate-x-full -translate-y-1/2 -mr-[4px]';
  else if (direction === 'top')
    tooltipPosition =
      '-top-1 left-1/2 transform -translate-x-1/2 -translate-y-full -mb-2';
  else if (direction === 'bottom')
    tooltipPosition =
      '-bottom-1 left-1/2 transform -translate-x-1/2 translate-y-full -mt-2';
  else if (direction === 'top-right')
    tooltipPosition = '-top-1 right-0 transform -translate-y-full -mb-2';
  else if (direction === 'bottom-right')
    tooltipPosition = '-bottom-1 right-0 transform translate-y-full -mt-2';
  else if (direction === 'bottom-left')
    tooltipPosition = '-bottom-1 left-0 transform translate-y-full -mt-2';
  else if (direction === 'top-left')
    tooltipPosition = '-top-1 left-0 transform -translate-y-full -mb-2';

  let sizeClasses = '';
  if (size === 'm') sizeClasses = 'p-[12px] text-base';
  else if (size === 's') sizeClasses = 'p-[8px] text-sm';

  const triggerEvents =
    openBy === 'hover'
      ? {
          onMouseEnter: handleShowTooltip,
          onMouseLeave: handleHideTooltip,
        }
      : {
          onClick: handleClick,
        };

  if (off) {
    return <div className="relative inline-block">{children}</div>;
  }

  // Tooltips are desktop-only across the platform.
  if (!isDesktop || isTabletOrBelow) {
    return <>{children}</>;
  }

  return (
    <div className="relative inline-block" {...triggerEvents}>
      <div
        className={[
          'absolute rounded-[4px] font-medium transition-opacity duration-300 z-50',
          tooltipPosition,
          sizeClasses,
          !isVisible ? 'opacity-0 pointer-events-none' : '',
          isVisible ? 'opacity-100 pointer-events-auto' : '',
          className || '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          backgroundColor: bg,
          color: textColor,
          maxWidth: '200px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...style,
        }}
      >
        {content}
      </div>
      {children}
    </div>
  );
};
