'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '../icon/icons';
import { Text } from '../text/Text';

interface BreadcrumbProps {
  currentPath: string;
  className?: string;
}

export const Breadcrumb = ({ currentPath, className }: BreadcrumbProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Convert path to readable format
  const formatPath = (path: string): string => {
    // Remove leading slash and split by '/'
    const segments = path.replace(/^\//, '').split('/');

    // Take the last segment (current page)
    const lastSegment = segments[segments.length - 1];

    // Convert to readable format
    return lastSegment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const readablePath = formatPath(currentPath);

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-primary-text-hover hover:text-primary-text transition-colors"
      >
        <ArrowLeftIcon />
        <Text
          type="body"
          size="s"
          className="text-primary-text text-base leading-6 !underline"
        >
          Back
        </Text>
      </Link>
      <Text
        type="body"
        size="s"
        className="text-primary-text text-base leading-6"
      >
        /
      </Text>
      <Text
        type="body"
        size="s"
        color="selected"
        className="cursor-default text-base leading-6"
        onClick={isMounted ? () => {} : undefined}
      >
        {readablePath}
      </Text>
    </div>
  );
};
