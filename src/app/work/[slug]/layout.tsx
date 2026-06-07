import { fetchDataFromAPI } from '@/utils/functions';
import { notFound } from 'next/navigation';
import { WorkData } from '@/interfaces';
import { WorkLayoutClient } from './WorkLayoutClient';

// aquí irá la query pidiendo la collection por slug.

export default async function WorkLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const collection: WorkData = await fetchDataFromAPI(slug);
  if (!collection) {
    notFound();
  }

  return (
    <WorkLayoutClient collection={collection}>{children}</WorkLayoutClient>
  );
}
