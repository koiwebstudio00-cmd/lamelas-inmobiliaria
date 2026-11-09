# Features por implementar — lamelas (panel interno)

**Última revisión:** 2026-11-08 (estados del índice verificados contra `origin/main`)

Backlog exclusivo de **este repo**. Cuando una feature se implementa y queda
verificada, se saca de acá; el historial vive en commits y en `docs/bugfix/`.

Las features que también necesitan trabajo en otro repo se registran allá con el
mismo ID: `back-lamelas/docs/features.md` (API y datos),
`lamelas-web/docs/features.md` (sitio público),
`lamelas-agent/docs/features.md` (Martina y n8n).

Formato de cada item: **qué es**, **ventaja** de hacerlo, **viabilidad**
(esfuerzo S/M/L y qué se toca) y **estado**.

## Orden de trabajo acordado (2026-09-27)

1. Zonas en propiedades (`ZONA-SELECT-01` + `ZONA-SELECT-02`, con
   `back-lamelas` → `ZONA-NORMALIZE-01`).
2. UI de Consultas: distinguir fantasmas y los que necesitan atención
   (`CONSULTAS-UI-01`).
3. Datos extra del lead (`LEAD-DATOS-01`).
4. Imagen de la propiedad al compartir el link (`lamelas-web` →
   `OG-DINAMICO-01`).

Flujo: todo se implementa en `dev`, Cacho prueba a mano y verifica, y solo
después se pasa a `main` y se sube al remoto.

## Índice

| ID | Item | Esfuerzo | Estado |
|---|---|:---:|---|
| ANALITICAS-ORIGEN-01 | Analíticas: "Desde dónde llegan" (anuncio / WhatsApp directo / formulario / manual), ranking de anuncios y fila en el reporte mensual | S | en producción (2026-10-18) |
| ANUNCIO-ORIGEN-02 | Chat y ranking de anuncios: app del anuncio (Facebook, Instagram o Meta) y link "Ver anuncio"; consultas por app en el ranking (`lib/anuncios.ts`) | S | en `main` (revisado 2026-11-08) |
| CAPTACION-01 | `/captaciones`: formulario de captación de alquileres en 4 pasos (el de Netlify), mensaje para el grupo con "Abrir WhatsApp" y "Copiar texto", historial con búsqueda y "Mías" (`lib/captacion.ts`) | M | en `main` (revisado 2026-11-08) |
| CHAT-WHATSAPP-01 | Chat de la consulta como WhatsApp: separadores por día, respuestas citadas con salto al original, anuncio de origen, imagen con el análisis plegado | M | en producción (2026-10-18) |
| CHAT-MEDIA-01 | Imágenes, audios, videos y PDFs en el chat (guardados 90 días en el VPS; link firmado que baja directo de la API) | M | en producción (2026-10-18) |
| ZONA-SELECT-01 | Cerrar la carga de zona a una lista, con escape "Otra" | S | en `main` (revisado 2026-11-08) |
| ZONA-SELECT-02 | Consecuencias de la lista cerrada en filtros | S | pendiente |
| PUNTO-REF-01 | Campo "punto de referencia" en el form y la ficha | S | en `main` (revisado 2026-11-08) |
| CIUDAD-SUGERIDA-01 | Campo Ciudad con sugerencias (datalist) | S | en `main` (revisado 2026-11-08) |
| ZONA-REVISAR-01 | Filtro "solo zonas a revisar" en el listado | S | en `main` (revisado 2026-11-08) |
| CONSULTAS-UI-01 | Distinguir en Consultas fantasmas y los que necesitan atención | M | en `main` (revisado 2026-11-08) |
| LEAD-DATOS-01 | Datos extra del lead en la ficha | S/M | a definir — prioridad 3 |
| MOTIVO-VISIBLE-01 | Mostrar y filtrar el motivo de derivación | S | pendiente |
| SIN-LEER-01 | Estado "sin leer" por lead | M | pendiente (plan escrito) |
| F1-PANEL | Vistas faltantes de analíticas | M | parcial |
| F3-PANEL | Vista de incidentes de n8n y Zernio | M | en `main` (revisado 2026-11-08) |
| FEEDBACK-CANAL-01 | Feedback como canal compartido con hilos + menú con grupo Configuración | M | en `main` (revisado 2026-11-08) |
| CSS-BORDES-01 | Los colores de borde de Tailwind no se aplican | S | probablemente resuelto con `TEMA-UI-01` (la regla `* { border-color }` pasó a `@layer base`) — confirmar a ojo |
| F4-PANEL | Pantalla de configuración de Martina por tenant | M | pendiente |
| F7-PANEL | Logs de correo y envío desde el lead | M | pendiente |
| NOTIF-INTERNAS-01 | Campanita y página de notificaciones | M | en `main` (revisado 2026-11-08) |
| LEAD-CIERRE-01 | Venta o alquiler al ganar una consulta | S/M | en `main` (revisado 2026-11-08) |
| EDIFICIOS-01 | Edificios: unidades agrupadas y alta desde otra unidad | M | en `main` (revisado 2026-11-08) |
| LEAD-AVANCES-01 | Avances del vendedor en la consulta | M | en `main` (revisado 2026-11-08) |
| NOTIF-TIEMPO-REAL-01 | Campanita en tiempo real por SSE | M | propuesto — se decide después del deploy |
| AUTH-REFRESH-RACE-01 | Cierre de sesión por dos renovaciones a la vez | S | propuesto — depende del backend |
| PROP-IA-TEXTO-01 | Título con estructura fija + descripción ordenada con IA (sugerencia que el vendedor acepta o edita; masivo para el admin) | M | **pedido 2026-11-08** — falta definir plantilla (Cubiko ya lo tiene, ver detalle) |
| PORTADA-MEJORA-01 | Mejora mínima de la portada (niveles, luz, enfoque leve) sin IA generativa, con antes/después | S/M | **pedido 2026-11-08** ("imágenes con IA") — falta decidir IA generativa o procesamiento clásico |
| FILTROS-PRECIO-01 | Filtro por rango de precio en el listado de propiedades (con moneda) | S | propuesto (2026-11-04) |
| FILTROS-PANEL-01 | Mejoras de filtros: orden, ambientes/baños, zona/ciudad, chips activos, cajón en móvil | S/M | parcial — el cajón en móvil y "Limpiar" salieron con `MOBILE-UI-01`; el resto falta definir |
| PUSH-PWA-01 | Panel instalable (PWA) + aviso de consulta nueva por push o correo, a elección de cada usuario | M | en `main` (revisado 2026-11-08) |
| EQUIPO-PRUEBAS-01 | Equipo: suspendidos en rojo, "App con avisos" y botones Probar correo / Probar notificación por usuario | S | en `main` (revisado 2026-11-08) |
| MAIL-FALLBACK-01 | Configuración → Correos: proveedor de cada envío (Resend/Brevo) y cupo del día/mes | S | pendiente — depende de `back-lamelas` |
| FOTOS-ORDEN-01 | Reordenar fotos arrastrándolas (y con flechas en el celular) | S | **pedido 2026-11-08** — la API ya lo soporta |
| TEMA-OSCURO-01 | Selector de modo claro / oscuro / sistema | S/M | **pedido 2026-11-08** — los colores oscuros ya están en `globals.css` |
| TEMA-UI-01 | Tema de tweakcn (teal `#00857A`, radios 0.5rem, Inter + JetBrains Mono) + micro-interacciones y animaciones de diálogos/menús (`tw-animate-css`) | M | en `dev`, sin verificar (2026-11-08) |
| MOBILE-UI-01 | Celular: barra de navegación inferior con "+", filtros en panel inferior, áreas táctiles de 44px, barra de guardar fija, tarjeta de propiedad compacta | M | en `dev`, sin verificar (2026-11-08) |

