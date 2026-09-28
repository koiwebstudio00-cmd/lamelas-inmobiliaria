# docs/bugfix — lamelas (panel)

Registro de bugs y mejoras pendientes **de este repo**. Los de la API van en
`back-lamelas/docs/bugfix/`, los del sitio público en `lamelas-web/docs/bugfix/`
y los de Sofía/n8n en `lamelas-agent/docs/bugfix/`.

Convención: un archivo por bug con nombre `AAAA-MM-DD-descripcion-corta.md`, con
síntoma, causa raíz (archivo/commit), solución acordada, archivos a tocar,
verificación y estado. Los items chicos y las mejoras sin incidente asociado van
inline en la sección "Mejoras pendientes" de este README.

## Índice

- [2026-09-08 — El panel muestra las horas en UTC](./2026-09-08-hora-panel-en-utc.md) — **fix en `main`** (verificar deploy)
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

### Verificar los refs remotos antes de afirmar qué hay en producción (2026-09-28)

El 2026-09-27 se anotó acá que `dev` tenía 2 commits sin mergear (el fix de hora
entre ellos). Era falso: la lectura se hizo sin `git fetch`, con refs viejos. Con
los refs al día, `origin/main` ya los tiene. Antes de concluir qué falta en
producción: `git fetch` primero.
