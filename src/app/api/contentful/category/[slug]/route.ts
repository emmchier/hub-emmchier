import { NextResponse } from 'next/server';

import { contentfulClient } from '@/lib/contentful';
import { calculateReadingTimeFromRichText } from '@/utils/functions';

type ContentfulLink = { sys?: { id?: string } };
type ContentfulFields = Record<string, unknown>;
type ContentfulEntry = { sys?: { id?: string }; fields?: ContentfulFields };
type ContentfulAsset = {
  sys?: { id?: string };
  fields?: {
    file?: {
      url?: string;
      details?: { image?: { width?: number; height?: number } };
    };
  };
};
type ContentfulIncludes = {
  Asset?: ContentfulAsset[];
  Entry?: ContentfulEntry[];
};

type SafeEntry = { fields: Record<string, unknown> };

const toSafeEntry = (
  entry: ContentfulEntry | null,
  _processedIds: Set<string> = new Set()
): SafeEntry | null => {
  if (!entry?.fields) return null;
  const fields = entry.fields;

  // Guardar las imágenes
  const savedImages = Array.isArray(fields.images) ? fields.images : [];

  // Obtener readingTime de mappedProject si existe, o directamente de fields
  const readingTime =
    (fields.mappedProject as { readingTime?: number } | undefined)
      ?.readingTime ??
    (typeof fields.readingTime === 'number' ? fields.readingTime : undefined);

  const safeFields: Record<string, unknown> = {
    title: typeof fields.title === 'string' ? fields.title : undefined,
    name: typeof fields.name === 'string' ? fields.name : undefined,
    slug: typeof fields.slug === 'string' ? fields.slug : undefined,
    description:
      typeof fields.description === 'string' ? fields.description : undefined,
    images: savedImages, // Usar las imágenes guardadas
    makingOf: fields.makingOf,
    techs: Array.isArray(fields.techs) ? fields.techs : [],
    order: typeof fields.order === 'number' ? fields.order : undefined,
    readingTime,
  };

  if (Array.isArray(fields.items)) {
    safeFields.items = (fields.items as unknown[])
      .map((item) => toSafeEntry(item as ContentfulEntry, _processedIds))
      .filter(Boolean);
  }

  if (Array.isArray(fields.projectsTree)) {
    safeFields.projectsTree = (fields.projectsTree as unknown[])
      .map((item) => toSafeEntry(item as ContentfulEntry, _processedIds))
      .filter(Boolean);
  }

  // Asegurar que las imágenes siempre estén presentes
  safeFields.images = savedImages;

  return { fields: safeFields };
};
const resolveEntryFromLink = (
  link: ContentfulEntry | ContentfulLink | undefined,
  entryMap: Map<string | undefined, ContentfulEntry>
) => {
  if (!link) return undefined;
  if ('fields' in link && link.fields) return link as ContentfulEntry;
  return entryMap.get(link.sys?.id);
};

const collectAssetIdsFromEntry = (
  entry: ContentfulEntry | ContentfulLink | undefined,
  entryMap: Map<string | undefined, ContentfulEntry>,
  assetIds: Set<string>
) => {
  const resolved = resolveEntryFromLink(entry, entryMap);
  if (!resolved?.fields) return;

  const fields = resolved.fields;
  const gallery = fields.gallery;
  if (Array.isArray(gallery)) {
    gallery.forEach((galleryItem) => {
      const galleryEntry = resolveEntryFromLink(
        galleryItem as ContentfulEntry | ContentfulLink | undefined,
        entryMap
      );
      const assetId = (
        galleryEntry?.fields?.image as ContentfulLink | undefined
      )?.sys?.id;
      if (typeof assetId === 'string' && assetId) {
        assetIds.add(assetId);
      }
    });
  }

  const items = fields.items;
  if (Array.isArray(items)) {
    items.forEach((item) =>
      collectAssetIdsFromEntry(item as ContentfulEntry, entryMap, assetIds)
    );
  }

  const projectsTree = fields.projectsTree;
  if (Array.isArray(projectsTree)) {
    projectsTree.forEach((node) =>
      collectAssetIdsFromEntry(node as ContentfulEntry, entryMap, assetIds)
    );
  }
};

const chunkIds = (ids: string[], size: number) => {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
};

const resolveGalleryImages = (
  galleryItems: unknown[],
  includes: ContentfulIncludes
) => {
  if (!Array.isArray(galleryItems)) return [];

  const entryMap = new Map(
    (includes.Entry || []).map((entry) => [entry?.sys?.id, entry])
  );
  const assetMap = new Map(
    (includes.Asset || []).map((asset) => [asset?.sys?.id, asset])
  );

  return galleryItems
    .map((link) => {
      const linkEntry = link as ContentfulEntry | ContentfulLink | undefined;
      const imageEntry = resolveEntryFromLink(linkEntry, entryMap);
      if (!imageEntry?.fields) return null;

      const assetId = (imageEntry.fields.image as ContentfulLink | undefined)
        ?.sys?.id;
      const asset = assetId ? assetMap.get(assetId) : undefined;
      if (!asset?.fields?.file?.url) return null;

      return {
        id: asset.sys?.id,
        url: `https:${asset.fields.file.url}`,
        width: asset.fields.file.details?.image?.width ?? 0,
        height: asset.fields.file.details?.image?.height ?? 0,
        alt:
          (typeof imageEntry.fields.title === 'string' &&
            imageEntry.fields.title) ||
          '',
      };
    })
    .filter(Boolean);
};