---

## ZONA-SELECT-01 — carga de zona con lista cerrada

**Qué es.** `Barrio / Zona` en `property-form.tsx` pasó de `Input` libre a
`Select` sobre la constante `ZONAS` de `src/lib/types.ts` (22 zonas de Tucumán y
alrededores). Las propiedades con un valor que no está en la lista lo conservan:
el form agrega una opción `"<valor> (valor actual)"`.

**Ventaja.** Los vendedores dejan de escribir la misma zona de cinco formas
distintas, y eso arregla en cascada el filtro del sitio público, los conteos de
analíticas y el matcheo de zona del buscador de Martina.

**Viabilidad.** Ya hecho, S. No requiere cambios de backend: `zona` sigue siendo
texto libre en la API y en Postgres, así que la lista es una convención de UI y
nada rompe. `tsc --noEmit` verde.

**Estado.** **Implementado en local, sin commitear** (rama `dev`; archivos
`property-form.tsx` y `lib/types.ts`). `tsc --noEmit` y `eslint` verdes.

Decisiones tomadas el 2026-09-27:
- **Las localidades que también son ciudad se quedan en las dos listas**
  (Yerba Buena, Tafí Viejo, Alderetes, Lules, Monteros, Concepción pueden ir como
  zona y como ciudad). Consecuencia asumida: el filtro del sitio puede mostrar la
  misma localidad como zona y como ciudad.
- **Lista cerrada + opción "Otra (especificar)"**: implementado con el centinela
  `OTRA_ZONA` (`lib/types.ts`). Al elegir "Otra" aparece un input libre y es ese
  input el que viaja como `zona` (el `<select>` pierde el `name`). Una propiedad
  cuyo valor guardado no está en la lista abre el form directamente en "Otra" con
  el texto cargado, así no se pierde al editar. Reemplaza el hack anterior de la
  opción `"(valor actual)"`.
- Lo que se escriba en "Otra" es la señal para ir sumando zonas a `ZONAS`: vale
  revisarlo cada tanto con la query de `ZONA-NORMALIZE-01`.

Pendiente antes de mergear a `main`: probar a mano (alta nueva, edición de una
propiedad con zona de la lista, edición de una con zona vieja fuera de la lista,
y guardar con "Otra" vacío → debe quedar `null`). Falta Salta en la lista, que el
SEO del sitio publicita.

## ZONA-SELECT-02 — consecuencias de la lista cerrada en los filtros

**Qué es.** Dos lugares del panel quedaron desalineados con la lista cerrada:
- Analíticas → filtro "Zona exacta" es un `Input` de texto libre
  (`analytics-filters.tsx`) contra una comparación exacta en el backend. Debería
  ser el mismo `Select` de `ZONAS`.
- El listado de propiedades muestra la columna Zona pero **no se puede filtrar
  por zona**, aunque ahora el vocabulario es finito y el filtro sería trivial.

**Ventaja.** El filtro de analíticas deja de depender de que el admin escriba
exactamente igual que el vendedor que cargó la propiedad. Y filtrar el listado
por zona es la consulta más común de la oficina ("qué tengo en Yerba Buena").

**Viabilidad.** S. Solo panel; el endpoint de analíticas ya acepta `zona` y el de
propiedades ya acepta filtros.

