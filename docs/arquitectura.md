# Arquitectura — MVP Registro de Propiedades

**Referencia:** `prd-mvp-registro-propiedades.md` · **Fecha:** Julio 2026

## 1. Visión general

Aplicación web full-stack con Next.js 15 hospedada en Vercel y Supabase como backend completo (Postgres, Auth, Storage). Sin backend propio: el cliente y los Server Components hablan directo con Supabase; la seguridad se garantiza con Row Level Security (RLS).

```
┌──────────────────────────────┐
│  Browser (móvil / desktop)   │
└──────────────┬───────────────┘
               │ HTTPS
┌──────────────▼───────────────┐        ┌─────────────────────────┐
│  Next.js 15 (Vercel)         │        │  Supabase               │
│  - App Router, TS            │◄──────►│  - Postgres (+ RLS)     │
│  - Server Components / RSC   │        │  - Auth (email+pass)    │
│  - Server Actions (mutations)│        │  - Storage (fotos)      │
│  - Middleware (sesión)       │        └─────────────────────────┘
└──────────────────────────────┘
```

## 2. Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Backend | Supabase (Postgres, Auth, Storage) |
| Cliente Supabase | `@supabase/supabase-js` + `@supabase/ssr` |
| Validación | Zod (formularios y Server Actions) |
| Hosting | Vercel |

## 3. Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── registro/page.tsx
│   │   └── recuperar/page.tsx
│   ├── (app)/                    # requiere sesión (layout con guard)
│   │   ├── propiedades/
│   │   │   ├── page.tsx          # listado general + filtros
│   │   │   ├── nueva/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # detalle
│   │   │       └── editar/page.tsx
│   │   └── mis-propiedades/page.tsx
│   └── layout.tsx
├── components/                    # UI compartida
├── lib/
│   ├── supabase/                 # clients (browser, server, middleware)
│   ├── validations/              # schemas Zod
│   └── types.ts                  # tipos generados de la BD
├── actions/                      # Server Actions (mutations)
└── middleware.ts                  # refresh de sesión + protección de rutas
```

## 4. Decisiones clave

- **RLS como capa de autorización.** Toda regla de acceso vive en Postgres (ver `schema.sql`). El código de UI nunca es la única barrera.
- **Server Actions para mutations** (crear/editar/eliminar propiedad), validadas con Zod server-side. Lecturas vía Server Components con el cliente server de Supabase.
- **Auth con Supabase Auth** (email + contraseña, recuperación incluida). Sesión gestionada con `@supabase/ssr` y cookies; `middleware.ts` refresca tokens y protege el grupo `(app)`.
- **Fotos en Supabase Storage**, bucket `property-images`, path `{property_id}/{uuid}.webp`. Subida directa desde el browser (signed upload) para no pasar archivos por Vercel. Redimensionado client-side antes de subir (canvas, máx. 1920px) — evita funciones server de procesamiento en el MVP. Render con `next/image`.
- **Multi-tenant desde el día 1 en datos, no en código:** `tenant_id` en todas las tablas con un tenant fijo (Lamelas). Sin selector de tenant, sin subdominios.
- **Un solo rol.** No hay tabla de roles ni checks de permisos más allá de "dueño edita lo suyo".

## 5. Flujos

**Registro/Login:** formulario → Supabase Auth → trigger en BD crea fila en `users` (profile) → redirect a `/propiedades`.

**Alta de propiedad:** form (campos obligatorios: título, operación, tipo, precio) → Server Action valida con Zod → insert en `properties` → pantalla de fotos → subida directa a Storage → filas en `property_images`.

**Listado:** Server Component consulta `properties` con filtros por query params (operación, tipo, estado, vendedor, búsqueda por título/dirección) + join a portada y vendedor.

## 6. Entornos y configuración

| Entorno | Supabase | Deploy |
|---|---|---|
| Desarrollo | proyecto Supabase `dev` (o local con CLI) | `next dev` |
| Producción | proyecto Supabase `prod` | Vercel (main) |

Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo server, solo si se necesita). Migraciones con Supabase CLI (`supabase/migrations/`).

## 7. Rendimiento y seguridad

- Listado paginado (24 por página), índices en columnas de filtro.
- Imágenes: WebP, tamaños via `next/image`, portada con `priority`.
- RLS activo en todas las tablas y en Storage; anon key expuesta es segura por diseño si RLS está bien definido.
- Rate limiting de auth lo maneja Supabase.

## 8. Preparación post-MVP

- Roles: agregar columna `role` a `users` + policies por rol (aprobaciones, admin).
- Sitio público: nuevas rutas `(public)` con ISR leyendo solo propiedades `publicada` (requiere agregar ese estado).
- Multi-tenant real: resolver tenant por subdominio en middleware; las policies ya filtran por `tenant_id`.
