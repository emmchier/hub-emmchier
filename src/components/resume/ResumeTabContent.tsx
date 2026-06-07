'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  DownloadIcon,
  FadeInCard,
  ShareIcon,
  Text,
  Tooltip,
  Dropdown,
  CheckIcon,
} from '@/components';
import { ResumeCard } from './ResumeCard';
import { RotatingRoleLine } from './RotatingRoleLine';
import {
  copyLink,
  shareOnFacebook,
  shareOnLinkedIn,
  shareOnThreads,
  shareOnWhatsApp,
  shareOnX,
} from '@/utils/functions';
import { useDataStore } from '@/store/data/data-store';
import { useUIStore } from '@/store/ui/ui-store';
import type {
  ResumeSectionSlug,
  ResumeWorkItem,
  ResumeCourseItem,
  ResumeStudyItem,
  ResumeLanguageItem,
  ResumeSection,
} from '@/interfaces';
import { resumeYearFrom, resumeYearTo } from '@/lib/contentful-resume';
import type { SupportedLanguage } from '@/i18n/translations';
import { generateAtsPdf } from '@/utils/generate-ats-pdf';

// ─── Category types ─────────────────────────────────────────────────────────

export type ResumeCategory = 'experience' | 'courses' | 'studies' | 'languages';

/** Maps Contentful slug → UI category key */
const SLUG_TO_CATEGORY: Record<ResumeSectionSlug, ResumeCategory> = {
  'work-experience': 'experience',
  courses: 'courses',
  studies: 'studies',
  languages: 'languages',
};

const CANONICAL_ORDER: ResumeCategory[] = [
  'experience',
  'courses',
  'studies',
  'languages',
];

export const RESUME_CHIP_LABELS: Record<ResumeCategory, string> = {
  experience: 'Work experience',
  courses: 'Courses',
  studies: 'Studies',
  languages: 'Languages',
};

// ─── Static constants ────────────────────────────────────────────────────────

const STROKE_PX = 3;
const NAV_FONT_PX = 94;
const NAV_OUTLINE_STROKE = '#437B9A';
const NAV_SELECTED_STROKE = '#e5e5e5';
const SCROLL_SPY_ACTIVATION_PX = 40;
const SCROLL_SPY_NEAR_BOTTOM_PX = 220;
const NAV_CLICK_SCROLL_LOCK_MS = 900;

/** Pauses scroll spy briefly while a nav-click smooth scroll is in flight. */
let resumeNavScrollLockUntil = 0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Keeps the last word on one line (no orphan). */
function resumeNavLabelLine(text: string) {
  const lastSpace = text.lastIndexOf(' ');
  if (lastSpace <= 0) return <span className="whitespace-nowrap">{text}</span>;
  return (
    <>
      {text.slice(0, lastSpace + 1)}
      <span className="whitespace-nowrap">{text.slice(lastSpace + 1)}</span>
    </>
  );
}

