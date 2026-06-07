'use client';

import { useState } from 'react';
import { Button, ShareIcon, Dropdown, CheckIcon } from '@/components';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUIStore } from '@/store/ui/ui-store';
import { useTranslation } from '@/hooks/useTranslation';
import {
  copyLink,
  shareOnLinkedIn,
  shareOnFacebook,
  shareOnInstagram,
  shareOnThreads,
  shareOnWhatsApp,
  shareOnX,
} from '@/utils/functions';

interface ShareButtonProps {
  pathname: string;
  title: string;
  ariaLabel?: string;
  size?: 's' | 'm' | 'l';
  variant?: 'filled' | 'outlined' | 'text';
  state?: 'enabled' | 'selected' | 'activated' | 'disabled';
  className?: string;
  openBy?: 'click' | 'hover';
  /** Extra classes for the dropdown menu (e.g. z-index override). */
  dropdownMenuClassName?: string;
  /** Alignment of the desktop dropdown menu. */
  dropdownAlignment?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  /** Width of the desktop dropdown menu. */
  dropdownWidth?: string;
}

export const ShareButton = ({
  pathname,
  title,
  ariaLabel,
  size = 's',
  variant = 'filled',
  state = 'enabled',
  className,
  openBy = 'click',
  dropdownMenuClassName,
  dropdownAlignment = 'bottomRight',
  dropdownWidth = 'w-[200px]',
}: ShareButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const isNarrowViewport = useMediaQuery('(max-width: 1023px)');
  const { openBottomSheet } = useUIStore();
  const t = useTranslation();

  // Instagram siempre se muestra en el BottomSheet (modo share)

  const handleCopyLink = async () => {
    await copyLink(pathname);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleShareClick = () => {
    // En mobile, abrir BottomSheet en modo share
    if (isNarrowViewport) {
      openBottomSheet({
        mode: 'share',
        shareData: {
          pathname,
          title,
        },
      });
      return;
    }
  };

  const shareOptions = [
    {
      value: 'copy-link',
      label: isCopied ? t.copied : t.copyLink,
      icon: isCopied ? (
        <CheckIcon color="currentColor" size="sm" className="text-green-500" />
      ) : undefined,
      onClick: handleCopyLink,
      className: isCopied ? '!text-green-500' : '',
    },
    {
      value: 'linkedin',
      label: t.shareOnLinkedIn,
      onClick: () => shareOnLinkedIn(pathname),
    },
    {
      value: 'facebook',
      label: t.shareOnFacebook,
      onClick: () => shareOnFacebook(pathname),
    },
    {
      value: 'whatsapp',
      label: t.shareOnWhatsapp,
      onClick: () => shareOnWhatsApp(pathname, title),
    },
    // Instagram only on mobile/tablet — Web Share API; desktop has no share endpoint
    ...(!isNarrowViewport
      ? []
      : [
          {
            value: 'instagram',
            label: t.shareOnInstagram,
            onClick: () => shareOnInstagram(pathname, title),
          },
        ]),
    {
      value: 'threads',
      label: t.shareOnThreads,
      onClick: () => shareOnThreads(pathname, title),
    },
    {
      value: 'x',
      label: t.shareOnX,
      onClick: () => shareOnX(pathname, title),
    },
  ];

  // En mobile, usar el botón directamente sin Dropdown
  if (isNarrowViewport) {
    return (
      <Button
        ariaLabel={ariaLabel || `Share ${title}`}
        size={size}
        variant={variant}
        state={state}
        className={className}
        icon={<ShareIcon viewBox="0 0 25 25" />}
        iconButton
        onClick={handleShareClick}
      />
    );
  }

  return (
    <Dropdown
      trigger={
        <Button
          ariaLabel={ariaLabel || `Share ${title}`}
          size={size}
          variant={variant}
          state={state}
          className={className}
          icon={<ShareIcon viewBox="0 0 25 25" />}
          iconButton
        />
      }
      listItems={shareOptions}
      menuAlignment={dropdownAlignment}
      openBy={openBy}
      menuWidth={dropdownWidth}
      closeOnItemClick={false}
      showIcons={true}
      iconPosition="right"
      className={dropdownMenuClassName}
    />
  );
};
