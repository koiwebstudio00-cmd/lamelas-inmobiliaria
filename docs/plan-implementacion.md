# Plan de Implementación Rápida — MVP en 1 día

**Referencia:** `prd-mvp-registro-propiedades.md`, `arquitectura.md`, `historias-usuario.md`
**Objetivo:** MVP funcional deployado hoy. Desarrollo asistido por agente de código (Claude Code), validación humana entre fases.

## Estrategia

Fases secuenciales y cortas. Cada fase termina con un checkpoint verificable (`npm run lint && npx tsc --noEmit && npm run build` + prueba manual). No pasar a la siguiente fase con el checkpoint roto. UI mínima con shadcn/ui, sin pulido estético.

## Fase 0 — Setup (~30 min)

- Crear proyecto Supabase y repo Next.js 15 (TS, Tailwind, shadcn/ui).
- Aplicar `schema.sql` como migración inicial (tablas, RLS, triggers, bucket).
- Generar tipos TS. Configurar `.env.local`.
- Clientes Supabase (`browser`, `server`) + `middleware.ts` protegiendo `(app)`.

**Checkpoint:** app corre local, BD con schema aplicado, tipos generados.

## Fase 1 — Auth (~1 h) · HU-1, HU-2, HU-3

- Registro (nombre, email, contraseña ≥ 8) → sesión iniciada → `/propiedades`.
- Login / logout, layout base con nav.
- Recuperar contraseña con el flujo default de Supabase.

**Checkpoint:** registrarse, salir, volver a entrar y resetear contraseña.

## Fase 2 — CRUD de propiedades (~1.5 h) · HU-4, HU-5, HU-7, HU-8

- Alta rápida: título, operación, tipo, precio (+ moneda default ARS). Server Action + Zod.
- Edición completa: todos los campos opcionales incl. `notas`. Solo el dueño.
- Cambio de estado (disponible/reservada/vendida) y eliminación con confirmación.

**Checkpoint:** ciclo completo crear → editar → cambiar estado → eliminar; con un segundo usuario verificar que RLS bloquea editar/borrar ajeno.

## Fase 3 — Fotos (~1.5 h) · HU-6

- Subida directa a Storage (`{property_id}/{uuid}.webp`), resize client-side máx. 1920px.
- Hasta 20 fotos, portada única (primera por defecto), eliminar foto.

**Checkpoint:** subir fotos desde el celular, cambiar portada, eliminar.

## Fase 4 — Listados (~1.5 h) · HU-9, HU-10, HU-11, HU-12

- Listado general: cards (portada, título, precio, estado, vendedor), orden por fecha, paginado 24.
- Filtros (operación, tipo, estado, vendedor) + búsqueda por título/dirección, en query params.
- Detalle con galería. Vista "Mis propiedades" con acciones rápidas.

**Checkpoint:** filtros combinados funcionan, URL compartible, estados vacíos visibles.

## Fase 5 — Deploy y cierre (~1 h)

- Deploy en Vercel con variables de entorno; migración aplicada en Supabase prod.
- QA del flujo completo en un celular real: registro → alta → fotos → listado.
- Ajustes responsive críticos que salgan del QA. Alta de los vendedores reales.

**Checkpoint final:** un vendedor real carga una propiedad con fotos desde su celular en producción.

## Total estimado: ~7 h

| Fase | Contenido | Tiempo |
|---|---|---|
| 0 | Setup | 30 min |
| 1 | Auth | 1 h |
| 2 | CRUD propiedades | 1.5 h |
| 3 | Fotos | 1.5 h |
| 4 | Listados | 1.5 h |
| 5 | Deploy + QA | 1 h |

## Recortes ya asumidos (para entrar en el día)

- Sin reordenado de fotos (solo portada + eliminar).
- Sin contador por estado en "Mis propiedades".
- Emails de auth con templates default de Supabase.
- Un solo proyecto Supabase (prod); entorno dev local opcional.
- Estética mínima: shadcn/ui default, sin branding.

## Si sobra tiempo (en orden)

1. Reordenar fotos.
2. Contadores por estado en "Mis propiedades".
3. Branding básico (logo, colores Lamelas).
