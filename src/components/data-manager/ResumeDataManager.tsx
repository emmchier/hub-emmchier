'use client';

import { useEffect } from 'react';
import { useDataStore } from '@/store/data/data-store';
import { useUIStore } from '@/store/ui/ui-store';
import { CONTENTFUL_LOCALE } from '@/i18n/translations';
import type {
  ResumeData,
  ResumeJson,
  ResumeJsonSection,
  ResumeJsonItem,
  ResumeWorkItem,
  ResumeCourseItem,
  ResumeStudyItem,
  ResumeLanguageItem,
} from '@/interfaces';
import type { SupportedLanguage } from '@/i18n/translations';
import { resumeYearFrom, resumeYearTo } from '@/lib/contentful-resume';

// ─── JSON model builder ──────────────────────────────────────────────────────

function buildResumeJson(data: ResumeData): ResumeJson {
  const sections: ResumeJsonSection[] = data.sections.map((section) => {
    const items: ResumeJsonItem[] = section.items.map((item) => {
      const base = item as ResumeWorkItem &
        ResumeCourseItem &
        ResumeStudyItem &
        ResumeLanguageItem;
      return {
        role: base.name ?? '',
        company: base.company,
        dateFrom: base.startDate ? resumeYearFrom(base.startDate) : undefined,
        dateTo: base.endDate
          ? resumeYearFrom(base.endDate)
          : resumeYearTo(undefined),
        description: base.description,
        techs: (base as ResumeWorkItem).techs?.length
          ? (base as ResumeWorkItem).techs
          : undefined,
      };
    });
    return { name: section.name, comment: section.comment, items };
  });

  return {
    name: 'Emmanuel Chierchié',
    roles: data.roles,
    sections,
  };
}

interface ResumeDataManagerProps {
  /** SSR-fetched resume data (always English / en-US). */
  data: ResumeData | null;
}

/**
 * Client bridge: seeds SSR resume data into the Zustand store and keeps it
 * locale-aware. Mirrors the pattern used in Navbar for gallery categories.
 *
 * - On mount: caches the English SSR data in resumeByLang['en'].
 * - On language change to 'es': fetches /api/contentful/resume?locale=es-AR
 *   and caches in resumeByLang['es']. Subsequent switches reuse the cache.
 */
export function ResumeDataManager({ data }: ResumeDataManagerProps) {
  const {
    isResumeFetched,
    setResumeFetched,
    resumeByLang,
    setResumeForLang,
    setResumeJsonForLang,
  } = useDataStore();
  const language = useUIStore((s) => s.language);

  // ── Seed English data from SSR (once per session) ────────────────────────
  useEffect(() => {
    if (isResumeFetched) return;
    if (!data) return;
    setResumeForLang('en', data);
    setResumeJsonForLang('en', buildResumeJson(data));
    setResumeFetched(true);
  }, [
    data,
    isResumeFetched,
    setResumeForLang,
    setResumeFetched,
    setResumeJsonForLang,
  ]);

  // ── Fetch locale-specific data when language changes ─────────────────────
  useEffect(() => {
    // 'en' is already seeded from SSR; skip.
    if (language === 'en') return;
    // Already cached for this language.
    if (resumeByLang[language as SupportedLanguage]) return;

    const locale = CONTENTFUL_LOCALE[language as SupportedLanguage];
    fetch(`/api/contentful/resume?locale=${locale}`)
      .then((res) => res.json())
      .then((json: { data: ResumeData | null }) => {
        if (json.data) {
          const lang = language as SupportedLanguage;
          setResumeForLang(lang, json.data);
          setResumeJsonForLang(lang, buildResumeJson(json.data));
        }
      })
      .catch(() => {
        // Silently fall back to English data in the consumer
      });
  }, [language, resumeByLang, setResumeForLang, setResumeJsonForLang]);

  return null;
}
