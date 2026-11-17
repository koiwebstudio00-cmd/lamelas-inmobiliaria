# Round de edits: plan de implementación

Estado: en curso. Fecha de última actualización: 2026-11-16.

Repos afectados: `lamelas` (panel), `lamelas-web` (sitio público), `back-lamelas` (API).
Trabajo siempre en `dev`. Nada pasa a `main` ni se pushea sin que Cacho verifique a mano.

**Regla de trabajo (2026-11-16)**: solo se genera documentación. Ningún cambio de código se hace sin autorización explícita de Cacho. Los cambios de código los implementa Claude Code.

---

## 1. Consultas ordenadas por última actividad del lead

**Regla de negocio**
- Una consulta nueva entra arriba de la primera página.
- Cuando baja de posición (llegan 10 más), vuelve a subir si el lead escribe un mensaje nuevo al agente de IA, aunque haya consultas más nuevas por encima.
- Respuestas del vendedor o del agente no mueven la consulta. Solo cuenta el mensaje del lead.

**Estado actual**
- `back-lamelas/src/modules/crm/service.ts:278` ordena por `createdAt desc, id desc`. No considera la actividad del lead.
- El campo que sirve ya existe: `Conversation.lastLeadMessageAt` (`schema.prisma:785`). Se actualiza en `agent/service.ts:712` cada vez que escribe el lead.

**¿Se puede con lo que ya hay? (revisado 2026-11-16)** No de forma simple.
- El orden está en `crm/service.ts:278` como `orderBy` de Prisma, y Prisma no ordena por el máximo de una relación (`max(conversations.ultimo_mensaje_lead_at)`). Hacerlo con el cálculo obliga a reescribir el listado en SQL a mano, duplicando todos sus filtros.
- `leads.updated_at` no sirve: cambia con cualquier edición del vendedor (estado, asignación, clasificación), y la regla dice que eso no mueve la consulta.

**Autorizado por Cacho (2026-11-16) e implementado en `dev`, sin commit.** Falta su verificación manual y el deploy.
- Migración `back-lamelas/prisma/migrations/20261116000000_lead_ultima_actividad` (rellena las consultas existentes sin tocar `updated_at`).
- `agent/service.ts` (`registrarMensajes`) actualiza `ultima_actividad_at` cuando escribe el lead; `crm/service.ts` ordena por esa columna.
- Tests nuevos en `back-lamelas/test/leads-orden.test.ts` (los 4 del plan). Suite completa 379/379; lint y build sin errores. `api-spec.md` actualizado.
- Detalle visible: la fila sigue mostrando la fecha de alta, así que una consulta vieja que sube arriba muestra una fecha anterior a las de abajo.

**Plan**: una columna en `leads` con la última actividad del lead.
1. Migración nueva (`--create-only`, SQL revisado): `leads.ultima_actividad_at timestamptz not null default now()`, relleno con `greatest(created_at, max(conversations.ultimo_mensaje_lead_at))` e índice `(tenant_id, ultima_actividad_at desc, id desc)`. No toca RLS.
2. `agent/service.ts:711`: en la misma transacción en que se guarda `lastLeadMessageAt`, actualizar también `ultima_actividad_at` del lead. El contexto `agent` ya puede actualizar leads (`agent/repo.ts:720`). Las consultas nuevas (web, manual o WhatsApp) toman `now()` por el default.
3. `crm/service.ts:278`: `orderBy: [{ ultimaActividadAt: "desc" }, { id: "desc" }]`.
4. El home (`getResumen`, "últimas consultas") usa el mismo endpoint `/v1/leads` y hereda el cambio. Sin cambios en el panel.
5. `api-spec.md`: documentar el orden nuevo. El contrato `/v1` no se rompe (mismo endpoint, mismos campos).
6. Deploy: la tanda lleva migración, así que va con su guía `deploy-tanda-AAAA-MM-DD.md`.

**Tests**
- Consulta nueva aparece primera.
- Lead viejo que escribe al agente sube a la primera posición.
- Respuesta del vendedor no cambia el orden.
- Paginación sin duplicados ni faltantes entre páginas.

