# CLAUDE.md — art.emmchier Portfolio

> Documento de referencia completo para agentes IA. Cubre stack, arquitectura, design system, componentes, Zustand, Contentful, patrones y convenciones. Leer entero antes de tocar código.

---

## 1. Visión general del proyecto

Portfolio de arte digital de **Emmanuel Chierchié** (`@emmchier`). Muestra colecciones de obras organizadas por categorías (drawings, paintings, books, sketchs, characters…), con galería de imágenes, "Making Of" por proyecto y página de contacto/CV.

- **URL de producción:** `art.emmchier.com`
- **Deploy:** Vercel
- **Repositorio:** rama `main` = producción; desarrollo en `develop`

### 1.1 Ecosistema de dominios de Emmanuel Chierchié

| Dominio | Propósito |
| ------- | --------- |
| `emmchier.com` | Hub central. Dominio principal comprado en Hostinger, asociado a Vercel (plan gratuito). Expone links a los dos subdominios principales + contacto/email/CV. |
| `art.emmchier.com` | **Este repositorio.** Sitio como ilustrador: drawings, paintings, characters, books, sketchs y demás. Incluye página de contacto con redes sociales, email y CV actualizado. |
| `design.emmchier.com` | Sitio (en construcción) como UX/UI Designer y UI Developer: trabajos para la industria IT, proyectos de empresa, proyectos de código (GitHub), etc. Mismo modelo de contacto/CV. |

**Estrategia:** `art` y `design` son sitios independientes que se pasan según el contexto laboral (proceso de selección como ilustrador → `art`; como UX/UI/dev → `design`). El hub `emmchier.com` actúa solo como punto de entrada a ambos subdominios.

---

## 2. Stack tecnológico

| Capa          | Tecnología                              | Versión |
| ------------- | --------------------------------------- | ------- |
| Framework     | Next.js (App Router)                    | ^15.5   |
| Lenguaje      | TypeScript                              | ^5.9    |
| UI            | React                                   | ^19     |
| Estilos       | Tailwind CSS v4 + CSS custom properties | ^4      |
| Estado global | Zustand                                 | ^5      |
| CMS           | Contentful (Delivery API + GraphQL)     | ^11     |
| Design System | `acuarela-ds` (npm package interno)     | ^1.5.4  |
| Fuente        | Chakra Petch (Google Fonts)             | —       |
| Lint/Format   | ESLint + Prettier                       | —       |

---

## 3. Comandos de desarrollo

```bash
npm run dev          # Dev server en localhost:3000 (mata puerto y limpia .next antes)
npm run dev:clean    # Igual + rm -rf .next explícito
npm run dev:https    # ⚡ MODO PREFERIDO: dev con HTTPS local (certificado autofirmado)
npm run dev:turbo    # Dev con Turbopack (sin garantía de estabilidad)
npm run build        # Build de producción
npm run start        # Sirve el build
npm run lint         # ESLint
npm run clean        # Limpia .next
```

> **Convención del proyecto:** Cuando el usuario diga "corre el proyecto", "run the project", "levanta el proyecto" o similar, SIEMPRE usar `npm run dev:https`. Nunca usar `npm run dev` ni `npm run dev:turbo` a menos que se pida explícitamente.

La variable `WATCHPACK_POLLING=true` está activada en `dev` para compatibilidad con algunos sistemas de archivos.

---

## 4. Variables de entorno

```
CONTENTFUL_SPACE_ID=...           # ID del espacio Contentful
CONTENTFUL_DELIVERY_TOKEN=...     # Token de entrega (solo lectura)
CONTENTFUL_ENVIRONMENT=master     # Entorno (default: master)
NEXT_PUBLIC_SITE_URL=...          # URL base (p. ej. https://art.emmchier.com)
VERCEL_ENV=production|preview     # Inyectada por Vercel automáticamente
```

Los archivos `.env.development`, `.env.local` y `.env.production` coexisten. `.env.local` sobreescribe en local.

---

## 5. Estructura de directorios

```
src/
├── app/                      # Rutas (Next.js App Router)
│   ├── layout.tsx            # Root layout: fetch inicial, providers, LayoutChrome
│   ├── page.tsx              # Home → redirige a primera categoría
│   ├── HomeClient.tsx
│   ├── [slug]/               # Categoría principal (ej: /drawings)
│   │   ├── page.tsx          # → CategoryRedirectClient (redirige al primer ítem)
│   │   ├── layout.tsx        # → WorkLayoutClient (sidebar + main)
│   │   ├── [..item]/         # Proyecto/subítem (ej: /drawings/grupo/proyecto)
│   │   │   └── page.tsx      # → ProjectPageClient (galería + making of)
│   │   └── image/[imageId]/  # Vista compartida de imagen individual
│   ├── work/[slug]/          # Alias antiguo — mantener por compatibilidad
│   ├── contact/              # Página de contacto + CV
│   │   └── [[...slug]]/      # /contact y /contact/resume
│   ├── legals/               # Aviso legal
│   └── api/
│       ├── collections/[slug]/route.ts        # Stub (obsoleto)
│       └── contentful/category/[slug]/route.ts # Fetch principal de categoría
├── components/
│   ├── index.ts              # Barrel export de TODOS los componentes
│   ├── data-manager/         # DataManager + CategoryManager (bridge SSR→Zustand)
│   ├── header/               # Header (marca de agua "emmchier.")
│   ├── information/          # Information (render Rich Text del Making Of)
│   ├── layout/               # LayoutChrome (chrome global: navbar, footer, drawer…)
│   ├── resume/               # Componentes del CV: chips, tarjetas, secciones
│   ├── share-button/         # ShareButton (web share API + fallback)
│   ├── side-footer/          # SideFooter (redes sociales en sidebar y drawer)
│   └── ui/                   # Componentes UI genéricos (ver §8)
├── config/
│   └── fonts.ts              # Clase CSS de la fuente (font-chakra)
├── constants/
│   └── z-index.ts            # Z_INDEX enum tipado (ver §12)
├── hooks/                    # Custom hooks (ver §11)
├── interfaces/
│   └── index.ts              # Tipos e interfaces principales
├── lib/
│   └── contentful.ts         # Cliente Contentful + fetchDrawingsCategory + fetchNavbarCategories
├── store/
│   ├── ui/ui-store.ts        # useUIStore + useModalStore
│   └── data/data-store.ts    # useDataStore
├── types/
│   └── types.ts              # FCC<P> (tipo genérico FC con children)
└── utils/
    ├── functions.ts          # slugify, deslugify, share helpers, fetchDataFromAPI…
    ├── making-of-content.ts  # hasMakingOfRichTextContent
    └── truncate-text.tsx     # TruncatedText (util de truncado en sidebar)
```

---

## 6. Sistema de rutas

### Patrón de rutas

```
/                           → HomeClient (redirige)
/[categorySlug]             → CategoryRedirectClient → primer ítem de la categoría
/[categorySlug]/[groupSlug]/[itemSlug]  → ProjectPageClient
/[categorySlug]/[groupSlug]/[itemSlug]/making-of  → mismo componente, tab Making Of
/[categorySlug]/image/[imageId]?item=...  → SharedImagePageClient (imagen compartida)
/contact                    → ContactPage (tab "Say hello.")
/contact/resume             → ContactPage (tab "Resumé.")
/legals                     → Legals
```

### Jerarquía de Contentful

```
category (slug, title, order)
  └── projectsTree[]          ← grupo o proyecto raíz
        └── items[]           ← sub-proyecto
              ├── gallery[]   ← imágenes (asset links)
              └── makingOf    ← Rich Text (Contentful)
```

El sidebar y la navbar reflejan esta jerarquía directamente.

---

## 7. Design System

### 7.1 Fuentes

- **Familia:** Chakra Petch (Google Fonts, cargada en `globals.css`)
- **Clase CSS:** `font-chakra` (aplicada en `body` y en el `layout.tsx` via `fontFamily.className`)
- **Base font-size:** `16px` mobile/tablet; `18px` en desktop (≥1024px con `hover: hover` y `pointer: fine`)

### 7.2 Paleta de colores (CSS custom properties en `@theme inline`)

```css
/* Fondos */
--color-primary-background: #112f40 /* fondo principal */
  --color-primary-background-hover: #173b4f
  --color-secondary-background: #173b4f
  --color-secondary-background-hover: #224e67 --color-red-background: #b32316
  /* Texto */ --color-primary-text: #569cc3 /* texto principal (azul medio) */
  --color-primary-text-hover: #437b9a --color-secondary-text: #112f40
  /* texto sobre fondo claro */ --color-activated-text: #f6d4c2
  /* melocotón / CTA activo */ --color-activated-text-hover: #e6bda8
  --color-selected-text: #e5e5e5 /* blanco casi puro / seleccionado */
  --color-gray: #e5e5e5 /* Paleta extendida */ --color-indigo-100: #1c4c67
  --color-indigo-200: #15384b --color-blue-100: #74bde8
  --color-blue-200: #55a7d8 --color-green-100: #67cfcb
  --color-green-200: #4eb1ad;
```

Usar las clases de Tailwind generadas por estas variables: `bg-primary-background`, `text-primary-text`, `border-indigo-100`, etc.

### 7.3 Tipografía escalada (CSS vars → Tailwind)

El sistema tiene dos tipos (`title` y `body`) × tres breakpoints (`mobile`, `tablet`=lg, `desk`=xl) × cinco tamaños:

| Token     | Mobile            | Tablet (lg)       | Desktop (xl)      |
| --------- | ----------------- | ----------------- | ----------------- |
| title-XXL | 3.5rem / lh 1.2   | 4.8rem / lh 1.2   | 5.4rem / lh 0.9   |
| title-XL  | 2rem / lh 1.3     | 2.5rem / lh 1.3   | 3rem / lh 1.3     |
| title-L   | 1.25rem / lh 1.4  | 1.75rem / lh 1.4  | 2rem / lh 1.4     |
| title-M   | 1.125rem / lh 1.4 | 1.5rem / lh 1.4   | 1.75rem / lh 1.4  |
| title-S   | 1rem / lh 1.5     | 1.25rem / lh 1.5  | 1.5rem / lh 1.5   |
| body-L    | 1rem / lh 1.6     | 1.125rem / lh 1.6 | 1.25rem / lh 1.6  |
| body-M    | 0.875rem / lh 1.6 | 0.875rem / lh 1.6 | 1rem / lh 1.6     |
| body-S    | 1rem / lh 1.6     | 1rem / lh 1.6     | 0.875rem / lh 1.6 |

Las clases de Tailwind son: `text-title-mobile-XXL`, `text-body-desk-M`, etc.

**Usar siempre el componente `<Text>` en lugar de clases directas** (ver §8.1).

### 7.4 Selección de texto

```css
::selection {
  color: #0e1017;
  background: #f6d4c2;
}
```

### 7.5 Clase utilitaria `.soft`

Equivale a `transition-all` con la duración y easing por defecto de Tailwind. Usarla para transiciones suaves en hovers.

### 7.6 Clase `.content-list`

Wrapper para contenido Rich Text. Restaura `list-style`, `font-style: italic`, `text-decoration: underline` y links subrayados (el reset universal los elimina). Usar siempre en bloques de Making Of y Legales.

### 7.7 Skeleton

```css
.skeleton-pulse   /* animación shimmer azulado (173b4f → 1d4860) */
```

El componente `<Skeleton>` aplica esta clase. Hay un sistema global `useSkeletonOnce` que muestra el skeleton solo en el primer render de la sesión (1500ms).

---

## 8. Componentes UI

Todos los componentes UI se exportan desde `src/components/index.ts` (barrel). Importar siempre desde `@/components`.

### 8.1 `<Text>`

Componente base para TODA la tipografía. Nunca escribir clases de fuente directas salvo casos muy específicos justificados.

```tsx
<Text
  type="title" | "body"          // default: "body"
  size="s" | "m" | "l" | "xl" | "xxl"  // default: "m"
  heading="h1"..."h6"            // solo aplica si type="title"; default: "h2"
  weight="light"|"regular"|"medium"|"semiBold"|"bold"
  color="primary"|"secondary"|"activated"|"selected"|"#hexcolor"
  variant="solid"|"outline"      // outline = texto hueco (text-stroke)
  className="..."
>
  Contenido
</Text>
```

Internamente detecta truncado y muestra tooltip en desktop.

### 8.2 `<Button>`

```tsx
<Button
  ariaLabel="..."              // OBLIGATORIO
  size="s"|"m"|"l"            // default: "m"
  variant="filled"|"outlined"|"text"
  state="enabled"|"selected"|"activated"|"disabled"
  icon={<SvgIcon />}
  iconButton={true}            // botón solo con icono (cuadrado)
  hoverArrow="right"|"left"|false  // flecha hover (ver §8.2.1)
  onClick={() => {}}
  fullWidth={false}
  rounded={false}
  noPadding={false}
>
  Label
</Button>
```

