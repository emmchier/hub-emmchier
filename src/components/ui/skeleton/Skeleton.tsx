'use client';

import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton = ({ className = '', ...props }: SkeletonProps) => {
  return (
    <div
      className={`skeleton-pulse rounded-[4px] ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
};
