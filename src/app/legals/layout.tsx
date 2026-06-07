import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://art.emmchier.com';
const metaImageUrl = `${siteUrl}/assets/emmchier-metatag.png`;

const TEXTS = {
  en: {
    title: 'Legal Notice | Emmanuel Chierchié',
    description:
      'Legal notice and terms of use for art.emmchier.com — portfolio of Emmanuel Chierchié, illustrator and digital artist.',
    keywords: [
      'Emmanuel Chierchié',
      'legal notice',
      'terms of use',
      'portfolio',
      'illustrator',
    ],
  },
  es: {
    title: 'Aviso Legal | Emmanuel Chierchié',
    description:
      'Aviso legal y condiciones de uso de art.emmchier.com — portfolio de Emmanuel Chierchié, ilustrador y artista digital.',
    keywords: [
      'Emmanuel Chierchié',
      'aviso legal',
      'condiciones de uso',
      'portfolio',
      'ilustrador',
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const lang = (await cookies()).get('language')?.value === 'es' ? 'es' : 'en';
  const t = TEXTS[lang];

  return {
    title: t.title,
    description: t.description,
    keywords: t.keywords,
    openGraph: {
      title: t.title,
      description: t.description,
      url: `${siteUrl}/legals`,
      siteName: 'Emmanuel Chierchié',
      type: 'website',
      images: [
        {
          url: metaImageUrl,
          width: 1630,
          height: 916,
          alt: 'Emmanuel Chierchié — Illustrator & Digital Artist',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@emmchier',
      creator: '@emmchier',
      title: t.title,
      description: t.description,
      images: [metaImageUrl],
    },
    alternates: {
      canonical: `${siteUrl}/legals`,
    },
  };
}

export default function LegalsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
