# Carga manual de consultas: error al guardar y propiedad faltante en el selector

- **Detectado:** 2026-08-13 (cargando a mano las consultas perdidas)
- **Estado:** implementado 2026-08-13 · **en `origin/main`, desplegado** (verificado 2026-09-27)
- **Repo afectado:** `lamelas` (panel; solo frontend/actions)
- **Nota:** el archivo vivía en `back-lamelas/docs/bugfix/`; se movió acá el 2026-09-27, cuando los registros pasaron a ser por repo.

## Cómo funciona la carga manual

`/consultas/nueva` → `NewLeadForm` → server action `createLead` → `POST /v1/leads`
(`createManualLead`): canal `"manual"`, asignada a quien la carga. Campos: nombre
(obligatorio), teléfono y/o email (al menos uno), "De qué se trata" (mensaje,
obligatorio) y "Propiedad por la que consulta" (opcional, un `<select>`).

## Bug 1 — "me sale error" al guardar sin elegir propiedad

En `actions/leads.ts`, `leadSchema` tenía `property_id: z.string().uuid().optional()`.
El `<select>` manda `property_id=""` cuando está en "Ninguna en particular". `.optional()`
solo acepta `undefined`, no `""`, así que Zod fallaba con un error de uuid y la pantalla
mostraba un error genérico. O sea: **sin elegir propiedad, la carga manual siempre fallaba**.
(Se disparaba justo porque la propiedad que quería no estaba en el selector — bug 2 — así
que dejaba el select vacío.)

**Fix:** normalizar `""` → `undefined` antes de validar:
```ts
property_id: z.preprocess((v) => (v === "" ? undefined : v),
  z.string().uuid("Elegí una propiedad válida de la lista.").optional())
```

Nota: el globo "Completa este campo" del navegador es aparte — es la validación nativa
pidiendo "Nombre" o "De qué se trata" (ambos obligatorios), no un bug.

## Bug 2 — una propiedad disponible no aparece en el selector

`getPropiedadesParaSelect` (queries.ts) traía `/v1/properties?estado=disponible&page=1&limit=100`
— solo las **100 más nuevas** (orderBy createdAt desc), sin paginar. Con más de 100
disponibles, las más viejas no entraban al selector (aunque sí se ven en la página de
propiedades, que pagina). RLS no es: `prop_select` deja a admin y agente ver todas las del
tenant.

**Fix:** paginar hasta traer TODAS las disponibles (la API topa `limit` en 100).

**Si tras el deploy la propiedad sigue sin aparecer:** su `estado` real no es "disponible"
(revisar en el detalle de la propiedad). Con ≤100 disponibles el bug del límite no aplicaba,
así que ese caso sería un tema de estado, no del selector.

## Verificación
- `tsc --noEmit` + `eslint` OK.
- Manual tras deploy: cargar una consulta sin elegir propiedad → guarda; y confirmar que la
  propiedad disponible aparece en el selector.