**Estado.** Pendiente.

## MOTIVO-VISIBLE-01 — mostrar el motivo de derivación en el lead

**Qué es.** Pedido de los empleados: poder distinguir al lead que viene a **dejar
una propiedad**. Martina ya lo detecta y deriva con `motivo: "tasacion"`, que queda
guardado en `derivaciones.motivo`, pero el panel no lo muestra ni permite
filtrar por él.

**Ventaja.** Resuelve el pedido sin tocar el enum de clasificación ni migrar
nada: el dato ya existe. Los vendedores ven de una si la consulta es de alguien
que quiere comprar o de alguien que quiere vender.

**Viabilidad.** S del lado del panel (ficha del lead + filtro en Consultas), una
vez que la API lo devuelva → `back-lamelas/docs/features.md` →
`CLASIF-PROPIETARIO-01`.

**Estado.** Pendiente. Alternativa más cara: agregar `propietario` al enum de
clasificación, que además toca `actions/leads.ts`,
`lead-clasificacion-select.tsx`, `lead-filters.tsx`, `analytics-filters.tsx`,
`CLASIF_VALUES` y el tile de stats de Consultas.

## SIN-LEER-01 — estado "sin leer" por lead

**Qué es.** Distintivo visual de lead sin leer en: el listado, un badge en el
menú lateral, un filtro "Sin leer" y un tile del dashboard. Marcar como leída
**cierra el handoff**: el acuse de recibo del vendedor es lo que frena la
reasignación por timeout, igual que "Tomar el chat" en WhatsApp.

**Ventaja.** Le da a los leads web el mismo acuse de recibo que ya tienen los de
WhatsApp, que es lo que habilita reasignarlos cuando nadie los atiende. Y de paso
el vendedor ve de un vistazo qué le entró y no miró.

**Viabilidad.** M en el panel, pero depende de
`back-lamelas/docs/features.md` → `LEAD-WEB-HANDOFF-01` (L). Reglas ya
acordadas: `leido_at` se resetea al reasignar; se marca por acción explícita, no
por abrir el detalle; `POST /conversations/:id/take` también lo setea; el
distintivo cuelga de `assigned_to = yo`, nunca de ser dueño de la propiedad.

**Estado.** Pendiente. Plan completo del 2026-08-24 en
`Documents/Claude/Projects/Inmobiliaria lamelas/plan-reparto-leads-y-leidos.md`.

## PUNTO-REF-01 — punto de referencia en el form y la ficha

**Qué es.** Campo nuevo, opcional, debajo de zona y ciudad: "A una cuadra de Mate
de Luna", "frente al Mercato". En la ficha se muestra como línea aparte
(`Referencia: …`), no pegado a la dirección.

**Ventaja.** Es el lugar donde van a parar las referencias que hoy ensucian el
campo zona. Sin este campo, la limpieza de zonas pierde información que alguien
cargó a propósito.

**Viabilidad.** Hecho. Panel: `property-form.tsx`, `lib/types.ts`,
`lib/queries.ts`, `lib/validations/property.ts` y el detalle. Backend:
`back-lamelas/docs/features.md` → `ZONA-NORMALIZE-01`.

**Estado.** Implementado en `dev`, sin commitear. `tsc` y `eslint` verdes.
**Requiere correr la migración y `npx prisma generate` en el backend antes de
probar**, o el PATCH va a fallar con "Unknown arg puntoReferencia".

## CIUDAD-SUGERIDA-01 — campo Ciudad con sugerencias

**Qué es.** El input de Ciudad ahora tiene un `<datalist>` con una lista curada
(`CIUDADES` en `lib/types.ts`): escribiendo "san m" aparece "San Miguel de
Tucumán", pero sigue aceptando cualquier texto para las localidades que no están
en la lista.

**Ventaja.** Ataca la causa del desastre que encontramos en los datos: la misma
ciudad cargada de cinco formas distintas. Sin cerrar el campo, que no se puede
cerrar porque hay propiedades en localidades sueltas.

**Viabilidad.** Hecho, sin dependencias nuevas. Se evaluó el Combobox de shadcn
(Popover + cmdk) y se descartó por no sumar dos dependencias a un panel que usa
controles nativos a propósito (`design-system.md`).

**Límites conocidos.** El desplegable lo dibuja el navegador: no se puede estilar
y difiere entre Chrome y Safari (Safari filtra por prefijo, Chrome por cualquier
parte del texto). Si algún día molesta, el reemplazo natural es el Combobox.

**Nota sobre la lista.** `CIUDADES` se curó a mano desde los datos ya
normalizados; **no** se alimenta de los valores crudos de la base, que es donde
viven "Capital", "Tucuman" y "San Miguel". Si se agrega una ciudad, va en esa
constante.

**Estado.** Implementado en `dev`, sin commitear.

## ZONA-REVISAR-01 — filtro "solo zonas a revisar"

**Qué es.** Checkbox en los filtros del listado de propiedades que deja solo las
que tienen la zona vacía o con un valor que no está en la lista. Lo resuelve la
API (`zona_revisar=true`), así que respeta la paginación.

**Ventaja.** Es la herramienta con la que la inmobiliaria va a corregir las ~216
propiedades con zona mal cargada, sin revisar las 412 a mano.

**Viabilidad.** Hecho. `filters.tsx`, `lib/queries.ts` y la page del listado.

**Estado.** Implementado en `dev`, sin commitear.

## CONSULTAS-UI-01 — distinguir fantasmas y los que necesitan atención

