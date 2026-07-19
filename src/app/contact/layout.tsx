import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://emmchier.com';
const metaImageUrl = `${siteUrl}/assets/emmchier-metatag.png`;

const TEXTS = {
  en: {
    title: 'Emmchier. | Contact',
    description:
      'Say hello to Emmanuel Chierchié (@emmchier) — email and social profiles. Hub linking art.emmchier.com and design.emmchier.com.',
  },
  es: {
    title: 'Emmchier. | Contacto',
    description:
      'Charlá con Emmanuel Chierchié (@emmchier) — email y perfiles sociales. Hub que conecta art.emmchier.com y design.emmchier.com.',
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
      'contact',
      'email',
      'social',
      'illustrator',
      'UX designer',
      'UI developer',
    ],
    openGraph: {
      title: t.title,
      description: t.description,
      url: `${siteUrl}/contact`,
      siteName: 'Emmchier.',
      type: 'website',
      images: [
        {
          url: metaImageUrl,
          width: 1630,
          height: 916,
          alt: t.title,
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
      canonical: `${siteUrl}/contact`,
    },
  };
}

export default function ContactLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="relative flex w-full min-h-0 flex-1 flex-col fade-in">
      {children}
    </div>
  );
}
