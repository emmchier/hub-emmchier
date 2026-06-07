'use client';

import { ReactNode, useState, CSSProperties } from 'react';
import { CloseIcon } from '@/components';

interface BadgeProps {
  isRounded?: boolean;
  children: ReactNode;
  state?: 'info' | 'success' | 'warning' | 'error' | 'neutral';
  icon?: ReactNode;
  closeButton?: boolean;
  size?: 's' | 'm' | 'l';
  className?: string;
  style?: CSSProperties;
}

export const Badge = ({
  isRounded = false,
  children,
  state = 'neutral',
  icon,
  closeButton = false,
  size = 'm',
  className,
  style,
}: BadgeProps) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const stateStyles = {
    info: {
      background: 'bg-[#E0F7FF]',
      borderColor: 'border-[#B3E5FC]',
      textColor: 'text-[#007BFF]',
    },
    success: {
      background: 'bg-[#E6F9E9]',
      borderColor: 'border-[#C8E6C9]',
      textColor: 'text-[#2E7D32]',
    },
    warning: {
      background: 'bg-[#FFF3E0]',
      borderColor: 'border-[#FFE0B2]',
      textColor: 'text-[#F57C00]',
    },
    error: {
      background: 'bg-[#FFEBEE]',
      borderColor: 'border-[#FFCDD2]',
      textColor: 'text-[#D32F2F]',
    },
    neutral: {
      background: 'bg-secondary-background',
      borderColor: 'border-primary-border',
      textColor: 'text-primary-text',
    },
  };

  const { background, borderColor, textColor } = stateStyles[state];

  const sizeStyles = {
    s: {
      height: 'h-[32px]',
      paddingLeft: 'pl-[8px]',
      paddingRight: closeButton === true ? 'pr-[2px]' : 'pr-[8px]',
      fontSize: 'text-[16px]',
      iconClose: '24px',
    },
    m: {
      height: 'h-[44px]',
      paddingLeft: 'pl-[12px]',
      paddingRight: closeButton === true ? 'pr-[6px]' : 'pr-[12px]',
      fontSize: 'text-[20px]',
      iconClose: '32px',
    },
    l: {
      height: 'h-[56px]',
      paddingLeft: 'pl-[16px]',
      paddingRight: closeButton === true ? 'pr-[12px]' : 'pr-[16px]',
      fontSize: 'text-[24px]',
      iconClose: '32px',
    },
  };

  const { height, paddingLeft, paddingRight, fontSize, iconClose } =
    sizeStyles[size];

  return (
    <div
      className={`inline-flex items-center justify-center ${height} ${paddingLeft} ${paddingRight} border ${background} ${borderColor} ${textColor} ${
        isRounded ? 'rounded-full' : ''
      } ${className ?? ''}`}
      style={{
        borderRadius: isRounded ? '100px' : '0',
        ...style,
      }}
    >
      {icon && <div className="mr-2">{icon}</div>}
      <span className={`font-medium ${textColor} ${fontSize}`}>{children}</span>
      {closeButton && (
        <button
          onClick={() => setVisible(false)}
          className="ml-4 text-inherit focus:outline-none"
          aria-label="close"
        >
          <CloseIcon
            className={
              iconClose === '24px' ? 'h-[24px] w-[24px]' : 'h-[32px] w-[32px]'
            }
          />
        </button>
      )}
    </div>
  );
};
