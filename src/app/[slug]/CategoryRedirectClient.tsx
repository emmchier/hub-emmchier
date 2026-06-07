'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDataStore } from '@/store/data/data-store';
import { slugify } from '@/utils/functions';
import { ContentfulCategory } from '@/interfaces';
import { useUIStore } from '@/store/ui/ui-store';
import { CONTENTFUL_LOCALE } from '@/i18n/translations';

type ContentfulEntry = {
  fields?: {
    title?: string;
    name?: string;
    slug?: string;
    items?: unknown[];
    [key: string]: unknown;
  };
};

const getCategorySlug = (category: ContentfulCategory): string => {
  return category?.fields?.slug ?? category?.slug ?? '';
};

const getProjectsTree = (category: ContentfulCategory): ContentfulEntry[] => {
  const tree =
    (Array.isArray(category?.fields?.projectsTree)
      ? category.fields.projectsTree
      : null) ??
    (Array.isArray(category?.projectsTree) ? category.projectsTree : null) ??
    [];
  return tree.filter(
    (item): item is ContentfulEntry => typeof item === 'object' && item !== null
  ) as ContentfulEntry[];
};

interface CategoryRedirectClientProps {
  categorySlug: string;
}

const getEntrySlug = (entry?: ContentfulEntry) => {
  const title = entry?.fields?.title || entry?.fields?.name || '';
  const slug = entry?.fields?.slug || (title ? slugify(title) : '');
  return slug;
};

export default function CategoryRedirectClient({
  categorySlug,
}: CategoryRedirectClientProps) {
  const router = useRouter();
  const language = useUIStore((s) => s.language);
  const {
    categories,
    currentCategory,
    getCategoryForLang,
    setCategoryForLang,
    setCurrentCategory,
    setFetchingCategory,
    isCategoryFetching,
  } = useDataStore();

  useEffect(() => {
    const ensureCategory = async () => {
      // Locale cache hit — instant, no network call.
      const cached = getCategoryForLang(language, categorySlug);
      if (cached) {
        if (cached !== currentCategory) setCurrentCategory(cached);
        return;
      }

      const fetchKey = `${language}:${categorySlug}`;
      if (isCategoryFetching(fetchKey)) return;

      try {
        setFetchingCategory(fetchKey, true);
        const locale = CONTENTFUL_LOCALE[language];
        const response = await fetch(
          `/api/contentful/category/${categorySlug}?locale=${locale}`
        );
        const data = await response.json();
        if (data?.item) {
          setCategoryForLang(language, categorySlug, data.item); // caches + updates categories
          setCurrentCategory(data.item);
        }
      } catch {
        // ignore
      } finally {
        setFetchingCategory(fetchKey, false);
      }
    };

    ensureCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    categorySlug,
    categories,
    language,
    getCategoryForLang,
    setCategoryForLang,
    setCurrentCategory,
    setFetchingCategory,
    isCategoryFetching,
  ]);

  useEffect(() => {
    if (!currentCategory) return;
    const currentSlug = getCategorySlug(currentCategory);
    if (currentSlug !== categorySlug) return;

    const projectsTree = getProjectsTree(currentCategory);

    if (projectsTree.length === 0) return;

    const firstItem = projectsTree[0];
    if (!firstItem) return;
    const firstSlug = getEntrySlug(firstItem);
    const nestedItems = (firstItem?.fields?.items as ContentfulEntry[]) || [];

    if (Array.isArray(nestedItems) && nestedItems.length > 0) {
      const firstNested = nestedItems[0];
      if (firstNested) {
        const firstNestedSlug = getEntrySlug(firstNested);
        if (firstSlug && firstNestedSlug) {
          router.replace(`/${categorySlug}/${firstSlug}/${firstNestedSlug}`);
        }
      }
      return;
    }

    if (firstSlug) {
      router.replace(`/${categorySlug}/${firstSlug}`);
    }
  }, [categorySlug, currentCategory, router]);

  return null;
}
