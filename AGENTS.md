# AGENTS.md

Guía para agentes de código (Cursor, Codex, Copilot, etc.) trabajando en este repo. Claude Code usa `CLAUDE.md` (mismo contenido esencial).

## Qué es este proyecto

Panel **interno** de Inmobiliaria Lamelas: los vendedores cargan y gestionan propiedades con fotos. Lo que se publica acá aparece en el sitio público `lamelas-web` (repo `../lamelas-web`).

Ya **no usa Supabase**: datos, sesión y fotos viven en el backend propio `back-lamelas` (repo `../back-lamelas`). Los documentos de `docs/` describen el MVP original sobre Supabase — valen como historia del producto, no como referencia técnica. La fuente de verdad es `../back-lamelas/docs/api.md` y `../back-lamelas/src/modules/`.

## Stack

Next.js 16 App Router + TypeScript · React 19 · Tailwind + shadcn/ui · Zod · API propia (`back-lamelas`).

## Setup y comandos

```bash
npm install
cp .env.example .env.local   # API_URL apuntando a back-lamelas
npm run dev                  # requiere back-lamelas corriendo

# validación (correr antes de terminar cualquier tarea):
npm run lint && npx tsc --noEmit && npm run build
```

## Integración con back-lamelas

- **Next es intermediario (BFF): el navegador nunca habla con la API.** Las cookies de sesión son `httpOnly` y `sameSite=lax`; solo el servidor de Next las reenvía. Todo sale de un Server Component, una Server Action o el middleware.
- **Transporte:** `src/lib/api.ts` (`apiFetch`, `startSession`, `endSession`, `getCurrentUser`) — reenvía cookies, manda `X-CSRF-Token` en los métodos que mutan y normaliza errores en `ApiError`. Ningún otro archivo llama a la API.
- **Sesión:** `middleware.ts` renueva el access token (es el único lugar que siempre puede escribir cookies). El refresh **rota** el token: `apiFetch` solo reintenta si puede persistir las cookies nuevas.
- **Capa de adaptación obligatoria:** ningún componente conoce el formato de la API. `src/lib/queries.ts` traduce camelCase → snake_case y los `numeric` que viajan como string. Si cambia la API, se toca solo ese archivo.
- **Fotos:** URL firmada de R2 (`presign` → `PUT` desde el browser → `confirm`), en `src/lib/upload-photos.ts` y `src/actions/images.ts`. R2 es el único destino externo que toca el navegador, porque no usa cookies. La API asigna orden y portada y borra el objeto en R2.
- **Imágenes:** la API devuelve la URL absoluta ya resuelta; `imageUrl()` es identidad. El host de R2 está en `remotePatterns` de `next.config.ts`.
- **Alta de propiedad en dos pasos** (`POST` con lo obligatorio + `PATCH` con el resto): la API separa el alta rápida. Ver `src/actions/properties.ts`.
- **Sin auto-registro:** un admin invita y la persona entra por `/aceptar-invitacion?token=`.

## Convenciones

- Rutas en `src/app/`: grupo `(auth)` público, grupo `(app)` protegido por `middleware.ts`.
- Mutations únicamente vía Server Actions en `src/actions/`, validadas con Zod (`src/lib/validations/`). Lecturas en Server Components a través de `src/lib/queries.ts`.
- Código en inglés; UI en español (Argentina); campos de la API en español (no renombrar).
- Componentes compartidos en `src/components/` (ahí está `pagination.tsx`, que usan propiedades y consultas); los de cada sección en `src/components/{properties,leads,team,settings,nav}/`.
- Acciones por dominio: `src/actions/{auth,properties,images,profile,leads,team,api-keys}.ts`.

### Mapa de pantallas (todas dentro de `(app)`)

| Ruta | Qué es |
| --- | --- |
| `/` | Inicio: contadores que linkean a listados filtrados + últimas consultas y propiedades (`getResumen()`). |
| `/propiedades`, `/mis-propiedades`, `/propiedades/[id]`, `/propiedades/nueva` | Catálogo interno y alta/edición. |
| `/consultas`, `/consultas/[id]`, `/consultas/nueva` | Bandeja de leads: filtros, cambio de estado, reasignación y notas internas. |
| `/equipo` | Usuarios e invitaciones (solo admin). |
| `/configuracion` | API keys del sitio público (solo admin). |
| `/perfil` | Datos de la propia cuenta. |

- **El inicio es `/`**: no hay redirect a `/propiedades`. Login, alta por invitación y middleware mandan a la raíz.
- Las pantallas de admin hacen `redirect("/")` si el rol no alcanza. Es cosmética —la API rechaza igual—: solo evita mostrar una pantalla de error.
- `src/app/not-found.tsx` cubre 404 y 403: si el recurso no le corresponde al usuario, `queries.ts` devuelve `null` y la página llama a `notFound()`, para no delatar qué hay del otro lado.
- Navegación en `src/components/nav/app-nav.tsx`: bloque `sidebar-03` de shadcn (`components/ui/sidebar.tsx` + `sheet`, `tooltip`, `separator`, copiados del registro). Barra fija en escritorio, `Sheet` en móvil, submenús en Propiedades y Consultas. `(app)/layout.tsx` la envuelve en `SidebarProvider` (lee la cookie `sidebar_state` en el server) + `SidebarInset`.
- Los componentes de `components/ui/` que vienen del registro de shadcn **no se editan a mano** para ajustar estilos: componer arriba. Los radios ya están en cero globalmente (`--radius-*: 0` en `globals.css`) y el cajón usa `@keyframes` propios porque `tw-animate-css` no está instalado.
- **shadcn/ui es la única librería de componentes; lucide-react la única de íconos.** No instalar otras (MUI, Chakra, heroicons, react-icons, etc.).
- Tokens de diseño en `docs/design-system.md`; primario verde `#0E9145`.

## Reglas de seguridad

- **La autorización real está en la API (RLS en Postgres).** Los checks de UI son cosmética; todo cambio de permisos se hace en `back-lamelas`.
- **Nada de credenciales en código cliente.** La sesión es por cookie `httpOnly`; el bundle no lleva claves.
- Regla de negocio central: cualquier usuario autenticado **lee** todo el tenant; el vendedor **modifica/elimina** solo sus propiedades, y el **admin modifica/elimina todas** las del tenant. La RLS ya lo permite; el panel gatea la UI con `isOwner || esAdmin` (ver `propiedades/[id]/page.tsx` y `.../editar/page.tsx`).

## Reglas de producto

- Campos obligatorios de propiedad: título, operación, tipo, precio. Todo lo demás (incl. `notas`, campos de alquiler y mapa) es opcional. Los enums `tipo`/`estado` están ampliados; las de alquiler tienen destino/plazo/ajuste/índice/expensas/mascotas/amoblado + mapa Leaflet (`lat`/`lng`/`link_maps`).
- Consultas: cada lead tiene `clasificacion` (potencial/fantasma) — la pone el agente al conversar y el vendedor la corrige; hay filtro y contadores (admin) en `/consultas`.
- Fotos: resize client-side a máx. 1600px en WebP, límite 20 por propiedad, una sola portada.
- Mobile-first: verificar formularios y subida de fotos en viewport móvil.
- La bandeja de consultas, el equipo y las API keys ya están hechos. No agregar alcance nuevo (métricas, webhooks, suspensión de tenants) sin pedido explícito.

## Definition of Done

Lint + typecheck + build sin errores; criterios de aceptación de la historia cumplidos (`docs/historias-usuario.md`); si se tocó acceso a datos, probar con un segundo usuario contra `back-lamelas` corriendo.
