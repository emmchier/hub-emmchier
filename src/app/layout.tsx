import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { fontFamily } from '@/config/fonts';
import { ResumeDataManager } from '@/components/data-manager/ResumeDataManager';
import { LayoutChrome } from '@/components/layout/LayoutChrome';
import { fetchResumeData } from '@/lib/contentful-resume';

import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://emmchier.com';
const metaImageUrl = `${siteUrl}/assets/emmchier-metatag.png`;

const SITE_TEXTS = {
  en: {
    title: 'Emmanuel Chierchié — Illustrator, UX Designer & Developer',
    description:
      'Hub of Emmanuel Chierchié (@emmchier) — illustrator, UX/UI designer and UI developer. Explore his art portfolio and design portfolio.',
    keywords: [
      'Emmanuel Chierchié',
      'emmchier',
      'illustrator',
      'UX designer',
      'UI developer',
      'digital art',
      'portfolio',
      'contact',
    ],
    locale: 'en_US',
  },
  es: {
    title: 'Emmanuel Chierchié — Ilustrador, Diseñador UX & Desarrollador',
    description:
      'Hub de Emmanuel Chierchié (@emmchier) — ilustrador, diseñador UX/UI y desarrollador UI. Explorá su portfolio de arte y diseño.',
    keywords: [
      'Emmanuel Chierchié',
      'emmchier',
      'ilustrador',
      'diseñador UX',
      'desarrollador UI',
      'arte digital',
      'portfolio',
      'contacto',
    ],
    locale: 'es_AR',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const lang = (await cookies()).get('language')?.value === 'es' ? 'es' : 'en';
  const t = SITE_TEXTS[lang];

  return {
    title: t.title,
    description: t.description,
    keywords: t.keywords,
    metadataBase: new URL(siteUrl),
    icons: {
      icon: '/assets/favicon-hub.svg',
      shortcut: '/assets/favicon-hub.svg',
      apple: '/assets/favicon-hub.svg',
    },
    openGraph: {
      title: t.title,
      description: t.description,
      url: siteUrl,
      siteName: 'Emmanuel Chierchié',
      type: 'website',
      locale: t.locale,
      images: [{ url: metaImageUrl, width: 1630, height: 916, alt: t.title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@emmchier',
      creator: '@emmchier',
      title: t.title,
      description: t.description,
      images: [metaImageUrl],
    },
    alternates: { canonical: siteUrl },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const resumeData = await fetchResumeData();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        name: 'Emmanuel Chierchié',
        alternateName: 'emmchier',
        url: siteUrl,
        image: metaImageUrl,
        sameAs: [
          'https://www.instagram.com/emmchier',
          'https://www.linkedin.com/in/emmchier',
          'https://dribbble.com/emmchier',
          'https://www.behance.net/emmchier',
          'https://github.com/emmchier',
          'https://x.com/emmchier',
          'https://medium.com/@emmchier',
          'https://art.emmchier.com',
        ],
        jobTitle: 'Illustrator, UX Designer & UI Developer',
        description:
          'Illustrator, UX/UI designer and UI developer based in Argentina.',
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Emmanuel Chierchié',
        description: 'Hub of Emmanuel Chierchié (@emmchier).',
        author: { '@id': `${siteUrl}/#person` },
        inLanguage: ['en-US', 'es-AR'],
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${fontFamily.className} antialiased`}>
        <main role="main" className="flex flex-col min-h-screen">
          <ResumeDataManager data={resumeData} />
          <LayoutChrome>{children}</LayoutChrome>
        </main>
      </body>
    </html>
  );
}
