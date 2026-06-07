'use client';

import { useEffect } from 'react';
import { useDataStore } from '@/store/data/data-store';

interface CategoryManagerProps {
  currentCategory: Record<string, unknown> | null;
}

export const CategoryManager = ({ currentCategory }: CategoryManagerProps) => {
  const {
    setCategoryForLang,
    setCurrentCategory,
    currentCategory: storedCategory,
  } = useDataStore();

  useEffect(() => {
    if (!currentCategory) return;
    const incomingFields = (
      currentCategory as { fields?: Record<string, unknown> }
    )?.fields;
    const storedFields = (
      storedCategory as { fields?: Record<string, unknown> }
    )?.fields;
    const incomingHasImages = Array.isArray(incomingFields?.images);
    const storedHasImages = Array.isArray(storedFields?.images);
    if (storedHasImages && !incomingHasImages) return;

    // SSR data is always in en-US. Seed the locale cache so subsequent
    // language switches for this slug never need a Contentful call.
    const slug =
      typeof incomingFields?.slug === 'string' ? incomingFields.slug : '';
    if (slug) {
      setCategoryForLang('en', slug, currentCategory); // also upserts categories[]
    }
    setCurrentCategory(currentCategory);
  }, [currentCategory, storedCategory, setCategoryForLang, setCurrentCategory]);

  return null;
};
