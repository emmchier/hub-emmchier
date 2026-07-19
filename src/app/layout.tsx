import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Script from 'next/script';

import { fontFamily } from '@/config/fonts';
import { ResumeDataManager } from '@/components/data-manager/ResumeDataManager';
import { LayoutChrome } from '@/components/layout/LayoutChrome';
import { fetchResumeData, fetchSocialNetworks } from '@/lib/contentful-resume';

import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://emmchier.com';
const metaImageUrl = `${siteUrl}/assets/emmchier-metatag.png`;

const SITE_TEXTS = {
  en: {
    title: 'Emmchier. | Portfolio',
    description:
      'Personal hub of Emmanuel Chierchié (@emmchier) — entry point to art.emmchier.com (illustration) and design.emmchier.com (UX/UI & UI development). Contact and resumé included.',
    keywords: [
      'Emmanuel Chierchié',
      'emmchier',
      'hub',
      'portfolio',
      'illustrator',
      'UX designer',
      'UI developer',
      'art.emmchier.com',
      'design.emmchier.com',
      'contact',
      'resume',
    ],
    locale: 'en_US',
  },
  es: {
    title: 'Emmchier. | Portfolio',
    description:
      'Hub personal de Emmanuel Chierchié (@emmchier) — punto de entrada a art.emmchier.com (ilustración) y design.emmchier.com (UX/UI y desarrollo UI). Incluye contacto y currículum.',
    keywords: [
      'Emmanuel Chierchié',
      'emmchier',
      'hub',
      'portfolio',
      'ilustrador',
      'diseñador UX',
      'desarrollador UI',
      'art.emmchier.com',
      'design.emmchier.com',
      'contacto',
      'currículum',
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
      siteName: 'Emmchier.',
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
  const [resumeData, socialNetworks] = await Promise.all([
    fetchResumeData(),
    fetchSocialNetworks(),
  ]);

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
          'https://design.emmchier.com',
        ],
        jobTitle: 'Illustrator, UX Designer & UI Developer',
        description:
          'Illustrator, UX/UI designer and UI developer based in Argentina.',
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Emmchier. | Portfolio',
        description:
          'Personal hub of Emmanuel Chierchié (@emmchier) — entry point to art.emmchier.com and design.emmchier.com.',
        author: { '@id': `${siteUrl}/#person` },
        inLanguage: ['en-US', 'es-AR'],
      },
    ],
  };

  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
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
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <main
          id="main-content"
          role="main"
          className="flex w-full min-w-0 max-w-full flex-col overflow-x-clip min-h-dvh"
        >
          <ResumeDataManager
            data={resumeData}
            socialNetworks={socialNetworks}
          />
          <LayoutChrome>{children}</LayoutChrome>
        </main>
      </body>
    </html>
  );
}