**Qué es.** Prioridad 2 del 2026-09-27. En la bandeja de Consultas se distinguen
ahora dos grupos que antes se veían iguales:
- **Necesita atención**: Martina derivó a un humano (visita, reserva, tasación,
  pedido de humano) y el handoff sigue **pendiente**. Badge rojo con el motivo y
  barra roja al costado de la fila. Cuando está, reemplaza al badge "Sin tomar":
  dice lo mismo pero explica por qué.
- **Fantasma**: `clasificacion = 'fantasma'` (Martina le hizo seguimiento y no
  contestó). Badge gris con ícono, y la fila al 70% de opacidad: es información,
  no una tarea.

Se suma un filtro **Atención → "Necesita atención"**. Los fantasmas se siguen
filtrando con el select Clasificación que ya existía, para no tener dos filtros
que hagan lo mismo.

**Ventaja.** El vendedor abre Consultas y ve de un vistazo qué pide acción ahora
y qué no. Antes, un lead que dejó de contestar y uno que pidió una visita hace
media hora se veían idénticos.

**Viabilidad.** Hecho. Panel: `estado-badge.tsx` (dos badges nuevos),
`lead-row.tsx`, `lead-table.tsx`, `lead-filters.tsx`, `lib/types.ts`,
`lib/queries.ts` y la page de Consultas. Backend: `GET /v1/leads` ahora aplana la
última derivación del lead (`derivacion: { motivo, pendiente, asignado_at }`) y
acepta `atencion=true` — ver `back-lamelas/docs/features.md`.

**Estado.** Implementado en `dev`, sin commitear. `tsc` y `eslint` verdes en los
dos repos. Pendiente de prueba manual y de decidir si el detalle del lead también
muestra el motivo (hoy el detalle usa otro endpoint y no lo recibe).

## LEAD-DATOS-01 — datos extra del lead en la ficha

**Qué es.** Prioridad 3 del 2026-09-27: sumar datos del lead en la ficha. Todavía
sin definir cuáles.

**Ventaja.** Depende de qué se agregue; el criterio es que el vendedor no tenga
que abrir la conversación completa para saber con quién habla.

**Viabilidad.** S/M según si los datos ya están en la base (el resumen de Martina
guarda perfil: zonas, presupuesto, tipo, ciudad) o hay que capturarlos.

**Estado.** A definir.

## F1-PANEL — vistas faltantes de analíticas

**Qué es.** Resumen, Consultas y el ranking de propiedades por consultas están
implementados. Faltan las vistas de vendedores y de Martina.

**Ventaja.** La vista de vendedores es la que permite hablar de tiempos de
respuesta con datos en vez de con impresiones.

**Viabilidad.** M, y va detrás de los endpoints
(`back-lamelas/docs/features.md` → `F1-API`). Diseño en
`lamelas-agent/docs/analytics-module.md`.

**Estado.** Parcial.

## F3-PANEL — vista de incidentes de n8n y Zernio

**Qué es.** Pantalla administrativa con los errores normalizados de n8n, métricas
de `channel_webhook_events` (pendientes, procesados, errores, demora), estado de
entrega de mensajes, filtros por período/canal/workflow/estado y marcar
incidentes como vistos o resueltos.

**Ventaja.** Hoy, cuando algo del circuito de WhatsApp se cae, la única forma de
enterarse es entrar a n8n o a Zernio. El caso del cron de vencidos sin publicar
(ver `lamelas-agent/docs/bugfix/`) estuvo semanas sin que nadie lo notara,
justamente por esto.

**Viabilidad.** M en el panel, detrás de F3-API. La API de n8n y las credenciales
de Zernio nunca se exponen al navegador.

**Estado.** Implementado en `dev` el 2026-10-09, sin verificar. Página
`/incidentes` y detalle (solo admin, dentro de `(admin)`), ítem del menú con el
contador de críticos abiertos, campanita con los críticos en rojo, fijos arriba
mientras estén sin leer y con aviso emergente; la campanita también se
actualiza al volver a la ventana. Plan: `back-lamelas/docs/plan-incidentes-agente.md`.

## CSS-BORDES-01 — los colores de borde de Tailwind no se aplican

**Qué es.** `globals.css` tiene `* { border-color: var(--border) }` fuera de
cualquier `@layer`. En Tailwind v4 los estilos sin capa le ganan a todas las
utilidades, así que clases como `border-red-200`, `border-l-primary` o
`border-emerald-200` no pintan: todo borde sale gris. Se notó al hacer
`F3-PANEL` (la barra roja de los críticos se dibuja con una sombra por eso).

**Viabilidad.** S: mover esa regla a `@layer base`. Cambia el aspecto de los
badges y avisos que ya usan bordes de color (pasan a verse como se diseñaron),
así que conviene revisar las pantallas antes de aplicarlo.

**Estado.** Pendiente.

## F4-PANEL — pantalla de configuración de Martina por tenant

**Qué es.** Administración de bot activo/inactivo, horario y días de atención,
timeout de handoff, mensaje fuera de horario, criterios comerciales, URL del
sitio y disponibilidad de vendedores.

**Ventaja.** Cambiar un horario o el timeout de handoff deja de ser un deploy.

**Viabilidad.** M, detrás de `F4-API`. Ya existe `agent-settings-panel.tsx` como
punto de partida.

**Estado.** Pendiente.

## F7-PANEL — logs de correo y envío desde el lead

**Qué es.** Vista de logs de entrega/rebote/error y envío de correo desde la
ficha del lead, con permisos y auditoría.

