import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { WorkLayoutClient } from '@/app/work/[slug]/WorkLayoutClient';
import { fetchNavbarCategories } from '@/lib/contentful';
import { WorkData } from '@/interfaces';

export default async function WorkLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Validate slug against known categories — triggers 404 for unknown paths
  const navbarCategories = await fetchNavbarCategories();
  const validSlugs = navbarCategories.map((c) => c.slug);
  if (validSlugs.length > 0 && !validSlugs.includes(slug)) {
    notFound();
  }

  const collection: WorkData = {
    name: slug,
    slug,
    items: [],
  };

  return (
    <WorkLayoutClient collection={collection}>{children}</WorkLayoutClient>
  );
}