- `iconButton=true` + `size="s"` → 32×32px
- `iconButton=true` + `size="m"` → 48×48px
- `iconButton=true` + `size="l"` → 56×56px
- `state="activated"` → color melocotón (`--color-activated-text`)
- `state="selected"` → blanco (`--color-selected-text`)

#### 8.2.1 `hoverArrow` — flecha direccional en hover

Prop exclusiva para **non-icon buttons**. Sin efecto en `iconButton={true}`. Solo visible en **tablet y desktop** (`hidden md:inline-flex`); en mobile el botón se comporta sin flecha.

**Comportamiento:**
- `false` (default): sin flecha; label siempre centrado; solo el fondo cambia en hover (comportamiento estándar).
- `'right'`: al hacer hover, un `ArrowRightIcon` (14×14 px) aparece a la **derecha** del label, deslizándose desde la izquierda y quedando a 8 px del texto. El label permanece centrado (la flecha es `position: absolute`, no desplaza el layout).
- `'left'`: al hacer hover, un `ArrowLeftIcon` (14×14 px) aparece a la **izquierda** del label, deslizándose desde la derecha y quedando a 8 px del texto. El label permanece centrado.

**Animación:**
- Duración: 300 ms, easing `ease-out`
- Mecanismo: `max-width` + `opacity` transition en el span de la flecha
- Inicio: `max-w-0 overflow-hidden opacity-0` → la flecha ocupa 0 px, invisible
- Final (hover): `max-w-[22px] opacity-70` → la flecha expande (8 px gap + 14 px icono), el label se desplaza en sentido contrario y el botón crece en ancho

**Por qué `max-width` y no `translateX`:**  
Con `position: absolute` la flecha no modifica el layout → el label no se mueve y el botón no crece. Con `max-width` la flecha vive en el flujo normal (`flex` row), por lo que al expandirse empuja el label y el botón se ensancha orgánicamente.

**Implementación interna:** cuando `hoverArrow` está activo, el Button agrega `group` a sus clases y envuelve el contenido en:
```tsx
<span className="flex items-center justify-center">
  {/* flecha izquierda: pr-[8px] max-w-0 → max-w-[22px] on hover */}
  <span children />
  {/* flecha derecha: pl-[8px] max-w-0 → max-w-[22px] on hover */}
</span>
```
El `gap` entre label y flecha va baked dentro del padding del span de la flecha (no como `gap` en el flex padre), para que no haya espacio residual cuando la flecha está colapsada.

**Usos actuales:**

| Botón | Prop | Notas |
|-------|------|-------|
| Contact (Navbar desktop) | `hoverArrow="right"` | `state="activated"`, con borde inferior de su wrapper div |
| Back to home (Contact page desktop) | `hoverArrow="left"` | `state="activated"`, sin stroke/border en el botón mismo |

**Reglas críticas:**
- ❌ No agregar `group` manualmente al `className` cuando se usa `hoverArrow` — el Button lo agrega automáticamente.
- ❌ No poner JSX complejo como `children` cuando se usa `hoverArrow` — el contenido se envuelve en un `<span>` interno; los children deben ser texto o un nodo simple.
- ❌ No aplicar `hoverArrow` a `iconButton={true}` — la prop es ignorada pero puede crear estructuras inesperadas.
- ✅ Siempre pasar el texto del botón directamente como `children` string cuando se usa `hoverArrow`.

### 8.3 `<Tab>` + `<TabItem>`

Sistema de tabs con indicador animado, soporte de skeleton, header sticky y sincronización con la URL.

```tsx
<Tab
  defaultActiveIndex={0}
  onTabChange={(index) => {
    /* cambiar URL */
  }}
  headerClasses="sticky top-[56px] z-30 ..."
  sideContent={<TitleBlock />} // lado izquierdo del header
  bodyClasses="overflow-y-auto"
  desktopBodyMarginTop="16px"
  mobileBodyMarginTop="24px"
  lockedBodyTabIndex={0} // fuerza un panel aunque el tab activo sea otro
  tabListRowExtraClassName="..." // ocultar tabs visualmente (invisible pointer-events-none)
  contactMobileTabsRight // alinea tabs a la derecha en mobile (solo /contact)
>
  <TabItem label="Gallery." count={12}>
    {/* contenido */}
  </TabItem>
  <TabItem label="Making Of.">{/* contenido */}</TabItem>
</Tab>
```

En `/[slug]/[...item]`: el tab "Gallery." = índice 0, "Making Of." = índice 1. La URL `/making-of` al final del path controla el tab activo. Si no hay contenido rich text en makingOf, los tabs se ocultan y el cuerpo queda bloqueado en Gallery.

### 8.4 `<Sidebar>`

- Solo visible en desktop (≥1266px) en modo normal; en mobile/tablet aparece dentro del `<Drawer>`.
- Estado abierto/cerrado en `useUIStore.isSidebarOpen` + persiste en `localStorage`.
- Construye el árbol de navegación desde `currentCategory` en `useDataStore`.
- Soporta ítems expandibles (con chevron) y no expandibles.
- Scrollbar custom drag-and-drop con `useLayoutEffect` + `ResizeObserver`.
- Botón toggle (chevron) posicionado con `left: calc(20% - 32px - 1px)`.

### 8.5 `<Navbar>`

- Fixed en top-0; z-index: `z-100` (mobile/tablet `z-180`).
- Se oculta al hacer scroll down en mobile (solo si el Drawer está cerrado).
- Lista las categorías de Contentful como links tipográficos grandes.
- El ítem activo se muestra en `variant="solid"` (sólido), el resto en `variant="outline"` (hueco).
- Auto-scroll horizontal al ítem activo al cambiar de ruta.
- Al hacer click en una categoría ya cargada navega al primer ítem; si no está cargada navega al slug raíz y la carga bajo demanda.
- Alturas responsive: mobile 56px, tablet 48px (`md:max-[1265px]`), desktop 72px (`min-[1266px]`).

#### 8.5.1 Contact CTA — alineación con Navbar (CRÍTICO, NO REGRESAR)

El **IconButton de contacto en mobile** (`md:hidden`) debe tener **exactamente la misma altura visual** que el resto de la navbar. Un desfase de **1px** en el borde inferior (como en la captura de referencia) es un bug conocido y **no debe volver a introducirse**.

**Causa raíz (box model):**

- El `<header>` lleva `border-b border-indigo-100` en viewports **&lt; md** (`md:border-b-0` en desktop).
- Con `box-sizing: border-box` (Tailwind preflight), un **`border-b` adicional** en el contenedor del contacto **consume 1px** de la altura interna del flex child.
- El botón con `h-full` queda en **55px** de fondo útil mientras la zona de links/nav ocupa **56px** → se ve la columna del chat **1px más baja** que el resto de la barra.

**Reglas obligatorias (mobile, `&lt; md`):**

| Elemento | Debe ser |
| -------- | -------- |
| `<header>` | `min-h-[56px]` + `border-b border-indigo-100` (único borde inferior de la barra en mobile) |
| Fila interna (`flex` principal) | `min-h-[56px]` + **`items-stretch`** (no `items-center` — impide alinear alturas de hijos) |
| Contenedor contact mobile | `flex shrink-0 self-stretch` + **`border-l border-indigo-100` solamente** — **sin `border-b`** |
| `<Button iconButton>` contact | `box-border h-full! min-h-[56px]! w-[56px]!` + clase `icon-24-mobile` para el ChatIcon 24px |
| Skeleton contact (mismo bloque) | `h-full min-h-[56px] w-[56px]` en el slot derecho; **sin `border-b` en mobile** (`md:border-b` solo si aplica al skeleton desktop) |

**Desktop (`md+`):**

- El `<header>` usa `md:border-b-0` — el borde inferior del bloque contact **sí** puede llevar `border-l border-b border-indigo-100` en el wrapper del botón de texto.
- Botón texto: `h-full min-h-[48px]! min-[1266px]:min-h-[72px]!` alineado con `md:max-[1265px]:min-h-[48px]` y `min-[1266px]:min-h-[72px]` del header.

**Implementación de referencia** (`src/components/ui/navbar/Navbar.tsx`):

```tsx
{/* Mobile — NO border-b en este div */}
<div className="flex shrink-0 self-stretch md:hidden border-l border-indigo-100 md:border-b">
  <Button
    state="activated"
    iconButton
    className="box-border h-full! min-h-[56px]! w-[56px]! relative icon-24-mobile ..."
    icon={<ChatIcon viewBox="0 0 26 27" width={90} height={90} />}
  />
</div>

{/* Desktop */}
<div className="hidden md:flex self-stretch border-l border-b border-indigo-100">
  <Button className="h-full min-h-[48px]! min-[1266px]:min-h-[72px]! ..." />
</div>
```

**Checklist antes de mergear cambios en Navbar:**

1. ¿El contenedor mobile del contact tiene `border-b`? → **Quitarlo** (salvo `md:border-b` en el mismo nodo solo para desktop, como en el patrón `md:border-b` del wrapper unificado).
2. ¿La fila flex usa `items-stretch`?
3. ¿El botón mobile fuerza `min-h-[56px]!` además de `h-full!`?
4. ¿El skeleton del CTA derecho replica las mismas alturas (no `h-[54px]` ni `border-b` duplicado en mobile)?

**No hacer:**

- ❌ `border-b` en el wrapper del IconButton contact cuando el `<header>` ya tiene `border-b` (mobile).
- ❌ `items-center` en la fila principal si el contact usa `self-stretch` (combinación inconsistente).
- ❌ Confiar solo en `h-full` del `<Button>` sin `min-h-[56px]!` — el default de `iconButton` + `size="m"` es `h-[48px]` y puede ganar especificidad en edge cases.
- ❌ Alturas fijas menores al token del breakpoint (`54px`, `55px`, etc.) en el slot de contact.

**Relacionado:** `DrawerTrigger` usa `h-[55px]` en mobile (histórico). Si se unifica con 56px, hacerlo en conjunto con esta spec para no romper la línea del borde del header.

### 8.6 `<Drawer>`

Panel lateral izquierdo que aparece en viewports ≤1265px. Contiene `<Sidebar isMobile>` + `<SideFooter>`.

- Soporta drag horizontal para cerrar (pointer events + touch events con lock de eje).
- Mobile (≤767px): ancho = 100vw. Tablet (768–1265px): ancho = min(320px, viewport).
- Se cierra al navegar (`useEffect` en `LayoutChrome` escucha `pathname`).

### 8.7 `<BottomSheet>`

Sheet inferior solo para mobile/tablet (≤1023px). Se usa para menús de opciones y compartir.

- Dos modos: `'list'` (lista de acciones) y `'share'` (opciones de compartir).
- Drag vertical para expandir (50%vh ↔ 100%vh) o cerrar.
- Portal a `document.body` via `createPortal`.
- Control desde `useUIStore.openBottomSheet({ mode, listItems?, shareData? })`.

```tsx
openBottomSheet({
  mode: 'list',
  listItems: [
    { value: 'id', label: 'Texto', icon: <Icon />, onClick: () => {} },
  ],
});

openBottomSheet({
  mode: 'share',
  shareData: { pathname: '/drawings/grupo/proyecto', title: 'Mi Obra' },
});
```

### 8.8 `<Modal>` + `useModalStore`

Lightbox fullscreen para imágenes. Portal a `document.body`.

```tsx
openModal({
  images: ['url1', 'url2'],
  currentImage: 'url1',
  sharePaths: ['/category/image/id1?item=...', '/category/image/id2?item=...'],
  projectName: 'Nombre del proyecto',
  closeButton: true,
});
```

- Navegación con flechas del teclado (← →) y tecla Escape.
- Transición scale + opacity.
- Header mobile fijo con nombre del proyecto y botones Share/Cerrar.

### 8.9 `<ImageGallery>`

```tsx
<ImageGallery
  subItem={workItem}
  layoutMode="grid" | "singleHero"
/>
```

- `grid`: layout Masonry-like con `flex flex-wrap` en desktop, `grid grid-cols-3` en mobile.
- `singleHero`: imagen única en formato grande (cuando el proyecto tiene 1 sola imagen y no tiene Making Of).
- Paginación: 24 imágenes por página, controlada por `useUIStore.currentPage`.
- Abre `Modal` al hacer click en cada imagen.

### 8.10 `<Skeleton>`

```tsx
<Skeleton className="h-[32px] w-[150px]" />
```

Aplica `skeleton-pulse` (shimmer azulado). No añadir colores propios.

### 8.11 `<InvertedCursor>`

Cursor personalizado solo en desktop (pointer: fine + hover: hover). Lente circular B&W que invierte colores sobre elementos interactivos nativos (`a[href]`, `button`, inputs…). No funciona sobre `div[role="button"]` a propósito.

