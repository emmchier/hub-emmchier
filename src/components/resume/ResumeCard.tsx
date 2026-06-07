'use client';

import { ReactNode } from 'react';
import { Text } from '@/components';
import { DateTag } from './DateTag';
import { Chip } from './Chip';

/**
 * Renders a string with simple inline markdown:
 *   **bold** → <strong>bold</strong>
 * Returns an array of React nodes safe to render inline.
 */
function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

export type ResumeCardRightContent = 'date' | 'text';

interface ResumeCardProps {
  company?: string;
  role: string;
  items?: string[];
  techList?: string[];
  dateFrom?: string;
  dateTo?: string;
  description?: string;
  rightContent?: ResumeCardRightContent;
  rightContentText?: ReactNode;
  showDescription?: boolean;
  className?: string;
}

export const ResumeCard = ({
  company = '',
  role,
  items = [],
  techList = [],
  dateFrom = '',
  dateTo = '',
  description = '',
  rightContent = 'date',
  rightContentText,
  showDescription = false,
  className,
}: ResumeCardProps) => {
  const showDateBadge =
    rightContent === 'date' && (Boolean(dateFrom) || Boolean(dateTo));

  const isLanguageRow =
    rightContent === 'text' && !company && items.length === 0 && !showDateBadge;

  const renderRight = () => {
    if (showDateBadge) {
      return (
        <DateTag
          dateFrom={dateFrom || '—'}
          dateTo={dateTo || '—'}
          variant="boxed"
          className="shrink-0"
        />
      );
    }
    if (rightContent === 'text' && rightContentText != null) {
      return (
        <span className="shrink-0 text-body-mobile-S text-[#569CC3] lg:text-body-tablet-S xl:text-body-desk-S">
          {rightContentText}
        </span>
      );
    }
    return null;
  };

  if (isLanguageRow) {
    return (
      <div
        className={[
          'flex flex-col gap-2 rounded-none bg-[#173B4F] p-5',
          className ?? '',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-3">
          <Text
            type="title"
            size="m"
            weight="bold"
            color="#E5E5E5"
            className="mb-0 min-w-0 text-[24px] leading-7"
          >
            {role}
          </Text>
          {renderRight()}
        </div>
      </div>
    );
  }

  const hasCompany = Boolean(company);
  const headerSplit = hasCompany || showDateBadge;

  return (
    <div
      className={[
        'flex flex-col gap-3 rounded-none bg-[#173B4F] p-5',
        className ?? '',
      ].join(' ')}
    >
      {headerSplit ? (
        <>
          {/* Mobile: date on top, then underlined company, then title */}
          <div className="flex w-full flex-col gap-2 md:hidden">
            {showDateBadge ? (
              <DateTag
                dateFrom={dateFrom || '—'}
                dateTo={dateTo || '—'}
                variant="boxed"
                className="shrink-0 self-start"
              />
            ) : null}

            {hasCompany ? (
              <p className="m-0 w-full text-[20px] font-medium leading-[24px] text-[#569CC3] underline decoration-[#569CC3]/55 underline-offset-8">
                {company}
              </p>
            ) : null}

            <Text
              type="title"
              size="m"
              weight="bold"
              color="#E5E5E5"
              className="mb-0 w-full text-[24px] leading-7"
            >
              {role}
            </Text>
          </div>

          {/* Desktop/tablet: current layout (company+role left, date right) */}
          <div className="hidden min-w-0 items-start justify-between gap-3 md:flex">
            <div className="flex min-w-0 flex-1 flex-col gap-1 pr-4">
              {hasCompany ? (
                <p className="mb-0 text-[20px] font-medium leading-[24px] text-[#569CC3]">
                  {company}
                </p>
              ) : null}
              <Text
                type="title"
                size="m"
                weight="bold"
                color="#E5E5E5"
                className="mb-0 text-[24px] leading-7"
              >
                {role}
              </Text>
            </div>
            {showDateBadge ? renderRight() : null}
          </div>
        </>
      ) : (
        <Text
          type="title"
          size="m"
          weight="bold"
          color="#E5E5E5"
          className="mb-0 w-full text-[24px] leading-7"
        >
          {role}
        </Text>
      )}

      {showDescription && description ? (
        <Text type="body" size="s" color="#569CC3" className="mb-0">
          {renderInlineMarkdown(description)}
        </Text>
      ) : null}

      {items.length > 0 ? (
        <ul className="m-0 list-none space-y-2 p-0">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#569CC3]"
                aria-hidden
              />
              <span className="text-[14px] leading-snug text-[#569CC3]">
                {item}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {techList.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {techList.map((tech, i) => (
            <Chip key={i}>{tech}</Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
};
