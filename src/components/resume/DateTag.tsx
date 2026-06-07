'use client';

interface DateTagProps {
  dateFrom: string;
  dateTo: string;
  className?: string;
  variant?: 'plain' | 'boxed';
}

export const DateTag = ({
  dateFrom,
  dateTo,
  className,
  variant = 'plain',
}: DateTagProps) => {
  const isFullWidth = Boolean(className?.includes('w-full'));
  const sameYear = dateFrom === dateTo && Boolean(dateFrom);
  const inner = sameYear ? (
    <span className="text-body-mobile-S font-medium lg:text-body-tablet-S xl:text-body-desk-S">
      {dateFrom}
    </span>
  ) : (
    <>
      <span className="text-body-mobile-S font-medium lg:text-body-tablet-S xl:text-body-desk-S">
        {dateFrom}
      </span>
      <span className="h-4 w-px shrink-0 bg-current opacity-80" aria-hidden />
      <span
        className="text-body-mobile-S font-medium lg:text-body-tablet-S xl:text-body-desk-S"
        style={dateTo === 'Act' ? { color: '#67CFCB' } : undefined}
      >
        {dateTo}
      </span>
    </>
  );

  if (variant === 'boxed') {
    return (
      <div
        className={[
          `${isFullWidth ? 'flex' : 'inline-flex'} shrink-0 items-center gap-2 px-2 py-1 text-[#569CC3]`,
          'bg-[#112F40]',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {inner}
      </div>
    );
  }

  return (
    <div
      className={[
        'inline-flex items-center gap-2 text-[#569CC3]',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {inner}
    </div>
  );
};