Para excluir una zona: `data-no-inverted-cursor` en el contenedor raíz.

### 8.12 `<ShareButton>`

```tsx
<ShareButton
  pathname="/drawings/grupo/proyecto"
  title="Nombre del proyecto"
  ariaLabel="compartir"
  size="s"|"m"
  variant="outlined"
  state="selected"
/>
```

En mobile usa Web Share API nativa; en desktop abre `BottomSheet` con opciones de plataformas.

### 8.13 Otros componentes relevantes

| Componente                            | Uso                                                    |
| ------------------------------------- | ------------------------------------------------------ |
| `<Breadcrumb>`                        | Migas de pan en vistas de proyecto                     |
| `<Badge>`                             | Chips de tecnologías en Making Of                      |
| `<Tooltip>`                           | Tooltip (direction: top/right/bottom/left)             |
| `<Pagination>`                        | Control de páginas de la galería                       |
| `<Empty>`                             | Estado vacío genérico                                  |
| `<Footer>`                            | Pie de página global                                   |
| `<SideFooter>`                        | Redes sociales en sidebar y drawer                     |
| `<ContactButton>`                     | Botón flotante CTA (solo en rutas que no son /contact) |
| `<ScrollToTop>`                       | Botón para volver arriba                               |
| `<Avatar>`                            | Avatar flip-coin (Bascat ↔ foto) en /contact           |
| `<BaseModal>`                         | Modal genérico (usado para avatar ampliado)            |
| `<Dropdown>`                          | Dropdown de opciones                                   |
| `<ButtonGroup>` / `<ButtonGroupItem>` | Grupo de botones toggle                                |

---

## 9. Zustand — Estado global

### 9.1 `useUIStore` (`src/store/ui/ui-store.ts`)

Estado de la UI. **No persistir datos de negocio aquí.**

```ts
// Drawer (panel lateral mobile/tablet)
isDrawerOpen: boolean
openDrawer / closeDrawer / openCloseDrawer

// Sidebar (panel lateral desktop)
isSidebarOpen: boolean          // persiste en localStorage
openSidebar / closeSidebar / openCloseSidebar

// Paginación de la galería
currentPage: number             // default: 1
itemsPerPage: number            // default: 24
setCurrentPage(page)

// Idioma
language: 'en' | 'es'          // persiste en localStorage
toggleLanguage()

// Altura del header del Tab (para cálculos de posición)
tabHeaderHeight: number         // default: 72
setTabHeaderHeight(height)

// BottomSheet
isBottomSheetOpen: boolean
bottomSheetMode: 'list' | 'share'
bottomSheetListItems: Item[] | undefined
bottomSheetShareData: { pathname, title } | undefined
openBottomSheet({ mode, listItems?, shareData? })
closeBottomSheet()
```

### 9.2 `useModalStore` (`src/store/ui/ui-store.ts`)

Lightbox de imágenes.

```ts
showModal: boolean
images: string[]
currentImage: string
sharePaths: string[]
projectName: string | null
closeButton: boolean
fullWidthActions: boolean
closeOnClickOverlay: boolean

openModal({ images, currentImage, sharePaths?, projectName?, closeButton?, ... })
closeModal()
setCurrentImage(url)
goToNextImage()
goToPreviousImage()
```

### 9.3 `useDataStore` (`src/store/data/data-store.ts`)

Estado de los datos de Contentful. Es una caché cliente: los datos se acumulan durante la sesión.

```ts
// Colecciones cargadas (caché de WorkData)
collections: WorkData[]
setCollection(collection)       // agrega si no existe (dedup por slug)
navbarCollections: WorkData[]   // categorías para el navbar
setNavbarCollections(collections)

// Categorías de Contentful (caché completa con imágenes)
categories: ContentfulCategory[]
setCategory(category)           // upsert por slug
setCategories(categories[])     // merge batch

// Categoría activa (la del slug actual en la URL)
currentCategory: ContentfulCategory | null
setCurrentCategory(category | null)

// Ítem activo (el proyecto seleccionado)
currentItem: WorkItem
setCurrentItem(item)

// Colección activa
currentCollection: WorkData
setCurrentCollection(collection)

// Control de fetches en progreso (evita doble-fetch)
fetchingCategories: Set<string>
setFetchingCategory(slug, isFetching)
isCategoryFetching(slug) → boolean
```

### Patrón de carga de categorías

1. **SSR (Root Layout):** `fetchDrawingsCategory()` carga la categoría `drawings` con `include: 5` (resuelve assets anidados).
2. **`CategoryManager`** (client component sin UI): recibe los datos SSR e inyecta en `useDataStore` via `useEffect`.
3. **Navbar/Sidebar/ProjectPageClient:** al cambiar de ruta, si la categoría requerida no está en `categories` (o no tiene imágenes), hacen fetch a `/api/contentful/category/[slug]` y guardan en store.
4. **`isCategoryFetching`** previene fetches duplicados simultáneos.

---

## 10. Contentful — Integración

### 10.1 Cliente

`src/lib/contentful.ts`:

- `contentfulClient`: instancia de `createClient()` (SDK oficial). `null` si faltan variables de entorno.
- `contentfulGraphQLRequest<T>(query)`: wrapper fetch sobre el endpoint GraphQL. Usa `next: { revalidate: 60 }`.
- `fetchDrawingsCategory()`: fetch vía SDK REST, `include: 5`, `content_type: 'category'`, `fields.slug: 'drawings'`. Cache en memoria de 60s en dev.
- `fetchNavbarCategories()`: fetch vía GraphQL, devuelve `WorkData[]` ordenados por `order`.

### 10.2 API Route — `/api/contentful/category/[slug]`

Ruta GET que el cliente llama para cargar una categoría bajo demanda.

**Flujo:**

1. `getEntries({ content_type: 'category', include: 5, 'fields.slug': slug })`
2. Recorre el árbol (`projectsTree` → `items` → `gallery`) para recopilar todos los `assetId`.
3. Fetcha los assets faltantes en chunks de 50.
4. `normalizeProject()`: resuelve referencias de galería → array de `{ id, url, width, height, alt }`.
5. Calcula `readingTime` desde el Rich Text de `makingOf` con `calculateReadingTimeFromRichText()`.
6. `toSafeEntry()`: serializa a un objeto plano seguro para JSON (sin referencias circulares).
7. Devuelve `{ item: SafeEntry }` con `Cache-Control: no-store`.

**Importante:** Las imágenes de un proyecto se guardan en `fields.images` (array de objetos resueltos). El campo `gallery` en Contentful contiene links a entries de galería; esos entries tienen un campo `image` que es un asset link.

### 10.3 Tipos Contentful

```ts
// ContentfulCategory puede venir con o sin .fields (SDK vs. serializado)
// Siempre usar los helpers getCategorySlug() / getProjectsTree()
// que soportan ambas formas: category?.fields?.slug ?? category?.slug
```

### 10.4 Content types en Contentful

- **`category`**: `slug`, `title`, `order`, `projectsTree[]` (refs a entries de proyecto/grupo)
- **Proyecto/grupo**: `title`, `slug`, `description`, `gallery[]`, `items[]`, `makingOf` (Rich Text), `techs[]`, `order`, `publishedDate`
- **Entry de galería**: `image` (asset link), `title`
- **Tech**: `name`

---

## 11. Hooks personalizados

### `useBreakpoint()`

```ts
const { breakpoint, isMobile } = useBreakpoint();
// breakpoint: 'mobile' | 'tablet-sm' | 'tablet' | 'macbook' | 'desktop'
// isMobile: true si es mobile o tablet-sm o tablet
```

Breakpoints:

- `mobile`: < 768px
- `tablet-sm`: 768–990px
- `tablet`: 991–1198px
- `macbook`: 1199–1699px
- `desktop`: ≥ 1700px

Siempre devuelve `'macbook'` / `false` en SSR para evitar mismatch de hidratación.

### `useMediaQuery(query: string)`

Hook primitivo que retorna `boolean`. SSR-safe (devuelve `false` hasta montar).

### `useMinWidth(px: number)`

Alias de `useMediaQuery(`(min-width: ${px}px)`)`.

### `useScrollDirection()`

Retorna `'up' | 'down' | null`. Usado por `Navbar` y `Tab` para ocultar/mostrar el header en mobile al hacer scroll down.

### `useSkeletonOnce(durationMs = 1500)`

Singleton global: retorna `true` durante 1500ms desde el primer mount de cualquier componente que lo use, luego `false` para siempre en la sesión. Garantiza que el skeleton solo se muestre en la carga inicial.

---

## 12. Constantes — Z-Index

```ts
// src/constants/z-index.ts
Z_INDEX = {
  drawerOverlay: 150,
  drawerPanel: 151,
  baseModal: 100,
  navbarNarrow: 180, // Navbar en mobile/tablet
  scrollToTop: 101,
  modal: 300,
  modalChrome: 301,
  bottomSheetOverlay: 500,
  bottomSheet: 501,
  // InvertedCursor: z-600 (clase Tailwind directa)
};
```

Importar siempre desde `@/constants/z-index` para consistencia.

En la Navbar se usan clases Tailwind (`z-100`, `z-180`, `z-110`) porque son valores fijos en el markup.

---

## 13. Layout system

### Root Layout (`src/app/layout.tsx`)

Server Component que:

1. Hace fetch SSR de `drawings` category y `navbarCollections`.
2. Renderiza `<DataManager>` y `<CategoryManager>` (client bridges).
3. Renderiza `<Modal>` (portal client).
4. Renderiza `<LayoutChrome navbarCollections={...}>` con `{children}`.

`<main>` usa `flex flex-col min-h-screen`. El footer sticky depende de este contenedor.

### 13.1 Sticky footer + scroll del documento (CRÍTICO, NO REGRESAR)

**Síntomas de regresión:**

- Contenido corto (Languages en Resume mobile): al scrollear, el **Footer flota** y queda hueco debajo.
- Galería con pocas imágenes: scroll “solo Gallery” deja **vacío enorme** scrollable (Under the water, 2 imágenes).

**Causa raíz:**

1. `flex-1` / `basis-0` en wrappers o `<Tab>` con contenido más bajo que el viewport → espacio muerto scrollable.
2. `overflow-y-auto` en el body del `<Tab>` → scroll interno atrapado.
3. `min-h-screen` duplicado en `WorkLayoutClient` además de `main`.

**Patrón obligatorio:**

| Capa | Comportamiento |
| ---- | -------------- |
| `main` | `flex flex-col min-h-screen` |
| `LayoutChrome` page shell | `flex flex-1 flex-col min-h-0` envuelve ruta + Footer |
| Wrapper `{children}` | `flex w-full flex-col min-h-0` — **sin `flex-1`** |
| `<Footer>` | `mt-auto shrink-0` + `pt-[32px] md:pt-[64px]` |
| `<Tab>` `bodyClasses` | **`overflow-visible`** (project + contact) |
| `WorkLayoutClient` | `flex w-full min-h-0` — **sin `min-h-screen`** |
| Contact layout/page/Tab | Altura natural, sin `flex-1 basis-0` en mobile |

**Checklist:** sin `flex-1` innecesario en Tab/ruta; sin `overflow-y-auto` en Tab body; sin `min-h-screen` en WorkLayoutClient; skeleton galería desmontado cuando no aplica.

### `LayoutChrome` (`src/components/layout/LayoutChrome.tsx`)

Client component. Decide qué chrome mostrar según la ruta:

- **Ruta de imagen** (`/[slug]/image/[id]`): solo `InvertedCursor` + `BottomSheet`.
- **Ruta `/contact`**: oculta `Navbar` (la contact page tiene su propio top bar).
- **Resto**: `InvertedCursor` + `Drawer` + `BottomSheet` + `Navbar` + `Footer` + `ContactButton`.

Se cierra el Drawer en cada cambio de `pathname`. Ver **§13.1**.

### `WorkLayoutClient` (`src/app/work/[slug]/WorkLayoutClient.tsx`)

Envuelve las rutas de categoría. En desktop (≥1266px): sidebar 20% + contenido 80%. En narrower: solo contenido full width. **Sin `min-h-screen`** en la raíz (ver §13.1).

---

## 14. Flujo de datos completo (ejemplo: abrir un proyecto)

```
1. Usuario navega a /drawings/grupo/proyecto
2. [slug]/layout.tsx → WorkLayoutClient (sidebar)
3. [slug]/[...item]/page.tsx → ProjectPageClient
4. ProjectPageClient useEffect: mira categories en store
   - Si no está o no tiene imágenes: fetch /api/contentful/category/drawings
   - API resuelve árbol, normaliza imágenes, calcula readingTime
   - Guarda en useDataStore (setCategory + setCurrentCategory)
5. ProjectPageClient.selectedEntry: navega el árbol projectsTree
   → encuentra el entry que matchea groupSlug + itemSlug
6. normalizeProject(entry) → WorkItem (name, slug, images, makingOf, tools…)
7. Añade urlToShare a cada imagen: /drawings/image/[id]?item=grupo/proyecto
8. Renderiza:
   - Header (marca de agua)
   - Tab (Gallery. / Making Of.)
   - Tab 0: ImageGallery → ImageGridItem × N → click → openModal()
   - Tab 1: Information (renderRichText de makingOf)
```

