'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDataStore } from '../../../../store/data/data-store';
import { useModalStore, useUIStore } from '@/store/ui/ui-store';
import { CONTENTFUL_LOCALE } from '@/i18n/translations';
import { WorkItem } from '@/interfaces';
import { slugify } from '@/utils/functions';
import { ModalBody } from '@/components/ui/modal/ModalBody';
import { ModalFooter } from '@/components/ui/modal/ModalFooter';
import { ModalShareBar } from '@/components/ui/modal/ModalShareBar';
import {
  Button,
  CloseIcon,
  ShareButton,
  ChevronLeftIcon,
  ChevronRightIcon,
  Tooltip,
} from '@/components';

// ── Helpers ────────────────────────────────────────────────────────────────

type ContentfulEntry = {
  sys?: { id?: string };
  fields?: Record<string, unknown>;
};

type ContentfulFields = Record<string, unknown>;

const getContentfulString = (
  fields: ContentfulFields | undefined,
  key: string
) => (typeof fields?.[key] === 'string' ? fields[key] : '') as string;

const getContentfulArray = (
  fields: ContentfulFields | undefined,
  key: string
) => (Array.isArray(fields?.[key]) ? fields[key] : []) as unknown[];

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
  const techsRaw = getContentfulArray(fields, 'techs');
  const tools = techsRaw
    .map((tech: unknown) => {
      const t = tech as ContentfulEntry;
      return t?.fields ? getContentfulString(t.fields, 'name') : null;
    })
    .filter(Boolean) as string[];
  const publishedDate = getContentfulString(fields, 'publishedDate');
  const year = publishedDate ? String(publishedDate).slice(0, 4) : undefined;
  const makingOf = fields?.makingOf as WorkItem['makingOf'];
  const images = getContentfulArray(fields, 'images') as WorkItem['images'];
  const orderValue = fields?.order;
  const order = typeof orderValue === 'number' ? orderValue : undefined;
  const readingTimeValue = fields?.readingTime;
  const readingTime =
    typeof readingTimeValue === 'number' ? readingTimeValue : undefined;
  return {
    name: name || '',
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

const hasResolvedProjectImages = (entry?: {
  fields?: ContentfulFields;
}): boolean => {
  const projectsTree = entry?.fields?.projectsTree;
  if (!Array.isArray(projectsTree) || projectsTree.length === 0) return false;
  const checkEntry = (e: unknown): boolean => {
    const fields = (e as { fields?: ContentfulFields })?.fields;
    if (!fields) return false;
    if (Array.isArray(fields.images) && (fields.images as unknown[]).length > 0)
      return true;
    const items = fields.items;
    if (Array.isArray(items)) return (items as unknown[]).some(checkEntry);
    return false;
  };
  return (projectsTree as unknown[]).some(checkEntry);
};

/**
 * Derives a friendly display name for an image.
 * Priority: alt text → filename from URL → "Image N".
 */
function resolveImageName(alt: string, url: string, index: number): string {
  if (alt && alt.trim()) return alt.trim();
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split('/').pop() ?? '';
    const name = filename.split('.')[0];
    if (name && name.length < 80 && !/^[a-z0-9]{20,}$/.test(name)) return name;
  } catch {
    // ignore
  }
  return `Image ${index + 1}`;
}

// ── Props ──────────────────────────────────────────────────────────────────

