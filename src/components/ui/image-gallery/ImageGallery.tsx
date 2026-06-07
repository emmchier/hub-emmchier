'use client';

import { Pagination, ImageGridItem } from '@/components';
import { GalleryImage, WorkItem } from '@/interfaces';
import { useModalStore, useUIStore } from '@/store/ui/ui-store';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface Props {
  subItem: WorkItem;
  isLoading?: boolean;
  layoutMode?: 'grid' | 'singleHero';
  /** Nombre del grupo padre (navigation group). Si se pasa, el modal muestra "Group / Project". */
  groupName?: string;
}

const defaultPatterns = [
  'md:w-[50%] h-[50vh]',
  'md:w-[25%] h-[50vh]',
  'md:w-[25%] h-[50vh]',
  'md:w-[25%] h-[50vh]',
  'md:w-[25%] h-[50vh]',
  'md:w-[50%] h-[50vh]',
  'md:w-[33.33%] h-[50vh]',
  'md:w-[33.33%] h-[50vh]',
  'md:w-[33.33%] h-[50vh]',
];

const colors = [
  '#F6D4C2',
  '#74BDE8',
  '#67CFCB',
  '#67CFCB',
  '#74BDE8',
  '#F6D4C2',
];

export const ImageGallery = ({
  subItem,
  isLoading,
  layoutMode = 'grid',
  groupName,
}: Props) => {
  const images = subItem?.images ?? [];
  const { breakpoint } = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const { currentPage, itemsPerPage } = useUIStore();
  const { openModal } = useModalStore();

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedImages = images.slice(startIndex, endIndex);

  // no debug logging

  // Medir el ancho del contenedor (solo mobile)
  useEffect(() => {
    if (!isMobile) {
      setContainerWidth(0);
      return;
    }

    const measureContainer = () => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        setContainerWidth(containerRect.width);
      }
    };

    // Pequeño delay para asegurar que el DOM esté renderizado
    const timer = setTimeout(() => {
      measureContainer();
    }, 0);

    const resizeObserver = new ResizeObserver(measureContainer);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', measureContainer);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureContainer);
    };
  }, [isMobile, paginatedImages.length]);

  // Memorizar el cálculo del tamaño de la imagen basado en el ancho del contenedor
  const imageSize = useMemo(() => {
    if (!isMobile || containerWidth === 0) {
      return 0;
    }
    // 3 columnas con 2 gaps de 1px entre ellas
    // El border de 2px está incluido en box-sizing: border-box, así que no necesitamos restarlo
    const totalGaps = 2; // 2 gaps de 1px = 2px total
    return (containerWidth - totalGaps) / 3;
  }, [isMobile, containerWidth]);

  const isSingleHero = layoutMode === 'singleHero' && images.length === 1;

  if (isSingleHero && !isLoading) {
    const image = images[0];
    const color = colors[0];
    return (
      <div ref={containerRef} className="mb-5 w-full">
        <ImageGridItem
          interactive={false}
          illustration={{
            image: image.url,
            altText: image.alt || subItem.name || 'Untitled',
            title: subItem.name ?? 'Untitled',
            slug: subItem.slug ?? '',
            createdAt: subItem.createdAt ?? '',
          }}
          index={0}
          isSkeleton={false}
          className="w-full min-h-[42vh] md:min-h-[50vh] h-[55vh] max-h-[85vh] border border-primary-background overflow-hidden"
          color={color}
        />
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`${isMobile ? 'grid grid-cols-3' : 'flex flex-wrap'} mb-5`}
      >
        {paginatedImages.map((image: GalleryImage, index: number) => {
          const color = colors[index % colors.length];
          const pattern = defaultPatterns[index % defaultPatterns.length];

          return (
            <ImageGridItem
              key={index}
              onClick={() =>
                openModal({
                  images: images.map((img) => img.url),
                  imageNames: images.map((img) => img.alt || ''),
                  sharePaths: images.map((img) => img.urlToShare || ''),
                  currentImage: image.url,
                  projectName: groupName
                    ? `${groupName} / ${subItem.name}`
                    : subItem.name,
                  closeButton: true,
                })
              }
              illustration={{
                image: image.url,
                altText: image.alt || subItem.name || 'Untitled',
                title: subItem.name ?? 'Untitled',
                slug: subItem.slug ?? '',
                createdAt: subItem.createdAt ?? '',
              }}
              index={index}
              isSkeleton={isLoading}
              className={`${isMobile ? '' : 'md:w-1/2'} ${pattern} border border-primary-background overflow-hidden cursor-pointer`}
              style={
                isMobile && imageSize > 0
                  ? {
                      width: `${imageSize}px`,
                      height: `${imageSize}px`,
                      flexShrink: 0,
                    }
                  : undefined
              }
              color={color}
            />
          );
        })}
      </div>

      <Pagination totalItems={images.length} />
    </>
  );
};