---

## 15. Renderizado de Rich Text (Making Of)

`Information.tsx` contiene un renderer manual del Rich Text de Contentful (sin librerías externas). Soporta:

- `document`, `paragraph`, `heading-1..6`
- `blockquote`, `hr`
- `unordered-list`, `ordered-list`, `list-item`
- `table`, `table-row`, `table-cell`, `table-header-cell`
- `embedded-asset-block` (imagen inline)
- `embedded-entry-block` (tarjeta de entrada referenciada)
- `hyperlink`, `entry-hyperlink`, `asset-hyperlink`
- Marks: `bold`, `italic`, `underline`, `code`

Todos los bloques se renderizan con clases del design system. El contenedor raíz lleva `content-list` para restaurar estilos de lista e itálica.

---

## 16. Página de Contacto (`/contact`)

Dos tabs sincronizadas con URL:

- **Say hello.** (`/contact`): grid de tarjetas de contacto con layout CSS grid nombrado (`contact-cards-grid`). 7 slots con `grid-template-areas` nombradas. Chunks de 7 ítems.
- **Resumé.** (`/contact/resume`): CV completo. Mobile: chips de categoría + secciones. Desktop (≥1024px): layout dos columnas.

`Avatar`: componente flip-coin 3D (CSS `rotateX` + `backface-visibility`). Cara A = Bascat (SVG mascota), Cara B = foto de Emmanuel. Animación de moneda al cambiar de tab.

`RotatingRoleLine`: rotación animada de roles (UX Designer, Illustrator, etc.).

---

## 17. Convenciones de código

### TypeScript

- Tipar siempre. Evitar `any`; usar `unknown` y narrow.
- `FCC<P>` = `FC<P & { children?: ReactNode }>` para componentes que aceptan children.
- Las interfaces de Contentful son loosely typed (`[key: string]: unknown`) a propósito porque el SDK no garantiza estructura.

### Componentes

- Componentes de página (routes): `default export` (requerido por Next.js).
- Componentes reutilizables: `named export`.
- Siempre `'use client'` explícito si usa hooks, eventos o APIs de browser.
- Los Server Components no llevan directiva.

### Tailwind v4

- Las custom properties de color se definen en `@theme inline { }` dentro de `globals.css`.
- Tailwind v4 no usa `tailwind.config.js`; la configuración es via CSS.
- Usar `!` para overrides de importancia: `className="text-[16px]!"` (equivale a `!important`).
- Breakpoints del proyecto se manejan con clases arbitrarias: `md:max-[1265px]:`, `min-[1266px]:`.

### Importaciones

- Path alias `@/` apunta a `src/`.
- Componentes UI: importar desde `@/components` (barrel), nunca la ruta absoluta interna.
- Excepciones: `Sidebar` se importa directamente desde su path (es `default export`).

### Naming

- Archivos de componentes: `PascalCase.tsx`
- Hooks: `camelCase.ts` con prefijo `use`
- Stores: `kebab-case-store.ts`
- Utils: `kebab-case.ts`

### No hacer

- No desalinear el **Contact IconButton mobile** respecto a la Navbar: ver **§8.5.1** (nunca `border-b` duplicado en mobile en el wrapper del contact).
- No añadir `console.log` o `console.error` en producción.
- No usar `useEffect` para inicializar estado que podría ser derivado con `useMemo`.
- No lanzar `localStorage` directamente sin `typeof window !== 'undefined'`.
- No usar `!important` con `!` de Tailwind de forma masiva; solo para overrides puntuales.
- No romper el patrón SSR→bridge→store: los datos que vienen del servidor se pasan vía props a `DataManager`/`CategoryManager`, que los inyectan en Zustand en el cliente.

---

## 18. SSR e Hidratación

### Reglas críticas

1. **`isSidebarOpen` inicia `true` en SSR.** El cliente lo sincroniza con `localStorage` en `useEffect` una sola vez. Esto evita el flash FOUC al cargar con sidebar cerrado.
2. **`useBreakpoint` retorna `'macbook'`/`false` en SSR.** Los componentes deben tener un estado inicial consistente antes del mount.
3. **`showModal` etc. en `useUIStore` arrancan `false`.** Los portales (`createPortal`) se renderizan solo tras mount.
4. **`isMounted` pattern:** cuando un componente depende del viewport, usar un flag `useState(false)` + `useEffect(() => setIsMounted(true), [])` antes de aplicar lógica condicional.
5. **`suppressHydrationWarning` en `<html>`:** necesario porque la clase del tema puede diferir.

---

## 19. Performance y buenas prácticas

- **Imágenes:** usar siempre `next/image` con `width`, `height` y `sizes` correctos. Las imágenes de Contentful tienen `https:` antepuesto en `normalizeProject`.
- **`useMemo` / `useCallback`:** usar para cálculos derivados del store o listas derivadas de categorías. No sobreoptimizar renders simples.
- **Skeleton system:** no crear skeletons custom sin pasar por `useSkeletonOnce`. El sistema garantiza que el skeleton solo aparezca en carga inicial.
- **`revalidate: 60`:** las rutas API de Contentful no cachean (`Cache-Control: no-store`); el fetch interno de GraphQL tiene `revalidate: 60`.
- **`ResizeObserver`:** siempre hacer `ro.disconnect()` en el cleanup de `useEffect`/`useLayoutEffect`.
- **`requestAnimationFrame`:** el InvertedCursor usa `rAF` para throttlear el paint; cancelar en cleanup con `cancelAnimationFrame(rafRef.current)`.

---

## 20. Internacionalización

El store tiene `language: 'en' | 'es'` (persiste en localStorage), controlable con `toggleLanguage()`. No está integrado con i18n de Next.js. La UI actual está mayormente en inglés. Si se añade contenido bilingüe, leer `language` del store en el componente.

---

## 21. Cursor personalizado — `InvertedCursor`

- Solo activo en dispositivos con `pointer: fine` y `hover: hover` (mouse/trackpad, no touch).
- Cuando está activo, añade `inverted-cursor-active` a `<html>`, lo que hace `cursor: none !important` globalmente.
- El efecto visual es un disco de 40px con `backdropFilter: grayscale(1) invert(1) contrast(480%)`.
- Para excluir un elemento: `data-no-inverted-cursor` en el ancestro.
- Lógica de detección de clickables: **solo elementos semánticos nativos** (`a[href]`, `button`, `input`, `select`, `textarea`, `summary`, `label[for]`). No reacciona a `div[onClick]` ni `role="button"` intencionalmente.

---

## 22. Feature de Share e imagen compartida

### 22.1 URL de imagen compartida

Cuando el usuario hace click en "Share" desde el modal de la galería (o desde la página de imagen compartida), la URL que se comparte tiene la forma:

```
/[categorySlug]/image/[imageId]?item=[groupSlug]/[projectSlug]
```

Ejemplo: `/drawings/image/3m8EhJBciBC6hyP8yrPkkZ?item=selection%2F2024`

- `imageId` = ID del asset en Contentful (el `sys.id` del asset)
- `item` = path de slugs del proyecto que contiene la imagen (`groupSlug/projectSlug`)

### 22.2 Comportamiento de la página de imagen compartida (`SharedImagePageClient`)

Esta página **no abre un modal encima del sitio**. En su lugar, renderiza un **lightbox fullscreen embebido** directamente en la zona de contenido (debajo de la Navbar y a la derecha del Sidebar). El usuario ve:

- La imagen actual en el centro
- Navegación entre imágenes del mismo proyecto
- Botón de share y botón de cerrar (vuelve a la galería del proyecto)
- En desktop: nombre del proyecto + contador de imágenes en el header del lightbox

Esto es intencional: es una vista "standalone" de la imagen que permite al receptor del link ver la obra sin necesitar navegar al proyecto completo.

### 22.3 Ruta proxy de imagen OG — `CRÍTICO, NO CAMBIAR`

**Archivo:** `src/app/api/og-image/[imageId]/route.ts`

Esta ruta existe para resolver **dos bugs simultáneos** de WhatsApp que impedían mostrar la imagen en el share card:

**Bug 1 — Codificación `&amp;` en HTML:**
Si el `og:image` URL tuviera query params con `&`, el HTML los codificaría como `&amp;` en el meta tag:
```html
<!-- Lo que Next.js genera en el HTML: -->
<meta property="og:image" content="https://images.ctfassets.net/...?w=1200&amp;h=630&amp;fm=jpg"/>
```
WhatsApp Mobile **no decodifica `&amp;`** antes de hacer el request HTTP → envía la URL literal con `&amp;` → Contentful devuelve HTTP 400 → sin imagen.

**Bug 2 — WhatsApp no sigue redirects HTTP:**
Un `302 redirect` desde nuestra ruta hacia Contentful es ignorado silenciosamente por WhatsApp.

**Solución implementada — proxy directo de bytes:**
```
og:image = https://art.emmchier.com/api/og-image/[imageId]
           ↑ URL limpia: sin query params, sin & en el HTML
```
La ruta API:
1. Fetchea el asset de Contentful con el SDK
2. Construye la URL transformada con los params correctos server-side
3. Fetchea la imagen de Contentful
4. **Devuelve los bytes JPEG directamente** (`200 + body`, sin redirect)

WhatsApp (y cualquier scraper) recibe la imagen en el primer y único request.

**Parámetros de transformación Contentful Image API — EXACTOS, NO CAMBIAR:**
```
w=1200   → ancho OG estándar
h=630    → alto OG estándar (ratio 1.91:1 landscape — requerido por WhatsApp, X, Threads)
fit=pad  → no recorta; rellena el espacio sobrante con el color de fondo
bg=rgb:112f40  → primary-background del sitio (sin espacios, sin #)
fm=jpg   → JPEG obligatorio (X rechaza WebP; WhatsApp/Meta prefieren JPG)
q=80     → ~100-200KB, muy por debajo del límite de 5MB de X
```

**Reglas críticas:**
- ❌ NO poner query params en el `og:image` URL del meta tag
- ❌ NO usar `302 redirect` en la ruta `/api/og-image/`
- ❌ NO cambiar los parámetros de transformación sin testear en todas las plataformas
- ✅ Siempre proxear los bytes directamente con `Content-Type: image/jpeg`
- ✅ Cache headers: `public, max-age=300, s-maxage=3600`

### 22.4 OpenGraph por imagen (`generateMetadata`) — `CRÍTICO, NO CAMBIAR`

**Archivo:** `src/app/[slug]/image/[imageId]/page.tsx`

```typescript
// og:image apunta a la ruta proxy (URL limpia, sin query params)
ogImageUrl = `${siteUrl}/api/og-image/${imageId}`;

// Dimensiones fijas (resultado de la transformación en la ruta proxy)
ogImageWidth = 1200;
ogImageHeight = 630;
ogImageType = 'image/jpeg';
```

La ruta verifica que el asset existe antes de exponer la URL. Si el asset no existe, `ogImageUrl` queda `undefined` y los tags OG se omiten sin romper nada.

**Metadata que se genera:**
```html
<!-- OpenGraph -->
<meta property="og:title" content="2024 | Emmanuel Chierchié"/>
<meta property="og:description" content="Ilustración de Emmanuel Chierchié — 2024"/>
<meta property="og:url" content="https://art.emmchier.com/drawings/image/[id]?item=selection%2F2024"/>
<meta property="og:site_name" content="Emmanuel Chierchié"/>
<meta property="og:type" content="website"/>
<meta property="og:image" content="https://art.emmchier.com/api/og-image/[id]"/>
<meta property="og:image:secure_url" content="https://art.emmchier.com/api/og-image/[id]"/>
<meta property="og:image:type" content="image/jpeg"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="2024"/>

<!-- Twitter/X Card -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:site" content="@emmchier"/>
<meta name="twitter:creator" content="@emmchier"/>
<meta name="twitter:title" content="2024 | Emmanuel Chierchié"/>
<meta name="twitter:description" content="Ilustración de Emmanuel Chierchié — 2024"/>
<meta name="twitter:image" content="https://art.emmchier.com/api/og-image/[id]"/>
<meta name="twitter:image:alt" content="2024"/>
```

El `og:title` usa el **último segmento** del query param `?item=`, deslugificado:
- `?item=selection/2024` → último segmento `2024` → `deslugify("2024")` → `"2024"`
- `?item=grupo/mi-proyecto` → último segmento `mi-proyecto` → `"Mi Proyecto"`

