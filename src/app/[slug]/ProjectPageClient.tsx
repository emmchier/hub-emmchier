'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { WorkData, WorkItem } from '@/interfaces';
import { useDataStore } from '@/store/data/data-store';
import { slugify } from '@/utils/functions';
import {
  Text,
  Tab,
  TabContentSkeleton,
  TabItem,
  Information,
  MakingOfSkeleton,
  ImageGallery,
  Header,
} from '@/components';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useSkeletonOnce } from '@/hooks/useSkeletonOnce';
import { useEntranceAnimation } from '@/hooks/useEntranceAnimation';
import { hasMakingOfRichTextContent } from '@/utils/making-of-content';
import { useTranslation } from '@/hooks/useTranslation';
import { useUIStore } from '@/store/ui/ui-store';
import { CONTENTFUL_LOCALE } from '@/i18n/translations';

type ContentfulEntry = {
  sys?: {
    id?: string;
    contentType?: { sys?: { id?: string } };
  };
  fields?: Record<string, unknown>;
};

type ContentfulFields = Record<string, unknown>;

const getContentfulString = (
  fields: ContentfulFields | undefined,
  key: string
) => {
  const value = fields?.[key];
  return typeof value === 'string' ? value : '';
};

const getContentfulArray = (
  fields: ContentfulFields | undefined,
  key: string
) => {
  const value = fields?.[key];
  return Array.isArray(value) ? value : [];
};

const hasUnresolvedGalleryImages = (entry?: { fields?: ContentfulFields }) => {
  const fields = entry?.fields;
  if (!fields) return true;

  const galleryRaw = fields.gallery;
  const imagesRaw = fields.images;
  const hasGalleryArray = Array.isArray(galleryRaw);
  const hasImagesArray = Array.isArray(imagesRaw);

  if (hasGalleryArray && !hasImagesArray) return true;
  if (hasGalleryArray && hasImagesArray) {
    const gallery = galleryRaw as unknown[];
    const images = imagesRaw as unknown[];
    if (gallery.length > 0 && images.length === 0) return true;
  }

  const items = getContentfulArray(fields, 'items') as Array<{
    fields?: ContentfulFields;
  }>;
  if (items.some((item) => hasUnresolvedGalleryImages(item))) return true;

  const projectsTree = getContentfulArray(fields, 'projectsTree') as Array<{
    fields?: ContentfulFields;
  }>;
  if (projectsTree.some((item) => hasUnresolvedGalleryImages(item)))
    return true;

  return false;
};

interface ProjectPageClientProps {
  categorySlug: string;
  itemSegments: string[];
}

const getEntrySlug = (entry?: ContentfulEntry) => {
  const fields = entry?.fields;
  const title =
    getContentfulString(fields, 'title') || getContentfulString(fields, 'name');
  const slug =
    getContentfulString(fields, 'slug') || (title ? slugify(title) : '');
  return slug;
};

const normalizeProject = (entry: ContentfulEntry): WorkItem => {
  const fields = entry?.fields;
  const name =
    getContentfulString(fields, 'title') || getContentfulString(fields, 'name');
  const slug = getEntrySlug(entry);
  const description = getContentfulString(fields, 'description');

  // Resolver techs - vienen resueltos desde el servidor
  const techsRaw = getContentfulArray(fields, 'techs');
  const tools = techsRaw
    .map((tech: unknown) => {
      const techEntry = tech as ContentfulEntry;
      // Los techs ya vienen resueltos desde el servidor
      if (techEntry?.fields) {
        return getContentfulString(techEntry.fields, 'name');
      }
      return null;
    })
    .filter(Boolean) as string[];
  const publishedDate = getContentfulString(fields, 'publishedDate');
  const year = publishedDate ? String(publishedDate).slice(0, 4) : undefined;
  const makingOf = fields?.makingOf as WorkItem['makingOf'];
  const images = getContentfulArray(fields, 'images') as WorkItem['images'];
  const orderValue = fields?.order;
  const order = typeof orderValue === 'number' ? orderValue : undefined;

  // Leer readingTime (calculado en el servidor)
  const readingTimeValue = fields?.readingTime;
  const readingTime =
    typeof readingTimeValue === 'number' ? readingTimeValue : undefined;

  return {
    name,
    slug,
    description: description || undefined,
    tools,
    year,
    images,
    makingOf,
    order,
    readingTime,
  };
};

