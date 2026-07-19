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

  // Always flex-1 so Footer `mt-auto` pins to the viewport bottom on short
  // tabs (Languages / Studies). Hub tab switches use history.replaceState, so
  // pathname alone is not a reliable signal for Contact/Resume fill.
  // Classes match Art LayoutChrome contact shell (overflow-x-clip + min-w-0).
  const routeContentClass =
    'flex w-full min-w-0 max-w-full flex-1 flex-col overflow-x-clip min-h-0';

  return (
    <>
      <OfflineDetector />
      <LanguageTransitionOverlay />
      <InvertedCursor />
      <BottomSheet />
      {/* min-h-dvh: independent of body/main quirks — shell is always at least
          one dynamic viewport tall so Footer mt-auto can pin to the bottom. */}
      <div className="flex min-h-dvh w-full min-w-0 max-w-full flex-1 flex-col overflow-x-clip">
        <div className={routeContentClass}>{children}</div>
        <Footer />
      </div>
    </>
  );
}
