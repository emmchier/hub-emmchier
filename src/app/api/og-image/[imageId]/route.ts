import { NextRequest, NextResponse } from 'next/server';

import { contentfulClient } from '@/lib/contentful';

/**
 * GET /api/og-image/[imageId]
 *
 * Proxy de imagen para og:image en redes sociales.
 *
 * Problemas que resuelve:
 *
 * 1. Bug de "&amp;" en WhatsApp Mobile:
 *    Si la URL del og:image tuviera query params con "&", el HTML los codificaría
 *    como "&amp;". WhatsApp Mobile no decodifica "&amp;" antes de hacer el request
 *    HTTP → Contentful devuelve HTTP 400 → sin imagen.
 *    Esta ruta no tiene query params en la URL, así que no hay "&amp;" en el HTML.
 *
 * 2. WhatsApp no sigue redirects HTTP para og:image:
 *    Un redirect 302 a la URL de Contentful sería ignorado por WhatsApp.
 *    Esta ruta proxea los bytes de la imagen directamente (no redirige).
 *    WhatsApp recibe la imagen JPEG 1200×630 en el primer request.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
): Promise<NextResponse> {
  const { imageId } = await params;

  if (!contentfulClient) {
    return NextResponse.json(
      { error: 'Contentful client not available' },
      { status: 503 }
    );
  }

  try {
    const asset = await contentfulClient.getAsset(imageId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file = (asset as any)?.fields?.file as { url?: string } | undefined;

    const fileUrl = file?.url;
    if (!fileUrl) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const base = fileUrl.startsWith('//') ? `https:${fileUrl}` : fileUrl;

    // Construir URL transformada via Contentful Image API:
    // - w=1200, h=630  → dimensiones canónicas OG (ratio 1.91:1 landscape)
    // - fit=pad        → no recorta; rellena con el color de fondo del sitio
    // - bg=rgb:112f40  → primary-background del sitio (#112f40)
    // - fm=jpg         → JPEG obligatorio (X rechaza WebP; WhatsApp/Meta prefieren JPG)
    // - q=80           → ~100-200KB, muy por debajo del límite de 5MB de X
    const imageUrl = new URL(base);
    if (base.includes('images.ctfassets.net')) {
      imageUrl.searchParams.set('w', '1200');
      imageUrl.searchParams.set('h', '630');
      imageUrl.searchParams.set('fit', 'pad');
      imageUrl.searchParams.set('bg', 'rgb:112f40');
      imageUrl.searchParams.set('fm', 'jpg');
      imageUrl.searchParams.set('q', '80');
    }

    // Proxear los bytes de la imagen directamente.
    // NO hacer redirect — WhatsApp ignora 302 en og:image.
    const imageResponse = await fetch(imageUrl.toString());

    if (!imageResponse.ok) {
      return NextResponse.json(
        {
          error: 'Failed to fetch image from Contentful',
          status: imageResponse.status,
        },
        { status: 502 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': imageBuffer.byteLength.toString(),
        // Cachear en CDN de Vercel 1h; en browser 5min.
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to resolve asset' },
      { status: 500 }
    );
  }
}