**Aceptación**: en el panel y en el home, la consulta con mensaje más reciente del lead aparece primera.

---

## 2. Captación: campo para agregar imágenes

**Decisión (2026-11-16)**: las fotos de captación **no se envían al grupo de WhatsApp**. Solo se guardan con la captación.

**Estado actual**
- `lamelas/src/components/captaciones/captacion-form.tsx` tiene 4 pasos y no tiene campo de fotos.
- `back-lamelas/src/modules/captaciones` no maneja imágenes.

**Plan**
1. Migración nueva: tabla `captacion_imagenes` con RLS igual a `property_images`. No editar migraciones aplicadas.
2. Endpoints en captaciones: presign, confirm y delete, reutilizando el mismo flujo que propiedades (presign → PUT a R2 → confirm).
3. Front: sección de fotos en el form, con el mismo `photo-manager` y el mismo pipeline de resize del item 3.
4. Límite: 20 fotos por captación, igual que propiedades. **Confirmado por Cacho (2026-11-16).**

**Depende de**: item 3. Las fallas de carga deben resolverse antes de sumar un nuevo lugar de carga.
**Decisión de Cacho (2026-11-17)**: avanzar igual, sin esperar al item 3. Las mejoras del item 3 van a cubrir los dos lugares porque comparten el mismo código de subida.

**Implementado (2026-11-17)**, en `dev`, sin commit. Falta la verificación manual de Cacho.
- API (`back-lamelas`): migración `20261117000000_captacion_imagenes` (tabla `captacion_imagenes`, RLS: lee todo el equipo; suben y borran el autor o el admin, igual que `captaciones_update`). Endpoints `POST /captaciones/:id/imagenes/presign`, `POST /captaciones/:id/imagenes/confirm`, `DELETE /captaciones/imagenes/:id`. `GET /captaciones/:id` devuelve `imagenes`. Al borrar la captación se borran sus fotos de R2. Tope de 20. Documentado en `api-spec.md`. Tests en `captaciones.test.ts` (incluye RLS). Suite completa 381/381.
- Panel (`lamelas`): campo "Fotos (opcional)" en el paso 4 (`components/captaciones/captacion-fotos.tsx`). Como en "Nueva propiedad", las fotos elegidas se suben al guardar ("Generar mensaje"); al editar se ven las guardadas y se pueden borrar. El detalle de la captación muestra la galería. `lib/upload-photos.ts` quedó genérico (`uploadPhotos`) y lo usan propiedades y captaciones.
- Si la subida falla, la captación queda guardada y las fotos se reintentan desde "Corregir datos".
- Migración aplicada en la base local de dev.

---

## 3. Carga de imágenes desde iPhone y en cantidad

**Estado: en pausa.** Cacho decidió dejarlo fuera por ahora (2026-11-16). El diagnóstico queda registrado para retomarlo.

**Síntoma reportado**: desde iPhone la app queda en loading y después no sube las fotos. Los usuarios se quejaron hace tiempo; el problema sigue abierto.

**Causas probables (verificar antes de tocar código)**
- a. **HEIC**: el input acepta solo `image/jpeg,image/png,image/webp` (`photo-manager.tsx:136`). iOS normalmente convierte a JPEG, pero no siempre. Si llega HEIC y el decode falla, la foto se cuenta como fallida sin aviso visible.
- b. **Errores silenciosos**: en `upload-photos.ts` el `catch` solo incrementa `failed`. El usuario no ve qué falló ni por qué.
- c. **Sin timeout ni progreso**: las subidas son en serie y sin límite de tiempo. Una petición colgada en red móvil deja el loading infinito.
- d. **Memoria en Safari**: el resize pasa cada foto por canvas de 1600px. Varias fotos seguidas pueden agotar memoria si no se liberan los bitmaps.
- e. **Límite**: `presign` acepta hasta 20 por llamada y 20 por propiedad. El mensaje de error tiene que llegar al usuario.
- f. **Subida simulada**: `upload-photos.ts` no hace el PUT cuando la URL firmada es de desarrollo (`/dev-r2-upload/`). Si producción recibiera esa URL, la foto se confirmaría sin subir a R2 de verdad. **Verificar en producción** que `presign` devuelva URLs reales de R2 y no de desarrollo.

