'use client';

import Link from 'next/link';
import { Text } from '../text/Text';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DrawerTrigger } from '../drawer/DrawerTrigger';
import { WorkData } from '@/interfaces';
import { NavLinkTriggers } from './NavlinkTriggers';
import { useUIStore } from '@/store/ui/ui-store';
import { Button } from '../button/Button';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { ChatIcon } from '../icon/icons';
import { Skeleton } from '@/components';
import { useSkeletonOnce } from '@/hooks/useSkeletonOnce';
import { useEntranceAnimation } from '@/hooks/useEntranceAnimation';
import { useDataStore } from '@/store/data/data-store';
import { slugify } from '@/utils/functions';
import { ContentfulCategory } from '@/interfaces';
import { useTranslation } from '@/hooks/useTranslation';
import { CONTENTFUL_LOCALE } from '@/i18n/translations';
import { sessionState } from '@/utils/session-state';

const getCategorySlug = (category: ContentfulCategory): string => {
  return category?.fields?.slug ?? category?.slug ?? '';
};

type ContentfulProjectItem = {
  fields?: {
    title?: string;
    name?: string;
    slug?: string;
    items?: ContentfulProjectItem[];
    [key: string]: unknown;
  };
  title?: string;
  name?: string;
  slug?: string;
  items?: ContentfulProjectItem[];
  [key: string]: unknown;
};

const getProjectsTree = (
  category: ContentfulCategory
): ContentfulProjectItem[] => {
  const tree =
    (Array.isArray(category?.fields?.projectsTree)
      ? category.fields.projectsTree
      : null) ??
    (Array.isArray(category?.projectsTree) ? category.projectsTree : null) ??
    [];
  return tree.filter(
    (item): item is ContentfulProjectItem =>
      typeof item === 'object' && item !== null
  ) as ContentfulProjectItem[];
};

interface NavbarProps {
  queryCollections: WorkData[];
}

