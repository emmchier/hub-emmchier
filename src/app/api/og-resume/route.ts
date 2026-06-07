export const runtime = 'edge';

/**
 * GET /api/og-resume
 *
 * Proxy de imagen para og:image del Resume.
 * Fetcha el avatar del entry `resume` en el espacio Contentful de resume
 * y devuelve los bytes JPEG directamente (sin redirect) con las transformaciones
 * OG estándar (1200×630, fit:pad, fondo del sitio).
 *
 * Mismo patrón que /api/og-image/[imageId] para evitar bugs de &amp; en WhatsApp.
 */
export async function GET() {
  const space = process.env.CONTENTFUL_RESUME_SPACE_ID;
  const token = process.env.CONTENTFUL_RESUME_DELIVERY_TOKEN;

  if (!space || !token) {
    return new Response('Not configured', { status: 404 });
  }

  try {
    // 1. Fetch the resume entry to get the avatar asset link
    const entriesUrl = new URL(
      `https://cdn.contentful.com/spaces/${space}/environments/master/entries`
    );
    entriesUrl.searchParams.set('content_type', 'resume');
    entriesUrl.searchParams.set('include', '1');
    entriesUrl.searchParams.set('limit', '1');

    const entriesRes = await fetch(entriesUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!entriesRes.ok)
      return new Response('Contentful error', { status: 502 });

    type CDAResponse = {
      items?: Array<{ fields?: Record<string, unknown> }>;
      includes?: {
        Asset?: Array<{
          sys?: { id?: string };
          fields?: Record<string, unknown>;
        }>;
      };
    };
    const data = (await entriesRes.json()) as CDAResponse;
    const entry = data.items?.[0];
    const imageLink = entry?.fields?.image as
      | { sys?: { id?: string } }
      | undefined;
    const assetId = imageLink?.sys?.id;
    if (!assetId) return new Response('No avatar asset', { status: 404 });

    // 2. Resolve the asset URL from includes
    const assetEntry = data.includes?.Asset?.find((a) => a.sys?.id === assetId);
    type AssetFile = { url?: string };
    const fileUrl = (assetEntry?.fields?.file as AssetFile | undefined)?.url;
    if (!fileUrl) return new Response('No asset URL', { status: 404 });

    // 3. Fetch image with OG transformations (1200×630, fit:pad, brand bg, JPEG)
    const transformedUrl = `https:${fileUrl}?w=1200&h=630&fit=pad&bg=rgb:112f40&fm=jpg&q=80`;
    const imgRes = await fetch(transformedUrl);
    if (!imgRes.ok) return new Response('Image fetch error', { status: 502 });

    const imgBuffer = await imgRes.arrayBuffer();

    return new Response(imgBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    });
  } catch {
    return new Response('Internal error', { status: 500 });
  }
}
