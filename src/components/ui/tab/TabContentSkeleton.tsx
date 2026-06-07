'use client';

import { Skeleton } from '@/components/ui/skeleton/Skeleton';
import { useBreakpoint } from '@/hooks/useBreakpoint';

/*
 * Skeleton de la galería de imágenes.
 *
 * Diseño: simula el layout masonry/grid real con bloques de distinto alto.
 * Cada bloque tiene un sutil stagger de entrada via animationDelay para
 * que aparezcan en cascada en lugar de todos a la vez.
 *
 * Los bloques se desvanecen progresivamente (opacity decreciente) hacia
 * el final para dar la sensación de "contenido que se carga".
 */

const DESKTOP_PATTERNS: { w: string; h: string }[] = [
  { w: 'w-[50%]', h: 'h-[54vh]' },
  { w: 'w-[25%]', h: 'h-[54vh]' },
  { w: 'w-[25%]', h: 'h-[54vh]' },
  { w: 'w-[33.33%]', h: 'h-[38vh]' },
  { w: 'w-[33.33%]', h: 'h-[38vh]' },
  { w: 'w-[33.33%]', h: 'h-[38vh]' },
  { w: 'w-[25%]', h: 'h-[46vh]' },
  { w: 'w-[50%]', h: 'h-[46vh]' },
  { w: 'w-[25%]', h: 'h-[46vh]' },
];

const MOBILE_COUNT = 9;

export const TabContentSkeleton = () => {
  const { breakpoint } = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  return (
    <div className="w-full">
      {/* Título/descripción placeholder */}
      <div className="w-full md:w-[50%] mb-[20px] px-[16px] md:px-0">
        <div className="flex flex-col gap-[10px]">
          {[75, 90, 80, 45].map((w, i) => (
            <Skeleton
              key={`title-skel-${i}`}
              className="h-[14px] rounded-none"
              style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Grid de imágenes */}
      {isMobile ? (
        <div className="grid grid-cols-3 mb-5">
          {Array.from({ length: MOBILE_COUNT }).map((_, index) => (
            <div
              key={`mob-skel-${index}`}
              className="border border-primary-background overflow-hidden"
              style={{ opacity: 1 - index * 0.07 }}
            >
              <Skeleton
                className="w-full aspect-square rounded-none"
                style={{ animationDelay: `${index * 80}ms` }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap mb-5">
          {DESKTOP_PATTERNS.map(({ w, h }, index) => (
            <div
              key={`desk-skel-${index}`}
              className={`border border-primary-background overflow-hidden ${w}`}
              style={{ opacity: 1 - index * 0.07 }}
            >
              <Skeleton
                className={`w-full ${h} rounded-none`}
                style={{ animationDelay: `${index * 100}ms` }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Paginación placeholder */}
      <div className="mt-[32px] pb-0 sm:pb-[72px] w-full flex items-center justify-center gap-[8px]">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton
            key={`pag-skel-${index}`}
            className="h-[44px] w-[44px] rounded-none"
            style={{
              opacity: 1 - index * 0.1,
              animationDelay: `${index * 60}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
