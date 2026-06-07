/**
 * Text truncation with tooltip only when the line is actually ellipsized
 * (`scrollWidth > clientWidth`). On mobile, no tooltip.
 *
 * @example
 * ```tsx
 * <TruncatedText
 *   className="text-[40px] leading-[40px]"
 *   isMobile={false}
 * >
 *   {longText}
 * </TruncatedText>
 * ```
 */

'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

/** Tolerance for subpixel / rounding when comparing overflow. */
const TRUNCATION_EPSILON_PX = 1;

function isTextTruncated(el: HTMLElement): boolean {
  return el.scrollWidth > el.clientWidth + TRUNCATION_EPSILON_PX;
}

interface TruncatedTextProps {
  children: string;
  className?: string;
  style?: React.CSSProperties;
  isMobile?: boolean;
  maxWidth?: string | number;
}

export const TruncatedText = ({
  children,
  className,
  style,
  isMobile = false,
  maxWidth = '250px',
}: TruncatedTextProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const textRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (isMobile) return;
    const el = textRef.current;
    if (!el || !isTextTruncated(el)) return;

    const rect = el.getBoundingClientRect();
    setPosition({
      top: rect.top + rect.height / 2,
      left: rect.right + 8,
    });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
  };

  const tooltip =
    isHovered && !isMobile && typeof window !== 'undefined'
      ? createPortal(
          <div
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              transform: 'translateY(-50%)',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              zIndex: 9999,
              pointerEvents: 'none',
              maxWidth: '200px',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {children}
          </div>,
          document.body
        )
      : null;

  const maxWidthValue =
    typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;

  return (
    <>
      <div
        ref={textRef}
        className={className || ''}
        style={{
          width: maxWidthValue,
          maxWidth: maxWidthValue,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
          ...style,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {tooltip}
    </>
  );
};
