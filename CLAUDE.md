# CLAUDE.md

Contexto para Claude Code al trabajar en este repo.

## Proyecto

Panel **interno** de Inmobiliaria Lamelas: los vendedores cargan y gestionan propiedades con fotos. Lo que se publica acá aparece en el sitio público `lamelas-web` (repo `../lamelas-web`).

Ya **no usa Supabase**. Todos los datos, la sesión y las fotos viven en el backend propio `back-lamelas` (repo `../back-lamelas`). Los documentos de `docs/` describen el MVP original sobre Supabase: valen como historia del producto, no como referencia técnica actual. La fuente de verdad técnica es `../back-lamelas/docs/api.md` y `../back-lamelas/src/modules/`.

## Stack

Next.js 16 (App Router, TypeScript) · React 19 · Tailwind + shadcn/ui · Zod · API propia (`back-lamelas`).

## Comandos

```bash
npm run dev          # desarrollo (puerto 3000)
npm run build        # build de producción (correr antes de dar por terminado)
npm run lint         # ESLint
npx tsc --noEmit     # chequeo de tipos
```

Requiere `back-lamelas` corriendo en `API_URL` (por defecto `http://localhost:3001`).

## Integración con back-lamelas

1. **Next es intermediario (BFF): el navegador nunca habla con la API.** Las cookies de sesión son `sameSite=lax` y `httpOnly`, así que solo el servidor de Next las puede reenviar. Toda llamada sale de un Server Component, una Server Action o el middleware.
2. **Transporte:** `src/lib/api.ts` (`apiFetch`, `startSession`, `endSession`, `getCurrentUser`). Reenvía las cookies del usuario, manda el header `X-CSRF-Token` en los métodos que mutan y traduce el error de la API a `ApiError`. Nada más habla con la API directamente.
3. **Sesión:** el `middleware.ts` es el que renueva el access token (es el único lugar que siempre puede escribir cookies). `apiFetch` reintenta un refresh solo si el contexto puede persistir las cookies nuevas: el refresh **rota** el token y guardar mal el nuevo cierra la sesión.
4. **Adaptación obligatoria:** ningún componente ve el formato de la API. `src/lib/queries.ts` traduce camelCase → snake_case y los `numeric` que viajan como string. Si cambia la API, se toca solo ese archivo.
5. **Fotos:** subida directa a Cloudflare R2 con URL firmada. `src/lib/upload-photos.ts` pide las URLs (`presign`), el navegador hace el `PUT` a R2 —el único destino externo que toca el browser, porque R2 no usa cookies— y después se confirman (`confirm`). La API asigna orden y portada, y al borrar limpia el objeto en R2.
6. **Imágenes:** la API devuelve la **URL absoluta** ya resuelta. `imageUrl()` quedó como identidad para no tocar los componentes. El host de R2 está en `remotePatterns` de `next.config.ts`.
7. **Altas:** el alta de propiedad es en dos pasos (`POST` con lo obligatorio + `PATCH` con el resto), porque la API separa el alta rápida. Ver `src/actions/properties.ts`.
8. **Invitaciones:** no hay auto-registro. Un admin invita y la persona entra por `/aceptar-invitacion?token=`.

## Reglas del proyecto

1. **La autorización vive en la API (RLS en Postgres).** Los checks de UI son cosmética: nunca asumir que alcanzan.
2. **Mutations solo por Server Actions** en `src/actions/`, siempre validadas con Zod (schemas en `src/lib/validations/`). Lecturas en Server Components vía `src/lib/queries.ts`.
3. **Nada de credenciales de la API en código cliente.** No hay claves en el bundle: la sesión es por cookie.
4. **Fotos:** resize client-side (máx. 1600px, WebP) antes de subir, máx. 20 por propiedad, una sola portada.
5. **Campos obligatorios de propiedad:** solo título, operación, tipo, precio. El resto (incl. `notas`, campos de alquiler y mapa) es opcional — no agregar `required` de más. Los enums `tipo` y `estado` están ampliados y las propiedades de alquiler tienen campos propios (destino, plazo, ajuste, índice, expensas, mascotas, amoblado) + mapa Leaflet (`lat`/`lng`/`link_maps`); labels en `src/lib/types.ts`. El **admin gestiona (edita/elimina/cambia estado) todas** las propiedades del tenant, no solo las propias (gate de UI = `isOwner || esAdmin`).
6. **Mobile-first.** Los vendedores cargan desde el celular; probar todo formulario en viewport móvil.
7. **shadcn/ui es la única librería de componentes y lucide-react la única de íconos.** No instalar otras; si falta un componente, componerlo con primitivas shadcn/ui + Tailwind. Colores y tokens según `docs/design-system.md` (primario verde `#0E9145`).
8. UI y textos en **español (Argentina)**. Código (variables, funciones) en inglés; los campos de la API están en español — respetarlos.