const normalizeProject = (
  entry: ContentfulEntry | ContentfulLink | null | undefined,
  includes: ContentfulIncludes
): ContentfulEntry | null => {
  if (!entry) return null;

  const entryMap = new Map(
    (includes.Entry || []).map((item) => [item?.sys?.id, item])
  );
  const resolved = (entry as ContentfulEntry).fields
    ? (entry as ContentfulEntry)
    : entryMap.get((entry as ContentfulLink)?.sys?.id);
  if (!resolved?.fields) return null;

  const fields = resolved.fields;

  // PRIMERO: Resolver y guardar las imágenes del proyecto principal ANTES de normalizar anything else
  let projectImages: unknown[] = [];
  if (Array.isArray(fields.gallery)) {
    projectImages = resolveGalleryImages(fields.gallery, includes);
    fields.images = projectImages;
  } else {
    fields.images = [];
  }

  // Guardar las imágenes en una variable separada para asegurar que no se pierdan
  const savedImages = fields.images;

  // Normalizar items y projectsTree (estos no deberían afectar las imágenes del proyecto principal)
  if (Array.isArray(fields.items)) {
    fields.items = fields.items
      .map((item: unknown) =>
        normalizeProject(item as ContentfulEntry, includes)
      )
      .filter(Boolean);
  }

  if (Array.isArray(fields.projectsTree)) {
    fields.projectsTree = fields.projectsTree
      .map((item: unknown) =>
        normalizeProject(item as ContentfulEntry, includes)
      )
      .filter(Boolean);
  }

  // RESTAURAR las imágenes del proyecto principal
  fields.images = savedImages;

  // Resolver techs si vienen como referencias
  if (Array.isArray(fields.techs)) {
    fields.techs = fields.techs.map((tech: unknown) => {
      const techLink = tech as ContentfulLink | ContentfulEntry;
      // Si ya tiene fields, está resuelto
      if ((techLink as ContentfulEntry).fields) {
        return techLink;
      }
      // Si es una referencia, resolverla usando entryMap
      const resolvedTech = entryMap.get((techLink as ContentfulLink)?.sys?.id);
      return resolvedTech || techLink;
    });
  }

  // Calcular tiempo de lectura desde el rich text de makingOf
  let readingTime: number | undefined = undefined;
  if (fields.makingOf) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readingTime = calculateReadingTimeFromRichText(fields.makingOf as any);
  }

  // Guardar readingTime directamente en fields para que esté disponible en toSafeEntry
  fields.readingTime = readingTime;

  fields.mappedProject = {
    name: fields.title || fields.name,
    slug: fields.slug,
    description: fields.description,
    images: fields.images,
    makingOf: fields.makingOf,
    order: fields.order,
    readingTime,
  };

  return resolved;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!contentfulClient) {
    return NextResponse.json({ item: null }, { status: 200 });
  }

  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ item: null }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en-US';

  try {
    const response = await contentfulClient.getEntries({
      content_type: 'category',
      include: 5,
      limit: 1,
      locale,
      'fields.slug': slug,
    });

    const itemsCount = response.items?.length ?? 0;
    const item = response.items?.[0] ?? null;
    const includes = response.includes || {};
    const entryMap = new Map(
      (includes.Entry || []).map((entry) => [entry?.sys?.id, entry])
    );
    const assetMap = new Map<string | undefined, ContentfulAsset>(
      (includes.Asset || []).map((asset) => [
        asset?.sys?.id,
        asset as ContentfulAsset,
      ])
    );
    const assetIds = new Set<string>();
    if (item) {
      collectAssetIdsFromEntry(item as ContentfulEntry, entryMap, assetIds);
    }
    const missingAssetIds = [...assetIds].filter((id) => !assetMap.has(id));
    if (missingAssetIds.length > 0) {
      const chunks = chunkIds(missingAssetIds, 50);
      for (const chunk of chunks) {
        const assetsResponse = await contentfulClient.getAssets({
          'sys.id[in]': chunk,
        });
        const fetched = assetsResponse?.items ?? [];
        fetched.forEach((asset) => {
          const assetItem = asset as ContentfulAsset;
          if (assetItem?.sys?.id && !assetMap.has(assetItem.sys.id)) {
            assetMap.set(assetItem.sys.id, assetItem);
          }
        });
      }
    }
    const mergedIncludes: ContentfulIncludes = {
      Entry: includes.Entry,
      Asset: Array.from(assetMap.values()),
    };
    const normalized = item ? normalizeProject(item, mergedIncludes) : null;
    const safeItem = normalized ? toSafeEntry(normalized) : null;
    return NextResponse.json(
      { item: safeItem },
      {
        headers: {
          'Cache-Control': 'no-store',
          'X-Contentful-Has-Item': safeItem ? '1' : '0',
          'X-Contentful-Items': String(itemsCount),
        },
      }
    );
  } catch {
    return NextResponse.json({ item: null }, { status: 200 });
  }
}
