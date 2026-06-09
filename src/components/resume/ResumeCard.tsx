'use client';

import { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { Text } from '@/components';
import { DateTag } from './DateTag';
import { Chip } from './Chip';

/**
 * Pre-processes description text from Contentful:
 * - If it contains • bullets, splits on them and converts to Markdown list items.
 * - Otherwise returns the text as-is (standard Markdown).
 */
function preprocessDescription(text: string): string {
  if (!text.includes('•')) return text;
  return text
    .split('•')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `- ${s}`)
    .join('\n');
}

/** react-markdown component overrides for ResumeCard styling */
const mdComponents: Components = {
  // Wrap paragraphs as spans (no block margin inside cards)
  p: ({ children }) => <span className="block">{children}</span>,
  // Bullet list — same style as the existing items[] list
  ul: ({ children }) => (
    <ul className="m-0 list-none space-y-2 p-0">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="flex gap-2.5">
      <span
        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#569CC3]"
        aria-hidden
      />
      <span className="text-[14px] leading-snug text-[#569CC3]">
        {children}
      </span>
    </li>
  ),
  // Bold
  strong: ({ children }) => (
    <strong className="font-semibold text-[#E5E5E5]">{children}</strong>
  ),
  // Italic
  em: ({ children }) => <em className="italic">{children}</em>,
  // Links — activated color, open in new tab
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#F6D4C2] underline underline-offset-2 hover:text-[#E6BDA8] transition-colors duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </a>
  ),
  // Inline code
  code: ({ children }) => (
    <code className="font-mono text-[0.85em] bg-[#112F40] px-[4px] py-[1px] rounded-sm">
      {children}
    </code>
  ),
};

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
        <div className="text-[14px] leading-snug text-[#569CC3]">
          <ReactMarkdown components={mdComponents}>
            {preprocessDescription(description)}
          </ReactMarkdown>
        </div>
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
