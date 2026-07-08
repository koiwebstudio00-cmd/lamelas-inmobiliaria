# AGENTS.md

Guía para agentes de código (Cursor, Codex, Copilot, etc.) trabajando en este repo. Claude Code usa `CLAUDE.md` (mismo contenido esencial).

## Qué es este proyecto

MVP interno de Inmobiliaria Lamelas: registro de vendedores y carga de propiedades con fotos. Fuera de alcance: sitio público, roles, aprobaciones, multi-tenant en código (el modelo de datos sí tiene `tenant_id`, con un tenant fijo).

Documentación: `prd-mvp-registro-propiedades.md` (alcance) · `arquitectura.md` (técnica) · `schema.sql` (BD/RLS) · `historias-usuario.md` (criterios de aceptación) · `plan-implementacion.md` (orden) · `design-system.md` (UI).

## Stack

Next.js 15 App Router + TypeScript · Tailwind + shadcn/ui · Supabase (Postgres/Auth/Storage) con `@supabase/ssr` · Zod · Vercel.

## Setup y comandos

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev

# validación (correr antes de terminar cualquier tarea):
npm run lint && npx tsc --noEmit && npm run build

# base de datos:
supabase db push                                              # migraciones
npx supabase gen types typescript --local > src/lib/types.ts  # tipos
```

## Convenciones

- Rutas en `src/app/`: grupo `(auth)` público, grupo `(app)` protegido por `middleware.ts`.
- Mutations únicamente vía Server Actions en `src/actions/`, validadas con Zod (`src/lib/validations/`). Lecturas en Server Components.
- Código en inglés; UI en español (Argentina); columnas de BD en español (no renombrar).
- Componentes compartidos en `src/components/`.
- **shadcn/ui es la única librería de componentes; lucide-react la única de íconos.** No instalar otras (MUI, Chakra, heroicons, react-icons, etc.). Componentes faltantes se componen con primitivas shadcn/ui + Tailwind.
- Tokens de diseño (colores, tipografía, radios, badges de estado) en `design-system.md`; primario verde `#0E9145`.

## Reglas de seguridad

- **RLS en Postgres es la única capa de autorización confiable.** Todo cambio de permisos se hace por migración de policies, nunca solo en la app.
- **Prohibido usar `SUPABASE_SERVICE_ROLE_KEY` en código de aplicación.**
- Cambios de esquema = nueva migración en `supabase/migrations/` (no editar migraciones aplicadas) + regenerar tipos.
- Regla de negocio central: cualquier usuario autenticado **lee** todo; solo el creador **modifica/elimina** sus propiedades.

## Reglas de producto

- Campos obligatorios de propiedad: título, operación, tipo, precio. Todo lo demás (incl. `notas`) es opcional.
- Fotos: bucket `property-images`, path `{property_id}/{uuid}.webp`, resize client-side a máx. 1600px, límite 20, una sola portada.
- Mobile-first: verificar formularios y subida de fotos en viewport móvil.
- No implementar features post-MVP (sitio público, roles, aprobación, leads) sin pedido explícito.

## Definition of Done

Lint + typecheck + build sin errores; criterios de aceptación de la historia cumplidos (`historias-usuario.md`); RLS verificado con un segundo usuario si se tocó acceso a datos.