**Ventaja.** Cierra el circuito de "no me llegó el aviso" y deja la comunicación
con el cliente registrada en el CRM en vez de en el Gmail de cada vendedor.

**Viabilidad.** M, detrás de `F7-API`.

**Estado.** Pendiente.


## F9-PANEL — Analíticas en cuatro pestañas + reporte mensual en PDF

**Qué es.** Analíticas pasa a tener Panorama, Consultas, Martina y Propiedades, y
cada KPI muestra su variación contra el período anterior. El botón "Reporte
mensual" abre `/analiticas/reporte?mes=AAAA-MM`: una página armada para
imprimir (resumen del mes con variaciones, consultas, Martina y propiedades) que
se guarda como PDF desde el navegador. Sin dependencias nuevas.

**Ventaja.** Un reporte para mandarle a los dueños sin armarlo a mano, y
secciones que responden preguntas concretas (cuándo escriben los clientes, qué
zonas piden y no tenemos, qué propiedades no generan consultas).

**Estado.** Implementado en `dev` (2026-09-30), detrás de `F9-API`. Sale junto
con la tanda del 2026-10-05 porque comparte archivos con ella. Pendiente: la
recorrida manual.

## NOTIF-INTERNAS-01 — campanita y página de notificaciones

**Qué es.** Campanita en la barra superior (`components/notifications/`): contador
de sin leer, las últimas 6 y "Ver todas", que lleva a `/notificaciones` (detalle
completo de cada aviso, marcar como leída, marcar todas, pestaña "Sin leer").
Tocar un aviso lo marca como leído y lleva a su consulta. Se refresca sola una
vez por minuto con la pestaña visible, por una Server Action (el navegador no
habla con la API). Reemplaza a los correos de consultas, derivaciones,
reasignaciones y reportes de error: ver `back-lamelas/docs/features.md` →
`NOTIF-INTERNAS-01`.

Las reasignaciones quedan además en la card "Notas internas" de la consulta,
como registro automático (ícono de flechas, fondo gris), separadas de lo que
escribe el equipo.

**Tiempo real.** No es instantáneo: la campanita consulta cada 60 segundos con
la pestaña visible y en cada navegación. El listado de Consultas no se refresca
solo.

**Estado.** Implementado en `dev`. Probado de punta a punta contra el backend en
un entorno local (vendedor, admin y celular).

## LEAD-CIERRE-01 — venta o alquiler al ganar una consulta

**Qué es.** Elegir "Ganada" en el estado abre un diálogo: venta o alquiler
(obligatorio, preseleccionado si la propiedad consultada es de una sola
operación), propiedad (por defecto la consultada; las demás se cargan recién al
abrir el selector) y si se marca la propiedad como vendida/alquilada. La ficha
muestra el cierre con "Editar"; la bandeja muestra "Ganada · Venta" y filtra por
eso; Analíticas y el reporte mensual desglosan las ganadas.

**Estado.** Implementado en `dev`.

## EDIFICIOS-01 — unidades agrupadas

**Qué es.** Sección "Edificio" en el form de propiedad (elegir uno, crear uno
nuevo o ninguno, más la unidad: "3° B"). La ficha muestra el edificio y lista las
otras unidades con su estado; "Cargar otra unidad" abre el alta con los datos de
esa propiedad ya copiados (`/propiedades/nueva?desde=<id>`, sin fotos ni unidad).
`/propiedades/edificios` lista los edificios (renombrar y borrar: admin) y el
listado filtra por edificio.

**Estado.** Implementado en `dev`.

## LEAD-AVANCES-01 — avances del vendedor

**Qué es.** Card "Avances" en la ficha de la consulta: seis opciones rápidas
(no contestó, hablamos, visita agendada, visita realizada, en negociación, no le
interesa) con comentario opcional, y el historial. La bandeja marca "Esperando
avance", muestra el último avance de cada consulta, filtra por pendientes y
avisa arriba cuántas hay (las propias para el vendedor, todas para el admin).

**Estado.** Implementado en `dev`.

> **Deploy de esta tanda.** `NOTIF-INTERNAS-01`, `LEAD-CIERRE-01`, `EDIFICIOS-01`,
> `LEAD-AVANCES-01` y `F9-PANEL` salen juntos, **después** del backend: el panel
> nuevo contra el backend viejo rompe (la campanita falla en cada página y editar
> una propiedad da 400). Paso a paso en
> `back-lamelas/docs/deploy-tanda-2026-10-05.md` §4.2.

## NOTIF-TIEMPO-REAL-01 — campanita en tiempo real

**Qué es.** La campanita consulta cada 60 segundos (`REFRESCO_MS` en
`components/notifications/notifications-bell.tsx`) con una Server Action. La
propuesta es que el navegador abra un stream SSE directo contra la API y que el
panel solo emita el ticket para conectarse; el sondeo queda como respaldo a
intervalo largo. Sería el primer caso en que el navegador habla con la API sin
pasar por el servidor de Next — la regla "el navegador nunca habla con la API"
pasa a tener esta excepción, de solo lectura.

**Ventaja.** Avisos al instante y menos consumo del plan Hobby de Vercel: cada
sondeo es una invocación de función. Con ~30 usuarios, 60 s son ~317.000
invocaciones por mes (el tope es 1.000.000); a 15 s serían ~1.270.000.

**Viabilidad.** M, detrás de `back-lamelas` → mismo ID. En el panel: una Server
Action que pide el ticket, un `EventSource` con reconexión, y refrescar también
el listado de Consultas cuando llega un aviso de consulta nueva.