export default function ProjectPageClient({
  categorySlug,
  itemSegments,
}: ProjectPageClientProps) {
  const t = useTranslation();
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
      // Locale cache hit — instant, zero network calls.
      const cached = getCategoryForLang(language, categorySlug);
      if (
        cached &&
        !hasUnresolvedGalleryImages(cached as { fields?: ContentfulFields })
      ) {
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
        const data = (await response.json()) as {
          item?: { fields?: Record<string, unknown> };
        };
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

  const currentCategorySlug = (() => {
    const fields = (currentCategory as { fields?: ContentfulFields })?.fields;
    return (
      (fields && typeof fields.slug === 'string' && fields.slug) ||
      ((currentCategory as { slug?: string })?.slug ?? '')
    );
  })();

  const projectsTree = useMemo(() => {
    if (!currentCategory || currentCategorySlug !== categorySlug) return [];
    const fields = (currentCategory as { fields?: ContentfulFields })?.fields;
    const source =
      (fields && Array.isArray(fields.projectsTree) && fields.projectsTree) ||
      ((currentCategory as { projectsTree?: unknown[] })?.projectsTree ?? []);
    return Array.isArray(source) ? source : [];
  }, [categorySlug, currentCategory, currentCategorySlug]);

  const collection = useMemo<WorkData | null>(() => {
    if (!currentCategory || currentCategorySlug !== categorySlug) return null;
    const fields = (currentCategory as { fields?: ContentfulFields })?.fields;
    const categoryName =
      getContentfulString(fields, 'title') ||
      getContentfulString(fields, 'name') ||
      categorySlug;
    return {
      name: categoryName,
      slug: categorySlug,
      items: [],
    };
  }, [categorySlug, currentCategory, currentCategorySlug]);

  const selectedEntry = useMemo<ContentfulEntry | null>(() => {
    if (!currentCategory || currentCategorySlug !== categorySlug) return null;

    // Filtrar 'making-of' de los segmentos para encontrar el proyecto
    const projectSegments = itemSegments.filter(
      (segment) => segment !== 'making-of'
    );
    const [groupSlug, projectSlug] = projectSegments;

    let selectedEntry: ContentfulEntry | null = null;

    if (groupSlug && projectSlug) {
      const group = projectsTree.find((entry: ContentfulEntry) => {
        return getEntrySlug(entry) === groupSlug;
      });
      const groupItems = getContentfulArray(group?.fields, 'items');
      if (Array.isArray(groupItems)) {
        selectedEntry =
          groupItems.find(
            (entry: ContentfulEntry) => getEntrySlug(entry) === projectSlug
          ) ?? null;
      }
    }

    if (!selectedEntry) {
      // Usar el último segmento que no sea 'making-of'
      const fallbackSlug = projectSegments[projectSegments.length - 1];
      if (fallbackSlug) {
        for (const entry of projectsTree) {
          const entrySlug = getEntrySlug(entry);
          if (entrySlug === fallbackSlug) {
            selectedEntry = entry;
            break;
          }
          const entryItems = getContentfulArray(entry?.fields, 'items');
          if (Array.isArray(entryItems)) {
            const nested = entryItems.find(
              (item: ContentfulEntry) => getEntrySlug(item) === fallbackSlug
            );
            if (nested) {
              selectedEntry = nested;
              break;
            }
          }
        }
      }
    }

    if (!selectedEntry) {
      return null;
    }

    return selectedEntry;
  }, [
    categorySlug,
    currentCategorySlug,
    itemSegments,
    projectsTree,
    currentCategory,
  ]);

  const subItemBase = useMemo<WorkItem | null>(() => {
    if (!selectedEntry) return null;
    return normalizeProject(selectedEntry);
  }, [selectedEntry]);

  // Añadir urlToShare a cada imagen usando el query `item` para la ruta base
  const resolvedSubItem = useMemo<WorkItem | null>(() => {
    if (!subItemBase) return null;
    const itemPath = itemSegments.length
      ? `?item=${encodeURIComponent(itemSegments.join('/'))}`
      : '';
    const shareBase = `/${categorySlug}/image`;
    const imagesWithShare = (subItemBase.images ?? []).map((img) => ({
      ...img,
      urlToShare: img.id ? `${shareBase}/${img.id}${itemPath}` : undefined,
    }));
    return { ...subItemBase, images: imagesWithShare };
  }, [subItemBase, categorySlug, itemSegments]);

  // no debug logging

  // Obtener el nombre del grupo expandible si es un sub-item
  const parentGroupName = useMemo<string | null>(() => {
    if (!currentCategory || currentCategorySlug !== categorySlug) return null;

    const projectSegments = itemSegments.filter(
      (segment) => segment !== 'making-of'
    );
    const [groupSlug] = projectSegments;

    // Si hay un groupSlug y un projectSlug, significa que es un sub-item
    if (groupSlug && projectSegments.length > 1) {
      const group = projectsTree.find((entry: ContentfulEntry) => {
        return getEntrySlug(entry) === groupSlug;
      });

      if (group) {
        const fields = group?.fields ?? {};
        const name =
          (fields && typeof fields.title === 'string' && fields.title) ||
          (fields && typeof fields.name === 'string' && fields.name) ||
          '';
        return name || null;
      }
    }

    return null;
  }, [
    categorySlug,
    currentCategorySlug,
    itemSegments,
    projectsTree,
    currentCategory,
  ]);

  // Construir el título - solo el nombre del proyecto
  const displayTitle = useMemo(() => {
    if (!resolvedSubItem) return '';
    return resolvedSubItem.name;
  }, [resolvedSubItem]);

  const imageCount = resolvedSubItem?.images?.length ?? 0;
  const hasMakingOfContent = useMemo(
    () => hasMakingOfRichTextContent(resolvedSubItem?.makingOf),
    [resolvedSubItem?.makingOf]
  );
  const singleHeroGallery = !hasMakingOfContent && imageCount === 1;

  // Lógica de WorkDetailClientPage
  const currentItem = useDataStore((state) => state.currentItem);
  const currentCollection = useDataStore((state) => state.currentCollection);
  const setCurrentItem = useDataStore((state) => state.setCurrentItem);
  const setCollection = useDataStore((state) => state.setCollection);
  const setCurrentCollection = useDataStore(
    (state) => state.setCurrentCollection
  );
  const scrollDirection = useScrollDirection();

  // true when the last navigation came from the Sidebar.
  // Navbar clicks and non-project pages reset this to false.
  const hideHeader = false;

  const router = useRouter();
  const pathname = usePathname();

  const imageRedirect = useMemo(() => {
    const segmentCount = itemSegments.length;
    if (segmentCount < 2) return null;
    if (itemSegments[segmentCount - 2] !== 'image') return null;
    const imageId = itemSegments[segmentCount - 1];
    if (!imageId) return null;
    const itemPath = itemSegments.slice(0, -2).join('/');
    const query = itemPath ? `?item=${encodeURIComponent(itemPath)}` : '';
    return `/${categorySlug}/image/${imageId}${query}`;
  }, [categorySlug, itemSegments]);

  useEffect(() => {
    if (!imageRedirect) return;
    router.replace(imageRedirect);
  }, [imageRedirect, router]);

  const [textClass, setTextClass] = useState<string>('py-[12px] text-[32px]');
  const showTabContentSkeleton = useSkeletonOnce();
  const entranceReady = useEntranceAnimation();

  // Track navigation between items for re-triggering animation
  const prevItemSlug = useRef<string | null>(null);
  const [projectNavKey, setProjectNavKey] = useState(0);
  useEffect(() => {
    if (!resolvedSubItem) return;
    if (resolvedSubItem.slug !== prevItemSlug.current) {
      prevItemSlug.current = resolvedSubItem.slug;
      setProjectNavKey((k) => k + 1);
    }
  }, [resolvedSubItem]);

  // Combined key: changes when entrance fires (initial load) OR when item changes (navigation)
  const projectEntranceKey = `${entranceReady ? 'r' : 'h'}-${projectNavKey}`;

  // Construir la URL base del proyecto (sin /making-of)
  const baseProjectUrl = useMemo(() => {
    if (pathname.endsWith('/making-of')) {
      return pathname.replace('/making-of', '');
    }
    return pathname;
  }, [pathname]);

  useEffect(() => {
    if (!resolvedSubItem) return;
    if (hasMakingOfContent) return;
    if (!pathname.endsWith('/making-of')) return;
    router.replace(baseProjectUrl);
  }, [resolvedSubItem, hasMakingOfContent, pathname, baseProjectUrl, router]);

  // Determinar el tab activo basado en la URL
  const activeTabIndex = useMemo(() => {
    if (pathname.endsWith('/making-of')) {
      return 1; // Making Of tab
    }
    return 0; // Gallery tab (por defecto)
  }, [pathname]);

  // Handler para cambiar de tab
  const handleTabChange = (index: number) => {
    if (index === 1) {
      // Cambiar a Making Of - agregar /making-of a la URL
      const newUrl = `${baseProjectUrl}/making-of`;
      router.push(newUrl, { scroll: false });
    } else {
      // Cambiar a Gallery - usar la URL base (sin /making-of)
      router.push(baseProjectUrl, { scroll: false });
    }
  };

  useEffect(() => {
    // Solo actualizamos la clase de texto cuando el scrollDirection cambie
    if (scrollDirection === 'down') {
      setTextClass('pt-[24px] pb-[12px] md:pt-0 pb-[8px] md:pb-0 text-[24px]');
    } else {
      setTextClass('pt-[12px] pb-[12px] text-[32px]');
    }
  }, [scrollDirection]);

  useEffect(() => {
    if (!resolvedSubItem) return;

    if (collection?.slug) {
      setCollection(collection);
    }

    if (resolvedSubItem.slug !== currentItem?.slug) {
      setCurrentItem(resolvedSubItem);
    }

    if (collection?.slug && collection.slug !== currentCollection?.slug) {
      setCurrentCollection(collection);
    }
  }, [
    resolvedSubItem,
    collection,
    currentItem?.slug,
    currentCollection?.slug,
    setCurrentItem,
    setCollection,
    setCurrentCollection,
  ]);

  if (imageRedirect || !resolvedSubItem || !collection) {
    return null;
  }

  return (
    <div className="relative w-full">
      {/* Header con marca de agua emmchier.
          • Navbar click / primer load: visible con animación neon.
          • Sidebar click: oculto (display:none). Vuelve al hacer click en Navbar o refresh.
      */}
      {!hideHeader && (
        <div
          className={[
            'relative w-full',
            'pt-[56px] md:max-[1265px]:pt-[48px] min-[1266px]:pt-[72px]',
          ].join(' ')}
        >
          <div
            style={{
              opacity: 0.7,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            <Header className="emmchier" />
          </div>
        </div>
      )}

      {/* Tab con Gallery/Overview - Sticky debajo del Navbar */}
      <div className="relative">
        <Tab
          className="w-full"
          desktopBodyMarginTop="16px"
          bodyClasses="overflow-visible"
          defaultActiveIndex={activeTabIndex}
          onTabChange={hasMakingOfContent ? handleTabChange : undefined}
          tabListRowExtraClassName={
            !hasMakingOfContent
              ? 'max-md:hidden md:invisible md:pointer-events-none md:select-none'
              : undefined
          }
          lockedBodyTabIndex={!hasMakingOfContent ? 0 : undefined}
          headerClasses={`sticky top-[56px] md:max-[1265px]:top-[48px] min-[1266px]:top-[72px] z-30 flex h-auto min-h-0 w-full flex-col items-center justify-between gap-0 bg-primary-background px-0 py-[8px] min-[1266px]:py-[3px] sm:space-x-4 md:flex-row`}
          sideContent={
            <div
              className={[
                'flex h-auto min-h-0 min-w-0 flex-col items-start justify-center md:h-auto md:min-w-0 md:flex-1',
                'px-[16px] md:px-[16px]',
                textClass,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* Mobile + Tablet: mostrar parentGroupName encima del título */}
              {parentGroupName && (
                <Text
                  type="title"
                  heading="h4"
                  size="s"
                  weight="light"
                  className="mb-1"
                  style={{
                    fontSize: '14px',
                    lineHeight: '14px',
                    animation: `entrance-fade-up 400ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                    animationDelay: '0ms',
                    // key-driven re-run handled by parent container
                  }}
                  key={`group-${projectEntranceKey}`}
                >
                  {parentGroupName}
                </Text>
              )}
              {/* Título principal */}
              <Text
                type="title"
                heading="h3"
                size="l"
                weight="bold"
                className="flex items-center"
                style={{
                  fontSize: '40px',
                  lineHeight: '40px',
                  animation: `entrance-fade-up 450ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                  animationDelay: parentGroupName ? '60ms' : '0ms',
                }}
                key={`title-${projectEntranceKey}`}
              >
                {displayTitle}
              </Text>
            </div>
          }
        >
          {/* Galería */}
          <TabItem
            label={t.gallery}
            count={resolvedSubItem?.images?.length ?? 0}
          >
            <div className="relative pb-[72px]">
              {/* Skeleton overlay galería — fade-out 500ms */}
              {showTabContentSkeleton &&
                (!hasMakingOfContent || activeTabIndex === 0) && (
                  <div
                    className="absolute inset-0 z-10 bg-primary-background pointer-events-none"
                    aria-hidden="true"
                  >
                    <div className="w-full md:px-[16px]">
                      <TabContentSkeleton />
                    </div>
                  </div>
                )}
              <div className="md:px-[16px]">
                <Text
                  className="w-full md:w-[50%] mb-[16px] px-[16px] md:px-0"
                  key={`desc-${projectEntranceKey}`}
                  style={{
                    animation: `entrance-fade-up 440ms cubic-bezier(0.16, 1, 0.3, 1) both`,
                    animationDelay: '80ms',
                  }}
                >
                  {resolvedSubItem?.description}
                </Text>
                <ImageGallery
                  subItem={resolvedSubItem}
                  layoutMode={singleHeroGallery ? 'singleHero' : 'grid'}
                  groupName={parentGroupName ?? undefined}
                />
              </div>
            </div>
          </TabItem>

          <TabItem label={t.makingOf}>
            <div className="relative">
              {/* Skeleton overlay Making Of — fade-out 500ms */}
              {hasMakingOfContent && activeTabIndex === 1 && (
                <div
                  className="absolute inset-0 z-10 bg-primary-background pointer-events-none"
                  aria-hidden="true"
                  style={{
                    opacity: showTabContentSkeleton ? 1 : 0,
                    transition: showTabContentSkeleton
                      ? 'none'
                      : 'opacity 500ms ease-out',
                  }}
                >
                  <MakingOfSkeleton />
                </div>
              )}
              {hasMakingOfContent ? (
                <Information
                  subItem={resolvedSubItem}
                  categorySlug={categorySlug || collection.slug}
                />
              ) : (
                <div className="hidden" aria-hidden />
              )}
            </div>
          </TabItem>
        </Tab>
      </div>
    </div>
  );
}
