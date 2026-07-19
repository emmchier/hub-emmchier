'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowExternalLinkIcon, Text } from '@/components';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface RoleCardProps {
  url: string;
  title: string;
  colorTitle: string;
  description: string;
  link?: string;
  state?: 'enabled' | 'disabled';
  ariaLabel: string;
  comingSoonLabel?: string;
}

export const RoleCard = ({
  url,
  title,
  colorTitle,
  description,
  link,
  state = 'enabled',
  ariaLabel,
  comingSoonLabel = 'Coming Soon',
}: RoleCardProps) => {
  const { breakpoint } = useBreakpoint();
  const isDesktop = breakpoint !== 'mobile';
  const strokeWidth = isDesktop ? 3 : 1;

  const isDisabled = state === 'disabled';
  const href = link || '#';
  const disabledColor = '#21516B';
  const titleColor = isDisabled ? disabledColor : colorTitle;

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : undefined}
      target={isDisabled ? undefined : '_blank'}
      rel={isDisabled ? undefined : 'noopener noreferrer'}
      onClick={(event) => {
        if (isDisabled) event.preventDefault();
      }}
      className={[
        'role-card group relative block h-full w-full',
        'p-[16px] md:p-[24px]',
        isDisabled
          ? 'role-card--disabled cursor-not-allowed'
          : 'cursor-pointer',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          '--card-accent': titleColor,
          '--card-stroke': `${strokeWidth}px`,
        } as CSSProperties
      }
    >
      {/* Clipped FX layer — keeps shine/bloom inside without clipping card shadow */}
      {!isDisabled && (
        <span className="role-card__fx" aria-hidden="true">
          <span className="role-card__bloom" />
          <span className="role-card__shine" />
          <span className="role-card__edge" />
        </span>
      )}

      <div className="relative z-1 flex h-full min-h-0 flex-col">
        <div className="relative flex items-start justify-between gap-4">
          {isDisabled ? (
            <div className="relative inline-flex h-[32px] items-center justify-center border border-[#FFC642] bg-[#4A463C] px-[12px] text-[16px] text-[#FFC642]">
              {comingSoonLabel}
            </div>
          ) : (
            <Text
              type="title"
              size="m"
              weight="regular"
              className="role-card__url relative text-title-mobile-S text-[#569CC3] lg:text-title-tablet-M xl:text-title-desk-M"
            >
              {url}
            </Text>
          )}
          {!isDisabled && (
            <ArrowExternalLinkIcon className="role-card__icon relative h-[32px] w-[32px] shrink-0" />
          )}
        </div>

        <div className="relative mt-[16px]">
          <span className="role-card__title relative block text-[clamp(5.25rem,22vw,20rem)] font-bold leading-[0.8] tracking-[-0.02em] md:text-[clamp(2.5rem,6.5vw,9rem)]">
            {title}
          </span>
        </div>

        <div className="relative mt-auto w-full pt-[72px]">
          <div className="relative w-full md:ml-auto md:w-[60%]">
            <Text
              type="body"
              size="m"
              weight="regular"
              className={[
                'role-card__desc relative w-full text-left',
                'text-[17px]! leading-[25px]!',
                'md:text-body-mobile-M! md:leading-[1.6]! lg:text-body-tablet-M! xl:text-body-desk-M!',
                isDisabled ? 'text-[#21516B]' : 'text-[#569CC3]',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {description}
            </Text>
          </div>
        </div>
      </div>
    </Link>
  );
};