**Estado.** Propuesto el 2026-10-05, sin implementar. Mientras tanto, mirar
Vercel → Usage a los 2–3 días del deploy.

## AUTH-REFRESH-RACE-01 — la sesión se cierra si dos requests renuevan a la vez

**Qué es.** `src/middleware.ts` renueva el access token vencido con el refresh,
que rota. Si dos requests llegan a la vez al vencer, el segundo usa un refresh ya
rotado, la API responde 401 y el usuario cae en `/login`. Pasa entre dos
requests cualesquiera (dos pestañas, una navegación y el sondeo de la campanita).
Reproducido en local forzando el caso: 1 de 5 intentos.

**Viabilidad.** El arreglo de fondo es del backend (ventana de gracia para el
refresh recién rotado): `back-lamelas/docs/features.md` → mismo ID. Del lado del
panel no hay nada que cambiar si se hace allá.

**Estado.** Propuesto el 2026-10-05.

## FEEDBACK-CANAL-01 — feedback como canal compartido y menú reordenado

**Qué es.** `/feedback` pasa a ser un canal único (antes: Sugerencias y Reportes
de error por separado) con publicaciones de tipo Error, Problema o Sugerencia que
todo el equipo ve y responde en hilo (`/feedback/[id]`). En el mismo cambio, el
menú agrupa Equipo, Incidentes e Integraciones (las API keys) bajo
**Configuración**, en `/configuracion/*`.

**Viabilidad.** M. Diseño y decisiones en `back-lamelas/docs/plan-feedback-canal.md`.

**Estado.** Implementado en `dev` el 2026-10-09, sin verificar. Componentes en
`src/components/feedback/` (`nueva-publicacion`, `feedback-feed`,
`hilo-respuestas`, `marcar-resuelta`, `autor-avatar`) y
`src/components/auto-refresh.tsx`. Redirecciones de las rutas viejas en
`next.config.ts`. Deploy junto con la tanda de incidentes
(`back-lamelas/docs/deploy-tanda-2026-10-09.md`).

## PROP-IA-TEXTO-01 — título y descripción con estructura fija (IA)

**Qué es.** Botón "Mejorar con IA" en el form/ficha de propiedad que propone un
título y una descripción con estructura común, y una acción masiva solo admin
para pasar el catálogo existente.
- **Título: plantilla determinística, sin IA.** Se arma con los datos cargados,
  p. ej. *"Departamento 2 dorm. en alquiler – Barrio Norte, San Miguel de
  Tucumán"*. Sale siempre igual y no cuesta nada.
- **Descripción: IA.** Reordena el texto libre del vendedor en secciones fijas
  (ambientes, comodidades, ubicación, condiciones) y propone campos que están en
  el texto pero vacíos en la ficha (p. ej. dormitorios).
- La IA **nunca guarda directo**: el panel muestra antes/después y el vendedor
  acepta o edita; se guarda con el `PATCH` de siempre.

**Ventaja.** Catálogo homogéneo (listado, sitio y buscador de Martina), mejor
SEO en `lamelas-web` y menos trabajo de redacción para los vendedores.

**Viabilidad.** M (1–2 días). Panel: botón + diálogo de comparación + acción
masiva. Backend: endpoint de sugerencia (ver `back-lamelas` →
`PROP-IA-TEXTO-01`). Modelo propuesto: `gpt-5-mini` con la key de OpenAI que ya
usa el agente (alternativa: `gpt-4.1-mini`, el del agente), con salida JSON
estricta, razonamiento mínimo y 2–3 ejemplos reales de Lamelas en el prompt.
Costo estimado < US$0,002 por propiedad (precios de agregadores, confirmar en la
consola de OpenAI).

**Ojo SEO.** El beneficio en el sitio depende de `lamelas-web` →
`OG-DINAMICO-01`: hoy `seo.ts` setea los meta tags por JS, que WhatsApp/Facebook
no ejecutan y Google indexa con demora.

**Referencia en Cubiko** (`ubikka/backend/src/modules/properties/copy-draft.ts`,
botón "Sugerir título y descripción con IA" en `property-form.tsx`): endpoint
`POST /properties/copy-draft` con rate limit, entrada validada con Zod (datos de
la ficha), salida JSON `{ titulo, descripcion }`, el vendedor revisa antes de
guardar, y una tabla de uso (`propertyCopyUsage`: tenant, usuario, modelo,
tokens) para medir el costo por inmobiliaria. Diferencias con este plan:
Cubiko genera **también el título con IA** (acá se propuso plantilla fija) y no
tiene acción masiva. Se puede portar casi tal cual al backend de Lamelas.

**Necesita en producción:** `OPENAI_API_KEY` (y el modelo) como variables del
backend en Dokploy — hoy la key la usa solo n8n.

**Estado.** Pedido por Cacho el 2026-11-08. Falta definir: título con plantilla
fija o con IA (como Cubiko), secciones de la descripción y si va la acción
masiva para el admin.

## PORTADA-MEJORA-01 — mejora mínima de la foto de portada

**Qué es.** Botón en el administrador de fotos para mejorar la portada: niveles
automáticos, un poco de brillo/sombras solo si la foto está oscura y enfoque
leve. Se guarda como foto nueva (la original se conserva) y el vendedor elige
cuál queda de portada después de ver el antes/después.

