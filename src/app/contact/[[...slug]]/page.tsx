'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Button,
  DownloadIcon,
  MoreVerticalIcon,
  Tab,
  TabItem,
  Text,
} from '@/components';
import CardButton from '@/components/ui/card-button/CardButton';
import { Avatar } from '@/components/ui/avatar/Avatar';
import {
  ResumeTabContent,
  scrollToResumeSection,
  useResumeCategoryChips,
  RotatingRoleLine,
  type ResumeCategory,
} from '@/components/resume';
import { useDataStore } from '@/store/data/data-store';
import { useUIStore } from '@/store/ui/ui-store';
import type { SupportedLanguage } from '@/i18n/translations';
import { useMinWidth } from '@/hooks/useMediaQuery';
import { useSkeletonOnce } from '@/hooks/useSkeletonOnce';
import { useTranslation } from '@/hooks/useTranslation';
import { ChevronLeftIcon } from '@/components/ui/icon/icons';
import { BaseModal } from '@/components';
import {
  ResumeTabSkeleton,
  SayHelloTabSkeleton,
} from '@/app/contact/ContactSkeletons';
import {
  copyLink,
  shareOnFacebook,
  shareOnLinkedIn,
  shareOnThreads,
  shareOnWhatsApp,
  shareOnX,
} from '@/utils/functions';
import { useEntranceAnimation } from '@/hooks/useEntranceAnimation';

/**
 * Two-phase entrance wrapper for contact cards.
 *
 * Phase 1 — Wave (fires once when skeleton ends, via useEntranceAnimation):
 *   Cards already visible in the viewport animate with `entrance-fade-up`
 *   staggered by index, creating a left→right / top→bottom wave effect.
 *   No neon, just a clean opacity + translateY cascade.
 *
 * Phase 2 — Lazy scroll (cards outside the viewport at entrance time):
 *   Once the wave has played, cards that enter the viewport later use a
 *   simple opacity + translateY transition (IntersectionObserver).
 */
