import { ProcessedItem, WorkData } from '@/interfaces';

// Función para generar slugs a partir de un texto
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // separar acentos de las letras
    .replace(/[\u0300-\u036f]/g, '') // eliminar todos los acentos
    .replace(/\s+/g, '-') // reemplazar espacios por '-'
    .replace(/&/g, '-and-') // reemplazar '&' por 'and'
    .replace(/[^\w-]+/g, '') // eliminar todos los caracteres no alfanuméricos
    .replace(/--+/g, '-'); // reemplazar múltiples '-' por un solo '-'
};

// Función para deshacer el slug, transformando guiones en espacios y capitalizando
export function deslugify(slug: string): string {
  return slug
    .replace(/-/g, ' ') // Reemplazar "-" por espacio
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalizar la primera letra de cada palabra
}

// Función para capitalizar la primera letra de una cadena
export const capitalizeFirstLetter = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const fetchCollectionData = (): WorkData | null => {
  return null;
};

export function processCollection(): ProcessedItem[] {
  return [];
}

export function getFirstItemSlug(collection: WorkData): string | null {
  if (!collection || collection.items.length === 0) {
    return null;
  }

  // Filtrar los ítems que tienen "isSubItem = true"
  const validItems = collection.items.filter(
    (item) => item.isLinkable === true
  );

  // Retornar el slug del primer ítem válido, o null si no hay ninguno
  return validItems.length > 0 ? validItems[0].slug : null;
}

export const fetchDataFromAPI = async (collection: string) => {
  const siteUrl =
    process.env.VERCEL_ENV === 'production'
      ? process.env.NEXT_PUBLIC_SITE_URL
      : process.env.VERCEL_ENV === 'preview'
        ? process.env.NEXT_PUBLIC_SITE_URL
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const endpoint = `${siteUrl}/api/collections/${collection}`;
  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching collection data:', error);
    }
    return null;
  }
};

export function getReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const time = Math.ceil(words / wordsPerMinute);
  return time;
}

// Calcular tiempo de lectura desde rich text de Contentful
type RichTextNode = {
  nodeType?: string;
  content?: RichTextNode[];
  value?: string;
  data?: unknown;
};

export function calculateReadingTimeFromRichText(
  node: RichTextNode | null | undefined
): number {
  if (!node) return 0;

  const wordsPerMinute = 200; // Velocidad promedio de lectura
  let totalWords = 0;

  const extractText = (n: RichTextNode): void => {
    // Si es un nodo de texto, contar palabras
    if (n.nodeType === 'text' && n.value) {
      const text = n.value.trim();
      const words = text.split(/\s+/).filter((word) => word.length > 0).length;
      totalWords += words;
      return;
    }

    // Si tiene contenido, procesar recursivamente
    if (n.content && Array.isArray(n.content)) {
      n.content.forEach((child) => extractText(child));
    }
  };

  extractText(node);

  // Calcular tiempo basado en palabras
  // Considerar también listas y títulos (tiempo adicional)
  const baseTime = totalWords / wordsPerMinute;

  // Contar elementos estructurales que requieren más tiempo
  const countElements = (
    n: RichTextNode
  ): { paragraphs: number; headings: number; listItems: number } => {
    let paragraphs = 0;
    let headings = 0;
    let listItems = 0;

    if (n.nodeType === 'paragraph') paragraphs++;
    if (n.nodeType?.startsWith('heading-')) headings++;
    if (n.nodeType === 'list-item') listItems++;

    if (n.content && Array.isArray(n.content)) {
      n.content.forEach((child) => {
        const counts = countElements(child);
        paragraphs += counts.paragraphs;
        headings += counts.headings;
        listItems += counts.listItems;
      });
    }

    return { paragraphs, headings, listItems };
  };

  const elements = countElements(node);

  // Agregar tiempo adicional por estructura:
  // - Párrafos: +0.1 min cada uno (pausa natural)
  // - Títulos: +0.15 min cada uno (procesamiento mental)
  // - Items de lista: +0.05 min cada uno (procesamiento de listas)
  const structuralTime =
    elements.paragraphs * 0.1 +
    elements.headings * 0.15 +
    elements.listItems * 0.05;

  const totalTime = baseTime + structuralTime;

  // Redondear hacia arriba y asegurar mínimo de 1 minuto si hay contenido
  return totalWords > 0 ? Math.max(1, Math.ceil(totalTime)) : 0;
}

export const handleShare = async (imageUrl: string): Promise<void> => {
  const shareData: ShareData = {
    title: 'Mira esta imagen',
    text: 'Te comparto una imagen que me encantó',
    url: imageUrl, // puede ser un link directo a la imagen o una página que la contenga
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // El usuario canceló la acción
        return;
      }

      console.error('Error al compartir:', err);
      alert('No se pudo compartir la imagen.');
    }
  } else if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(imageUrl);
      alert('Enlace de la imagen copiado al portapapeles');
    } catch (err: unknown) {
      console.error('Error al copiar el enlace:', err);
      alert('No se pudo copiar el enlace.');
    }
  } else {
    window.prompt('Copia este enlace de la imagen:', imageUrl);
  }
};