**Decisión propuesta: sin IA generativa.** Los modelos de edición (gpt-image,
Gemini 2.5 Flash Image ~US$0,04/imagen) redibujan la foto entera aunque se pida
un cambio mínimo: pueden alterar ventanas, humedad o muebles (riesgo de
publicidad engañosa) y devuelven a menor resolución que los 1600 px actuales.
El procesamiento clásico no inventa píxeles y cuesta cero.

**Viabilidad.** S/M. Se puede hacer client-side con el mismo canvas de
`src/lib/resize-image.ts`, sin librerías nuevas, y subir el resultado por el
flujo presign/confirm existente. Límite: trabaja sobre la copia ya reducida a
1600 px WebP, no sobre el original del celular. Sin cambios de backend salvo que
se quiera marcar la foto como "mejorada".

**Estado.** Pedido por Cacho el 2026-11-08 como "imágenes con IA". Falta
decidir el enfoque: procesamiento clásico (recomendado: no altera la foto, costo
cero) o IA generativa (riesgo de publicidad engañosa y menor resolución, ver
arriba). Cubiko no tiene nada de esto para tomar como base.

## FILTROS-PRECIO-01 — rango de precio en el listado

**Qué es.** Campos "Precio desde / hasta" + moneda en `filters.tsx`, que viajan
como `precio_min`, `precio_max`, `moneda` en los query params.

**Ventaja.** Es la pregunta más habitual al buscar qué ofrecer a un cliente.

**Viabilidad.** S (medio día a un día con el backend, ver `back-lamelas` →
`FILTROS-PRECIO-01`). Dos detalles:
- **Moneda:** ARS y USD no se comparan sin tipo de cambio; el rango va siempre
  con una moneda (USD por defecto en venta, ARS en alquiler).
- **Operación "ambos":** usa `precio` si se filtra venta y `precio_alquiler` si
  se filtra alquiler.

**Estado.** Propuesto el 2026-11-04.

## FILTROS-PANEL-01 — mejoras generales de los filtros

**Qué es.** Hoy hay búsqueda, operación, dormitorios, tipo, estado, vendedor y
edificio. Propuesta:
- ordenar por precio y por fecha;
- ambientes y baños;
- zona (lista de `ZONAS`, ver `ZONA-SELECT-02`) y ciudad;
- chips con los filtros activos + "Limpiar";
- en el celular, los filtros dentro de un `Sheet` para que no ocupen media
  pantalla.

**Viabilidad.** S/M. Mayormente panel; orden y ambientes/baños necesitan
parámetros nuevos en la API (aditivos, no rompen `/v1`).

**Estado.** Propuesto el 2026-11-04. Falta que Cacho defina qué entra. El
punto del celular (filtros en un panel inferior, con contador de aplicados y
"Limpiar") ya salió con `MOBILE-UI-01` (`components/filtros-plegables.tsx`).

## PUSH-PWA-01 — panel instalable y aviso de consulta nueva en el celular

**Qué es.** El panel se puede instalar como app (PWA) y, desde la app
instalada, cada usuario puede recibir el aviso de **consulta nueva** como
notificación nativa del celular.

Decisiones de Cacho (2026-11-04):
- **Un solo aviso por push:** "consulta nueva" para el vendedor, que es el mismo
  evento que hoy dispara el correo "te asignaron una consulta" (derivación de
  Martina, vencimiento, seguimiento, reasignación de un admin, formulario que
  entra asignado). Feedback, incidentes y avisos de cuenta no van por push.
- **Cada usuario elige push, correo o los dos, pero al menos uno.** El push
  solo se puede prender desde la app instalada (en el navegador común se ve
  el botón "Instalar app").
- **Texto genérico** en la pantalla bloqueada, sin datos del cliente: "Nueva
  consulta — Te asignaron una consulta nueva en el panel." Al tocarlo abre la
  consulta.
- **Horario igual que el correo:** sin filtro, sale cuando ocurre la asignación.
- **El interruptor del admin** en Configuración → Correos se mantiene como está
  (apaga solo el correo, no el push).

**Cómo.**
- `src/app/manifest.ts`, íconos 192/512, `public/sw.js` (solo recibe avisos;
  no cachea páginas). `sw.js` y el manifiesto quedan fuera del `matcher` del
  middleware (si no, redirige al login y el service worker no se registra).
- Botón "Instalar app": en Android/Chrome instala directo
  (`beforeinstallprompt`); en iPhone abre el menú Compartir y muestra la guía
  "Agregar a inicio" (iOS no permite instalar desde un botón).
- `/perfil` → sección Notificaciones: interruptores push/correo, lista de
  dispositivos con "Quitar" y "Enviar prueba".
- Al cerrar sesión se da de baja el dispositivo.

**Viabilidad.** M. Backend en `back-lamelas` → `PUSH-PWA-01`. Sin variables
nuevas en Vercel (la clave pública se pide a la API).

- Si eligió solo push y el aviso no llega, a los 10 minutos sale el correo
  igual (respaldo); en Configuración → Correos aparece como "No hizo falta"
  cuando el push sí llegó.

**Estado.** Implementado en `dev` el 2026-11-04, sin commitear ni verificar.
Archivos: `src/app/manifest.ts`, `public/sw.js`, `public/icons/`,
`src/lib/pwa.ts`, `src/components/pwa/`, `src/actions/push.ts`,
`(app)/perfil/page.tsx`, `actions/auth.ts` (baja al salir),
`nav/nav-user.tsx`, `middleware.ts`, `next.config.ts`, `app/layout.tsx`.

## MAIL-FALLBACK-01 — proveedor y cupo en Configuración → Correos

