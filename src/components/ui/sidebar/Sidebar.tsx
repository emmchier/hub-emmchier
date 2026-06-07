'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback,
} from 'react';
import { WorkData } from '@/interfaces';
import {
  Button,
  ChevronLeftIcon,
  ChevronRightIcon,
  Tooltip,
  SideFooter,
  Text,
  Skeleton,
} from '@/components';
import { useUIStore } from '@/store/ui/ui-store';
import { useDataStore } from '@/store/data/data-store';
import { slugify } from '@/utils/functions';
import { ContentfulCategory } from '@/interfaces';
import { TruncatedText } from '@/utils/truncate-text';
import { useSkeletonOnce } from '@/hooks/useSkeletonOnce';
import { useEntranceAnimation } from '@/hooks/useEntranceAnimation';
import { useTranslation } from '@/hooks/useTranslation';
import { CONTENTFUL_LOCALE } from '@/i18n/translations';
import { sessionState } from '@/utils/session-state';

const getCategorySlug = (category: ContentfulCategory): string => {
  return category?.fields?.slug ?? category?.slug ?? '';
};

const getProjectsTree = (category: ContentfulCategory): unknown[] => {
  return (
    (Array.isArray(category?.fields?.projectsTree)
      ? category.fields.projectsTree
      : null) ??
    (Array.isArray(category?.projectsTree) ? category.projectsTree : null) ??
    []
  );
};

const getCategoryItems = (category: ContentfulCategory): unknown[] => {
  return (
    (Array.isArray(category?.fields?.items) ? category.fields.items : null) ??
    (Array.isArray(category?.items) ? category.items : null) ??
    []
  );
};

type ContentfulItem = {
  fields?: {
    title?: string;
    name?: string;
    slug?: string;
    items?: unknown[];
    projectsTree?: unknown[];
    [key: string]: unknown;
  };
  title?: string;
  name?: string;
  slug?: string;
  items?: unknown[];
  projectsTree?: unknown[];
  [key: string]: unknown;
};

/** Alto fijo del thumb del scrollbar del sidebar (px). */
const SIDEBAR_SCROLL_THUMB_HEIGHT_PX = 100;

interface SidebarProps {
  collection: WorkData;
  isMobile?: boolean;
}

// Nota: La funcionalidad de truncate ha sido movida a src/utils/truncate-text.tsx
// para reutilización en otros componentes cuando sea necesario.

