'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Text, Tooltip } from '@/components';
import { ArrowLeftIcon } from '@/components/ui/icon/icons';
import { useUIStore } from '@/store/ui/ui-store';
import legalsContent from '@/i18n/legals.json';
import { HUB_HORIZONTAL_PADDING } from '@/constants/hub-layout';

// URLs mentioned in the legals copy that must be navigable. Longer entries
// first so e.g. emmchier.com never half-matches a longer sibling.
const LINKIFY_TARGETS = [
  'policies.google.com/privacy',
  'design.emmchier.com',
  'art.emmchier.com',
  'emmchier.com',
];

const LINKIFY_REGEX = new RegExp(
  `(${LINKIFY_TARGETS.map((t) => t.replace(/[./]/g, '\\$&')).join('|')})`,
  'g'
);

const linkify = (text: string): ReactNode => {
  const parts = text.split(LINKIFY_REGEX);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    LINKIFY_TARGETS.includes(part) ? (
      <a
        key={i}
        href={`https://${part}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${part}`}
        className="hover:text-selected-text soft"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
};

type LegalsSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
  paragraphsAfterList?: string[];
};

type LegalsData = {
  title: string;
  siteUrl: string;
  lastUpdated: string;
  sections: LegalsSection[];
};

export default function LegalsPage() {
  const router = useRouter();
  const language = useUIStore((s) => s.language);
  const content = legalsContent[language] as LegalsData;

  return (
    <div
      className={`min-h-screen bg-primary-background pb-8 ${HUB_HORIZONTAL_PADDING}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="w-full flex justify-center pt-[24px] pb-[72px]">
          <div className="w-full max-w-2xl mx-auto space-y-8 content-list">
            {/* Back button — mobile: in-flow above title; desktop: fixed top-left */}
            <div className="md:hidden pb-[8px]">
              <Button
                ariaLabel="Go back"
                iconButton
                size="m"
                className="w-[48px]! h-[48px]!"
                style={{ backgroundColor: '#173B4F' }}
                icon={<ArrowLeftIcon />}
                onClick={() => router.back()}
              />
            </div>
            <div className="hidden md:block fixed left-[16px] top-[16px] z-50">
              <Tooltip content="Back to home" direction="right">
                <Button
                  ariaLabel="Go back"
                  iconButton
                  size="m"
                  className="w-[48px]! h-[48px]!"
                  style={{ backgroundColor: '#173B4F' }}
                  icon={<ArrowLeftIcon />}
                  onClick={() => router.back()}
                />
              </Tooltip>
            </div>

            {/* Title */}
            <Text
              type="title"
              size="xl"
              weight="bold"
              className="text-selected-text"
            >
              {content.title}
            </Text>

            {/* Site URL */}
            <Text type="body" size="m" className="text-primary-text">
              {linkify(content.siteUrl)}
            </Text>

            {/* Last updated */}
            <Text type="body" size="m" className="text-primary-text">
              {content.lastUpdated}
            </Text>

            {/* Sections */}
            {content.sections.map((section, i) => (
              <div key={i} className="space-y-4">
                <Text
                  type="title"
                  size="l"
                  weight="bold"
                  className="text-selected-text"
                >
                  {section.heading}
                </Text>

                {section.paragraphs?.map((p, j) => (
                  <Text
                    key={j}
                    type="body"
                    size="m"
                    className="text-primary-text leading-relaxed"
                  >
                    {linkify(p)}
                  </Text>
                ))}

                {section.list && section.list.length > 0 && (
                  <ul className="space-y-2">
                    {section.list.map((item, j) => (
                      <li
                        key={j}
                        style={{
                          listStyleType: j === 0 ? undefined : 'inherit',
                          display: j === 0 ? undefined : 'list-item',
                        }}
                      >
                        <Text
                          type="body"
                          size="m"
                          className="text-primary-text leading-relaxed"
                        >
                          {linkify(item)}
                        </Text>
                      </li>
                    ))}
                  </ul>
                )}

                {section.paragraphsAfterList?.map((p, j) => (
                  <Text
                    key={j}
                    type="body"
                    size="m"
                    className="text-primary-text leading-relaxed"
                  >
                    {linkify(p)}
                  </Text>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
