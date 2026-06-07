'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Button,
  Tooltip,
} from '@/components';
import { useModalStore } from '@/store/ui/ui-store';

interface ModalFooterProps {
  /** Modo embebido: deja de usar `fixed` y se comporta como elemento de flujo
   *  dentro del contenedor del área de contenido. Los botones prev/next se
   *  posicionan con `absolute` relativo al contenedor padre `relative`. */
  embedded?: boolean;
  /** Increments each time the modal opens — triggers thumbnail wave animation. */
  animKey?: number;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  embedded = false,
  animKey = 0,
}) => {
  const {
    images,
    currentImage,
    setCurrentImage,
    goToNextImage,
    goToPreviousImage,
  } = useModalStore();

  const thumbnailsRef = useRef<(HTMLDivElement | null)[]>([]);
  const thumbnailsScrollRef = useRef<HTMLDivElement>(null);
  const [shouldCenterThumbnails, setShouldCenterThumbnails] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const container = thumbnailsScrollRef.current;
    if (!container) return;

    const updateStates = () => {
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;

      const shouldCenter = scrollWidth <= clientWidth + 1;
      setShouldCenterThumbnails(shouldCenter);
      setHasOverflow(scrollWidth > clientWidth + 1);
    };

    const observer = new ResizeObserver(updateStates);
    observer.observe(container);

    const timeout = setTimeout(updateStates, 100);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [images.length]);

  useEffect(() => {
    const index = images.findIndex((img) => img === currentImage);
    const el = thumbnailsRef.current[index];
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentImage, images]);

  return (
    <>
      {/* Botones prev/next en tablet y desktop — solo en modo modal normal. */}
      {!embedded && (
        <div className="hidden md:block fixed inset-0 pointer-events-none z-[301]">
          <div className="absolute left-[24px] top-1/2 -translate-y-1/2 pointer-events-auto">
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
          </div>
          <div className="absolute right-[24px] top-1/2 -translate-y-1/2 pointer-events-auto">
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
        </div>
      )}

      {/* Footer con thumbnails y botones (mobile) */}
      <div
        className={
          embedded
            ? 'shrink-0 relative bg-primary-background px-[16px] pt-3 pb-3 group'
            : 'fixed bottom-0 left-0 right-0 z-[300] bg-primary-background px-[16px] pt-2 pb-[48px] group'
        }
      >
        {/* Thumbnails */}
        <div
          className={embedded ? 'relative' : 'relative mb-4'}
          style={embedded ? undefined : { marginTop: '-16px' }}
        >
          {hasOverflow && (
            <div className="hidden sm:group-hover:flex absolute left-0 top-1/2 z-10 -translate-y-1/2">
              <Button
                ariaLabel="Scroll left"
                onClick={() => {
                  thumbnailsScrollRef.current?.scrollBy({
                    left: -150,
                    behavior: 'smooth',
                  });
                }}
                className="w-[24px]! h-[72px] bg-gray! opacity-80 hover:opacity-100 soft"
                variant="outlined"
                icon={<ChevronLeftIcon />}
                iconButton
              />
            </div>
          )}

          {hasOverflow && (
            <div className="hidden sm:group-hover:flex absolute right-0 top-1/2 z-10 -translate-y-1/2">
              <Button
                ariaLabel="Scroll right"
                onClick={() => {
                  thumbnailsScrollRef.current?.scrollBy({
                    left: 150,
                    behavior: 'smooth',
                  });
                }}
                className="w-[24px]! h-[72px] bg-gray! opacity-80 hover:opacity-100 soft"
                variant="outlined"
                icon={<ChevronRightIcon />}
                iconButton
              />
            </div>
          )}

          <div
            ref={thumbnailsScrollRef}
            className={`scrollbar-hide flex w-full gap-2 overflow-x-auto ${
              shouldCenterThumbnails ? 'justify-center' : 'justify-start'
            }`}
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
              scrollBehavior: 'smooth',
              scrollSnapType: 'x proximity',
            }}
          >
            {images.map((img, index) => (
              <div
                // key tied to animKey forces remount on each modal open,
                // which restarts the CSS entrance animation.
                key={`${animKey}-thumb-${index}`}
                ref={(el) => {
                  thumbnailsRef.current[index] = el;
                }}
                className={`relative h-[80px] w-[80px] min-w-[80px] cursor-pointer border-5 transition-all ${
                  img === currentImage
                    ? 'border-selected-text scale-100'
                    : 'border-transparent'
                }`}
                style={{
                  scrollSnapAlign: 'center',
                  // Staggered wave: each thumbnail slides up from below.
                  // Index 0 appears at 120ms (after pixel reveal starts),
                  // subsequent ones cascade with 35ms gap.
                  animation: `entrance-fade-up 380ms cubic-bezier(0.16, 1, 0.3, 1) ${120 + index * 17}ms both`,
                }}
                onClick={() => setCurrentImage(img)}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${index}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Botones prev/next — solo en mobile */}
        <div className="flex md:hidden items-center justify-between relative mt-4">
          <Tooltip content="Previous image" direction="top" openBy="click">
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
          <Tooltip content="Next image" direction="top" openBy="click">
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
      </div>
    </>
  );
};
