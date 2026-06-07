'use client';

import { useMemo } from 'react';
import { useModalStore } from '@/store/ui/ui-store';
import { Button, CloseIcon, Tooltip, ShareButton } from '@/components';

interface ModalHeaderProps {
  closeButton: boolean;
  fullWidthActions: boolean;
}

export default function ModalHeader({
  closeButton,
  fullWidthActions,
}: ModalHeaderProps) {
  const { closeModal, images, projectName, currentImage, sharePaths } =
    useModalStore();

  const currentSharePath = useMemo(() => {
    const currentIndex = images.indexOf(currentImage);
    const sharePath = sharePaths[currentIndex];
    if (sharePath) return sharePath;
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  }, [images, currentImage, sharePaths]);

  if (!closeButton) return null;

  return (
    <>
      {/* Desktop: Header completo */}
      <div className="absolute bottom-0 min-w-[320px] left-0 right-0 md:top-0 z-301 md:bg-transparent bg-transparent md:border-t-transparent h-[72px] flex flex-col md:flex-row items-center justify-center md:justify-between px-[8px] md:px-[24px] w-full">
        <div className="md:flex flex-col flex-1 hidden">
          {projectName && (
            <h2 className="text-white text-[24px] leading-[32px] font-bold mb-1">
              {projectName}
            </h2>
          )}
          {images && (
            <span className="text-muted-foreground text-sm">
              {images.length} image{images.length !== 1 && 's'}
            </span>
          )}
        </div>
        <div className="hidden md:flex gap-4">
          <ShareButton
            pathname={currentSharePath}
            title={projectName || 'Image'}
            ariaLabel="Share image"
            size="m"
            variant="outlined"
            state="selected"
            openBy="hover"
          />
          <Tooltip content="Close" direction="bottom-right">
            <Button
              ariaLabel="cerrar modal"
              onClick={closeModal}
              variant="outlined"
              fullWidth={fullWidthActions}
              icon={<CloseIcon />}
              iconButton
            />
          </Tooltip>
        </div>
      </div>
    </>
  );
}
