# docs/bugfix — lamelas (panel)

Registro de bugs y mejoras pendientes **de este repo**. Los de la API van en
`back-lamelas/docs/bugfix/`, los del sitio público en `lamelas-web/docs/bugfix/`
y los de Sofía/n8n en `lamelas-agent/docs/bugfix/`.

Convención: un archivo por bug con nombre `AAAA-MM-DD-descripcion-corta.md`, con
síntoma, causa raíz (archivo/commit), solución acordada, archivos a tocar,
verificación y estado. Los items chicos y las mejoras sin incidente asociado van
inline en la sección "Mejoras pendientes" de este README.

## Índice

- [2026-09-08 — El panel muestra las horas en UTC](./2026-09-08-hora-panel-en-utc.md) — **fix en `dev`, pendiente de merge y deploy**
- [2026-08-13 — Carga manual de consultas: error al guardar + propiedad faltante en el selector](./2026-08-13-carga-manual-consultas.md) — **desplegado**

## Mejoras pendientes

### Cambios de zona sin commitear (2026-09-27)

`property-form.tsx` y `src/lib/types.ts` tienen el cambio de zona a lista cerrada
**modificado en el working tree de `dev`, sin commitear**. Riesgo de perderlo.
Antes de commitear, ver las decisiones abiertas en
[`../features.md`](../features.md) → `ZONA-SELECT-01`.

### Filtro "Zona exacta" de analíticas contra lista cerrada (2026-09-27)

`analytics-filters.tsx` pide la zona con un `Input` de texto libre, pero el
backend compara exacto (`lower(p.zona) = lower(?)`). Con la carga ya cerrada a
lista, el filtro debería ser el mismo `Select` de `ZONAS`. Detalle en
[`../features.md`](../features.md) → `ZONA-SELECT-02`.

### `dev` adelantado a `main` (2026-09-27)

`origin/dev` tiene 2 commits que `origin/main` no (`a7c8664` y `9187e3d`): el fix
de hora local, el panel de ajustes del agente, el formulario de seguimientos y el
ranking de propiedades de analíticas. Todo eso está **fuera de producción**.
Conviene decidir si se mergea o si se deja explícito por qué no.
