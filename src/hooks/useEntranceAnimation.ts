'use client';

import { useEffect, useState } from 'react';
import { useSkeletonOnce } from './useSkeletonOnce';

// Singleton: fires only once per session (initial load)
let entrancePlayed = false;
const entranceSubscribers = new Set<(v: boolean) => void>();

export const useEntranceAnimation = (): boolean => {
  const showSkeleton = useSkeletonOnce();

  // Lazy initializer: reads entrancePlayed synchronously on every mount.
  // On initial load: false (animation pending).
  // On re-mounts after navigation: true immediately, no invisible-letters bug.
  const [active, setActive] = useState(() => entrancePlayed);

  // Keep original effect order — React tracks hooks by order, swapping breaks HMR.
  useEffect(() => {
    if (entrancePlayed) return;
    if (!showSkeleton) {
      entrancePlayed = true;
      setActive(true);
      entranceSubscribers.forEach((fn) => fn(true));
    }
  }, [showSkeleton]);

  useEffect(() => {
    entranceSubscribers.add(setActive);
    return () => {
      entranceSubscribers.delete(setActive);
    };
  }, []);

  return active;
};
