import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://art.emmchier.com';
const ogImageUrl = `${siteUrl}/api/og-resume`;

const TEXTS = {
  en: {
    title: 'Contact & Resumé | Emmanuel Chierchié',
    description:
      'Illustrator, UX/UI designer and UI developer. ATS CV available for download.',
  },
  es: {
    title: 'Contacto y CV | Emmanuel Chierchié',
    description:
      'Ilustrador, diseñador UX/UI y desarrollador UI. CV en formato ATS disponible para descargar.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = cookieStore.get('language')?.value === 'es' ? 'es' : 'en';
  const t = TEXTS[lang];

  return {
    title: t.title,
    description: t.description,
    keywords: [
      'Emmanuel Chierchié',
      'emmchier',
      'CV',
      'resume',
      'illustrator',
      'UX designer',
      'UI developer',
      'ATS',
      'portfolio',
    ],
    openGraph: {
      title: t.title,
      description: t.description,
      url: `${siteUrl}/contact/resume/work-experience`,
      siteName: 'Emmanuel Chierchié',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
          width: 1200,
          height: 630,
          type: 'image/jpeg',
          alt: 'Resumé — Emmanuel Chierchié',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@emmchier',
      creator: '@emmchier',
      title: t.title,
      description: t.description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${siteUrl}/contact/resume/work-experience`,
    },
  };
}

export default function ContactLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="relative flex w-full flex-col fade-in">{children}</div>
  );
}
