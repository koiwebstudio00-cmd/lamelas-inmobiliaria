# Design System — Inmobiliaria Lamelas

Basado en el logo: isotipo de edificio isométrico en verde sobre blanco. Identidad limpia, geométrica y de alto contraste.

## 1. Principios

- **Verde como acento, no como fondo.** El verde del logo se usa en acciones primarias, links y estados activos. Superficies blancas/neutras, como el logo.
- **Geometría limpia y angular:** bordes rectos (sin radios), como las aristas del isotipo; sin sombras pesadas ni degradados.
- **Mobile-first y funcional:** targets táctiles ≥ 44px, jerarquía clara, cero decoración innecesaria.

## 2. Librerías (regla obligatoria)

- **shadcn/ui es la ÚNICA librería de componentes.** No instalar MUI, Chakra, Radix directo, HeadlessUI, DaisyUI ni similares. Si falta un componente, componerlo a partir de primitivas shadcn/ui + Tailwind.
- **lucide-react es la ÚNICA librería de íconos.** No usar heroicons, react-icons, FontAwesome ni SVGs ad-hoc (excepto el logo).

## 3. Color

Verde del logo: **`#0E9145`** (primario).

### Paleta

| Token | Hex | Uso |
|---|---|---|
| `green-50` | `#EBF7EF` | fondos sutiles de acento, hover de items |
| `green-100` | `#D2EEDD` | badges suaves, selección |
| `green-500` | `#12A853` | hover de primario |
| `green-600` | `#0E9145` | **primario** — botones, links, focus, logo |
| `green-700` | `#0B7438` | active/pressed |
| `green-900` | `#07481F` | texto sobre fondos verdes claros |
| `neutral-0` | `#FFFFFF` | fondo principal |
| `neutral-50` | `#F7F8F7` | fondo secundario (páginas, tablas) |
| `neutral-200` | `#E4E7E4` | bordes, separadores |
| `neutral-500` | `#6B7570` | texto secundario |
| `neutral-900` | `#171D19` | texto principal |

### Semánticos

| Uso | Color |
|---|---|
| Éxito | `green-600` (mismo primario) |
| Error / destructivo | `#DC2626` |
| Advertencia | `#D97706` |
| Info | `#2563EB` |

### Estados de propiedad (badges)

| Estado | Fondo | Texto |
|---|---|---|
| Disponible | verde `green-100` | `green-900` |
| Reservada | amarillo `#FEF3C7` | `#92400E` |
| Vendida | azul `#DBEAFE` | `#1E40AF` |

### Variables CSS (shadcn/ui — `globals.css`)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 150 12% 10%;
  --card: 0 0% 100%;
  --card-foreground: 150 12% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 150 12% 10%;
  --primary: 145 82% 31%;            /* #0E9145 */
  --primary-foreground: 0 0% 100%;
  --secondary: 140 20% 96%;
  --secondary-foreground: 150 12% 10%;
  --muted: 140 12% 96%;
  --muted-foreground: 150 5% 44%;
  --accent: 145 45% 94%;             /* green-50 */
  --accent-foreground: 145 82% 15%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  --border: 140 6% 90%;
  --input: 140 6% 90%;
  --ring: 145 82% 31%;
  --radius: 0rem;               /* bordes rectos en toda la UI */
}
```

Modo oscuro: fuera de alcance del MVP.

## 4. Tipografía

- **Familia:** Inter (`next/font`), fallback `system-ui`. Una sola familia.
- **Escala:**

| Rol | Tamaño / peso | Uso |
|---|---|---|
| `h1` | 24px / semibold | título de página |
| `h2` | 20px / semibold | secciones |
| `h3` | 16px / semibold | cards, títulos de propiedad |
| `body` | 16px / regular | texto general, inputs (16px evita zoom en iOS) |
| `small` | 14px / regular | texto secundario, metadata |
| `caption` | 12px / medium | badges, labels |

- **Precios:** semibold, `tabular-nums`. Formato `USD 120.000` / `ARS 350.000` (punto de miles, sin decimales).

## 5. Espaciado, radios y elevación

- Escala de espaciado Tailwind default; base de layout: `p-4` móvil, `p-6` desktop.
- **Bordes rectos en toda la UI:** `--radius: 0rem`; no usar clases `rounded-*` (equivalen a `rounded-none`). Aplica a cards, botones, inputs y badges. Única excepción: avatares (`rounded-full`).
- Elevación: `shadow-sm` en cards, `shadow-md` máximo (dropdowns/modals). Preferir bordes (`border-neutral-200`) sobre sombras.
- Contenedor máximo: `max-w-6xl` centrado.

## 6. Componentes (recetas shadcn/ui)

| Elemento | Componente shadcn/ui | Notas |
|---|---|---|
| Botón primario | `Button` default | verde primario; uno por vista |
| Botón secundario | `Button variant="outline"` | acciones alternativas |
| Destructivo | `Button variant="destructive"` | eliminar, siempre con `AlertDialog` |
| Card de propiedad | `Card` | portada 4:3 arriba, título, precio, `Badge` de estado, vendedor |
| Formularios | `Form` + `Input`, `Select`, `Textarea`, `Label` | validación Zod, errores debajo del campo |
| Estado | `Badge` | colores de la tabla §3 |
| Confirmaciones | `AlertDialog` | eliminar propiedad/foto |
| Feedback | `Sonner` (toast) | éxito/error de mutations |
| Filtros | `Select` + `Input` de búsqueda | en toolbar sticky en móvil |
| Navegación móvil | `Sheet` | menú lateral |
| Carga | `Skeleton` | listados y detalle |

### Íconos (lucide-react)

Tamaño default 20px (16px en botones/badges), `strokeWidth={2}`. Set base sugerido: `Building2` (propiedades), `Plus`, `Pencil`, `Trash2`, `Camera`/`ImagePlus` (fotos), `Star` (portada), `Search`, `SlidersHorizontal` (filtros), `MapPin`, `BedDouble`, `Bath`, `Ruler` (superficie), `StickyNote` (notas), `LogOut`, `User`, `Eye`, `CircleDollarSign`.

## 7. Uso del logo

- Isotipo sobre blanco o `neutral-50`; nunca sobre verde ni sobre fotos.
- Tamaño mínimo 32px. Zona de respeto: 25% del ancho del isotipo.
- En el nav: isotipo 32px + "Lamelas" en `h3` color `neutral-900`.

## 8. Accesibilidad

- Contraste AA mínimo: verde primario `#0E9145` sobre blanco pasa para texto ≥ 18px y componentes UI; para texto chico usar `green-700`.
- Focus visible siempre (`ring` verde), targets táctiles ≥ 44×44px, labels explícitos en todos los inputs.
