# CLAUDE.md

Contexto para Claude Code al trabajar en este repo. Copiar a la raíz del proyecto Next.js.

## Proyecto

MVP interno de Inmobiliaria Lamelas: vendedores se registran y cargan propiedades con fotos. **Sin sitio público, sin roles, sin aprobaciones, sin multi-tenant en código** (aunque el modelo de datos tiene `tenant_id` con un tenant fijo).

Documentos fuente (leer antes de features nuevos):

- `prd-mvp-registro-propiedades.md` — alcance y requerimientos
- `arquitectura.md` — decisiones técnicas
- `schema.sql` — modelo de datos, RLS y storage
- `historias-usuario.md` — criterios de aceptación
- `plan-implementacion.md` — orden de trabajo
- `design-system.md` — colores, tipografía y recetas de componentes

## Stack

Next.js 15 (App Router, TypeScript) · Tailwind + shadcn/ui · Supabase (Postgres, Auth, Storage) vía `@supabase/ssr` · Zod · Vercel.

## Comandos

```bash
npm run dev          # desarrollo
npm run build        # build de producción (correr antes de dar por terminado)
npm run lint         # ESLint
npx tsc --noEmit     # chequeo de tipos
supabase db push     # aplicar migraciones (supabase/migrations/)
npx supabase gen types typescript --local > src/lib/types.ts  # regenerar tipos
```

## Reglas del proyecto

1. **RLS es la autorización.** Nunca confiar solo en checks de UI o de Server Action. Cambios de acceso = cambio de policy en migración.
2. **Mutations solo por Server Actions** en `src/actions/`, siempre validadas con Zod (schemas en `src/lib/validations/`). Lecturas en Server Components con el cliente server.
3. **Nunca usar `SUPABASE_SERVICE_ROLE_KEY` en código de app.** Si parece necesario, la policy RLS está mal diseñada.
4. **Cambios de BD = migración nueva** en `supabase/migrations/` (nunca editar migraciones aplicadas) + regenerar tipos TS.
5. **Fotos:** bucket `property-images`, path `{property_id}/{uuid}.webp`, redimensionar client-side (máx. 1600px) antes de subir, máx. 20 por propiedad, una sola portada.
6. **Campos obligatorios de propiedad:** solo título, operación, tipo, precio. El resto (incl. `notas`) es opcional — no agregar `required` de más.
7. **Mobile-first.** Los vendedores cargan desde el celular; probar todo formulario en viewport móvil.
8. **No agregar alcance post-MVP** (sitio público, roles, aprobaciones, leads) sin pedido explícito. Ver sección "Excluido" del PRD.
9. **shadcn/ui es la única librería de componentes y lucide-react la única de íconos.** No instalar otras librerías de UI/íconos; si falta un componente, componerlo con primitivas shadcn/ui + Tailwind. Colores y tokens según `design-system.md` (primario verde `#0E9145`).
10. UI y textos en **español (Argentina)**. Código (variables, funciones) en inglés; nombres de columnas de BD ya están en español — respetarlos.

## Estructura

Ver `arquitectura.md` §3. Resumen: rutas en `src/app/` con grupos `(auth)` y `(app)` (protegido por middleware), acciones en `src/actions/`, clientes Supabase en `src/lib/supabase/`.

## Al terminar una tarea

`npm run lint && npx tsc --noEmit && npm run build` sin errores. Verificar RLS si se tocó acceso a datos (probar con un segundo usuario).
