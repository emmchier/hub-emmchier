'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDataStore } from '@/store/data/data-store';

export const HomeClient = () => {
  const router = useRouter();
  const { currentCategory, navbarCollections } = useDataStore();

  useEffect(() => {
    if (currentCategory) {
    }
  }, [currentCategory]);

  useEffect(() => {
    if (navbarCollections.length === 0) return;
    const firstCategory = navbarCollections[0];
    const redirectTo = firstCategory?.slug ? `/${firstCategory.slug}` : null;
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [navbarCollections, router]);

  return null;
};
