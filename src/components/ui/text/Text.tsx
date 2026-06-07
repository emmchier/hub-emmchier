'use client';

import { FCC } from '@/types/types';
import { ReactNode, useEffect, useRef, useState, CSSProperties } from 'react';

interface TextProps {
  type?: 'title' | 'body';
  size?: 's' | 'm' | 'l' | 'xl' | 'xxl';
  heading?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  weight?: 'light' | 'regular' | 'medium' | 'semiBold' | 'bold';
  color?: 'primary' | 'secondary' | 'activated' | 'selected' | string;
  variant?: 'solid' | 'outline';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  onClick?: () => void;
}

export const Text: FCC<TextProps> = ({
  type = 'body',
  heading = 'h2',
  size = 'm',
  color = 'primary',
  weight = 'light',
  variant = 'solid',
  className,
  style,
  onClick,
  children,
}) => {
  const textRef = useRef<HTMLDivElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const truncated =
          textRef.current.scrollWidth > textRef.current.clientWidth;
        setIsTruncated((prev) => (prev === truncated ? prev : truncated));
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);

    return () => {
      window.removeEventListener('resize', checkTruncation);
    };
  }, []);

  // Clases de peso determinísticas
  let weightClasses = '';
  if (type === 'title' && weight === 'light') weightClasses = 'font-light';
  else if (
    (type === 'title' && weight === 'regular') ||
    (type === 'body' && weight === 'regular')
  )
    weightClasses = 'font-normal';
  else if (weight === 'medium') weightClasses = 'font-medium';
  else if (weight === 'semiBold') weightClasses = 'font-semibold';
  else if (weight === 'bold') weightClasses = 'font-bold';

  const baseClasses = 'tracking-custom';

  // Clases de tipo y tamaño determinísticas
  let typeClasses = '';
  if (type === 'title') {
    if (size === 'xxl')
      typeClasses =
        'text-title-mobile-XXL lg:text-title-tablet-XXL xl:text-title-desk-XXL';
    else if (size === 'xl')
      typeClasses =
        'text-title-mobile-XL lg:text-title-tablet-XL xl:text-title-desk-XL';
    else if (size === 'l')
      typeClasses =
        'text-title-mobile-L lg:text-title-tablet-L xl:text-title-desk-L';
    else if (size === 'm')
      typeClasses =
        'text-title-mobile-M lg:text-title-tablet-M xl:text-title-desk-M';
    else if (size === 's')
      typeClasses =
        'text-title-mobile-S lg:text-title-tablet-S xl:text-title-desk-S';
  } else if (type === 'body') {
    if (size === 'l')
      typeClasses =
        'text-body-mobile-L lg:text-body-tablet-L xl:text-body-desk-L';
    else if (size === 'm')
      typeClasses =
        'text-body-mobile-M lg:text-body-tablet-M xl:text-body-desk-M';
    else if (size === 's')
      typeClasses =
        'text-body-mobile-S lg:text-body-tablet-S xl:text-body-desk-S';
  }

  const isCustomColor = color?.startsWith('#') || color?.startsWith('rgb');
  let colorClasses = '';
  if (color === 'primary') colorClasses = '!text-primary-text';
  else if (color === 'secondary') colorClasses = '!text-secondary-text';
  else if (color === 'activated') colorClasses = '!text-activated-text';
  else if (color === 'selected') colorClasses = '!text-selected-text';

  let variantClasses = '';
  if (variant === 'outline') variantClasses = 'text-stroke-outline';
  else if (variant === 'solid') variantClasses = 'text-stroke-solid';

  const Text = type === 'title' ? heading : 'p';

  return (
    <div className="relative">
      {isTruncated && (
        <div
          className={[
            'absolute z-50 max-w-[320px] left-[10px] hidden md:block bg-black text-white p-2 rounded shadow-md transition-all duration-300 ease-out',
            !isHovered ? 'opacity-0 translate-y-0' : '',
            isHovered ? 'opacity-100 translate-y-[-8px]' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ top: '0' }}
        >
          {children}
        </div>
      )}
      <Text
        ref={textRef}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={[
          baseClasses,
          weightClasses,
          typeClasses,
          colorClasses,
          variantClasses,
          className || '',
          onClick ? 'cursor-pointer' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ ...style, ...(isCustomColor ? { color } : {}) }}
      >
        {children}
      </Text>
    </div>
  );
};
