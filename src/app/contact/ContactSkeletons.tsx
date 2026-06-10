'use client';

import { Skeleton } from '@/components/ui/skeleton/Skeleton';

// ── Sites tab skeleton ─────────────────────────────────────────────────────────

function SiteCardSkeleton({ isDesktop }: { isDesktop: boolean }) {
  return (
    <div
      className={[
        'relative w-full h-full border border-[#21516B] bg-[#13384D]',
        isDesktop ? 'p-[24px]' : 'p-[16px]',
      ].join(' ')}
    >
      {/* Header row */}
      <div className="relative flex items-start justify-between">
        <Skeleton className="rounded-none h-[18px] w-[160px]" />
        <Skeleton className="rounded-none h-[32px] w-[32px] shrink-0" />
      </div>

      {/* Title */}
      <div className="relative mt-[16px]">
        <Skeleton
          className={[
            'rounded-none',
            isDesktop ? 'h-[88px] w-[82%]' : 'h-[68px] w-[72%]',
          ].join(' ')}
        />
      </div>

      {/* Description — 72px below title */}
      <div className="relative mt-[72px] flex flex-col gap-[8px] w-full">
        <Skeleton className="rounded-none h-[13px] w-full" />
        <Skeleton className="rounded-none h-[13px] w-[88%]" />
        <Skeleton className="rounded-none h-[13px] w-[70%]" />
      </div>
    </div>
  );
}

export function SitesTabSkeleton() {
  return (
    <div className="w-full pt-0 md:pt-[24px]">
      {/* Desktop (md+): 3 columns */}
      <div className="hidden md:flex w-full gap-[8px] items-stretch">
        {/* Col 1 — intro text */}
        <div className="w-1/3 flex flex-col gap-[16px] md:pr-[64px]">
          <div className="flex flex-col gap-[4px]">
            <Skeleton className="rounded-none h-[25px] w-[40%]" />
            <Skeleton className="rounded-none h-[44px] w-[88%]" />
            <Skeleton className="rounded-none h-[44px] w-[72%]" />
            <Skeleton className="rounded-none h-[25px] w-[92%]" />
            <Skeleton className="rounded-none h-[25px] w-[56%]" />
          </div>
          <div className="flex flex-col gap-[8px]">
            <Skeleton className="rounded-none h-[16px] w-full" />
            <Skeleton className="rounded-none h-[16px] w-[90%]" />
            <Skeleton className="rounded-none h-[16px] w-[68%]" />
          </div>
        </div>
        {/* Col 2 — art card */}
        <div className="w-1/3 flex">
          <SiteCardSkeleton isDesktop />
        </div>
        {/* Col 3 — design card */}
        <div className="w-1/3 flex">
          <SiteCardSkeleton isDesktop />
        </div>
      </div>

      {/* Mobile: stacked */}
      <div className="flex md:hidden flex-col gap-4">
        {/* Intro text */}
        <div className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[4px]">
            <Skeleton className="rounded-none h-[25px] w-[36%]" />
            <Skeleton className="rounded-none h-[44px] w-[84%]" />
            <Skeleton className="rounded-none h-[44px] w-[68%]" />
            <Skeleton className="rounded-none h-[25px] w-[88%]" />
            <Skeleton className="rounded-none h-[25px] w-[52%]" />
          </div>
          <div className="flex flex-col gap-[8px]">
            <Skeleton className="rounded-none h-[16px] w-full" />
            <Skeleton className="rounded-none h-[16px] w-[85%]" />
            <Skeleton className="rounded-none h-[16px] w-[64%]" />
          </div>
        </div>
        {/* art card */}
        <SiteCardSkeleton isDesktop={false} />
        {/* design card */}
        <SiteCardSkeleton isDesktop={false} />
      </div>
    </div>
  );
}

