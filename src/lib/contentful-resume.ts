/**
 * Contentful client for the separate "emmchier" resume space.
 * Completely isolated from the art-emmchier space used for gallery/drawings.
 *
 * Space ID:        q5y2ne2ymfu8   (env: CONTENTFUL_RESUME_SPACE_ID)
 * Delivery token:  (env: CONTENTFUL_RESUME_DELIVERY_TOKEN)
 *
 * Data model:
 *   resume (1 entry)
 *     ├── title
 *     ├── image
 *     ├── roles[]        (short text list, max 3)
 *     └── sections[]     (refs to Section entries)
 *           └── items[]  (refs to workExperience / courses / studies / languages entries)
 *
 *   socialNetwork (7 entries — Contact / Say Hello)
 *     ├── name    (e.g. "Linked In")
 *     ├── slug    (e.g. "linked-in")
 *     ├── url     (full URL, e.g. "https://www.linkedin.com/in/emmchier")
 *     └── order   (Integer, optional — not populated yet, see SOCIAL_ORDER_FALLBACK)
 *
 * A single getEntries call with include:5 resolves the full `resume` tree in
 * one request. `socialNetwork` entries are fetched separately (flat list, no
 * includes needed).
 */

import { createClient } from 'contentful';
import type {
  ResumeData,
  ResumeSectionSlug,
  ResumeWorkItem,
  ResumeCourseItem,
  ResumeStudyItem,
  ResumeLanguageItem,
  ResumeSection,
  SocialNetworkItem,
} from '@/interfaces';

// ─── Client ─────────────────────────────────────────────────────────────────

const resumeSpace = process.env.CONTENTFUL_RESUME_SPACE_ID;
const resumeToken = process.env.CONTENTFUL_RESUME_DELIVERY_TOKEN;

const resumeClient =
  resumeSpace && resumeToken
    ? createClient({
        space: resumeSpace,
        accessToken: resumeToken,
        environment: 'master',
      })
    : null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract 4-digit year string from an ISO date string. */
function toYear(isoDate?: string): string | undefined {
  if (!isoDate) return undefined;
  try {
    return String(new Date(isoDate).getFullYear());
  } catch {
    return undefined;
  }
}