## Estructura

Rutas en `src/app/` con grupos `(auth)` (público) y `(app)` (protegido por `middleware.ts`), acciones en `src/actions/`, acceso a datos en `src/lib/api.ts` (transporte) y `src/lib/queries.ts` (consultas + adaptación), tipos del dominio en `src/lib/types.ts`.

Secciones del panel, todas dentro de `(app)`:

| Ruta | Qué es |
| --- | --- |
| `/` | Inicio: saludo, cuatro contadores que linkean a listados filtrados, últimas consultas y últimas propiedades. Se arma con `getResumen()`. |
| `/propiedades`, `/mis-propiedades`, `/propiedades/[id]`, `/propiedades/nueva` | Catálogo interno y alta/edición. Filtros incl. **dormitorios**. Form con sección de alquiler condicional + mapa Leaflet. El admin edita/elimina cualquier propiedad del tenant. |
| `/consultas`, `/consultas/[id]`, `/consultas/nueva` | Bandeja de leads: filtros por texto, estado, canal, **clasificación** y vendedor; contadores potencial/fantasma (admin); detalle con cambio de estado, **clasificación** (potencial/fantasma), reasignación y notas internas. |
| `/equipo` | Usuarios e invitaciones (solo admin). |
| `/configuracion` | API keys del sitio público (solo admin). |
| `/perfil` | Datos de la propia cuenta. |

Notas de estructura que conviene tener a mano:

- **El inicio es `/`.** No hay redirect a `/propiedades`: el login, el alta por invitación y el middleware mandan todos a la raíz.
- **Las pantallas de admin (`/equipo`, `/configuracion`) hacen `redirect("/")` si el rol no alcanza.** Es cosmética: la API rechaza igual a un vendedor (regla 1). Sirve para no mostrarle una pantalla de error a quien se metió por la URL.
- **Navegación en `src/components/nav/app-nav.tsx`:** armada sobre el bloque `sidebar-03` de shadcn (`src/components/ui/sidebar.tsx`, copiado del registro oficial junto con `sheet`, `tooltip` y `separator`). Barra fija en escritorio y cajón (`Sheet`) en móvil, con submenús colgando de Propiedades y Consultas. El layout `(app)/layout.tsx` resuelve `getCurrentUser()` una vez, le pasa nombre y rol a la navegación, lee la cookie `sidebar_state` en el server para que la barra no parpadee y envuelve todo en `SidebarProvider` + `SidebarInset`. Los archivos de `components/ui/` que vienen del registro no se editan a mano: para personalizar, componer arriba.
- **No editar `components/ui/sidebar.tsx` para cambiar estilos.** Los radios están en cero globalmente desde `globals.css` (`--radius-*: 0`) y las animaciones del cajón son `@keyframes` propios porque `tw-animate-css` no está instalado.
- **`src/app/not-found.tsx`** cubre el 404 y también los 403: cuando alguien pide una propiedad o una consulta que no le corresponde, `queries.ts` devuelve `null` y la página llama a `notFound()`, para no delatar qué hay cargado del otro lado.
- **`src/components/pagination.tsx`** es compartido (propiedades y consultas); recibe `basePath`. Los componentes por sección viven en `src/components/{properties,leads,team,settings}/`.
- **Acciones por dominio:** `src/actions/{auth,properties,images,profile,leads,team,api-keys}.ts`.

## Al terminar una tarea

`npm run lint && npx tsc --noEmit && npm run build` sin errores. Si el cambio depende de datos reales, verificar que `back-lamelas` esté corriendo.
