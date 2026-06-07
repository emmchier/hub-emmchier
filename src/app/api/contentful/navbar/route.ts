import { NextResponse } from 'next/server';

import { contentfulClient } from '@/lib/contentful';
import { WorkData } from '@/interfaces';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en-US';

  if (!contentfulClient) {
    return NextResponse.json(
      { items: [] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const response = await contentfulClient.getEntries({
      content_type: 'category',
      limit: 100,
      locale,
    });

    const items = response.items ?? [];

    const sorted = [...items].sort((a, b) => {
      const aOrder =
        typeof a.fields?.order === 'number'
          ? a.fields.order
          : Number.MAX_SAFE_INTEGER;
      const bOrder =
        typeof b.fields?.order === 'number'
          ? b.fields.order
          : Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });

    const result: WorkData[] = sorted
      .filter(
        (item) =>
          typeof item.fields?.title === 'string' &&
          typeof item.fields?.slug === 'string' &&
          item.fields.title &&
          item.fields.slug
      )
      .map((item) => ({
        name: item.fields.title as string,
        slug: item.fields.slug as string,
        items: [],
      }));

    return NextResponse.json(
      { items: result },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json(
      { items: [] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
