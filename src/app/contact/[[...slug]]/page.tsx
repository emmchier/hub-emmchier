import { notFound } from 'next/navigation';
import { isValidContactSlug } from '@/app/hub-slugs';
import HubHomePage from '../../HubHomePage';

export default async function ContactPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;

  if (!isValidContactSlug(slug)) notFound();

  return <HubHomePage />;
}
