import CategoryRedirectClient from './CategoryRedirectClient';

export default async function WorkCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CategoryRedirectClient categorySlug={slug} />;
}
