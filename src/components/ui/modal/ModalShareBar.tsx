'use client';

import { useState } from 'react';
import {
  Button,
  ShareIcon,
  ChevronLeftIcon,
  CopyIcon,
  CheckIcon,
  LinkedInIcon,
  FacebookIcon,
  WhatsAppIcon,
  ThreadsIcon,
  XIcon,
  Tooltip,
} from '@/components';
import { useTranslation } from '@/hooks/useTranslation';
import {
  copyLink,
  shareOnLinkedIn,
  shareOnFacebook,
  shareOnWhatsApp,
  shareOnThreads,
  shareOnX,
} from '@/utils/functions';

interface ModalShareBarProps {
  pathname: string;
  title: string;
}

interface ShareOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export const ModalShareBar = ({ pathname, title }: ModalShareBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const t = useTranslation();

  const handleCopyLink = async () => {
    await copyLink(pathname);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'linkedin',
      label: t.shareOnLinkedIn,
      icon: <LinkedInIcon color="currentColor" />,
      onClick: () => shareOnLinkedIn(pathname),
    },
    {
      id: 'facebook',
      label: t.shareOnFacebook,
      icon: <FacebookIcon color="currentColor" />,
      onClick: () => shareOnFacebook(pathname),
    },
    {
      id: 'whatsapp',
      label: t.shareOnWhatsapp,
      icon: <WhatsAppIcon color="currentColor" />,
      onClick: () => shareOnWhatsApp(pathname, title),
    },
    {
      id: 'threads',
      label: t.shareOnThreads,
      icon: <ThreadsIcon color="currentColor" />,
      onClick: () => shareOnThreads(pathname, title),
    },
    {
      id: 'x',
      label: t.shareOnX,
      icon: <XIcon color="currentColor" />,
      onClick: () => shareOnX(pathname, title),
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* ── Copy — siempre visible, completamente autónomo a la izquierda ── */}
      <Tooltip
        content={isCopied ? t.copied : t.copyLink}
        direction="top"
        lapse={0}
        className="!z-[600]"
      >
        <Button
          ariaLabel={isCopied ? t.copied : t.copyLink}
          onClick={handleCopyLink}
          variant="filled"
          state="enabled"
          size="m"
          className={[
            '!bg-secondary-background hover:!bg-indigo-100',
            isCopied ? '!text-green-400' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          icon={
            isCopied ? (
              <CheckIcon size="md" className="!text-green-400" />
            ) : (
              <CopyIcon color="currentColor" />
            )
          }
          iconButton
        />
      </Tooltip>

      {/* ── Share group — se expande independientemente a la derecha ── */}
      <div className="flex items-center">
        {/*
         * Icons animados — NO overflow:hidden aquí (los tooltips serían clipeados).
         * Cada ícono anima su propio width + opacity.
         */}
        {shareOptions.map((opt, i) => {
          const openDelay = i * 35;
          const closeDelay = (shareOptions.length - 1 - i) * 20;
          const delay = isOpen ? openDelay : closeDelay;

          return (
            <Tooltip
              key={opt.id}
              content={opt.label}
              direction="top"
              lapse={0}
              className="!z-[600]"
            >
              <div
                style={{
                  width: isOpen ? '40px' : '0px',
                  marginRight: isOpen ? '4px' : '0px',
                  transition: [
                    `width 360ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
                    `margin-right 360ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
                  ].join(', '),
                }}
              >
                <button
                  aria-label={opt.label}
                  onClick={opt.onClick}
                  style={{
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    transition: `opacity 220ms ease ${delay}ms`,
                  }}
                  className="flex items-center justify-center w-10 h-10 shrink-0 text-primary-text hover:text-selected-text transition-colors duration-200"
                >
                  {opt.icon}
                </button>
              </div>
            </Tooltip>
          );
        })}

        {/* Toggle — Share / Chevron Left para cerrar */}
        <Button
          ariaLabel={isOpen ? 'close share options' : 'share image'}
          onClick={() => setIsOpen((v) => !v)}
          variant="filled"
          state="enabled"
          size="m"
          className="!bg-secondary-background hover:!bg-indigo-100"
          icon={
            isOpen ? <ChevronLeftIcon /> : <ShareIcon viewBox="0 0 25 25" />
          }
          iconButton
        />
      </div>
    </div>
  );
};
