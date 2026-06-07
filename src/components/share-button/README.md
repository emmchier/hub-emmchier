# ShareButton Component

Componente genérico para compartir contenido en redes sociales.

## Descripción

El componente `ShareButton` proporciona un botón con dropdown que permite compartir contenido en diversas redes sociales. Incluye funcionalidad para copiar el enlace y compartir en LinkedIn, Facebook, Instagram (solo mobile/tablet), Threads y X (Twitter).

## Props

- `pathname` (string, requerido): El pathname relativo del contenido a compartir (ej: `/drawings/selection/2024/making-of`)
- `title` (string, requerido): El título del contenido a compartir
- `ariaLabel` (string, opcional): Label de accesibilidad para el botón. Por defecto: `Share ${title}`

## Características

- **Copy Link**: Copia la URL al portapapeles y muestra "Copied!" con un check verde durante 2 segundos
- **Share on LinkedIn**: Abre LinkedIn con la URL
- **Share on Facebook**: Abre Facebook con la URL
- **Share on Instagram**: Solo visible en mobile/tablet. Usa el Web Share API nativo cuando está disponible
- **Share on Threads**: Abre Threads con la URL y título
- **Share on X**: Abre X (Twitter) con la URL y título

## Ejemplo de uso

```tsx
import { ShareButton } from '@/components';
import { usePathname } from 'next/navigation';

export const MyComponent = () => {
  const pathname = usePathname();

  return (
    <ShareButton
      pathname={pathname}
      title="My Article Title"
      ariaLabel="Share this article"
    />
  );
};
```

## Notas

- El componente detecta automáticamente si está en mobile/tablet usando el hook `useBreakpoint`
- Instagram solo se muestra en dispositivos móviles y tablets, no en desktop
- El menú no se cierra automáticamente al hacer click en "Copy link" para permitir ver el feedback visual
