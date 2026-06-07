import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Script from 'next/script';

import { fontFamily } from '@/config/fonts';
import { Modal } from '../components';
import { DataManager } from '@/components/data-manager/DataManager';
import { CategoryManager } from '@/components/data-manager/CategoryManager';
import { ResumeDataManager } from '@/components/data-manager/ResumeDataManager';
import { LayoutChrome } from '@/components/layout/LayoutChrome';
import { CollectionType, WorkData } from '@/interfaces';
import { fetchDataFromAPI } from '@/utils/functions';
import { fetchDrawingsCategory, fetchNavbarCategories } from '@/lib/contentful';
import { fetchResumeData } from '@/lib/contentful-resume';

import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://art.emmchier.com';

const metaImageUrl = `${siteUrl}/assets/emmchier-metatag.png`;

const SITE_TEXTS = {
  en: {
    title: 'Emmanuel Chierchié | Illustrator & Digital Artist',
    description:
      'Digital art portfolio of Emmanuel Chierchié (@emmchier) — original drawings, paintings, characters, books and sketchbooks.',
    keywords: [
      'Emmanuel Chierchié',
      'emmchier',
      'illustrator',
      'digital art',
      'drawings',
      'paintings',
      'characters',
      'portfolio',
      'art',
      'sketchbook',
    ],
    locale: 'en_US',
  },
  es: {
    title: 'Emmanuel Chierchié | Ilustrador & Artista Digital',
    description:
      'Portfolio de arte digital de Emmanuel Chierchié (@emmchier) — dibujos, pinturas, personajes, libros e ilustraciones originales.',
    keywords: [
      'Emmanuel Chierchié',
      'emmchier',
      'ilustrador',
      'arte digital',
      'dibujos',
      'pinturas',
      'personajes',
      'portfolio',
      'arte',
      'sketchbook',
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
      icon: '/assets/favicon-art.svg',
      shortcut: '/assets/favicon-art.svg',
      apple: '/assets/favicon-art.svg',
    },
    openGraph: {
      title: t.title,
      description: t.description,
      url: siteUrl,
      siteName: 'Emmanuel Chierchié',
      type: 'website',
      locale: t.locale,
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
      canonical: siteUrl,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // All SSR fetches run in parallel — resume space is independent of art space
  const [collection, drawingsCategory, navbarCollections, resumeData] =
    await Promise.all([
      fetchDataFromAPI(CollectionType.DRAWINGS).then(
        (res) =>
          res ?? ({ name: 'Drawings', slug: 'drawings', items: [] } as WorkData)
      ),
      fetchDrawingsCategory(),
      fetchNavbarCategories(),
      fetchResumeData(),
    ]);

  // JSON-LD structured data — Person + WebSite schemas
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        name: 'Emmanuel Chierchié',
        alternateName: 'emmchier',
        url: siteUrl,
        image: `${siteUrl}/assets/emmchier-metatag.png`,
        sameAs: [
          'https://www.instagram.com/emmchier',
          'https://www.linkedin.com/in/emmchier',
          'https://dribbble.com/emmchier',
          'https://www.behance.net/emmchier',
          'https://github.com/emmchier',
          'https://x.com/emmchier',
          'https://medium.com/@emmchier',
        ],
        jobTitle: 'Illustrator & Digital Artist',
        description:
          'Digital art portfolio — original drawings, paintings, characters, books and sketchbooks.',
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Emmanuel Chierchié — Illustrator & Digital Artist',
        description: 'Digital art portfolio of Emmanuel Chierchié (@emmchier).',
        author: { '@id': `${siteUrl}/#person` },
        inLanguage: ['en-US', 'es-AR'],
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/{search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
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
        {/* Google Tag Manager */}
        <Script
          id="gtm"
          strategy="afterInteractive"
        >{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-P5KL5JZM');`}</Script>
        {/* End Google Tag Manager */}
      </head>
      <body className={`${fontFamily.className} antialiased`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-P5KL5JZM"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <main role="main" className="flex flex-col min-h-screen">
          <DataManager data={collection} />
          <CategoryManager currentCategory={drawingsCategory} />
          <ResumeDataManager data={resumeData} />
          <Modal />
          <LayoutChrome navbarCollections={navbarCollections}>
            {children}
          </LayoutChrome>
        </main>
      </body>
    </html>
  );
}
