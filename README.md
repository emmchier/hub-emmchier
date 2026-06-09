# emmchier.com

Hub personal de **Emmanuel Chierchié** — nexo de entrada a su trabajo profesional y creativo. No aloja portfolio propio: enlaza a los dos subdominios independientes y sirve como punto de contacto y CV.

**→ [emmchier.com](https://emmchier.com)**

| Subdominio | Contenido |
|-----------|-----------|
| [art.emmchier.com](https://art.emmchier.com) | Portfolio de ilustración y arte digital |
| [design.emmchier.com](https://design.emmchier.com) | Portfolio UX/UI Designer & UI Developer |

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript 5 |
| UI | React 19 |
| Estilos | Tailwind CSS v4 + CSS custom properties |
| Estado global | Zustand 5 |
| CMS | Contentful (Delivery API — solo Resume) |
| Design System | `acuarela-ds` (paquete npm interno) |
| Deploy | Vercel |

---

## Desarrollo local

```bash
npm install
npm run dev:https   # HTTPS local (modo preferido)
```

> Requiere `.env.local` con las variables de Contentful del espacio Resume. El Hub no tiene espacio de galería propio.

Otros comandos:

```bash
npm run build       # Build de producción
npm run lint        # ESLint
npm run clean       # Limpia .next
```

---

## Estructura principal

```
src/
├── app/
│   ├── HubHomePage.tsx       # Componente principal (3 tabs: Sites, Contact, Resumé)
│   ├── contact/              # Alias — el hub no tiene /contact separado
│   ├── legals/               # Aviso legal bilingüe
│   └── resume/               # CV standalone
├── components/               # Componentes UI compartidos (Tab, Button, Header, etc.)
├── i18n/                     # Traducciones EN/ES + legals.json
├── store/                    # Zustand (ui-store, data-store)
└── utils/                    # Helpers, generador de PDF ATS
```

---

## Características principales

- **Sites tab** — cards de art.emmchier.com y design.emmchier.com con navegación directa
- **Contact tab** — grid de tarjetas de contacto (email, LinkedIn, Dribbble, Instagram, GitHub, Behance, Medium, X)
- **Resumé tab** — CV completo con scroll spy, switch EN/ES y descarga PDF ATS
- **Header wave** — animación neon con paleta Blue (`#74BDE8`, `#55A7D8`, `#67CFCB`) sin peach
- **Sistema de animaciones de entrada** — wave header, fade-up sidebar/navbar/tabs, color flash en cards
- **Skeleton system** — una sola vez por sesión
- **Cursor personalizado** — lente B&W con inversión de colores (solo desktop con pointer: fine)
- **Footer sticky** — se ancla al bottom cuando el contenido es corto
- **i18n** — switch EN/ES persistido en localStorage

---

## Accesibilidad

- **Skip to content** — `<a href="#main-content">` visible en focus (color `#74BDE8`)
- **Focus ring** — `3px solid #74bde8`, inset (`outline-offset: -3px`), transición 180ms
- **Tab keyboard navigation** — `role="tablist/tab/tabpanel"`, `aria-label`, arrow keys (←→↑↓), Home, End
- **`role="presentation"`** en `<li>` de tabs para no interferir con AT
- **`aria-labelledby`** en panel del Tab vinculado al botón activo vía `useId()`
- **`aria-hidden="true"`** en todos los SVG decorativos
- Sin `div[onClick]` — todos los interactivos son `<button>` o `<a>` nativos

---

## Notas de arquitectura

- **Nexo, no portfolio:** el Hub no aloja obras. Todo el contenido de portfolio está en art y design.
- **Contentful solo para Resume:** el Hub usa un espacio Contentful independiente exclusivamente para el CV. No tiene espacio de galería.
- **Design System compartido:** `acuarela-ds` es el mismo DS que art y design. Un cambio en el paquete afecta a los tres sitios.
- **Color primario — Blue `#74BDE8`:** el focus ring, skip link y glows del header usan este blue como acento. No mezclar con peach (`#F6D4C2`) que es exclusivo de art.
- **CLAUDE.md:** el archivo [`CLAUDE.md`](./CLAUDE.md) es la referencia completa para agentes IA. Cubre stack, componentes, Zustand, patrones de accesibilidad, animaciones y convenciones de código.

---

*Emmanuel Chierchié · [@emmchier](https://x.com/emmchier)*
