import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.pathname.split('/').pop();

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  return NextResponse.json(
    { error: 'Collections source removed. Use Contentful instead.' },
    { status: 501 }
  );
}
