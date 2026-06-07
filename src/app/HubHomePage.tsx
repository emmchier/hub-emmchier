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
  Header,
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

// ── Tab indices ────────────────────────────────────────────────────────────────
const TAB_SITES = 0;
const TAB_CONTACT = 1;
const TAB_RESUME = 2;

// ── FadeInCard ─────────────────────────────────────────────────────────────────
/**
 * Two-phase entrance wrapper for contact cards.
 * Phase 1 — Wave (fires once when skeleton ends).
 * Phase 2 — Lazy scroll (cards outside viewport at entrance time).
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

    const rect = el.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight && rect.bottom > 0;

    if (inViewport) {
      setWaveDelay(Math.min(index * 60, 450));
      setState('wave');
    } else {
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
        return { opacity: 0, height: '100%', width: '100%' };
      case 'wave':
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

// ── Main component ─────────────────────────────────────────────────────────────
export default function HubHomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const showTabContentSkeleton = useSkeletonOnce();
  const isResumeDesktopLayout = useMinWidth(1024);

  // Determine which tab is active from the current pathname
  const isResumeRoute = useMemo(
    () => Boolean(pathname && pathname.includes('/resume')),
    [pathname]
  );
  const isContactRoute = useMemo(
    () =>
      Boolean(
        pathname &&
        (pathname === '/contact' || pathname.startsWith('/contact/'))
      ) && !isResumeRoute,
    [pathname, isResumeRoute]
  );

  const getInitialTabIndex = () => {
    if (isResumeRoute) return TAB_RESUME;
    if (isContactRoute) return TAB_CONTACT;
    return TAB_SITES;
  };

  const [activeTabIndex, setActiveTabIndex] = useState(getInitialTabIndex);

  // Resume section URL maps
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

  // Deep-link: read section slug from URL on first render
  // For /resume/work-experience → split gives ['', 'resume', 'work-experience']
  const initialCategory = useMemo<ResumeCategory>(() => {
    const seg = pathname?.split('/')[2];
    return URL_SLUG_TO_CATEGORY[seg ?? ''] ?? 'experience';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [activeResumeCategory, setActiveResumeCategory] =
    useState<ResumeCategory>(initialCategory);
  const [resumeAnimKey, setResumeAnimKey] = useState(0);
  const resumeChipsScrollRef = useRef<HTMLDivElement>(null);
  const chipRefsMap = useRef<Record<ResumeCategory, HTMLButtonElement | null>>(
    {} as Record<ResumeCategory, HTMLButtonElement | null>
  );

  // Avatar shows only on Resumé tab
  const showPersonAvatar = useMemo(
    () => activeTabIndex === TAB_RESUME,
    [activeTabIndex]
  );

  const { openBottomSheet } = useUIStore();
  const t = useTranslation();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // ── Resume data (locale-aware) ──────────────────────────────────────────────
  const resumeByLang = useDataStore((s) => s.resumeByLang);
  const language = useUIStore((s) => s.language);
  const resumeData =
    resumeByLang[language as SupportedLanguage] ?? resumeByLang['en'] ?? null;
  const resumeRoles = resumeData?.roles ?? [];
  const resumeImage = resumeData?.image;
  const dynamicChips = useResumeCategoryChips();

  // Sync tab index when pathname changes (e.g. browser back/forward)
  useEffect(() => {
    if (isResumeRoute) setActiveTabIndex(TAB_RESUME);
    else if (isContactRoute) setActiveTabIndex(TAB_CONTACT);
    else setActiveTabIndex(TAB_SITES);
  }, [isResumeRoute, isContactRoute]);

  // Sync activeResumeCategory to the first available chip when data loads.
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
      deepLinkScrolledRef.current = true;
      requestAnimationFrame(() => {
        scrollToResumeSection(activeResumeCategory, keys as ResumeCategory[]);
      });
    }
  }, [dynamicChips]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL when active resume section changes
  useEffect(() => {
    if (activeTabIndex !== TAB_RESUME) return;
    const next = `/resume/${CATEGORY_TO_URL_SLUG[activeResumeCategory]}`;
    if (window.location.pathname !== next) {
      window.history.replaceState(null, '', next);
    }
  }, [activeResumeCategory, activeTabIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll resume chips to active chip on mobile
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
            await copyLink('/resume');
          },
        },
        {
          value: 'linkedin',
          label: t.shareOnLinkedIn,
          onClick: () => shareOnLinkedIn('/resume'),
        },
        {
          value: 'facebook',
          label: t.shareOnFacebook,
          onClick: () => shareOnFacebook('/resume'),
        },
        {
          value: 'whatsapp',
          label: t.shareOnWhatsapp,
          onClick: () => shareOnWhatsApp('/resume', 'Resumé'),
        },
        {
          value: 'threads',
          label: t.shareOnThreads,
          onClick: () => shareOnThreads('/resume', 'Resumé'),
        },
        {
          value: 'x',
          label: t.shareOnX,
          onClick: () => shareOnX('/resume', 'Resumé'),
        },
      ],
    });
  }, [openBottomSheet, t]);

  return (
    <>
      <div className="relative flex w-full flex-col">
        {/* ── Wave header — "art. / emmchier." with neon entrance animation ── */}
        <div className="relative w-full px-[8px] md:px-0 pt-[24px] md:pt-[32px] pb-[8px] md:pb-0">
          <Header />
        </div>

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
                <div className="skeleton-pulse rounded-full h-[32px] w-[32px] md:h-[48px] md:w-[48px]" />
              </div>
              <div className="flex items-center gap-[16px] justify-end">
                <div className="skeleton-pulse rounded-none h-[20px] w-[60px]" />
                <div className="skeleton-pulse rounded-none h-[20px] w-[84px]" />
                <div className="skeleton-pulse rounded-none h-[20px] w-[84px]" />
              </div>
            </div>
          }
          bodyClasses="overflow-visible"
          defaultActiveIndex={activeTabIndex}
          onTabChange={(index) => {
            setActiveTabIndex(index);
            if (index === TAB_RESUME) {
              setResumeAnimKey((k) => k + 1);
              const slug = CATEGORY_TO_URL_SLUG[activeResumeCategory];
              window.history.replaceState(null, '', `/resume/${slug}`);
            } else if (index === TAB_CONTACT) {
              window.history.replaceState(null, '', '/contact');
            } else {
              // Sites tab
              if (pathname !== '/') router.replace('/');
            }
          }}
          headerClasses="z-30 flex flex-row w-full items-center justify-between gap-4 bg-primary-background px-0 py-0 border-b border-[#2F506B] md:border-b-0 min-h-[72px] md:max-[1265px]:min-h-[64px] min-[1266px]:min-h-[88px]"
          sideContent={
            <div className="relative z-10 flex w-full items-center overflow-visible px-[16px] md:z-auto md:px-[16px]">
              <div className="flex w-full flex-row items-center gap-2 overflow-visible">
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
          {/* ── Tab 0: Sites. ─────────────────────────────────────────────── */}
          <TabItem label={t.sites}>
            <div className="relative pb-[72px] md:pb-4">
              <div className="md:px-[16px] flex items-center justify-center min-h-[40vh]">
                {/* Sites content — coming soon */}
                <Text
                  type="body"
                  size="m"
                  color="primary"
                  className="opacity-40"
                >
                  Coming soon.
                </Text>
              </div>
            </div>
          </TabItem>

          {/* ── Tab 1: Contact. ───────────────────────────────────────────── */}
          <TabItem label={t.contact}>
            <div className="relative pb-[72px] md:pb-4">
              {activeTabIndex === TAB_CONTACT && (
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
                    | { type: 'email'; email: string }
                    | {
                        type: 'link';
                        title: string;
                        subTitle: string;
                        href: string;
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

                  const SLOT_COLORS = [
                    '#67CFCB',
                    '#74BDE8',
                    '#F6D4C2',
                    '#74BDE8',
                    '#67CFCB',
                    '#F6D4C2',
                    '#74BDE8',
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

                              if (!item) return null;

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

          {/* ── Tab 2: Resumé. ────────────────────────────────────────────── */}
          <TabItem label={t.resume}>
            <div className="relative pb-[72px] md:pb-4">
              {activeTabIndex === TAB_RESUME && (
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
