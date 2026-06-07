'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '@/store/ui/ui-store';

export function OfflineDetector() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const language = useUIStore((s) => s.language);

  useEffect(() => {
    setIsMounted(true);
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isMounted || !isOffline) return null;

  const texts =
    language === 'es'
      ? {
          title: 'Sin conexión.',
          body: 'Revisá tu conexión a internet e intentá de nuevo.',
          hint: 'Reconectando automáticamente…',
        }
      : {
          title: 'No connection.',
          body: 'Check your internet connection and try again.',
          hint: 'Reconnecting automatically…',
        };

  return createPortal(
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-8 bg-primary-background px-6 text-center"
      data-no-inverted-cursor
    >
      {/* Big title — same treatment as 404 */}
      <h2
        className="select-none leading-none tracking-tight text-transparent"
        style={{
          fontFamily: 'Chakra Petch, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(56px, 10vw, 120px)',
          WebkitTextStroke: '3px #13384D',
        }}
      >
        {texts.title}
      </h2>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: 'Chakra Petch, sans-serif',
          fontWeight: 500,
          fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
          color: '#569cc3',
          marginTop: '-16px',
        }}
      >
        {texts.body}
      </p>

      {/* Pulsing dot — reconnecting indicator */}
      <div className="flex items-center gap-2 text-primary-text/50">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-activated-text/60" />
        <span
          style={{
            fontFamily: 'Chakra Petch, sans-serif',
            fontSize: '0.75rem',
            color: '#437B9A',
          }}
        >
          {texts.hint}
        </span>
      </div>
    </div>,
    document.body
  );
}
