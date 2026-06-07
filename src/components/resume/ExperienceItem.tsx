'use client';

import { Text } from '@/components';
import { LocationIcon } from '@/components/ui/icon/icons';
import { ResumeCard } from './ResumeCard';
import { DateTag } from './DateTag';
import type { ResumeCardRightContent } from './ResumeCard';

interface ExperienceItemProps {
  showHeaders?: boolean;
  isMobile?: boolean;
  role: string;
  items?: string[];
  techList?: string[];
  dateFrom?: string;
  dateTo?: string;
  rightContent?: ResumeCardRightContent;
  rightContentText?: React.ReactNode;
  periodDateFrom: string;
  periodDateTo: string;
  periodDuration: string;
  companyName: string;
  companyLocation: string;
}

export const ExperienceItem = ({
  showHeaders = false,
  isMobile = false,
  role,
  items = [],
  techList = [],
  dateFrom = '',
  dateTo = '',
  rightContent = 'date',
  rightContentText,
  periodDateFrom,
  periodDateTo,
  periodDuration,
  companyName,
  companyLocation,
}: ExperienceItemProps) => {
  const showHeaderRow = showHeaders && !isMobile;
  const showPeriodCompany = !isMobile;

  return (
    <div className="w-full">
      {showHeaderRow && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 mb-2">
            <div className="min-w-0">
              <div className="text-body-mobile-S lg:text-body-tablet-S xl:text-body-desk-S font-bold text-[#569CC3]">
                About rol
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 min-w-0">
              <div>
                <div className="text-body-mobile-S lg:text-body-tablet-S xl:text-body-desk-S font-bold text-[#569CC3]">
                  Period
                </div>
              </div>
              <div>
                <div className="text-body-mobile-S lg:text-body-tablet-S xl:text-body-desk-S font-bold text-[#569CC3]">
                  Company
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-dashed border-[#2F506B] pt-2 mb-4" />
        </>
      )}
      <div
        className={`grid gap-4 w-full ${showPeriodCompany ? 'grid-cols-1 md:grid-cols-[1fr_1fr]' : 'grid-cols-1'}`}
      >
        <div className="min-w-0">
          <ResumeCard
            role={role}
            items={items}
            techList={techList}
            dateFrom={dateFrom}
            dateTo={dateTo}
            rightContent={rightContent}
            rightContentText={rightContentText}
          />
        </div>
        {showPeriodCompany && (
          <div className="grid grid-cols-2 gap-4 min-w-0">
            <div>
              <DateTag dateFrom={periodDateFrom} dateTo={periodDateTo} />
              <Text type="body" size="s" color="#569CC3" className="mt-1 mb-0">
                {periodDuration}
              </Text>
            </div>
            <div>
              <Text
                type="title"
                size="s"
                weight="bold"
                color="#569CC3"
                className="mb-0"
                style={{ fontSize: 18, lineHeight: '22px' }}
              >
                {companyName}
              </Text>
              <div className="flex items-center gap-1.5 mt-1">
                <LocationIcon color="#569CC3" className="shrink-0 w-4 h-4" />
                <Text type="body" size="s" color="#569CC3" className="mb-0">
                  {companyLocation}
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
