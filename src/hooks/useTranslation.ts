'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/ui/ui-store';
import { translations } from '@/i18n/translations';
import type { Translations } from '@/i18n/translations';

/**
 * SSR-safe translation hook.
 *
 * Zustand initialises `language` synchronously from localStorage on the
 * client, so the first client render can already have 'es' while the server
 * always renders with 'en' (localStorage is unavailable in SSR).
 * This mismatch causes React hydration errors.
 *
 * Fix: always return the 'en' translations on the first paint (matching the
 * server output), then switch to the real stored language after mount. The
 * switch happens in a useEffect so it never runs during SSR / hydration.
 */
export const useTranslation = (): Translations => {
  const language = useUIStore((s) => s.language);
  // Initial value matches SSR output — avoids hydration mismatch.
  const [clientLang, setClientLang] = useState<'en' | 'es'>('en');

  useEffect(() => {
    setClientLang(language);
  }, [language]);

  return translations[clientLang];
};
