'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/ui/ui-store';
import { Footer, BottomSheet } from '@/components';
import { InvertedCursor } from '@/components/ui/inverted-cursor/InvertedCursor';
import { LanguageTransitionOverlay } from '@/components/ui/language-transition/LanguageTransitionOverlay';
import { OfflineDetector } from '@/components/ui/offline-detector/OfflineDetector';

interface LayoutChromeProps {
  children: ReactNode;
}

export function LayoutChrome({ children }: LayoutChromeProps) {
  const pathname = usePathname();
  const closeDrawer = useUIStore((s) => s.closeDrawer);

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  return (
    <>
      <OfflineDetector />
      <LanguageTransitionOverlay />
      <InvertedCursor />
      <BottomSheet />
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex w-full flex-col min-h-0">{children}</div>
        <Footer />
      </div>
    </>
  );
}
