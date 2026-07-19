import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://emmchier.com';
const metaImageUrl = `${siteUrl}/assets/emmchier-metatag.png`;

const TEXTS = {
  en: {
    title: 'Emmchier. | Legal Notice',
    description:
      'Legal notice and terms of use for emmchier.com — personal hub and entry point to art.emmchier.com and design.emmchier.com.',
    keywords: [
      'Emmanuel Chierchié',
      'emmchier',
      'legal notice',
      'terms of use',
      'hub',
      'portfolio',
    ],
  },
  es: {
    title: 'Emmchier. | Aviso Legal',
    description:
      'Aviso legal y condiciones de uso de emmchier.com — hub personal y punto de entrada a art.emmchier.com y design.emmchier.com.',
    keywords: [
      'Emmanuel Chierchié',
      'emmchier',
      'aviso legal',
      'condiciones de uso',
      'hub',
      'portfolio',
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
      siteName: 'Emmchier.',
      type: 'website',
      images: [
        {
          url: metaImageUrl,
          width: 1630,
          height: 916,
          alt: 'Emmchier. | Portfolio',
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
