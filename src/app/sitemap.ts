import type { MetadataRoute } from 'next';
import { fetchNavbarCategories } from '@/lib/contentful';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://art.emmchier.com';

// Fetch all projects for a category to build deep URLs
async function fetchCategoryProjects(
  categorySlug: string
): Promise<{ groupSlug: string; itemSlug: string }[]> {
  const space = process.env.CONTENTFUL_SPACE_ID;
  const token = process.env.CONTENTFUL_DELIVERY_TOKEN;
  const env = process.env.CONTENTFUL_ENVIRONMENT ?? 'master';
  if (!space || !token) return [];

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
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    type Link = { sys?: { id?: string } };
    type Entry = {
      sys?: { id?: string };
      fields?: {
        slug?: string;
        title?: string;
        name?: string;
        items?: Link[];
        [key: string]: unknown;
      };
    };
    type CDA = { items?: Entry[]; includes?: { Entry?: Entry[] } };

    const data = (await res.json()) as CDA;
    const category = data.items?.[0];
    if (!category) return [];

    const linked: Record<string, Entry> = {};
    for (const e of data.includes?.Entry ?? []) {
      if (e.sys?.id) linked[e.sys.id] = e;
    }

    const toSlug = (e: Entry) => {
      const f = e.fields ?? {};
      const title = (f.title as string) || (f.name as string) || '';
      return (
        (f.slug as string) ||
        title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      );
    };

    const rawTree = ((category.fields?.projectsTree as Link[]) ?? []) as Link[];
    const results: { groupSlug: string; itemSlug: string }[] = [];

    for (const link of rawTree) {
      const group = link?.sys?.id ? linked[link.sys.id] : undefined;
      if (!group) continue;
      const groupSlug = toSlug(group);
      const rawItems = (group.fields?.items ?? []) as Link[];

      if (rawItems.length > 0) {
        // Group with nested items
        for (const itemLink of rawItems) {
          const item = itemLink?.sys?.id ? linked[itemLink.sys.id] : undefined;
          if (!item) continue;
          results.push({ groupSlug, itemSlug: toSlug(item) });
        }
      } else {
        // Top-level project (no nesting)
        results.push({ groupSlug, itemSlug: '' });
      }
    }

    return results;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact/resume`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/legals`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  // Dynamic category + project routes from Contentful
  const dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const categories = await fetchNavbarCategories();

    for (const category of categories) {
      const categorySlug = category.slug;

      // Category root (redirects to first item — still useful for crawlers)
      dynamicRoutes.push({
        url: `${siteUrl}/${categorySlug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.9,
      });

      // Individual project pages
      const projects = await fetchCategoryProjects(categorySlug);
      for (const { groupSlug, itemSlug } of projects) {
        const path = itemSlug
          ? `${siteUrl}/${categorySlug}/${groupSlug}/${itemSlug}`
          : `${siteUrl}/${categorySlug}/${groupSlug}`;

        dynamicRoutes.push({
          url: path,
          lastModified: now,
          changeFrequency: 'monthly',
          priority: 0.7,
        });
      }
    }
  } catch {
    // Silently skip dynamic routes if Contentful is unavailable
  }

  return [...staticRoutes, ...dynamicRoutes];
}
