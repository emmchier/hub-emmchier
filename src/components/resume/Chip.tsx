'use client';

import { ReactNode } from 'react';

interface ChipProps {
  children: ReactNode;
  className?: string;
}

export const Chip = ({ children, className }: ChipProps) => {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 text-body-mobile-S lg:text-body-tablet-S xl:text-body-desk-S font-medium',
        'bg-[#1C4C67] text-[#569CC3]',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </span>
  );
};
