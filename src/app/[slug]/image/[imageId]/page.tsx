import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { contentfulClient } from '@/lib/contentful';
import { deslugify } from '@/utils/functions';
import SharedImagePageClient from './SharedImagePageClient';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; imageId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug, imageId } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const itemParam = resolvedSearch.item;
  const itemPath =
    typeof itemParam === 'string'
      ? itemParam
      : Array.isArray(itemParam)
        ? itemParam[0]
        : '';

  // Derivar el nombre del proyecto desde el query param ?item=
  // Ejemplo: "selection/2024" → último segmento "2024" → deslugify → "2024"
  const segments = itemPath.split('/').filter(Boolean);
  const rawName = segments.length > 0 ? segments[segments.length - 1] : slug;
  const projectName = deslugify(rawName);

  // Obtener la URL e dimensiones de la imagen desde Contentful por asset ID.
  // Las dimensiones (width/height) son necesarias para que LinkedIn y Facebook
  // dimensionen correctamente el card de preview.
  // Usar la ruta /api/og-image/[imageId] como og:image URL.
  // Esto evita el bug de "&amp;" en WhatsApp Mobile:
  // Si la URL tuviera query params con "&", el HTML los codificaría como "&amp;"
  // y WhatsApp los enviaría literalmente a Contentful → HTTP 400 → sin imagen.
  // Con esta URL limpia (sin query params), la ruta API hace el redirect 302
  // a la URL de Contentful correctamente construida en el servidor.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://art.emmchier.com';

  let ogImageUrl: string | undefined;
  const ogImageWidth = 1200;
  const ogImageHeight = 630;
  const ogImageType = 'image/jpeg';

  // Verificar que el asset existe antes de exponer la URL OG.
  // Si el asset no existe o hay error, el OG queda sin imagen — no rompe nada.
  try {
    if (contentfulClient) {
      const asset = await contentfulClient.getAsset(imageId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const file = (asset as any)?.fields?.file as { url?: string } | undefined;
      if (file?.url) {
        // URL limpia sin query params → no hay "&amp;" en el HTML → WhatsApp funciona
        ogImageUrl = `${siteUrl}/api/og-image/${imageId}`;
      }
    }
  } catch {
    // Si el asset no existe, el OG queda sin imagen — no rompe nada
  }

  const pageUrl = `${siteUrl}/${slug}/image/${imageId}${
    itemPath ? `?item=${encodeURIComponent(itemPath)}` : ''
  }`;

  const lang = (await cookies()).get('language')?.value === 'es' ? 'es' : 'en';
  const title = `${projectName} | Emmanuel Chierchié`;
  const description =
    lang === 'es'
      ? `Ilustración de Emmanuel Chierchié — ${projectName}`
      : `Illustration by Emmanuel Chierchié — ${projectName}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Emmanuel Chierchié',
      type: 'website',
      ...(ogImageUrl
        ? {
            images: [
              {
                url: ogImageUrl,
                // secureUrl: tag explícito https — requerido por Meta/Threads
                secureUrl: ogImageUrl,
                alt: projectName,
                // type: MIME type explícito (image/jpeg, image/png…)
                // Threads/Instagram lo usan para validar la imagen antes de mostrarla
                ...(ogImageType ? { type: ogImageType } : {}),
                // width/height permiten a LinkedIn y Facebook dimensionar el card correctamente
                ...(ogImageWidth ? { width: ogImageWidth } : {}),
                ...(ogImageHeight ? { height: ogImageHeight } : {}),
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: '@emmchier',
      creator: '@emmchier',
      title,
      description,
      ...(ogImageUrl
        ? {
            images: [
              {
                url: ogImageUrl,
                alt: projectName,
                ...(ogImageWidth ? { width: ogImageWidth } : {}),
                ...(ogImageHeight ? { height: ogImageHeight } : {}),
              },
            ],
          }
        : {}),
    },
  };
}

export default async function SharedImagePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; imageId: string }>;
  searchParams?: Promise<{ item?: string | string[] }>;
}) {
  const { slug, imageId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const itemParam = resolvedSearchParams?.item;
  const itemSegments = Array.isArray(itemParam)
    ? itemParam.flatMap((value) => value.split('/').filter(Boolean))
    : typeof itemParam === 'string'
      ? itemParam.split('/').filter(Boolean)
      : [];
  return (
    <SharedImagePageClient
      categorySlug={slug}
      itemSegments={itemSegments}
      imageId={imageId}
    />
  );
}