interface SharedImagePageClientProps {
  categorySlug: string;
  itemSegments: string[];
  imageId: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function SharedImagePageClient({
  categorySlug,
  itemSegments,
  imageId,
}: SharedImagePageClientProps) {
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
  const {
    images: storeImages,
    imageNames: storeImageNames,
    projectName: storeProjectName,
    currentImage: storeCurrentImage,
    setCurrentImage,
    goToNextImage,
    goToPreviousImage,
  } = useModalStore();

  const [storeReady, setStoreReady] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // Desktop thumbnail refs
  const deskThumbsRef = useRef<(HTMLDivElement | null)[]>([]);
  const deskScrollRef = useRef<HTMLDivElement>(null);

  // ── Data resolution ────────────────────────────────────────────────────

  const projectsTree = useMemo(() => {
    const cat = currentCategory as { fields?: ContentfulFields } | undefined;
    if (!cat) return [];
    const fields = cat.fields;
    const slug =
      (fields && typeof fields.slug === 'string' && fields.slug) ||
      (cat as { slug?: string }).slug ||
      '';
    if (slug !== categorySlug) return [];
    const source =
      (fields && Array.isArray(fields.projectsTree) && fields.projectsTree) ||
      (cat as { projectsTree?: unknown[] }).projectsTree ||
      [];
    return Array.isArray(source) ? source : [];
  }, [currentCategory, categorySlug]);

  const resolvedSelection = useMemo(() => {
    const cleanSegments = itemSegments.filter((s) => s !== 'making-of');

    const resolveFromSegments = (segments: string[]) => {
      const [groupSlug, projectSlug] = segments;
      let found: ContentfulEntry | null = null;
      if (groupSlug && projectSlug) {
        const group = projectsTree.find(
          (entry: unknown) =>
            getEntrySlug(entry as ContentfulEntry) === groupSlug
        ) as ContentfulEntry | undefined;
        const groupItems = getContentfulArray(
          group?.fields,
          'items'
        ) as ContentfulEntry[];
        if (groupItems.length > 0) {
          found =
            groupItems.find((entry) => getEntrySlug(entry) === projectSlug) ??
            null;
        }
      }
      if (!found && segments.length > 0) {
        const fallbackSlug = segments[segments.length - 1];
        for (const entry of projectsTree as ContentfulEntry[]) {
          if (getEntrySlug(entry) === fallbackSlug) {
            found = entry;
            break;
          }
          const entryItems = getContentfulArray(
            entry?.fields,
            'items'
          ) as ContentfulEntry[];
          const nested = entryItems.find(
            (item) => getEntrySlug(item) === fallbackSlug
          );
          if (nested) {
            found = nested;
            break;
          }
        }
      }
      return found;
    };

    const findByImageId = (
      entries: ContentfulEntry[],
      parentSegments: string[]
    ): { entry: ContentfulEntry; segments: string[] } | null => {
      for (const entry of entries) {
        const slug = getEntrySlug(entry);
        const currentSegments = slug
          ? [...parentSegments, slug]
          : parentSegments;
        const images = getContentfulArray(entry?.fields, 'images') as Array<{
          id?: string;
        }>;
        if (images.some((img) => img?.id === imageId)) {
          return { entry, segments: currentSegments };
        }
        const childItems = getContentfulArray(
          entry?.fields,
          'items'
        ) as ContentfulEntry[];
        if (childItems.length > 0) {
          const nested = findByImageId(childItems, currentSegments);
          if (nested) return nested;
        }
      }
      return null;
    };

    if (cleanSegments.length > 0) {
      const bySegments = resolveFromSegments(cleanSegments);
      if (bySegments) return { entry: bySegments, segments: cleanSegments };
      const byImage = findByImageId(projectsTree as ContentfulEntry[], []);
      return byImage ?? { entry: null, segments: [] };
    }
    if (projectsTree.length === 0) return { entry: null, segments: [] };
    const resolved = findByImageId(projectsTree as ContentfulEntry[], []);
    return resolved ?? { entry: null, segments: [] };
  }, [itemSegments, projectsTree, imageId]);

  const selectedEntry = resolvedSelection.entry;
  const resolvedSegments = resolvedSelection.segments;

  const parentGroupName = useMemo<string | null>(() => {
    if (resolvedSegments.length < 2) return null;
    const groupSlug = resolvedSegments[0];
    const group = (projectsTree as ContentfulEntry[]).find(
      (entry) => getEntrySlug(entry) === groupSlug
    );
    if (!group) return null;
    const fields = group?.fields ?? {};
    return (
      (typeof fields.title === 'string' ? fields.title : '') ||
      (typeof fields.name === 'string' ? fields.name : '') ||
      null
    );
  }, [resolvedSegments, projectsTree]);

  const project = useMemo(() => {
    if (!selectedEntry) return null;
    return normalizeProject(selectedEntry);
  }, [selectedEntry]);

  const projectWithShare = useMemo(() => {
    if (!project) return null;
    const itemPath = resolvedSegments.length
      ? `?item=${encodeURIComponent(resolvedSegments.join('/'))}`
      : '';
    const shareBase = `/${categorySlug}/image`;
    const imagesWithShare = (project.images ?? []).map((img) => ({
      ...img,
      urlToShare: img.id ? `${shareBase}/${img.id}${itemPath}` : undefined,
    }));
    return { ...project, images: imagesWithShare };
  }, [project, categorySlug, resolvedSegments]);

  // ── Current image derived values ───────────────────────────────────────

  const currentIndex = storeImages.indexOf(storeCurrentImage);

  const currentSharePath = useMemo(() => {
    const images = projectWithShare?.images ?? project?.images ?? [];
    const itemPath = resolvedSegments.length
      ? `?item=${encodeURIComponent(resolvedSegments.join('/'))}`
      : '';
    const fallbackPath = `/${categorySlug}/image/${imageId}${itemPath}`;
    if (images.length === 0) return fallbackPath;
    const currentUrl =
      storeCurrentImage || images.find((img) => img.id === imageId)?.url;
    if (!currentUrl)
      return (
        images.find((img) => img.id === imageId)?.urlToShare ?? fallbackPath
      );
    return (
      images.find((img) => img.url === currentUrl)?.urlToShare ?? fallbackPath
    );
  }, [
    projectWithShare,
    project,
    storeCurrentImage,
    imageId,
    categorySlug,
    resolvedSegments,
  ]);

  const currentImageName = useMemo(
    () =>
      resolveImageName(
        storeImageNames[currentIndex] ?? '',
        storeCurrentImage,
        currentIndex
      ),
    [storeImageNames, currentIndex, storeCurrentImage]
  );

  // ── Effects ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (selectedEntry) setNotFound(false);
  }, [selectedEntry]);

  useEffect(() => {
    const ensureCategory = async () => {
      const cached = getCategoryForLang(language, categorySlug);
      if (
        cached &&
        hasResolvedProjectImages(cached as { fields?: ContentfulFields })
      ) {
        if (cached !== currentCategory) setCurrentCategory(cached);
        return;
      }
      const fetchKey = `${language}:${categorySlug}`;
      if (isCategoryFetching(fetchKey)) return;
      try {
        setFetchingCategory(fetchKey, true);
        const locale = CONTENTFUL_LOCALE[language];
        const res = await fetch(
          `/api/contentful/category/${categorySlug}?locale=${locale}`
        );
        const data = (await res.json()) as {
          item?: { fields?: Record<string, unknown> };
        };
        if (data?.item) {
          setCategoryForLang(language, categorySlug, data.item);
          setCurrentCategory(data.item);
        }
      } catch {
        setNotFound(true);
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
    const activeProject = projectWithShare ?? project;
    if (!activeProject || storeReady) return;
    const images = activeProject.images ?? [];
    const idx = images.findIndex((img) => img.id === imageId);
    if (idx === -1) {
      setNotFound(true);
      return;
    }
    setNotFound(false);
    const urls = images.map((i) => i.url);
    const names = images.map((img, i) =>
      resolveImageName((img as { alt?: string }).alt ?? '', img.url, i)
    );
    useModalStore.setState({
      images: urls,
      imageNames: names,
      sharePaths: images.map((img) => img.urlToShare || ''),
      currentImage: urls[idx],
      projectName: parentGroupName
        ? `${parentGroupName} / ${activeProject.name}`
        : activeProject.name,
      showModal: false,
    });
    setStoreReady(true);
    setAnimKey((k) => k + 1);
  }, [project, projectWithShare, imageId, storeReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (projectsTree.length === 0) return;
    if (selectedEntry) return;
    setNotFound(true);
  }, [projectsTree.length, selectedEntry]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push(galleryUrl);
      if (e.key === 'ArrowRight') goToNextImage();
      if (e.key === 'ArrowLeft') goToPreviousImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, goToNextImage, goToPreviousImage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll active desktop thumbnail into view
  useEffect(() => {
    const el = deskThumbsRef.current[currentIndex];
    if (el)
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
  }, [currentIndex]);

  // ── Derived ────────────────────────────────────────────────────────────

  const galleryUrl = `/${categorySlug}${resolvedSegments.length ? `/${resolvedSegments.join('/')}` : ''}`;

  // Outer container:
  // - Mobile/tablet (< 1266px): fixed fullscreen below navbar
  // - Desktop (≥ 1266px): relative, embedded in content area
  const outerCls = [
    'fixed left-0 right-0 bottom-0 top-[56px]',
    'md:max-[1265px]:top-[48px]',
    'min-[1266px]:relative min-[1266px]:top-auto min-[1266px]:left-auto',
    'min-[1266px]:right-auto min-[1266px]:bottom-auto',
    'min-[1266px]:w-full min-[1266px]:mt-[72px]',
    'min-[1266px]:h-[calc(100vh-72px)]',
    'flex flex-col overflow-hidden bg-primary-background',
  ].join(' ');

  // ── Not found / loading ────────────────────────────────────────────────

  if (notFound) {
    return (
      <div className={`${outerCls} items-center justify-center`}>
        <div className="text-center">
          <p className="text-primary-text mb-4">Image not found.</p>
          <Link
            href={galleryUrl}
            className="text-secondary-foreground underline"
          >
            Back to gallery
          </Link>
        </div>
      </div>
    );
  }

  if (!storeReady || storeImages.length === 0) {
    return (
      <div className={`${outerCls} items-center justify-center`}>
        <p className="text-primary-text">Loading…</p>
      </div>
    );
  }

  // ── Render — mirrors Modal layout exactly ──────────────────────────────

  return (
    <div
      className={[
        outerCls,
        // Desktop: flex-row (same split as Modal)
        'min-[1266px]:flex-row',
      ].join(' ')}
    >
      {/* ══════════════════════════════════════════════════════════════════
          MOBILE header (hidden on desktop ≥ 1266px)
      ══════════════════════════════════════════════════════════════════ */}
      <div
        className="min-[1266px]:hidden shrink-0 flex items-center justify-between px-4"
        style={{
          height: 'calc(56px + env(safe-area-inset-top))',
          paddingTop: 'calc(8px + env(safe-area-inset-top))',
        }}
      >
        <div className="flex flex-col justify-center min-w-0 flex-1">
          {storeProjectName && (
            <h2
              key={`si-title-${animKey}`}
              className="truncate text-white text-[16px] leading-[1.3] font-bold"
              style={{
                animation:
                  'entrance-fade-up 420ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both',
              }}
            >
              {storeProjectName}
            </h2>
          )}
          {storeImages.length > 1 && (
            <span
              key={`si-count-${animKey}`}
              className="text-primary-text text-xs leading-[1.4]"
              style={{
                animation:
                  'entrance-fade-up 420ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both',
              }}
            >
              {storeImages.length} images
            </span>
          )}
        </div>
        <div
          key={`si-actions-${animKey}`}
          className="shrink-0 flex gap-2 ml-4"
          style={{
            animation:
              'entrance-fade-up 380ms cubic-bezier(0.16, 1, 0.3, 1) 80ms both',
          }}
        >
          <ShareButton
            pathname={currentSharePath}
            title={storeProjectName || project?.name || 'Image'}
            ariaLabel="compartir imagen"
            size="m"
            variant="filled"
            state="selected"
            openBy="hover"
          />
          <Link href={galleryUrl}>
            <Button
              ariaLabel="volver a la galería"
              variant="outlined"
              state="selected"
              icon={<CloseIcon />}
              iconButton
            />
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          IMAGE AREA
          · Mobile/tablet: flex-1, full width
          · Desktop: left 50%, full height, 40px padding (mirrors Modal)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-[1266px]:flex-none min-[1266px]:w-1/2 min-[1266px]:h-full relative min-h-0 overflow-hidden min-[1266px]:p-10">
        <div className="relative w-full h-full">
          <ModalBody embedded animKey={animKey} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE footer — thumbnails + prev/next (hidden on desktop)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="min-[1266px]:hidden">
        <ModalFooter embedded animKey={animKey} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP right panel — header 30% + thumbnails grid + controls 70%
          Hidden below 1266px. Mirrors Modal exactly.
      ══════════════════════════════════════════════════════════════════ */}
      <div className="hidden min-[1266px]:flex flex-col w-1/2 h-full p-10">
        {/* Header 30% */}
        <div
          className="shrink-0 flex items-start justify-between pb-4"
          style={{ height: '30%' }}
        >
          {/* Left: image name + project subtitle + share bar */}
          <div className="flex flex-col justify-start min-w-0 flex-1 pr-4">
            <h2
              key={`si-img-name-${animKey}-${currentIndex}`}
              className="truncate text-white font-bold leading-[1.2] mb-1"
              style={{
                fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
                animation:
                  'entrance-fade-up 420ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both',
              }}
            >
              {currentImageName}
            </h2>
            {storeProjectName && (
              <p
                key={`si-proj-${animKey}-${currentIndex}`}
                className="text-primary-text truncate mb-4"
                style={{
                  fontSize: 'clamp(0.85rem, 1.2vw, 1rem)',
                  animation:
                    'entrance-fade-up 420ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both',
                }}
              >
                {storeProjectName}
              </p>
            )}
            <div
              key={`si-share-${animKey}`}
              style={{
                animation:
                  'entrance-fade-up 380ms cubic-bezier(0.16, 1, 0.3, 1) 140ms both',
              }}
            >
              <ModalShareBar
                pathname={currentSharePath}
                title={currentImageName}
              />
            </div>
          </div>

          {/* Right: close button (back to gallery) */}
          <div
            key={`si-close-desk-${animKey}`}
            className="shrink-0"
            style={{
              animation:
                'entrance-fade-up 380ms cubic-bezier(0.16, 1, 0.3, 1) 80ms both',
            }}
          >
            <Link href={galleryUrl}>
              <Button
                ariaLabel="volver a la galería"
                variant="outlined"
                state="selected"
                icon={<CloseIcon />}
                iconButton
              />
            </Link>
          </div>
        </div>

        {/* Body 70%: thumbnail grid + controls */}
        <div className="flex flex-col min-h-0" style={{ height: '70%' }}>
          {/* Thumbnail grid */}
          <div
            ref={deskScrollRef}
            className="flex-1 overflow-y-auto modal-thumb-scroll"
          >
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: 'repeat(auto-fill, 80px)' }}
            >
              {storeImages.map((img, index) => (
                <div
                  key={`${animKey}-dthumb-${index}`}
                  ref={(el) => {
                    deskThumbsRef.current[index] = el;
                  }}
                  className={`relative h-[80px] w-[80px] cursor-pointer border-[3px] transition-all ${
                    img === storeCurrentImage
                      ? 'border-selected-text'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    animation: `entrance-fade-up 380ms cubic-bezier(0.16, 1, 0.3, 1) ${120 + index * 17}ms both`,
                  }}
                  onClick={() => setCurrentImage(img)}
                >
                  <Image
                    src={img}
                    alt={storeImageNames[index] || `Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Controls: prev / next / counter */}
          <div
            key={`si-desk-controls-${animKey}`}
            className="shrink-0 flex items-center pt-4"
            style={{
              animation:
                'entrance-fade-up 380ms cubic-bezier(0.16, 1, 0.3, 1) 80ms both',
            }}
          >
            <div className="flex items-center gap-4">
              <Tooltip content="Previous image" direction="top">
                <Button
                  ariaLabel="previous image"
                  onClick={goToPreviousImage}
                  variant="outlined"
                  state="selected"
                  icon={<ChevronLeftIcon />}
                  iconButton
                  className="icon-16"
                />
              </Tooltip>
              <Tooltip content="Next image" direction="top">
                <Button
                  ariaLabel="next image"
                  onClick={goToNextImage}
                  variant="outlined"
                  state="selected"
                  icon={<ChevronRightIcon />}
                  iconButton
                  className="icon-16"
                />
              </Tooltip>
            </div>
            <span className="text-primary-text text-sm ml-8">
              {storeImages.length} images
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