function FadeInCard({
  children,
  index,
}: {
  children: ReactNode;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const entranceReady = useEntranceAnimation();

  type CardState = 'pending' | 'wave' | 'lazy-hidden' | 'lazy-visible';
  const [state, setState] = useState<CardState>('pending');
  const [waveDelay, setWaveDelay] = useState(0);

  useEffect(() => {
    if (!entranceReady) return;
    const el = ref.current;
    if (!el) return;

    // Synchronous viewport check — runs right when the skeleton clears.
    const rect = el.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight && rect.bottom > 0;

    if (inViewport) {
      // Card is visible now → join the wave with a staggered delay.
      // Stagger: 60 ms × index, capped at 450 ms so the last card never
      // feels sluggish on grids with many initially-visible items.
      setWaveDelay(Math.min(index * 60, 450));
      setState('wave');
    } else {
      // Card is below the fold → switch to lazy IntersectionObserver.
      setState('lazy-hidden');
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setState('lazy-visible');
            observer.disconnect();
          }
        },
        { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [entranceReady, index]);

  const style: React.CSSProperties = (() => {
    switch (state) {
      case 'pending':
        // Hidden while skeleton is still showing — no layout shift.
        return { opacity: 0, height: '100%', width: '100%' };

      case 'wave':
        // CSS animation with per-card delay creates the wave.
        // `both` fill-mode: invisible before delay fires, stays visible after.
        return {
          animation: `entrance-fade-up 540ms cubic-bezier(0.16, 1, 0.3, 1) ${waveDelay}ms both`,
          height: '100%',
          width: '100%',
        };

      case 'lazy-hidden':
        return {
          opacity: 0,
          transform: 'translateY(22px)',
          height: '100%',
          width: '100%',
        };

      case 'lazy-visible':
        return {
          opacity: 1,
          transform: 'translateY(0px)',
          transition:
            'opacity 520ms cubic-bezier(0.22, 1, 0.36, 1), transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
          height: '100%',
          width: '100%',
        };
    }
  })();

  return (
    <div ref={ref} style={style}>
      {children}
    </div>
  );
}

export default function ContactPage() {
  const router = useRouter();
  const pathname = usePathname();
  const showTabContentSkeleton = useSkeletonOnce();
  /** Resumé two-column desktop layout from lg (1024px); below = chips + single-column sections. */
  const isResumeDesktopLayout = useMinWidth(1024);

  const isResumeRoute = useMemo(
    () => Boolean(pathname && pathname.includes('/contact/resume')),
    [pathname]
  );

  const [activeTabIndex, setActiveTabIndex] = useState(() =>
    isResumeRoute ? 1 : 0
  );

  // Maps between Contentful section slugs (used in URL) and UI category keys
  const URL_SLUG_TO_CATEGORY: Record<string, ResumeCategory> = {
    'work-experience': 'experience',
    courses: 'courses',
    studies: 'studies',
    languages: 'languages',
  };
  const CATEGORY_TO_URL_SLUG: Record<ResumeCategory, string> = {
    experience: 'work-experience',
    courses: 'courses',
    studies: 'studies',
    languages: 'languages',
  };

  // Read section slug from URL on first render for deep-linking
  const initialCategory = useMemo<ResumeCategory>(() => {
    const seg = pathname?.split('/')[3];
    return URL_SLUG_TO_CATEGORY[seg ?? ''] ?? 'experience';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [activeResumeCategory, setActiveResumeCategory] =
    useState<ResumeCategory>(initialCategory);
  const [resumeAnimKey, setResumeAnimKey] = useState(0);
  const resumeChipsScrollRef = useRef<HTMLDivElement>(null);
  const chipRefsMap = useRef<Record<ResumeCategory, HTMLButtonElement | null>>(
    {} as Record<ResumeCategory, HTMLButtonElement | null>
  );

  const showPersonAvatar = useMemo(
    () => activeTabIndex === 1,
    [activeTabIndex]
  );

  const { openBottomSheet } = useUIStore();
  const t = useTranslation();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // ── Resume data (locale-aware) ────────────────────────────────────────────
  const resumeByLang = useDataStore((s) => s.resumeByLang);
  const language = useUIStore((s) => s.language);
  const resumeData =
    resumeByLang[language as SupportedLanguage] ?? resumeByLang['en'] ?? null;
  const resumeRoles = resumeData?.roles ?? [];
  const resumeImage = resumeData?.image;
  const dynamicChips = useResumeCategoryChips();

  useEffect(() => {
    setActiveTabIndex(isResumeRoute ? 1 : 0);
  }, [isResumeRoute]);

  // Sync activeResumeCategory to the first available chip when data loads.
  // Also scroll to the deep-linked section on desktop once data is ready.
  const deepLinkScrolledRef = useRef(false);
  useEffect(() => {
    if (dynamicChips.length === 0) return;
    const keys = dynamicChips.map(([k]) => k);
    if (!keys.includes(activeResumeCategory)) {
      setActiveResumeCategory(keys[0]);
    } else if (
      isResumeDesktopLayout &&
      !deepLinkScrolledRef.current &&
      initialCategory !== 'experience'
    ) {
      // Deep-link: scroll to the section on first data load (desktop only)
      deepLinkScrolledRef.current = true;
      requestAnimationFrame(() => {
        scrollToResumeSection(activeResumeCategory, keys as ResumeCategory[]);
      });
    }
  }, [dynamicChips]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL when active section changes — no Next.js navigation, no re-render
  useEffect(() => {
    if (activeTabIndex !== 1) return;
    const next = `/contact/resume/${CATEGORY_TO_URL_SLUG[activeResumeCategory]}`;
    if (window.location.pathname !== next) {
      window.history.replaceState(null, '', next);
    }
  }, [activeResumeCategory, activeTabIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const openResumeMobileActionsSheet = useCallback(() => {
    openBottomSheet({
      mode: 'list',
      listItems: [
        {
          value: 'download-resume',
          label: t.download,
          icon: (
            <DownloadIcon
              color="currentColor"
              width={22}
              height={22}
              className="shrink-0"
            />
          ),
          onClick: () => {},
        },
        {
          value: 'copy-link',
          label: t.copyLink,
          onClick: async () => {
            await copyLink('/contact');
          },
        },
        {
          value: 'linkedin',
          label: t.shareOnLinkedIn,
          onClick: () => shareOnLinkedIn('/contact'),
        },
        {
          value: 'facebook',
          label: t.shareOnFacebook,
          onClick: () => shareOnFacebook('/contact'),
        },
        {
          value: 'whatsapp',
          label: t.shareOnWhatsapp,
          onClick: () => shareOnWhatsApp('/contact', 'Resumé'),
        },
        {
          value: 'threads',
          label: t.shareOnThreads,
          onClick: () => shareOnThreads('/contact', 'Resumé'),
        },
        {
          value: 'x',
          label: t.shareOnX,
          onClick: () => shareOnX('/contact', 'Resumé'),
        },
      ],
    });
  }, [openBottomSheet, t]);

  useEffect(() => {
    if (isResumeDesktopLayout) return;
    const container = resumeChipsScrollRef.current;
    const el = chipRefsMap.current[activeResumeCategory];
    if (!container || !el) return;
    const targetScrollLeft =
      el.offsetLeft - container.clientWidth / 2 + el.offsetWidth / 2;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const clamped = Math.max(0, Math.min(targetScrollLeft, maxScroll));
    container.scrollTo({ left: clamped, behavior: 'smooth' });
  }, [activeResumeCategory, isResumeDesktopLayout]);

  return (
    <>
      <div className="relative flex w-full flex-col">
        <Tab
          className="w-full"
          contactMobileTabsRight
          mobileBodyMarginTop="12px"
          mobileIndicatorBottomClass="bottom-[6px]"
          desktopBodyMarginTop="16px"
          showSkeletonOverride={showTabContentSkeleton}
          headerSkeleton={
            <div className="relative w-full h-full px-[16px] md:px-[16px] pt-[12px] md:pt-0 flex items-center justify-between gap-[16px]">
              <div className="flex items-center gap-2">
                <div className="skeleton-pulse rounded-none h-[48px] w-[48px]" />
                <div className="skeleton-pulse rounded-full h-[32px] w-[32px] md:h-[48px] md:w-[48px]" />
              </div>
              <div className="flex items-center gap-[16px] justify-end">
                <div className="skeleton-pulse rounded-none h-[20px] w-[84px]" />
                <div className="skeleton-pulse rounded-none h-[20px] w-[84px]" />
              </div>
            </div>
          }
          bodyClasses="overflow-visible"
          defaultActiveIndex={activeTabIndex}
          onTabChange={(index) => {
            setActiveTabIndex(index);
            if (index === 1) {
              setResumeAnimKey((k) => k + 1);
              // TO resume: replaceState directly with full URL — no flicker
              const slug = CATEGORY_TO_URL_SLUG[activeResumeCategory];
              window.history.replaceState(null, '', `/contact/resume/${slug}`);
            } else {
              // AWAY from resume: need Next.js to update pathname so
              // isResumeRoute becomes false (browser back/forward sync)
              if (pathname !== '/contact') router.replace('/contact');
            }
          }}
          headerClasses="z-30 flex flex-row w-full items-center justify-between gap-4 bg-primary-background px-0 py-0 border-b border-[#2F506B] md:border-b-0 min-h-[72px] md:max-[1265px]:min-h-[64px] min-[1266px]:min-h-[88px]"
          sideContent={
            <div className="relative z-10 flex w-full items-center overflow-visible px-[16px] md:z-auto md:px-[16px]">
              <div className="flex w-full flex-row items-center gap-2 overflow-visible">
                <div className="flex group">
                  <Button
                    ariaLabel="Back to home"
                    onClick={() => router.push('/')}
                    state="enabled"
                    iconButton
                    size="m"
                    style={{ backgroundColor: '#173B4F' }}
                    icon={
                      <span className="inline-flex transition-transform duration-200 ease-out group-hover:-translate-x-[3px]">
                        <ChevronLeftIcon size="md" />
                      </span>
                    }
                  />
                </div>
                <BaseModal
                  type="avatar"
                  open={isAvatarModalOpen}
                  onOpenChange={setIsAvatarModalOpen}
                  trigger={
                    <Avatar
                      className="shrink-0 h-10! w-10! md:h-12! md:w-12!"
                      showPersonImage={showPersonAvatar}
                      activeTabIndex={activeTabIndex}
                      personImageUrl={resumeImage}
                    />
                  }
                  content={
                    <Avatar
                      className="shrink-0 h-10! w-10! md:h-12! md:w-12!"
                      showPersonImage={showPersonAvatar}
                      activeTabIndex={activeTabIndex}
                      personImageUrl={resumeImage}
                    />
                  }
                />
              </div>
            </div>
          }
        >
          <TabItem label={t.sayHello}>
            <div className="relative pb-[72px] md:pb-4">
              {activeTabIndex === 0 && (
                <div
                  className="absolute inset-0 z-30 bg-primary-background pointer-events-none"
                  aria-hidden="true"
                  style={{
                    opacity: showTabContentSkeleton ? 1 : 0,
                    transition: showTabContentSkeleton
                      ? 'none'
                      : 'opacity 500ms ease-out',
                  }}
                >
                  <div className="w-full md:px-[16px]">
                    <SayHelloTabSkeleton />
                  </div>
                </div>
              )}
              <div className="md:px-[16px]">
                {(() => {
                  type ContactItem =
                    | {
                        type: 'email';
                        email: string;
                      }
                    | {
                        type: 'link';
                        title: string;
                        subTitle: string;
                        href: string; // linkable data (may omit protocol)
                      };

                  const SLOT_AREAS = [
                    'email',
                    'linkedin',
                    'download',
                    'instagram',
                    'github',
                    'behance',
                    'dribbble',
                  ] as const;

                  // Color distribution is driven by the slot (layout), not by item type.
                  const SLOT_COLORS = [
                    '#67CFCB', // email
                    '#74BDE8', // linkedin
                    '#F6D4C2', // download
                    '#74BDE8', // instagram
                    '#67CFCB', // github
                    '#F6D4C2', // behance
                    '#74BDE8', // dribbble
                  ] as const;

                  const normalizeHttps = (raw: string) => {
                    const trimmed = (raw || '').trim();
                    if (!trimmed) return '';
                    if (/^https?:\/\//i.test(trimmed)) return trimmed;
                    return `https://${trimmed.replace(/^\/+/, '')}`;
                  };

                  const items: ContactItem[] = [
                    { type: 'email', email: 'emmchierchie@gmail.com' },
                    {
                      type: 'link',
                      title: 'Linked In.',
                      subTitle: 'linkedin.com/in/emmchier',
                      href: 'linkedin.com/in/emmchier',
                    },
                    {
                      type: 'link',
                      title: 'Dribbble.',
                      subTitle: 'dribbble.com/emmchier',
                      href: 'dribbble.com/emmchier',
                    },
                    {
                      type: 'link',
                      title: 'Instagram.',
                      subTitle: 'instagram.com/emmchier',
                      href: 'instagram.com/emmchier',
                    },
                    {
                      type: 'link',
                      title: 'Github.',
                      subTitle: 'github.com/emmchier',
                      href: 'github.com/emmchier',
                    },
                    {
                      type: 'link',
                      title: 'Behance.',
                      subTitle: 'behance.net/emmchier',
                      href: 'behance.net/emmchier',
                    },
                    {
                      type: 'link',
                      title: 'Medium.',
                      subTitle: 'medium.com/@emmchier',
                      href: 'medium.com/@emmchier',
                    },

                    {
                      type: 'link',
                      title: 'X.',
                      subTitle: 'x.com/emmchier',
                      href: 'x.com/emmchier',
                    },
                  ];

                  const chunkSize = SLOT_AREAS.length;
                  const chunks: ContactItem[][] = [];
                  for (let i = 0; i < items.length; i += chunkSize) {
                    chunks.push(items.slice(i, i + chunkSize));
                  }

                  return (
                    <div className="flex flex-col gap-2 w-full min-w-0 pb-4 md:pb-0">
                      {chunks.map((chunk, chunkIndex) => {
                        const isPartialChunk = chunk.length < SLOT_AREAS.length;

                        if (isPartialChunk) {
                          return (
                            <div
                              key={`contact-grid-${chunkIndex}`}
                              className="contact-cards-grid contact-cards-grid--partial w-full min-w-0"
                            >
                              {chunk.map((item, slotIndex) => {
                                const color = SLOT_COLORS[slotIndex];
                                const key = `item-${chunkIndex}-${slotIndex}`;
                                const globalIndex =
                                  chunkIndex * chunkSize + slotIndex;
                                const cellClass =
                                  'min-h-0 min-w-0 h-full w-full';

                                if (item.type === 'email') {
                                  return (
                                    <div key={key} className={cellClass}>
                                      <FadeInCard index={globalIndex}>
                                        <CardButton
                                          color={color}
                                          title="Email."
                                          subTitle={item.email}
                                          actions={[
                                            {
                                              action: 'copy',
                                              value: item.email,
                                              order: 1,
                                            },
                                            {
                                              action: 'email',
                                              value: item.email,
                                              order: 2,
                                            },
                                          ]}
                                        />
                                      </FadeInCard>
                                    </div>
                                  );
                                }

                                const href = normalizeHttps(item.href);
                                return (
                                  <div key={key} className={cellClass}>
                                    <FadeInCard index={globalIndex}>
                                      <CardButton
                                        color={color}
                                        title={item.title}
                                        subTitle={item.subTitle}
                                        actions={[
                                          {
                                            action: 'copy',
                                            value: href,
                                            order: 1,
                                          },
                                          {
                                            action: 'link',
                                            value: href,
                                            order: 2,
                                          },
                                        ]}
                                      />
                                    </FadeInCard>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`contact-grid-${chunkIndex}`}
                            className="contact-cards-grid w-full min-w-0"
                          >
                            {SLOT_AREAS.map((gridArea, slotIndex) => {
                              const item = chunk[slotIndex];
                              const color = SLOT_COLORS[slotIndex];
                              const key = `item-${chunkIndex}-${slotIndex}`;
                              const globalIndex =
                                chunkIndex * chunkSize + slotIndex;

                              if (!item) {
                                return null;
                              }

                              if (item.type === 'email') {
                                return (
                                  <div key={key} style={{ gridArea }}>
                                    <FadeInCard index={globalIndex}>
                                      <CardButton
                                        color={color}
                                        title="Email."
                                        subTitle={item.email}
                                        actions={[
                                          {
                                            action: 'copy',
                                            value: item.email,
                                            order: 1,
                                          },
                                          {
                                            action: 'email',
                                            value: item.email,
                                            order: 2,
                                          },
                                        ]}
                                      />
                                    </FadeInCard>
                                  </div>
                                );
                              }

                              const href = normalizeHttps(item.href);
                              return (
                                <div key={key} style={{ gridArea }}>
                                  <FadeInCard index={globalIndex}>
                                    <CardButton
                                      color={color}
                                      title={item.title}
                                      subTitle={item.subTitle}
                                      actions={[
                                        {
                                          action: 'copy',
                                          value: href,
                                          order: 1,
                                        },
                                        {
                                          action: 'link',
                                          value: href,
                                          order: 2,
                                        },
                                      ]}
                                    />
                                  </FadeInCard>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </TabItem>

          <TabItem label={t.resume}>
            <div className="relative pb-[72px] md:pb-4">
              {activeTabIndex === 1 && (
                <div
                  className="absolute inset-0 z-30 bg-primary-background pointer-events-none"
                  aria-hidden="true"
                  style={{
                    opacity: showTabContentSkeleton ? 1 : 0,
                    transition: showTabContentSkeleton
                      ? 'none'
                      : 'opacity 500ms ease-out',
                  }}
                >
                  <div className="w-full lg:px-[16px]">
                    <ResumeTabSkeleton isMobile={!isResumeDesktopLayout} />
                  </div>
                </div>
              )}
              <div className="lg:px-[16px]">
                {!isResumeDesktopLayout ? (
                  <>
                    <div
                      id="contact-sticky-header"
                      className="sticky top-0 z-20 min-h-[56px] flex flex-col bg-primary-background"
                      style={{ transform: 'translateZ(0)' }}
                    >
                      <div className="flex items-start gap-2 px-4 py-[16px]">
                        <div className="flex min-w-0 flex-1 flex-col">
                          <Text
                            type="title"
                            heading="h3"
                            size="l"
                            weight="bold"
                            className="mb-1"
                            style={{
                              fontSize: '24px',
                              lineHeight: '24px',
                              color: '#5E8BA8',
                            }}
                          >
                            Emmanuel Chierchie
                          </Text>
                          <RotatingRoleLine
                            roles={
                              resumeRoles.length > 0 ? resumeRoles : undefined
                            }
                          />
                        </div>
                        <Button
                          ariaLabel="Resumé actions"
                          type="button"
                          size="s"
                          variant="text"
                          iconButton
                          icon={<MoreVerticalIcon color="currentColor" />}
                          onClick={openResumeMobileActionsSheet}
                          className="mt-0.5 size-[32px]! min-h-[32px]! min-w-[32px]! max-h-[32px]! max-w-[32px]! shrink-0 p-0! border-transparent! bg-[#173B4F]! text-[#E5E5E5]! hover:bg-[#1c4a5f]! focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selected-text/40 [&_svg]:h-[24px]! [&_svg]:w-[24px]!"
                        />
                      </div>
                      <div
                        ref={resumeChipsScrollRef}
                        className="scrollbar-hide overflow-x-auto overflow-y-hidden w-full min-w-0 pt-2 pb-3 px-4 scroll-smooth"
                        style={{
                          WebkitOverflowScrolling: 'touch',
                          touchAction: 'pan-x',
                        }}
                      >
                        <div className="flex flex-nowrap gap-2 pb-1 w-max">
                          {dynamicChips.map(
                            ([key, label]: [ResumeCategory, string]) => {
                              const selected = activeResumeCategory === key;
                              return (
                                <button
                                  key={key}
                                  ref={(el) => {
                                    chipRefsMap.current[key] = el;
                                  }}
                                  type="button"
                                  aria-current={selected ? 'true' : undefined}
                                  aria-disabled={selected}
                                  tabIndex={selected ? -1 : 0}
                                  onClick={() => {
                                    if (selected) return;
                                    setActiveResumeCategory(key);
                                  }}
                                  className={[
                                    'px-3 py-1 text-body-mobile-S font-medium shrink-0 bg-[#173B4F]',
                                    selected
                                      ? 'cursor-default border border-[#E5E5E5] text-[#E5E5E5]'
                                      : 'cursor-pointer border-0 text-[#569CC3]',
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                >
                                  {label}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <ResumeTabContent
                        desktopLayout={false}
                        activeCategory={activeResumeCategory}
                        onCategoryChange={setActiveResumeCategory}
                        animationKey={resumeAnimKey}
                      />
                    </div>
                  </>
                ) : (
                  <ResumeTabContent
                    desktopLayout
                    activeCategory={activeResumeCategory}
                    onCategoryChange={setActiveResumeCategory}
                    animationKey={resumeAnimKey}
                  />
                )}
              </div>
            </div>
          </TabItem>
        </Tab>
      </div>
    </>
  );
}
