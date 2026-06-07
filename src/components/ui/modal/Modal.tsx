'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Image from 'next/image';
import { useModalStore } from '@/store/ui/ui-store';
import { ModalBody } from './ModalBody';
import { ModalFooter } from './ModalFooter';
import {
  Button,
  CloseIcon,
  ShareButton,
  ChevronLeftIcon,
  ChevronRightIcon,
  Tooltip,
} from '@/components';
import { ModalShareBar } from './ModalShareBar';
import { useTranslation } from '@/hooks/useTranslation';

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns a friendly display name for an image.
 * Priority: Contentful alt text → filename from URL → "Image N".
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

export const Modal = () => {
  const {
    showModal,
    closeButton,
    fullWidthActions,
    closeOnClickOverlay,
    closeModal,
    currentImage,
    images,
    imageNames,
    sharePaths,
    projectName,
    goToNextImage,
    goToPreviousImage,
    setCurrentImage,
  } = useModalStore();

  const t = useTranslation();
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [localImage, setLocalImage] = useState(currentImage);
  const [animKey, setAnimKey] = useState(0);

  // Desktop thumbnail grid refs
  const deskThumbsRef = useRef<(HTMLDivElement | null)[]>([]);
  const deskScrollRef = useRef<HTMLDivElement>(null);

  // ── Lifecycle ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!showModal && !isClosing) {
      setIsClosing(true);
      setIsVisible(false);
      const timer = setTimeout(() => setIsClosing(false), 100);
      return () => clearTimeout(timer);
    }
  }, [showModal, isClosing]);

  useEffect(() => {
    if (!showModal) return;
    setIsVisible(false);
    const id = requestAnimationFrame(() => {
      setIsVisible(true);
      setAnimKey((k) => k + 1);
    });
    return () => cancelAnimationFrame(id);
  }, [showModal]);

  useEffect(() => {
    if (currentImage !== localImage) {
      setTimeout(() => setLocalImage(currentImage), 100);
    }
  }, [currentImage, localImage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showModal) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') goToNextImage();
      if (e.key === 'ArrowLeft') goToPreviousImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, goToNextImage, goToPreviousImage, closeModal]);

  // Scroll active desktop thumbnail into view
  useEffect(() => {
    const idx = images.indexOf(currentImage);
    const el = deskThumbsRef.current[idx];
    if (el)
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
  }, [currentImage, images]);

  // ── Derived values ─────────────────────────────────────────────────────

  const currentIndex = images.indexOf(currentImage);

  const currentSharePath = useMemo(() => {
    const sharePath = sharePaths[currentIndex];
    if (sharePath) return sharePath;
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  }, [sharePaths, currentIndex]);

  const currentImageName = useMemo(
    () =>
      resolveImageName(
        imageNames[currentIndex] ?? '',
        currentImage,
        currentIndex
      ),
    [imageNames, currentIndex, currentImage]
  );

  if ((!showModal && !isClosing) || !currentImage) return null;

  const visibleClass =
    isVisible && showModal ? 'scale-100 opacity-100' : 'scale-90 opacity-0';

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-300 flex flex-col bg-primary-background transition-all duration-300 ease-in-out ${visibleClass}`}
      style={{ pointerEvents: showModal ? 'auto' : 'none' }}
      onClick={closeOnClickOverlay ? closeModal : undefined}
    >
      <div
        className="flex flex-col md:flex-row h-full w-full touch-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ════════════════════════════════════════════════════════════════
            MOBILE — Header (hidden on desktop)
        ════════════════════════════════════════════════════════════════ */}
        <div
          className="md:hidden shrink-0 flex items-center justify-between px-4"
          style={{
            height: 'calc(56px + env(safe-area-inset-top))',
            paddingTop: 'calc(8px + env(safe-area-inset-top))',
          }}
        >
          <div className="flex flex-col justify-center min-w-0 flex-1">
            {projectName && (
              <h2
                key={`modal-title-${animKey}`}
                className="truncate text-white text-[16px] leading-[1.3] font-bold"
                style={{
                  animation:
                    'entrance-fade-up 420ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both',
                }}
              >
                {projectName}
              </h2>
            )}
            {images.length > 1 && (
              <span
                key={`modal-count-${animKey}`}
                className="text-primary-text text-xs leading-[1.4]"
                style={{
                  animation:
                    'entrance-fade-up 420ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both',
                }}
              >
                {images.length} {images.length !== 1 ? t.images : t.image}
              </span>
            )}
          </div>

          {closeButton && (
            <div
              key={`modal-actions-${animKey}`}
              className="shrink-0 flex gap-2 ml-4"
              style={{
                animation:
                  'entrance-fade-up 380ms cubic-bezier(0.16, 1, 0.3, 1) 80ms both',
              }}
            >
              <ShareButton
                pathname={currentSharePath}
                title={projectName || 'Image'}
                ariaLabel="compartir imagen"
                size="m"
                variant="filled"
                state="selected"
                openBy="hover"
              />
              <Button
                ariaLabel="cerrar modal"
                onClick={closeModal}
                variant="outlined"
                fullWidth={fullWidthActions}
                icon={<CloseIcon />}
                iconButton
              />
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            IMAGE AREA
            · Mobile:  flex-1 (fills space between mobile header/footer)
            · Desktop: left 50%, full height, 40px padding around image
        ════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 md:flex-none md:w-1/2 md:h-full relative min-h-0 overflow-hidden md:p-10">
          {/*
           * Inner `relative` div is the containing block for ModalBody's
           * `absolute inset-0`, so the image respects the 40px desktop padding.
           */}
          <div className="relative w-full h-full">
            <ModalBody embedded animKey={animKey} />
          </div>

          {/* no close button here on desktop — it lives in the right panel header */}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            MOBILE — Footer thumbnails + controls (hidden on desktop)
        ════════════════════════════════════════════════════════════════ */}
        <div className="md:hidden">
          <ModalFooter embedded animKey={animKey} />
        </div>

        {/* ════════════════════════════════════════════════════════════════
            DESKTOP — Right panel: header (30%) + thumbnails grid + controls (70%)
            Hidden on mobile.
        ════════════════════════════════════════════════════════════════ */}
        <div className="hidden md:flex flex-col w-1/2 h-full p-10">
          {/* ── Header 30% ───────────────────────────────────────────── */}
          <div
            className="shrink-0 flex items-start justify-between pb-4"
            style={{ height: '30%' }}
          >
            {/* Left: image name + subtitle + share */}
            <div className="flex flex-col justify-start min-w-0 flex-1 pr-4">
              {/* Image name */}
              <h2
                key={`modal-img-name-${animKey}-${currentIndex}`}
                className="truncate text-white font-bold leading-[1.2] mb-1"
                style={{
                  fontSize: 'clamp(1.25rem, 2.5vw, 2rem)',
                  animation:
                    'entrance-fade-up 420ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both',
                }}
              >
                {currentImageName}
              </h2>

              {/* Project / group subtitle */}
              {projectName && (
                <p
                  key={`modal-proj-${animKey}-${currentIndex}`}
                  className="text-primary-text truncate mb-4"
                  style={{
                    fontSize: 'clamp(0.85rem, 1.2vw, 1rem)',
                    animation:
                      'entrance-fade-up 420ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both',
                  }}
                >
                  {projectName}
                </p>
              )}

              {/* Share bar */}
              <div
                key={`modal-share-${animKey}`}
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

            {/* Right: close button */}
            {closeButton && (
              <div
                key={`modal-close-desk-${animKey}`}
                className="shrink-0"
                style={{
                  animation:
                    'entrance-fade-up 380ms cubic-bezier(0.16, 1, 0.3, 1) 80ms both',
                }}
              >
                <Button
                  ariaLabel="cerrar modal"
                  onClick={closeModal}
                  variant="outlined"
                  fullWidth={fullWidthActions}
                  icon={<CloseIcon />}
                  iconButton
                />
              </div>
            )}
          </div>

          {/* ── Body 70%: thumbnail grid + controls ─────────────────── */}
          <div className="flex flex-col min-h-0" style={{ height: '70%' }}>
            {/* Thumbnail grid — scrollable with visible scrollbar */}
            <div
              ref={deskScrollRef}
              className="flex-1 overflow-y-auto modal-thumb-scroll"
            >
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: 'repeat(auto-fill, 80px)' }}
              >
                {images.map((img, index) => (
                  <div
                    key={`${animKey}-dthumb-${index}`}
                    ref={(el) => {
                      deskThumbsRef.current[index] = el;
                    }}
                    className={`relative h-[80px] w-[80px] cursor-pointer border-[3px] transition-all ${
                      img === currentImage
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
                      alt={imageNames[index] || `Thumbnail ${index + 1}`}
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
              key={`modal-desk-controls-${animKey}`}
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
                {images.length} {images.length !== 1 ? t.images : t.image}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
