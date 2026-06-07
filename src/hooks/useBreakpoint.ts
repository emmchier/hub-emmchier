'use client';

import { useEffect, useState } from 'react';

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('macbook');
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = breakpoint !== 'desktop' && breakpoint !== 'macbook';

  useEffect(() => {
    setIsMounted(true);

    const updateBreakpoint = () => {
      if (window.matchMedia('(min-width: 1700px)').matches) {
        setBreakpoint('desktop');
      } else if (window.matchMedia('(min-width: 1199px)').matches) {
        setBreakpoint('macbook');
      } else if (window.matchMedia('(min-width: 991px)').matches) {
        setBreakpoint('tablet');
      } else if (window.matchMedia('(min-width: 768px)').matches) {
        setBreakpoint('tablet-sm');
      } else {
        setBreakpoint('mobile');
      }
    };

    window.addEventListener('resize', updateBreakpoint);
    updateBreakpoint();

    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint: isMounted ? breakpoint : 'macbook',
    isMobile: isMounted ? isMobile : false,
  };
};