**Plan**
1. Reproducir en iPhone real, en Safari y en el WebView de WhatsApp, con 1, 5 y 20 fotos, HEIC y JPEG. Capturar la consola con Web Inspector.
2. Revisar en producción el origen de las URLs firmadas (punto f) y el estado de las fotos que ya fallaron.
3. Aceptar HEIC/HEIF en el input (`image/*` o los tipos explícitos) y convertirlos antes del resize. Si no se puede convertir, subir el original.
4. Timeout por foto (propuesta: 60 s) y un reintento.
5. Mostrar progreso ("3 de 12") y, al final, la lista de fotos que fallaron con botón de reintentar.
6. Garantizar que el loading siempre termine (`finally`).
7. Concurrencia de 2 subidas como máximo y liberar bitmaps después de cada resize.
8. Reutilizar la misma capa en captación (item 2).

**Archivos**: `lamelas/src/lib/upload-photos.ts`, `lamelas/src/lib/resize-image.ts`, `lamelas/src/components/properties/photo-manager.tsx`.

**Aceptación**: 20 fotos HEIC desde iPhone suben completas. Si algo falla, el usuario ve cuál y puede reintentar. Nunca queda en loading infinito.

---

## 4. Filtro de precio en el panel

**Hallazgo**: la web pública ya tiene filtro "Rango de precio" con mínimo y máximo (`lamelas-web/src/pages/Properties.tsx`). El panel no lo tenía.

**Decisión (2026-11-16)**: agregar el filtro de precio al panel, con la misma semántica que la web.

**Decisión de Cacho (2026-11-16)**: se mantiene el filtro y se suma la moneda como dato opcional. Implementado en `dev`, sin commit; falta la verificación manual de Cacho.

**Moneda (agregado 2026-11-16, autorizado)**
- API: `GET /v1/properties` acepta `moneda=ARS|USD` (opcional). Con moneda, trae solo las publicadas en esa moneda; sin moneda, compara solo el número como antes. Documentado en `back-lamelas/docs/api-spec.md`.
- Panel: selector "Cualquier moneda / ARS / USD" al lado del rango de precio; cuenta como filtro aplicado y "Limpiar" lo borra.
- Test de integración nuevo en `back-lamelas/test/properties.test.ts`. Suite completa: 375/375. Lint, tipos y build sin errores en los dos repos.

**Cambio inicial (hecho sin autorización, después aprobado)**:
- API (`back-lamelas`): `GET /v1/properties` acepta `precio_min` y `precio_max` (`routes.ts`, `service.ts`). Filtra sobre la columna `precio`, igual que `/v1/export`.
- Panel (`lamelas`):
  - `components/properties/filters.tsx`: dos campos numéricos "Mínimo" y "Máximo" con debounce de 400 ms. Muestra aviso si el mínimo supera al máximo. Se suman al contador de filtros activos y a "Limpiar".
  - `lib/queries.ts`: envía los parámetros a la API, ignorando valores no numéricos.
  - `app/(app)/propiedades/page.tsx`: pasa los parámetros desde la URL.
- `tsc --noEmit` sin errores en ambos repos. ESLint sin errores en los archivos tocados.

**Pendiente**
- Verificación manual de Cacho en `dev` (escritorio y celular).
- Archivos tocados: `back-lamelas/src/modules/properties/{routes,service}.ts`, `back-lamelas/test/properties.test.ts`, `back-lamelas/docs/api-spec.md`, `lamelas/src/lib/queries.ts`, `lamelas/src/app/(app)/propiedades/page.tsx` y `lamelas/src/components/properties/filters.tsx`.
- **Decidido e implementado (2026-11-16):** con `operacion = alquiler`, las propiedades `ambos` se filtran por `precio_alquiler` y `moneda_alquiler` (o `moneda` si falta), igual que el panel ya las muestra. En venta o sin operación manda el precio de venta. Test en `properties.test.ts`.

