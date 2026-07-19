'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { BascatAvatarVariant } from '@/hooks/useBascatAvatar';

interface AvatarProps {
  className?: string;
  /** Cuando true muestra la foto de la persona (Resumé); cuando false muestra Bascat (Sites / Contact). */
  showPersonImage?: boolean;
  /** En cada cambio de tab se reproduce la animación de moneda. */
  activeTabIndex?: number;
  /** URL de la imagen desde Contentful. Si no se pasa usa el fallback local. */
  personImageUrl?: string;
  /** Variante de Bascat a mostrar (ver useBascatAvatar). Default: 'acuarela'. */
  bascatVariant?: BascatAvatarVariant;
}

export const Avatar = ({
  className,
  showPersonImage = false,
  activeTabIndex = 0,
  personImageUrl,
  bascatVariant = 'acuarela',
}: AvatarProps) => {
  const [spinEpoch, setSpinEpoch] = useState(0);
  const skipFirstSpin = useRef(true);

  useEffect(() => {
    if (skipFirstSpin.current) {
      skipFirstSpin.current = false;
      return;
    }
    setSpinEpoch((e) => e + 1);
  }, [activeTabIndex]);

  const flipDeg = showPersonImage ? 180 : 0;

  return (
    <div
      className={[
        'relative h-12 w-12 shrink-0 overflow-visible',
        className || '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        perspective: '1200px',
        perspectiveOrigin: '50% 50%',
        WebkitPerspective: '1200px',
      }}
    >
      <div
        key={spinEpoch}
        className={[
          'relative h-full w-full',
          spinEpoch > 0 ? 'avatar-tab-coin-spin' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
        }}
      >
        <div
          className="relative h-full w-full transform-3d"
          style={{
            transform: `rotateX(${flipDeg}deg)`,
            transformOrigin: '50% 50%',
            WebkitTransformOrigin: '50% 50%',
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full bg-[#13384D]"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(2px)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/assets/avatar-${bascatVariant}.svg`}
              alt="Bascat"
              className="h-full w-full object-cover"
            />
          </div>

          <div
            className="absolute inset-0 overflow-hidden rounded-full"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateX(180deg) translateZ(2px)',
            }}
          >
            <Image
              src={personImageUrl ?? '/assets/emmchier.png'}
              alt="Emmanuel Chierchié"
              width={96}
              height={96}
              className="h-full w-full object-cover"
              quality={90}
              priority
              sizes="48px"
              unoptimized={Boolean(personImageUrl)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
