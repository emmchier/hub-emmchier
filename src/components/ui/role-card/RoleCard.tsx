'use client';

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
}

export const RoleCard = ({
  url,
  title,
  colorTitle,
  description,
  link,
  state = 'enabled',
  ariaLabel,
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
        'group relative block w-full border border-[#21516B] overflow-hidden',
        'h-auto md:h-[70vh]',
        'transition-colors duration-300',
        'p-[16px] md:p-[24px]',
        isDisabled
          ? 'cursor-not-allowed bg-[#112F40]'
          : 'cursor-pointer bg-[#13384D] hover:bg-[#1A4862]',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex flex-col h-full">
        {/* Header row: URL label + external arrow */}
        <div className="flex items-start justify-between">
          {isDisabled ? (
            <div className="inline-flex items-center justify-center border border-[#FFC642] text-[#FFC642] bg-[#4A463C] px-[12px] h-[32px] text-[16px]">
              Coming Soon
            </div>
          ) : (
            <Text
              type="title"
              size="m"
              weight="bold"
              className="text-title-mobile-S lg:text-title-tablet-M xl:text-title-desk-M text-[#569CC3] group-hover:text-[#E5E5E5] transition-colors duration-300"
            >
              {url}
            </Text>
          )}
          {!isDisabled && (
            <ArrowExternalLinkIcon
              color="#21516B"
              className="w-[32px] h-[32px] transition-colors duration-300 group-hover:text-[#E5E5E5]"
            />
          )}
        </div>

        {/* Big outline title */}
        <div className="min-h-0 flex flex-col mt-[16px] md:h-[30%] justify-start md:justify-center">
          <span
            className="block font-bold leading-[0.8] tracking-[-0.02em] text-[clamp(4.5rem,19.5vw,20rem)] md:text-[clamp(2.5rem,6.5vw,9rem)]"
            style={{
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              WebkitTextStroke: `${strokeWidth}px ${titleColor}`,
              paintOrder: 'stroke fill',
            }}
          >
            {title}
          </span>
        </div>

        {/* Description — bottom right */}
        <div className="mt-[32px] md:mt-auto w-full md:w-1/2 md:ml-auto">
          <Text
            type="body"
            size="m"
            className={[
              'text-left transition-colors duration-300 w-full',
              isDisabled
                ? 'text-[#21516B]'
                : 'text-[#569CC3] group-hover:text-[#E5E5E5]',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {description}
          </Text>
        </div>
      </div>
    </Link>
  );
};