/** Descending sort by startDate (most recent first). */
function byStartDateDesc<T extends { startDate?: string }>(a: T, b: T): number {
  const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
  const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
  return bTime - aTime;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEntry = Record<string, any>;

/** Build a map { entryId → fields } from includes.Entry. */
function buildIncludesMap(includes?: {
  Entry?: AnyEntry[];
}): Map<string, AnyEntry> {
  const map = new Map<string, AnyEntry>();
  for (const entry of includes?.Entry ?? []) {
    map.set(entry.sys?.id ?? '', entry.fields ?? {});
  }
  return map;
}

/** Resolve tech names from a list of Entry link objects + includes map. */
function resolveTechs(
  techLinks: AnyEntry[] = [],
  includesMap: Map<string, AnyEntry>
): string[] {
  return techLinks
    .map((link) => {
      const id = link?.sys?.id ?? '';
      const fields = includesMap.get(id);
      return typeof fields?.name === 'string' ? fields.name : null;
    })
    .filter((n): n is string => n !== null);
}

// ─── Normalizers per section type ────────────────────────────────────────────

function normalizeWorkExperience(
  entries: AnyEntry[],
  includesMap: Map<string, AnyEntry>
): ResumeWorkItem[] {
  return entries
    .map(
      (entry): ResumeWorkItem => ({
        id: entry.sys?.id ?? '',
        name: entry.fields?.name ?? '',
        company: entry.fields?.company ?? '',
        description: entry.fields?.description,
        startDate: entry.fields?.startDate,
        endDate: entry.fields?.endDate,
        techs: resolveTechs(entry.fields?.techs ?? [], includesMap),
      })
    )
    .sort(byStartDateDesc);
}

function normalizeCourses(entries: AnyEntry[]): ResumeCourseItem[] {
  return entries
    .map(
      (entry): ResumeCourseItem => ({
        id: entry.sys?.id ?? '',
        name: entry.fields?.name ?? '',
        company: entry.fields?.company ?? '',
        description: entry.fields?.description,
        startDate: entry.fields?.startDate,
        endDate: entry.fields?.endDate,
      })
    )
    .sort(byStartDateDesc);
}

function normalizeStudies(entries: AnyEntry[]): ResumeStudyItem[] {
  return entries
    .map(
      (entry): ResumeStudyItem => ({
        id: entry.sys?.id ?? '',
        name: entry.fields?.name ?? '',
        company: entry.fields?.company ?? '',
        startDate: entry.fields?.startDate,
        endDate: entry.fields?.endDate,
      })
    )
    .sort(byStartDateDesc);
}

function normalizeLanguages(entries: AnyEntry[]): ResumeLanguageItem[] {
  return entries.map(
    (entry): ResumeLanguageItem => ({
      id: entry.sys?.id ?? '',
      name: entry.fields?.name ?? '',
      description: entry.fields?.description ?? '',
    })
  );
}

// ─── Section assembly ────────────────────────────────────────────────────────

const SECTION_ORDER: ResumeSectionSlug[] = [
  'work-experience',
  'courses',
  'studies',
  'languages',
];

const SECTION_NAMES: Record<ResumeSectionSlug, string> = {
  'work-experience': 'Work experience',
  courses: 'Courses',
  studies: 'Studies',
  languages: 'Languages',
};

function buildItemsForSlug(
  slug: ResumeSectionSlug,
  rawItems: AnyEntry[],
  includesMap: Map<string, AnyEntry>
) {
  switch (slug) {
    case 'work-experience':
      return normalizeWorkExperience(rawItems, includesMap);
    case 'courses':
      return normalizeCourses(rawItems);
    case 'studies':
      return normalizeStudies(rawItems);
    case 'languages':
      return normalizeLanguages(rawItems);
  }
}

// ─── Main fetch — single call to `resume` ────────────────────────────────────

/**
 * Fetches all resume data with a **single** Contentful call.
 *
 * Fetches the `resume` entry with include:5 which resolves the full tree:
 *   resume → sections[] → items[] (workExperience / courses / studies / languages)
 *
 * Only Published entries are returned by the Delivery API.
 * Sections or items that are still in Draft will simply not appear — that is
 * intentional: publish them in Contentful when they're ready to go live.
 *
 * Returns null if Contentful is unreachable or not configured.
 */
export async function fetchResumeData(
  locale = 'en-US'
): Promise<ResumeData | null> {
  if (!resumeClient) return null;

  try {
    const response = await resumeClient.getEntries({
      content_type: 'resume',
      include: 5,
      limit: 1,
      locale,
    });

    const entry = response.items?.[0];
    if (!entry) return null;

    // Roles (max 3)
    const roles: string[] = Array.isArray(entry.fields?.roles)
      ? (entry.fields.roles as string[]).slice(0, 3)
      : [];

    // Image — asset link resolved by include:5
    const imageAsset = entry.fields?.image as AnyEntry | undefined;
    const imageUrl: string | undefined = imageAsset?.fields?.file?.url
      ? `https:${imageAsset.fields.file.url}`
      : undefined;

    // Includes map for resolving linked entries (techs, etc.)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const includesMap = buildIncludesMap((response as any).includes);

    // Sections — linked Section entries, in the order defined in Contentful
    const rawSections: AnyEntry[] = Array.isArray(entry.fields?.sections)
      ? (entry.fields.sections as AnyEntry[])
      : [];

    const sectionsMap = new Map<ResumeSectionSlug, ResumeSection>();

    for (const sectionEntry of rawSections) {
      const slug = sectionEntry?.fields?.slug as ResumeSectionSlug | undefined;
      if (!slug || !SECTION_ORDER.includes(slug)) continue;

      const rawItems: AnyEntry[] = Array.isArray(sectionEntry.fields?.items)
        ? (sectionEntry.fields.items as AnyEntry[])
        : [];

      const items = buildItemsForSlug(slug, rawItems, includesMap);
      if (items.length === 0) continue;

      sectionsMap.set(slug, {
        slug,
        name:
          (sectionEntry.fields?.name as string | undefined) ??
          SECTION_NAMES[slug],
        comment: sectionEntry.fields?.description as string | undefined,
        items,
      });
    }

    // Maintain canonical order
    const sections = SECTION_ORDER.map((slug) => sectionsMap.get(slug)).filter(
      (s): s is ResumeSection => s !== undefined
    );

    return { roles, image: imageUrl, sections };
  } catch {
    return null;
  }
}

/**
 * Say Hello grid order fallback, keyed by Contentful `slug`.
 *
 * The `socialNetwork` content type has an `order` (Integer) field meant to
 * drive this ordering from Contentful, but it isn't populated on any entry
 * yet — until it is, this map guarantees the exact grid order the Contact
 * page currently ships with. Once an editor sets `order` on an entry in
 * Contentful, that numeric value wins over this fallback for that entry.
 */
const SOCIAL_ORDER_FALLBACK: Record<string, number> = {
  'linked-in': 1,
  dribbble: 2,
  instagram: 3,
  github: 4,
  behance: 5,
  medium: 6,
  x: 7,
};

/** Strips "https://", "http://" and a leading "www." for display + link building. */
function stripProtocolAndWww(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
}

/**
 * Fetches all `socialNetwork` entries from the resume space, sorted by the
 * Contentful `order` field when set, falling back to `SOCIAL_ORDER_FALLBACK`
 * (by slug) otherwise. `url` is normalized (no protocol, no "www.") so it can
 * be used directly as both the display subtitle and the link href.
 *
 * Returns [] if Contentful is unreachable or not configured.
 */
export async function fetchSocialNetworks(): Promise<SocialNetworkItem[]> {
  if (!resumeClient) return [];

  try {
    const response = await resumeClient.getEntries({
      content_type: 'socialNetwork',
    });

    return response.items
      .map(
        (entry): SocialNetworkItem => ({
          id: entry.sys.id,
          name: (entry.fields?.name as string) ?? '',
          slug: (entry.fields?.slug as string) ?? '',
          url: stripProtocolAndWww((entry.fields?.url as string) ?? ''),
          order:
            typeof entry.fields?.order === 'number'
              ? entry.fields.order
              : undefined,
        })
      )
      .sort((a, b) => {
        const orderA = a.order ?? SOCIAL_ORDER_FALLBACK[a.slug] ?? 999;
        const orderB = b.order ?? SOCIAL_ORDER_FALLBACK[b.slug] ?? 999;
        return orderA - orderB;
      });
  } catch {
    return [];
  }
}

// ─── Date display helpers (exported for UI use) ───────────────────────────────

/** "2025-11-03T00:00-03:00" → "2025" */
export function resumeYearFrom(isoDate?: string): string {
  return toYear(isoDate) ?? '';
}

/** endDate → year string or "Act" when absent/undefined */
export function resumeYearTo(isoDate?: string): string {
  return toYear(isoDate) ?? 'Act';
}
