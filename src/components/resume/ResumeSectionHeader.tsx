'use client';

interface ResumeSectionHeaderProps {
  title: string;
  className?: string;
}

const DIAMOND = '◆';

export const ResumeSectionHeader = ({
  title,
  className,
}: ResumeSectionHeaderProps) => {
  return (
    <div
      className={[
        'flex items-center gap-2 h-12 border-t border-b border-[#2F506B] text-[#5E8BA8] font-bold',
        'text-title-mobile-M lg:text-title-tablet-M xl:text-title-desk-M',
        className ?? '',
      ].join(' ')}
    >
      <span className="shrink-0 text-[#67CFCB]" aria-hidden>
        {DIAMOND}
      </span>
      <span>{title}</span>
    </div>
  );
};
