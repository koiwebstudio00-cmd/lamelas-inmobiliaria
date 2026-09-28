# El panel muestra las horas en UTC en vez de hora de Tucumán

- **Detectado:** 2026-09-08 (reportado por el cliente)
- **Estado:** **fix en `dev`, NO en `origin/main`** → pendiente de merge y deploy (verificado 2026-09-27)
- **Repo afectado:** `lamelas` (panel)

## Síntoma

Las fechas y horas del panel (consultas, conversaciones, actividad) se mostraban
3 horas adelantadas: la hora UTC en vez de la hora local.

## Causa raíz

`formatDate()` y `formatDateTime()` en `src/lib/utils.ts` usaban
`Intl.DateTimeFormat("es-AR", …)` **sin** `timeZone`. En el servidor de Vercel la
zona por defecto es UTC, así que el render del servidor formateaba en UTC.

## Solución

Agregar `timeZone: "America/Argentina/Tucuman"` a las dos funciones.

## Estado real (verificado 2026-09-27)

```
origin/main : 0 ocurrencias de "America/Argentina/Tucuman"
origin/dev  : 2 ocurrencias
```

El fix entró en `dev` con el commit `a7c8664` ("leads por prop en analiticas y
destacadas para vendedores chau"), pero **ese commit nunca se mergeó a `main`**,
así que en producción el bug sigue vivo. `dev` está 2 commits por delante de
`main` (`a7c8664` y `9187e3d`).

## Verificación

- Abrir una consulta reciente en el panel de producción y comparar con la hora del
  mensaje en WhatsApp.
- Ojo con `src/components/analytics/daily-volume.tsx`, que usa `timeZone: "UTC"`
  **a propósito** (las fechas de la serie diaria ya vienen agrupadas por día por el
  backend): ahí no hay que tocar nada.