### 22.5 Comportamiento de `shareOnWhatsApp` — `CRÍTICO, NO CAMBIAR`

La función `shareOnWhatsApp` en `src/utils/functions.ts` envía **solo la URL** (sin texto adicional):

```ts
const url = `https://wa.me/?text=${encodeURIComponent(articleUrl)}`;
```

**Por qué solo la URL (sin título):**
Si se incluye texto antes de la URL (`"2024 https://..."`), WhatsApp no genera el link preview card — lo trata todo como texto plano. Enviando solo la URL, WhatsApp hace el fetch del OG de la página y muestra el card con imagen + título.

El parámetro `_title` se mantiene en la firma **por compatibilidad con la interfaz** pero no se usa. Tiene `// eslint-disable-next-line @typescript-eslint/no-unused-vars` encima.

### 22.6 Estado verificado de cada plataforma

| Plataforma | ¿Funciona? | Comportamiento | Notas clave |
| ---------- | ---------- | -------------- | ----------- |
| **LinkedIn** | ✅ | Card con imagen 1200×630 + título + descripción | URL via `linkedin.com/sharing/share-offsite/?url=...` |
| **Facebook** | ✅ | Card con imagen + título + descripción | URL via `facebook.com/sharer/sharer.php?u=...` |
| **WhatsApp** | ✅ | Card con imagen + título + descripción | Solo URL en `wa.me/?text=...`; imagen proxy directo (no redirect) |
| **Instagram** | ✅ | Native share sheet (Stories, DMs, Feed) en mobile; copy link en desktop | Web Share API — ver §22.8 |
| **Threads** | ✅ | Card con imagen + título | `title + URL` en `threads.net/intent/post?text=...` |
| **X (Twitter)** | ✅* | Card aparece **después de postear**, no en el composer | Ver §22.7 |
| **Copy link** | ✅ | Solo la URL al portapapeles | — |

### 22.7 Comportamiento de X (Twitter) — `NO ES UN BUG`

**El compose window de X NO muestra el card preview.** Esto es **comportamiento esperado de X**, no un error de implementación.

- En el compose window (`x.com/intent/post?text=...&url=...`) X muestra solo la URL como link azul — sin card preview. Así funciona X desde ~2023.
- El card con imagen (summary_large_image) **sí aparece en el feed** después de postear el tweet.
- Verificado: `cards-dev.x.com/validator` reporta "Card loaded successfully" con `twitter:card = summary_large_image`.

**Implementación de `shareOnX`:**
```ts
const text = encodeURIComponent(title);
const url = `https://x.com/intent/post?text=${text}&url=${encodeURIComponent(articleUrl)}`;
```
- Usa `x.com` (no `twitter.com` — aunque redirige, es mejor usar el canónico)
- `title` y `url` van **separados** como parámetros distintos
- El card se adjunta al `url`, no al `text`

> ⚠️ **Nunca intentar "arreglar" la ausencia de preview en el compose window de X** — es diseño de producto de X, no un bug. El card sí funciona en el tweet publicado.

### 22.8 Comportamiento de Instagram — `IMPLEMENTACIÓN CORRECTA, NO CAMBIAR`

**Instagram no tiene un endpoint web de sharing** (sin URL de tipo `instagram.com/share?url=...` como LinkedIn o Facebook). La única forma estándar de compartir desde la web hacia Instagram es la **Web Share API nativa** del sistema operativo.

**Implementación de `shareOnInstagram`:**
```ts
export const shareOnInstagram = (pathname: string, title?: string): void => {
  const articleUrl = getArticleUrl(pathname);
  if (navigator.share) {
    // Mobile: abre el share sheet nativo del OS.
    // El usuario ve todas las opciones de Instagram: Stories, Publicaciones, DMs.
    navigator
      .share({ title: title || 'Emmanuel Chierchié', url: articleUrl })
      .catch(() => { copyLink(pathname); }); // fallback si cancela
  } else {
    // Desktop: Instagram no tiene web share URL → copiar al portapapeles.
    copyLink(pathname);
  }
};
```

**Por qué funciona así:**
- **Mobile** (`navigator.share` disponible): el OS muestra el share sheet nativo. El usuario toca el ícono de Instagram y, dentro de la app, elige Stories, Feed o DMs. Esto es exactamente lo que pide el brief ("Stories, Publicaciones, Mensajes de chat"). No necesitamos implementar esas sub-opciones: Instagram lo maneja internamente.
- **Desktop** (`navigator.share` no disponible): Instagram no expone ningún endpoint web de sharing. El fallback correcto es copiar la URL al portapapeles. El usuario la pega donde quiera.

**Dónde está presente Instagram en la UI:**
| Superficie | ¿Tiene Instagram? | Implementación |
| ---------- | ----------------- | -------------- |
| `BottomSheet.tsx` (mobile) | ✅ | `shareOnInstagram(pathname, title)` |
| `ShareButton.tsx` (dropdown desktop) | ✅ | `shareOnInstagram(pathname, title)` |
| `ResumeTabContent.tsx` (dropdown desktop /contact) | ✅ | `shareOnInstagram('/contact', 'Resumé')` |

**Orden de opciones en todos los dropdowns/sheets — MANTENER ESTE ORDEN:**
1. Copy link
2. LinkedIn
3. Facebook
4. WhatsApp
5. Instagram
6. Threads
7. X

> ⚠️ **No intentar implementar deep links de Instagram Stories** (`instagram-stories://share`) — requieren un Facebook App ID y revisión de Meta. La Web Share API es la solución correcta y completa.

---

## 23. Archivos de referencia rápida

| Necesito saber…         | Mirar en…                                         |
| ----------------------- | ------------------------------------------------- |
| Colores y variables CSS | `src/app/globals.css` → `@theme inline`           |
| Tipos e interfaces      | `src/interfaces/index.ts`                         |
| Z-index                 | `src/constants/z-index.ts`                        |
| Estado UI               | `src/store/ui/ui-store.ts`                        |
| Estado datos            | `src/store/data/data-store.ts`                    |
| Cliente Contentful      | `src/lib/contentful.ts`                           |
| API fetch de categoría  | `src/app/api/contentful/category/[slug]/route.ts` |
| Barrel de componentes   | `src/components/index.ts`                         |
| Render Rich Text        | `src/components/information/Information.tsx`      |
| Navbar + contact CTA      | `src/components/ui/navbar/Navbar.tsx` + **§8.5.1** |
| Breakpoints             | `src/hooks/useBreakpoint.ts`                      |
| Slug utils              | `src/utils/functions.ts` → `slugify`, `deslugify` |
| Skeleton global         | `src/hooks/useSkeletonOnce.ts`                    |
| Share feature           | §22 completo + `src/utils/functions.ts`           |
| OG image proxy          | `src/app/api/og-image/[imageId]/route.ts`         |
| OpenGraph por imagen    | `src/app/[slug]/image/[imageId]/page.tsx` → `generateMetadata` |
| Sistema de animaciones  | **§24 completo** + `src/hooks/useEntranceAnimation.ts` + `src/app/globals.css` |
| Scroll + Footer + Layout canónico | **§25 completo** — leer antes de tocar cualquier layout |

---

## 24. Sistema de animaciones de entrada (`useEntranceAnimation`)

> **Lectura obligatoria antes de modificar cualquier animación.** El sistema está cuidadosamente calibrado; cambios parciales rompen la sincronización entre partes.

---

### 24.1 Arquitectura general — singleton de sesión

El hook `useEntranceAnimation` (`src/hooks/useEntranceAnimation.ts`) es la pieza central. Controla cuándo se disparan todas las animaciones de entrada.

**Principio:** las animaciones de entrada deben reproducirse **una sola vez por sesión**, justo cuando el skeleton inicial desaparece (≈1500 ms). En re-mounts por navegación el estado ya es `true` y los elementos son visibles de inmediato.

```ts
// Módulo — singletons compartidos entre todas las instancias del hook
let entrancePlayed = false;
const entranceSubscribers = new Set<(v: boolean) => void>();

export const useEntranceAnimation = (): boolean => {
  const showSkeleton = useSkeletonOnce();

  // Lazy initializer — lee entrancePlayed SINCRÓNICAMENTE en el mount.
  // Inicial: false (animación pendiente).
  // Re-mount tras navegación: true inmediatamente → sin letras invisibles.
  const [active, setActive] = useState(() => entrancePlayed);

  // ORDEN DE EFECTOS CRÍTICO — React registra hooks por orden; invertirlos rompe HMR.
  // Efecto 1: dispara la animación cuando el skeleton termina.
  useEffect(() => {
    if (entrancePlayed) return;
    if (!showSkeleton) {
      entrancePlayed = true;
      setActive(true);
      entranceSubscribers.forEach((fn) => fn(true));
    }
  }, [showSkeleton]);

  // Efecto 2: suscribe/desuscribe este componente al bus global.
  useEffect(() => {
    entranceSubscribers.add(setActive);
    return () => { entranceSubscribers.delete(setActive); };
  }, []);

  return active;
};
```

**Reglas de invariante — NUNCA violar:**
- ❌ No cambiar el **orden** de los dos `useEffect` — React rastrea hooks por orden; invertirlos causa "Previous: [] Incoming: [false]" en HMR.
- ❌ No usar `useState(false)` — debe ser `useState(() => entrancePlayed)` para que re-mounts lean el flag sincrónicament, si no las letras quedan en `opacity: 0` tras navegar y volver.
- ❌ No mover la lógica del flag a React Context ni Zustand — el módulo singleton es intencional para evitar overhead de provider y garantizar fuego único.

---

### 24.2 Header — wave neon `art.emmchier.`

**Archivo:** `src/components/header/Header.tsx`

**Efecto:** cada letra sube desde abajo (20px → 0) y al pasar la "ola" destella su color neon asignado. La ola va de izquierda a derecha: `a` → `r` → `t` → `.` → `e` → … → `.` final.

#### Parámetros de timing

| Constante | Valor | Razón |
|-----------|-------|-------|
| `WAVE_STAGGER_MS` | `27 ms` | Separación entre letras consecutivas — doble de velocidad que la versión original (55 ms). Menos da sensación de blur; más hace la ola lenta. |
| Duración keyframe | `410 ms` | Cuerpo de la animación por letra. La última letra (índice 12) termina a los 12 × 27 + 410 = **734 ms** tras el fin del skeleton. |
| Easing | `cubic-bezier(0.16, 1, 0.3, 1)` | Spring suave (overshoot pequeño en el pico de la ola). |
| `animation-fill-mode` | `both` | La letra empieza en `opacity: 0` antes del delay y queda en estado final después. |

#### Colores de letra (cíclicos por índice global)

```ts
const GLOW_COLORS = ['#f6d4c2', '#74bde8', '#67cfcb']; // melocotón · azul · verde
// Índice 0 = 'a', 1 = 'r', 2 = 't', 3 = '.', 4 = 'e', ...
// color = GLOW_COLORS[letterIndex % 3]
```

#### Estado de opacidad pre-animación

```tsx
// Antes de que entranceReady sea true, la letra es invisible (no 'hidden' ni 'display:none')
// para que no ocupe espacio diferente y el layout no salte.
style={!animate ? { opacity: 0 } : undefined}
```

**No usar** `visibility: hidden` ni `display: none` — alteran el layout y producen salto visible.

#### Keyframe `wave-letter-in` (globals.css)

```
0%   → translateY(20px), opacity 0, color primario oscuro, sin sombra
38%  → translateY(-2px)  [pico de ola], color: --glow-color, text-shadow neon triple capa
62%  → translateY(1px)   [rebote], color: --glow-color, sombra reducida
100% → translateY(0),    opacity 1, color primario oscuro, sin sombra
```

La propiedad `animation` va en la **clase CSS** `.glow-wave`, NO en `style=""` inline. Esto es crítico porque inline style tiene mayor especificidad que `:hover` y bloquearía el efecto hover.

#### Hover — interferencia neon (`letter-neon-glitch`)

Al pasar el cursor sobre cualquier letra (solo dispositivos `pointer: fine + hover: hover`):

- **Keyframe:** `letter-neon-glitch` — 9 frames en `steps(1, end)` simulando señal analógica rota.
- **Duración:** 900 ms, loop `infinite` mientras el hover está activo.
- **Salida (mouse-out):** `transition: color 0.8s, text-shadow 0.8s, filter 0.8s` con delay 0.15s para un fade-out suave al color base.
- **Especificidad:** el `:hover` de CSS puede sobreescribir `.glow-wave` porque la animación de entrada está en una clase, no inline.

