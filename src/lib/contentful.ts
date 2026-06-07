import { createClient } from 'contentful';

import { WorkData } from '@/interfaces';

const space = process.env.CONTENTFUL_SPACE_ID;
const accessToken = process.env.CONTENTFUL_DELIVERY_TOKEN;
const environment = process.env.CONTENTFUL_ENVIRONMENT || 'master';

const hasContentfulConfig = Boolean(space && accessToken);

export const contentfulClient =
  space && accessToken
    ? createClient({ space, accessToken, environment })
    : null;

const graphqlEndpoint = space
  ? `https://graphql.contentful.com/content/v1/spaces/${space}/environments/${environment}`
  : '';

const contentfulGraphQLRequest = async <T>(query: string): Promise<T> => {
  if (!hasContentfulConfig || !graphqlEndpoint) {
    return {} as T;
  }

  try {
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return {} as T;
    }

    const payload = (await response.json()) as {
      data?: T;
      errors?: Array<{ message?: string }>;
    };

    if (!payload.data) {
      return {} as T;
    }

    return payload.data;
  } catch {
    return {} as T;
  }
};

let drawingsCategoryCache: {
  value: Record<string, unknown> | null;
  expiresAt: number;
} | null = null;

const fetchDrawingsCategoryUncached = async () => {
  if (!contentfulClient) {
    return null;
  }

  try {
    const response = await contentfulClient.getEntries({
      content_type: 'category',
      include: 5,
      limit: 1,
      'fields.slug': 'drawings',
    });

    return response.items?.[0] ?? null;
  } catch {
    return null;
  }
};

export const fetchDrawingsCategory = async () => {
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
    return null;
  }
  const now = Date.now();
  if (drawingsCategoryCache && drawingsCategoryCache.expiresAt > now) {
    return drawingsCategoryCache.value;
  }

  const item = await fetchDrawingsCategoryUncached();
  drawingsCategoryCache = {
    value: item as Record<string, unknown> | null,
    expiresAt: now + 60_000,
  };
  return item;
};

type NavbarCategory = {
  title?: string;
  slug?: string;
  order?: number;
};

type NavbarCategoriesResponse = {
  categoryCollection?: {
    items?: NavbarCategory[];
  };
};

export const fetchNavbarCategories = async (): Promise<WorkData[]> => {
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
    return [];
  }
  if (!hasContentfulConfig) {
    return [];
  }

  const query = `
    query NavbarCategories {
      categoryCollection(limit: 100) {
        items {
          title
          slug
          order
        }
      }
    }
  `;

  try {
    const data =
      await contentfulGraphQLRequest<NavbarCategoriesResponse>(query);
    const categories = data.categoryCollection?.items || [];
    const sorted = [...categories].sort((a, b) => {
      const aOrder =
        typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
      const bOrder =
        typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });

    return sorted
      .filter((category) => {
        const name = category.title || '';
        const slug = category.slug || '';
        return Boolean(name && slug);
      })
      .map((category) => {
        const name = category.title || '';
        const slug = category.slug || '';
        return {
          name,
          slug,
          items: [],
        };
      });
  } catch {
    return [];
  }
};