export default function Sidebar({ collection, isMobile }: SidebarProps) {
  const { closeDrawer, isSidebarOpen, openSidebar, closeSidebar, language } =
    useUIStore();
  const t = useTranslation();
  const pathname = usePathname();
  const {
    categories,
    currentCategory,
    setCategoryForLang,
    getCategoryForLang,
    setCurrentCategory,
    setFetchingCategory,
    isCategoryFetching,
  } = useDataStore();

  // Sincronizar estado del sidebar desde localStorage después del primer render
  useEffect(() => {
    const stored = localStorage.getItem('sidebarOpen');
    if (stored !== null) {
      const shouldBeOpen = stored === 'true';
      if (shouldBeOpen && !isSidebarOpen) {
        openSidebar();
      } else if (!shouldBeOpen && isSidebarOpen) {
        closeSidebar();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez después del mount para sincronizar con localStorage

  type SidebarItem = {
    name: string;
    slug: string;
    path: string[];
    isExpandable: boolean;
    subItems?: SidebarItem[];
  };

  const sidebarItems = useMemo<SidebarItem[]>(() => {
    if (!currentCategory) return [];
    const source =
      getProjectsTree(currentCategory).length > 0
        ? getProjectsTree(currentCategory)
        : getCategoryItems(currentCategory);

    if (!Array.isArray(source)) {
      return [];
    }

    const normalizeItem = (
      item: ContentfulItem,
      parentPath: string[] = []
    ): SidebarItem | null => {
      const fields = item?.fields ?? item ?? {};
      const name = fields.title || fields.name || '';
      const slug = fields.slug || (name ? slugify(name) : '');
      if (!name || !slug) return null;

      const subItemsSource = (fields.items ||
        fields.projectsTree ||
        []) as ContentfulItem[];
      const hasSubItems =
        Array.isArray(subItemsSource) && subItemsSource.length > 0;

      const path = [...parentPath, slug];
      if (!hasSubItems) {
        return { name, slug, path, isExpandable: false };
      }

      const subItems = subItemsSource
        .map((subItem) => normalizeItem(subItem, path))
        .filter(
          (subItem: SidebarItem | null): subItem is SidebarItem => !!subItem
        );

      return {
        name,
        slug,
        path,
        isExpandable: subItems.length > 0,
        subItems,
      };
    };

    return (source as ContentfulItem[])
      .map((item) => normalizeItem(item, [collection.slug]))
      .filter((item: SidebarItem | null): item is SidebarItem => !!item);
  }, [collection.slug, currentCategory]);

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );
  const showSkeleton = useSkeletonOnce();
  const animate = useEntranceAnimation();

  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  type SidebarScrollMetrics = {
    overflow: boolean;
    thumbH: number;
    thumbTop: number;
  };
  const [scrollMetrics, setScrollMetrics] = useState<SidebarScrollMetrics>({
    overflow: false,
    thumbH: 0,
    thumbTop: 0,
  });

  const updateScrollMetrics = useCallback(() => {
    const el = sidebarScrollRef.current;
    if (!el) return;
    const { scrollHeight, clientHeight, scrollTop } = el;
    const overflow = scrollHeight > clientHeight + 1;
    if (!overflow) {
      setScrollMetrics({ overflow: false, thumbH: 0, thumbTop: 0 });
      return;
    }
    const trackH = clientHeight;
    const thumbH = Math.min(SIDEBAR_SCROLL_THUMB_HEIGHT_PX, trackH);
    const maxScroll = scrollHeight - clientHeight;
    const maxThumbTop = Math.max(trackH - thumbH, 0);
    const thumbTop =
      maxScroll <= 0 || maxThumbTop <= 0
        ? 0
        : (scrollTop / maxScroll) * maxThumbTop;
    setScrollMetrics({ overflow: true, thumbH, thumbTop });
  }, []);

  const onScrollbarThumbPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const el = sidebarScrollRef.current;
      if (!el) return;
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      const { scrollHeight, clientHeight } = el;
      const maxScroll = Math.max(scrollHeight - clientHeight, 0);
      const trackH = clientHeight;
      const thumbH = Math.min(SIDEBAR_SCROLL_THUMB_HEIGHT_PX, trackH);
      const maxThumbTop = Math.max(trackH - thumbH, 0);
      const startY = e.clientY;
      const startScroll = el.scrollTop;

      const onMove = (ev: PointerEvent) => {
        if (maxThumbTop <= 0 || maxScroll <= 0) return;
        const dy = ev.clientY - startY;
        const next = startScroll + (dy / maxThumbTop) * maxScroll;
        el.scrollTop = Math.min(Math.max(0, next), maxScroll);
      };
      const onUp = (ev: PointerEvent) => {
        try {
          target.releasePointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerup', onUp);
        target.removeEventListener('pointercancel', onUp);
      };
      target.addEventListener('pointermove', onMove);
      target.addEventListener('pointerup', onUp);
      target.addEventListener('pointercancel', onUp);
    },
    []
  );

  useLayoutEffect(() => {
    updateScrollMetrics();
    const el = sidebarScrollRef.current;
    if (!el) {
      window.addEventListener('resize', updateScrollMetrics);
      return () => window.removeEventListener('resize', updateScrollMetrics);
    }
    el.addEventListener('scroll', updateScrollMetrics, { passive: true });
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateScrollMetrics);
      return () => {
        el.removeEventListener('scroll', updateScrollMetrics);
        window.removeEventListener('resize', updateScrollMetrics);
      };
    }
    const ro = new ResizeObserver(() => updateScrollMetrics());
    ro.observe(el);
    window.addEventListener('resize', updateScrollMetrics);
    return () => {
      el.removeEventListener('scroll', updateScrollMetrics);
      ro.disconnect();
      window.removeEventListener('resize', updateScrollMetrics);
    };
  }, [sidebarItems, expandedItems, isSidebarOpen, updateScrollMetrics]);

  /** Solo el primer ítem visible del sidebar: si es expandible, abierto por defecto desde el primer render. */
  const defaultExpandedSlug = useMemo(() => {
    const first = sidebarItems[0];
    if (first?.isExpandable && first.slug) return first.slug;
    return null;
  }, [sidebarItems]);

  const categorySlug = currentCategory ? getCategorySlug(currentCategory) : '';

  useEffect(() => {
    setExpandedItems({});
  }, [collection.slug, categorySlug]);

  const getIsExpanded = (slug: string, isExpandable: boolean) => {
    if (!isExpandable) return false;
    const explicit = expandedItems[slug];
    if (explicit !== undefined) return explicit;
    return slug === defaultExpandedSlug;
  };

  const isItemSelected = (path: string[]) => {
    const currentPath = pathname.split('?')[0].split('/').filter(Boolean);
    return (
      currentPath.length >= path.length &&
      path.every((segment, index) => currentPath[index] === segment)
    );
  };

  const toggleItemExpansion = (slug: string) => {
    setExpandedItems((prev) => {
      const explicit = prev[slug];
      const defaultOpen =
        defaultExpandedSlug !== null && slug === defaultExpandedSlug;
      const current = explicit !== undefined ? explicit : defaultOpen;
      return { ...prev, [slug]: !current };
    });
  };

  const handleItemClick = () => {
    sessionState.navigatedFromSidebar = true;
    closeDrawer();
  };

  useEffect(() => {
    const slug = pathname.split('?')[0].split('/').filter(Boolean)[0];
    if (!slug) return;

    // Locale cache hit — instant switch to the right language's data.
    const cached = getCategoryForLang(language, slug);
    if (cached) {
      if (cached !== currentCategory) setCurrentCategory(cached);
      return;
    }

    const fetchKey = `${language}:${slug}`;
    if (isCategoryFetching(fetchKey)) return;

    const fetchCategory = async () => {
      setFetchingCategory(fetchKey, true);
      try {
        const locale = CONTENTFUL_LOCALE[language];
        const response = await fetch(
          `/api/contentful/category/${slug}?locale=${locale}`
        );
        const data = await response.json();
        if (data?.item) {
          setCategoryForLang(language, slug, data.item); // caches + updates categories
          setCurrentCategory(data.item);
        }
      } catch {
        // ignore
      } finally {
        setFetchingCategory(fetchKey, false);
      }
    };
    fetchCategory();
  }, [
    categories,
    currentCategory,
    language,
    pathname,
    getCategoryForLang,
    setCategoryForLang,
    setCurrentCategory,
    setFetchingCategory,
    isCategoryFetching,
  ]);

  return (
    <>
      <aside
        className={[
          'relative bg-primary-background transition-[width,padding] duration-300 ease-in-out overflow-x-hidden',
          !isMobile
            ? 'hidden min-[1266px]:flex min-[1266px]:flex-col min-[1266px]:fixed min-[1266px]:top-[72px] min-[1266px]:left-0 min-[1266px]:min-h-0 min-[1266px]:h-[calc(100dvh-72px)] min-[1266px]:overflow-hidden'
            : 'flex h-full min-h-0 w-full flex-col',
          isSidebarOpen
            ? 'min-[1266px]:w-[20%] min-[1266px]:border-r min-[1266px]:border-indigo-100'
            : 'min-[1266px]:w-0',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Skeleton overlay sidebar tree — fade-out 500ms, solo desktop */}
        {isSidebarOpen && !isMobile && (
          <div
            className="absolute inset-0 z-50 pointer-events-none"
            aria-hidden="true"
            style={{
              opacity: showSkeleton ? 1 : 0,
              transition: showSkeleton ? 'none' : 'opacity 500ms ease-out',
            }}
          >
            <div className="absolute inset-y-0 left-0 right-0 bg-primary-background" />
            <div className="relative h-full">
              <div className="pt-[16px] pl-[16px]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={`sidebar-skeleton-${index}`}
                    className="border-b border-indigo-100 py-[12px] pr-[16px]"
                    style={{
                      opacity: 1 - index * 0.12,
                    }}
                  >
                    <Skeleton className="h-[28px] w-[80%]" />
                    {index % 2 === 0 && (
                      <Skeleton className="mt-[8px] h-[24px] w-[55%]" />
                    )}
                  </div>
                ))}
              </div>
              <div className="absolute bottom-[20px] left-0 right-0 px-[16px]">
                <div className="flex items-center gap-[12px] pl-[8px]">
                  <Skeleton className="h-[28px] w-[72px]" />
                  <Skeleton className="h-[28px] w-[28px]" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 min-w-0 flex-1">
            <div
              ref={sidebarScrollRef}
              className={[
                'scrollbar-hide absolute inset-0 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto',
                isMobile ? 'px-[20px]' : '',
                isSidebarOpen
                  ? 'min-[1266px]:pl-[16px] min-[1266px]:pr-0'
                  : 'min-[1266px]:pl-0 min-[1266px]:pr-0',
                scrollMetrics.overflow ? 'pr-2' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className={scrollMetrics.overflow ? 'pr-4' : ''}>
                {sidebarItems.map((item, itemIndex) => {
                  if (!item.slug) return null;
                  const isSelected = isItemSelected(item.path);
                  const isExpanded = getIsExpanded(
                    item.slug,
                    item.isExpandable
                  );
                  const entranceStyle: React.CSSProperties = animate
                    ? {
                        animation:
                          'entrance-fade-up 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
                        animationDelay: `${itemIndex * 80}ms`,
                      }
                    : {};

                  if (item.isExpandable) {
                    return (
                      <div
                        key={item.slug}
                        className="border-b border-indigo-100 last:border-b-0"
                        style={entranceStyle}
                      >
                        {/* Item expandible con chevron */}
                        <button
                          onClick={() => toggleItemExpansion(item.slug)}
                          className={`w-full min-h-[64px] md:min-h-[64px] py-[8px] text-left flex items-center justify-between cursor-pointer group pr-[16px]
                    ${!isMobile ? 'hover:bg-primary-background-hover' : ''}`}
                        >
                          {/* Texto con truncate para headers expandibles */}
                          <div className="flex-1 min-w-0 pr-4">
                            <TruncatedText
                              className={`text-[40px] leading-[1.12] font-bold text-primary-text`}
                              isMobile={isMobile}
                              maxWidth="100%"
                            >
                              {item.name}
                            </TruncatedText>
                          </div>

                          {/* Chevron siempre visible */}
                          <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              className={`transition-transform duration-300 ease-out ${
                                isExpanded ? 'rotate-180' : 'rotate-0'
                              }`}
                              style={{ color: '#437B9A' }}
                            >
                              <path
                                d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                        </button>

                        {/* Subitems: grid 0fr→1fr para animar altura sin montar/desmontar el bloque */}
                        {Array.isArray(item.subItems) &&
                        item.subItems.length > 0 ? (
                          <div
                            className="grid overflow-hidden"
                            style={{
                              gridTemplateRows: isExpanded ? '1fr' : '0fr',
                              transition:
                                'grid-template-rows 320ms cubic-bezier(0.33, 1, 0.68, 1)',
                            }}
                          >
                            <div
                              className={`min-h-0 overflow-hidden ${!isExpanded ? 'pointer-events-none' : ''}`}
                              inert={!isExpanded}
                            >
                              <div className="bg-primary-background">
                                {item.subItems.map((subItem) => {
                                  if (!subItem.slug) return null;
                                  const isSubSelected = isItemSelected(
                                    subItem.path
                                  );
                                  return (
                                    <Link
                                      key={subItem.path.join('/')}
                                      href={`/${subItem.path.join('/')}`}
                                      scroll={false}
                                      onClick={handleItemClick}
                                      className={`flex min-h-[44px] cursor-pointer items-center py-[8px] pl-[24px] pr-[16px] text-left transition-colors duration-200 ${
                                        isSubSelected
                                          ? 'pointer-events-none text-selected-text'
                                          : `text-primary-text ${!isMobile ? 'hover:bg-primary-background-hover hover:text-primary-text-hover' : ''}`
                                      }`}
                                    >
                                      <Text
                                        type="title"
                                        size="m"
                                        weight="medium"
                                        className="leading-tight!"
                                        color={
                                          isSubSelected ? 'selected' : 'primary'
                                        }
                                      >
                                        {subItem.name}
                                      </Text>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  } else {
                    // Item normal sin chevron
                    return (
                      <div
                        key={item.slug}
                        className="border-b border-indigo-100 last:border-b-0"
                        style={entranceStyle}
                      >
                        <Link
                          href={`/${item.path.join('/')}`}
                          scroll={false}
                          onClick={handleItemClick}
                          className={`min-h-[64px] md:min-h-[64px] py-[8px] text-left flex items-center cursor-pointer transition-colors duration-200 pr-[16px]
                    ${
                      isSelected
                        ? 'text-selected-text pointer-events-none'
                        : `text-primary-text ${!isMobile ? 'hover:text-primary-text-hover hover:bg-primary-background-hover' : ''}`
                    }`}
                        >
                          <span
                            className={`text-[40px] leading-[1.12] font-bold ${
                              isSelected
                                ? 'text-selected-text'
                                : 'text-primary-text'
                            }`}
                          >
                            {item.name}
                          </span>
                        </Link>
                      </div>
                    );
                  }
                })}
              </div>
            </div>

            {scrollMetrics.overflow ? (
              <div
                className="pointer-events-none absolute inset-y-0 right-[4px] z-1 w-2 bg-[#112f40]"
                aria-hidden
              >
                <div
                  role="presentation"
                  className="pointer-events-auto absolute right-0 w-2 cursor-grab rounded-sm bg-[#21516b] active:cursor-grabbing"
                  style={{
                    height: scrollMetrics.thumbH,
                    top: scrollMetrics.thumbTop,
                  }}
                  onPointerDown={onScrollbarThumbPointerDown}
                />
              </div>
            ) : null}
          </div>

          {isSidebarOpen && !isMobile && (
            <div
              id="sidebarFooter"
              className="hidden min-h-[72px] min-w-0 shrink-0 items-center gap-3 border-t border-indigo-100 bg-[#112F40] px-4 py-4 min-[1266px]:flex"
            >
              <div className="min-h-[48px] min-w-0 flex-1 overflow-hidden">
                <SideFooter />
              </div>
              <div className="shrink-0">
                <Tooltip content={t.collapse} direction="right">
                  <Button
                    ariaLabel={t.collapseSidebar}
                    onClick={closeSidebar}
                    className="transition-all duration-200 ease-in-out hover:translate-x-[-2px] soft"
                    style={{ backgroundColor: '#173B4F' }}
                    size="m"
                    icon={<ChevronLeftIcon size="md" />}
                    iconButton
                  />
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Skeleton footer sidebar — fade-out 500ms */}
      {isSidebarOpen && (
        <div
          className="fixed bottom-0 left-0 z-120 hidden min-[1266px]:block min-[1266px]:w-[20%] pointer-events-none"
          aria-hidden="true"
          style={{
            opacity: showSkeleton ? 1 : 0,
            transition: showSkeleton ? 'none' : 'opacity 500ms ease-out',
          }}
        >
          <div className="absolute inset-y-0 left-0 right-0 bg-[#112F40]" />
          <div className="relative px-4 pb-[20px] pt-3">
            <div className="w-full flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-[20px] w-[48px]" />
                <div className="flex items-center gap-[8px]">
                  <Skeleton className="h-[22px] w-[160px]" />
                  <Skeleton className="h-[12px] w-[12px]" />
                </div>
              </div>
              <div className="h-[44px] flex items-center gap-2">
                <Skeleton className="h-[36px] w-[36px]" />
                <Skeleton className="h-[36px] w-[36px]" />
                <Skeleton className="h-[36px] w-[36px]" />
                <Skeleton className="h-[36px] w-[36px]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón expand — solo con sidebar colapsado (≥1266px) */}
      {!isSidebarOpen && (
        <div className="fixed bottom-0 z-50 mb-[16px] hidden min-[1266px]:block left-2">
          <Tooltip content={t.expand} direction="right">
            <Button
              ariaLabel={t.expandSidebar}
              onClick={openSidebar}
              className="transition-all duration-200 ease-in-out hover:translate-x-[2px] soft"
              style={{ backgroundColor: '#173B4F' }}
              size="m"
              icon={<ChevronRightIcon size="md" />}
              iconButton
            />
          </Tooltip>
        </div>
      )}
    </>
  );
}