Frames del glitch (todos con `animation-timing-function: steps(1)`):
```
 0% → neon base estable
10% → chispazo 1 (brightness 1.6, split ±1px)
18% → flicker bajo (brightness 0.55)
28% → split cromático (aberración ±2px, hue-rotate 8°)
38% → apagado parcial (brightness 0.5)
48% → interferencia banda (split ±3px, hue-rotate -6°)
60% → chispazo 2 más notorio (brightness 1.8, split ±1px con blanco)
67% → corte brusco (brightness 0.4, sin sombra)
76% → interferencia ancha (split ±3px, saturate 1.3)
88% → estabilización suave
100%→ neon base (listo para siguiente ciclo)
```

#### Fix de hit-area en "art."

La palabra "art." tiene `mb-[-0.22em]` que causa que el bloque "emmchier." superponga la zona inferior de "art." en el DOM, interceptando eventos de puntero. Solución:

```tsx
<span className="... inline-block relative" style={{ zIndex: 1 }}>
  <GlowText text="art." ... />
</span>
```

`position: relative + z-index: 1` crea un contexto de apilamiento sobre "emmchier.", devolviendo los pointer events al área completa de "art.".

---

### 24.3 Sidebar — `entrance-fade-up` escalonado

**Archivo:** `src/components/ui/sidebar/Sidebar.tsx`

Cada ítem raíz del sidebar (grupos y proyectos sin grupo) anima con fade-up al entrar en la primera carga.

```ts
const entranceStyle: React.CSSProperties = animate
  ? {
      animation: 'entrance-fade-up 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
      animationDelay: `${itemIndex * 80}ms`,
    }
  : {};
```

| Parámetro | Valor | Razón |
|-----------|-------|-------|
| Duración | 500 ms | Ligeramente más lento que navbar/tabs para que el sidebar "aterrice" con más peso. |
| Stagger | 80 ms por ítem | Cascada top-to-bottom suficientemente visible sin resultar lenta. |
| `animation-fill-mode` | `both` | Ítem invisible antes del delay. |

---

### 24.4 Navbar — `entrance-fade-right` escalonado

**Archivo:** `src/components/ui/navbar/Navbar.tsx`

Las categorías de la navbar animan deslizando desde la izquierda hacia su posición final.

```tsx
// Por cada <li> de categoría:
style={animateNavbar ? {
  animation: 'entrance-fade-right 480ms cubic-bezier(0.16, 1, 0.3, 1) both',
  animationDelay: `${navIndex * 55}ms`,
} : undefined}
```

El botón de contacto (móvil y desktop) anima con `entrance-fade-up`:

```tsx
animationDelay: `${displayCollections.length * 55 + 60}ms`
// Espera a que todas las categorías terminen + 60ms de pausa visual.
```

| Parámetro | Valor |
|-----------|-------|
| Keyframe navbar | `entrance-fade-right` — slide desde X: -14px |
| Keyframe contacto | `entrance-fade-up` — slide desde Y: +16px |
| Duración | 480 ms |
| Stagger categorías | 55 ms |
| Delay contacto | `(N categorías × 55) + 60 ms` |

---

### 24.5 Tab labels — `entrance-fade-up` escalonado

**Archivo:** `src/components/ui/tab/Tab.tsx`

Cada `<li>` que envuelve un tab label (Gallery., Making Of., etc.) anima con fade-up en la carga inicial.

```tsx
style={animateTabs ? {
  animation: 'entrance-fade-up 440ms cubic-bezier(0.16, 1, 0.3, 1) both',
  animationDelay: `${100 + index * 70}ms`,
} : undefined}
```

El delay base de 100 ms da espacio para que navbar y sidebar hayan comenzado antes.

---

### 24.6 Project title y description — fade-up con clave dual

**Archivo:** `src/app/[slug]/ProjectPageClient.tsx`

El título del proyecto, el nombre del grupo padre y la descripción animan con `entrance-fade-up`. Hay dos casos que deben manejarse con **claves distintas**:

1. **Carga inicial de la página** — el dato llega de Contentful antes de que el skeleton termine, por lo que sin coordinación la animación se reproduce invisible bajo el skeleton.
2. **Navegación entre ítems** — el usuario cambia de proyecto; la animación debe repetirse.

**Solución — clave dual:**

```ts
const entranceReady = useEntranceAnimation();      // true al terminar el skeleton
const [projectNavKey, setProjectNavKey] = useState(0); // incrementa en cada cambio de slug

// Clave compuesta que dispara el remount en AMBOS casos:
const projectEntranceKey = `${entranceReady ? 'r' : 'h'}-${projectNavKey}`;
```

- **Carga inicial:** clave pasa de `h-1` → `r-1` cuando `entranceReady` cambia a `true` (1500 ms) → remount → animación visible.
- **Navegación:** `entranceReady` ya es `true`; clave pasa de `r-1` → `r-2` → remount → animación visible.

```tsx
<Text key={`title-${projectEntranceKey}`}
  style={{ animation: 'entrance-fade-up 450ms cubic-bezier(0.16, 1, 0.3, 1) both',
           animationDelay: parentGroupName ? '60ms' : '0ms' }}>
  {displayTitle}
</Text>
```

| Elemento | Delay |
|----------|-------|
| Nombre de grupo (`parentGroupName`) | 0 ms |
| Título principal | 60 ms (si hay grupo) / 0 ms (si no) |
| Descripción | 80 ms |

---

### 24.7 Gallery images — `image-color-flash` (destello de color)

**Archivo:** `src/components/ui/image-gallery/ImageGridItem.tsx`

Al cargar la primera tanda de imágenes visibles, cada una hace un breve destello con el color de fondo asignado (`color` prop — ciclo de la paleta de marca). Esto ocurre **solo en el batch inicial** (imágenes visibles en los primeros 500 ms desde el mount del componente), no en imágenes que aparecen al hacer scroll.

**Detección de batch inicial:**

```ts
const [isInitialBatch, setIsInitialBatch] = useState(false);

// Dentro del IntersectionObserver:
const isInitialBatch = elapsed < 500; // tiempo desde mount
setIsInitialBatch(isInitialBatch);
```

**Overlay de color:**

```tsx
<div
  className="absolute inset-0"
  style={{
    backgroundColor: color,
    ...(isInitialBatch && isVisible
      ? { animation: `image-color-flash ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${transitionDelay}ms forwards` }
      : { opacity: 0 }),
  }}
/>
```

**Keyframe `image-color-flash`:**

```
0%   → opacity 0.75  (color visible, imagen detrás empieza a aparecer)
35%  → opacity 0.5   (transición media)
100% → opacity 0     (color desaparece, imagen es 100% visible)
```

`animation-fill-mode: forwards` → el overlay queda en `opacity: 0` al terminar (no "parpadea" de vuelta).

La duración y el delay del flash coinciden con los de la animación de fade-up/slide de la imagen (`duration` y `transitionDelay` del mismo componente), creando una entrada coordinada.

---

### 24.8 Keyframes en `globals.css` — tabla resumen

| Keyframe | Usado en | Duración típica | Notas |
|----------|----------|-----------------|-------|
| `wave-letter-in` | Header letras | 410 ms | Stagger 27 ms/letra via `--wave-delay` |
| `letter-neon-glitch` | Header hover | 900 ms × ∞ | `steps(1, end)` — frames discretos |
| `entrance-fade-up` | Sidebar, Tab labels, Navbar contact, Title/Desc | 440–500 ms | Sube 16px → 0 |
| `entrance-fade-right` | Navbar categorías | 480 ms | Desliza desde X: -14px |
| `image-color-flash` | Gallery image overlay | ~600–720 ms | Solo batch inicial, `fill-mode: forwards` |
| `skeleton-pulse` | Skeleton shimmer | 1.6s × ∞ | Gradiente animado azulado |
| `avatar-tab-coin-spin` | Avatar /contact | 600 ms | Giro 360° coin flip |
| `pixel-in` / `pixel-out` | Language switch | Variable | Bloques cuadrados de transición |

---

## 25. Arquitectura de scroll y footer — Estado canónico (`BASELINE`)

> **Leer completo antes de tocar cualquier layout.** Esta sección documenta el estado funcional estable. Si el usuario dice "volvamos al inicio" o "está todo roto", restaurar exactamente a estos specs.

---

### 25.1 Principio general — window scroll único

**El proyecto usa window scroll para todo.** No hay scroll containers internos en rutas de proyecto. Cualquier `overflow-y-auto` aplicado en divs intermedios ROMPE el patrón de footer sticky y el comportamiento del Tab.

---

### 25.2 Footer sticky — patrón funcional

El footer es sticky (pegado al bottom del viewport cuando el contenido es corto, al final del contenido cuando es largo) gracias a este patrón en `LayoutChrome.tsx`:

```tsx
// src/app/layout.tsx — NO CAMBIAR
<main role="main" className="flex flex-col min-h-screen">
  <LayoutChrome ...>{children}</LayoutChrome>
</main>

// src/components/layout/LayoutChrome.tsx — shell crítico
<div className="flex min-h-0 w-full flex-1 flex-col">
  <div className="flex w-full flex-col min-h-0">{children}</div>
  <Footer />
</div>
```

- El div exterior `flex-1` llena el espacio disponible dentro de `min-h-screen`.
- El div interior `flex w-full flex-col min-h-0` tiene altura natural (sin `flex-1`, sin `min-h-screen`).
- `<Footer />` queda al final del flex column → pegado al bottom cuando hay poco contenido.

**Reglas críticas:**
- ❌ NO poner `flex-1` en el div interior de contenido — haría que siempre llenara el espacio y la galería quedaría estirada.
- ❌ NO duplicar `<Footer />` dentro de `WorkLayoutClient` — el Footer lo renderiza solo LayoutChrome.
- ❌ NO poner `overflow-y-hidden` ni `overflow-y-auto` en el div `flex-1` de LayoutChrome.

---

### 25.3 WorkLayoutClient — `flex w-full min-h-0`

```tsx
// src/app/work/[slug]/WorkLayoutClient.tsx — ESTADO CANÓNICO
<div className="flex w-full min-h-0">
  <div className="hidden min-[1266px]:block ...">  {/* Sidebar */}
  <div className="flex-1 ...">                      {/* Contenido */}
    {children}
  </div>
</div>
```

**Puntos críticos:**
- `flex w-full min-h-0` — **no `min-h-screen`**. El layout raíz (`min-h-screen` en `<main>`) ya garantiza el alto mínimo. Agregar `min-h-screen` aquí fuerza al layout a ser al menos viewport height y empuja el Footer fuera de la pantalla al bottom (requiere scroll para verlo).
- `min-h-0` en el flex row es necesario para que los children flexibles con `overflow` funcionen correctamente.
- No importar `usePathname` ni `useMemo` — no se usan aquí.

---

### 25.4 ProjectPageClient — header siempre visible, Tab sticky clásico

```tsx
// src/app/[slug]/ProjectPageClient.tsx — ESTADO CANÓNICO

// 1. Header emmchier. SIEMPRE visible — NO usar sessionState.navigatedFromSidebar
const hideHeader = false;

// 2. Wrapper del header: padding-top = altura del Navbar (fixed → no ocupa espacio en flow)
<div className="relative w-full pt-[56px] md:max-[1265px]:pt-[48px] min-[1266px]:pt-[72px]">
  <Header className="emmchier" />
</div>

// 3. Tab wrapper: div simple, sin position:sticky, sin height fija
<div className="relative">
  <Tab
    className="w-full"
    desktopBodyMarginTop="16px"
    bodyClasses="overflow-visible"
    headerClasses="sticky top-[56px] md:max-[1265px]:top-[48px] min-[1266px]:top-[72px] z-30 ..."
    ...
  />
</div>
```

**Por qué `hideHeader = false` resuelve el bug de galería bajo el Tab header:**

El bug ocurría solo con `hideHeader = true` (click en Sidebar → sin header emmchier → página casi vacía → muy poco scroll máximo → la galería llegaba detrás del header sticky con 1–2px de scroll).

Con `hideHeader = false` el header emmchier siempre ocupa ~200px de altura. Para proyectos cortos (2 imágenes), el scroll máximo de la página es ≈ 40–60px — insuficiente para que el Tab header llegue a su posición sticky y cubra la galería. El bug desaparece.

Para proyectos largos (muchas imágenes), el Tab header se vuelve sticky normalmente. Las imágenes superiores se scrollean detrás del header — comportamiento estándar de cualquier sitio con navegación sticky; el usuario está scrolleando hacia abajo intencionalmente y ya vio esas imágenes.

**Reglas críticas:**
- ❌ NO cambiar `hideHeader` a `sessionState.navigatedFromSidebar` — ese fue el origen del bug.
- ❌ NO poner el Tab en un div `sticky` con `height: calc(100dvh - Xpx)` — crea scroll interno que rompe el Footer sticky y comprime las imágenes.
- ❌ NO cambiar `bodyClasses="overflow-visible"` a `overflow-y-auto` en la Tab de proyectos — convierte la galería en un scroll container interno.
- ✅ El `pt-[56px]` en el wrapper del header emmchier es obligatorio porque el Navbar es `position: fixed` y no ocupa espacio en el flow del documento.