function getScrollableAncestor(el: HTMLElement | null): HTMLElement | null {
  let node: HTMLElement | null = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (
      overflowY === 'auto' ||
      overflowY === 'scroll' ||
      overflowY === 'overlay'
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/** True when the page/window scrolls (not a nested overflow container). */
function usesDocumentScroll(scrollRoot: HTMLElement | null): boolean {
  if (!scrollRoot) return true;
  return scrollRoot.scrollHeight <= scrollRoot.clientHeight + 2;
}

function getResumeNavButtons(): HTMLElement[] {
  const nav = document.querySelector<HTMLElement>(
    'nav[aria-label="Resume sections"]'
  );
  return nav ? [...nav.querySelectorAll<HTMLElement>('button')] : [];
}

function getResumeButtonLine(
  cat: ResumeCategory,
  categories: ResumeCategory[]
): number {
  const buttons = getResumeNavButtons();
  const idx = categories.indexOf(cat);
  const button = buttons[idx];
  return (
    (button?.getBoundingClientRect().top ?? SCROLL_SPY_ACTIVATION_PX) +
    SCROLL_SPY_ACTIVATION_PX
  );
}

/** Scroll a section to the same Y band the desktop scroll spy uses. */
export function scrollToResumeSection(
  cat: ResumeCategory,
  categories: ResumeCategory[] = CANONICAL_ORDER
): void {
  const el = document.getElementById(`resume-section-${cat}`);
  if (!el) return;

  resumeNavScrollLockUntil = Date.now() + NAV_CLICK_SCROLL_LOCK_MS;

  const buttons = getResumeNavButtons();
  const idx = categories.indexOf(cat);
  if (buttons[idx]) {
    const lineY = getResumeButtonLine(cat, categories);
    const prevMargin = el.style.scrollMarginTop;
    el.style.scrollMarginTop = `${lineY}px`;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const restoreMargin = () => {
      el.style.scrollMarginTop = prevMargin;
    };
    if ('onscrollend' in window) {
      window.addEventListener('scrollend', restoreMargin, { once: true });
    } else {
      setTimeout(restoreMargin, 900);
    }
    return;
  }

  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Reading line for document scroll — first sticky nav label + activation offset. */
function getResumeSpyLineY(): number {
  const buttons = getResumeNavButtons();
  return (
    (buttons[0]?.getBoundingClientRect().top ?? SCROLL_SPY_ACTIVATION_PX) +
    SCROLL_SPY_ACTIVATION_PX
  );
}

/**
 * Canonical scroll spy (HEAD algorithm). Forward pass: last section whose top
 * crossed the reading line. Near page bottom: prefer the last section while its
 * header has not reached the line — but keep the current one once aligned.
 */
function getCategoryAtScrollPosition(
  categories: ResumeCategory[],
  _activationOffsetPx: number,
  nearBottomPx: number,
  scrollRoot: HTMLElement | null = null
): ResumeCategory {
  let maxScroll: number;
  let distanceFromBottom: number;

  if (scrollRoot && !usesDocumentScroll(scrollRoot)) {
    const { scrollTop, clientHeight, scrollHeight } = scrollRoot;
    maxScroll = Math.max(0, scrollHeight - clientHeight);
    distanceFromBottom = maxScroll - scrollTop;
  } else {
    const scrollTop = window.scrollY;
    const clientHeight = window.innerHeight;
    const scrollHeight = document.documentElement.scrollHeight;
    maxScroll = Math.max(0, scrollHeight - clientHeight);
    distanceFromBottom = maxScroll - scrollTop;
  }

  // Sticky nav label band — same reference for body scroll and window scroll.
  const lineY = getResumeSpyLineY();

  let active = categories[0]!;
  for (const cat of categories) {
    const section = document.getElementById(`resume-section-${cat}`);
    if (!section) continue;
    if (section.getBoundingClientRect().top <= lineY) active = cat;
  }

  const lastCat = categories[categories.length - 1]!;
  const lastSection = document.getElementById(`resume-section-${lastCat}`);
  const lastTop =
    lastSection?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;

  if (maxScroll > 8 && lastTop > lineY && distanceFromBottom <= nearBottomPx) {
    if (distanceFromBottom <= 48 && lastTop < window.innerHeight) {
      return lastCat;
    }
    const activeSection = document.getElementById(`resume-section-${active}`);
    const activeTop =
      activeSection?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
    if (activeTop > lineY) return lastCat;
    return active;
  }

  return active;
}

function getResumeNavMetrics() {
  if (typeof window === 'undefined')
    return { fontPx: NAV_FONT_PX, strokePx: STROKE_PX };
  const w = window.innerWidth;
  if (w >= 1440) return { fontPx: NAV_FONT_PX, strokePx: STROKE_PX };
  return { fontPx: 68, strokePx: 2.5 };
}

// ─── Nav label renderers ─────────────────────────────────────────────────────

function ResumeNavOutlineLabel({
  text,
  fontPx = NAV_FONT_PX,
  strokePx = STROKE_PX,
}: {
  text: string;
  fontPx?: number;
  strokePx?: number;
}) {
  return (
    <span
      className="block max-w-full font-bold tracking-[-0.02em]"
      style={{
        fontSize: fontPx,
        lineHeight: 0.8,
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        WebkitTextStroke: `${strokePx}px ${NAV_OUTLINE_STROKE}`,
        paintOrder: 'stroke fill',
      }}
    >
      {resumeNavLabelLine(text)}
    </span>
  );
}

function ResumeNavSelectedLabel({
  text,
  fontPx = NAV_FONT_PX,
  strokePx = STROKE_PX,
}: {
  text: string;
  fontPx?: number;
  strokePx?: number;
}) {
  return (
    <span
      className="block max-w-full font-bold tracking-[-0.02em]"
      style={{
        fontSize: fontPx,
        lineHeight: 0.8,
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        WebkitTextStroke: `${strokePx}px ${NAV_SELECTED_STROKE}`,
        paintOrder: 'stroke fill',
      }}
    >
      {resumeNavLabelLine(text)}
    </span>
  );
}

function ResumeSectionComment({ comment }: { comment?: string }) {
  if (!comment) return null;
  return (
    <p className="mb-1.5 mt-0 text-[14px] font-normal leading-normal text-[#569CC3]">
      {comment}
    </p>
  );
}

// ─── Section renderers ────────────────────────────────────────────────────────

function renderExperienceSection(section: ResumeSection, animKey: number) {
  const items = section.items as ResumeWorkItem[];
  return (
    <>
      <ResumeSectionComment comment={section.comment} />
      <div className="flex flex-col gap-3 pb-4 pt-1">
        {items.map((item, idx) => (
          <FadeInCard key={item.id} index={idx} animationKey={animKey}>
            <ResumeCard
              company={item.company}
              role={item.name}
              description={item.description}
              showDescription={Boolean(item.description)}
              techList={item.techs}
              dateFrom={resumeYearFrom(item.startDate)}
              dateTo={resumeYearTo(item.endDate)}
            />
          </FadeInCard>
        ))}
      </div>
    </>
  );
}

function renderCoursesSection(section: ResumeSection, animKey: number) {
  const items = section.items as ResumeCourseItem[];
  return (
    <>
      <ResumeSectionComment comment={section.comment} />
      <div className="flex flex-col gap-3 pb-4 pt-1">
        {items.map((item, idx) => (
          <FadeInCard key={item.id} index={idx} animationKey={animKey}>
            <ResumeCard
              company={item.company}
              role={item.name}
              description={item.description}
              showDescription={Boolean(item.description)}
              dateFrom={resumeYearFrom(item.startDate)}
              dateTo={resumeYearTo(item.endDate)}
            />
          </FadeInCard>
        ))}
      </div>
    </>
  );
}

function renderStudiesSection(section: ResumeSection, animKey: number) {
  const items = section.items as ResumeStudyItem[];
  return (
    <>
      <ResumeSectionComment comment={section.comment} />
      <div className="flex flex-col gap-3 pb-4 pt-1">
        {items.map((item, idx) => (
          <FadeInCard key={item.id} index={idx} animationKey={animKey}>
            <ResumeCard
              company={item.company}
              role={item.name}
              dateFrom={resumeYearFrom(item.startDate)}
              dateTo={resumeYearTo(item.endDate)}
            />
          </FadeInCard>
        ))}
      </div>
    </>
  );
}

function renderLanguagesSection(section: ResumeSection, animKey: number) {
  const items = section.items as ResumeLanguageItem[];
  return (
    <>
      <ResumeSectionComment comment={section.comment} />
      <div className="grid grid-cols-1 gap-2 pb-4 pt-1 lg:grid-cols-2">
        {items.map((item, idx) => (
          <FadeInCard key={item.id} index={idx} animationKey={animKey}>
            <ResumeCard
              role={item.name}
              rightContent="text"
              rightContentText={item.description}
            />
          </FadeInCard>
        ))}
      </div>
    </>
  );
}

function renderSectionContent(
  category: ResumeCategory,
  section: ResumeSection,
  animKey: number
) {
  switch (category) {
    case 'experience':
      return renderExperienceSection(section, animKey);
    case 'courses':
      return renderCoursesSection(section, animKey);
    case 'studies':
      return renderStudiesSection(section, animKey);
    case 'languages':
      return renderLanguagesSection(section, animKey);
  }
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ResumeTabContentProps {
  activeCategory: ResumeCategory;
  onCategoryChange?: (category: ResumeCategory) => void;
  desktopLayout?: boolean;
  /** Increment to re-trigger the FadeInCard wave on each tab click. */
  animationKey?: number;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ResumeTabContent({
  activeCategory,
  onCategoryChange,
  desktopLayout = false,
  animationKey = 0,
}: ResumeTabContentProps) {
  const isDesktop = desktopLayout;
  const [isCopied, setIsCopied] = useState(false);
  const [resumeNavMetrics, setResumeNavMetrics] = useState(getResumeNavMetrics);
  const activeCategoryRef = useRef(activeCategory);
  activeCategoryRef.current = activeCategory;

  // ── Contentful data from store (locale-aware) ────────────────────────────
  const resumeByLang = useDataStore((s) => s.resumeByLang);
  const resumeJsonByLang = useDataStore((s) => s.resumeJsonByLang);
  const language = useUIStore((s) => s.language);
  // Prefer current language; fall back to English while the locale fetch is in flight
  const resumeData =
    resumeByLang[language as SupportedLanguage] ?? resumeByLang['en'] ?? null;
  const resumeJson =
    resumeJsonByLang[language as SupportedLanguage] ??
    resumeJsonByLang['en'] ??
    null;

  // Build sections map and active categories from Contentful data
  const { activeCats, sectionsByCategory } = (() => {
    if (!resumeData || resumeData.sections.length === 0) {
      // Data not loaded yet — return empty map (render nothing rather than all 4 stubs)
      return {
        activeCats: [] as ResumeCategory[],
        sectionsByCategory: new Map<ResumeCategory, ResumeSection>(),
      };
    }

    const map = new Map<ResumeCategory, ResumeSection>();
    for (const section of resumeData.sections) {
      const cat = SLUG_TO_CATEGORY[section.slug];
      if (cat) map.set(cat, section);
    }

    // Maintain canonical order, include only non-empty sections
    const cats = CANONICAL_ORDER.filter((c) => map.has(c));
    return {
      activeCats: cats.length > 0 ? cats : CANONICAL_ORDER,
      sectionsByCategory: map,
    };
  })();

  const roles = resumeData?.roles ?? [];

  // ── Scroll spy (desktop) ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isDesktop) return;
    const onResize = () => setResumeNavMetrics(getResumeNavMetrics());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop || !onCategoryChange) return;

    let cleaned = false;
    let scrollRootEl: HTMLElement | null = null;
    let pendingRaf = 0;
    let scrollTicking = false;

    const applySpy = () => {
      if (cleaned) return;
      if (Date.now() < resumeNavScrollLockUntil) return;
      const next = getCategoryAtScrollPosition(
        activeCats,
        SCROLL_SPY_ACTIVATION_PX,
        SCROLL_SPY_NEAR_BOTTOM_PX,
        scrollRootEl
      );
      if (next !== activeCategoryRef.current) onCategoryChange(next);
    };

    const onScrollOrResize = () => {
      if (scrollTicking || cleaned) return;
      scrollTicking = true;
      pendingRaf = requestAnimationFrame(() => {
        scrollTicking = false;
        if (!cleaned) applySpy();
      });
    };

    const cleanups: Array<() => void> = [];

    const setup = () => {
      if (cleaned) return;
      const first = document.getElementById(`resume-section-${activeCats[0]}`);
      if (!first) return;
      scrollRootEl = getScrollableAncestor(first);

      applySpy();

      // Document scroll is primary on desktop resume; always listen on window.
      window.addEventListener('scroll', onScrollOrResize, { passive: true });
      cleanups.push(() =>
        window.removeEventListener('scroll', onScrollOrResize)
      );

      if (scrollRootEl && !usesDocumentScroll(scrollRootEl)) {
        scrollRootEl.addEventListener('scroll', onScrollOrResize, {
          passive: true,
        });
        cleanups.push(() =>
          scrollRootEl?.removeEventListener('scroll', onScrollOrResize)
        );
      }

      const clearNavScrollLock = () => {
        resumeNavScrollLockUntil = 0;
      };
      window.addEventListener('wheel', clearNavScrollLock, { passive: true });
      window.addEventListener('touchmove', clearNavScrollLock, {
        passive: true,
      });
      cleanups.push(() => {
        window.removeEventListener('wheel', clearNavScrollLock);
        window.removeEventListener('touchmove', clearNavScrollLock);
      });

      window.addEventListener('resize', onScrollOrResize, { passive: true });
      cleanups.push(() =>
        window.removeEventListener('resize', onScrollOrResize)
      );

      const ro = new ResizeObserver(onScrollOrResize);
      if (scrollRootEl && !usesDocumentScroll(scrollRootEl)) {
        ro.observe(scrollRootEl);
      } else {
        ro.observe(document.documentElement);
      }
      for (const cat of activeCats) {
        const el = document.getElementById(`resume-section-${cat}`);
        if (el) ro.observe(el);
      }
      const resumeNav = document.querySelector(
        'nav[aria-label="Resume sections"]'
      );
      if (resumeNav) {
        ro.observe(resumeNav);
        for (const btn of resumeNav.querySelectorAll('button')) {
          ro.observe(btn);
        }
      }
      cleanups.push(() => ro.disconnect());
    };

    const frame = requestAnimationFrame(setup);
    return () => {
      cleaned = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pendingRaf);
      cleanups.forEach((fn) => fn());
    };
  }, [isDesktop, onCategoryChange, activeCats]);

  const handleDesktopNavClick = useCallback(
    (cat: ResumeCategory) => {
      onCategoryChange?.(cat);
      requestAnimationFrame(() => scrollToResumeSection(cat, activeCats));
    },
    [onCategoryChange, activeCats]
  );

  // ── Desktop layout ────────────────────────────────────────────────────────
  if (isDesktop) {
    const handleCopyLink = async () => {
      await copyLink('/contact/resume/work-experience');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    };

    const shareOptions = [
      {
        value: 'copy-link',
        label: isCopied ? 'Copied!' : 'Copy link',
        icon: isCopied ? (
          <CheckIcon
            color="currentColor"
            size="sm"
            className="text-green-500"
          />
        ) : undefined,
        onClick: handleCopyLink,
        className: isCopied ? '!text-green-500' : '',
      },
      {
        value: 'linkedin',
        label: 'Share on LinkedIn',
        onClick: () => shareOnLinkedIn('/contact/resume/work-experience'),
      },
      {
        value: 'facebook',
        label: 'Share on Facebook',
        onClick: () => shareOnFacebook('/contact/resume/work-experience'),
      },
      {
        value: 'whatsapp',
        label: 'Share on WhatsApp',
        onClick: () =>
          shareOnWhatsApp('/contact/resume/work-experience', 'Resumé'),
      },
      {
        value: 'threads',
        label: 'Share on Threads',
        onClick: () =>
          shareOnThreads('/contact/resume/work-experience', 'Resumé'),
      },
      {
        value: 'x',
        label: 'Share on X',
        onClick: () => shareOnX('/contact/resume/work-experience', 'Resumé'),
      },
    ];

    return (
      <div className="flex w-full min-h-0 flex-col">
        <div className="grid w-full min-h-0 grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-x-6 lg:gap-y-0 xl:gap-x-8">
          {/* Left: sticky nav */}
          <div className="flex w-full min-w-0 max-w-full flex-col gap-4 lg:sticky lg:top-6 lg:z-10 lg:col-span-6 lg:self-start lg:bg-primary-background">
            <header className="flex w-full max-w-full flex-col gap-4 pb-4">
              <div className="flex w-full min-w-0 flex-row items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Text
                    type="title"
                    heading="h3"
                    size="l"
                    weight="bold"
                    className="mb-[8px] w-full"
                    style={{
                      fontSize: '40px',
                      lineHeight: '40px',
                      color: '#5E8BA8',
                    }}
                  >
                    Emmanuel Chierchie
                  </Text>
                  <RotatingRoleLine
                    roles={roles.length > 0 ? roles : undefined}
                  />
                </div>
                <div className="flex shrink-0 flex-wrap items-start justify-end gap-2">
                  <Tooltip
                    content={
                      language === 'es' ? 'Descargar PDF' : 'Download PDF'
                    }
                    direction="bottom"
                  >
                    <Button
                      ariaLabel={
                        language === 'es' ? 'Descargar PDF' : 'Download PDF'
                      }
                      type="button"
                      size="m"
                      variant="outlined"
                      iconButton
                      icon={
                        <DownloadIcon
                          color="currentColor"
                          width={28}
                          height={28}
                          className="shrink-0"
                        />
                      }
                      className="border-[#2D6786] text-[#F6D4C2]! hover:border-[#2D6786] hover:bg-[#2D6786]/15! focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selected-text/40"
                      onClick={() => {
                        if (resumeJson)
                          generateAtsPdf(resumeJson, language as 'en' | 'es');
                      }}
                    />
                  </Tooltip>
                  <Dropdown
                    trigger={
                      <Button
                        ariaLabel="Share resumé"
                        type="button"
                        size="m"
                        variant="outlined"
                        iconButton
                        icon={
                          <ShareIcon
                            color="currentColor"
                            width={28}
                            height={28}
                            className="shrink-0"
                          />
                        }
                        className="border-[#2D6786] text-[#F6D4C2]! hover:border-[#2D6786] hover:bg-[#2D6786]/15! focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selected-text/40"
                      />
                    }
                    listItems={shareOptions}
                    menuAlignment="bottomRight"
                    openBy="click"
                    menuWidth="w-[200px]"
                    closeOnItemClick={false}
                    showIcons={true}
                    iconPosition="right"
                  />
                </div>
              </div>
            </header>
            <nav
              className="flex w-full flex-col gap-8"
              aria-label="Resume sections"
            >
              {activeCats.map((cat) => {
                const selected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-current={selected ? 'location' : undefined}
                    aria-disabled={selected}
                    tabIndex={selected ? -1 : 0}
                    onClick={() => {
                      if (selected) return;
                      handleDesktopNavClick(cat);
                    }}
                    onMouseDown={(e) => {
                      if (selected) return;
                      e.preventDefault();
                    }}
                    className={[
                      'w-full border-0 bg-transparent p-0 text-left transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selected-text/40',
                      selected
                        ? 'cursor-default'
                        : 'cursor-pointer hover:opacity-90',
                    ].join(' ')}
                  >
                    {selected ? (
                      <ResumeNavSelectedLabel
                        text={`${sectionsByCategory.get(cat)?.name ?? ''}.`}
                        fontPx={resumeNavMetrics.fontPx}
                        strokePx={resumeNavMetrics.strokePx}
                      />
                    ) : (
                      <ResumeNavOutlineLabel
                        text={`${sectionsByCategory.get(cat)?.name ?? ''}.`}
                        fontPx={resumeNavMetrics.fontPx}
                        strokePx={resumeNavMetrics.strokePx}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: sections — extra bottom pad so Languages clears the footer */}
          <div className="min-w-0 w-full lg:col-span-6 lg:pb-40">
            {activeCats.map((cat, index) => {
              const section = sectionsByCategory.get(cat);
              if (!section) return null;
              return (
                <div key={cat}>
                  {index > 0 ? (
                    <div
                      className="my-10 w-full border-0 border-t border-[#2F506B]/55"
                      aria-hidden
                    />
                  ) : null}
                  <section
                    id={`resume-section-${cat}`}
                    className="scroll-mt-6 lg:px-0"
                  >
                    {renderSectionContent(cat, section, animationKey)}
                  </section>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Mobile layout ─────────────────────────────────────────────────────────
  const renderMobileSection = (category: ResumeCategory) => {
    const section = sectionsByCategory.get(category);
    if (!section) return null;
    return (
      <section className="w-full px-4">
        {renderSectionContent(category, section, animationKey)}
      </section>
    );
  };

  return <div className="w-full">{renderMobileSection(activeCategory)}</div>;
}

// ─── Exported helpers for contact page ───────────────────────────────────────

/**
 * Static chip list in canonical order (all 4 categories).
 * @deprecated Use `useResumeCategoryChips()` to get only the categories
 * that are actually populated in Contentful for the current language.
 */
export const RESUME_CATEGORY_CHIPS: [ResumeCategory, string][] =
  CANONICAL_ORDER.map((cat) => [cat, RESUME_CHIP_LABELS[cat]]);

/**
 * Dynamic hook — returns only the chips that correspond to non-empty sections
 * in Contentful, in canonical order, for the current UI language.
 * Falls back to all 4 chips while data is loading so the row doesn't jump.
 */
export function useResumeCategoryChips(): [ResumeCategory, string][] {
  const resumeByLang = useDataStore((s) => s.resumeByLang);
  const language = useUIStore((s) => s.language);
  const resumeData =
    resumeByLang[language as SupportedLanguage] ?? resumeByLang['en'] ?? null;

  if (!resumeData || resumeData.sections.length === 0) {
    // Data not yet loaded — return empty so no phantom chips show
    return [];
  }

  const sectionBySlugCat = new Map(
    resumeData.sections
      .map((s) => {
        const cat = SLUG_TO_CATEGORY[s.slug];
        return cat ? ([cat, s] as const) : null;
      })
      .filter(
        (x): x is [ResumeCategory, (typeof resumeData.sections)[0]] =>
          x !== null
      )
  );
  return CANONICAL_ORDER.filter((cat) => sectionBySlugCat.has(cat)).map(
    (cat) => [cat, sectionBySlugCat.get(cat)!.name]
  );
}