function SayHelloCardSkeleton() {
  return (
    <div className="flex h-full min-h-[72px] w-full flex-col justify-end bg-[#13384D] p-2 md:min-h-[96px] md:p-4">
      <div className="flex w-full items-end justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2 text-left">
          <Skeleton className="h-[28px] w-[72%] rounded-none md:h-[40px] lg:h-[44px]" />
          <Skeleton className="h-[16px] w-[60%] rounded-none md:h-[22px] lg:h-[24px]" />
        </div>
        <div className="flex shrink-0 items-center gap-[8px]">
          <Skeleton className="rounded-none h-[40px] w-[40px]" />
          <Skeleton className="rounded-none h-[40px] w-[40px]" />
        </div>
      </div>
    </div>
  );
}

export function SayHelloTabSkeleton() {
  const SLOT_AREAS = [
    'email',
    'linkedin',
    'download',
    'instagram',
    'github',
    'behance',
    'dribbble',
  ] as const;

  return (
    <div className="w-full pt-4 md:pt-0">
      {/* Cards grid skeleton (same CSS grid areas) */}
      <div className="flex w-full min-w-0 flex-col gap-2 pb-4 md:pb-0">
        <div className="contact-cards-grid w-full min-w-0">
          {SLOT_AREAS.map((gridArea) => (
            <div key={`sayhello-skel-${gridArea}`} style={{ gridArea }}>
              <SayHelloCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResumeCardSkeleton() {
  return (
    <div className="w-full min-h-[168px] bg-[#13384D] p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="rounded-none h-[16px] w-[96px]" />
        <Skeleton className="rounded-none h-[16px] w-[120px]" />
      </div>
      <Skeleton className="rounded-none h-[22px] w-[70%]" />
      <div className="flex flex-col gap-2">
        <Skeleton className="rounded-none h-[14px] w-full" />
        <Skeleton className="rounded-none h-[14px] w-[92%]" />
        <Skeleton className="rounded-none h-[14px] w-[78%]" />
        <Skeleton className="rounded-none h-[14px] w-[64%]" />
      </div>
    </div>
  );
}

export function ResumeTabSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="w-full">
      {isMobile ? (
        <>
          {/* Sticky header skeleton */}
          <div className="sticky top-0 z-20 min-h-[56px] flex flex-col bg-primary-background">
            <div className="flex items-start gap-2 pt-[8px] pb-[8px]">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="rounded-none h-[24px] w-[200px]" />
                <Skeleton className="rounded-none h-[16px] w-[160px]" />
              </div>
              <Skeleton className="rounded-none h-[32px] w-[32px]" />
            </div>
            <div className="w-full min-w-0 pt-2 pb-3">
              <div className="flex flex-nowrap gap-2 pb-1 w-max">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={`resume-chip-skel-${i}`}
                    className="rounded-none h-[28px] w-[120px]"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <ResumeCardSkeleton key={`resume-card-skel-m-${i}`} />
            ))}
          </div>
        </>
      ) : (
        <div className="w-full">
          <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-x-6 lg:gap-y-0 xl:gap-x-8">
            {/* Left column (50%) header + anchors */}
            <div className="lg:col-span-6 flex w-full flex-col gap-4 lg:sticky lg:top-6 lg:z-10 lg:self-start">
              <header className="flex w-full flex-col gap-4 pb-4">
                <div className="flex w-full min-w-0 flex-row items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 flex flex-col gap-2">
                    <Skeleton className="rounded-none h-[40px] w-[260px] max-w-full" />
                    <Skeleton className="rounded-none h-[18px] w-[220px] max-w-full" />
                  </div>
                  <div className="flex shrink-0 flex-wrap items-start justify-end gap-2">
                    <Skeleton className="rounded-none h-[44px] w-[44px]" />
                    <Skeleton className="rounded-none h-[44px] w-[44px]" />
                  </div>
                </div>
              </header>

              <nav className="flex w-full flex-col gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={`resume-nav-skel-${i}`}
                    className={[
                      'rounded-none h-[74px]',
                      i % 4 === 0
                        ? 'w-[82%]'
                        : i % 4 === 1
                          ? 'w-[74%]'
                          : i % 4 === 2
                            ? 'w-[86%]'
                            : 'w-[78%]',
                    ].join(' ')}
                  />
                ))}
              </nav>
            </div>

            {/* Right column (50%) cards */}
            <div className="lg:col-span-6 flex w-full flex-col gap-3 pt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <ResumeCardSkeleton key={`resume-card-skel-d-${i}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
