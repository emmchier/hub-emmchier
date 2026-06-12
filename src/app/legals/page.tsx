'use client';

import { useRouter } from 'next/navigation';
import { Button, Text, Tooltip } from '@/components';
import { ArrowLeftIcon } from '@/components/ui/icon/icons';
import { useUIStore } from '@/store/ui/ui-store';
import legalsContent from '@/i18n/legals.json';
import { HUB_HORIZONTAL_PADDING } from '@/constants/hub-layout';

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
            {/* Back button — fixed 16px from top-left (Hub has no fixed navbar), survives scroll */}
            <div className="fixed left-[16px] top-[16px] z-50">
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
              {content.siteUrl}
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
                    {p}
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
                          {item}
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
                    {p}
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
