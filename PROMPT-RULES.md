# PROMPT-RULES.md — Reglas de oro para agentes IA

> Estas reglas son **obligatorias** en cada iteración de trabajo sobre este proyecto.  
> No son sugerencias. Son leyes. Cumplirlas es innegociable.

---

## 1. Scope estricto — solo lo que se pide

**Realiza únicamente lo que se especifica en el prompt.**  
No toques ningún archivo, componente, estilo o comportamiento que no esté directamente relacionado con lo pedido.  
Si detectás algo que podría mejorarse fuera del scope, mencionalo — pero no lo cambies.

---

## 2. Ley de breakpoints — aislamiento total

**Si el cambio se especifica para un breakpoint en particular, se aplica SOLO en ese breakpoint.**

| Breakpoint | Rango |
|------------|-------|
| Mobile     | `< 768px` |
| Tablet     | `768px – 1265px` |
| Desktop    | `≥ 1266px` |

- Si el prompt dice "en mobile" → solo mobile. Tablet y desktop no se tocan.
- Si el prompt dice "en tablet" → solo tablet. Mobile y desktop no se tocan.
- Si el prompt dice "en desktop" → solo desktop. Mobile y tablet no se tocan.
- Solo si el prompt menciona explícitamente 2 o 3 breakpoints se aplica el cambio en esos breakpoints específicos.

**Esta ley no admite excepciones salvo indicación explícita.**

---

## 3. Patrón ON DEMAND — Regla absoluta de fetching con Contentful

> **🔴 PREMISA DE ORO — Leer esta sección completa antes de escribir una sola línea de fetch.**  
> Cualquier cambio que involucre la API de Contentful (fetch, store, cache, categorías, resume, navbar, sidebar) **NUNCA** debe romper este patrón. Cuando el usuario diga "debe cumplir con el patrón ON DEMAND", significa releer esto desde el principio y verificar que el cambio respeta el flujo cache-first. Violar este patrón degrada el performance y genera llamadas innecesarias a la API de Contentful.

### Principio

El sitio usa un patrón **cache-first / on-demand**: los datos se piden a Contentful la primera vez que se necesitan y se guardan en el Zustand store (`useDataStore`). Las navegaciones posteriores leen del store — **nunca** vuelven a fetchear algo que ya está en memoria.

### Reglas concretas

| Situación | Comportamiento correcto |
|-----------|------------------------|
| Primera carga (page load / refresh) | SSR fetcha datos iniciales + navbar. Queda en store. |
| Navegar entre secciones ya cargadas | **Cero fetches.** Toda la info ya está en el store. |
| Acceder a datos nuevos (no en store) | Fetch a Contentful → guardar en store. |
| Volver a datos ya visitados | **Cero fetches.** Ya está en store → usar directamente. |
| Cambiar idioma (EN ↔ ES) | Fetch del locale alternativo solo si no está cacheado. |
| Cambiar idioma volviendo al original | **Cero fetches.** Ya en cache. |

### Implementación canónica (cache-first)

```ts
const cached = getCategoryForLang(language, slug);
if (cached) {
  if (cached !== current) setCurrent(cached);
  return; // ← NUNCA fetchear si ya está en store
}
// Solo aquí → fetch desde Contentful y guardar en store
```

### ❌ Prohibido

- ❌ **NUNCA** hacer fetch incondicional en un `useEffect` sin verificar el cache primero.
- ❌ **NUNCA** incluir colecciones completas del store en los deps de un effect de fetch.
- ❌ **NUNCA** agregar funciones estables del store a los deps del effect.
- ❌ **NUNCA** bypassear el cache para "asegurar datos frescos".

---

## 4. Estados de color — Design System

### Estado Selected
- Color: **`#E5E5E5`** (blanco de la paleta)
- Variable: `--color-selected-text` / clase `text-selected-text`

### Estado Focus (navegación por teclado)
- Color: **`#DF95A8`** (magenta — exclusivo para focus rings)
- Variable: `--color-focus`
- Solo visible en desktop (`pointer: fine + hover: hover`). Nunca en mobile/tablet.

### Estado Default (body, textos generales)
- Color: **`#74BDE8`** (azul claro de la paleta)
- Variable: `--color-primary-text` / clase `text-primary-text`

### Color primario de acciones y links — por proyecto

| Proyecto | Color | Variable |
|----------|-------|----------|
| **Art** (`art.emmchier.com`) | `#F6D4C2` (peach) | `--color-activated-text` |
| **Design** (`design.emmchier.com`) | `#67CFCB` (verde agua) | `--color-activated-text` |
| **Hub** (`emmchier.com`) | `#74BDE8` (azul) | `--color-primary-text` |

---

## 5. Verificación antes de mergear

1. ¿El cambio toca solo lo que se pidió?
2. ¿El breakpoint modificado es exactamente el especificado?
3. ¿Algún fetch nuevo respeta el patrón ON DEMAND?
4. ¿Los colores de estado son los correctos del design system?
