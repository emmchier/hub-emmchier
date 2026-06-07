import ProjectPageClient from '@/app/[slug]/ProjectPageClient';

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ slug: string; itemSlug: string }>;
}) {
  const { slug, itemSlug } = await params;

  if (!slug || !itemSlug) {
    return null;
  }

  // Convertir itemSlug a itemSegments array para ProjectPageClient
  return <ProjectPageClient categorySlug={slug} itemSegments={[itemSlug]} />;
}
