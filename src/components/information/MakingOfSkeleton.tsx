'use client';

import { Skeleton } from '@/components/ui/skeleton/Skeleton';

export const MakingOfSkeleton = () => {
  return (
    <div className="w-full flex justify-center px-[16px] md:px-[40px] pt-[16px] md:pt-[40px] pb-[72px]">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header bar */}
        <div className="w-full">
          <div className="h-[48px] w-full border-y border-indigo-100 flex items-center justify-between">
            <Skeleton className="h-[16px] w-[120px] ml-0 rounded-none" />
            <Skeleton className="h-[32px] w-[32px] rounded-none" />
          </div>
        </div>

        {/* Tools badges */}
        <div className="w-full flex flex-wrap gap-2 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={`makingof-badge-${i}`}
              className="h-[28px] w-[88px] rounded-none"
            />
          ))}
        </div>

        {/* Rich text blocks */}
        <div className="mt-8 space-y-6">
          {/* Title */}
          <div className="space-y-3">
            <Skeleton className="h-[24px] w-[70%] rounded-none" />
            <Skeleton className="h-[16px] w-full rounded-none" />
            <Skeleton className="h-[16px] w-full rounded-none" />
            <Skeleton className="h-[16px] w-[85%] rounded-none" />
          </div>

          {/* Image */}
          <Skeleton className="w-full h-[220px] md:h-[320px] rounded-none" />

          {/* Paragraph */}
          <div className="space-y-3">
            <Skeleton className="h-[16px] w-full rounded-none" />
            <Skeleton className="h-[16px] w-full rounded-none" />
            <Skeleton className="h-[16px] w-[92%] rounded-none" />
            <Skeleton className="h-[16px] w-[66%] rounded-none" />
          </div>

          {/* List */}
          <div className="space-y-3">
            <Skeleton className="h-[20px] w-[45%] rounded-none" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`makingof-li-${i}`} className="flex gap-3">
                  <Skeleton className="h-[10px] w-[10px] rounded-none mt-[6px]" />
                  <Skeleton className="h-[16px] w-[85%] rounded-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Final paragraph */}
          <div className="space-y-3">
            <Skeleton className="h-[16px] w-full rounded-none" />
            <Skeleton className="h-[16px] w-[88%] rounded-none" />
            <Skeleton className="h-[16px] w-[60%] rounded-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
