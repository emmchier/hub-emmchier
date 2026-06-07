import { NextRequest, NextResponse } from 'next/server';
import { fetchResumeData } from '@/lib/contentful-resume';

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get('locale') ?? 'en-US';

  try {
    const data = await fetchResumeData(locale);
    return NextResponse.json(
      { data },
      {
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch {
    return NextResponse.json({ data: null }, { status: 500 });
  }
}
