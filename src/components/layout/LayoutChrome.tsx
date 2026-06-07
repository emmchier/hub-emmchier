'use client';

import { ReactNode, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { WorkData } from '@/interfaces';
import { useUIStore } from '@/store/ui/ui-store';
import { Drawer, Footer, Navbar, BottomSheet } from '@/components';
import { InvertedCursor } from '@/components/ui/inverted-cursor/InvertedCursor';
import { LanguageTransitionOverlay } from '@/components/ui/language-transition/LanguageTransitionOverlay';
import { OfflineDetector } from '@/components/ui/offline-detector/OfflineDetector';
import { sessionState } from '@/utils/session-state';

interface LayoutChromeProps {
  navbarCollections: WorkData[];
  children: ReactNode;
}

export function LayoutChrome({
  navbarCollections,
  children,
}: LayoutChromeProps) {
  const pathname = usePathname();
  const closeDrawer = useUIStore((s) => s.closeDrawer);

  useEffect(() => {
    closeDrawer();
    sessionState.resetOnNonProjectVisit(pathname);
  }, [pathname, closeDrawer]);

  const isImageRoute = useMemo(
    () => Boolean(pathname && /\/[^/]+\/image\/[^/]+/.test(pathname)),
    [pathname]
  );
  const hideTopChrome = useMemo(
    () => Boolean(pathname && pathname.includes('/contact')),
    [pathname]
  );

  // Route content: natural height (no flex-1). Footer uses mt-auto inside pageShell.
  const routeContentClass = 'flex w-full flex-col min-h-0';

  // Imagen compartida: chrome mínimo — sin Footer (lightbox embebido).
  if (isImageRoute) {
    return (
      <>
        <OfflineDetector />
        <LanguageTransitionOverlay />
        <InvertedCursor />
        <Drawer />
        <BottomSheet />
        <Navbar queryCollections={navbarCollections} />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </>
    );
  }

  return (
    <>
      <OfflineDetector />
      <LanguageTransitionOverlay />
      <InvertedCursor />
      <Drawer />
      <BottomSheet />
      {!hideTopChrome && <Navbar queryCollections={navbarCollections} />}
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className={routeContentClass}>{children}</div>
        <Footer />
      </div>
    </>
  );
}
