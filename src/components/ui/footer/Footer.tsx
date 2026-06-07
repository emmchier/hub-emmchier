'use client';
import Link from 'next/link';
import { useUIStore } from '@/store/ui/ui-store';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSkeletonOnce } from '@/hooks/useSkeletonOnce';
import { ButtonGroup, ButtonGroupItem } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';

export const Footer = () => {
  const { isSidebarOpen, language } = useUIStore();
  const t = useTranslation();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const showSkeleton = useSkeletonOnce();
  const isWideSidebarLayout = useMediaQuery('(min-width: 1266px)');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isContactPage = isMounted && Boolean(pathname?.startsWith('/contact'));
  const isLegalsPage = isMounted && pathname === '/legals';

  if (showSkeleton) {
    return null;
  }

  return (
    <footer
      role="contentinfo"
      className={[
        'bottom-0 left-0 right-0 soft mt-auto shrink-0 pt-[32px] md:pt-[64px] px-[24px]',
        // Sidebar collapsed (wide layout only): extra left padding for expand control
        !isContactPage &&
        !isLegalsPage &&
        !isSidebarOpen &&
        isMounted &&
        isWideSidebarLayout
          ? 'min-[1266px]:pl-[48px]'
          : '',
        'flex min-h-[80px] items-center justify-start py-[12px] md:justify-center',
        'box-border',
        // Footer text is intentionally excluded from global primary text color.
        'text-[#437B9A]',
        isContactPage || isLegalsPage ? 'w-full' : '',
        !isContactPage &&
        !isLegalsPage &&
        isSidebarOpen &&
        isMounted &&
        isWideSidebarLayout
          ? 'min-[1266px]:ml-[20%] min-[1266px]:w-[80%]'
          : '',
        !isContactPage &&
        !isLegalsPage &&
        (!isSidebarOpen || !isWideSidebarLayout || !isMounted)
          ? 'min-[1266px]:ml-0 min-[1266px]:w-full'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'mx-auto w-full max-w-full',
          'flex items-center justify-between gap-4',
          'text-sm text-left',
          isContactPage || isLegalsPage ? 'w-full' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex min-w-0 flex-col gap-[4px] md:flex-row md:flex-nowrap md:items-center md:gap-[4px]">
          <span className="whitespace-nowrap text-left">
            2026 © Emmanuel Chierchie
          </span>

          <div className="flex flex-row flex-wrap items-center justify-start gap-[4px] md:contents">
            <span className="hidden shrink-0 md:inline" aria-hidden>
              |
            </span>

            <Link
              href="/legals"
              className="text-left whitespace-nowrap hover:text-selected-text transition-colors"
            >
              {t.legals}
            </Link>

            <span className="shrink-0" aria-hidden>
              |
            </span>

            <span className="whitespace-nowrap text-left">
              {t.poweredBy}{' '}
              <a
                href="https://github.com/emmchier"
                target="_blank"
                rel="noopener noreferrer"
                className="underline! hover:text-selected-text soft inline"
              >
                me
              </a>
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center">
          <ButtonGroup>
            <ButtonGroupItem
              id="english"
              icon="EN"
              tooltipContent="English lang"
              tooltipEnabled={false}
              selected={isMounted && language === 'en'}
              onClick={() => {
                if (language !== 'en') {
                  document.dispatchEvent(
                    new CustomEvent('languageToggleRequest')
                  );
                }
              }}
            />
            <ButtonGroupItem
              id="spanish"
              icon="ES"
              tooltipContent="Spanish Lang"
              tooltipEnabled={false}
              selected={isMounted && language === 'es'}
              onClick={() => {
                if (language !== 'es') {
                  document.dispatchEvent(
                    new CustomEvent('languageToggleRequest')
                  );
                }
              }}
            />
          </ButtonGroup>
        </div>
      </div>
    </footer>
  );
};
