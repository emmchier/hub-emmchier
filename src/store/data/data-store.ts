import { create } from 'zustand';
import {
  WorkData,
  WorkItem,
  ContentfulCategory,
  ResumeData,
  ResumeJson,
  SocialNetworkItem,
} from '@/interfaces';
import type { SupportedLanguage } from '@/i18n/translations';

interface State {
  collections: WorkData[];
  setCollection: (collection: WorkData) => void;

  navbarCollections: WorkData[];
  setNavbarCollections: (collections: WorkData[]) => void;

  /** Locale-aware navbar cache. Populated once per language, never cleared. */
  navbarByLang: Partial<Record<SupportedLanguage, WorkData[]>>;
  setNavbarForLang: (lang: SupportedLanguage, items: WorkData[]) => void;
  getNavbarForLang: (lang: SupportedLanguage) => WorkData[] | undefined;

  categories: ContentfulCategory[];
  setCategory: (category: ContentfulCategory) => void;
  setCategories: (categories: ContentfulCategory[]) => void;

  /**
   * Locale-aware category cache. Key: `${lang}:${slug}`.
   * Populated once per locale/slug pair, never cleared.
   */
  categoriesByLang: Record<string, ContentfulCategory>;
  setCategoryForLang: (
    lang: SupportedLanguage,
    slug: string,
    category: ContentfulCategory
  ) => void;
  getCategoryForLang: (
    lang: SupportedLanguage,
    slug: string
  ) => ContentfulCategory | undefined;

  currentCategory: ContentfulCategory | null;
  setCurrentCategory: (category: ContentfulCategory | null) => void;
  currentItem: WorkItem;
  setCurrentItem: (item: WorkItem) => void;
  currentCollection: WorkData;
  setCurrentCollection: (item: WorkData) => void;
  fetchingCategories: Set<string>;
  setFetchingCategory: (key: string, isFetching: boolean) => void;
  isCategoryFetching: (key: string) => boolean;

  // ─── Resume (emmchier space) ──────────────────────────────────────────────
  /**
   * Locale-aware resume cache. Key = 'en' | 'es'.
   * Populated once per language, never cleared within the session.
   */
  resumeByLang: Partial<Record<SupportedLanguage, ResumeData>>;
  setResumeForLang: (lang: SupportedLanguage, data: ResumeData) => void;
  /**
   * True once English resume data has been seeded.
   * Prevents the SSR→client bridge from re-seeding on SPA navigation.
   */
  isResumeFetched: boolean;
  setResumeFetched: (fetched: boolean) => void;

  /** ATS JSON model per language — built from ResumeData when each locale is loaded. */
  resumeJsonByLang: Partial<Record<SupportedLanguage, ResumeJson>>;
  setResumeJsonForLang: (lang: SupportedLanguage, json: ResumeJson) => void;

  // ─── Social networks (Contact / Say Hello) ────────────────────────────────
  socialNetworks: SocialNetworkItem[];
  setSocialNetworks: (items: SocialNetworkItem[]) => void;
  isSocialNetworksFetched: boolean;
  setSocialNetworksFetched: (fetched: boolean) => void;
}

const getCategorySlug = (category: ContentfulCategory): string => {
  return category?.fields?.slug ?? category?.slug ?? '';
};

export const useDataStore = create<State>((set, get) => ({
  collections: [],
  navbarCollections: [],
  navbarByLang: {},
  categories: [],
  categoriesByLang: {},
  currentCategory: null,
  currentItem: {} as WorkItem,
  currentCollection: {} as WorkData,
  fetchingCategories: new Set<string>(),
  resumeByLang: {},
  isResumeFetched: false,
  resumeJsonByLang: {},
  socialNetworks: [],
  isSocialNetworksFetched: false,

  // ─── fetchingCategories ───────────────────────────────────────────────────
  setFetchingCategory: (key, isFetching) =>
    set((state) => {
      const newSet = new Set(state.fetchingCategories);
      if (isFetching) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return { fetchingCategories: newSet };
    }),
  isCategoryFetching: (key) => get().fetchingCategories.has(key),

  // ─── collections ─────────────────────────────────────────────────────────
  setCollection: (collection) =>
    set((state) => {
      const exists = state.collections.some((c) => c.slug === collection.slug);
      if (!exists) return { collections: [...state.collections, collection] };
      return state;
    }),

  // ─── navbarCollections ────────────────────────────────────────────────────
  setNavbarCollections: (collections) =>
    set((state) => {
      if (!Array.isArray(collections) || collections.length === 0) return state;
      return { navbarCollections: collections };
    }),

  // ─── navbarByLang ─────────────────────────────────────────────────────────
  setNavbarForLang: (lang, items) =>
    set((state) => ({
      navbarByLang: { ...state.navbarByLang, [lang]: items },
      // Also update the active navbar view
      navbarCollections: items.length > 0 ? items : state.navbarCollections,
    })),
  getNavbarForLang: (lang) => get().navbarByLang[lang],

  // ─── categories ──────────────────────────────────────────────────────────
  setCategory: (category) =>
    set((state) => {
      const slug = getCategorySlug(category);
      if (!slug) return state;
      const filtered = state.categories.filter(
        (item) => getCategorySlug(item) !== slug
      );
      return { categories: [...filtered, category] };
    }),
  setCategories: (categories) =>
    set((state) => {
      if (!Array.isArray(categories)) return state;
      const merged = [...state.categories];
      categories.forEach((category) => {
        const slug = getCategorySlug(category);
        if (!slug) return;
        const filtered = merged.filter(
          (item) => getCategorySlug(item) !== slug
        );
        filtered.push(category);
        merged.splice(0, merged.length, ...filtered);
      });
      return { categories: merged };
    }),

  // ─── categoriesByLang ─────────────────────────────────────────────────────
  setCategoryForLang: (lang, slug, category) =>
    set((state) => {
      const key = `${lang}:${slug}`;
      // Also upsert into the flat categories array for current-view compatibility
      const filtered = state.categories.filter(
        (item) => getCategorySlug(item) !== slug
      );
      return {
        categoriesByLang: { ...state.categoriesByLang, [key]: category },
        categories: [...filtered, category],
      };
    }),
  getCategoryForLang: (lang, slug) => get().categoriesByLang[`${lang}:${slug}`],

  // ─── current view ─────────────────────────────────────────────────────────
  setCurrentCategory: (category) => set({ currentCategory: category }),
  setCurrentItem: (item) => set({ currentItem: item }),
  setCurrentCollection: (collection) => set({ currentCollection: collection }),

  // ─── resume ───────────────────────────────────────────────────────────────
  setResumeForLang: (lang, data) =>
    set((state) => ({
      resumeByLang: { ...state.resumeByLang, [lang]: data },
    })),
  setResumeFetched: (fetched) => set({ isResumeFetched: fetched }),
  setResumeJsonForLang: (lang, json) =>
    set((state) => ({
      resumeJsonByLang: { ...state.resumeJsonByLang, [lang]: json },
    })),

  // ─── social networks ──────────────────────────────────────────────────────
  setSocialNetworks: (items) => set({ socialNetworks: items }),
  setSocialNetworksFetched: (fetched) =>
    set({ isSocialNetworksFetched: fetched }),
}));