// Obtener la URL completa del artículo.
// SIEMPRE usa NEXT_PUBLIC_SITE_URL como base canónica, nunca window.location.origin.
// Motivo: las redes sociales (LinkedIn, Facebook, WhatsApp, X…) scrapean el OG desde
// sus servidores externos. Si la base fuera window.location.origin, en desarrollo
// quedaría "https://localhost:3000/..." que ningún servidor externo puede alcanzar
// y, por tanto, no mostraría preview enriquecido.
// NEXT_PUBLIC_SITE_URL debe apuntar a la URL pública: https://art.emmchier.com
export const getArticleUrl = (pathname: string): string => {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://art.emmchier.com';
  return `${baseUrl}${pathname}`;
};

// Copiar link al portapapeles (solo la URL, sin alert)
export const copyLink = async (pathname: string): Promise<void> => {
  const articleUrl = getArticleUrl(pathname);

  try {
    await navigator.clipboard.writeText(articleUrl);
  } catch (err: unknown) {
    console.error('Error al copiar el enlace:', err);
  }
};

// Compartir en LinkedIn
export const shareOnLinkedIn = (pathname: string): void => {
  const articleUrl = getArticleUrl(pathname);
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
  window.open(url, '_blank', 'width=600,height=400');
};

// Compartir en Facebook
export const shareOnFacebook = (pathname: string): void => {
  const articleUrl = getArticleUrl(pathname);
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
  window.open(url, '_blank', 'width=600,height=400');
};

// Compartir en WhatsApp
// Solo la URL, sin texto previo: así WhatsApp genera el link preview card
// con el og:image y og:title de la página. Si se incluye texto antes de la URL,
// WhatsApp no genera el card enriquecido.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const shareOnWhatsApp = (pathname: string, _title: string): void => {
  const articleUrl = getArticleUrl(pathname);
  const url = `https://wa.me/?text=${encodeURIComponent(articleUrl)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

// Compartir en Instagram
// Instagram no tiene endpoint web de sharing; usamos el Web Share API nativo en mobile.
// En desktop no hay opción directa → copiamos la URL al portapapeles como fallback.
export const shareOnInstagram = (pathname: string, title?: string): void => {
  const articleUrl = getArticleUrl(pathname);
  if (navigator.share) {
    navigator
      .share({
        title: title || 'Emmanuel Chierchié',
        url: articleUrl,
      })
      .catch(() => {
        copyLink(pathname);
      });
  } else {
    copyLink(pathname);
  }
};

// Compartir en Threads
// Threads espera un único parámetro `text` con todo el contenido (título + URL).
// Se encodea el texto completo para que el espacio y los caracteres especiales sean válidos.
export const shareOnThreads = (pathname: string, title: string): void => {
  const articleUrl = getArticleUrl(pathname);
  const fullText = `${title} ${articleUrl}`;
  const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(fullText)}`;
  window.open(url, '_blank', 'width=600,height=400');
};

// Compartir en X (antes Twitter)
// Usa x.com/intent/post (dominio actualizado, twitter.com redirige pero es mejor usar el canónico).
// El card preview NO aparece en la ventana de composición via intent — solo en el tweet publicado.
export const shareOnX = (pathname: string, title: string): void => {
  const articleUrl = getArticleUrl(pathname);
  const text = encodeURIComponent(title);
  const url = `https://x.com/intent/post?text=${text}&url=${encodeURIComponent(articleUrl)}`;
  window.open(url, '_blank', 'width=600,height=400');
};

export const downloadImage = async (
  imageUrl: string,
  fileName = 'image.jpg'
): Promise<void> => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;

    // Para forzar el click programáticamente
    document.body.appendChild(link);
    link.click();

    // Limpieza
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error('Error al intentar descargar la imagen:', err);
    // No mostramos error al usuario si cancela
  }
};

/**
 * Share the ATS resume PDF as a file using the Web Share API (mobile).
 *
 * - Mobile (navigator.canShare with files): generates PDF blob → native share
 *   sheet so the user can send via WhatsApp, email, Telegram, etc.
 * - Desktop / unsupported: falls back to sharing the resume page URL.
 *
 * @param json     ResumeJson — must be imported lazily to avoid circular deps.
 * @param language Current language for the PDF filename and content.
 */
export const shareResumePdf = async (
  json: import('@/interfaces').ResumeJson,
  language: 'en' | 'es' = 'en'
): Promise<void> => {
  try {
    const { generateAtsPdfBlob } = await import('./generate-ats-pdf');
    const { blob, filename } = await generateAtsPdfBlob(json, language);
    const file = new File([blob], filename, { type: 'application/pdf' });

    if (
      typeof navigator !== 'undefined' &&
      navigator.share &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: `CV — Emmanuel Chierchié (${language === 'es' ? 'Español' : 'English'})`,
      });
      return;
    }
  } catch {
    // fall through to URL fallback
  }

  // Fallback: share the resume page URL (desktop or browsers without file share)
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://art.emmchier.com';
  const url = `${siteUrl}/contact/resume`;
  if (typeof navigator !== 'undefined' && navigator.share) {
    await navigator.share({ title: 'Resumé — Emmanuel Chierchié', url });
  } else {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // silent
    }
  }
};