export const Navbar = ({ queryCollections }: NavbarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { closeDrawer, isDrawerOpen, language } = useUIStore();
  const t = useTranslation();
  const {
    categories,
    navbarCollections,
    setNavbarCollections,
    setNavbarForLang,
    getNavbarForLang,
    setCategoryForLang,
    getCategoryForLang,
    setCurrentCategory,
    setFetchingCategory,
    isCategoryFetching,
  } = useDataStore();
  const activeItemRef = useRef<HTMLLIElement | null>(null);
  const navRef = useRef<HTMLUListElement | null>(null);
  const hasNavigated = useRef(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isNavbarHovered, setIsNavbarHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const showSkeleton = useSkeletonOnce();
  const animate = useEntranceAnimation();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Seed navbarCollections on mount.
  // Always cache the EN SSR data in navbarByLang['en'].
  // If the stored language is ES and we don't have it cached yet, fetch once.
  useEffect(() => {
    if (queryCollections.length > 0) {
      setNavbarForLang('en', queryCollections);
    }
    if (language === 'en') return;
    // ES: check cache before fetching
    const cached = getNavbarForLang('es');
    if (cached) {
      setNavbarCollections(cached);
      return;
    }
    const locale = CONTENTFUL_LOCALE[language];
    fetch(`/api/contentful/navbar?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.items) && data.items.length > 0) {
          setNavbarForLang('es', data.items); // stores in cache + updates navbarCollections
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  // Language toggle: serve from cache — never fetch Contentful again.
  const isFirstLanguageRender = useRef(true);
  useEffect(() => {
    if (isFirstLanguageRender.current) {
      isFirstLanguageRender.current = false;
      return;
    }
    const cached = getNavbarForLang(language);
    if (cached) {
      // Cache hit — instant switch, zero network calls.
      setNavbarCollections(cached);
      return;
    }
    // Cache miss (first time this locale is used) — fetch once and cache.
    if (language === 'en') {
      if (queryCollections.length > 0) setNavbarForLang('en', queryCollections);
      return;
    }
    const locale = CONTENTFUL_LOCALE[language];
    fetch(`/api/contentful/navbar?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.items) && data.items.length > 0) {
          setNavbarForLang(language, data.items);
        }
      })
      .catch(() => {});
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const slug = pathname.split('?')[0].split('/').filter(Boolean)[0];
    if (!slug || slug === 'contact') return;

    // Locale cache hit — instant, no network call.
    const cached = getCategoryForLang(language, slug);
    if (cached) {
      if (cached !== categories.find((c) => getCategorySlug(c) === slug)) {
        setCurrentCategory(cached);
      }
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
    pathname,
    categories,
    language,
    setCategoryForLang,
    getCategoryForLang,
    setCurrentCategory,
    setFetchingCategory,
    isCategoryFetching,
  ]);

  // After mount, prefer store's navbarCollections (locale-aware) over SSR prop
  const displayCollections =
    isMounted && navbarCollections.length > 0
      ? navbarCollections
      : queryCollections;

  const scrollDirection = useScrollDirection();
  const breakpoint = useBreakpoint();

  // Asegurar consistencia entre servidor y cliente para evitar errores de hidratación
  const hideOnScrollClass =
    isMounted &&
    isDrawerOpen === false &&
    scrollDirection === 'down' &&
    breakpoint.breakpoint === 'mobile'
      ? 'transition-transform duration-300 ease-out -translate-y-full'
      : 'transition-transform duration-300 ease-out translate-y-0';

  useEffect(() => {
    if (activeItemRef.current && navRef.current) {
      const nav = navRef.current;
      const activeItem = activeItemRef.current;

      const itemRect = activeItem.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();

      const offsetLeft =
        activeItem.offsetLeft -
        nav.offsetLeft -
        navRect.width / 2 +
        itemRect.width / 2;

      if (hasNavigated.current) {
        nav.scrollTo({
          left: offsetLeft,
          behavior: 'smooth',
        });
      }
    }

    hasNavigated.current = true;
  }, [pathname]);

  const checkOverflow = useCallback(() => {
    if (navRef.current) {
      const nav = navRef.current;
      setIsOverflowing(nav.scrollWidth > nav.clientWidth);
    }
  }, []);

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, [checkOverflow]);

  const getCategoryTarget = (categorySlug: string) => {
    const existing = categories.find((item) => {
      const itemSlug = getCategorySlug(item);
      return itemSlug === categorySlug;
    });
    if (!existing) {
      return `/${categorySlug}`;
    }

    const projectsTree = getProjectsTree(existing);
    if (!Array.isArray(projectsTree) || projectsTree.length === 0) {
      return `/${categorySlug}`;
    }

    const firstItem = projectsTree[0];
    const firstTitle =
      firstItem?.fields?.title || firstItem?.fields?.name || '';
    const firstSlug =
      firstItem?.fields?.slug || (firstTitle ? slugify(firstTitle) : '');
    if (!firstSlug) {
      return `/${categorySlug}`;
    }

    const nestedItems = firstItem?.fields?.items || [];
    if (Array.isArray(nestedItems) && nestedItems.length > 0) {
      const nestedTitle =
        nestedItems[0]?.fields?.title || nestedItems[0]?.fields?.name || '';
      const nestedSlug =
        nestedItems[0]?.fields?.slug ||
        (nestedTitle ? slugify(nestedTitle) : '');
      if (nestedSlug) {
        return `/${categorySlug}/${firstSlug}/${nestedSlug}`;
      }
    }

    return `/${categorySlug}/${firstSlug}`;
  };

  return (
    <header
      role="banner"
      className={`fixed top-0 left-0 right-0 z-100 max-[1265px]:z-180 min-h-[56px] w-full bg-primary-background border-b border-indigo-100 md:max-[1265px]:min-h-[48px] min-[1266px]:min-h-[72px] md:border-b-0 ${hideOnScrollClass}`}
      onMouseEnter={() => setIsNavbarHovered(true)}
      onMouseLeave={() => setIsNavbarHovered(false)}
    >
      {/* Skeleton overlay — siempre montado, fade-out 500ms al terminar */}
      <div
        className="absolute inset-0 z-1 bg-primary-background pointer-events-none"
        aria-hidden="true"
        style={{
          opacity: showSkeleton ? 1 : 0,
          transition: showSkeleton ? 'none' : 'opacity 500ms ease-out',
        }}
      >
        <div className="relative h-full w-full">
          <div className="flex h-full items-center justify-start gap-[8px] pl-[64px] sm:pl-[16px]">
            <Skeleton className="h-[32px] w-[150px] sm:h-[40px] sm:w-[50px] md:w-[150px] lg:w-[200px]" />
            <Skeleton className="h-[32px] w-[150px] sm:h-[40px] sm:w-[50px] md:w-[150px] lg:w-[200px]" />
            <Skeleton className="hidden h-[40px] w-[50px] sm:block md:w-[150px] lg:w-[200px]" />
            <Skeleton className="hidden h-[40px] w-[50px] sm:block md:w-[150px] lg:w-[200px]" />
          </div>
          <div className="absolute right-0 top-0 flex h-full items-stretch border-l border-indigo-100 bg-primary-background md:border-b">
            <div className="flex h-full min-h-[56px] w-[56px] items-center justify-center md:max-[1265px]:min-h-[48px] min-[1266px]:min-h-[72px] sm:w-[160px] sm:px-[24px]">
              <Skeleton className="h-[24px] w-[24px] sm:h-[16px] sm:w-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full min-h-[56px] items-stretch justify-between md:max-[1265px]:min-h-[48px] min-[1266px]:min-h-[72px]">
        <nav
          ref={navRef}
          role="navigation"
          className="relative flex min-h-[56px] w-full flex-1 items-center overflow-x-auto pl-[16px] pr-[8px] scrollbar-hide touch-pan-x md:max-[1265px]:min-h-[48px] min-[1266px]:min-h-[72px]"
        >
          <div className="relative z-110">
            <DrawerTrigger />
          </div>
          <ul
            role="list"
            className="absolute flex translate-x-[56px] transform items-center gap-0 whitespace-nowrap align-start min-[1266px]:translate-x-0"
          >
            {displayCollections.map((item: WorkData, navIndex: number) => {
              const isActiveRoute =
                pathname === `/${item.slug}` ||
                pathname.startsWith(`/${item.slug}/`);
              /** Solo para scroll al ítem activo tras mount (evita mismatch SSR). */
              const attachActiveRef = isMounted && isActiveRoute;

              return (
                <li
                  key={item.slug}
                  onClick={closeDrawer}
                  role="listitem"
                  ref={attachActiveRef ? activeItemRef : null}
                  className={
                    isActiveRoute
                      ? 'pointer-events-none cursor-default'
                      : 'soft'
                  }
                  style={
                    animate
                      ? {
                          animation:
                            'entrance-fade-right 480ms cubic-bezier(0.16, 1, 0.3, 1) both',
                          animationDelay: `${navIndex * 55}ms`,
                        }
                      : undefined
                  }
                >
                  <Link
                    href={getCategoryTarget(item.slug)}
                    className="flex items-center py-[8px]"
                    onClick={() => {
                      sessionState.navigatedFromSidebar = false;
                    }}
                  >
                    <Text
                      type="title"
                      weight="bold"
                      color={isActiveRoute ? 'selected' : '#437B9A'}
                      variant={isActiveRoute ? 'solid' : 'outline'}
                      size="xl"
                      className={`uppercase leading-snug! md:leading-normal! ${
                        item.slug === 'paintings' ? 'pr-[8px]' : ''
                      }`}
                    >
                      {item.name.replace(/\s+/g, '-')}.
                    </Text>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <NavLinkTriggers
          navRef={navRef}
          isOverflowing={isOverflowing}
          isNavbarHovered={isNavbarHovered}
        />
        {!pathname.includes('/contact') && (
          <>
            {/* Mobile Contact Button - IconButton with ChatIcon */}
            <div
              className="flex shrink-0 self-stretch md:hidden border-l border-indigo-100 md:border-b"
              style={
                animate
                  ? {
                      animation:
                        'entrance-fade-up 480ms cubic-bezier(0.16, 1, 0.3, 1) both',
                      animationDelay: `${displayCollections.length * 55 + 60}ms`,
                    }
                  : undefined
              }
            >
              <Button
                ariaLabel={t.contact}
                onClick={() => {
                  closeDrawer();
                  router.push('/contact');
                }}
                state="activated"
                className="box-border h-full! min-h-[56px]! w-[56px]! relative icon-24-mobile md:hover:bg-primary-background-hover! hover:bg-transparent! hover:border-transparent! active:bg-transparent! active:border-transparent! focus:bg-transparent! focus:border-transparent!"
                iconButton
                icon={<ChatIcon viewBox="0 0 26 27" width={90} height={90} />}
              />
            </div>

            {/* Desktop Contact Button - Text Button */}
            <div
              className="hidden md:flex self-stretch border-l border-b border-indigo-100"
              style={
                animate
                  ? {
                      animation:
                        'entrance-fade-up 480ms cubic-bezier(0.16, 1, 0.3, 1) both',
                      animationDelay: `${displayCollections.length * 55 + 60}ms`,
                    }
                  : undefined
              }
            >
              <Button
                ariaLabel={t.contact}
                onClick={() => {
                  closeDrawer();
                  router.push('/contact');
                }}
                state="activated"
                hoverArrow="right"
                className="h-full min-h-[48px]! min-[1266px]:min-h-[72px]! relative md:px-[24px]"
              >
                {t.contact}
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