---

### 25.5 Tab.tsx — props relevantes para el estado canónico

```tsx
interface TabProps {
  bodyClasses?: string;      // default implícito: 'overflow-visible'
  bodyStyle?: CSSProperties; // prop extra — no rompe nada si se pasa undefined
  headerClasses?: string;    // incluir 'top-0' o 'top-[56px]' para desactivar translateY interno en mobile
}
```

El ResizeObserver en Tab mide `headerRef.current?.getBoundingClientRect().height` (altura total del header, no solo del sideContent). Esto es correcto — provee el alto real incluyendo tabs + sideContent.

---

### 25.6 Checklist de restauración ("volvamos al inicio")

Si hay un bug de layout, scroll o footer, verificar en este orden:

| Archivo | Qué verificar | Valor correcto |
|---------|--------------|----------------|
| `WorkLayoutClient.tsx` | Clase del div raíz | `flex w-full min-h-0` |
| `WorkLayoutClient.tsx` | ¿Importa/usa `Footer`? | **No** — Footer solo en LayoutChrome |
| `LayoutChrome.tsx` | Estructura del shell | `flex-1` outer + contenido natural + `<Footer />` (ver §25.2) |
| `LayoutChrome.tsx` | ¿Renderiza `<Footer />` condicionalmente? | **No** — siempre, salvo `isImageRoute` |
| `ProjectPageClient.tsx` | `hideHeader` | `false` siempre |
| `ProjectPageClient.tsx` | `bodyClasses` del Tab | `"overflow-visible"` |
| `ProjectPageClient.tsx` | `headerClasses` del Tab | Incluye `sticky top-[56px] ...` |
| `ProjectPageClient.tsx` | Wrapper del Tab | `<div className="relative">` sin `sticky`, sin `h-[...]` fija |
| `ProjectPageClient.tsx` | Wrapper del header emmchier | Incluye `pt-[56px] md:max-[1265px]:pt-[48px] min-[1266px]:pt-[72px]` |

**Git baseline:** commit `fedddb4` = último estado estable antes de los cambios de scroll. El estado canónico actual (post-fix) es el diff aplicado sobre ese commit.

---

## 26. Ecosistema Resumé — Estado canónico (`BASELINE v1`)

> **"Vamos al origen"** = este es el punto de partida de la primera versión completa de `art.emmchier.com`. Restaurar a este estado si todo está roto.

---

### 26.1 Espacio Contentful separado para Resume

El resume usa un **segundo espacio Contentful** completamente independiente del espacio de galería.

| Variable de entorno | Descripción |
|---------------------|-------------|
| `CONTENTFUL_RESUME_SPACE_ID` | `q5y2ne2ymfu8` — espacio emmchier (resume) |
| `CONTENTFUL_RESUME_DELIVERY_TOKEN` | Token de entrega del espacio resume |
| `CONTENTFUL_SPACE_ID` | Espacio art-emmchier (galería) — sin cambios |
| `CONTENTFUL_DELIVERY_TOKEN` | Token de entrega de la galería — sin cambios |

Estas cuatro variables deben estar configuradas en Vercel → Settings → Environment Variables para los entornos `Production`, `Preview` y `Development`.

---

### 26.2 Modelo de datos Contentful (resume space)

**Una sola llamada** — `getEntries({ content_type: 'resume', include: 5, locale })` — resuelve todo el árbol en un request:

```
resume (1 entry)
  ├── title         (string)
  ├── image         (asset — avatar del perfil)
  ├── roles[]       (string[], máx 3 — alimenta RotatingRoleLine)
  └── sections[]    (refs a Section entries)
        ├── slug    (ResumeSectionSlug: 'work-experience' | 'courses' | 'studies' | 'languages')
        ├── name    (string — label localizado del nav y chip)
        ├── description  (string — el "comment" que aparece debajo del título de sección, e.g. "// what I've been up to")
        └── items[] (refs a workExperience / courses / studies / languages entries)
```

**Reglas críticas:**
- ❌ NO hacer múltiples llamadas a content types individuales (`workExperience`, `courses`, etc.) — todo viene del entry `resume` con `include: 5`.
- ❌ NO hardcodear nombres de secciones, labels del nav ni comments — todo viene de Contentful.
- ✅ Solo las secciones **Published** aparecen (Contentful Delivery API filtra Drafts automáticamente). Si una sección no existe en Contentful, no se muestra en la UI.

---

### 26.3 Locales y sincronización de idioma

El resume respeta el switch de idioma del footer (`EN` / `ES`) con el mismo patrón que las categorías de galería.

| Idioma UI | Locale Contentful | Clave en store |
|-----------|-------------------|----------------|
| `'en'`    | `'en-US'`         | `resumeByLang['en']` |
| `'es'`    | `'es-AR'`         | `resumeByLang['es']` |

**Flujo de carga:**
1. **SSR** (`src/app/layout.tsx`): `fetchResumeData('en-US')` → se pasa como prop a `<ResumeDataManager data={resumeData}>`.
2. **`ResumeDataManager`** (client bridge, sin UI): en `useEffect`, si aún no hay datos en store, llama `setResumeForLang('en', data)` + `setResumeJsonForLang('en', buildResumeJson(data))`.
3. **Al cambiar a español**: `ResumeDataManager` detecta `language === 'es'` y no hay caché → fetch a `/api/contentful/resume?locale=es-AR` → `setResumeForLang('es', data)` + `setResumeJsonForLang('es', buildResumeJson(data))`.
4. **Nunca re-fetchea** el mismo idioma en la misma sesión (guard por presencia en el mapa).

**Archivos clave:**
- `src/lib/contentful-resume.ts` — cliente y `fetchResumeData(locale)`
- `src/app/api/contentful/resume/route.ts` — `GET /api/contentful/resume?locale=...`
- `src/components/data-manager/ResumeDataManager.tsx` — bridge SSR→Zustand

---

### 26.4 Zustand — campos del resume en `useDataStore`

```ts
// Datos de resume localizados
resumeByLang: Partial<Record<SupportedLanguage, ResumeData>>;
setResumeForLang: (lang: SupportedLanguage, data: ResumeData) => void;

// Guard de seeding SSR (evita re-seed en navegación SPA)
isResumeFetched: boolean;
setResumeFetched: (fetched: boolean) => void;

// JSON ATS por idioma (construido cuando llegan los datos de cada locale)
resumeJsonByLang: Partial<Record<SupportedLanguage, ResumeJson>>;
setResumeJsonForLang: (lang: SupportedLanguage, json: ResumeJson) => void;
```

**Leer en componentes:**
```ts
const resumeByLang = useDataStore((s) => s.resumeByLang);
const resumeJsonByLang = useDataStore((s) => s.resumeJsonByLang);
const language = useUIStore((s) => s.language);

// Siempre con fallback a inglés mientras el locale alternativo carga
const resumeData = resumeByLang[language as SupportedLanguage] ?? resumeByLang['en'] ?? null;
const resumeJson = resumeJsonByLang[language as SupportedLanguage] ?? resumeJsonByLang['en'] ?? null;
```

---

### 26.5 ATS PDF — generación dinámica

**No hay PDF estático en Contentful.** El PDF se genera en el cliente con `jsPDF` al hacer click en el botón Download de la pestaña Resumé.

**Archivo:** `src/utils/generate-ats-pdf.ts`

```ts
export async function generateAtsPdf(
  json: ResumeJson,
  language: 'en' | 'es' = 'en'
): Promise<void>
```

- Carga `jsPDF` con **dynamic import** (no penaliza el bundle inicial).
- Formato: A4, single column, Helvetica, fondo blanco — **sin foto** (los ATS penalizan imágenes).
- Estructura: Nombre → Roles → línea de contacto → secciones en CAPS con HR → items con fecha alineada a la derecha.
- Soporte multi-página automático con `checkY`.

**Nombre del archivo según idioma:**

| `language` | Archivo descargado |
|------------|-------------------|
| `'en'`     | `cv-emmanuel-chierchie-english.pdf` |
| `'es'`     | `cv-emmanuel-chierchie-spanish.pdf` |

**JSON model (`ResumeJson`) — construido en `ResumeDataManager` con `buildResumeJson(data)`:**

```ts
interface ResumeJson {
  name: string;            // siempre "Emmanuel Chierchié" (hardcoded, nunca cambia)
  roles: string[];         // de Contentful, localizados
  sections: ResumeJsonSection[];
}
interface ResumeJsonSection {
  name: string;            // de Contentful, localizado
  comment?: string;        // de Contentful, localizado
  items: ResumeJsonItem[];
}
interface ResumeJsonItem {
  role: string;            // name del item
  company?: string;
  dateFrom?: string;       // año extraído de startDate ISO
  dateTo?: string;         // año de endDate ISO o 'Act'
  description?: string;
  techs?: string[];        // solo en workExperience
}
```

**Reglas críticas:**
- ❌ NO guardar PDF en Contentful — es 100% dinámico.
- ❌ NO incluir foto en el ATS PDF — los sistemas ATS ignoran o penalizan imágenes.
- ✅ El JSON se construye **por idioma** al momento que llegan los datos de ese locale; `resumeJsonByLang['en']` y `resumeJsonByLang['es']` son independientes.
- ✅ El botón Download siempre usa `resumeJsonByLang[language] ?? resumeJsonByLang['en']` para respetar el idioma activo.

---

### 26.6 Secciones y URL del nav de Resumé

**URL pattern:** `/contact/resume/[section-slug]`

| Sección Contentful (`slug`) | URL segment | Clave interna UI |
|-----------------------------|-------------|-----------------|
| `work-experience`           | `work-experience` | `'experience'` |
| `courses`                   | `courses`   | `'courses'` |
| `studies`                   | `studies`   | `'studies'` |
| `languages`                 | `languages` | `'languages'` |

**Actualización de URL — cero renders:** `window.history.replaceState` (no `router.replace`) al cambiar de sección activa. Solo se usa `router.replace('/contact')` al abandonar la pestaña Resumé (para sincronizar `usePathname()`).

**Deep-link:** navegar a `/contact/resume/courses` lee el segmento `[3]` del pathname en el `useState` inicial y hace scroll a la sección correcta una vez que los datos están disponibles.

---

### 26.7 Scroll spy y anclas del nav lateral (desktop)

El nav lateral de Resumé usa **window scroll** (no scroll container interno). Dos bugs históricos ya corregidos — **no revertir:**

| Bug | Causa | Fix |
|-----|-------|-----|
| Spy nunca montaba | `getScrollableAncestor` buscaba `overflow-y:auto` pero el proyecto usa window scroll → devolvía `null` → `setup()` abortaba | Reemplazado por `window.addEventListener('scroll', ...)` y métricas de `window.scrollY` / `document.documentElement.scrollHeight` |
| Click tapaba la sección | `scrollIntoView({ block:'start' })` no compensa el sticky header | `window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - getStickyOffset() - 16 })` donde `getStickyOffset()` lee `document.getElementById('contact-sticky-header').getBoundingClientRect().height` |

El `id="contact-sticky-header"` está en el div sticky de la pestaña Resumé mobile (`src/app/contact/[[...slug]]/page.tsx`).

---

### 26.8 Say Hello — items de contacto

Lista actual (en orden de renderizado, grid de 7 slots):

1. Email — `emmchierchie@gmail.com`
2. LinkedIn — `linkedin.com/in/emmchier`
3. Dribbble — `dribbble.com/emmchier`
4. Instagram — `instagram.com/emmchier`
5. Github — `github.com/emmchier`
6. Behance — `behance.net/emmchier`
7. Medium — `medium.com/@emmchier`
8. X — `x.com/emmchier`

Los primeros 7 forman el primer chunk completo (grid `contact-cards-grid`). X queda en el segundo chunk parcial (`contact-cards-grid--partial`):
- **Mobile** (1 columna): X ocupa 100% del ancho.
- **Tablet/Desktop** (2 columnas): X ocupa 50% (columna izquierda). **No agregar `md:col-span-2`** — eso causaría 100% de ancho no deseado.

Los tooltips de los iconos de acción en cada card van con `direction="top"` (para que no se corten por debajo de la card).

---

### 26.9 Checklist de restauración del ecosistema Resumé