**Qué es.** Parte de panel del respaldo Resend → Brevo (detalle en
`back-lamelas/docs/features.md` → `MAIL-FALLBACK-01`): mostrar por qué
proveedor salió cada correo y cuánto cupo de Resend queda en el día UTC y en
el mes. Opción de forzar Brevo en "Probar correo" de Equipo.

**Estado.** Pendiente, depende del backend.

## TEMA-UI-01 — tema nuevo y micro-interacciones

**Qué es.** Pedido de Cacho (2026-11-07): reemplazar el tema por el de tweakcn
`cmnl3tsn3000204l3ff39foko` y que la UI se sienta más suave y moderna.

**Cómo.**
- `src/app/globals.css`: tokens del tema (claro y `.dark`, sin selector todavía),
  radios 0.5rem en lugar de los bordes rectos, sombras del tema. Se conservan
  los tokens propios (warning, info, badges de estado de propiedad y consulta).
  Las saturaciones > 100% que exporta tweakcn se normalizaron a 100%.
- `tw-animate-css` estaba instalado pero no se importaba: diálogos, menús,
  tooltips y el cajón aparecían de golpe. Ahora se importa.
- Micro-interacciones en `globals.css` (capa `components`, sobre los
  `data-slot` de shadcn, sin editar `components/ui/`): botón que se hunde al
  presionar, sombra de color en hover, transiciones con curva suave (200 ms),
  clase `tarjeta-interactiva`, entrada de cada pantalla
  (`src/app/(app)/template.tsx`). Todo respeta `prefers-reduced-motion`.
- Paneles, avisos y estados vacíos redondeados en todas las pantallas.
- JetBrains Mono por `next/font`; `themeColor` del navegador y del manifiesto
  en `#00857A`.

**Pendiente de decidir.** El logo y los íconos de la app siguen en el verde
original. `lamelas-web` mantiene su identidad (no se tocó).

**Estado.** En `dev`, sin verificar.

## MOBILE-UI-01 — versión mobile más simple de navegar

**Qué es.** Pedido de Cacho (2026-11-07): que el panel sea más amigable en el
celular.

**Cómo.**
- **Barra inferior** (`components/nav/barra-inferior.tsx`, < md): Inicio,
  Propiedades, "+" (panel con Nueva propiedad / consulta / captación),
  Consultas con el contador de sin tomar, y Menú (abre el cajón). Se oculta en
  los formularios de alta y edición (`OCULTA_EN`). El encabezado muestra la
  marca en lugar de la hamburguesa.
- **Filtros** de Propiedades y Consultas con `components/filtros-plegables.tsx`:
  búsqueda a la vista, botón "Filtros" con la cantidad aplicada, panel inferior
  con selects grandes, "Limpiar" y "Ver resultados".
- **Toque:** en pantallas táctiles botones y campos de 44px y campos en 16px
  (iOS no hace zoom al enfocar).
- **Formularios:** el botón de guardar de propiedad queda fijo abajo (como en
  captaciones). `viewportFit: "cover"` + `env(safe-area-inset-bottom)` en todo
  lo fijo abajo.
- **Listados:** la vista Tabla/Cards funciona igual que en escritorio (decisión
  de Cacho, 2026-11-08: no forzar tarjetas); la tabla se desplaza hacia el
  costado. En Cards, la tarjeta de propiedad es horizontal (foto chica a la
  izquierda). Las etiquetas de la consulta bajan de línea y "Cargar consulta"
  se oculta (está en el "+").

**Estado.** En `dev`, revisado en simulación de 390px con datos locales;
falta probar en un celular real.

## FOTOS-ORDEN-01 — reordenar fotos arrastrándolas

**Qué es.** En el administrador de fotos, cambiar el orden arrastrando cada
foto (escritorio) y con flechas ← → (celular, donde el arrastre nativo del
navegador no funciona). El orden se usa en la galería del panel y del sitio.

**Ventaja.** Hoy el orden lo define la subida; para cambiarlo hay que borrar y
volver a subir.

**Viabilidad.** S, **solo panel**: `back-lamelas` ya expone
`PATCH /v1/properties/:id/images/order` (`images.reorder`). Falta la action en
`src/actions/images.ts` y la UI en `photo-manager.tsx`. Referencia directa:
`ubikka/app-dashboard/src/components/properties/photo-manager.tsx` (arrastre
HTML5 + flechas, sin librerías nuevas, guarda el orden completo de una vez).

**Estado.** Pedido por Cacho el 2026-11-08.

## TEMA-OSCURO-01 — modo claro / oscuro / sistema

**Qué es.** Botón en la barra superior (o en el menú de la cuenta) para elegir
claro, oscuro o el del sistema; la preferencia queda en el navegador.

**Ventaja.** Uso cómodo de noche y en el celular; el tema de `TEMA-UI-01` ya
trae la paleta oscura.

**Viabilidad.** S/M.
- La paleta `.dark` ya está en `globals.css`; falta el selector y aplicar la
  clase `dark` sin parpadeo al cargar.
- Cubiko lo resuelve con `next-themes` (`theme-provider.tsx` +
  `nav/theme-switcher.tsx`). Es una **dependencia nueva**: alternativa sin
  dependencias = cookie + script inline en `layout.tsx`.
- Lo que más trabajo da: repasar colores fijos que no siguen el tema (badges de
  estado en hex, avisos `bg-amber-50`, gráficos de analíticas, botones de
  WhatsApp, impresión del reporte que debe salir siempre clara).

**Estado.** Pedido por Cacho el 2026-11-08. Falta elegir `next-themes` o la
opción sin dependencias.

