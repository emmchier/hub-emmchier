'use client';

import { useEffect, useRef, useState } from 'react';

const AVATAR_VARIANTS = [
  'acuarela',
  'black',
  'blue',
  'green',
  'moon',
  'outlined',
  'pantera',
  'peach',
  'spectre',
  'yellow',
] as const;

export type BascatAvatarVariant = (typeof AVATAR_VARIANTS)[number];

const DEFAULT_VARIANT: BascatAvatarVariant = 'acuarela';
const STORAGE_KEY = 'bascat-avatar-last';

const pickRandomVariant = (
  exclude: BascatAvatarVariant
): BascatAvatarVariant => {
  const pool = AVATAR_VARIANTS.filter((variant) => variant !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
};

const persistVariant = (variant: BascatAvatarVariant) => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, variant);
  } catch {
    // sessionStorage unavailable (privacy mode, etc.) — the randomization
    // still works within the session, it just won't survive a reload.
  }
};

/** null = no hay valor guardado todavía (primera visita real de la sesión). */
const readLastVariant = (): BascatAvatarVariant | null => {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if ((AVATAR_VARIANTS as readonly string[]).includes(stored ?? '')) {
      return stored as BascatAvatarVariant;
    }
  } catch {
    // ignore
  }
  return null;
};

interface UseBascatAvatarOptions {
  /** true while the Resumé tab is the active one (Bascat is flipped away/hidden). */
  isResumeTabActive: boolean;
  /** true while the avatar zoom modal is open. */
  isAvatarModalOpen: boolean;
}

/**
 * Picks a random Bascat avatar variant, never repeating the previous one,
 * whenever the user: refreshes the site, returns to /contact after
 * navigating away, comes back to Say Hello from Resumé, or closes the avatar
 * zoom modal. The very first visit of the session always shows 'acuarela'.
 */
export const useBascatAvatar = ({
  isResumeTabActive,
  isAvatarModalOpen,
}: UseBascatAvatarOptions): BascatAvatarVariant => {
  const [variant, setVariant] = useState<BascatAvatarVariant>(DEFAULT_VARIANT);

  // First mount of this route — covers hard refresh and remounting after
  // navigating away from /contact and back. A genuinely first-ever visit
  // (nothing stored yet) keeps the 'acuarela' baseline instead of randomizing.
  useEffect(() => {
    const stored = readLastVariant();
    if (stored === null) {
      persistVariant(DEFAULT_VARIANT);
      return;
    }
    const next = pickRandomVariant(stored);
    persistVariant(next);
    setVariant(next);
  }, []);

  // Resumé → Say hello round trip.
  const wasResumeActive = useRef(false);
  useEffect(() => {
    if (wasResumeActive.current && !isResumeTabActive) {
      setVariant((current) => {
        const next = pickRandomVariant(current);
        persistVariant(next);
        return next;
      });
    }
    wasResumeActive.current = isResumeTabActive;
  }, [isResumeTabActive]);

  // Avatar zoom modal closed.
  const wasModalOpen = useRef(false);
  useEffect(() => {
    if (wasModalOpen.current && !isAvatarModalOpen) {
      setVariant((current) => {
        const next = pickRandomVariant(current);
        persistVariant(next);
        return next;
      });
    }
    wasModalOpen.current = isAvatarModalOpen;
  }, [isAvatarModalOpen]);

  return variant;
};
