import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import ProjectPageClient from '../ProjectPageClient';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://art.emmchier.com';

// ── Helpers ──────────────────────────────────────────────────────────────────

function deslugify(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

type CEntry = { fields?: Record<string, unknown>; sys?: { id?: string } };

function getField<T>(entry: CEntry | undefined, key: string): T | undefined {
  return entry?.fields?.[key] as T | undefined;
}

/**
 * Walk the projectsTree/items looking for the entry that matches the given
 * segments (groupSlug + projectSlug). Returns the entry + its first gallery
 * image asset ID if found.
 */
function findProjectInTree(
  tree: CEntry[],
  segments: string[]
): { entry: CEntry; firstImageId: string | null } | null {
  const [groupSlug, projectSlug] = segments;

  const entrySlug = (e: CEntry) => {
    const f = e?.fields ?? {};
    const title =
      (typeof f.title === 'string' ? f.title : '') ||
      (typeof f.name === 'string' ? f.name : '');
    return (
      (typeof f.slug === 'string' ? f.slug : '') ||
      (title
        ? title
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
        : '')
    );
  };

  const firstImageId = (entry: CEntry): string | null => {
    const gallery = getField<CEntry[]>(entry, 'gallery') ?? [];
    for (const g of gallery) {
      const imageAsset = getField<CEntry>(g, 'image');
      const id = imageAsset?.sys?.id;
      if (id) return id;
    }
    // Also check resolved `images` array from the API route normalizer
    const images = getField<Array<{ id?: string }>>(entry, 'images') ?? [];
    return images[0]?.id ?? null;
  };

  if (groupSlug && projectSlug) {
    const group = tree.find((e) => entrySlug(e) === groupSlug);
    if (group) {
      const items = getField<CEntry[]>(group, 'items') ?? [];
      const project = items.find((e) => entrySlug(e) === projectSlug);
      if (project)
        return { entry: project, firstImageId: firstImageId(project) };
    }
  }

  // Single-level: the segment IS the project
  const lastSlug = segments[segments.length - 1];
  for (const e of tree) {
    if (entrySlug(e) === lastSlug)
      return { entry: e, firstImageId: firstImageId(e) };
    const items = getField<CEntry[]>(e, 'items') ?? [];
    const nested = items.find((i) => entrySlug(i) === lastSlug);
    if (nested) return { entry: nested, firstImageId: firstImageId(nested) };
  }

  return null;
}

// ── OG image resolution ───────────────────────────────────────────────────────

/**
 * Fetch the first gallery image asset ID for the given project path.
 * Uses the Contentful REST API directly (no SDK import — avoids prerender
 * bundling issues). Returns null on any error.
 */
async function fetchFirstImageId(
  categorySlug: string,
  segments: string[]
): Promise<string | null> {
  const space = process.env.CONTENTFUL_SPACE_ID;
  const token = process.env.CONTENTFUL_DELIVERY_TOKEN;
  const env = process.env.CONTENTFUL_ENVIRONMENT ?? 'master';
  if (!space || !token) return null;

  try {
    const url = new URL(
      `https://cdn.contentful.com/spaces/${space}/environments/${env}/entries`
    );
    url.searchParams.set('content_type', 'category');
    url.searchParams.set('fields.slug', categorySlug);
    url.searchParams.set('include', '3');
    url.searchParams.set('limit', '1');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    type CDARaw = {
      items?: CEntry[];
      includes?: { Entry?: CEntry[]; Asset?: CEntry[] };
    };
    const data = (await res.json()) as CDARaw;
    const category = data.items?.[0];
    if (!category) return null;

    // Resolve linked entries from `includes.Entry`
    const linkedEntries: Record<string, CEntry> = {};
    for (const e of data.includes?.Entry ?? []) {
      const id = e.sys?.id;
      if (id) linkedEntries[id] = e;
    }

    // Get projectsTree — items here are link objects { sys: { id, type:'Link' } }
    const rawTree =
      getField<Array<{ sys?: { id?: string } }>>(category, 'projectsTree') ??
      [];
    const tree: CEntry[] = rawTree
      .map((link) => (link?.sys?.id ? linkedEntries[link.sys.id] : undefined))
      .filter(Boolean) as CEntry[];

    // Resolve items inside each group
    const resolveItems = (entry: CEntry): CEntry => {
      const rawItems =
        getField<Array<{ sys?: { id?: string } }>>(entry, 'items') ?? [];
      const resolvedItems: CEntry[] = rawItems
        .map((link) => (link?.sys?.id ? linkedEntries[link.sys.id] : undefined))
        .filter(Boolean) as CEntry[];
      return {
        ...entry,
        fields: { ...(entry.fields ?? {}), items: resolvedItems },
      };
    };
    const resolvedTree = tree.map(resolveItems);

    const match = findProjectInTree(resolvedTree, segments);
    if (!match) return null;

    // gallery entries → linked assets
    const rawGallery =
      getField<Array<{ sys?: { id?: string } }>>(match.entry, 'gallery') ?? [];
    for (const gLink of rawGallery) {
      if (!gLink?.sys?.id) continue;
      const galleryEntry = linkedEntries[gLink.sys.id];
      if (!galleryEntry) continue;
      const imageLink = getField<{ sys?: { id?: string } }>(
        galleryEntry,
        'image'
      );
      if (imageLink?.sys?.id) return imageLink.sys.id;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; item: string[] }>;
}): Promise<Metadata> {
  const { slug, item } = await params;
  const lang = (await cookies()).get('language')?.value === 'es' ? 'es' : 'en';

  const isMakingOf = item[item.length - 1] === 'making-of';
  const contentSegments = isMakingOf ? item.slice(0, -1) : item;

  const categoryName = deslugify(slug);
  const projectName = deslugify(
    contentSegments[contentSegments.length - 1] ?? slug
  );
  const groupName =
    contentSegments.length >= 2 ? deslugify(contentSegments[0]) : null;

  const by = lang === 'es' ? 'de' : 'by';

  const resolvedTitle = isMakingOf
    ? `Making Of: ${projectName}${groupName ? ` · ${groupName}` : ''} | Emmanuel Chierchié`
    : `${groupName ? `${groupName} / ` : ''}${projectName} | ${categoryName} — Emmanuel Chierchié`;

  const pageDescription = isMakingOf
    ? `Making Of — ${projectName}${groupName ? ` (${groupName})` : ''} · ${categoryName} ${by} Emmanuel Chierchié.`
    : `${projectName}${groupName ? ` — ${groupName}` : ''} · ${categoryName} ${by} Emmanuel Chierchié.`;

  const canonicalPath = `/${slug}/${item.join('/')}`;
  const canonicalUrl = `${siteUrl}${canonicalPath}`;

  // ── OG Image — use same proxy as the lightbox (/api/og-image/[imageId])
  // The proxy serves JPEG bytes directly (no redirects, no &amp; issues).
  const imageId = await fetchFirstImageId(slug, contentSegments);
  const ogImageUrl = imageId ? `${siteUrl}/api/og-image/${imageId}` : undefined;

  return {
    title: resolvedTitle,
    description: pageDescription,
    openGraph: {
      title: resolvedTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: 'Emmanuel Chierchié',
      type: 'website',
      ...(ogImageUrl && {
        images: [
          {
            url: ogImageUrl,
            secureUrl: ogImageUrl,
            width: 1200,
            height: 630,
            type: 'image/jpeg',
            alt: `${projectName} — Emmanuel Chierchié`,
          },
        ],
      }),
    },
    twitter: {
      card: ogImageUrl ? 'summary_large_image' : 'summary',
      site: '@emmchier',
      creator: '@emmchier',
      title: resolvedTitle,
      description: pageDescription,
      ...(ogImageUrl && {
        images: [ogImageUrl],
      }),
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function WorkItemPage({
  params,
}: {
  params: Promise<{ slug: string; item: string[] }>;
}) {
  const { slug, item } = await params;

  const isMakingOf = item[item.length - 1] === 'making-of';
  const contentSegments = isMakingOf ? item.slice(0, -1) : item;
  const projectName = deslugify(
    contentSegments[contentSegments.length - 1] ?? slug
  );
  const categoryName = deslugify(slug);
  const canonicalUrl = `${siteUrl}/${slug}/${item.join('/')}`;

  // JSON-LD — VisualArtwork / CreativeWork for individual project pages
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: projectName,
    description: `${projectName} — ${categoryName} by Emmanuel Chierchié`,
    url: canonicalUrl,
    creator: {
      '@type': 'Person',
      name: 'Emmanuel Chierchié',
      url: siteUrl,
    },
    artMedium: 'Digital',
    artForm: categoryName,
    inLanguage: 'en-US',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProjectPageClient categorySlug={slug} itemSegments={item} />
    </>
  );
}