| Archivo | Qué verificar | Valor correcto |
|---------|--------------|----------------|
| `src/lib/contentful-resume.ts` | ¿Hace más de una llamada a Contentful? | **No** — solo `getEntries({ content_type: 'resume', include: 5 })` |
| `src/store/data/data-store.ts` | ¿Tiene `resumeByLang` y `resumeJsonByLang`? | **Sí** — ambos `Partial<Record<SupportedLanguage, ...>>` |
| `src/components/data-manager/ResumeDataManager.tsx` | ¿Llama `setResumeJsonForLang` al seeding? | **Sí** — tanto para 'en' (SSR) como para 'es' (fetch) |
| `src/utils/generate-ats-pdf.ts` | ¿Nombre del archivo según idioma? | `cv-emmanuel-chierchie-english.pdf` / `cv-emmanuel-chierchie-spanish.pdf` |
| `src/components/resume/ResumeTabContent.tsx` | ¿Lee `resumeJsonByLang[language]`? | **Sí** — con fallback a `['en']` |
| `src/components/resume/ResumeTabContent.tsx` | ¿Spy usa window scroll? | **Sí** — `window.addEventListener('scroll', ...)` |
| `src/app/contact/[[...slug]]/page.tsx` | ¿El sticky header tiene `id="contact-sticky-header"`? | **Sí** |
| `src/components/ui/card-button/CardButton.tsx` | `direction` del Tooltip | `"top"` |

---

## 27. Punto de origen — `BASELINE v1` (`art.emmchier.com` primera versión completa)

> Cuando el usuario diga **"Vamos al origen"**, este es el estado de referencia. Todo lo que está antes de este punto en el CLAUDE.md es parte del baseline v1.

**Fecha de corte:** 2026-06-06

**Qué está completo en esta versión:**
- ✅ Galería de obras (drawings, paintings, books, sketchs, characters) desde Contentful
- ✅ Making Of por proyecto con Rich Text renderer
- ✅ Navbar con categorías dinámicas + locale EN/ES
- ✅ Sidebar con árbol de navegación
- ✅ Sistema de share (WhatsApp, LinkedIn, Facebook, Instagram, X, Threads, copy link)
- ✅ OG image proxy para share cards en todas las plataformas
- ✅ Página de contacto: Say Hello (8 ítems) + Resumé (desde Contentful)
- ✅ Resumé locale-aware (EN/ES) — datos desde espacio Contentful separado
- ✅ Nav lateral de Resumé con scroll spy funcional (window scroll)
- ✅ ATS PDF descargable dinámicamente en inglés y español
- ✅ Avatar desde Contentful (campo `image` del entry `resume`)
- ✅ Sistema de animaciones de entrada (wave header, fade-up sidebar/navbar/tabs)
- ✅ InvertedCursor en desktop
- ✅ Footer sticky
- ✅ Sistema de skeleton (una sola vez por sesión)
- ✅ URL por sección de Resumé (`/contact/resume/[slug]`) sin re-renders

**Git baseline v1:** el commit de este CLAUDE.md update es el marcador de v1.

---

## 28. Contexto específico — `emmchier.com` (Hub)

> Las secciones 1–27 describen el sistema base heredado de `art.emmchier.com` (stack, design system, componentes, Zustand, Contentful, animaciones). Las secciones 28 en adelante documentan lo específico del Hub.

### 28.1 Propósito del Hub

`emmchier.com` es un **nexo de entrada** al ecosistema de Emmanuel Chierchié. No aloja portfolio propio — su función es presentar al autor y enlazar a:

- **[art.emmchier.com](https://art.emmchier.com)** — portfolio de ilustración y arte digital
- **[design.emmchier.com](https://design.emmchier.com)** — portfolio UX/UI Designer + UI Developer

La home tiene tres tabs:
- **Sites** — cards de art y design (navegación a los subdominios)
- **Contact** — grid de tarjetas de contacto (email, redes)
- **Resumé** — CV completo con scroll spy + PDF descargable

### 28.2 Sites tab — card de Design habilitada

La card de `design.emmchier.com` estaba en estado `disabled` con badge "Coming Soon". A partir de la versión actual está **habilitada**:

```tsx
// HubHomePage.tsx — Col 3 — design.emmchier.com
<RoleCard
  ariaLabel="Visit design.emmchier.com"
  url="design.emmchier.com"
  title="design."
  colorTitle="#74BDE8"      // Blue — color primario del sitio design
  link="https://design.emmchier.com"
  description={t.sitesDesignDescription}
  state="enabled"           // antes: "disabled"
  // comingSoonLabel eliminado
/>
```

**Reglas:**
- ❌ No volver a poner `state="disabled"` o `comingSoonLabel` — la card ya es navegable.
- ✅ `colorTitle="#74BDE8"` — el azul del design site, no el peach original.

### 28.3 Color primario — Blue `#74BDE8`

El color de acento del Hub es el **Blue** `#74BDE8`. Es el mismo que usa `design.emmchier.com` como primary. En el Hub, este blue aparece en:
- Focus ring (`:focus-visible` en globals.css)
- Skip to content link
- Header animation glow (ver §29.2)
- Card de Design en Sites tab

---

## 29. Accesibilidad — patrones implementados (`emmchier.com`)

> Leer antes de modificar `Tab`, `HubHomePage`, `globals.css` o cualquier componente interactivo del Hub.

### 29.1 Focus ring global — color Blue (`#74BDE8`)

**Archivo:** `src/app/globals.css`

```css
/* Base — outline transparente con transición en todos los interactivos */
a, button, [tabindex='0'] {
  outline: 3px solid transparent;
  outline-offset: -3px;
  transition: outline-color 180ms ease;
}

/* Focus ring — 3px blue (#74BDE8), inset, sin border-radius */
:focus-visible {
  outline: 3px solid #74bde8;
  outline-offset: -3px;
  border-radius: 0;
}

:focus:not(:focus-visible) { outline: none; }

/* Clase para botones con contenido superpuesto (card buttons) */
.card-focus-btn:focus-visible { outline: none; }
.card-focus-btn:focus-visible::after {
  content: ''; position: absolute; inset: 0;
  box-shadow: inset 0 0 0 3px #74bde8;
  pointer-events: none; z-index: 1;
}
```

**Colores por proyecto:**

| Proyecto | Color focus ring | Token |
|----------|-----------------|-------|
| art.emmchier.com | `#F6D4C2` | Peach |
| design.emmchier.com | `#67CFCB` | Green |
| emmchier.com (Hub) | `#74BDE8` | Blue |

### 29.2 Skip to content link

**Archivo:** `src/app/layout.tsx`

```tsx
<a href="#main-content" className="skip-to-content">
  Skip to content
</a>
<main id="main-content" role="main" className="flex flex-col min-h-screen">
```

Visualmente oculto hasta focus. Al recibir focus aparece en esquina superior izquierda con fondo `#112f40` y borde/texto azul `#74BDE8`.

### 29.3 Tab keyboard navigation — `role`, `aria-label`, arrow keys

**Archivo:** `src/components/ui/tab/Tab.tsx`

Igual que en Art y Design, el Tab implementa el patrón WAI-ARIA tablist/tab/tabpanel:

- `uid = useId()` — IDs únicos para el par tab/panel
- `tabButtonRefs` — permite mover focus programáticamente con arrow keys
- `handleTabChange(index, moveFocus)` — parámetro `moveFocus` para keyboard nav
- `handleTabKeyDown` — ArrowLeft/Right/Up/Down, Home, End
- `<ul role="tablist" aria-label="Content tabs">`
- `<li role="presentation" ref={...}>` — captura el button hijo para refs
- `<Button role="tab" tabIndex={0} onKeyDown={handleTabKeyDown}>`
- `<div role="tabpanel" id={...} aria-labelledby={...}>` en el body

**El Hub tiene 3 tabs: Sites, Contact, Resumé.** El keyboard nav entre ellos sigue el mismo patrón circular: ArrowRight en último tab → primer tab.

### 29.4 `ButtonProps` — extensiones

**Archivo:** `src/components/ui/button/Button.tsx`

```ts
onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
role?: string;
```

Pasadas directamente al `<button>` nativo.

### 29.5 Checklist de mantenimiento

- ✅ Todo `<svg>` decorativo → `aria-hidden="true"`
- ✅ Todo `iconButton` → `ariaLabel` descriptivo
- ✅ Tab activo → `aria-current="true"` (si aplica en filtros)
- ✅ Arrow keys en Tab → `handleTabKeyDown` con wrap circular
- ❌ No usar `role="tab"` fuera de `Tab.tsx`
- ❌ No usar `div[onClick]` — siempre `<button>` o `<a>`
- ❌ No usar `disabled` HTML en elementos que deben ser anunciados por AT

---

## 30. Header — animación wave con Blue palette

**Archivo:** `src/components/header/Header.tsx`

```ts
const GLOW_COLORS = ['#74bde8', '#55a7d8', '#67cfcb'] as const;
```

El Hub usa una **paleta toda fría** para la animación de letras:
- `#74bde8` — Blue principal (color index 0, 3, 6, 9, 12 → a, ., e, m, i)
- `#55a7d8` — Blue medio (índice 1, 4, 7, 10 → r, m, c, e)
- `#67cfcb` — Teal (índice 2, 5, 8, 11 → t, c, h, r)

**Antes:** `['#f6d4c2', '#74bde8', '#67cfcb']` — peach como color dominante.
**Ahora:** todo blue/teal, coherente con el primary del Hub.

**Reglas:**
- ❌ No volver a poner `#f6d4c2` (peach) en Hub — es el color de Art, no del Hub.
- ✅ Si se agrega un cuarto color de glow, mantener la familia blue/teal.
- ✅ El comportamiento de la ola (stagger, duración, hover glitch) no cambia — solo los colores.

---

## 31. Legales — `emmchier.com` como Hub

**Archivo:** `src/i18n/legals.json`

La versión anterior de los legales hacía referencia a "art portfolio, design portfolio, CV" como si el Hub alojara ese contenido. El documento fue reescrito (2026-06-09) para reflejar correctamente que el Hub es un nexo:

**Estructura actualizada (10 secciones):**

| # | Sección | Cambio vs. versión anterior |
|---|---------|----------------------------|
| 1 | Site Owner | Aclara que el Hub no aloja contenido de portfolio — enlaza a art y design |
| 2 | Intellectual Property | Refiere a los subdominios para IP de obras; Hub solo protege branding/identidad |
| 3 | Scraping / AI | Sin cambios de fondo |
| 4 | External Links | **Nueva sección** — explica responsabilidad limitada sobre subdominios y perfiles externos |
| 5 | Use of the Website | Antes sección 4 |
| 6 | Cookies and Analytics | Agrega GTM-P5KL5JZM explícito y link a `policies.google.com/privacy` |
| 7 | Personal Data | Agrega cláusula de no sharing/venta de datos |
| 8 | Disclaimer | **Nueva sección** — buena fe, sin garantías de exactitud |
| 9 | Applicable Law | Antes sección 8 |
| 10 | Acceptance | Antes sección 9 |

**Cláusula clave §1 (Hub como nexo):**
> *"This site acts exclusively as a personal hub and entry point... It does not host portfolio content directly — instead, it links to two independent sub-domain sites."*

**Cláusula clave §2 (IP en subdominios):**
> *"The artistic and design works... are published on their respective sub-domain sites... Please refer to each site's legal notice for the specific terms."*

**Reglas de mantenimiento:**
- ✅ Actualizar `lastUpdated` en ambos idiomas al modificar
- ✅ Mantener EN y ES en sincronía
- ❌ No referenciar "art portfolio" o "design portfolio" como contenido del Hub — el Hub no aloja obras
- ❌ No agregar secciones sin actualizar ambos idiomas

---

## 32. Pulido UI sincronizado desde Design (2026-06-12)

> Ajustes portados desde `design-emmchier` para mantener paridad de plataforma. No regresar.

### 32.1 Legales — links navegables (`linkify`)

**`src/app/legals/page.tsx`**: helper `linkify(text)` que convierte en `<a target="_blank" rel="noopener noreferrer">` toda mención de `policies.google.com/privacy`, `design.emmchier.com`, `art.emmchier.com` y `emmchier.com` en párrafos, listas, `paragraphsAfterList` y la línea de `siteUrl`. Targets más largos primero en `LINKIFY_TARGETS` (los subdominios contienen `emmchier.com` como substring). El back button del Hub sigue siendo `fixed top-[16px]` — el Hub no tiene navbar fija, NO aplicar el patrón de medición de header de Art/Design.

### 32.2 Footer — "Legales" selected no clickeable

En `/legals`, el link "Legales" se reemplaza por `<span aria-current="page" className="... text-selected-text cursor-default">`. **Regla de plataforma: todo estado selected no es interactivo.**

### 32.3 Tooltip — wrapping multi-línea y regla desktop-only

- Estilo: `width: max-content; maxWidth: 200px; whiteSpace: normal; wordBreak: break-word` (antes `nowrap` + ellipsis truncaba contenidos largos).
- **Desktop-only en toda la plataforma:** `if (!isDesktop || isTabletOrBelow) return children` — nunca tooltips ni eventos hover decorativos en tablet/mobile.
- El icon button Share del Resumé (desktop) lleva `<Tooltip content={Share/Compartir} direction="bottom">`.
