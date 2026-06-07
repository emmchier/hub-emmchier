/** Mapeo de código de idioma interno → código de locale de Contentful */
export const CONTENTFUL_LOCALE = {
  en: 'en-US',
  es: 'es-AR',
} as const;

export type SupportedLanguage = 'en' | 'es';

export const translations = {
  en: {
    // Nav / Chrome
    contact: 'Contact',
    backToHome: 'Back to home',
    collapse: 'Collapse',
    expand: 'Expand',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',

    // Sidebar footer
    visit: 'Visit',

    // Footer
    legals: 'Legals',
    poweredBy: 'Powered by',

    // Gallery / Project page
    gallery: 'Gallery.',
    makingOf: 'Making Of.',
    image: 'image',
    images: 'images',
    noProcess: 'No process available.',
    minuteRead: 'minute read',
    minutesRead: 'minutes read',

    // Share / BottomSheet
    copyLink: 'Copy link',
    copied: 'Copied!',
    shareOnLinkedIn: 'Share on LinkedIn',
    shareOnFacebook: 'Share on Facebook',
    shareOnWhatsapp: 'Share on Whatsapp',
    shareOnInstagram: 'Share on Instagram',
    shareOnThreads: 'Share on Threads',
    shareOnX: 'Share on X',

    // Contact page
    sayHello: 'Say hello.',
    resume: 'Resumé.',
    sites: 'Sites.',
    download: 'Download resumé',
    share: 'Share',
  },
  es: {
    // Nav / Chrome
    contact: 'Contacto',
    backToHome: 'Volver al inicio',
    collapse: 'Colapsar',
    expand: 'Expandir',
    collapseSidebar: 'Colapsar panel',
    expandSidebar: 'Expandir panel',

    // Sidebar footer
    visit: 'Visita',

    // Footer
    legals: 'Legales',
    poweredBy: 'Creado por',

    // Gallery / Project page
    gallery: 'Galería.',
    makingOf: 'Proceso.',
    image: 'imagen',
    images: 'imágenes',
    noProcess: 'Sin proceso disponible.',
    minuteRead: 'min de lectura',
    minutesRead: 'min de lectura',

    // Share / BottomSheet
    copyLink: 'Copiar enlace',
    copied: '¡Copiado!',
    shareOnLinkedIn: 'Compartir en LinkedIn',
    shareOnFacebook: 'Compartir en Facebook',
    shareOnWhatsapp: 'Compartir en Whatsapp',
    shareOnInstagram: 'Compartir en Instagram',
    shareOnThreads: 'Compartir en Threads',
    shareOnX: 'Compartir en X',

    // Contact page
    sayHello: 'Charlemos.',
    resume: 'Currículum.',
    sites: 'Sitios.',
    download: 'Descargar currículum',
    share: 'Compartir',
  },
} as const;

/** Shape of a translation object — keys are fixed, values are plain strings. */
export type Translations = {
  readonly [K in keyof typeof translations.en]: string;
};
