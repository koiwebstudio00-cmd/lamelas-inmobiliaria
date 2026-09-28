# El panel muestra las horas en UTC en vez de hora de Tucumán

- **Detectado:** 2026-09-08 (reportado por el cliente)
- **Estado:** **fix en `origin/main`** (verificado 2026-09-28). Si producción todavía muestra UTC, falta el deploy en Vercel, no el merge.
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

## Estado real (verificado 2026-09-28)

```
origin/main : 2 ocurrencias de "America/Argentina/Tucuman"
```

El fix entró en `dev` con el commit `a7c8664` ("leads por prop en analiticas y
destacadas para vendedores chau") y ya está mergeado en `main`. El 2026-09-27
este archivo decía lo contrario: la lectura se hizo con los refs remotos
desactualizados, sin `git fetch` previo. Lección: verificar el estado de una rama
remota siempre después de un fetch.

## Verificación

- Abrir una consulta reciente en el panel de producción y comparar con la hora del
  mensaje en WhatsApp.
- Ojo con `src/components/analytics/daily-volume.tsx`, que usa `timeZone: "UTC"`
  **a propósito** (las fechas de la serie diaria ya vienen agrupadas por día por el
  backend): ahí no hay que tocar nada.