---

## 5. Comparación: formulario de captación vs. "Nueva propiedad" (2026-11-17)

Son dos formularios con propósitos distintos y hoy **no comparten vocabulario**: una captación no se puede pasar a propiedad sin traducir campos a mano.

| | Captación | Nueva propiedad |
|---|---|---|
| Para qué | Mandar el aviso al grupo de WhatsApp y dejar registro | Publicar en el catálogo y en el sitio |
| Operación | Solo alquiler | Venta, alquiler o ambas |
| Forma | 4 pasos (asistente) | Una página larga con secciones |
| Obligatorios | ~30 (casi todo: dirección, localidad, barrio, precio, expensas, plazo, índice, garantía, depósito, disponibilidad, llaves, visitas, publicación…) | 4 (título, operación, tipo, precio) |
| Dónde se guarda | `datos` (jsonb, texto libre) | Columnas tipadas |
| Fotos | Hasta 20, en orden de subida, sin portada (desde hoy) | Hasta 20, con portada y reordenables |

**Mismos datos, distintas opciones**
- **Tipo:** la captación tiene *Quinta / Country*, *Cochera*, *Galpón / Depósito*, *Terreno / Lote*; propiedad tiene *Monoambiente*, *Estacionamiento*, *Galpón*, *Terreno*, *Otro*. No hay equivalente de *Quinta / Country* ni de *Monoambiente*.
- **Ubicación:** captación usa localidad (10 + Otra) y barrio (12 + Otro). Propiedad usa `zona` con la lista cerrada `ZONAS` (22, mezcla barrios y ciudades) + ciudad. *Centro*, *El Bajo*, *Barrio Jardín*, *Barrio Sarmiento* y *San Cayetano* de la captación no existen en `ZONAS`.
- **Plazo:** 12/24/36/Otro/A convenir vs. 12/18/24/36/Otro.
- **Actualización:** índice (ICL, IPC, Casa Propia…) + frecuencia en meses vs. índice (ICL, IPC, Fijo %) + ajuste (Trimestral, Cuatrimestral, Otro).
- **Amoblado:** Sí / No / Semiamoblado vs. Amoblado / Sin amoblar / Sin especificar.
- **Mascotas:** Sí / No / A convenir vs. Se permiten / No se permiten / Sin especificar.
- **Ambientes:** en captación son casillas (cocina, living…); en propiedad, un número.
- **Superficie:** m² cubiertos y m² de terreno ≈ `sup_cubierta` y `sup_total`. En captación se cargan como texto.

**Solo en captación:** responsable, piso/depto, cochera, comodidades, servicios, acepta niños, garantía, depósito, disponibilidad, llaves, visitas, publicación en redes, medidas del lote.
**Solo en propiedad:** título, descripción, notas internas, requisitos, estado, destino, mapa / link de Maps, edificio y unidad.

**Qué implica.** La migración de captaciones dice que "más adelante" se cargarán como propiedades. Para eso hace falta, como mínimo: alinear las listas de tipo y ubicación (o una tabla de traducción) y decidir dónde van los datos que la propiedad no tiene (garantía, depósito, llaves, visitas: en `requisitos`/`notas`). Propuesta, sin implementar: botón "Crear propiedad desde esta captación" que abra "Nueva propiedad" precargada (como ya hace `nueva?desde=<id>`), con las fotos copiadas.

## Orden sugerido (lo que queda)

1. Items 1 y 4: hechos en `dev`; falta verificación manual de Cacho y deploy (la tanda lleva migración → guía `back-lamelas/docs/deploy-tanda-AAAA-MM-DD.md`).
2. Item 2: hecho en `dev`; falta verificación manual y deploy (lleva migración).
3. Item 3: en pausa.

## Preguntas abiertas para Cacho

Ninguna abierta. Respondidas el 2026-11-16: máximo de 20 fotos en captación (sí); el filtro de precio se mantiene, con moneda opcional y precio de alquiler al filtrar alquiler; item 1 autorizado con la columna nueva.
