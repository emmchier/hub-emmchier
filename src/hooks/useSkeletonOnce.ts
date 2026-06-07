'use client';

import { useEffect, useState } from 'react';

let skeletonActive = true;
let skeletonTimerStarted = false;
const subscribers = new Set<(active: boolean) => void>();

export const useSkeletonOnce = (durationMs: number = 1500) => {
  const [active, setActive] = useState(skeletonActive);

  useEffect(() => {
    subscribers.add(setActive);

    if (!skeletonTimerStarted) {
      skeletonTimerStarted = true;
      window.setTimeout(() => {
        skeletonActive = false;
        subscribers.forEach((notify) => notify(false));
      }, durationMs);
    }

    return () => {
      subscribers.delete(setActive);
    };
  }, [durationMs]);

  return active;
};
