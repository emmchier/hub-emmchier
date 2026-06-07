'use client';
import Link from 'next/link';
import { useUIStore } from '@/store/ui/ui-store';
import { useEffect, useState } from 'react';
import { useSkeletonOnce } from '@/hooks/useSkeletonOnce';
import { ButtonGroup, ButtonGroupItem } from '@/components';
import { useTranslation } from '@/hooks/useTranslation';

export const Footer = () => {
  const { language } = useUIStore();
  const t = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const showSkeleton = useSkeletonOnce();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (showSkeleton) {
    return null;
  }

  return (
    <footer
      role="contentinfo"
      className="w-full mt-auto shrink-0 pt-[32px] md:pt-[64px] px-[24px] flex min-h-[80px] items-center justify-start py-[12px] md:justify-center box-border text-[#437B9A]"
    >
      <div className="mx-auto w-full max-w-full flex items-center justify-between gap-4 text-sm text-left">
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
