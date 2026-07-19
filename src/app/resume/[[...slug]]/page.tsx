import { notFound } from 'next/navigation';
import { isValidResumeSlug } from '@/app/hub-slugs';
import HubHomePage from '../../HubHomePage';

export default async function ResumePage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;

  if (!isValidResumeSlug(slug)) notFound();

  return <HubHomePage />;
}
